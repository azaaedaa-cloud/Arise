import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'motion/react';
import { Trash2, ShoppingBag, ArrowRight, Shield, Zap, CreditCard, Minus, Plus } from 'lucide-react';
import { auth, db } from '../firebase';
import { collection, addDoc } from 'firebase/firestore';
import { OrderItem } from '../types';

export default function Cart() {
  const [cartItems, setCartItems] = useState<OrderItem[]>([]);
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  // Mock cart items for demo if empty
  useEffect(() => {
    const savedCart = localStorage.getItem('luxe_cart');
    if (savedCart) {
      setCartItems(JSON.parse(savedCart));
    }
  }, []);

  const updateQuantity = (id: string, delta: number) => {
    const newCart = cartItems.map(item => {
      if (item.bookId === id) {
        return { ...item, quantity: Math.max(1, item.quantity + delta) };
      }
      return item;
    });
    setCartItems(newCart);
    localStorage.setItem('luxe_cart', JSON.stringify(newCart));
  };

  const removeItem = (id: string) => {
    const newCart = cartItems.filter(item => item.bookId !== id);
    setCartItems(newCart);
    localStorage.setItem('luxe_cart', JSON.stringify(newCart));
  };

  const subtotal = cartItems.reduce((sum, item) => sum + (item.price * item.quantity), 0);
  const shipping = subtotal > 100 ? 0 : 15;
  const total = subtotal + shipping;

  const handleCheckout = async () => {
    if (!auth.currentUser) {
      navigate('/auth');
      return;
    }
    
    setLoading(true);
    try {
      // 1. Create Payment Intent via our backend
      const response = await fetch('/api/create-payment-intent', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ amount: total, items: cartItems })
      });
      
      const { clientSecret } = await response.json();
      
      if (!clientSecret) throw new Error("Failed to create payment intent");

      // In a real app, we would use Stripe Elements here.
      // For this demo, we'll simulate a successful payment and create the order.
      
      const orderData = {
        userId: auth.currentUser.uid,
        items: cartItems,
        totalAmount: total,
        status: 'paid',
        createdAt: new Date().toISOString()
      };
      
      await addDoc(collection(db, 'orders'), orderData);
      
      // Clear cart
      localStorage.removeItem('luxe_cart');
      setCartItems([]);
      
      alert("Elite purchase successful! Your order is being prepared.");
      navigate('/profile');
    } catch (error) {
      console.error("Checkout Error:", error);
      alert("Elite transaction failed. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-6 py-20">
      <h1 className="text-5xl font-bold tracking-tighter mb-16">YOUR <span className="text-gold">COLLECTION</span></h1>

      {cartItems.length > 0 ? (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-12">
          {/* Cart Items */}
          <div className="lg:col-span-2 space-y-6">
            <AnimatePresence mode="popLayout">
              {cartItems.map((item) => (
                <motion.div 
                  key={item.bookId}
                  layout
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -20 }}
                  className="glass p-6 rounded-3xl flex flex-col sm:flex-row items-center gap-6 border-white/5 group"
                >
                  <img 
                    src={item.coverImage || `https://picsum.photos/seed/${item.bookId}/100/150`} 
                    className="w-24 h-36 object-cover rounded-xl shadow-xl"
                    referrerPolicy="no-referrer"
                  />
                  <div className="flex-grow text-center sm:text-left">
                    <h3 className="text-xl font-bold mb-1 group-hover:text-gold transition-colors">{item.title}</h3>
                    <div className="text-gold font-bold mb-4">${item.price}</div>
                    <div className="flex items-center justify-center sm:justify-start gap-4">
                      <div className="flex items-center glass rounded-xl p-1">
                        <button onClick={() => updateQuantity(item.bookId, -1)} className="w-8 h-8 flex items-center justify-center hover:bg-white/10 rounded-lg transition-colors"><Minus size={14} /></button>
                        <span className="w-8 text-center text-sm font-bold">{item.quantity}</span>
                        <button onClick={() => updateQuantity(item.bookId, 1)} className="w-8 h-8 flex items-center justify-center hover:bg-white/10 rounded-lg transition-colors"><Plus size={14} /></button>
                      </div>
                      <button onClick={() => removeItem(item.bookId)} className="p-2 text-luxury-accent hover:text-red-500 transition-colors">
                        <Trash2 size={18} />
                      </button>
                    </div>
                  </div>
                  <div className="text-2xl font-bold text-white">
                    ${(item.price * item.quantity).toFixed(2)}
                  </div>
                </motion.div>
              ))}
            </AnimatePresence>
          </div>

          {/* Summary */}
          <div className="lg:col-span-1">
            <div className="glass p-8 rounded-[2.5rem] border-gold/10 sticky top-32">
              <h2 className="text-2xl font-bold mb-8">Order Summary</h2>
              
              <div className="space-y-4 mb-8">
                <div className="flex justify-between text-luxury-accent">
                  <span>Subtotal</span>
                  <span className="text-white font-bold">${subtotal.toFixed(2)}</span>
                </div>
                <div className="flex justify-between text-luxury-accent">
                  <span>Elite Shipping</span>
                  <span className="text-white font-bold">{shipping === 0 ? 'FREE' : `$${shipping.toFixed(2)}`}</span>
                </div>
                <div className="pt-4 border-t border-white/5 flex justify-between text-xl font-bold">
                  <span>Total</span>
                  <span className="text-gold">${total.toFixed(2)}</span>
                </div>
              </div>

              <div className="space-y-4 mb-8">
                <div className="flex items-center gap-3 text-xs text-luxury-accent uppercase tracking-widest font-bold">
                  <Shield size={14} className="text-gold" />
                  Secure Elite Checkout
                </div>
                <div className="flex items-center gap-3 text-xs text-luxury-accent uppercase tracking-widest font-bold">
                  <Zap size={14} className="text-gold" />
                  Instant Digital Delivery
                </div>
              </div>

              <button 
                onClick={handleCheckout}
                disabled={loading}
                className="btn-gold w-full py-4 flex items-center justify-center gap-2 mb-4"
              >
                {loading ? (
                  <div className="w-5 h-5 border-2 border-luxury-black border-t-transparent rounded-full animate-spin" />
                ) : (
                  <>
                    <CreditCard size={20} />
                    Complete Purchase
                  </>
                )}
              </button>
              
              <Link to="/catalog" className="flex items-center justify-center gap-2 text-luxury-accent hover:text-gold transition-colors text-sm font-bold">
                Continue Exploring <ArrowRight size={14} />
              </Link>
            </div>
          </div>
        </div>
      ) : (
        <div className="text-center py-40 glass rounded-[3rem] border-dashed border-white/10">
          <ShoppingBag className="mx-auto mb-8 text-luxury-accent opacity-20" size={80} />
          <h2 className="text-3xl font-bold mb-4">Your collection is empty</h2>
          <p className="text-luxury-accent mb-12 max-w-md mx-auto">
            Start your elite literary journey by exploring our curated catalog of masterpieces.
          </p>
          <Link to="/catalog" className="btn-gold px-12">Explore Catalog</Link>
        </div>
      )}
    </div>
  );
}
