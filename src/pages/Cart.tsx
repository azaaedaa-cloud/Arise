import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'motion/react';
import { Trash2, ShoppingBag, ArrowRight, Shield, Zap, CreditCard, Minus, Plus, Crown } from 'lucide-react';
import { auth } from '../firebase';
import { OrderItem } from '../types';
import { useAppContext } from '../contexts/AppContext';

export default function Cart() {
  const { t, removeFromCart, updateQuantity } = useAppContext();
  const [cartItems, setCartItems] = useState<OrderItem[]>([]);
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const refreshLocalCart = () => {
    const savedCart = localStorage.getItem('luxe_cart');
    if (savedCart) {
      setCartItems(JSON.parse(savedCart));
    } else {
      setCartItems([]);
    }
  };

  useEffect(() => {
    refreshLocalCart();
  }, []);

  const handleUpdateQuantity = (id: string, delta: number) => {
    updateQuantity(id, delta);
    refreshLocalCart();
  };

  const handleRemoveItem = (id: string) => {
    removeFromCart(id);
    refreshLocalCart();
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
      // Generate a unique idempotency key for this transaction attempt
      const idempotencyKey = `checkout_${auth.currentUser.uid}_${Date.now()}`;

      // 1. Create the order in OMS (Order Management System)
      // This locks inventory and creates a 'pending' order record.
      const omsResponse = await fetch('/api/oms/checkout', {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${await auth.currentUser.getIdToken()}`
        },
        body: JSON.stringify({
          items: cartItems.map(item => ({
            bookId: item.bookId,
            quantity: item.quantity,
            priceAtPurchase: item.price
          })),
          idempotencyKey
        })
      });

      const omsData = await omsResponse.json();
      if (!omsResponse.ok) throw new Error(omsData.error || "OMS Checkout failed");
      
      const { data: { orderId } } = omsData;

      // 2. Create Stripe Checkout Session
      const stripeResponse = await fetch('/api/create-checkout-session', {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${await auth.currentUser.getIdToken()}`
        },
        body: JSON.stringify({ 
          items: cartItems,
          userId: auth.currentUser.uid,
          idempotencyKey,
          orderId,
          success_url: `${window.location.origin}/success`,
          cancel_url: `${window.location.origin}/cart`
        })
      });
      
      const { url, error } = await stripeResponse.json();
      
      if (error) throw new Error(error);
      if (!url) throw new Error("Failed to create checkout session");

      window.location.href = url;
    } catch (error: any) {
      console.error("Checkout Error:", error);
      alert(error.message || "Elite transaction failed. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-luxury-black pt-24 md:pt-32 pb-20 px-4 md:px-6">
      <div className="container mx-auto">
        <div className="mb-12 md:mb-20">
          <h4 className="text-[10px] md:text-[11px] font-bold uppercase tracking-[0.4em] text-gold mb-4 md:mb-6 font-accent">Your Selection</h4>
          <h1 className="text-4xl md:text-6xl font-display tracking-tight leading-tight">
            THE <span className="gold-text">COLLECTION</span> <br />
            CURATED.
          </h1>
        </div>

        {cartItems.length > 0 ? (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-16">
            {/* Cart Items */}
            <div className="lg:col-span-8 space-y-6 md:space-y-8">
              <AnimatePresence mode="popLayout">
                {cartItems.map((item) => (
                  <motion.div 
                    key={item.bookId}
                    layout
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: -20 }}
                    className="luxury-card p-6 md:p-10 flex flex-col sm:flex-row items-center gap-6 md:gap-10 group"
                  >
                    <div className="w-24 h-36 md:w-32 md:h-48 overflow-hidden border border-white/5 group-hover:border-gold transition-all flex-shrink-0">
                      <img 
                        src={item.coverImage || `https://picsum.photos/seed/${item.bookId}/100/150`} 
                        className="w-full h-full object-cover grayscale group-hover:grayscale-0 transition-all duration-700"
                        referrerPolicy="no-referrer"
                      />
                    </div>
                    
                    <div className="flex-grow text-center sm:text-left w-full">
                      <h3 className="text-xl md:text-2xl font-display mb-2 group-hover:text-gold transition-colors">{item.title}</h3>
                      <div className="text-gold font-display text-lg md:text-xl mb-6 md:mb-8">${item.price}</div>
                      
                      <div className="flex flex-col sm:flex-row items-center justify-center sm:justify-start gap-6 md:gap-8">
                        <div className="flex items-center border border-white/10 p-1">
                          <button onClick={() => handleUpdateQuantity(item.bookId, -1)} className="w-8 h-8 md:w-10 md:h-10 flex items-center justify-center hover:bg-white/5 transition-colors text-luxury-accent hover:text-white"><Minus className="w-3 h-3 md:w-3.5 md:h-3.5" /></button>
                          <span className="w-8 md:w-10 text-center text-xs md:text-sm font-bold font-accent">{item.quantity}</span>
                          <button onClick={() => handleUpdateQuantity(item.bookId, 1)} className="w-8 h-8 md:w-10 md:h-10 flex items-center justify-center hover:bg-white/5 transition-colors text-luxury-accent hover:text-white"><Plus className="w-3 h-3 md:w-3.5 md:h-3.5" /></button>
                        </div>
                        <button onClick={() => handleRemoveItem(item.bookId)} className="text-luxury-accent hover:text-red-500 transition-colors flex items-center gap-2 text-[9px] md:text-[10px] font-bold uppercase tracking-widest font-accent">
                          <Trash2 className="w-3.5 h-3.5 md:w-4 md:h-4" />
                          <span>Remove</span>
                        </button>
                      </div>
                    </div>
                    
                    <div className="text-2xl md:text-3xl font-display text-white mt-4 sm:mt-0">
                      ${(item.price * item.quantity).toFixed(2)}
                    </div>
                  </motion.div>
                ))}
              </AnimatePresence>
            </div>

            {/* Summary */}
            <div className="lg:col-span-4">
              <div className="luxury-card p-8 md:p-12 sticky top-32">
                <h2 className="text-[10px] md:text-[11px] font-bold mb-8 md:mb-12 text-gold uppercase tracking-[0.3em] font-accent">Summary</h2>
                
                <div className="space-y-4 md:space-y-6 mb-8 md:mb-12">
                  <div className="flex justify-between text-luxury-accent text-[10px] md:text-sm font-light tracking-widest uppercase">
                    <span>Subtotal</span>
                    <span className="text-white font-bold">${subtotal.toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between text-luxury-accent text-[10px] md:text-sm font-light tracking-widest uppercase">
                    <span>Elite Shipping</span>
                    <span className="text-white font-bold">{shipping === 0 ? 'FREE' : `$${shipping.toFixed(2)}`}</span>
                  </div>
                  <div className="pt-6 md:pt-8 border-t border-white/5 flex justify-between items-center">
                    <span className="text-[9px] md:text-[11px] font-bold uppercase tracking-[0.2em] md:tracking-[0.3em] font-accent">Total Investment</span>
                    <span className="text-2xl md:text-3xl font-display text-gold">${total.toFixed(2)}</span>
                  </div>
                </div>

                <div className="space-y-4 mb-12">
                  <div className="flex items-center gap-4 text-[10px] text-luxury-accent uppercase tracking-[0.2em] font-accent">
                    <Shield size={16} className="text-gold" />
                    <span>Secure Elite Checkout</span>
                  </div>
                  <div className="flex items-center gap-4 text-[10px] text-luxury-accent uppercase tracking-[0.2em] font-accent">
                    <Zap size={16} className="text-gold" />
                    <span>Instant Digital Delivery</span>
                  </div>
                </div>

                <button 
                  onClick={handleCheckout}
                  disabled={loading}
                  className="btn-luxury w-full py-5 flex items-center justify-center gap-4 mb-8 group"
                >
                  {loading ? (
                    <div className="w-5 h-5 border-2 border-black border-t-transparent rounded-full animate-spin" />
                  ) : (
                    <>
                      <CreditCard size={20} />
                      <span className="text-[11px] font-bold uppercase tracking-[0.4em]">Complete Acquisition</span>
                    </>
                  )}
                </button>
                
                <Link to="/catalog" className="flex items-center justify-center gap-3 text-luxury-accent hover:text-gold transition-all text-[10px] font-bold uppercase tracking-[0.3em] font-accent group">
                  Continue Exploring <ArrowRight size={14} className="group-hover:translate-x-2 transition-transform" />
                </Link>
              </div>
            </div>
          </div>
        ) : (
          <div className="text-center py-40 luxury-card border-dashed">
            <div className="w-24 h-24 border border-white/5 flex items-center justify-center mx-auto mb-10 text-gold/20">
              <ShoppingBag size={48} />
            </div>
            <h2 className="text-4xl font-display mb-6">Your collection is empty</h2>
            <p className="text-luxury-accent mb-12 max-w-md mx-auto text-lg italic font-light">
              "A library is a reflection of the soul. Begin your elite literary journey today."
            </p>
            <Link to="/catalog" className="btn-luxury px-16 py-5 inline-block text-[11px] font-bold uppercase tracking-[0.4em]">Explore Catalog</Link>
          </div>
        )}
      </div>
    </div>
  );
}
