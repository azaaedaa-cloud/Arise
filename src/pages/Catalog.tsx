import { useState, useEffect } from 'react';
import { collection, query, where, getDocs, orderBy, limit } from 'firebase/firestore';
import { db } from '../firebase';
import { Book } from '../types';
import { motion, AnimatePresence } from 'motion/react';
import { Search, Filter, Star, Heart, ShoppingCart, ChevronDown, LayoutGrid, List, Crown, TrendingUp, Zap, Gem } from 'lucide-react';
import { Link } from 'react-router-dom';
import { useAppContext } from '../contexts/AppContext';
import { sounds, spawnEmoji } from '../utils/interactions';

const CATEGORIES = ["All", "Fiction", "Non-Fiction", "Digital", "Limited Edition", "Business", "Technology", "Philosophy"];
const TIERS = ["All", "poverty", "growth", "wealth", "power"];

export default function Catalog() {
  const { t } = useAppContext();
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
    <div className="bg-luxury-black min-h-screen text-[#F5F5F5] pt-32 pb-40">
      <div className="container mx-auto px-6">
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-12 mb-24">
          <div className="max-w-2xl">
            <div className="text-gold text-[10px] font-bold uppercase tracking-[0.5em] mb-6 font-accent">The Collection</div>
            <h1 className="text-5xl md:text-7xl font-display mb-6 leading-tight">
              ELITE <span className="gold-text italic">CATALOG</span>
            </h1>
            <p className="text-luxury-accent font-light leading-relaxed">
              Curated masterpieces for those who demand excellence in every word and thought.
            </p>
          </div>
          
          <div className="flex flex-col sm:flex-row items-center gap-6 w-full md:w-auto">
            <div className="relative w-full sm:w-80">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gold/40" size={16} />
              <input 
                type="text" 
                placeholder={t('common.search')} 
                className="w-full pl-12 pr-6 py-4 bg-white/[0.03] border border-white/10 text-sm focus:border-gold/50 outline-none transition-all font-light tracking-wide"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
            <div className="flex items-center gap-2 border border-white/10 p-1">
              <button 
                onClick={() => setViewMode('grid')}
                className={`p-3 transition-all ${viewMode === 'grid' ? 'bg-gold text-black' : 'text-luxury-accent hover:text-white'}`}
              >
                <LayoutGrid size={18} />
              </button>
              <button 
                onClick={() => setViewMode('list')}
                className={`p-3 transition-all ${viewMode === 'list' ? 'bg-gold text-black' : 'text-luxury-accent hover:text-white'}`}
              >
                <List size={18} />
              </button>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-16">
          {/* Sidebar Filters */}
          <aside className="lg:col-span-3 space-y-16">
            <section>
              <h3 className="text-[11px] font-bold mb-8 flex items-center gap-3 text-gold uppercase tracking-[0.3em] font-accent">
                <Filter size={14} />
                {t('common.categories')}
              </h3>
              <div className="flex flex-wrap lg:flex-col gap-3">
                {CATEGORIES.map(cat => (
                  <button 
                    key={cat}
                    onClick={() => setSelectedCategory(cat)}
                    className={`text-left text-xs uppercase tracking-widest py-2 transition-all border-b ${selectedCategory === cat ? 'text-gold border-gold' : 'text-luxury-accent border-transparent hover:text-white hover:border-white/20'}`}
                  >
                    {cat}
                  </button>
                ))}
              </div>
            </section>

            <section>
              <h3 className="text-[11px] font-bold mb-8 flex items-center gap-3 text-gold uppercase tracking-[0.3em] font-accent">
                <Crown size={14} />
                {t('common.tiers')}
              </h3>
              <div className="flex flex-wrap lg:flex-col gap-3">
                {TIERS.map(tier => (
                  <button 
                    key={tier}
                    onClick={() => setSelectedTier(tier)}
                    className={`text-left text-xs uppercase tracking-widest py-2 transition-all border-b ${selectedTier === tier ? 'text-gold border-gold' : 'text-luxury-accent border-transparent hover:text-white hover:border-white/20'}`}
                  >
                    {tier}
                  </button>
                ))}
              </div>
            </section>

            <section>
              <h3 className="text-[11px] font-bold mb-8 uppercase tracking-[0.3em] font-accent text-gold">SORT BY</h3>
              <select 
                className="w-full bg-white/[0.03] border border-white/10 p-4 text-xs uppercase tracking-widest outline-none focus:border-gold/50 cursor-pointer appearance-none"
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value)}
              >
                <option value="newest">Newest Arrivals</option>
                <option value="price-low">Price: Low to High</option>
                <option value="price-high">Price: High to Low</option>
                <option value="rating">Highest Rated</option>
              </select>
            </section>
          </aside>

          {/* Main Grid */}
          <div className="lg:col-span-9">
            {loading ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-12">
                {Array(6).fill(0).map((_, i) => (
                  <div key={i} className="aspect-[3/4] bg-white/[0.03] animate-pulse" />
                ))}
              </div>
            ) : books.length > 0 ? (
              <div className={viewMode === 'grid' ? "grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-12" : "flex flex-col gap-12"}>
                <AnimatePresence mode="popLayout">
                  {books.map((book, i) => (
                    <motion.div 
                      key={book.id}
                      layout
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, scale: 0.95 }}
                      transition={{ duration: 0.5, delay: i * 0.05 }}
                      className={`group relative ${viewMode === 'list' ? 'flex flex-col md:flex-row gap-12 border-b border-white/5 pb-12' : ''}`}
                    >
                      <div className={`relative overflow-hidden shadow-2xl ${viewMode === 'list' ? 'w-full md:w-72 aspect-[3/4]' : 'aspect-[3/4] mb-8'}`}>
                        <img 
                          src={book.coverImage || `https://picsum.photos/seed/${book.id}/400/600`} 
                          className="w-full h-full object-cover transition-transform duration-1000 group-hover:scale-110 grayscale group-hover:grayscale-0"
                          referrerPolicy="no-referrer"
                        />
                        <div className="absolute inset-0 bg-luxury-black/40 opacity-0 group-hover:opacity-100 transition-opacity duration-500 flex items-center justify-center p-8">
                          <Link 
                            to={`/book/${book.id}`}
                            className="w-full py-4 border border-white/30 backdrop-blur-md text-white text-[10px] uppercase tracking-[0.3em] font-bold hover:bg-white hover:text-black transition-all text-center"
                          >
                            {t('common.details')}
                          </Link>
                        </div>
                        <div className="absolute top-6 left-6 flex flex-col gap-2">
                          {book.isDigital && (
                            <div className="px-3 py-1 bg-white text-black text-[9px] font-bold uppercase tracking-widest">
                              Digital
                            </div>
                          )}
                          <div className="px-3 py-1 bg-gold text-black text-[9px] font-bold uppercase tracking-widest flex items-center gap-2">
                            {getTierIcon(book.tier)}
                            {book.tier}
                          </div>
                        </div>
                      </div>
                      
                      <div className="flex flex-col flex-grow">
                        <div className="flex items-center justify-between mb-4">
                          <span className="text-[10px] text-gold font-bold uppercase tracking-[0.2em] font-accent">{book.category}</span>
                          <div className="flex items-center gap-1 text-[10px] text-gold">
                            <Star size={10} fill="currentColor" />
                            {book.rating}
                          </div>
                        </div>
                        <h3 className="text-2xl font-display mb-2 group-hover:text-gold transition-colors">{book.title}</h3>
                        <p className="text-luxury-accent text-xs mb-6 uppercase tracking-widest font-light">{book.author}</p>
                        
                        {viewMode === 'list' && (
                          <p className="text-luxury-accent text-sm mb-8 line-clamp-3 leading-relaxed font-light">
                            {book.description}
                          </p>
                        )}
                        
                        <div className="flex items-center justify-between mt-auto pt-6 border-t border-white/5">
                          <span className="text-2xl font-display text-white">${book.price}</span>
                          <div className="flex gap-4">
                            <button className="p-3 border border-white/10 hover:border-white/30 transition-colors text-luxury-accent hover:text-white">
                              <Heart size={18} />
                            </button>
                            <button 
                              onClick={(e) => handleAddToCart(e, book)}
                              className="p-3 bg-gold text-black hover:bg-gold-light transition-all shadow-lg shadow-gold/10"
                            >
                              <ShoppingCart size={18} />
                            </button>
                          </div>
                        </div>
                      </div>
                    </motion.div>
                  ))}
                </AnimatePresence>
              </div>
            ) : (
              <div className="text-center py-40 border border-white/5 bg-white/[0.02]">
                <Search className="mx-auto mb-8 text-gold/20" size={64} />
                <h3 className="text-3xl font-display mb-4">No masterpieces found</h3>
                <p className="text-luxury-accent font-light mb-12">Refine your search to discover hidden treasures.</p>
                <button 
                  onClick={() => {setSelectedCategory("All"); setSelectedTier("All"); setSearchTerm("");}}
                  className="text-gold text-[11px] font-bold uppercase tracking-[0.3em] hover:text-gold-light transition-colors font-accent"
                >
                  Clear all filters
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
