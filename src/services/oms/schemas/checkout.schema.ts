import { z } from 'zod';

/**
 * @description Hermetic Input Validation for Checkout Payloads.
 * No field is optional unless explicitly stated.
 * We assume the client is trying to inject malicious data.
 */
export const CheckoutItemSchema = z.object({
  bookId: z.string().uuid({ message: "Invalid Masterpiece ID format" }),
  quantity: z.number().int().positive().max(5, { message: "Maximum 5 copies per elite member" }),
  priceAtPurchase: z.number().positive(),
});

export const CheckoutPayloadSchema = z.object({
  idempotencyKey: z.string().min(32, { message: "Cryptographic Idempotency Key required" }),
  items: z.array(CheckoutItemSchema).min(1, { message: "Vault cannot be empty" }),
  shippingAddress: z.object({
    fullName: z.string().min(3),
    street: z.string().min(5),
    city: z.string().min(2),
    country: z.string().min(2),
    postalCode: z.string().regex(/^[0-9A-Z\s-]+$/i),
  }),
  paymentMethodId: z.string().startsWith('pm_', { message: "Invalid Payment Method format" }),
});

export type CheckoutPayload = z.infer<typeof CheckoutPayloadSchema>;
