import { CheckoutPayload } from '../schemas/checkout.schema';

/**
 * @description Internal Domain Interfaces for the OMS microservice.
 */
export interface OrderItem {
  bookId: string;
  title: string;
  quantity: number;
  price: number;
  coverImage: string;
}

export interface Order {
  id: string;
  userId: string;
  items: OrderItem[];
  totalAmount: number;
  status: 'pending' | 'paid' | 'shipped' | 'delivered' | 'cancelled';
  paymentIntentId?: string;
  createdAt: string;
}

export interface IdempotencyRecord {
  userId: string;
  status: 'processing' | 'processed' | 'failed';
  result?: any;
  createdAt: string;
  processedAt?: string;
  expiresAt: string;
}
