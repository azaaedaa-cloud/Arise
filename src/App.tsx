import { BrowserRouter as Router, Routes, Route, Link, useNavigate } from 'react-router-dom';
import { useState, useEffect } from 'react';
import { onAuthStateChanged, signOut, User } from 'firebase/auth';
import { auth, db } from './firebase';
import { doc, getDoc, setDoc } from 'firebase/firestore';
import { ShoppingCart, Heart, User as UserIcon, Search, Menu, X, BookOpen, LogOut, LayoutDashboard } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { UserProfile } from './types';

// Pages
import Home from './pages/Home';
import Catalog from './pages/Catalog';
import BookDetails from './pages/BookDetails';
import Cart from './pages/Cart';
import Profile from './pages/Profile';
import AdminDashboard from './pages/AdminDashboard';
import Auth from './pages/Auth';

export default function App() {
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [cartCount, setCartCount] = useState(0);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      setUser(firebaseUser);
      if (firebaseUser) {
        const docRef = doc(db, 'users', firebaseUser.uid);
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
      } else {
        setProfile(null);
      }
    });
    return () => unsubscribe();
  }, []);

  return (
    <Router>
      <div className="min-h-screen flex flex-col">
        {/* Navigation */}
        <nav className="glass sticky top-0 z-50 px-6 py-4 flex items-center justify-between">
          <Link to="/" className="flex items-center gap-2 group">
            <div className="w-10 h-10 bg-gold rounded-lg flex items-center justify-center group-hover:rotate-12 transition-transform duration-300 shadow-[0_0_15px_rgba(212,175,55,0.5)]">
              <BookOpen className="text-luxury-black" size={24} />
            </div>
            <span className="text-2xl font-bold tracking-tighter text-glow">LUXE<span className="text-gold">BOOKS</span></span>
          </Link>

          {/* Desktop Nav */}
          <div className="hidden md:flex items-center gap-8">
            <Link to="/catalog" className="hover:text-gold transition-colors font-medium">Catalog</Link>
            <Link to="/wishlist" className="hover:text-gold transition-colors font-medium">Wishlist</Link>
            <div className="relative group">
              <Search className="text-luxury-accent cursor-pointer hover:text-gold transition-colors" />
            </div>
          </div>

          <div className="flex items-center gap-4">
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
                {(profile?.role === 'admin' || profile?.role === 'super_admin') && (
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
              <Link to="/catalog" onClick={() => setIsMenuOpen(false)}>Catalog</Link>
              <Link to="/wishlist" onClick={() => setIsMenuOpen(false)}>Wishlist</Link>
              <Link to="/cart" onClick={() => setIsMenuOpen(false)}>Cart</Link>
              {user ? (
                <>
                  <Link to="/profile" onClick={() => setIsMenuOpen(false)}>Profile</Link>
                  <button onClick={() => signOut(auth)} className="text-left text-red-500">Sign Out</button>
                </>
              ) : (
                <Link to="/auth" onClick={() => setIsMenuOpen(false)}>Sign In</Link>
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
            <Route path="/profile" element={<Profile />} />
            <Route path="/admin" element={<AdminDashboard />} />
            <Route path="/auth" element={<Auth />} />
          </Routes>
        </main>

        {/* Footer */}
        <footer className="bg-luxury-gray border-t border-white/5 py-12 px-6 mt-20">
          <div className="max-w-7xl mx-auto grid grid-cols-1 md:grid-cols-4 gap-12">
            <div className="col-span-1 md:col-span-2">
              <div className="flex items-center gap-2 mb-6">
                <div className="w-8 h-8 bg-gold rounded flex items-center justify-center">
                  <BookOpen className="text-luxury-black" size={18} />
                </div>
                <span className="text-xl font-bold tracking-tighter">LUXE<span className="text-gold">BOOKS</span></span>
              </div>
              <p className="text-luxury-accent max-w-md leading-relaxed">
                The world's most exclusive digital and physical bookstore. Curated for the elite, powered by performance.
              </p>
            </div>
            <div>
              <h4 className="font-bold mb-6 text-gold">Explore</h4>
              <ul className="space-y-4 text-luxury-accent">
                <li><Link to="/catalog" className="hover:text-white transition-colors">Catalog</Link></li>
                <li><Link to="/catalog?category=Digital" className="hover:text-white transition-colors">Digital Books</Link></li>
                <li><Link to="/catalog?category=Limited" className="hover:text-white transition-colors">Limited Editions</Link></li>
              </ul>
            </div>
            <div>
              <h4 className="font-bold mb-6 text-gold">Support</h4>
              <ul className="space-y-4 text-luxury-accent">
                <li><a href="#" className="hover:text-white transition-colors">Contact Us</a></li>
                <li><a href="#" className="hover:text-white transition-colors">Shipping Policy</a></li>
                <li><a href="#" className="hover:text-white transition-colors">Terms of Service</a></li>
              </ul>
            </div>
          </div>
          <div className="max-w-7xl mx-auto mt-12 pt-8 border-t border-white/5 text-center text-luxury-accent text-sm">
            © 2026 LuxeBooks Platform. All rights reserved.
          </div>
        </footer>
      </div>
    </Router>
  );
}
