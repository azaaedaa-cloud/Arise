export interface Book {
  id: string;
  title: string;
  author: string;
  description: string;
  price: number;
  category: string;
  coverImage: string;
  rating: number;
  reviewCount: number;
  stock: number;
  isDigital: boolean;
  pdfUrl?: string;
  tier: 'poverty' | 'growth' | 'wealth' | 'power';
}

export type UserRole = 'super_admin' | 'admin' | 'editor' | 'support' | 'user';

export interface UserPermissions {
  manageProducts: boolean;
  manageOrders: boolean;
  manageUsers: boolean;
  viewAnalytics: boolean;
}

export interface UserProfile {
  uid: string;
  email: string;
  displayName: string;
  photoURL?: string;
  role: UserRole;
  permissions?: UserPermissions;
  createdAt: string;
  wishlist: string[];
  purchasedBooks: string[]; // IDs of books the user has access to
}

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

export interface Review {
  id: string;
  bookId: string;
  userId: string;
  userName: string;
  rating: number;
  comment: string;
  createdAt: string;
}
