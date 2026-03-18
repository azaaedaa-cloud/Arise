import { useState, useEffect } from 'react';
import { collection, query, where, getDocs, orderBy, limit } from 'firebase/firestore';
import { db } from '../firebase';
import { Book } from '../types';
import { motion, AnimatePresence } from 'motion/react';
import { Search, Filter, Star, Heart, ShoppingCart, ChevronDown, LayoutGrid, List, Crown, TrendingUp, Zap, Gem } from 'lucide-react';
import { Link } from 'react-router-dom';
import { sounds, spawnEmoji } from '../utils/interactions';

const CATEGORIES = ["All", "Fiction", "Non-Fiction", "Digital", "Limited Edition", "Business", "Technology", "Philosophy"];
const TIERS = ["All", "poverty", "growth", "wealth", "power"];

export default function Catalog() {
  const [books, setBooks] = useState<Book[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("All");
  const [selectedTier, setSelectedTier] = useState("All");
  const [sortBy, setSortBy] = useState("newest");
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');

  useEffect(() => {
    const fetchBooks = async () => {
      setLoading(true);
      try {
        let q = query(collection(db, 'books'));
        
        if (selectedCategory !== "All") {
          q = query(q, where('category', '==', selectedCategory));
        }
        
        if (selectedTier !== "All") {
          q = query(q, where('tier', '==', selectedTier));
        }
        
        const querySnapshot = await getDocs(q);
        let booksData = querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Book));
        
        // Client-side search and sort
        if (searchTerm) {
          booksData = booksData.filter(book => 
            book.title.toLowerCase().includes(searchTerm.toLowerCase()) || 
            book.author.toLowerCase().includes(searchTerm.toLowerCase())
          );
        }
        
        if (sortBy === "price-low") booksData.sort((a, b) => a.price - b.price);
        if (sortBy === "price-high") booksData.sort((a, b) => b.price - a.price);
        if (sortBy === "rating") booksData.sort((a, b) => b.rating - a.rating);
        
        setBooks(booksData);
      } catch (error) {
        console.error("Error fetching books:", error);
      } finally {
        setLoading(false);
      }
    };
    fetchBooks();
  }, [selectedCategory, selectedTier, searchTerm, sortBy]);

  const handleAddToCart = (e: React.MouseEvent, book: Book) => {
    e.preventDefault();
    e.stopPropagation();
    sounds.click.play();
    spawnEmoji('💰', e.clientX, e.clientY);
    // Add to cart logic would go here
  };

  const getTierIcon = (tier: string) => {
    switch (tier) {
      case 'poverty': return <TrendingUp size={14} className="text-gray-400" />;
      case 'growth': return <Zap size={14} className="text-blue-400" />;
      case 'wealth': return <Gem size={14} className="text-gold" />;
      case 'power': return <Crown size={14} className="text-gold" />;
      default: return null;
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-6 py-20">
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-8 mb-16">
        <div>
          <h1 className="text-5xl font-bold tracking-tighter mb-4">ELITE <span className="text-gold">CATALOG</span></h1>
          <p className="text-luxury-accent">Discover masterpieces across all genres and formats.</p>
        </div>
        
        <div className="flex flex-col sm:flex-row items-center gap-4 w-full md:w-auto">
          <div className="relative w-full sm:w-80">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-luxury-accent" size={18} />
            <input 
              type="text" 
              placeholder="Search by title or author..." 
              className="w-full pl-12 pr-6 py-3 rounded-xl glass border-white/10 focus:border-gold outline-none transition-all"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          <div className="flex items-center gap-2 glass p-1 rounded-xl">
            <button 
              onClick={() => setViewMode('grid')}
              className={`p-2 rounded-lg transition-colors ${viewMode === 'grid' ? 'bg-gold text-luxury-black' : 'text-luxury-accent hover:text-white'}`}
            >
              <LayoutGrid size={20} />
            </button>
            <button 
              onClick={() => setViewMode('list')}
              className={`p-2 rounded-lg transition-colors ${viewMode === 'list' ? 'bg-gold text-luxury-black' : 'text-luxury-accent hover:text-white'}`}
            >
              <List size={20} />
            </button>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-12">
        {/* Sidebar Filters */}
        <aside className="lg:col-span-1 space-y-10">
          <div>
            <h3 className="text-lg font-bold mb-6 flex items-center gap-2">
              <Filter size={18} className="text-gold" />
              CATEGORIES
            </h3>
            <div className="flex flex-wrap lg:flex-col gap-2">
              {CATEGORIES.map(cat => (
                <button 
                  key={cat}
                  onClick={() => setSelectedCategory(cat)}
                  className={`text-left px-4 py-2 rounded-lg transition-all ${selectedCategory === cat ? 'bg-gold/20 text-gold border border-gold/30' : 'text-luxury-accent hover:text-white hover:bg-white/5'}`}
                >
                  {cat}
                </button>
              ))}
            </div>
          </div>

          <div>
            <h3 className="text-lg font-bold mb-6 flex items-center gap-2">
              <Crown size={18} className="text-gold" />
              TIERS
            </h3>
            <div className="flex flex-wrap lg:flex-col gap-2">
              {TIERS.map(tier => (
                <button 
                  key={tier}
                  onClick={() => setSelectedTier(tier)}
                  className={`text-left px-4 py-2 rounded-lg transition-all uppercase text-xs font-bold tracking-widest ${selectedTier === tier ? 'bg-gold/20 text-gold border border-gold/30' : 'text-luxury-accent hover:text-white hover:bg-white/5'}`}
                >
                  {tier}
                </button>
              ))}
            </div>
          </div>

          <div>
            <h3 className="text-lg font-bold mb-6">SORT BY</h3>
            <select 
              className="w-full glass border-white/10 p-3 rounded-xl outline-none focus:border-gold appearance-none cursor-pointer"
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value)}
            >
              <option value="newest">Newest Arrivals</option>
              <option value="price-low">Price: Low to High</option>
              <option value="price-high">Price: High to Low</option>
              <option value="rating">Highest Rated</option>
            </select>
          </div>
        </aside>

        {/* Main Grid */}
        <div className="lg:col-span-3">
          {loading ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8">
              {Array(6).fill(0).map((_, i) => (
                <div key={i} className="h-[400px] glass rounded-3xl animate-pulse" />
              ))}
            </div>
          ) : books.length > 0 ? (
            <div className={viewMode === 'grid' ? "grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8" : "flex flex-col gap-6"}>
              <AnimatePresence mode="popLayout">
                {books.map((book, i) => (
                  <motion.div 
                    key={book.id}
                    layout
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.9 }}
                    transition={{ duration: 0.3, delay: i * 0.05 }}
                    className={`group glass rounded-3xl overflow-hidden border-white/5 hover:border-gold/30 transition-all duration-500 ${viewMode === 'list' ? 'flex flex-col md:flex-row' : ''}`}
                  >
                    <div className={`relative overflow-hidden ${viewMode === 'list' ? 'w-full md:w-64 h-80 md:h-auto' : 'aspect-[3/4]'}`}>
                      <img 
                        src={book.coverImage || `https://picsum.photos/seed/${book.id}/400/600`} 
                        className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110"
                        referrerPolicy="no-referrer"
                      />
                      <div className="absolute top-4 right-4 flex flex-col gap-2">
                        <button className="w-10 h-10 glass rounded-full flex items-center justify-center text-white hover:text-red-500 transition-colors">
                          <Heart size={18} />
                        </button>
                      </div>
                      <div className="absolute top-4 left-4 flex flex-col gap-2">
                        {book.isDigital && (
                          <div className="glass-gold px-3 py-1 rounded-full text-[10px] font-bold text-gold uppercase tracking-widest">
                            Digital
                          </div>
                        )}
                        <div className="glass px-3 py-1 rounded-full flex items-center gap-2 border-white/10">
                          {getTierIcon(book.tier)}
                          <span className="text-[10px] font-bold uppercase tracking-widest">{book.tier}</span>
                        </div>
                      </div>
                    </div>
                    
                    <div className="p-6 flex flex-col justify-between flex-grow">
                      <div>
                        <div className="flex items-center justify-between mb-2">
                          <span className="text-xs text-gold font-bold uppercase tracking-widest">{book.category}</span>
                          <div className="flex items-center gap-1 text-xs font-bold text-gold">
                            <Star size={12} fill="currentColor" />
                            {book.rating}
                          </div>
                        </div>
                        <h3 className="text-xl font-bold mb-1 group-hover:text-gold transition-colors truncate">{book.title}</h3>
                        <p className="text-luxury-accent text-sm mb-4">{book.author}</p>
                        {viewMode === 'list' && (
                          <p className="text-luxury-accent text-sm mb-6 line-clamp-3 leading-relaxed">
                            {book.description}
                          </p>
                        )}
                      </div>
                      
                      <div className="flex items-center justify-between mt-auto">
                        <span className="text-2xl font-bold text-white">${book.price}</span>
                        <div className="flex gap-2">
                          <Link to={`/book/${book.id}`} className="p-3 glass rounded-xl hover:bg-white/10 transition-colors">
                            Details
                          </Link>
                          <button 
                            onClick={(e) => handleAddToCart(e, book)}
                            className="p-3 bg-gold text-luxury-black rounded-xl hover:bg-gold-light transition-colors shadow-[0_0_10px_rgba(212,175,55,0.3)]"
                          >
                            <ShoppingCart size={20} />
                          </button>
                        </div>
                      </div>
                    </div>
                  </motion.div>
                ))}
              </AnimatePresence>
            </div>
          ) : (
            <div className="text-center py-40 glass rounded-3xl">
              <Search className="mx-auto mb-6 text-luxury-accent" size={48} />
              <h3 className="text-2xl font-bold mb-2">No masterpieces found</h3>
              <p className="text-luxury-accent">Try adjusting your filters or search term.</p>
              <button 
                onClick={() => {setSelectedCategory("All"); setSelectedTier("All"); setSearchTerm("");}}
                className="text-gold mt-6 hover:underline font-bold"
              >
                Clear all filters
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
