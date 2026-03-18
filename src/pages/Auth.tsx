import { useState } from 'react';
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
import { Mail, Lock, User, LogIn, UserPlus, Star, Shield, Zap, Globe, BookOpen } from 'lucide-react';

export default function Auth() {
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
        await signInWithEmailAndPassword(auth, email, password);
      } else {
        const userCredential = await createUserWithEmailAndPassword(auth, email, password);
        await updateProfile(userCredential.user, { displayName });
        
        // Create user profile in Firestore
        await setDoc(doc(db, 'users', userCredential.user.uid), {
          uid: userCredential.user.uid,
          email,
          displayName,
          role: 'customer',
          createdAt: new Date().toISOString(),
          wishlist: []
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
    try {
      const result = await signInWithPopup(auth, provider);
      const user = result.user;
      
      // Check if user profile exists, if not create it
      await setDoc(doc(db, 'users', user.uid), {
        uid: user.uid,
        email: user.email,
        displayName: user.displayName,
        photoURL: user.photoURL,
        role: 'customer',
        createdAt: new Date().toISOString(),
        wishlist: []
      }, { merge: true });
      
      navigate('/');
    } catch (err: any) {
      setError(err.message);
    }
  };

  return (
    <div className="min-h-[80vh] flex items-center justify-center px-6 py-20 relative overflow-hidden">
      {/* Background Glow */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] bg-gold/5 rounded-full blur-[120px] -z-10" />

      <motion.div 
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className="w-full max-w-5xl grid grid-cols-1 lg:grid-cols-2 glass rounded-[3rem] overflow-hidden border-white/5 shadow-[0_50px_100px_rgba(0,0,0,0.5)]"
      >
        {/* Left Side - Info */}
        <div className="hidden lg:flex flex-col justify-between p-16 bg-gradient-to-br from-luxury-gray to-luxury-black relative overflow-hidden">
          <div className="absolute inset-0 bg-[url('https://picsum.photos/seed/texture/1920/1080')] opacity-5 mix-blend-overlay" />
          
          <div className="relative z-10">
            <div className="flex items-center gap-2 mb-12">
              <div className="w-10 h-10 bg-gold rounded-lg flex items-center justify-center shadow-[0_0_15px_rgba(212,175,55,0.5)]">
                <BookOpen className="text-luxury-black" size={24} />
              </div>
              <span className="text-2xl font-bold tracking-tighter">LUXE<span className="text-gold">BOOKS</span></span>
            </div>
            
            <h2 className="text-5xl font-bold tracking-tighter mb-8 leading-tight">
              JOIN THE <br />
              <span className="text-gold">ELITE CIRCLE</span>
            </h2>
            <p className="text-luxury-accent text-lg leading-relaxed mb-12">
              Access the world's most exclusive digital and physical bookstore. Curated for the elite, powered by performance.
            </p>

            <div className="space-y-6">
              {[
                { label: "Elite Access", icon: Shield, color: "text-blue-400" },
                { label: "Instant Delivery", icon: Zap, color: "text-gold" },
                { label: "Global Network", icon: Globe, color: "text-emerald-400" },
              ].map((feature, i) => (
                <div key={i} className="flex items-center gap-4">
                  <div className={`w-10 h-10 glass rounded-xl flex items-center justify-center ${feature.color}`}>
                    <feature.icon size={20} />
                  </div>
                  <span className="font-bold tracking-widest text-xs uppercase text-luxury-accent">{feature.label}</span>
                </div>
              ))}
            </div>
          </div>

          <div className="relative z-10 pt-12 border-t border-white/5 flex items-center gap-4">
            <div className="flex -space-x-4">
              {[1, 2, 3, 4].map(i => (
                <img key={i} src={`https://i.pravatar.cc/150?u=${i}`} className="w-10 h-10 rounded-full border-2 border-luxury-black" />
              ))}
            </div>
            <div className="text-xs text-luxury-accent">
              <span className="text-white font-bold">50,000+</span> elite readers <br /> already joined.
            </div>
          </div>
        </div>

        {/* Right Side - Form */}
        <div className="p-8 md:p-16 flex flex-col justify-center">
          <div className="text-center mb-12">
            <h3 className="text-3xl font-bold mb-2">{isLogin ? 'Welcome Back' : 'Create Account'}</h3>
            <p className="text-luxury-accent">{isLogin ? 'Enter your elite credentials' : 'Join the elite reading circle'}</p>
          </div>

          {error && (
            <div className="bg-red-500/10 border border-red-500/20 text-red-500 p-4 rounded-xl text-sm mb-8 text-center">
              {error}
            </div>
          )}

          <form onSubmit={handleAuth} className="space-y-6">
            <AnimatePresence mode="wait">
              {!isLogin && (
                <motion.div 
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  exit={{ opacity: 0, height: 0 }}
                  className="relative"
                >
                  <User className="absolute left-4 top-1/2 -translate-y-1/2 text-luxury-accent" size={18} />
                  <input 
                    type="text" 
                    placeholder="Full Name" 
                    className="w-full pl-12 pr-6 py-4 rounded-xl glass border-white/10 focus:border-gold outline-none transition-all"
                    value={displayName}
                    onChange={(e) => setDisplayName(e.target.value)}
                    required={!isLogin}
                  />
                </motion.div>
              )}
            </AnimatePresence>

            <div className="relative">
              <Mail className="absolute left-4 top-1/2 -translate-y-1/2 text-luxury-accent" size={18} />
              <input 
                type="email" 
                placeholder="Elite Email" 
                className="w-full pl-12 pr-6 py-4 rounded-xl glass border-white/10 focus:border-gold outline-none transition-all"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
            </div>

            <div className="relative">
              <Lock className="absolute left-4 top-1/2 -translate-y-1/2 text-luxury-accent" size={18} />
              <input 
                type="password" 
                placeholder="Secure Password" 
                className="w-full pl-12 pr-6 py-4 rounded-xl glass border-white/10 focus:border-gold outline-none transition-all"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
              />
            </div>

            <button 
              type="submit" 
              disabled={loading}
              className="btn-gold w-full py-4 flex items-center justify-center gap-2"
            >
              {loading ? (
                <div className="w-5 h-5 border-2 border-luxury-black border-t-transparent rounded-full animate-spin" />
              ) : (
                <>
                  {isLogin ? <LogIn size={20} /> : <UserPlus size={20} />}
                  {isLogin ? 'Sign In' : 'Create Account'}
                </>
              )}
            </button>
          </form>

          <div className="relative my-10">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-white/5"></div>
            </div>
            <div className="relative flex justify-center text-xs uppercase">
              <span className="bg-luxury-black px-4 text-luxury-accent tracking-widest">Or continue with</span>
            </div>
          </div>

          <button 
            onClick={handleGoogleSignIn}
            className="w-full py-4 glass rounded-xl border-white/10 hover:bg-white/5 transition-all flex items-center justify-center gap-3 font-bold"
          >
            <img src="https://www.google.com/favicon.ico" className="w-5 h-5" />
            Google Login
          </button>

          <p className="text-center mt-10 text-luxury-accent">
            {isLogin ? "Don't have an elite account?" : "Already have an account?"}
            <button 
              onClick={() => setIsLogin(!isLogin)}
              className="text-gold font-bold ml-2 hover:underline"
            >
              {isLogin ? 'Create one now' : 'Sign in here'}
            </button>
          </p>
        </div>
      </motion.div>
    </div>
  );
}
