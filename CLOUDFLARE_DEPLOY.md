# Cloudflare Pages Deployment Guide for DMN Chat

## Automatic Deployment Setup

DMN Chat is configured for automatic deployment to Cloudflare Pages.

> ⚠️ **Important**: Do NOT add a `wrangler.toml` file to this repository. Environment variables must be configured in the Cloudflare Pages dashboard.

## Cloudflare Pages Configuration

When connecting this repository to Cloudflare Pages, use these settings:

**Build Configuration:**

- **Framework preset**: `None` (or leave blank)
- **Build command**: `npm run build`
- **Build output directory**: `dist`
- **Root directory**: `frontend`
- **Node version**: `20`

## Environment Variables

Firebase credentials must be set in the **Cloudflare Pages dashboard** (not in code):

1. Go to Cloudflare Dashboard → Pages → Your Project → Settings → Environment variables
2. Add these variables for **Production** (and optionally Preview):
   - `VITE_FIREBASE_API_KEY`
   - `VITE_FIREBASE_AUTH_DOMAIN`
   - `VITE_FIREBASE_PROJECT_ID`
   - `VITE_FIREBASE_STORAGE_BUCKET`
   - `VITE_FIREBASE_MESSAGING_SENDER_ID`
   - `VITE_FIREBASE_APP_ID`
   - `VITE_FIREBASE_MEASUREMENT_ID` (optional - for Analytics)
   - `VITE_SENTRY_DSN` (optional - for error tracking)
3. Trigger a new deployment after setting variables

### Why Environment Variables Must Be Set in Cloudflare

**Cloudflare Pages environment variables are injected at BUILD TIME, not runtime.**

This means:

1. You **must set all variables BEFORE triggering a build**
2. After adding/changing variables, you **must trigger a new deployment**
3. Variables are baked into the JavaScript bundle during the build process

The `frontend/vite.config.ts` is configured to read environment variables from:

1. `process.env` (Cloudflare Pages dashboard variables during build)
2. `.env.local` file (local development only)

## Custom Domain Setup

1. In Cloudflare Pages dashboard, go to your project
2. Navigate to **Custom domains**
3. Add your custom domain (e.g., `dmnchat.claimfreedom.org`)
4. Cloudflare will automatically configure DNS if the domain is on Cloudflare

## Deployment Workflow

Once connected:

1. Push to `main` branch → Automatic production deployment
2. Push to other branches → Preview deployments with unique URLs

## Build Verification

Test locally before deploying:

```bash
cd frontend
npm run build
npm run preview
```

Visit `http://localhost:4173` to verify the production build.

## Troubleshooting

**Build fails:**

- Check Node.js version is 20
- Verify all dependencies are in `frontend/package.json`
- Check that environment variables are set in Cloudflare dashboard

**Environment variables not working:**

- Ensure variables are prefixed with `VITE_`
- Trigger a new deployment after adding/changing variables
- Check build logs to see which variables were detected

**Firebase connection errors:**

- Verify Firebase config in Cloudflare dashboard matches your Firebase project
- Check that Firebase project has the correct services enabled (Auth, Firestore, Storage)

## Firebase Backend Deployment

The backend (Cloud Functions, Firestore, Storage) is deployed separately:

```bash
# From project root
firebase deploy

# Deploy only functions
firebase deploy --only functions

# Deploy only Firestore rules
firebase deploy --only firestore:rules

# Deploy only Storage rules
firebase deploy --only storage:rules
```

## Required Firebase Setup

1. Create Firebase project at [console.firebase.google.com](https://console.firebase.google.com/)
2. Enable Firebase Authentication (Email/Password)
3. Enable Cloud Firestore
4. Enable Cloud Storage
5. Set up Firebase Functions (Node.js 20)
6. Configure Gemini API key as secret:

   ```bash
   firebase functions:secrets:set GEMINI_API_KEY
   ```

7. (Optional) Configure GitHub token for private repos:

   ```bash
   firebase functions:secrets:set GITHUB_TOKEN
   ```

## Security Notes

- Never commit API keys or credentials to the repository
- Use Firebase Secret Manager for sensitive Cloud Function environment variables
- Use Cloudflare Pages dashboard for frontend environment variables
- All secrets are excluded by `.gitignore`

## Cost Considerations

**Cloudflare Pages:**

- Free tier: Unlimited requests, unlimited bandwidth
- 500 builds per month on free tier

**Firebase:**

- Spark Plan (Free): Good for development
- Blaze Plan (Pay-as-you-go): Required for Cloud Functions
  - Functions: ~$0.40 per million invocations
  - Firestore: Read/write operations charged
  - Storage: Minimal costs for RAG cache

## Monitoring

- **Cloudflare**: View build logs and deployment history in dashboard
- **Firebase**: Use Firebase Console for function logs, Firestore usage, and errors
- **Sentry** (optional): Set `VITE_SENTRY_DSN` for frontend error tracking

---

> **Built with ❤️ for the journey of awakening**
