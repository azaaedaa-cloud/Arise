import { useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { motion } from 'motion/react';
import { CheckCircle, ArrowRight, ShoppingBag } from 'lucide-react';
import { auth, db } from '../firebase';
import { collection, addDoc, query, where, getDocs } from 'firebase/firestore';
import confetti from 'canvas-confetti';

export default function Success() {
  const [searchParams] = useSearchParams();
  const sessionId = searchParams.get('session_id');
  const navigate = useNavigate();
  const [status, setStatus] = useState<'loading' | 'success' | 'error'>('loading');

  useEffect(() => {
    const processOrder = async () => {
      if (!sessionId) {
        setStatus('error');
        return;
      }

      try {
        // In a real app, you'd verify the session on the server
        // For this demo, we'll assume it's valid if we have a session_id
        // and clear the local cart.
        
        const savedCart = localStorage.getItem('luxe_cart');
        if (savedCart && auth.currentUser) {
          const cartItems = JSON.parse(savedCart);
          const total = cartItems.reduce((sum: number, item: any) => sum + (item.price * item.quantity), 0);
          
          const orderData = {
            userId: auth.currentUser.uid,
            items: cartItems,
            totalAmount: total,
            status: 'paid',
            stripeSessionId: sessionId,
            createdAt: new Date().toISOString()
          };
          
          await addDoc(collection(db, 'orders'), orderData);
          localStorage.removeItem('luxe_cart');
          
          confetti({
            particleCount: 150,
            spread: 70,
            origin: { y: 0.6 },
            colors: ['#D4AF37', '#ffffff', '#000000']
          });
          
          setStatus('success');
        } else {
          // If cart is already cleared, maybe they refreshed
          setStatus('success');
        }
      } catch (error) {
        console.error("Error processing order:", error);
        setStatus('error');
      }
    };

    if (auth.currentUser) {
      processOrder();
    } else {
      // Wait for auth to initialize
      const unsubscribe = auth.onAuthStateChanged((user) => {
        if (user) {
          processOrder();
          unsubscribe();
        } else {
          navigate('/auth');
        }
      });
      return () => unsubscribe();
    }
  }, [sessionId, navigate]);

  if (status === 'loading') {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="w-12 h-12 border-4 border-gold border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="max-w-3xl mx-auto px-6 py-40 text-center">
      {status === 'success' ? (
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          className="glass p-12 rounded-[3rem] border-gold/20"
        >
          <div className="w-24 h-24 bg-gold/20 rounded-full flex items-center justify-center mx-auto mb-8 border border-gold/30">
            <CheckCircle className="text-gold" size={48} />
          </div>
          <h1 className="text-5xl font-bold tracking-tighter mb-6">ELITE PURCHASE <span className="text-gold">CONFIRMED</span></h1>
          <p className="text-luxury-accent text-lg mb-12 leading-relaxed">
            Your transaction has been secured. Your new masterpieces are being prepared for your digital vault.
          </p>
          
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <button 
              onClick={() => navigate('/profile')}
              className="btn-gold px-8 py-4 flex items-center justify-center gap-2"
            >
              View My Vault <ArrowRight size={18} />
            </button>
            <button 
              onClick={() => navigate('/catalog')}
              className="btn-outline px-8 py-4 flex items-center justify-center gap-2"
            >
              <ShoppingBag size={18} /> Continue Exploring
            </button>
          </div>
        </motion.div>
      ) : (
        <div className="glass p-12 rounded-[3rem] border-red-500/20">
          <h1 className="text-4xl font-bold mb-6">TRANSACTION <span className="text-red-500">ERROR</span></h1>
          <p className="text-luxury-accent mb-8">
            Something went wrong while securing your masterpieces. Please contact support.
          </p>
          <button onClick={() => navigate('/cart')} className="btn-gold px-8">Return to Cart</button>
        </div>
      )}
    </div>
  );
}
