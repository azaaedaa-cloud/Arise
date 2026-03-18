import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { auth, db } from '../firebase';
import { doc, getDoc, collection, query, where, getDocs, orderBy } from 'firebase/firestore';
import { UserProfile, Order } from '../types';
import { motion } from 'motion/react';
import { User, Package, Heart, Settings, LogOut, Star, Clock, ChevronRight, BookOpen } from 'lucide-react';
import { Book } from '../types';
import { signOut } from 'firebase/auth';

export default function Profile() {
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
    <div className="max-w-7xl mx-auto px-6 py-40 flex flex-col items-center justify-center gap-8">
      <div className="w-16 h-16 border-4 border-gold border-t-transparent rounded-full animate-spin" />
      <p className="text-luxury-accent animate-pulse">Loading your elite profile...</p>
    </div>
  );

  if (!profile) return null;

  return (
    <div className="max-w-7xl mx-auto px-6 py-20">
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-12">
        {/* Sidebar */}
        <aside className="lg:col-span-1">
          <div className="glass p-8 rounded-[2.5rem] border-white/5 text-center">
            <div className="relative inline-block mb-6">
              <div className="w-32 h-32 rounded-full overflow-hidden border-4 border-gold/20 p-1">
                <img 
                  src={profile.photoURL || `https://i.pravatar.cc/150?u=${profile.uid}`} 
                  className="w-full h-full object-cover rounded-full"
                />
              </div>
              <div className="absolute bottom-2 right-2 w-6 h-6 bg-gold rounded-full flex items-center justify-center border-2 border-luxury-black">
                <Star size={12} fill="currentColor" className="text-luxury-black" />
              </div>
            </div>
            
            <h2 className="text-2xl font-bold mb-1">{profile.displayName}</h2>
            <p className="text-luxury-accent text-sm mb-8">{profile.email}</p>
            
            <div className="flex flex-col gap-2">
              <button 
                onClick={() => setActiveView('profile')}
                className={`flex items-center gap-3 px-6 py-3 rounded-xl transition-all font-bold ${activeView === 'profile' ? 'bg-gold/10 text-gold border border-gold/20' : 'hover:bg-white/5 text-luxury-accent hover:text-white'}`}
              >
                <User size={18} /> Profile Info
              </button>
              <button 
                onClick={() => setActiveView('library')}
                className={`flex items-center gap-3 px-6 py-3 rounded-xl transition-all font-bold ${activeView === 'library' ? 'bg-gold/10 text-gold border border-gold/20' : 'hover:bg-white/5 text-luxury-accent hover:text-white'}`}
              >
                <BookOpen size={18} /> My Library
              </button>
              <button 
                onClick={() => setActiveView('orders')}
                className={`flex items-center gap-3 px-6 py-3 rounded-xl transition-all font-bold ${activeView === 'orders' ? 'bg-gold/10 text-gold border border-gold/20' : 'hover:bg-white/5 text-luxury-accent hover:text-white'}`}
              >
                <Package size={18} /> My Orders
              </button>
              <button 
                onClick={() => setActiveView('wishlist')}
                className={`flex items-center gap-3 px-6 py-3 rounded-xl transition-all font-bold ${activeView === 'wishlist' ? 'bg-gold/10 text-gold border border-gold/20' : 'hover:bg-white/5 text-luxury-accent hover:text-white'}`}
              >
                <Heart size={18} /> Wishlist
              </button>
              <button className="flex items-center gap-3 px-6 py-3 rounded-xl hover:bg-white/5 text-luxury-accent hover:text-white transition-all">
                <Settings size={18} /> Settings
              </button>
              <button 
                onClick={() => signOut(auth)}
                className="flex items-center gap-3 px-6 py-3 rounded-xl hover:bg-red-500/10 text-red-500 transition-all mt-4"
              >
                <LogOut size={18} /> Sign Out
              </button>
            </div>
          </div>
        </aside>

        {/* Main Content */}
        <div className="lg:col-span-3 space-y-12">
          {activeView === 'profile' && (
            <>
              {/* Welcome Card */}
              <div className="relative glass-gold p-12 rounded-[3rem] border-gold/20 overflow-hidden">
                <div className="absolute top-0 right-0 p-12 opacity-10">
                  <Star size={120} />
                </div>
                <div className="relative z-10">
                  <h1 className="text-4xl font-bold tracking-tighter mb-4">WELCOME BACK, <span className="text-gold">ELITE READER</span></h1>
                  <p className="text-luxury-accent max-w-xl leading-relaxed">
                    You have been a member since {new Date(profile.createdAt).toLocaleDateString()}. Your current status is <span className="text-gold font-bold">PREMIUM</span>.
                  </p>
                </div>
              </div>

              {/* Quick Stats */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="glass p-8 rounded-3xl border-white/5 text-center">
                  <div className="text-3xl font-bold text-gold mb-1">{library.length}</div>
                  <div className="text-xs text-luxury-accent uppercase tracking-widest font-bold">Masterpieces Owned</div>
                </div>
                <div className="glass p-8 rounded-3xl border-white/5 text-center">
                  <div className="text-3xl font-bold text-gold mb-1">{orders.length}</div>
                  <div className="text-xs text-luxury-accent uppercase tracking-widest font-bold">Total Orders</div>
                </div>
                <div className="glass p-8 rounded-3xl border-white/5 text-center">
                  <div className="text-3xl font-bold text-gold mb-1">{profile.wishlist.length}</div>
                  <div className="text-xs text-luxury-accent uppercase tracking-widest font-bold">Wishlist Items</div>
                </div>
              </div>
            </>
          )}

          {activeView === 'library' && (
            <section>
              <h2 className="text-2xl font-bold mb-8 flex items-center gap-3">
                <BookOpen className="text-gold" />
                MY ELITE LIBRARY
              </h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                {library.length > 0 ? (
                  library.map((book) => (
                    <motion.div 
                      key={book.id}
                      initial={{ opacity: 0, scale: 0.9 }}
                      animate={{ opacity: 1, scale: 1 }}
                      className="glass p-6 rounded-3xl border-white/5 hover:border-gold/30 transition-all group"
                    >
                      <img 
                        src={book.coverImage} 
                        className="w-full aspect-[3/4] object-cover rounded-2xl mb-4 shadow-xl"
                        referrerPolicy="no-referrer"
                      />
                      <h3 className="font-bold mb-1 truncate group-hover:text-gold transition-colors">{book.title}</h3>
                      <p className="text-xs text-luxury-accent mb-4">{book.author}</p>
                      <button className="btn-gold w-full py-2 text-xs">Read Now</button>
                    </motion.div>
                  ))
                ) : (
                  <div className="col-span-full text-center py-20 glass rounded-3xl border-dashed border-white/10">
                    <p className="text-luxury-accent">Your library is empty. Start your ascent in the catalog.</p>
                  </div>
                )}
              </div>
            </section>
          )}

          {activeView === 'orders' && (
            <section>
              <h2 className="text-2xl font-bold mb-8 flex items-center gap-3">
                <Package className="text-gold" />
                ORDER HISTORY
              </h2>
              
              <div className="space-y-6">
                {orders.length > 0 ? (
                  orders.map((order) => (
                    <motion.div 
                      key={order.id}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      className="glass p-8 rounded-3xl border-white/5 hover:border-white/10 transition-all group"
                    >
                      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-8">
                        <div className="flex items-center gap-4">
                          <div className="w-12 h-12 glass rounded-xl flex items-center justify-center text-gold">
                            <Clock size={24} />
                          </div>
                          <div>
                            <div className="font-bold">Order #{order.id.slice(-8).toUpperCase()}</div>
                            <div className="text-xs text-luxury-accent">{new Date(order.createdAt).toLocaleDateString()}</div>
                          </div>
                        </div>
                        <div className="flex items-center gap-8">
                          <div className="text-right">
                            <div className="text-xs text-luxury-accent uppercase tracking-widest font-bold mb-1">Status</div>
                            <div className="text-emerald-400 font-bold uppercase text-sm">{order.status}</div>
                          </div>
                          <div className="text-right">
                            <div className="text-xs text-luxury-accent uppercase tracking-widest font-bold mb-1">Total</div>
                            <div className="text-xl font-bold text-gold">${order.totalAmount.toFixed(2)}</div>
                          </div>
                          <ChevronRight className="text-luxury-accent group-hover:text-gold transition-colors" />
                        </div>
                      </div>
                      
                      <div className="flex flex-wrap gap-4">
                        {order.items.map((item, i) => (
                          <div key={i} className="flex items-center gap-3 bg-white/5 p-2 rounded-xl border border-white/5">
                            <img 
                              src={item.coverImage || `https://picsum.photos/seed/${item.bookId}/50/75`} 
                              className="w-10 h-14 object-cover rounded shadow-lg"
                              referrerPolicy="no-referrer"
                            />
                            <div className="text-xs font-bold max-w-[100px] truncate">{item.title}</div>
                          </div>
                        ))}
                      </div>
                    </motion.div>
                  ))
                ) : (
                  <div className="text-center py-20 glass rounded-3xl border-dashed border-white/10">
                    <p className="text-luxury-accent">You haven't placed any elite orders yet.</p>
                  </div>
                )}
              </div>
            </section>
          )}
        </div>
      </div>
    </div>
  );
}
