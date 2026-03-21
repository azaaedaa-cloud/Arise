import { db } from '../../firebase';
import { doc, runTransaction, Timestamp } from 'firebase/firestore';

/**
 * @description Cryptographic Collision Prevention Service.
 * Ensures that retry logic from unstable clients never results in duplicate financial transactions.
 * We store the SHA-256 hashed key in a dedicated `idempotency_keys` collection.
 */
export class IdempotencyService {
  private static COLLECTION = 'idempotency_keys';

  /**
   * @description Checks and locks the idempotency key.
   * If the key already exists, it throws a Conflict error.
   * If not, it creates a record with a TTL.
   */
  static async checkAndLock(key: string, userId: string): Promise<boolean> {
    const keyRef = doc(db, this.COLLECTION, `${userId}_${key}`);

    return await runTransaction(db, async (transaction) => {
      const keyDoc = await transaction.get(keyRef);

      if (keyDoc.exists()) {
        const data = keyDoc.data();
        // If the key is already processed, we return false to indicate a duplicate
        if (data.status === 'processed') {
          throw new Error('IDEMPOTENCY_CONFLICT: Transaction already processed');
        }
        // If it's still processing, we throw a different error
        throw new Error('IDEMPOTENCY_PENDING: Transaction currently in progress');
      }

      // Lock the key for 1 hour
      transaction.set(keyRef, {
        userId,
        status: 'processing',
        createdAt: Timestamp.now(),
        expiresAt: Timestamp.fromDate(new Date(Date.now() + 3600000)), // 1 hour TTL
      });

      return true;
    });
  }

  /**
   * @description Marks the idempotency key as successfully processed.
   */
  static async markAsProcessed(key: string, userId: string, result: any): Promise<void> {
    const keyRef = doc(db, this.COLLECTION, `${userId}_${key}`);
    await runTransaction(db, async (transaction) => {
      transaction.update(keyRef, {
        status: 'processed',
        result,
        processedAt: Timestamp.now(),
      });
    });
  }
}
