/**
 * Add Context Source Cloud Function
 *
 * Adds a new context source (GitHub repository) to the system
 */

import { onCall, HttpsError } from 'firebase-functions/v2/https';
import * as admin from 'firebase-admin';

interface AddSourceData {
  type: 'github';
  config: {
    owner: string;
    repo: string;
    branch: string;
  };
}

export const addContextSource = onCall<AddSourceData>(
  async (request) => {
    // Admin check
    if (!request.auth || !request.auth.token.admin) {
      throw new HttpsError('permission-denied', 'Admin access required');
    }

    const { type, config } = request.data;

    if (type !== 'github') {
      throw new HttpsError('invalid-argument', 'Only github type is supported');
    }

    if (!config || !config.owner || !config.repo || !config.branch) {
      throw new HttpsError('invalid-argument', 'Invalid config');
    }

    // TODO: Create context source document
    // TODO: Trigger indexing

    return {
      sourceId: 'temp-id',
      status: 'pending'
    };
  }
);
