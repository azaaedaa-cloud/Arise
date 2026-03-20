import { useState, useEffect } from 'react';
import { collection, getDocs, addDoc, updateDoc, deleteDoc, doc, query, orderBy, getDoc } from 'firebase/firestore';
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
          fetchBooks();
          fetchOrders();
          fetchUsers();
        } else {
          navigate('/');
        }
      } else {
        navigate('/');
      }
    };
    checkAdmin();
  }, [navigate]);

  const fetchBooks = async () => {
    setLoading(true);
    try {
      const q = query(collection(db, 'books'), orderBy('title'));
      const querySnapshot = await getDocs(q);
      setBooks(querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Book)));
    } catch (error) {
      console.error("Error fetching books:", error);
    } finally {
      setLoading(false);
    }
  };

  const fetchUsers = async () => {
    try {
      const querySnapshot = await getDocs(collection(db, 'users'));
      setUsers(querySnapshot.docs.map(doc => ({ uid: doc.id, ...doc.data() } as UserProfile)));
    } catch (error) {
      console.error("Error fetching users:", error);
    }
  };

  const fetchOrders = async () => {
    try {
      const q = query(collection(db, 'orders'), orderBy('createdAt', 'desc'));
      const querySnapshot = await getDocs(q);
      setOrders(querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Order)));
    } catch (error) {
      console.error("Error fetching orders:", error);
    }
  };

  const handleUpdateOrderStatus = async (orderId: string, newStatus: string) => {
    try {
      await updateDoc(doc(db, 'orders', orderId), { status: newStatus });
      fetchOrders();
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
          fetchUsers();
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
        await updateDoc(doc(db, 'books', editingId), formData);
        toast.success("Masterpiece updated");
      } else {
        await addDoc(collection(db, 'books'), {
          ...formData,
          rating: 5,
          reviewCount: 0
        });
        toast.success("New masterpiece added to collection");
      }
      confetti({
        particleCount: 100,
        spread: 70,
        origin: { y: 0.6 },
        colors: ['#D4AF37', '#ffffff']
      });
      sounds.success.play();
      setIsAdding(false);
      setEditingId(null);
      setFormData({ title: '', author: '', description: '', price: 0, category: 'Fiction', stock: 10, isDigital: false, tier: 'growth' });
      fetchBooks();
    } catch (error) {
      console.error("Error saving book:", error);
    }
  };

  const handleDelete = async (id: string) => {
    if (!window.confirm("Are you sure you want to delete this masterpiece?")) return;
    try {
      await deleteDoc(doc(db, 'books', id));
      fetchBooks();
      toast.success("Masterpiece removed from collection");
    } catch (error) {
      console.error("Error deleting book:", error);
      toast.error("Failed to delete masterpiece");
    }
  };

  const handleDeleteUser = async (uid: string) => {
    if (uid === auth.currentUser?.uid) {
      toast.error("You cannot delete your own account from here.");
      return;
    }
    if (!window.confirm("Are you sure you want to remove this user? This will delete their profile data.")) return;
    
    try {
      await deleteDoc(doc(db, 'users', uid));
      fetchUsers();
      toast.success("User removed successfully");
      sounds.success.play();
    } catch (error) {
      console.error("Error deleting user:", error);
      toast.error("Failed to remove user");
    }
  };

  const handleUpdateUserRole = async (uid: string, newRole: UserRole) => {
    if (userRole !== 'super_admin') return;
    try {
      await updateDoc(doc(db, 'users', uid), { role: newRole });
      fetchUsers();
      sounds.success.play();
      toast.success(`User role updated to ${newRole}`);
    } catch (error) {
      console.error("Error updating user role:", error);
      toast.error("Failed to update user role");
    }
  };

  const handleUpdateUserPermissions = async (uid: string, perms: Partial<UserPermissions>) => {
    if (userRole !== 'super_admin') return;
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
        fetchUsers();
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
    fetchBooks();
    sounds.success.play();
    confetti({ colors: ['#D4AF37'] });
  };

  if (userRole === 'user') return null;

  return (
    <div className="max-w-7xl mx-auto px-6 py-20">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-8 mb-16">
        <div>
          <h1 className="text-5xl font-bold tracking-tighter mb-4 flex items-center gap-4">
            {userRole === 'super_admin' ? <Crown className="text-gold" size={40} /> : <LayoutDashboard className="text-gold" size={40} />}
            {userRole === 'super_admin' ? 'SUPER' : 'ELITE'} <span className="text-gold">DASHBOARD</span>
          </h1>
          <p className="text-luxury-accent">
            {auth.currentUser?.email === 'azaaedaa@gmail.com' 
              ? 'Welcome back, Architect. Full system control is active.' 
              : 'Full system control and performance monitoring.'}
          </p>
        </div>
        
        <div className="flex items-center gap-4">
          <button onClick={seedData} className="btn-outline py-2 px-4 text-xs">Seed Sample Data</button>
          <button 
            onClick={() => {
              const url = `${window.location.origin}/auth`;
              navigator.clipboard.writeText(url);
              toast.success("Registration link copied. Ask the new admin to sign up, then promote them here.");
            }}
            className="btn-outline py-2 px-4 text-xs flex items-center gap-2"
          >
            <Plus size={14} />
            Invite Admin
          </button>
          <div className="glass p-1 rounded-xl flex">
            <button 
              onClick={() => setActiveTab('products')}
              className={`px-4 py-2 rounded-lg text-xs font-bold transition-all ${activeTab === 'products' ? 'bg-gold text-luxury-black' : 'text-luxury-accent hover:text-white'}`}
            >
              Products
            </button>
            {userRole === 'super_admin' && (
              <button 
                onClick={() => setActiveTab('users')}
                className={`px-4 py-2 rounded-lg text-xs font-bold transition-all ${activeTab === 'users' ? 'bg-gold text-luxury-black' : 'text-luxury-accent hover:text-white'}`}
              >
                Users
              </button>
            )}
            {hasAccess('manageOrders') && (
              <button 
                onClick={() => setActiveTab('orders')}
                className={`px-4 py-2 rounded-lg text-xs font-bold transition-all ${activeTab === 'orders' ? 'bg-gold text-luxury-black' : 'text-luxury-accent hover:text-white'}`}
              >
                Orders
              </button>
            )}
            {hasAccess('viewAnalytics') && (
              <button 
                onClick={() => setActiveTab('analytics')}
                className={`px-4 py-2 rounded-lg text-xs font-bold transition-all ${activeTab === 'analytics' ? 'bg-gold text-luxury-black' : 'text-luxury-accent hover:text-white'}`}
              >
                Analytics
              </button>
            )}
          </div>
          {hasAccess('manageProducts') && (
            <button onClick={() => setIsAdding(true)} className="btn-gold flex items-center gap-2">
              <Plus size={20} />
              Add Masterpiece
            </button>
          )}
        </div>
      </div>

      {/* Search & Filter Bar */}
      {(activeTab === 'products' || activeTab === 'users') && (
        <div className="flex flex-col md:flex-row gap-4 mb-8">
          <div className="flex-1 relative">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-luxury-accent" size={18} />
            <input 
              type="text" 
              placeholder={`Search ${activeTab}...`}
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full glass border-white/10 pl-12 pr-4 py-3 rounded-2xl outline-none focus:border-gold transition-all"
            />
          </div>
          {activeTab === 'products' && (
            <div className="flex items-center gap-2 glass border-white/10 px-4 py-2 rounded-2xl">
              <Filter size={18} className="text-luxury-accent" />
              <select 
                value={filterTier}
                onChange={(e) => setFilterTier(e.target.value)}
                className="bg-transparent text-xs font-bold uppercase outline-none cursor-pointer"
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
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-12">
        <div className="glass p-8 rounded-3xl border-white/5">
          <div className="flex items-center justify-between mb-4">
            <ShoppingBag className="text-gold" size={24} />
            <span className="text-[10px] font-bold text-green-500 uppercase tracking-widest">+12%</span>
          </div>
          <div className="text-3xl font-bold mb-1">{books.length}</div>
          <div className="text-xs text-luxury-accent uppercase tracking-widest font-bold">Total Masterpieces</div>
        </div>
        <div className="glass p-8 rounded-3xl border-white/5">
          <div className="flex items-center justify-between mb-4">
            <Users className="text-gold" size={24} />
            <span className="text-[10px] font-bold text-gold uppercase tracking-widest">Active</span>
          </div>
          <div className="text-3xl font-bold mb-1">{users.length || '---'}</div>
          <div className="text-xs text-luxury-accent uppercase tracking-widest font-bold">Elite Members</div>
        </div>
        <div className="glass p-8 rounded-3xl border-white/5">
          <div className="flex items-center justify-between mb-4">
            <BarChart3 className="text-gold" size={24} />
            <span className="text-[10px] font-bold text-gold uppercase tracking-widest">Revenue</span>
          </div>
          <div className="text-3xl font-bold mb-1">$12.4K</div>
          <div className="text-xs text-luxury-accent uppercase tracking-widest font-bold">Total Sales</div>
        </div>
        <div className="glass p-8 rounded-3xl border-white/5">
          <div className="flex items-center justify-between mb-4">
            <Star className="text-gold" size={24} />
            <span className="text-[10px] font-bold text-gold uppercase tracking-widest">Top Rated</span>
          </div>
          <div className="text-3xl font-bold mb-1">4.9</div>
          <div className="text-xs text-luxury-accent uppercase tracking-widest font-bold">Avg. Satisfaction</div>
        </div>
      </div>

      {activeTab === 'products' ? (
        <div className="glass rounded-[2rem] overflow-hidden border-white/5">
          <div className="p-8 border-b border-white/5 flex items-center justify-between">
            <h2 className="text-2xl font-bold">Collection Management</h2>
            <div className="text-sm text-luxury-accent">{filteredBooks.length} Masterpieces</div>
          </div>
          
          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead className="bg-white/5 text-xs uppercase tracking-widest text-luxury-accent">
                <tr>
                  <th className="px-8 py-6">Masterpiece</th>
                  <th className="px-8 py-6">Tier</th>
                  <th className="px-8 py-6">Price</th>
                  <th className="px-8 py-6">Stock</th>
                  <th className="px-8 py-6 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5">
                {loading ? (
                  Array(5).fill(0).map((_, i) => (
                    <tr key={i} className="animate-pulse">
                      <td colSpan={5} className="px-8 py-10"><div className="h-4 bg-white/5 rounded w-full" /></td>
                    </tr>
                  ))
                ) : filteredBooks.map((book) => (
                  <tr key={book.id} className="hover:bg-white/5 transition-colors group">
                    <td className="px-8 py-6">
                      <div className="flex items-center gap-4">
                        <img src={book.coverImage || `https://picsum.photos/seed/${book.id}/100/150`} className="w-12 h-16 object-cover rounded shadow-lg" referrerPolicy="no-referrer" />
                        <div>
                          <div className="font-bold group-hover:text-gold transition-colors">{book.title}</div>
                          <div className="text-xs text-luxury-accent">{book.author}</div>
                        </div>
                      </div>
                    </td>
                    <td className="px-8 py-6">
                      <span className="text-[10px] font-bold bg-gold/10 text-gold px-3 py-1 rounded-full uppercase tracking-widest">
                        {book.tier}
                      </span>
                    </td>
                    <td className="px-8 py-6 font-bold">${book.price}</td>
                    <td className="px-8 py-6">
                      <div className="flex items-center gap-2">
                        {book.stock}
                        {book.stock < 5 && <AlertTriangle size={14} className="text-red-500 animate-pulse" />}
                      </div>
                    </td>
                    <td className="px-8 py-6 text-right">
                      <div className="flex items-center justify-end gap-2">
                        {hasAccess('manageProducts') && (
                          <>
                            <button onClick={() => { setEditingId(book.id); setFormData(book); setIsAdding(true); }} className="p-3 glass rounded-xl hover:text-gold transition-colors"><Edit2 size={18} /></button>
                            <button onClick={() => handleDelete(book.id)} className="p-3 glass rounded-xl hover:text-red-500 transition-colors"><Trash2 size={18} /></button>
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
        <div className="glass rounded-[2rem] overflow-hidden border-white/5">
          <div className="p-8 border-b border-white/5 flex items-center justify-between">
            <h2 className="text-2xl font-bold">User Management</h2>
            <div className="text-sm text-luxury-accent">{filteredUsers.length} Elite Members</div>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead className="bg-white/5 text-xs uppercase tracking-widest text-luxury-accent">
                <tr>
                  <th className="px-8 py-6">User</th>
                  <th className="px-8 py-6">Role & Permissions</th>
                  <th className="px-8 py-6">Joined</th>
                  <th className="px-8 py-6 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5">
                {filteredUsers.map((user) => (
                  <tr key={user.uid} className="hover:bg-white/5 transition-colors group">
                    <td className="px-8 py-6">
                      <div className="flex items-center gap-4">
                        <div className="w-10 h-10 bg-luxury-gray rounded-full flex items-center justify-center font-bold text-gold">{user.displayName ? user.displayName[0] : '?'}</div>
                        <div>
                          <div className="font-bold">{user.displayName || 'Elite Member'}</div>
                          <div className="text-xs text-luxury-accent">{user.email}</div>
                        </div>
                      </div>
                    </td>
                    <td className="px-8 py-6">
                      <div className="flex flex-col gap-3">
                        <select 
                          value={user.role}
                          onChange={(e) => handleUpdateUserRole(user.uid, e.target.value as UserRole)}
                          className="bg-transparent text-gold font-bold text-xs uppercase outline-none cursor-pointer"
                          disabled={user.uid === auth.currentUser?.uid || userRole !== 'super_admin'}
                        >
                          <option value="user">User</option>
                          <option value="support">Support</option>
                          <option value="editor">Editor</option>
                          <option value="admin">Admin</option>
                          <option value="super_admin">Super Admin</option>
                        </select>
                        
                        {user.role !== 'super_admin' && user.role !== 'user' && userRole === 'super_admin' && (
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
                                className={`text-[9px] px-2 py-1 rounded-md border transition-all ${user.permissions?.[perm.id as keyof UserPermissions] ? 'bg-gold/20 border-gold text-gold' : 'border-white/10 text-luxury-accent'}`}
                              >
                                {perm.label}
                              </button>
                            ))}
                          </div>
                        )}
                      </div>
                    </td>
                    <td className="px-8 py-6 text-xs text-luxury-accent">{new Date(user.createdAt).toLocaleDateString()}</td>
                    <td className="px-8 py-6 text-right">
                      <div className="flex items-center justify-end gap-2">
                        {hasAccess('manageUsers') && (
                          <button onClick={() => { setSelectedUserForGrant(user); setIsGranting(true); }} className="p-3 glass rounded-xl hover:text-gold transition-colors flex items-center gap-2 text-xs font-bold uppercase">
                            <BookOpen size={16} />
                            Grant Access
                          </button>
                        )}
                        {user.uid !== auth.currentUser?.uid && userRole === 'super_admin' && (
                          <button 
                            onClick={() => handleDeleteUser(user.uid)}
                            className="p-3 glass rounded-xl hover:text-red-500 transition-colors"
                            title="Remove User"
                          >
                            <ShieldAlert size={18} />
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
        <div className="glass rounded-[2rem] overflow-hidden border-white/5">
          <div className="p-8 border-b border-white/5 flex items-center justify-between">
            <h2 className="text-2xl font-bold">Order Management</h2>
            <div className="text-sm text-luxury-accent">{orders.length} Total Orders</div>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead className="bg-white/5 text-xs uppercase tracking-widest text-luxury-accent">
                <tr>
                  <th className="px-8 py-6">Order ID</th>
                  <th className="px-8 py-6">Items</th>
                  <th className="px-8 py-6">Total</th>
                  <th className="px-8 py-6">Status</th>
                  <th className="px-8 py-6">Date</th>
                  <th className="px-8 py-6 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5">
                {orders.map((order) => (
                  <tr key={order.id} className="hover:bg-white/5 transition-colors group">
                    <td className="px-8 py-6 font-mono text-xs text-gold">#{order.id.slice(0, 8)}</td>
                    <td className="px-8 py-6">
                      <div className="flex flex-col gap-1">
                        {order.items.map((item, idx) => (
                          <div key={idx} className="text-xs">{item.quantity}x {item.title}</div>
                        ))}
                      </div>
                    </td>
                    <td className="px-8 py-6 font-bold">${order.totalAmount}</td>
                    <td className="px-8 py-6">
                      <select 
                        value={order.status}
                        onChange={(e) => handleUpdateOrderStatus(order.id, e.target.value)}
                        className="bg-transparent text-gold font-bold text-xs uppercase outline-none cursor-pointer"
                        disabled={!hasAccess('manageOrders')}
                      >
                        <option value="pending">Pending</option>
                        <option value="paid">Paid</option>
                        <option value="shipped">Shipped</option>
                        <option value="delivered">Delivered</option>
                        <option value="cancelled">Cancelled</option>
                      </select>
                    </td>
                    <td className="px-8 py-6 text-xs text-luxury-accent">{new Date(order.createdAt).toLocaleDateString()}</td>
                    <td className="px-8 py-6 text-right">
                      {hasAccess('manageOrders') && (
                        <button className="p-3 glass rounded-xl hover:text-gold transition-colors"><Edit2 size={18} /></button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      ) : (
        <div className="space-y-8">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            <div className="glass p-8 rounded-[2rem] border-white/5">
              <h3 className="text-xl font-bold mb-8 flex items-center gap-3">
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
                    <CartesianGrid strokeDasharray="3 3" stroke="#ffffff10" vertical={false} />
                    <XAxis dataKey="name" stroke="#9CA3AF" fontSize={12} tickLine={false} axisLine={false} />
                    <YAxis stroke="#9CA3AF" fontSize={12} tickLine={false} axisLine={false} tickFormatter={(value) => `$${value}`} />
                    <Tooltip 
                      contentStyle={{ backgroundColor: '#0a0a0a', border: '1px solid #ffffff10', borderRadius: '12px' }}
                      itemStyle={{ color: '#D4AF37' }}
                    />
                    <Area type="monotone" dataKey="amount" stroke="#D4AF37" fillOpacity={1} fill="url(#colorAmount)" strokeWidth={3} />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            </div>

            <div className="glass p-8 rounded-[2rem] border-white/5">
              <h3 className="text-xl font-bold mb-8 flex items-center gap-3">
                <Users className="text-gold" />
                User Growth
              </h3>
              <div className="h-80 w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={analytics.growth}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#ffffff10" vertical={false} />
                    <XAxis dataKey="name" stroke="#9CA3AF" fontSize={12} tickLine={false} axisLine={false} />
                    <YAxis stroke="#9CA3AF" fontSize={12} tickLine={false} axisLine={false} />
                    <Tooltip 
                      contentStyle={{ backgroundColor: '#0a0a0a', border: '1px solid #ffffff10', borderRadius: '12px' }}
                      itemStyle={{ color: '#D4AF37' }}
                    />
                    <Bar dataKey="users" fill="#D4AF37" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            <div className="lg:col-span-1 glass p-8 rounded-[2rem] border-white/5">
              <h3 className="text-xl font-bold mb-8">Category Distribution</h3>
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
                      contentStyle={{ backgroundColor: '#0a0a0a', border: '1px solid #ffffff10', borderRadius: '12px' }}
                    />
                  </PieChart>
                </ResponsiveContainer>
              </div>
              <div className="space-y-2 mt-4">
                {analytics.categories.map((cat, i) => (
                  <div key={i} className="flex items-center justify-between text-xs">
                    <div className="flex items-center gap-2">
                      <div className="w-2 h-2 rounded-full" style={{ backgroundColor: COLORS[i % COLORS.length] }} />
                      <span className="text-luxury-accent">{cat.name}</span>
                    </div>
                    <span className="font-bold">{cat.value}</span>
                  </div>
                ))}
              </div>
            </div>

            <div className="lg:col-span-2 glass p-8 rounded-[2rem] border-white/5">
              <h3 className="text-xl font-bold mb-8">Popular Masterpieces</h3>
              <div className="space-y-6">
                {books.slice(0, 4).map((book, i) => (
                  <div key={i} className="flex items-center justify-between group">
                    <div className="flex items-center gap-4">
                      <div className="text-lg font-bold text-luxury-accent">0{i+1}</div>
                      <img src={book.coverImage} className="w-10 h-14 object-cover rounded shadow-lg" />
                      <div>
                        <div className="font-bold group-hover:text-gold transition-colors">{book.title}</div>
                        <div className="text-xs text-luxury-accent">{book.author}</div>
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="font-bold text-gold">${(book.price * 12).toFixed(2)}</div>
                      <div className="text-[10px] text-luxury-accent uppercase font-bold">Total Sales</div>
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
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setIsAdding(false)} className="absolute inset-0 bg-luxury-black/90 backdrop-blur-sm" />
            <motion.div initial={{ opacity: 0, scale: 0.9, y: 20 }} animate={{ opacity: 1, scale: 1, y: 0 }} exit={{ opacity: 0, scale: 0.9, y: 20 }} className="relative w-full max-w-2xl glass rounded-[3rem] p-12 border-gold/20 overflow-hidden">
              <div className="flex items-center justify-between mb-12">
                <h2 className="text-3xl font-bold">{editingId ? 'Edit Masterpiece' : 'Add New Masterpiece'}</h2>
                <button onClick={() => setIsAdding(false)} className="p-2 hover:bg-white/10 rounded-full transition-colors"><X /></button>
              </div>
              <form onSubmit={handleSave} className="grid grid-cols-2 gap-6">
                <div className="col-span-2">
                  <label className="text-xs font-bold uppercase tracking-widest text-luxury-accent mb-2 block">Title</label>
                  <input type="text" className="w-full glass border-white/10 p-4 rounded-xl outline-none focus:border-gold transition-all" value={formData.title} onChange={(e) => setFormData({...formData, title: e.target.value})} required />
                </div>
                <div>
                  <label className="text-xs font-bold uppercase tracking-widest text-luxury-accent mb-2 block">Author</label>
                  <input type="text" className="w-full glass border-white/10 p-4 rounded-xl outline-none focus:border-gold transition-all" value={formData.author} onChange={(e) => setFormData({...formData, author: e.target.value})} required />
                </div>
                <div>
                  <label className="text-xs font-bold uppercase tracking-widest text-luxury-accent mb-2 block">Tier</label>
                  <select className="w-full glass border-white/10 p-4 rounded-xl outline-none focus:border-gold transition-all appearance-none" value={formData.tier} onChange={(e) => setFormData({...formData, tier: e.target.value as any})}>
                    <option value="poverty">Poverty (Foundation)</option>
                    <option value="growth">Growth (Struggle)</option>
                    <option value="wealth">Wealth (Accumulation)</option>
                    <option value="power">Power (Sovereignty)</option>
                  </select>
                </div>
                <div>
                  <label className="text-xs font-bold uppercase tracking-widest text-luxury-accent mb-2 block">Price ($)</label>
                  <input type="number" step="0.01" className="w-full glass border-white/10 p-4 rounded-xl outline-none focus:border-gold transition-all" value={formData.price} onChange={(e) => setFormData({...formData, price: parseFloat(e.target.value)})} required />
                </div>
                <div>
                  <label className="text-xs font-bold uppercase tracking-widest text-luxury-accent mb-2 block">Stock</label>
                  <input type="number" className="w-full glass border-white/10 p-4 rounded-xl outline-none focus:border-gold transition-all" value={formData.stock} onChange={(e) => setFormData({...formData, stock: parseInt(e.target.value)})} required />
                </div>
                <div className="col-span-2">
                  <label className="text-xs font-bold uppercase tracking-widest text-luxury-accent mb-2 block">Cover Image URL</label>
                  <input type="text" className="w-full glass border-white/10 p-4 rounded-xl outline-none focus:border-gold transition-all" value={formData.coverImage} onChange={(e) => setFormData({...formData, coverImage: e.target.value})} />
                </div>
                <div className="col-span-2">
                  <label className="text-xs font-bold uppercase tracking-widest text-luxury-accent mb-2 block">Description</label>
                  <textarea className="w-full h-32 glass border-white/10 p-4 rounded-xl outline-none focus:border-gold transition-all resize-none" value={formData.description} onChange={(e) => setFormData({...formData, description: e.target.value})} />
                </div>
                <div className="col-span-2 pt-6">
                  <button type="submit" className="btn-gold w-full flex items-center justify-center gap-2">
                    <Save size={20} />
                    {editingId ? 'Update Masterpiece' : 'Save Masterpiece'}
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
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setIsGranting(false)} className="absolute inset-0 bg-luxury-black/90 backdrop-blur-sm" />
            <motion.div initial={{ opacity: 0, scale: 0.9, y: 20 }} animate={{ opacity: 1, scale: 1, y: 0 }} exit={{ opacity: 0, scale: 0.9, y: 20 }} className="relative w-full max-w-lg glass rounded-[3rem] p-12 border-gold/20">
              <div className="flex items-center justify-between mb-8">
                <h2 className="text-2xl font-bold">Grant Access</h2>
                <button onClick={() => setIsGranting(false)} className="p-2 hover:bg-white/10 rounded-full transition-colors"><X /></button>
              </div>
              <p className="text-luxury-accent mb-8">Select a masterpiece to grant access to <span className="text-white font-bold">{selectedUserForGrant.displayName}</span>.</p>
              <div className="max-h-96 overflow-y-auto pr-2 space-y-4">
                {books.map((book) => (
                  <button 
                    key={book.id}
                    onClick={() => { handleGrantAccess(selectedUserForGrant.uid, book.id); setIsGranting(false); }}
                    className="w-full flex items-center gap-4 p-4 glass rounded-2xl hover:border-gold/50 transition-all text-left group"
                  >
                    <img src={book.coverImage} className="w-10 h-14 object-cover rounded" />
                    <div>
                      <div className="font-bold group-hover:text-gold transition-colors">{book.title}</div>
                      <div className="text-xs text-luxury-accent">{book.author}</div>
                    </div>
                  </button>
                ))}
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
