import express, { Request, Response } from 'express';
import { authMiddleware } from './middleware/auth.middleware';
import { validateMiddleware } from './middleware/validate.middleware';
import { CheckoutPayloadSchema } from './schemas/checkout.schema';
import { CheckoutService } from './domain/checkout.service';
import { auth } from '../firebase';

const router = express.Router();

/**
 * @description The Order Management System (OMS) & Checkout Flow microservice.
 * We utilize a Firestore Transaction to ensure that inventory deduction is atomic and immune to race conditions.
 * If 100,000 users click "Buy" on the last 5 items simultaneously, the system must process exactly 5 and gracefully reject the rest.
 */
router.post(
  '/checkout',
  authMiddleware,
  validateMiddleware(CheckoutPayloadSchema),
  async (req: Request, res: Response) => {
    try {
      // 1. Get the authenticated user ID (Strict IAM)
      const userId = auth.currentUser?.uid;
      if (!userId) {
        return res.status(401).json({ error: 'UNAUTHORIZED: User ID not found' });
      }

      // 2. Process the checkout with strict inventory locking and idempotency
      const result = await CheckoutService.processCheckout(req.body, userId);

      // 3. Return the result (CQRS: Separate the read models from the write models)
      // The client will then query the read model (e.g., the order document) for updates.
      return res.status(201).json({
        status: 'SUCCESS',
        message: 'Order created successfully. Inventory locked.',
        data: result
      });
    } catch (error) {
      // 4. Handle errors (Circuit Breaker Pattern)
      // We would implement a circuit breaker here for third-party APIs (like payment gateways)
      console.error(`OMS_CHECKOUT_FAILURE: ${error instanceof Error ? error.message : 'Unknown error'}`);
      
      if (error instanceof Error && error.message.includes('IDEMPOTENCY_CONFLICT')) {
        return res.status(409).json({ error: 'CONFLICT: Transaction already processed' });
      }

      if (error instanceof Error && error.message.includes('INSUFFICIENT_INVENTORY')) {
        return res.status(410).json({ error: 'GONE: Masterpiece is sold out' });
      }

      return res.status(500).json({ error: 'INTERNAL_SERVER_ERROR: Checkout process failed' });
    }
  }
);

export default router;
