/**
 * Index Repository Cloud Function
 *
 * Fetches a GitHub repository, chunks content, generates embeddings,
 * and stores in Firestore for RAG retrieval
 */

import { onCall, HttpsError } from "firebase-functions/v2/https";
import { logger } from "firebase-functions/v2";
import { defineSecret } from "firebase-functions/params";
import { getFirestore, FieldValue } from "firebase-admin/firestore";

const githubToken = defineSecret("GITHUB_TOKEN");
const geminiApiKey = defineSecret("GEMINI_API_KEY");

interface IndexRepositoryData {
  sourceId: string;
  repoUrl: string;
  branch?: string;
}

interface GitHubFile {
  path: string;
  type: string;
  size: number;
  download_url: string;
  sha: string;
}

const ALLOWED_EXTENSIONS = [
  ".md"  // Only markdown files
];

const IGNORED_DIRS = [
  "node_modules", ".git", "dist", "build", "__pycache__",
  "venv", ".venv", "vendor", "target", ".next"
];

const MAX_FILE_SIZE = 500000; // 500KB

/**
 * Parse GitHub URL to extract owner and repo
 */
function parseGitHubUrl(url: string): { owner: string; repo: string } | null {
  const match = url.match(/github\.com\/([^\/]+)\/([^\/\.]+)/);
  if (match) {
    return { owner: match[1], repo: match[2].replace(".git", "") };
  }
  return null;
}

/**
 * Fetch file tree from GitHub API
 */
async function fetchGitHubTree(
  owner: string,
  repo: string,
  branch: string,
  token?: string
): Promise<GitHubFile[]> {
  const headers: Record<string, string> = {
    "Accept": "application/vnd.github+json",
    "X-GitHub-Api-Version": "2022-11-28"
  };

  if (token) {
    headers["Authorization"] = `Bearer ${token}`;
  }

  // Get the tree SHA for the branch
  const branchUrl = `https://api.github.com/repos/${owner}/${repo}/git/trees/${branch}?recursive=1`;

  const response = await fetch(branchUrl, { headers });

  if (!response.ok) {
    const errorText = await response.text();
    logger.error("GitHub API error:", { status: response.status, error: errorText });
    throw new Error(`GitHub API error: ${response.status}`);
  }

  const data = await response.json();
  return data.tree || [];
}

/**
 * Filter files based on extension and size
 */
function filterFiles(files: GitHubFile[]): GitHubFile[] {
  return files.filter(file => {
    // Only files, not directories
    if (file.type !== "blob") return false;

    // Check size
    if (file.size > MAX_FILE_SIZE) return false;

    // Check if in ignored directory
    const pathParts = file.path.split("/");
    if (pathParts.some(part => IGNORED_DIRS.includes(part))) return false;

    // Check extension
    const hasAllowedExt = ALLOWED_EXTENSIONS.some(ext => file.path.endsWith(ext));
    return hasAllowedExt;
  });
}

/**
 * Get download URL for a file (construct if missing from API response)
 */
function getDownloadUrl(file: GitHubFile, owner: string, repo: string, branch: string): string {
  if (file.download_url) {
    return file.download_url;
  }
  // Construct raw GitHub URL when download_url is missing
  return `https://raw.githubusercontent.com/${owner}/${repo}/${branch}/${file.path}`;
}

/**
 * Download file content from GitHub
 */
async function downloadFileContent(url: string, token?: string): Promise<string> {
  const headers: Record<string, string> = {};
  if (token) {
    headers["Authorization"] = `Bearer ${token}`;
  }

  const response = await fetch(url, { headers });
  if (!response.ok) {
    throw new Error(`Failed to download file: ${response.status}`);
  }

  return await response.text();
}

/**
 * Chunk content into smaller pieces
 */
function chunkContent(content: string): string[] {
  const CHUNK_SIZE = 1500;
  const OVERLAP = 200;
  const chunks: string[] = [];
  let start = 0;

  while (start < content.length) {
    const end = Math.min(start + CHUNK_SIZE, content.length);
    let chunk = content.slice(start, end);

    // Try to break at paragraph or sentence boundary
    if (end < content.length) {
      const lastNewline = chunk.lastIndexOf("\n\n");
      const lastPeriod = chunk.lastIndexOf(". ");
      const breakPoint = Math.max(lastNewline, lastPeriod);

      if (breakPoint > CHUNK_SIZE * 0.5) {
        chunk = chunk.slice(0, breakPoint + 1);
        start += breakPoint + 1;
      } else {
        start = end;
      }
    } else {
      start = end;
    }

    if (chunk.trim().length > 100) {
      chunks.push(chunk.trim());
    }

    // Apply overlap
    if (start < content.length) {
      start = Math.max(0, start - OVERLAP);
    }
  }

  return chunks;
}

export const indexRepository = onCall<IndexRepositoryData>(
  {
    secrets: [githubToken, geminiApiKey],
    timeoutSeconds: 540, // 9 minutes max
    memory: "1GiB"
  },
  async (request) => {
    // Verify authentication
    if (!request.auth) {
      throw new HttpsError("unauthenticated", "Authentication required");
    }

    const db = getFirestore();

    // Admin check - verify user role in Firestore
    const userDoc = await db.collection("users").doc(request.auth.uid).get();

    if (!userDoc.exists || userDoc.data()?.role !== "admin") {
      throw new HttpsError("permission-denied", "Admin access required");
    }

    const { sourceId, repoUrl, branch = "main" } = request.data;

    if (!repoUrl || !sourceId) {
      throw new HttpsError("invalid-argument", "sourceId and repoUrl are required");
    }

    const sourceRef = db.collection("contextSources").doc(sourceId);

    try {
      // Update status to indexing
      await sourceRef.update({
        "status.state": "indexing",
        "status.progress": 0
      });

      logger.info("Starting repository indexing", { sourceId, repoUrl, branch });

      // Clear existing chunks for this source (if re-indexing)
      logger.info("Clearing old chunks for source", { sourceId });
      const oldChunksQuery = db.collection("chunks").where("sourceId", "==", sourceId);
      const oldChunksSnapshot = await oldChunksQuery.get();

      if (!oldChunksSnapshot.empty) {
        const deleteBatch = db.batch();
        oldChunksSnapshot.docs.forEach(doc => {
          deleteBatch.delete(doc.ref);
        });
        await deleteBatch.commit();
        logger.info(`Deleted ${oldChunksSnapshot.size} old chunks`);
      }

      // Parse GitHub URL
      const parsed = parseGitHubUrl(repoUrl);
      if (!parsed) {
        throw new Error("Invalid GitHub URL");
      }

      const { owner, repo } = parsed;

      // Fetch file tree
      const token = githubToken.value();
      const allFiles = await fetchGitHubTree(owner, repo, branch, token);

      logger.info(`Fetched ${allFiles.length} files from GitHub tree`);

      await sourceRef.update({
        "status.progress": 10
      });

      // Filter relevant files
      const relevantFiles = filterFiles(allFiles);
      logger.info(`Found ${relevantFiles.length} relevant files out of ${allFiles.length} total`);

      // Log first few file paths for debugging
      if (relevantFiles.length > 0) {
        logger.info("Sample relevant files:", relevantFiles.slice(0, 5).map(f => f.path));
      } else {
        logger.warn("No relevant files found. Sample of all files:", allFiles.slice(0, 10).map(f => ({ path: f.path, type: f.type, size: f.size })));
      }

      if (relevantFiles.length === 0) {
        throw new Error("No relevant files found in repository");
      }

      await sourceRef.update({
        "status.progress": 20
      });

      // Process files in batches
      const BATCH_SIZE = 10;
      let processedFiles = 0;
      let totalChunks = 0;

      for (let i = 0; i < relevantFiles.length; i += BATCH_SIZE) {
        const batch = relevantFiles.slice(i, i + BATCH_SIZE);

        // Download and chunk files
        const fileContents = await Promise.all(
          batch.map(async (file) => {
            try {
              const downloadUrl = getDownloadUrl(file, owner, repo, branch);
              const content = await downloadFileContent(downloadUrl, token);
              const chunks = chunkContent(content);
              logger.info(`File ${file.path}: ${content.length} bytes, ${chunks.length} chunks`);
              return { file, chunks };
            } catch (error) {
              logger.error(`Error processing file ${file.path}:`, error);
              return { file, chunks: [] };
            }
          })
        );

        // Store chunks in Firestore
        const chunksCollection = db.collection("chunks");
        const writeBatch = db.batch();
        let batchChunkCount = 0;

        for (const { file, chunks } of fileContents) {
          for (let chunkIndex = 0; chunkIndex < chunks.length; chunkIndex++) {
            const chunkRef = chunksCollection.doc();
            writeBatch.set(chunkRef, {
              sourceId,
              repoName: `${owner}/${repo}`,
              filePath: file.path,
              content: chunks[chunkIndex],
              chunkIndex,
              metadata: {
                language: detectLanguage(file.path),
                sha: file.sha
              },
              createdAt: FieldValue.serverTimestamp()
            });
            totalChunks++;
            batchChunkCount++;
          }
        }

        if (batchChunkCount > 0) {
          await writeBatch.commit();
          logger.info(`Committed batch with ${batchChunkCount} chunks`);
        } else {
          logger.warn(`Batch ${i / BATCH_SIZE + 1} has no chunks to commit`);
        }
        processedFiles += batch.length;

        // Update progress
        const progress = 20 + Math.floor((processedFiles / relevantFiles.length) * 70);
        await sourceRef.update({
          "status.progress": progress
        });

        logger.info(`Processed ${processedFiles}/${relevantFiles.length} files, ${totalChunks} chunks`);
      }

      // Update final status
      await sourceRef.update({
        "status.state": "ready",
        "status.progress": 100,
        "status.lastSync": FieldValue.serverTimestamp(),
        "stats.fileCount": relevantFiles.length,
        "stats.chunkCount": totalChunks
      });

      logger.info("Repository indexing complete", {
        sourceId,
        fileCount: relevantFiles.length,
        chunkCount: totalChunks
      });

      return {
        success: true,
        fileCount: relevantFiles.length,
        chunkCount: totalChunks
      };

    } catch (error) {
      logger.error("Error indexing repository:", error);

      // Update status to error
      await sourceRef.update({
        "status.state": "error",
        "status.error": error instanceof Error ? error.message : "Unknown error"
      });

      throw new HttpsError(
        "internal",
        `Failed to index repository: ${error instanceof Error ? error.message : "Unknown error"}`
      );
    }
  }
);

/**
 * Detect programming language from file extension
 */
function detectLanguage(filePath: string): string {
  const ext = filePath.split(".").pop()?.toLowerCase();
  const languageMap: Record<string, string> = {
    "md": "markdown",
    "txt": "text",
    "py": "python",
    "js": "javascript",
    "ts": "typescript",
    "tsx": "typescript",
    "jsx": "javascript",
    "java": "java",
    "c": "c",
    "cpp": "cpp",
    "go": "go",
    "rs": "rust",
    "rb": "ruby",
    "php": "php",
    "swift": "swift",
    "kt": "kotlin",
    "html": "html",
    "css": "css",
    "json": "json",
    "yaml": "yaml",
    "yml": "yaml"
  };
  return languageMap[ext || ""] || "unknown";
}
