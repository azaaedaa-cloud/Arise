import { BrowserRouter as Router, Routes, Route, Link, useNavigate, Navigate } from 'react-router-dom';
import { useState, useEffect } from 'react';
import { onAuthStateChanged, signOut, User } from 'firebase/auth';
import { auth, db } from './firebase';
import { doc, getDoc, setDoc } from 'firebase/firestore';
import { ShoppingCart, Heart, User as UserIcon, Search, Menu, X, BookOpen, LogOut, LayoutDashboard, Sun, Moon, Languages } from 'lucide-react';
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
  const { theme, toggleTheme, language, setLanguage, t } = useAppContext();
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [cartCount, setCartCount] = useState(0);

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
        <nav className="glass sticky top-0 z-50 px-6 py-4 flex items-center justify-between">
          <Link to="/" className="flex items-center gap-2 group">
            <img src="/logo.png" alt="ARAIZE" className="h-10 w-auto transition-transform group-hover:scale-105" />
          </Link>

          {/* Desktop Nav */}
          <div className="hidden md:flex items-center gap-8">
            <Link to="/catalog" className="hover:text-gold transition-colors font-medium">{t('nav.catalog')}</Link>
            <Link to="/wishlist" className="hover:text-gold transition-colors font-medium">{t('nav.wishlist')}</Link>
            <div className="relative group">
              <Search className="text-luxury-accent cursor-pointer hover:text-gold transition-colors" />
            </div>
          </div>

          <div className="flex items-center gap-4">
            {/* Theme Toggle */}
            <button 
              onClick={toggleTheme}
              className="p-2 hover:bg-white/10 rounded-full transition-colors text-gold"
              title={theme === 'dark' ? 'Switch to Light Mode' : 'Switch to Dark Mode'}
            >
              {theme === 'dark' ? <Sun size={20} /> : <Moon size={20} />}
            </button>

            {/* Language Toggle */}
            <button 
              onClick={() => setLanguage(language === 'en' ? 'ar' : 'en')}
              className="p-2 hover:bg-white/10 rounded-full transition-colors text-gold flex items-center gap-1"
              title={language === 'en' ? 'Switch to Arabic' : 'Switch to English'}
            >
              <Languages size={20} />
              <span className="text-xs font-bold uppercase">{language === 'en' ? 'AR' : 'EN'}</span>
            </button>

            <Link to="/cart" className="relative p-2 hover:bg-white/10 rounded-full transition-colors">
              <ShoppingCart size={22} />
              {cartCount > 0 && (
                <span className="absolute -top-1 -right-1 bg-gold text-luxury-black text-[10px] font-bold w-4 h-4 rounded-full flex items-center justify-center">
                  {cartCount}
                </span>
              )}
            </Link>
            
            {user ? (
              <div className="flex items-center gap-4">
                {(profile?.role === 'admin' || profile?.role === 'super_admin' || profile?.role === 'editor' || profile?.role === 'support') && (
                  <Link to="/admin" className="p-2 hover:bg-white/10 rounded-full transition-colors text-gold">
                    <LayoutDashboard size={22} />
                  </Link>
                )}
                <Link to="/profile" className="p-2 hover:bg-white/10 rounded-full transition-colors">
                  <UserIcon size={22} />
                </Link>
                <button onClick={() => signOut(auth)} className="p-2 hover:bg-white/10 rounded-full transition-colors text-red-500">
                  <LogOut size={22} />
                </button>
              </div>
            ) : (
              <Link to="/auth" className="btn-gold py-2 px-4 text-sm">Sign In</Link>
            )}
            
            <button className="md:hidden p-2" onClick={() => setIsMenuOpen(!isMenuOpen)}>
              {isMenuOpen ? <X /> : <Menu />}
            </button>
          </div>
        </nav>

        {/* Mobile Menu */}
        <AnimatePresence>
          {isMenuOpen && (
            <motion.div 
              initial={{ opacity: 0, y: -20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="md:hidden glass absolute top-20 left-0 w-full p-6 z-40 flex flex-col gap-4"
            >
              <Link to="/catalog" onClick={() => setIsMenuOpen(false)}>{t('nav.catalog')}</Link>
              <Link to="/wishlist" onClick={() => setIsMenuOpen(false)}>{t('nav.wishlist')}</Link>
              <Link to="/cart" onClick={() => setIsMenuOpen(false)}>{t('nav.cart')}</Link>
              {user ? (
                <>
                  <Link to="/profile" onClick={() => setIsMenuOpen(false)}>{t('nav.profile')}</Link>
                  <button onClick={() => signOut(auth)} className="text-left text-red-500">{t('nav.signout')}</button>
                </>
              ) : (
                <Link to="/auth" onClick={() => setIsMenuOpen(false)}>{t('nav.signin')}</Link>
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
        <footer className="bg-luxury-gray border-t border-white/5 py-12 px-6 mt-20">
          <div className="max-w-7xl mx-auto grid grid-cols-1 md:grid-cols-4 gap-12">
            <div className="col-span-1 md:col-span-2">
              <div className="flex items-center gap-2 mb-6">
                <img src="/logo.png" alt="ARAIZE" className="h-8 w-auto" />
              </div>
              <p className="text-luxury-accent max-w-md leading-relaxed">
                {t('footer.description')}
              </p>
            </div>
            <div>
              <h4 className="font-bold mb-6 text-gold">{t('footer.explore')}</h4>
              <ul className="space-y-4 text-luxury-accent">
                <li><Link to="/catalog" className="hover:text-white transition-colors">{t('nav.catalog')}</Link></li>
                <li><Link to="/catalog?category=Digital" className="hover:text-white transition-colors">{t('footer.digital')}</Link></li>
                <li><Link to="/catalog?category=Limited" className="hover:text-white transition-colors">{t('footer.limited')}</Link></li>
              </ul>
            </div>
            <div>
              <h4 className="font-bold mb-6 text-gold">{t('footer.support')}</h4>
              <ul className="space-y-4 text-luxury-accent">
                <li><a href="#" className="hover:text-white transition-colors">{t('footer.contact')}</a></li>
                <li><a href="#" className="hover:text-white transition-colors">{t('footer.shipping')}</a></li>
                <li><a href="#" className="hover:text-white transition-colors">{t('footer.terms')}</a></li>
              </ul>
            </div>
            <div>
              <h4 className="font-bold mb-6 text-gold">Follow Us</h4>
              <ul className="space-y-4 text-luxury-accent">
                <li>
                  <a 
                    href="https://www.facebook.com/profile.php?id=61579690449201" 
                    target="_blank" 
                    rel="noopener noreferrer" 
                    className="hover:text-white transition-colors flex items-center gap-2"
                  >
                    <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                      <path d="M22 12c0-5.523-4.477-10-10-10S2 6.477 2 12c0 4.991 3.657 9.128 8.438 9.878v-6.987h-2.54V12h2.54V9.797c0-2.506 1.492-3.89 3.777-3.89 1.094 0 2.238.195 2.238.195v2.46h-1.26c-1.243 0-1.63.771-1.63 1.562V12h2.773l-.443 2.89h-2.33v6.988C18.343 21.128 22 16.991 22 12z" />
                    </svg>
                    Facebook
                  </a>
                </li>
              </ul>
            </div>
          </div>
          <div className="max-w-7xl mx-auto mt-12 pt-8 border-t border-white/5 text-center text-luxury-accent text-sm">
            © 2026 Araize Platform. {t('footer.rights')}
          </div>
        </footer>
      </div>
    </Router>
  );
}
