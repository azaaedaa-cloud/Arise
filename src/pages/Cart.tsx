import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'motion/react';
import { Trash2, ShoppingBag, ArrowRight, Shield, Zap, CreditCard, Minus, Plus, Crown } from 'lucide-react';
import { auth } from '../firebase';
import { OrderItem } from '../types';
import { useAppContext } from '../contexts/AppContext';

export default function Cart() {
  const { t } = useAppContext();
  const [cartItems, setCartItems] = useState<OrderItem[]>([]);
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

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
      const response = await fetch('/api/create-checkout-session', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          items: cartItems,
          userId: auth.currentUser.uid,
          success_url: `${window.location.origin}/success`,
          cancel_url: `${window.location.origin}/cart`
        })
      });
      
      const { url, error } = await response.json();
      
      if (error) throw new Error(error);
      if (!url) throw new Error("Failed to create checkout session");

      window.location.href = url;
    } catch (error) {
      console.error("Checkout Error:", error);
      alert("Elite transaction failed. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-luxury-black pt-32 pb-20 px-6">
      <div className="container mx-auto">
        <div className="mb-20">
          <h4 className="text-[11px] font-bold uppercase tracking-[0.4em] text-gold mb-6 font-accent">Your Selection</h4>
          <h1 className="text-6xl font-display tracking-tight leading-tight">
            THE <span className="gold-text">COLLECTION</span> <br />
            CURATED.
          </h1>
        </div>

        {cartItems.length > 0 ? (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-16">
            {/* Cart Items */}
            <div className="lg:col-span-8 space-y-8">
              <AnimatePresence mode="popLayout">
                {cartItems.map((item) => (
                  <motion.div 
                    key={item.bookId}
                    layout
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: -20 }}
                    className="luxury-card p-10 flex flex-col sm:flex-row items-center gap-10 group"
                  >
                    <div className="w-32 h-48 overflow-hidden border border-white/5 group-hover:border-gold transition-all">
                      <img 
                        src={item.coverImage || `https://picsum.photos/seed/${item.bookId}/100/150`} 
                        className="w-full h-full object-cover grayscale group-hover:grayscale-0 transition-all duration-700"
                        referrerPolicy="no-referrer"
                      />
                    </div>
                    
                    <div className="flex-grow text-center sm:text-left">
                      <h3 className="text-2xl font-display mb-2 group-hover:text-gold transition-colors">{item.title}</h3>
                      <div className="text-gold font-display text-xl mb-8">${item.price}</div>
                      
                      <div className="flex items-center justify-center sm:justify-start gap-8">
                        <div className="flex items-center border border-white/10 p-1">
                          <button onClick={() => updateQuantity(item.bookId, -1)} className="w-10 h-10 flex items-center justify-center hover:bg-white/5 transition-colors text-luxury-accent hover:text-white"><Minus size={14} /></button>
                          <span className="w-10 text-center text-sm font-bold font-accent">{item.quantity}</span>
                          <button onClick={() => updateQuantity(item.bookId, 1)} className="w-10 h-10 flex items-center justify-center hover:bg-white/5 transition-colors text-luxury-accent hover:text-white"><Plus size={14} /></button>
                        </div>
                        <button onClick={() => removeItem(item.bookId)} className="text-luxury-accent hover:text-red-500 transition-colors flex items-center gap-2 text-[10px] font-bold uppercase tracking-widest font-accent">
                          <Trash2 size={16} />
                          <span>Remove</span>
                        </button>
                      </div>
                    </div>
                    
                    <div className="text-3xl font-display text-white">
                      ${(item.price * item.quantity).toFixed(2)}
                    </div>
                  </motion.div>
                ))}
              </AnimatePresence>
            </div>

            {/* Summary */}
            <div className="lg:col-span-4">
              <div className="luxury-card p-12 sticky top-32">
                <h2 className="text-[11px] font-bold mb-12 text-gold uppercase tracking-[0.3em] font-accent">Summary</h2>
                
                <div className="space-y-6 mb-12">
                  <div className="flex justify-between text-luxury-accent text-sm font-light tracking-widest uppercase">
                    <span>Subtotal</span>
                    <span className="text-white font-bold">${subtotal.toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between text-luxury-accent text-sm font-light tracking-widest uppercase">
                    <span>Elite Shipping</span>
                    <span className="text-white font-bold">{shipping === 0 ? 'FREE' : `$${shipping.toFixed(2)}`}</span>
                  </div>
                  <div className="pt-8 border-t border-white/5 flex justify-between">
                    <span className="text-[11px] font-bold uppercase tracking-[0.3em] font-accent">Total Investment</span>
                    <span className="text-3xl font-display text-gold">${total.toFixed(2)}</span>
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
