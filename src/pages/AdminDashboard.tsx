import { useState, useEffect } from 'react';
import { collection, addDoc, updateDoc, deleteDoc, doc, query, orderBy, getDoc, onSnapshot } from 'firebase/firestore';
import { db, auth } from '../firebase';
import { Book, UserProfile, Order, OrderItem } from '../types';
import { motion, AnimatePresence } from 'motion/react';
import { Plus, Edit2, Trash2, Save, X, BookOpen, LayoutDashboard, Users, ShoppingBag, BarChart3, Star, Crown, ShieldAlert, TrendingUp, Search, Filter, AlertTriangle, Check, ChevronDown } from 'lucide-react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, AreaChart, Area, BarChart, Bar, Cell, PieChart, Pie } from 'recharts';
import { toast } from 'react-hot-toast';
import { UserRole, UserPermissions } from '../types';
import { useNavigate } from 'react-router-dom';
import confetti from 'canvas-confetti';
import { sounds } from '../utils/interactions';

export default function AdminDashboard() {
  const [books, setBooks] = useState<Book[]>([]);
  const [users, setUsers] = useState<UserProfile[]>([]);
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [userRole, setUserRole] = useState<UserRole>('user');
  const [userPermissions, setUserPermissions] = useState<UserPermissions | null>(null);
  const [isAdding, setIsAdding] = useState(false);
  const [isGranting, setIsGranting] = useState(false);
  const [selectedUserForGrant, setSelectedUserForGrant] = useState<UserProfile | null>(null);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'products' | 'users' | 'orders' | 'analytics'>('products');
  const [searchQuery, setSearchQuery] = useState('');
  const [filterTier, setFilterTier] = useState<string>('all');
  const [formData, setFormData] = useState<Partial<Book>>({
    title: '',
    author: '',
    description: '',
    price: 0,
    category: 'Fiction',
    coverImage: '',
    rating: 5,
    reviewCount: 0,
    stock: 10,
    isDigital: false,
    tier: 'growth'
  });

  const navigate = useNavigate();

  useEffect(() => {
    const checkAdmin = async () => {
      if (!auth.currentUser) {
        navigate('/auth');
        return;
      }
      const docRef = doc(db, 'users', auth.currentUser.uid);
      const docSnap = await getDoc(docRef);
      if (docSnap.exists()) {
        const data = docSnap.data();
        const role = data.role as UserRole;
        const perms = data.permissions as UserPermissions;
        if (role !== 'user') {
          setUserRole(role);
          setUserPermissions(perms);
          
          // Real-time listeners
          const unsubBooks = onSnapshot(query(collection(db, 'books'), orderBy('title')), (snapshot) => {
            setBooks(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Book)));
            setLoading(false);
          });

          const unsubUsers = onSnapshot(collection(db, 'users'), (snapshot) => {
            setUsers(snapshot.docs.map(doc => ({ uid: doc.id, ...doc.data() } as UserProfile)));
          });

          const unsubOrders = onSnapshot(query(collection(db, 'orders'), orderBy('createdAt', 'desc')), (snapshot) => {
            setOrders(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Order)));
          });

          return () => {
            unsubBooks();
            unsubUsers();
            unsubOrders();
          };
        } else {
          navigate('/');
        }
      } else {
        navigate('/');
      }
    };
    checkAdmin();
  }, [navigate]);

  const handleUpdateOrderStatus = async (orderId: string, newStatus: string) => {
    try {
      await updateDoc(doc(db, 'orders', orderId), { status: newStatus });
      sounds.success.play();
      toast.success(`Order status updated to ${newStatus}`);
    } catch (error) {
      console.error("Error updating order status:", error);
      toast.error("Failed to update order status");
    }
  };

  const handleGrantAccess = async (userId: string, bookId: string) => {
    try {
      const userRef = doc(db, 'users', userId);
      const userSnap = await getDoc(userRef);
      if (userSnap.exists()) {
        const currentPurchased = userSnap.data().purchasedBooks || [];
        if (!currentPurchased.includes(bookId)) {
          await updateDoc(userRef, {
            purchasedBooks: [...currentPurchased, bookId]
          });
          sounds.success.play();
          confetti({ colors: ['#D4AF37'] });
          toast.success("Access granted successfully");
        } else {
          toast.error("User already has access to this masterpiece");
        }
      }
    } catch (error) {
      console.error("Error granting access:", error);
      toast.error("Failed to grant access");
    }
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (editingId) {
        // تعديل منتج موجود (تغيير سعر، غلاف، الخ)
        await updateDoc(doc(db, 'books', editingId), formData);
        toast.success("تم تحديث بيانات المنتج (السعر/الغلاف/إلخ)");
      } else {
        // إضافة منتج جديد كلياً
        await addDoc(collection(db, 'books'), {
          ...formData,
          rating: 5,
          reviewCount: 0,
          createdAt: new Date().toISOString()
        });
        toast.success("تمت إضافة المنتج الجديد بنجاح");
      }
      
      confetti({ particleCount: 100, spread: 70, origin: { y: 0.6 }, colors: ['#D4AF37', '#ffffff'] });
      sounds.success.play();
      
      // إغلاق النموذج وتفريغ البيانات
      setIsAdding(false);
      setEditingId(null);
      setFormData({ title: '', author: '', description: '', price: 0, category: 'Fiction', stock: 10, isDigital: false, tier: 'growth', coverImage: '' });
    } catch (error) {
      console.error("Error saving book:", error);
      toast.error("حدث خطأ أثناء حفظ المنتج");
    }
  };

  const handleDelete = async (id: string) => {
    if (!window.confirm("Are you sure you want to delete this masterpiece?")) return;
    try {
      await deleteDoc(doc(db, 'books', id));
      toast.success("Masterpiece removed from collection");
    } catch (error) {
      console.error("Error deleting book:", error);
      toast.error("Failed to delete masterpiece");
    }
  };

  const handleDeleteUser = async (uid: string) => {
    if (uid === auth.currentUser?.uid) {
      toast.error("لا يمكنك حذف حسابك الشخصي من هنا.");
      return;
    }
    
    if (!window.confirm("هل أنت متأكد من حذف هذا المستخدم نهائياً؟ سيتم مسح كل بياناته.")) return;
    
    try {
      await deleteDoc(doc(db, 'users', uid));
      toast.success("تم إزالة المستخدم تماماً");
      sounds.success.play();
    } catch (error) {
      console.error("Error deleting user:", error);
      toast.error("فشل في إزالة المستخدم");
    }
  };

  const handleUpdateUserRole = async (uid: string, newRole: UserRole) => {
    if (!hasAccess('manageUsers')) return;
    if (newRole === 'super_admin' && userRole !== 'super_admin') {
      toast.error("Only Super Admins can promote to Super Admin");
      return;
    }
    try {
      await updateDoc(doc(db, 'users', uid), { role: newRole });
      sounds.success.play();
      toast.success(`User role updated to ${newRole}`);
    } catch (error) {
      console.error("Error updating user role:", error);
      toast.error("Failed to update user role");
    }
  };

  const handleUpdateUserPermissions = async (uid: string, perms: Partial<UserPermissions>) => {
    if (!hasAccess('manageUsers')) return;
    try {
      const userRef = doc(db, 'users', uid);
      const userSnap = await getDoc(userRef);
      if (userSnap.exists()) {
        const currentPerms = userSnap.data().permissions || {
          manageProducts: false,
          manageOrders: false,
          manageUsers: false,
          viewAnalytics: false
        };
        await updateDoc(userRef, { permissions: { ...currentPerms, ...perms } });
        sounds.success.play();
        toast.success("Permissions updated");
      }
    } catch (error) {
      console.error("Error updating permissions:", error);
      toast.error("Failed to update permissions");
    }
  };

  const filteredBooks = books.filter(book => 
    (book.title.toLowerCase().includes(searchQuery.toLowerCase()) || book.author.toLowerCase().includes(searchQuery.toLowerCase())) &&
    (filterTier === 'all' || book.tier === filterTier)
  );

  const filteredUsers = users.filter(user => 
    user.displayName?.toLowerCase().includes(searchQuery.toLowerCase()) || 
    user.email.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const getAnalyticsData = () => {
    // Sales Trends (last 7 days)
    const last7Days = [...Array(7)].map((_, i) => {
      const d = new Date();
      d.setDate(d.getDate() - i);
      return d.toLocaleDateString('en-US', { weekday: 'short' });
    }).reverse();

    const salesByDay = last7Days.map(day => {
      const amount = orders
        .filter(o => new Date(o.createdAt).toLocaleDateString('en-US', { weekday: 'short' }) === day)
        .reduce((sum, o) => sum + o.totalAmount, 0);
      return { name: day, amount };
    });

    // User Growth (last 5 months)
    const last5Months = [...Array(5)].map((_, i) => {
      const d = new Date();
      d.setMonth(d.getMonth() - i);
      return d.toLocaleDateString('en-US', { month: 'short' });
    }).reverse();

    const growthByMonth = last5Months.map(month => {
      const count = users.filter(u => new Date(u.createdAt).toLocaleDateString('en-US', { month: 'short' }) === month).length;
      return { name: month, users: count };
    });

    // Category Distribution
    const categoryCounts: Record<string, number> = {};
    books.forEach(book => {
      categoryCounts[book.category] = (categoryCounts[book.category] || 0) + 1;
    });
    const categories = Object.entries(categoryCounts).map(([name, value]) => ({ name, value }));

    return {
      sales: salesByDay,
      growth: growthByMonth,
      categories: categories.length > 0 ? categories : [{ name: 'None', value: 1 }]
    };
  };

  const analytics = getAnalyticsData();

  const COLORS = ['#D4AF37', '#E5E7EB', '#9CA3AF', '#4B5563'];

  const hasAccess = (permission: keyof UserPermissions) => {
    if (userRole === 'super_admin') return true;
    if (userRole === 'admin') return true;
    return userPermissions?.[permission] || false;
  };

  const seedData = async () => {
    const sampleBooks = [
      {
        title: "The Sovereign Individual",
        author: "James Dale Davidson",
        description: "Mastering the Transition to the Information Age.",
        price: 45.99,
        category: "Philosophy",
        coverImage: "https://picsum.photos/seed/sovereign/400/600",
        rating: 4.9,
        reviewCount: 128,
        stock: 50,
        isDigital: false,
        tier: 'power'
      },
      {
        title: "Zero to One",
        author: "Peter Thiel",
        description: "Notes on Startups, or How to Build the Future.",
        price: 29.99,
        category: "Business",
        coverImage: "https://picsum.photos/seed/zero/400/600",
        rating: 4.8,
        reviewCount: 256,
        stock: 100,
        isDigital: true,
        tier: 'growth'
      },
      {
        title: "Meditations",
        author: "Marcus Aurelius",
        description: "The classic stoic masterpiece for elite leaders.",
        price: 19.99,
        category: "Philosophy",
        coverImage: "https://picsum.photos/seed/meditations/400/600",
        rating: 5.0,
        reviewCount: 512,
        stock: 200,
        isDigital: true,
        tier: 'wealth'
      }
    ];

    for (const book of sampleBooks) {
      await addDoc(collection(db, 'books'), book);
    }
    sounds.success.play();
    confetti({ colors: ['#D4AF37'] });
  };

  if (userRole === 'user') return null;

  return (
    <div className="min-h-screen bg-luxury-black pt-32 pb-20 px-6">
      <div className="container mx-auto">
        <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-12 mb-20">
          <div>
            <h4 className="text-[11px] font-bold uppercase tracking-[0.4em] text-gold mb-6 font-accent">System Control</h4>
            <h1 className="text-6xl font-display tracking-tight leading-tight flex items-center gap-6">
              {userRole === 'super_admin' ? <Crown className="text-gold" size={48} /> : <LayoutDashboard className="text-gold" size={48} />}
              {userRole === 'super_admin' ? 'SUPER' : 'ELITE'} <span className="gold-text">DASHBOARD</span>
            </h1>
            <p className="text-luxury-accent mt-6 text-lg italic font-light max-w-2xl">
              {auth.currentUser?.email === 'azaaedaa@gmail.com' 
                ? '"Welcome back, Architect. The empire is yours to command."' 
                : '"Command the flow of knowledge and power with absolute precision."'}
            </p>
          </div>
          
          <div className="flex flex-wrap items-center gap-6">
            <button onClick={seedData} className="text-[10px] font-bold uppercase tracking-widest text-luxury-accent hover:text-gold transition-colors font-accent border border-white/10 px-6 py-3">Seed Data</button>
            <button 
              onClick={() => {
                const url = `${window.location.origin}/auth`;
                navigator.clipboard.writeText(url);
                toast.success("Registration link copied. Ask the new admin to sign up, then promote them here.");
              }}
              className="text-[10px] font-bold uppercase tracking-widest text-luxury-accent hover:text-gold transition-colors font-accent border border-white/10 px-6 py-3 flex items-center gap-2"
            >
              <Plus size={14} />
              Invite Admin
            </button>
            <div className="border border-white/10 p-1 flex">
              <button 
                onClick={() => setActiveTab('products')}
                className={`px-6 py-3 text-[10px] font-bold uppercase tracking-widest transition-all font-accent ${activeTab === 'products' ? 'bg-gold text-black' : 'text-luxury-accent hover:text-white'}`}
              >
                Products
              </button>
              {hasAccess('manageUsers') && (
                <button 
                  onClick={() => setActiveTab('users')}
                  className={`px-6 py-3 text-[10px] font-bold uppercase tracking-widest transition-all font-accent ${activeTab === 'users' ? 'bg-gold text-black' : 'text-luxury-accent hover:text-white'}`}
                >
                  Users
                </button>
              )}
              {hasAccess('manageOrders') && (
                <button 
                  onClick={() => setActiveTab('orders')}
                  className={`px-6 py-3 text-[10px] font-bold uppercase tracking-widest transition-all font-accent ${activeTab === 'orders' ? 'bg-gold text-black' : 'text-luxury-accent hover:text-white'}`}
                >
                  Orders
                </button>
              )}
              {hasAccess('viewAnalytics') && (
                <button 
                  onClick={() => setActiveTab('analytics')}
                  className={`px-6 py-3 text-[10px] font-bold uppercase tracking-widest transition-all font-accent ${activeTab === 'analytics' ? 'bg-gold text-black' : 'text-luxury-accent hover:text-white'}`}
                >
                  Analytics
                </button>
              )}
            </div>
            {hasAccess('manageProducts') && (
              <button onClick={() => setIsAdding(true)} className="btn-luxury flex items-center gap-3 px-8 py-4">
                <Plus size={20} />
                <span className="text-[11px] font-bold uppercase tracking-[0.3em]">Add Masterpiece</span>
              </button>
            )}
          </div>
        </div>

        {/* Search & Filter Bar */}
        {(activeTab === 'products' || activeTab === 'users') && (
          <div className="flex flex-col md:flex-row gap-6 mb-12">
            <div className="flex-1 relative">
              <Search className="absolute left-6 top-1/2 -translate-y-1/2 text-gold/50" size={18} />
              <input 
                type="text" 
                placeholder={`Search ${activeTab}...`}
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full bg-white/5 border border-white/10 pl-16 pr-6 py-4 outline-none focus:border-gold transition-all font-accent text-sm tracking-widest"
              />
            </div>
            {activeTab === 'products' && (
              <div className="flex items-center gap-4 border border-white/10 px-6 py-4">
                <Filter size={18} className="text-gold/50" />
                <select 
                  value={filterTier}
                  onChange={(e) => setFilterTier(e.target.value)}
                  className="bg-transparent text-[10px] font-bold uppercase tracking-widest outline-none cursor-pointer font-accent"
                >
                  <option value="all">All Tiers</option>
                  <option value="poverty">Poverty</option>
                  <option value="growth">Growth</option>
                  <option value="wealth">Wealth</option>
                  <option value="power">Power</option>
                </select>
              </div>
            )}
          </div>
        )}

        {/* Stats Overview */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8 mb-20">
          <div className="luxury-card p-10">
            <div className="flex items-center justify-between mb-8">
              <div className="w-12 h-12 border border-gold/20 flex items-center justify-center text-gold">
                <ShoppingBag size={24} />
              </div>
              <span className="text-[10px] font-bold text-green-500 uppercase tracking-[0.3em] font-accent">+12%</span>
            </div>
            <div className="text-4xl font-display mb-2">{books.length}</div>
            <div className="text-[10px] text-luxury-accent uppercase tracking-[0.3em] font-bold font-accent">Total Masterpieces</div>
          </div>
          
          <div className="luxury-card p-10">
            <div className="flex items-center justify-between mb-8">
              <div className="w-12 h-12 border border-gold/20 flex items-center justify-center text-gold">
                <Users size={24} />
              </div>
              <span className="text-[10px] font-bold text-gold uppercase tracking-[0.3em] font-accent">Active</span>
            </div>
            <div className="text-4xl font-display mb-2">{users.length || '---'}</div>
            <div className="text-[10px] text-luxury-accent uppercase tracking-[0.3em] font-bold font-accent">Elite Members</div>
          </div>
          
          <div className="luxury-card p-10">
            <div className="flex items-center justify-between mb-8">
              <div className="w-12 h-12 border border-gold/20 flex items-center justify-center text-gold">
                <BarChart3 size={24} />
              </div>
              <span className="text-[10px] font-bold text-gold uppercase tracking-[0.3em] font-accent">Revenue</span>
            </div>
            <div className="text-4xl font-display mb-2">$12.4K</div>
            <div className="text-[10px] text-luxury-accent uppercase tracking-[0.3em] font-bold font-accent">Total Sales</div>
          </div>
          
          <div className="luxury-card p-10">
            <div className="flex items-center justify-between mb-8">
              <div className="w-12 h-12 border border-gold/20 flex items-center justify-center text-gold">
                <Star size={24} />
              </div>
              <span className="text-[10px] font-bold text-gold uppercase tracking-[0.3em] font-accent">Top Rated</span>
            </div>
            <div className="text-4xl font-display mb-2">4.9</div>
            <div className="text-[10px] text-luxury-accent uppercase tracking-[0.3em] font-bold font-accent">Avg. Satisfaction</div>
          </div>
        </div>

      {activeTab === 'products' ? (
        <div className="luxury-card overflow-hidden">
          <div className="p-10 border-b border-white/5 flex items-center justify-between">
            <h2 className="text-2xl font-display">Collection Management</h2>
            <div className="text-[10px] font-bold uppercase tracking-widest text-gold font-accent">{filteredBooks.length} Masterpieces</div>
          </div>
          
          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead className="bg-white/5 text-[10px] uppercase tracking-[0.3em] text-luxury-accent font-accent">
                <tr>
                  <th className="px-10 py-8">Masterpiece</th>
                  <th className="px-10 py-8">Tier</th>
                  <th className="px-10 py-8">Price</th>
                  <th className="px-10 py-8">Stock</th>
                  <th className="px-10 py-8 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5">
                {loading ? (
                  Array(5).fill(0).map((_, i) => (
                    <tr key={i} className="animate-pulse">
                      <td colSpan={5} className="px-10 py-12"><div className="h-4 bg-white/5 rounded w-full" /></td>
                    </tr>
                  ))
                ) : filteredBooks.map((book) => (
                  <tr key={book.id} className="hover:bg-white/5 transition-colors group">
                    <td className="px-10 py-8">
                      <div className="flex items-center gap-6">
                        <div className="w-12 h-16 border border-white/5 overflow-hidden group-hover:border-gold transition-all">
                          <img src={book.coverImage || `https://picsum.photos/seed/${book.id}/100/150`} className="w-full h-full object-cover grayscale group-hover:grayscale-0 transition-all duration-500" referrerPolicy="no-referrer" />
                        </div>
                        <div>
                          <div className="text-lg font-display group-hover:text-gold transition-colors">{book.title}</div>
                          <div className="text-[10px] font-bold uppercase tracking-widest text-luxury-accent font-accent">{book.author}</div>
                        </div>
                      </div>
                    </td>
                    <td className="px-10 py-8">
                      <span className="text-[9px] font-bold border border-gold/20 text-gold px-3 py-1 uppercase tracking-widest font-accent">
                        {book.tier}
                      </span>
                    </td>
                    <td className="px-10 py-8 font-display text-lg">${book.price}</td>
                    <td className="px-10 py-8">
                      <div className="flex items-center gap-3 font-accent text-sm tracking-widest">
                        {book.stock}
                        {book.stock < 5 && <AlertTriangle size={14} className="text-red-500 animate-pulse" />}
                      </div>
                    </td>
                    <td className="px-10 py-8 text-right">
                      <div className="flex items-center justify-end gap-4">
                        {hasAccess('manageProducts') && (
                          <>
                            <button onClick={() => { setEditingId(book.id); setFormData(book); setIsAdding(true); }} className="p-3 border border-white/5 hover:border-gold hover:text-gold transition-all"><Edit2 size={16} /></button>
                            <button onClick={() => handleDelete(book.id)} className="p-3 border border-white/5 hover:border-red-500 hover:text-red-500 transition-all"><Trash2 size={16} /></button>
                          </>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      ) : activeTab === 'users' ? (
        <div className="luxury-card overflow-hidden">
          <div className="p-10 border-b border-white/5 flex items-center justify-between">
            <h2 className="text-2xl font-display">User Management</h2>
            <div className="text-[10px] font-bold uppercase tracking-widest text-gold font-accent">{filteredUsers.length} Elite Members</div>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead className="bg-white/5 text-[10px] uppercase tracking-[0.3em] text-luxury-accent font-accent">
                <tr>
                  <th className="px-10 py-8">User</th>
                  <th className="px-10 py-8">Role & Permissions</th>
                  <th className="px-10 py-8">Joined</th>
                  <th className="px-10 py-8 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5">
                {filteredUsers.map((user) => (
                  <tr key={user.uid} className="hover:bg-white/5 transition-colors group">
                    <td className="px-10 py-8">
                      <div className="flex items-center gap-6">
                        <div className="w-12 h-12 border border-gold/20 flex items-center justify-center font-display text-xl text-gold">{user.displayName ? user.displayName[0] : '?'}</div>
                        <div>
                          <div className="text-lg font-display">{user.displayName || 'Elite Member'}</div>
                          <div className="text-[10px] font-bold uppercase tracking-widest text-luxury-accent font-accent">{user.email}</div>
                        </div>
                      </div>
                    </td>
                    <td className="px-10 py-8">
                      <div className="flex flex-col gap-4">
                        <select 
                          value={user.role}
                          onChange={(e) => handleUpdateUserRole(user.uid, e.target.value as UserRole)}
                          className="bg-transparent text-gold font-bold text-[10px] uppercase tracking-widest outline-none cursor-pointer font-accent"
                          disabled={user.uid === auth.currentUser?.uid || !hasAccess('manageUsers')}
                        >
                          <option value="user">User</option>
                          <option value="support">Support</option>
                          <option value="editor">Editor</option>
                          <option value="admin">Admin</option>
                          <option value="super_admin">Super Admin</option>
                        </select>
                        
                        {user.role !== 'super_admin' && user.role !== 'user' && hasAccess('manageUsers') && (
                          <div className="flex flex-wrap gap-2">
                            {[
                              { id: 'manageProducts', label: 'Products' },
                              { id: 'manageOrders', label: 'Orders' },
                              { id: 'manageUsers', label: 'Users' },
                              { id: 'viewAnalytics', label: 'Analytics' }
                            ].map(perm => (
                              <button 
                                key={perm.id}
                                onClick={() => handleUpdateUserPermissions(user.uid, { [perm.id]: !user.permissions?.[perm.id as keyof UserPermissions] })}
                                className={`text-[8px] px-2 py-1 border transition-all uppercase tracking-widest font-accent ${user.permissions?.[perm.id as keyof UserPermissions] ? 'bg-gold/10 border-gold text-gold' : 'border-white/5 text-luxury-accent'}`}
                              >
                                {perm.label}
                              </button>
                            ))}
                          </div>
                        )}
                      </div>
                    </td>
                    <td className="px-10 py-8 text-[10px] font-bold uppercase tracking-widest text-luxury-accent font-accent">{new Date(user.createdAt).toLocaleDateString()}</td>
                    <td className="px-10 py-8 text-right">
                      <div className="flex items-center justify-end gap-4">
                        {hasAccess('manageUsers') && (
                          <button onClick={() => { setSelectedUserForGrant(user); setIsGranting(true); }} className="px-6 py-3 border border-white/5 hover:border-gold hover:text-gold transition-all flex items-center gap-3 text-[10px] font-bold uppercase tracking-widest font-accent">
                            <BookOpen size={16} />
                            Grant Access
                          </button>
                        )}
                        {user.uid !== auth.currentUser?.uid && userRole === 'super_admin' && (
                          <button 
                            onClick={() => handleDeleteUser(user.uid)}
                            className="p-3 border border-white/5 hover:border-red-500 hover:text-red-500 transition-all"
                            title="إزالة المستخدم تماماً"
                          >
                            <Trash2 size={16} />
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      ) : activeTab === 'orders' ? (
        <div className="luxury-card overflow-hidden">
          <div className="p-10 border-b border-white/5 flex items-center justify-between">
            <h2 className="text-2xl font-display">Order Management</h2>
            <div className="text-[10px] font-bold uppercase tracking-widest text-gold font-accent">{orders.length} Total Orders</div>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead className="bg-white/5 text-[10px] uppercase tracking-[0.3em] text-luxury-accent font-accent">
                <tr>
                  <th className="px-10 py-8">Order ID</th>
                  <th className="px-10 py-8">Items</th>
                  <th className="px-10 py-8">Total</th>
                  <th className="px-10 py-8">Status</th>
                  <th className="px-10 py-8">Date</th>
                  <th className="px-10 py-8 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5">
                {orders.map((order) => (
                  <tr key={order.id} className="hover:bg-white/5 transition-colors group">
                    <td className="px-10 py-8 font-accent text-[10px] text-gold tracking-widest">#{order.id.slice(0, 8)}</td>
                    <td className="px-10 py-8">
                      <div className="flex flex-col gap-2">
                        {order.items.map((item, idx) => (
                          <div key={idx} className="text-[11px] font-light tracking-widest uppercase">{item.quantity}x {item.title}</div>
                        ))}
                      </div>
                    </td>
                    <td className="px-10 py-8 font-display text-lg">${order.totalAmount}</td>
                    <td className="px-10 py-8">
                      <select 
                        value={order.status}
                        onChange={(e) => handleUpdateOrderStatus(order.id, e.target.value)}
                        className="bg-transparent text-gold font-bold text-[10px] uppercase tracking-widest outline-none cursor-pointer font-accent"
                        disabled={!hasAccess('manageOrders')}
                      >
                        <option value="pending">Pending</option>
                        <option value="paid">Paid</option>
                        <option value="shipped">Shipped</option>
                        <option value="delivered">Delivered</option>
                        <option value="cancelled">Cancelled</option>
                      </select>
                    </td>
                    <td className="px-10 py-8 text-[10px] font-bold uppercase tracking-widest text-luxury-accent font-accent">{new Date(order.createdAt).toLocaleDateString()}</td>
                    <td className="px-10 py-8 text-right">
                      {hasAccess('manageOrders') && (
                        <button className="p-3 border border-white/5 hover:border-gold hover:text-gold transition-all"><Edit2 size={16} /></button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      ) : (
        <div className="space-y-12">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
            <div className="luxury-card p-12">
              <h3 className="text-2xl font-display mb-12 flex items-center gap-4">
                <TrendingUp className="text-gold" />
                Sales Trends
              </h3>
              <div className="h-80 w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={analytics.sales}>
                    <defs>
                      <linearGradient id="colorAmount" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#D4AF37" stopOpacity={0.3}/>
                        <stop offset="95%" stopColor="#D4AF37" stopOpacity={0}/>
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke="#ffffff05" vertical={false} />
                    <XAxis dataKey="name" stroke="#ffffff30" fontSize={10} tickLine={false} axisLine={false} />
                    <YAxis stroke="#ffffff30" fontSize={10} tickLine={false} axisLine={false} tickFormatter={(value) => `$${value}`} />
                    <Tooltip 
                      contentStyle={{ backgroundColor: '#0a0a0a', border: '1px solid #ffffff10', borderRadius: '0' }}
                      itemStyle={{ color: '#D4AF37', fontSize: '12px', textTransform: 'uppercase', letterSpacing: '1px' }}
                    />
                    <Area type="monotone" dataKey="amount" stroke="#D4AF37" fillOpacity={1} fill="url(#colorAmount)" strokeWidth={2} />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            </div>

            <div className="luxury-card p-12">
              <h3 className="text-2xl font-display mb-12 flex items-center gap-4">
                <Users className="text-gold" />
                User Growth
              </h3>
              <div className="h-80 w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={analytics.growth}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#ffffff05" vertical={false} />
                    <XAxis dataKey="name" stroke="#ffffff30" fontSize={10} tickLine={false} axisLine={false} />
                    <YAxis stroke="#ffffff30" fontSize={10} tickLine={false} axisLine={false} />
                    <Tooltip 
                      contentStyle={{ backgroundColor: '#0a0a0a', border: '1px solid #ffffff10', borderRadius: '0' }}
                      itemStyle={{ color: '#D4AF37', fontSize: '12px', textTransform: 'uppercase', letterSpacing: '1px' }}
                    />
                    <Bar dataKey="users" fill="#D4AF37" radius={[0, 0, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-12">
            <div className="lg:col-span-1 luxury-card p-12">
              <h3 className="text-2xl font-display mb-12">Category Distribution</h3>
              <div className="h-64 w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={analytics.categories}
                      cx="50%"
                      cy="50%"
                      innerRadius={60}
                      outerRadius={80}
                      paddingAngle={5}
                      dataKey="value"
                    >
                      {analytics.categories.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip 
                      contentStyle={{ backgroundColor: '#0a0a0a', border: '1px solid #ffffff10', borderRadius: '0' }}
                    />
                  </PieChart>
                </ResponsiveContainer>
              </div>
              <div className="space-y-4 mt-8">
                {analytics.categories.map((cat, i) => (
                  <div key={i} className="flex items-center justify-between text-[10px] uppercase tracking-widest font-accent">
                    <div className="flex items-center gap-3">
                      <div className="w-2 h-2" style={{ backgroundColor: COLORS[i % COLORS.length] }} />
                      <span className="text-luxury-accent">{cat.name}</span>
                    </div>
                    <span className="font-bold text-white">{cat.value}</span>
                  </div>
                ))}
              </div>
            </div>

            <div className="lg:col-span-2 luxury-card p-12">
              <h3 className="text-2xl font-display mb-12">Popular Masterpieces</h3>
              <div className="space-y-8">
                {books.slice(0, 4).map((book, i) => (
                  <div key={i} className="flex items-center justify-between group">
                    <div className="flex items-center gap-6">
                      <div className="text-xl font-display text-gold/30">0{i+1}</div>
                      <div className="w-12 h-16 border border-white/5 overflow-hidden group-hover:border-gold transition-all">
                        <img src={book.coverImage} className="w-full h-full object-cover grayscale group-hover:grayscale-0 transition-all duration-500" />
                      </div>
                      <div>
                        <div className="text-lg font-display group-hover:text-gold transition-colors">{book.title}</div>
                        <div className="text-[10px] font-bold uppercase tracking-widest text-luxury-accent font-accent">{book.author}</div>
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="text-xl font-display text-gold">${(book.price * 12).toFixed(2)}</div>
                      <div className="text-[9px] text-luxury-accent uppercase tracking-widest font-bold font-accent">Total Sales</div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Add/Edit Modal */}
      <AnimatePresence>
        {isAdding && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-6">
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setIsAdding(false)} className="absolute inset-0 bg-luxury-black/95 backdrop-blur-md" />
            <motion.div initial={{ opacity: 0, scale: 0.95, y: 20 }} animate={{ opacity: 1, scale: 1, y: 0 }} exit={{ opacity: 0, scale: 0.95, y: 20 }} className="relative w-full max-w-3xl luxury-card p-16 border-gold/30 overflow-hidden">
              <div className="flex items-center justify-between mb-16">
                <h2 className="text-4xl font-display">{editingId ? 'Edit Masterpiece' : 'Add New Masterpiece'}</h2>
                <button onClick={() => setIsAdding(false)} className="p-3 border border-white/5 hover:border-gold hover:text-gold transition-all"><X size={20} /></button>
              </div>
              <form onSubmit={handleSave} className="grid grid-cols-2 gap-10">
                <div className="col-span-2">
                  <label className="text-[10px] font-bold uppercase tracking-[0.3em] text-gold mb-4 block font-accent">Title</label>
                  <input type="text" className="w-full bg-white/5 border border-white/10 p-5 outline-none focus:border-gold transition-all font-accent text-sm tracking-widest" value={formData.title} onChange={(e) => setFormData({...formData, title: e.target.value})} required />
                </div>
                <div>
                  <label className="text-[10px] font-bold uppercase tracking-[0.3em] text-gold mb-4 block font-accent">Author</label>
                  <input type="text" className="w-full bg-white/5 border border-white/10 p-5 outline-none focus:border-gold transition-all font-accent text-sm tracking-widest" value={formData.author} onChange={(e) => setFormData({...formData, author: e.target.value})} required />
                </div>
                <div>
                  <label className="text-[10px] font-bold uppercase tracking-[0.3em] text-gold mb-4 block font-accent">Tier</label>
                  <select className="w-full bg-white/5 border border-white/10 p-5 outline-none focus:border-gold transition-all font-accent text-[10px] uppercase tracking-widest appearance-none cursor-pointer" value={formData.tier} onChange={(e) => setFormData({...formData, tier: e.target.value as any})}>
                    <option value="poverty">Poverty (Foundation)</option>
                    <option value="growth">Growth (Struggle)</option>
                    <option value="wealth">Wealth (Accumulation)</option>
                    <option value="power">Power (Sovereignty)</option>
                  </select>
                </div>
                <div>
                  <label className="text-[10px] font-bold uppercase tracking-[0.3em] text-gold mb-4 block font-accent">Price ($)</label>
                  <input type="number" step="0.01" className="w-full bg-white/5 border border-white/10 p-5 outline-none focus:border-gold transition-all font-accent text-sm tracking-widest" value={formData.price} onChange={(e) => setFormData({...formData, price: parseFloat(e.target.value)})} required />
                </div>
                <div>
                  <label className="text-[10px] font-bold uppercase tracking-[0.3em] text-gold mb-4 block font-accent">Stock</label>
                  <input type="number" className="w-full bg-white/5 border border-white/10 p-5 outline-none focus:border-gold transition-all font-accent text-sm tracking-widest" value={formData.stock} onChange={(e) => setFormData({...formData, stock: parseInt(e.target.value)})} required />
                </div>
                <div className="col-span-2">
                  <label className="text-[10px] font-bold uppercase tracking-[0.3em] text-gold mb-4 block font-accent">Cover Image URL</label>
                  <input type="text" className="w-full bg-white/5 border border-white/10 p-5 outline-none focus:border-gold transition-all font-accent text-sm tracking-widest" value={formData.coverImage} onChange={(e) => setFormData({...formData, coverImage: e.target.value})} />
                </div>
                <div className="col-span-2">
                  <label className="text-[10px] font-bold uppercase tracking-[0.3em] text-gold mb-4 block font-accent">Description</label>
                  <textarea className="w-full h-40 bg-white/5 border border-white/10 p-5 outline-none focus:border-gold transition-all resize-none font-accent text-sm tracking-widest leading-relaxed" value={formData.description} onChange={(e) => setFormData({...formData, description: e.target.value})} />
                </div>
                <div className="col-span-2 pt-10">
                  <button type="submit" className="btn-luxury w-full py-6 flex items-center justify-center gap-4 group">
                    <Save size={20} />
                    <span className="text-[11px] font-bold uppercase tracking-[0.4em]">{editingId ? 'Update Masterpiece' : 'Save Masterpiece'}</span>
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Grant Access Modal */}
      <AnimatePresence>
        {isGranting && selectedUserForGrant && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-6">
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setIsGranting(false)} className="absolute inset-0 bg-luxury-black/95 backdrop-blur-md" />
            <motion.div initial={{ opacity: 0, scale: 0.95, y: 20 }} animate={{ opacity: 1, scale: 1, y: 0 }} exit={{ opacity: 0, scale: 0.95, y: 20 }} className="relative w-full max-w-xl luxury-card p-16 border-gold/30">
              <div className="flex items-center justify-between mb-12">
                <h2 className="text-3xl font-display">Grant Access</h2>
                <button onClick={() => setIsGranting(false)} className="p-3 border border-white/5 hover:border-gold hover:text-gold transition-all"><X size={20} /></button>
              </div>
              <p className="text-luxury-accent mb-12 italic font-light">Select a masterpiece to grant access to <span className="text-white font-bold">{selectedUserForGrant.displayName}</span>.</p>
              <div className="max-h-[500px] overflow-y-auto pr-4 space-y-6 custom-scrollbar">
                {books.map((book) => (
                  <button 
                    key={book.id}
                    onClick={() => { handleGrantAccess(selectedUserForGrant.uid, book.id); setIsGranting(false); }}
                    className="w-full flex items-center gap-6 p-6 border border-white/5 hover:border-gold/50 transition-all text-left group"
                  >
                    <div className="w-12 h-16 border border-white/5 overflow-hidden group-hover:border-gold transition-all">
                      <img src={book.coverImage} className="w-full h-full object-cover grayscale group-hover:grayscale-0 transition-all duration-500" />
                    </div>
                    <div>
                      <div className="text-lg font-display group-hover:text-gold transition-colors">{book.title}</div>
                      <div className="text-[9px] font-bold uppercase tracking-widest text-luxury-accent font-accent">{book.author}</div>
                    </div>
                  </button>
                ))}
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
      </div>
    </div>
  );
}
