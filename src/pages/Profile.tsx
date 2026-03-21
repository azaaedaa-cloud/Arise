import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { auth, db } from '../firebase';
import { doc, getDoc, collection, query, where, getDocs, orderBy } from 'firebase/firestore';
import { UserProfile, Order, Book } from '../types';
import { motion, AnimatePresence } from 'motion/react';
import { User, Package, Heart, Settings, LogOut, Star, Clock, ChevronRight, BookOpen, Crown, Shield, Zap, Globe } from 'lucide-react';
import { signOut } from 'firebase/auth';
import { useAppContext } from '../contexts/AppContext';

export default function Profile() {
  const { t } = useAppContext();
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [orders, setOrders] = useState<Order[]>([]);
  const [library, setLibrary] = useState<Book[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeView, setActiveView] = useState<'profile' | 'orders' | 'library' | 'wishlist'>('profile');
  const navigate = useNavigate();

  useEffect(() => {
    const fetchProfileData = async () => {
      if (!auth.currentUser) {
        navigate('/auth');
        return;
      }

      try {
        const docRef = doc(db, 'users', auth.currentUser.uid);
        const docSnap = await getDoc(docRef);
        if (docSnap.exists()) {
          const profileData = docSnap.data() as UserProfile;
          setProfile(profileData);

          // Fetch library books
          if (profileData.purchasedBooks && profileData.purchasedBooks.length > 0) {
            const booksRef = collection(db, 'books');
            const qBooks = query(booksRef, where('__name__', 'in', profileData.purchasedBooks));
            const booksSnap = await getDocs(qBooks);
            setLibrary(booksSnap.docs.map(doc => ({ id: doc.id, ...doc.data() } as Book)));
          }
        }

        // Fetch orders
        const q = query(
          collection(db, 'orders'), 
          where('userId', '==', auth.currentUser.uid),
          orderBy('createdAt', 'desc')
        );
        const querySnapshot = await getDocs(q);
        setOrders(querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Order)));
      } catch (error) {
        console.error("Error fetching profile data:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchProfileData();
  }, [navigate]);

  if (loading) return (
    <div className="min-h-screen flex flex-col items-center justify-center gap-8 bg-luxury-black">
      <div className="w-16 h-16 border-2 border-gold border-t-transparent rounded-full animate-spin" />
      <p className="text-gold text-[10px] uppercase tracking-[0.4em] animate-pulse font-accent">Accessing Elite Profile</p>
    </div>
  );

  if (!profile) return null;

  const menuItems = [
    { id: 'profile', label: 'Overview', icon: User },
    { id: 'library', label: 'My Library', icon: BookOpen },
    { id: 'orders', label: 'Order History', icon: Package },
    { id: 'wishlist', label: 'Wishlist', icon: Heart },
  ];

  return (
    <div className="min-h-screen bg-luxury-black pt-32 pb-20 px-6">
      <div className="container mx-auto">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-16">
          {/* Sidebar */}
          <aside className="lg:col-span-3">
            <div className="luxury-card p-10 sticky top-32">
              <div className="flex flex-col items-center text-center mb-12">
                <div className="relative mb-6">
                  <div className="w-32 h-32 border border-gold/20 p-1 group">
                    <img 
                      src={profile.photoURL || `https://i.pravatar.cc/150?u=${profile.uid}`} 
                      className="w-full h-full object-cover grayscale group-hover:grayscale-0 transition-all"
                    />
                  </div>
                  <div className="absolute -bottom-2 -right-2 w-8 h-8 bg-gold flex items-center justify-center border border-luxury-black">
                    <Crown size={14} className="text-black" />
                  </div>
                </div>
                
                <h2 className="text-2xl font-display mb-2">{profile.displayName}</h2>
                <p className="text-luxury-accent text-[10px] uppercase tracking-widest font-accent">{profile.email}</p>
              </div>
              
              <nav className="space-y-2">
                {menuItems.map((item) => (
                  <button 
                    key={item.id}
                    onClick={() => setActiveView(item.id as any)}
                    className={`w-full flex items-center justify-between px-6 py-4 transition-all group ${activeView === item.id ? 'bg-gold text-black' : 'text-luxury-accent hover:text-white hover:bg-white/5'}`}
                  >
                    <div className="flex items-center gap-4">
                      <item.icon size={18} />
                      <span className="text-[11px] font-bold uppercase tracking-[0.2em] font-accent">{item.label}</span>
                    </div>
                    <ChevronRight size={14} className={activeView === item.id ? 'text-black' : 'text-gold/30 group-hover:text-gold'} />
                  </button>
                ))}
                
                <div className="pt-8 mt-8 border-t border-white/5 space-y-2">
                  <button className="w-full flex items-center gap-4 px-6 py-4 text-luxury-accent hover:text-white hover:bg-white/5 transition-all group">
                    <Settings size={18} />
                    <span className="text-[11px] font-bold uppercase tracking-[0.2em] font-accent">Settings</span>
                  </button>
                  <button 
                    onClick={() => signOut(auth)}
                    className="w-full flex items-center gap-4 px-6 py-4 text-red-500/70 hover:text-red-500 hover:bg-red-500/5 transition-all group"
                  >
                    <LogOut size={18} />
                    <span className="text-[11px] font-bold uppercase tracking-[0.2em] font-accent">Sign Out</span>
                  </button>
                </div>
              </nav>
            </div>
          </aside>

          {/* Main Content */}
          <main className="lg:col-span-9">
            <AnimatePresence mode="wait">
              {activeView === 'profile' && (
                <motion.div 
                  key="profile"
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -20 }}
                  className="space-y-12"
                >
                  {/* Header */}
                  <div className="relative p-16 luxury-card overflow-hidden">
                    <div className="absolute top-0 right-0 p-12 opacity-[0.03] -rotate-12">
                      <Crown size={300} />
                    </div>
                    <div className="relative z-10">
                      <h4 className="text-[11px] font-bold uppercase tracking-[0.4em] text-gold mb-6 font-accent">Member Since {new Date(profile.createdAt).getFullYear()}</h4>
                      <h1 className="text-6xl font-display tracking-tight mb-8 leading-tight">
                        WELCOME BACK, <br />
                        <span className="gold-text">SOVEREIGN READER.</span>
                      </h1>
                      <p className="text-luxury-accent text-xl font-light leading-relaxed max-w-2xl italic">
                        "Your pursuit of excellence is reflected in your collection. Continue your ascent through the world's most curated masterpieces."
                      </p>
                    </div>
                  </div>

                  {/* Stats Grid */}
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                    {[
                      { label: "Masterpieces Owned", value: library.length, icon: BookOpen },
                      { label: "Total Acquisitions", value: orders.length, icon: Zap },
                      { label: "Curated Wishlist", value: profile.wishlist.length, icon: Heart },
                    ].map((stat, i) => (
                      <div key={i} className="luxury-card p-10 flex flex-col items-center text-center group hover:border-gold/30 transition-all">
                        <div className="w-12 h-12 border border-white/5 flex items-center justify-center text-gold mb-6 group-hover:border-gold transition-colors">
                          <stat.icon size={20} />
                        </div>
                        <div className="text-4xl font-display mb-2">{stat.value}</div>
                        <div className="text-[10px] font-bold uppercase tracking-[0.3em] text-luxury-accent font-accent">{stat.label}</div>
                      </div>
                    ))}
                  </div>

                  {/* Recent Activity or Featured */}
                  <div className="luxury-card p-12">
                    <h3 className="text-[11px] font-bold uppercase tracking-[0.3em] text-gold mb-12 font-accent">Recent Acquisitions</h3>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
                      {library.slice(0, 4).map((book) => (
                        <div key={book.id} className="group cursor-pointer">
                          <div className="aspect-[3/4] overflow-hidden border border-white/5 mb-4 group-hover:border-gold transition-all">
                            <img 
                              src={book.coverImage} 
                              className="w-full h-full object-cover grayscale group-hover:grayscale-0 transition-all duration-700"
                              referrerPolicy="no-referrer"
                            />
                          </div>
                          <h4 className="text-[10px] font-bold uppercase tracking-widest truncate font-accent">{book.title}</h4>
                        </div>
                      ))}
                      {library.length === 0 && (
                        <div className="col-span-full py-12 text-center border border-dashed border-white/10">
                          <p className="text-luxury-accent text-sm italic">No recent acquisitions found.</p>
                        </div>
                      )}
                    </div>
                  </div>
                </motion.div>
              )}

              {activeView === 'library' && (
                <motion.div 
                  key="library"
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -20 }}
                >
                  <div className="flex items-center justify-between mb-12">
                    <h2 className="text-4xl font-display">My Library</h2>
                    <span className="text-[10px] font-bold uppercase tracking-[0.3em] text-gold font-accent">{library.length} Masterpieces</span>
                  </div>
                  
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-10">
                    {library.length > 0 ? (
                      library.map((book) => (
                        <motion.div 
                          key={book.id}
                          whileHover={{ y: -10 }}
                          className="luxury-card p-8 group"
                        >
                          <div className="aspect-[3/4] overflow-hidden border border-white/5 mb-8 group-hover:border-gold transition-all">
                            <img 
                              src={book.coverImage} 
                              className="w-full h-full object-cover grayscale group-hover:grayscale-0 transition-all duration-700"
                              referrerPolicy="no-referrer"
                            />
                          </div>
                          <h3 className="text-lg font-display mb-2 group-hover:text-gold transition-colors">{book.title}</h3>
                          <p className="text-[10px] uppercase tracking-widest text-luxury-accent mb-8 font-accent">{book.author}</p>
                          <button className="btn-luxury w-full py-4 text-[10px] font-bold uppercase tracking-[0.3em]">Read Masterpiece</button>
                        </motion.div>
                      ))
                    ) : (
                      <div className="col-span-full py-32 text-center luxury-card border-dashed">
                        <BookOpen className="mx-auto text-gold/20 mb-6" size={48} />
                        <p className="text-luxury-accent text-lg italic">Your library is currently empty. Begin your collection in the catalog.</p>
                      </div>
                    )}
                  </div>
                </motion.div>
              )}

              {activeView === 'orders' && (
                <motion.div 
                  key="orders"
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -20 }}
                >
                  <div className="flex items-center justify-between mb-12">
                    <h2 className="text-4xl font-display">Acquisition History</h2>
                    <span className="text-[10px] font-bold uppercase tracking-[0.3em] text-gold font-accent">{orders.length} Orders</span>
                  </div>
                  
                  <div className="space-y-8">
                    {orders.length > 0 ? (
                      orders.map((order) => (
                        <div 
                          key={order.id}
                          className="luxury-card p-10 group hover:border-gold/30 transition-all"
                        >
                          <div className="flex flex-col md:flex-row md:items-center justify-between gap-10 mb-12">
                            <div className="flex items-center gap-6">
                              <div className="w-16 h-16 border border-white/5 flex items-center justify-center text-gold group-hover:border-gold transition-colors">
                                <Clock size={24} />
                              </div>
                              <div>
                                <div className="text-[11px] font-bold uppercase tracking-[0.3em] text-white mb-1 font-accent">Order #{order.id.slice(-8).toUpperCase()}</div>
                                <div className="text-[10px] text-luxury-accent uppercase tracking-widest font-accent">{new Date(order.createdAt).toLocaleDateString()}</div>
                              </div>
                            </div>
                            
                            <div className="flex items-center gap-12">
                              <div className="text-right">
                                <div className="text-[9px] text-luxury-accent uppercase tracking-[0.3em] font-bold mb-2 font-accent">Status</div>
                                <div className="text-xs font-bold uppercase tracking-widest text-emerald-400">{order.status}</div>
                              </div>
                              <div className="text-right">
                                <div className="text-[9px] text-luxury-accent uppercase tracking-[0.3em] font-bold mb-2 font-accent">Investment</div>
                                <div className="text-2xl font-display text-gold">${order.totalAmount.toFixed(2)}</div>
                              </div>
                              <ChevronRight className="text-gold/30 group-hover:text-gold transition-colors" />
                            </div>
                          </div>
                          
                          <div className="flex flex-wrap gap-6">
                            {order.items.map((item, i) => (
                              <div key={i} className="flex items-center gap-4 p-3 border border-white/5 hover:border-gold/20 transition-all">
                                <img 
                                  src={item.coverImage || `https://picsum.photos/seed/${item.bookId}/50/75`} 
                                  className="w-10 h-14 object-cover grayscale group-hover:grayscale-0 transition-all"
                                  referrerPolicy="no-referrer"
                                />
                                <div className="text-[10px] font-bold uppercase tracking-widest max-w-[120px] truncate font-accent">{item.title}</div>
                              </div>
                            ))}
                          </div>
                        </div>
                      ))
                    ) : (
                      <div className="py-32 text-center luxury-card border-dashed">
                        <Package className="mx-auto text-gold/20 mb-6" size={48} />
                        <p className="text-luxury-accent text-lg italic">No acquisition history found.</p>
                      </div>
                    )}
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </main>
        </div>
      </div>
    </div>
  );
}
