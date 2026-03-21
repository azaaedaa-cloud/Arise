import { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { 
  signInWithEmailAndPassword, 
  createUserWithEmailAndPassword, 
  signInWithPopup, 
  GoogleAuthProvider,
  updateProfile
} from 'firebase/auth';
import { auth, db } from '../firebase';
import { doc, setDoc } from 'firebase/firestore';
import { motion, AnimatePresence } from 'motion/react';
import { Mail, Lock, User, LogIn, UserPlus, Shield, Zap, Globe, Crown, ArrowRight } from 'lucide-react';
import { useAppContext } from '../contexts/AppContext';

export default function Auth() {
  const { t } = useAppContext();
  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [displayName, setDisplayName] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      if (isLogin) {
        const userCredential = await signInWithEmailAndPassword(auth, email, password);
        const idToken = await userCredential.user.getIdToken();
        
        // Sync with backend to set JWT cookie
        await fetch('/api/auth/sync', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ idToken, email: userCredential.user.email, uid: userCredential.user.uid })
        });
      } else {
        const userCredential = await createUserWithEmailAndPassword(auth, email, password);
        await updateProfile(userCredential.user, { displayName });
        const idToken = await userCredential.user.getIdToken();
        
        // Create user profile in Firestore
        await setDoc(doc(db, 'users', userCredential.user.uid), {
          uid: userCredential.user.uid,
          email,
          displayName,
          role: 'user',
          createdAt: new Date().toISOString(),
          wishlist: [],
          purchasedBooks: []
        });

        // Sync with backend
        await fetch('/api/auth/sync', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ idToken, email, uid: userCredential.user.uid })
        });
      }
      navigate('/');
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleSignIn = async () => {
    const provider = new GoogleAuthProvider();
    provider.setCustomParameters({ prompt: 'select_account' });
    setError('');
    setLoading(true);
    try {
      const userCredential = await signInWithPopup(auth, provider);
      const idToken = await userCredential.user.getIdToken();
      
      // Sync with backend
      await fetch('/api/auth/sync', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ idToken, email: userCredential.user.email, uid: userCredential.user.uid })
      });

      navigate('/');
    } catch (err: any) {
      console.error("Google Sign In Error:", err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center px-4 md:px-6 py-24 md:py-32 relative overflow-hidden bg-luxury-black">
      {/* Background Elements */}
      <div className="absolute top-0 left-0 w-full h-full overflow-hidden -z-10">
        <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-gold/5 rounded-full blur-[120px]" />
        <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-gold/5 rounded-full blur-[120px]" />
      </div>

      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-6xl grid grid-cols-1 lg:grid-cols-2 luxury-card overflow-hidden min-h-[600px] md:min-h-[700px]"
      >
        {/* Left Side - Brand & Story */}
        <div className="hidden lg:flex flex-col justify-between p-20 bg-gradient-to-br from-luxury-gray to-luxury-black relative">
          <div className="absolute inset-0 bg-[url('https://images.unsplash.com/photo-1507842217343-583bb7270b66?q=80&w=2070&auto=format&fit=crop')] opacity-10 mix-blend-overlay grayscale" />
          
          <div className="relative z-10">
            <Link to="/" className="flex items-center gap-4 mb-20 group">
              <div className="w-12 h-12 border border-gold/30 flex items-center justify-center group-hover:border-gold transition-colors">
                <Crown className="text-gold" size={24} />
              </div>
              <span className="text-3xl font-display tracking-[0.2em] text-white">ARAIZE</span>
            </Link>
            
            <h2 className="text-6xl font-display tracking-tight mb-10 leading-[1.1]">
              THE <span className="gold-text">FOUNDATION</span> <br />
              OF SUCCESS.
            </h2>
            <p className="text-luxury-accent text-xl font-light leading-relaxed mb-16 italic">
              "True power lies in knowledge. Join the elite circle of those who rise beyond their limits."
            </p>

            <div className="grid grid-cols-1 gap-8">
              {[
                { label: "Elite Access", icon: Shield, desc: "Curated collections for the ambitious." },
                { label: "Instant Delivery", icon: Zap, desc: "Knowledge at the speed of thought." },
                { label: "Global Network", icon: Globe, desc: "Connect with the world's finest minds." },
              ].map((feature, i) => (
                <div key={i} className="flex items-start gap-6 group">
                  <div className="w-12 h-12 border border-white/5 flex items-center justify-center text-gold group-hover:border-gold transition-colors">
                    <feature.icon size={20} />
                  </div>
                  <div>
                    <h4 className="text-[11px] font-bold uppercase tracking-[0.3em] text-white mb-1 font-accent">{feature.label}</h4>
                    <p className="text-sm text-luxury-accent font-light">{feature.desc}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="relative z-10 pt-12 border-t border-white/5 flex items-center gap-6">
            <div className="flex -space-x-3">
              {[1, 2, 3, 4].map(i => (
                <img key={i} src={`https://i.pravatar.cc/150?u=${i + 10}`} className="w-10 h-10 rounded-full border-2 border-luxury-black grayscale hover:grayscale-0 transition-all cursor-pointer" />
              ))}
            </div>
            <div className="text-[10px] uppercase tracking-[0.2em] text-luxury-accent font-accent">
              <span className="text-white font-bold">50,000+</span> Elite Members
            </div>
          </div>
        </div>

        {/* Right Side - Auth Form */}
        <div className="p-8 md:p-20 flex flex-col justify-center bg-luxury-black/40">
          <div className="mb-10 md:mb-16">
            <h3 className="text-3xl md:text-4xl font-display mb-4">{isLogin ? 'Sign In' : 'Create Account'}</h3>
            <p className="text-luxury-accent text-sm md:text-base font-light italic">{isLogin ? 'Welcome back to the elite circle.' : 'Begin your journey to sovereignty.'}</p>
          </div>

          {error && (
            <motion.div 
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              className="bg-red-500/5 border border-red-500/20 text-red-500 p-6 mb-10 text-sm font-light italic"
            >
              {error}
            </motion.div>
          )}

          <form onSubmit={handleAuth} className="space-y-8">
            <AnimatePresence mode="wait">
              {!isLogin && (
                <motion.div 
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  exit={{ opacity: 0, height: 0 }}
                  className="relative"
                >
                  <User className="absolute left-0 top-1/2 -translate-y-1/2 text-gold/50" size={18} />
                  <input 
                    type="text" 
                    placeholder="FULL NAME" 
                    className="w-full pl-10 pr-4 py-4 bg-transparent border-b border-white/10 focus:border-gold outline-none transition-all text-sm tracking-widest uppercase font-accent"
                    value={displayName}
                    onChange={(e) => setDisplayName(e.target.value)}
                    required={!isLogin}
                  />
                </motion.div>
              )}
            </AnimatePresence>

            <div className="relative">
              <Mail className="absolute left-0 top-1/2 -translate-y-1/2 text-gold/50" size={18} />
              <input 
                type="email" 
                placeholder="ELITE EMAIL" 
                className="w-full pl-10 pr-4 py-4 bg-transparent border-b border-white/10 focus:border-gold outline-none transition-all text-sm tracking-widest uppercase font-accent"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
            </div>

            <div className="relative">
              <Lock className="absolute left-0 top-1/2 -translate-y-1/2 text-gold/50" size={18} />
              <input 
                type="password" 
                placeholder="SECURE PASSWORD" 
                className="w-full pl-10 pr-4 py-4 bg-transparent border-b border-white/10 focus:border-gold outline-none transition-all text-sm tracking-widest uppercase font-accent"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
              />
            </div>

            <button 
              type="submit" 
              disabled={loading}
              className="btn-luxury w-full py-5 flex items-center justify-center gap-4 group"
            >
              {loading ? (
                <div className="w-5 h-5 border-2 border-black border-t-transparent rounded-full animate-spin" />
              ) : (
                <>
                  <span className="text-[11px] font-bold uppercase tracking-[0.4em]">{isLogin ? 'Sign In' : 'Create Account'}</span>
                  <ArrowRight size={18} className="group-hover:translate-x-2 transition-transform" />
                </>
              )}
            </button>
          </form>

          <div className="relative my-10 md:my-16">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-white/5"></div>
            </div>
            <div className="relative flex justify-center">
              <span className="bg-luxury-black px-4 md:px-6 text-[9px] md:text-[10px] uppercase tracking-[0.3em] text-luxury-accent font-accent">Or continue with</span>
            </div>
          </div>

          <button 
            onClick={handleGoogleSignIn}
            className="w-full py-5 border border-white/5 hover:border-gold/30 transition-all flex items-center justify-center gap-4 group"
          >
            <img src="https://www.google.com/favicon.ico" className="w-5 h-5 grayscale group-hover:grayscale-0 transition-all" />
            <span className="text-[11px] font-bold uppercase tracking-[0.3em] text-luxury-accent group-hover:text-white transition-colors font-accent">Google Login</span>
          </button>

          <div className="text-center mt-16">
            <button 
              onClick={() => setIsLogin(!isLogin)}
              className="text-[10px] uppercase tracking-[0.3em] text-luxury-accent hover:text-gold transition-colors font-accent"
            >
              {isLogin ? "Don't have an account? Create one" : "Already have an account? Sign in"}
            </button>
          </div>
        </div>
      </motion.div>
    </div>
  );
}
