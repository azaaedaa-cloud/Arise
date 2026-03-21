import { BrowserRouter as Router, Routes, Route, Link, useNavigate, Navigate } from 'react-router-dom';
import { useState, useEffect } from 'react';
import { onAuthStateChanged, signOut, User } from 'firebase/auth';
import { auth, db } from './firebase';
import { doc, getDoc, setDoc } from 'firebase/firestore';
import { ShoppingCart, Heart, User as UserIcon, Search, Menu, X, BookOpen, LogOut, LayoutDashboard, Sun, Moon, Languages, Crown } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { Toaster } from 'react-hot-toast';
import { UserProfile } from './types';
import { useAppContext } from './contexts/AppContext';

// Pages
import Home from './pages/Home';
import Catalog from './pages/Catalog';
import BookDetails from './pages/BookDetails';
import Cart from './pages/Cart';
import Success from './pages/Success';
import Profile from './pages/Profile';
import AdminDashboard from './pages/AdminDashboard';
import Auth from './pages/Auth';

// Protected Route Component
const ProtectedRoute = ({ children, role }: { children: React.ReactNode, role?: string }) => {
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      if (firebaseUser) {
        const docRef = doc(db, 'users', firebaseUser.uid);
        const docSnap = await getDoc(docRef);
        if (docSnap.exists()) {
          setProfile(docSnap.data() as UserProfile);
        }
        setUser(firebaseUser);
      } else {
        setUser(null);
        setProfile(null);
      }
      setLoading(false);
    });
    return () => unsubscribe();
  }, []);

  const { t } = useAppContext();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-luxury-black">
        <div className="w-12 h-12 border-4 border-gold border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/auth" replace />;
  }

  if (role && profile?.role !== role && profile?.role !== 'super_admin') {
    return <Navigate to="/" replace />;
  }

  return <>{children}</>;
};

export default function App() {
  const { theme, toggleTheme, language, setLanguage, t, cartCount } = useAppContext();
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  useEffect(() => {
    document.title = 'Araize';
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      setUser(firebaseUser);
      if (firebaseUser) {
        const docRef = doc(db, 'users', firebaseUser.uid);
        try {
          const docSnap = await getDoc(docRef);
          if (docSnap.exists()) {
            setProfile(docSnap.data() as UserProfile);
          } else {
            // Create profile if it doesn't exist
            const newProfile: UserProfile = {
              uid: firebaseUser.uid,
              email: firebaseUser.email || '',
              displayName: firebaseUser.displayName || 'Guest',
              role: firebaseUser.email === 'azaaedaa@gmail.com' ? 'super_admin' : 'user',
              createdAt: new Date().toISOString(),
              wishlist: [],
              purchasedBooks: []
            };
            await setDoc(docRef, newProfile);
            setProfile(newProfile);
          }
        } catch (error: any) {
          console.error("Firestore Auth Error:", error);
          // If it's a permission error, it might be because the user is new and rules are strict
          // But for 'users' collection, owners should have access
        }
      } else {
        setProfile(null);
      }
    });
    return () => unsubscribe();
  }, []);

  return (
    <Router>
      <div className="min-h-screen flex flex-col">
        <Toaster position="top-right" toastOptions={{
          style: {
            background: '#1a1a1a',
            color: '#fff',
            border: '1px solid rgba(212, 175, 55, 0.2)',
            borderRadius: '12px',
          },
          success: {
            iconTheme: {
              primary: '#D4AF37',
              secondary: '#1a1a1a',
            },
          },
        }} />
        {/* Navigation */}
        <nav className="fixed top-0 left-0 w-full z-50 px-4 md:px-6 py-4 md:py-6 transition-all duration-500 bg-luxury-black/80 backdrop-blur-xl border-b border-white/5">
          <div className="container mx-auto flex items-center justify-between">
            <Link to="/" className="flex items-center gap-3 group">
              <div className="w-10 h-10 border border-gold/30 flex items-center justify-center group-hover:border-gold transition-colors">
                <Crown className="text-gold" size={20} />
              </div>
              <span className="text-2xl font-display tracking-[0.2em] text-white group-hover:text-gold transition-colors">ARAIZE</span>
            </Link>

            {/* Desktop Nav */}
            <div className="hidden md:flex items-center gap-12">
              <Link to="/catalog" className="text-[11px] font-bold uppercase tracking-[0.3em] text-luxury-accent hover:text-gold transition-colors font-accent">{t('nav.catalog')}</Link>
              <Link to="/wishlist" className="text-[11px] font-bold uppercase tracking-[0.3em] text-luxury-accent hover:text-gold transition-colors font-accent">{t('nav.wishlist')}</Link>
              <div className="relative group">
                <Search className="text-luxury-accent cursor-pointer hover:text-gold transition-colors" size={18} />
              </div>
            </div>

            <div className="flex items-center gap-6">
              {/* Language Toggle */}
              <button 
                onClick={() => setLanguage(language === 'en' ? 'ar' : 'en')}
                className="text-[10px] font-bold uppercase tracking-widest text-gold hover:text-gold-light transition-colors flex items-center gap-2 font-accent"
              >
                <Languages size={16} />
                <span>{language === 'en' ? 'AR' : 'EN'}</span>
              </button>

              <Link to="/cart" className="relative text-luxury-accent hover:text-gold transition-colors">
                <ShoppingCart size={20} />
                {cartCount > 0 && (
                  <span className="absolute -top-2 -right-2 bg-gold text-black text-[9px] font-bold w-4 h-4 flex items-center justify-center">
                    {cartCount}
                  </span>
                )}
              </Link>
              
              {user ? (
                <div className="flex items-center gap-6">
                  {(profile?.role === 'admin' || profile?.role === 'super_admin' || profile?.role === 'editor' || profile?.role === 'support') && (
                    <Link to="/admin" className="text-gold hover:text-gold-light transition-colors">
                      <LayoutDashboard size={20} />
                    </Link>
                  )}
                  <Link to="/profile" className="text-luxury-accent hover:text-gold transition-colors">
                    <UserIcon size={20} />
                  </Link>
                  <button onClick={() => signOut(auth)} className="text-red-500/70 hover:text-red-500 transition-colors">
                    <LogOut size={20} />
                  </button>
                </div>
              ) : (
                <Link to="/auth" className="text-[11px] font-bold uppercase tracking-[0.3em] text-gold hover:text-gold-light transition-colors font-accent">
                  {t('nav.signin')}
                </Link>
              )}
              
              <button className="md:hidden text-gold" onClick={() => setIsMenuOpen(!isMenuOpen)}>
                {isMenuOpen ? <X size={24} /> : <Menu size={24} />}
              </button>
            </div>
          </div>
        </nav>

        {/* Mobile Menu */}
        <AnimatePresence>
          {isMenuOpen && (
            <motion.div 
              initial={{ opacity: 0, x: '100%' }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: '100%' }}
              className="md:hidden fixed inset-0 bg-luxury-black z-[60] p-12 flex flex-col items-center justify-center gap-12"
            >
              <button className="absolute top-8 right-8 text-gold" onClick={() => setIsMenuOpen(false)}>
                <X size={32} />
              </button>
              <Link to="/catalog" className="text-3xl font-display" onClick={() => setIsMenuOpen(false)}>{t('nav.catalog')}</Link>
              <Link to="/wishlist" className="text-3xl font-display" onClick={() => setIsMenuOpen(false)}>{t('nav.wishlist')}</Link>
              <Link to="/cart" className="text-3xl font-display" onClick={() => setIsMenuOpen(false)}>{t('nav.cart')}</Link>
              {user ? (
                <>
                  <Link to="/profile" className="text-3xl font-display" onClick={() => setIsMenuOpen(false)}>{t('nav.profile')}</Link>
                  <button onClick={() => signOut(auth)} className="text-3xl font-display text-red-500">{t('nav.signout')}</button>
                </>
              ) : (
                <Link to="/auth" className="text-3xl font-display text-gold" onClick={() => setIsMenuOpen(false)}>{t('nav.signin')}</Link>
              )}
            </motion.div>
          )}
        </AnimatePresence>

        {/* Main Content */}
        <main className="flex-grow">
          <Routes>
            <Route path="/" element={<Home />} />
            <Route path="/catalog" element={<Catalog />} />
            <Route path="/book/:id" element={<BookDetails />} />
            <Route path="/cart" element={<Cart />} />
            <Route path="/success" element={<Success />} />
            <Route path="/profile" element={<Profile />} />
            <Route path="/admin" element={
              <ProtectedRoute role="admin">
                <AdminDashboard />
              </ProtectedRoute>
            } />
            <Route path="/auth" element={<Auth />} />
          </Routes>
        </main>

        {/* Footer */}
        <footer className="bg-luxury-black border-t border-white/5 py-32 px-6">
          <div className="container mx-auto">
            <div className="grid grid-cols-1 md:grid-cols-12 gap-20 mb-24">
              <div className="md:col-span-5">
                <Link to="/" className="flex items-center gap-3 mb-10 group">
                  <div className="w-12 h-12 border border-gold/30 flex items-center justify-center group-hover:border-gold transition-colors">
                    <Crown className="text-gold" size={24} />
                  </div>
                  <span className="text-3xl font-display tracking-[0.2em] text-white">ARAIZE</span>
                </Link>
                <p className="text-luxury-accent font-light leading-relaxed max-w-md text-lg italic">
                  "{t('footer.description')}"
                </p>
              </div>
              
              <div className="md:col-span-2">
                <h4 className="text-[11px] font-bold mb-10 text-gold uppercase tracking-[0.3em] font-accent">{t('footer.explore')}</h4>
                <ul className="space-y-6 text-sm font-light tracking-widest uppercase">
                  <li><Link to="/catalog" className="text-luxury-accent hover:text-white transition-colors">{t('nav.catalog')}</Link></li>
                  <li><Link to="/catalog?category=Digital" className="text-luxury-accent hover:text-white transition-colors">{t('footer.digital')}</Link></li>
                  <li><Link to="/catalog?category=Limited" className="text-luxury-accent hover:text-white transition-colors">{t('footer.limited')}</Link></li>
                </ul>
              </div>

              <div className="md:col-span-2">
                <h4 className="text-[11px] font-bold mb-10 text-gold uppercase tracking-[0.3em] font-accent">{t('footer.support')}</h4>
                <ul className="space-y-6 text-sm font-light tracking-widest uppercase">
                  <li><a href="#" className="text-luxury-accent hover:text-white transition-colors">{t('footer.contact')}</a></li>
                  <li><a href="#" className="text-luxury-accent hover:text-white transition-colors">{t('footer.shipping')}</a></li>
                  <li><a href="#" className="text-luxury-accent hover:text-white transition-colors">{t('footer.terms')}</a></li>
                </ul>
              </div>

              <div className="md:col-span-3">
                <h4 className="text-[11px] font-bold mb-10 text-gold uppercase tracking-[0.3em] font-accent">Connect</h4>
                <a 
                  href="https://www.facebook.com/profile.php?id=61579690449201" 
                  target="_blank" 
                  rel="noopener noreferrer" 
                  className="group flex items-center gap-4 text-luxury-accent hover:text-white transition-all"
                >
                  <div className="w-12 h-12 border border-white/10 flex items-center justify-center group-hover:border-gold transition-colors">
                    <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                      <path d="M22 12c0-5.523-4.477-10-10-10S2 6.477 2 12c0 4.991 3.657 9.128 8.438 9.878v-6.987h-2.54V12h2.54V9.797c0-2.506 1.492-3.89 3.777-3.89 1.094 0 2.238.195 2.238.195v2.46h-1.26c-1.243 0-1.63.771-1.63 1.562V12h2.773l-.443 2.89h-2.33v6.988C18.343 21.128 22 16.991 22 12z" />
                    </svg>
                  </div>
                  <span className="text-sm font-light tracking-widest uppercase">Facebook</span>
                </a>
              </div>
            </div>
            
            <div className="pt-12 border-t border-white/5 flex flex-col md:flex-row items-center justify-between gap-8 text-luxury-accent text-[10px] uppercase tracking-[0.4em] font-accent">
              <div>© 2026 Araize Elite Platform</div>
              <div className="flex gap-12">
                <a href="#" className="hover:text-gold transition-colors">Privacy Policy</a>
                <a href="#" className="hover:text-gold transition-colors">Terms of Service</a>
              </div>
            </div>
          </div>
        </footer>
      </div>
    </Router>
  );
}
