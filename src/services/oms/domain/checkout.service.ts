import { db, auth } from '../../../firebase';
import { 
  collection, 
  doc, 
  runTransaction, 
  Timestamp, 
  addDoc,
  getDoc,
  updateDoc
} from 'firebase/firestore';
import { CheckoutPayloadSchema, CheckoutPayload } from '../schemas/checkout.schema';
import { IdempotencyService } from './idempotency.service';
import { Book, Order } from '../../../types';

/**
 * @description The Order Management System (OMS) & Checkout Flow microservice.
 * We utilize a Firestore Transaction to ensure that inventory deduction is atomic and immune to race conditions.
 * If 100,000 users click "Buy" on the last 5 items simultaneously, the system must process exactly 5 and gracefully reject the rest.
 */
export class CheckoutService {
  /**
   * @description Processes the checkout with strict inventory locking and idempotency.
   */
  static async processCheckout(payload: CheckoutPayload, userId: string): Promise<{ orderId: string }> {
    // 1. Validate Payload (Hermetic Input Validation)
    const validatedData = CheckoutPayloadSchema.parse(payload);

    // 2. Check and Lock Idempotency Key (Cryptographic Collision Prevention)
    // This prevents duplicate charges and orders from network retries.
    await IdempotencyService.checkAndLock(validatedData.idempotencyKey, userId);

    try {
      // 3. Execute Atomic Transaction for Inventory Locking and Order Creation
      const result = await runTransaction(db, async (transaction) => {
        const bookRefs = validatedData.items.map(item => doc(db, 'books', item.bookId));
        const bookDocs = await Promise.all(bookRefs.map(ref => transaction.get(ref)));

        // Validate Inventory Availability (Race Condition Immunity)
        for (let i = 0; i < bookDocs.length; i++) {
          const bookDoc = bookDocs[i];
          const item = validatedData.items[i];

          if (!bookDoc.exists()) {
            throw new Error(`BOOK_NOT_FOUND: Masterpiece ${item.bookId} does not exist in the vault`);
          }

          const bookData = bookDoc.data() as Book;
          if (bookData.stock < item.quantity) {
            throw new Error(`INSUFFICIENT_INVENTORY: Masterpiece ${bookData.title} is sold out`);
          }

          // Deduct Inventory (ACID Validation)
          transaction.update(bookRefs[i], {
            stock: bookData.stock - item.quantity
          });
        }

        // 4. Create Order Record (Write Model)
        const orderRef = doc(collection(db, 'orders'));
        const orderData: Partial<Order> = {
          userId,
          items: validatedData.items.map(item => {
            const book = bookDocs.find(d => d.id === item.bookId)?.data() as Book;
            return {
              bookId: item.bookId,
              title: book.title,
              quantity: item.quantity,
              price: item.priceAtPurchase,
              coverImage: book.coverImage
            };
          }),
          totalAmount: validatedData.items.reduce((sum, item) => sum + (item.priceAtPurchase * item.quantity), 0),
          status: 'pending',
          createdAt: new Date().toISOString(),
        };

        transaction.set(orderRef, orderData);

        return { orderId: orderRef.id };
      });

      // 5. Mark Idempotency Key as Processed
      await IdempotencyService.markAsProcessed(validatedData.idempotencyKey, userId, result);

      // 6. Emit Event (Asynchronous Event Horizon)
      // We would emit a Pub/Sub event here for the Saga Pattern (e.g., trigger payment, send email)
      // await EventService.emit('order:created', { orderId: result.orderId, userId });

      return result;
    } catch (error) {
      // Compensating Transaction (Rollback)
      // In a distributed Saga, we would trigger rollbacks here if any step failed.
      // For Firestore Transactions, the transaction automatically rolls back if an error is thrown.
      console.error(`OMS_CHECKOUT_FAILURE: ${error instanceof Error ? error.message : 'Unknown error'}`);
      throw error;
    }
  }
}
