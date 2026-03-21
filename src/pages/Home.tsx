import { motion, useScroll, useTransform, AnimatePresence } from 'motion/react';
import { ShoppingCart, Heart, ArrowRight, Star, BookOpen, Shield, Zap, Globe, TrendingUp, DollarSign, Crown, X } from 'lucide-react';
import { Link } from 'react-router-dom';
import { useState, useEffect, useRef } from 'react';
import { collection, query, limit, getDocs, where } from 'firebase/firestore';
import { db } from '../firebase';
import { Book } from '../types';
import { sounds, spawnEmoji } from '../utils/interactions';
import toast from 'react-hot-toast';
import confetti from 'canvas-confetti';

import { useAppContext } from '../contexts/AppContext';

export default function Home() {
  const { t, addToCart } = useAppContext();
  const [featuredBooks, setFeaturedBooks] = useState<Book[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedBook, setSelectedBook] = useState<Book | null>(null);
  
  const containerRef = useRef(null);
  const { scrollYProgress } = useScroll({
    target: containerRef,
    offset: ["start start", "end end"]
  });

  const bgColor = useTransform(scrollYProgress, [0, 0.3, 0.6, 1], ["#0a0a0a", "#1a1a1a", "#2a2a2a", "#D4AF37"]);
  const textColor = useTransform(scrollYProgress, [0, 0.8, 1], ["#ffffff", "#ffffff", "#0a0a0a"]);

  useEffect(() => {
    const fetchFeatured = async () => {
      try {
        const q = query(collection(db, 'books'), limit(4));
        const querySnapshot = await getDocs(q);
        const books = querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Book));
        setFeaturedBooks(books);
      } catch (error) {
        console.error("Error fetching featured books:", error);
      } finally {
        setLoading(false);
      }
    };
    fetchFeatured();
  }, []);

  const handleInteraction = (e: React.MouseEvent, emoji: string) => {
    sounds.click.play();
    spawnEmoji(emoji, e.clientX, e.clientY);
  };

  return (
    <motion.div ref={containerRef} className="bg-luxury-black text-[#F5F5F5]">
      {/* Hero Section: Editorial Luxury */}
      <section className="relative h-[90vh] md:h-screen flex items-center justify-center overflow-hidden">
        {/* Background Layer */}
        <div className="absolute inset-0 z-0">
          <div className="absolute inset-0 bg-gradient-to-b from-luxury-black/40 via-luxury-black/80 to-luxury-black z-10" />
          <motion.img 
            initial={{ scale: 1.1, opacity: 0 }}
            animate={{ scale: 1, opacity: 0.4 }}
            transition={{ duration: 3, ease: "easeOut" }}
            src="https://images.unsplash.com/photo-1507842217343-583bb7270b66?q=80&w=2070&auto=format&fit=crop" 
            className="w-full h-full object-cover"
            referrerPolicy="no-referrer"
          />
        </div>

        <div className="relative z-20 container mx-auto px-6 flex flex-col items-center text-center">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.5 }}
            className="mb-8"
          >
            <span className="inline-block px-4 py-1 border border-gold/30 text-gold text-[10px] uppercase tracking-[0.5em] font-accent">
              {t('hero.cta1')}
            </span>
          </motion.div>
          
          <motion.h1 
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.7, duration: 1.2, ease: [0.16, 1, 0.3, 1] }}
            className="text-4xl sm:text-5xl md:text-8xl font-display mb-8 leading-tight max-w-5xl"
          >
            {t('hero.title1')} <br />
            <span className="gold-text italic">{t('hero.title4')}</span>
          </motion.h1>

          <motion.p 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 1.2, duration: 1.5 }}
            className="text-sm md:text-lg text-luxury-accent mb-12 max-w-2xl mx-auto leading-relaxed font-light tracking-wide"
          >
            {t('hero.subtitle')}
          </motion.p>

          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 1.5 }}
            className="flex flex-col sm:flex-row items-center justify-center gap-6"
          >
            <Link 
              to="/catalog" 
              onClick={(e) => handleInteraction(e as any, '📈')}
              className="btn-luxury group flex items-center gap-4"
            >
              {t('hero.cta1')}
              <ArrowRight className="group-hover:translate-x-2 transition-transform rtl:rotate-180" size={14} />
            </Link>
            <Link 
              to="/catalog?tier=poverty" 
              onClick={(e) => handleInteraction(e as any, '✨')}
              className="btn-luxury-outline"
            >
              {t('hero.cta2')}
            </Link>
          </motion.div>
        </div>

        {/* Vertical Rail Text */}
        <div className="absolute left-10 bottom-20 hidden lg:block">
          <div className="rotate-[-90deg] origin-left text-[10px] uppercase tracking-[0.6em] text-gold/40 font-accent">
            Est. 2026 — Araize Elite
          </div>
        </div>

        {/* Scroll Indicator */}
        <motion.div 
          animate={{ y: [0, 10, 0] }}
          transition={{ duration: 2, repeat: Infinity }}
          className="absolute bottom-10 left-1/2 -translate-x-1/2 flex flex-col items-center gap-4 opacity-50"
        >
          <div className="w-px h-12 bg-gradient-to-b from-gold to-transparent" />
        </motion.div>
      </section>

      <div className="container mx-auto px-6">
        <div className="section-divider" />

        {/* Phase 01: Growth */}
        <section className="grid grid-cols-1 lg:grid-cols-2 gap-12 lg:gap-24 items-center py-12 md:py-20">
          <motion.div
            initial={{ opacity: 0, x: -30 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            className="order-2 lg:order-1"
          >
            <div className="text-gold text-[11px] font-bold uppercase tracking-[0.3em] mb-6 font-accent">Phase 01: {t('common.growth')}</div>
            <h2 className="text-4xl md:text-6xl font-display mb-8 leading-tight">{t('home.phase1.title')}</h2>
            <p className="text-luxury-accent text-lg leading-relaxed mb-12 font-light">
              {t('home.phase1.desc')}
            </p>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
              <div className="luxury-card">
                <Zap className="text-gold mb-6" size={20} />
                <h4 className="font-display text-xl mb-3">{t('home.phase1.feature1.title')}</h4>
                <p className="text-sm text-luxury-accent leading-relaxed">{t('home.phase1.feature1.desc')}</p>
              </div>
              <div className="luxury-card">
                <Shield className="text-gold mb-6" size={20} />
                <h4 className="font-display text-xl mb-3">{t('home.phase1.feature2.title')}</h4>
                <p className="text-sm text-luxury-accent leading-relaxed">{t('home.phase1.feature2.desc')}</p>
              </div>
            </div>
          </motion.div>
          <div className="order-1 lg:order-2 relative aspect-[4/5] overflow-hidden">
            <motion.img 
              whileHover={{ scale: 1.05 }}
              transition={{ duration: 0.8 }}
              src="https://images.unsplash.com/photo-1512820790803-83ca734da794?q=80&w=1000&auto=format&fit=crop" 
              className="w-full h-full object-cover grayscale hover:grayscale-0 transition-all duration-1000"
              referrerPolicy="no-referrer"
            />
            <div className="absolute inset-0 border-[20px] border-luxury-black/50" />
          </div>
        </section>

        <div className="section-divider" />

        {/* Phase 02: Wealth */}
        <section className="py-12 md:py-20">
          <div className="text-center mb-12 md:mb-24">
            <div className="text-gold text-[11px] font-bold uppercase tracking-[0.3em] mb-6 font-accent">Phase 02: {t('common.wealth')}</div>
            <h2 className="text-4xl md:text-7xl font-display">{t('home.phase2.title')}</h2>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-10">
            {[
              { title: t('home.phase2.feature1.title'), icon: DollarSign, desc: t('home.phase2.feature1.desc') },
              { title: t('home.phase2.feature2.title'), icon: Zap, desc: t('home.phase2.feature2.desc') },
              { title: t('home.phase2.feature3.title'), icon: Globe, desc: t('home.phase2.feature3.desc') },
            ].map((item, i) => (
              <motion.div 
                key={i}
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.1 }}
                onClick={(e) => handleInteraction(e as any, '💰')}
                className="luxury-card text-center flex flex-col items-center"
              >
                <div className="w-16 h-16 rounded-full border border-gold/20 flex items-center justify-center mb-8 group-hover:bg-gold/10 transition-colors">
                  <item.icon className="text-gold" size={24} />
                </div>
                <h3 className="text-2xl font-display mb-4">{item.title}</h3>
                <p className="text-luxury-accent text-sm leading-relaxed font-light">{item.desc}</p>
              </motion.div>
            ))}
          </div>
        </section>

        <div className="section-divider" />

        {/* Phase 03: Power */}
        <section className="relative py-20 md:py-40 text-center">
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            whileInView={{ opacity: 1, scale: 1 }}
            viewport={{ once: true }}
            className="max-w-4xl mx-auto px-4"
          >
            <Crown className="mx-auto mb-6 md:mb-10 text-gold/40 w-10 h-10 md:w-15 md:h-15" />
            <h2 className="text-4xl md:text-9xl font-display mb-8 md:mb-10 leading-tight">
              {t('home.phase3.title')} <br />
              <span className="gold-text italic">{t('common.power')}</span>
            </h2>
            <p className="text-xl text-luxury-accent font-light leading-relaxed mb-16">
              {t('home.phase3.desc')}
            </p>
            <Link 
              to="/catalog?tier=power" 
              onClick={(e) => handleInteraction(e as any, '✨')}
              className="btn-luxury px-16"
            >
              {t('home.phase3.cta')}
            </Link>
          </motion.div>
        </section>

        <div className="section-divider" />

        {/* Featured Books */}
        <section className="py-12 md:py-20 mb-20 md:mb-40">
          <div className="flex flex-col md:flex-row items-start md:items-end justify-between mb-12 md:mb-20 gap-8">
            <div className="max-w-2xl">
              <h2 className="text-3xl md:text-6xl font-display mb-6">
                {t('common.elite')} <span className="gold-text italic">{t('common.selections')}</span>
              </h2>
              <p className="text-luxury-accent font-light">{t('home.featured.desc')}</p>
            </div>
            <Link to="/catalog" className="flex items-center gap-3 text-gold text-[11px] font-bold uppercase tracking-[0.3em] hover:text-gold-light transition-colors font-accent">
              {t('common.viewall')} <ArrowRight size={14} className="rtl:rotate-180" />
            </Link>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-12">
            {loading ? (
              Array(4).fill(0).map((_, i) => (
                <div key={i} className="aspect-[3/4] glass animate-pulse" />
              ))
            ) : featuredBooks.map((book, i) => (
              <motion.div 
                key={book.id}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.1 }}
                className="group"
              >
                <div className="relative aspect-[3/4] overflow-hidden mb-8 shadow-2xl">
                  <img 
                    src={book.coverImage || `https://picsum.photos/seed/${book.id}/400/600`} 
                    className="w-full h-full object-cover transition-transform duration-1000 group-hover:scale-110 grayscale group-hover:grayscale-0"
                    referrerPolicy="no-referrer"
                  />
                  <div className="absolute inset-0 bg-luxury-black/40 opacity-0 group-hover:opacity-100 transition-opacity duration-500 flex items-center justify-center p-8">
                    <button 
                      onClick={(e) => {
                        handleInteraction(e as any, '📖');
                        setSelectedBook(book);
                      }}
                      className="w-full py-4 border border-white/30 backdrop-blur-md text-white text-[10px] uppercase tracking-[0.3em] font-bold hover:bg-white hover:text-black transition-all"
                    >
                      {t('common.quickview')}
                    </button>
                  </div>
                  <div className="absolute top-6 left-6">
                    <span className="px-3 py-1 bg-gold text-black text-[9px] font-bold uppercase tracking-widest">
                      {book.tier || 'Growth'}
                    </span>
                  </div>
                </div>
                <h3 className="text-xl font-display mb-2 group-hover:text-gold transition-colors truncate">{book.title}</h3>
                <p className="text-luxury-accent text-xs mb-6 font-light uppercase tracking-widest">{book.author}</p>
                <div className="flex items-center justify-between border-t border-white/5 pt-6">
                  <span className="text-xl font-display text-gold">${book.price}</span>
                  <div className="flex items-center gap-1 text-[10px] text-luxury-accent">
                    <Star size={10} fill="currentColor" className="text-gold" />
                    {book.rating}
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        </section>
      </div>

      {/* Quick View Modal */}
      <AnimatePresence>
        {selectedBook && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-6">
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setSelectedBook(null)}
              className="absolute inset-0 bg-luxury-black/90 backdrop-blur-md"
            />
            <motion.div 
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 20 }}
              className="relative w-full max-w-5xl glass rounded-2xl md:rounded-[3rem] overflow-hidden border-gold/20 shadow-[0_50px_100px_rgba(0,0,0,0.5)] max-h-[90vh] overflow-y-auto"
            >
              <button 
                onClick={() => setSelectedBook(null)}
                className="absolute top-4 right-4 md:top-8 md:right-8 p-2 md:p-3 glass rounded-full hover:bg-white/10 transition-colors z-50"
              >
                <X className="w-5 h-5 md:w-6 md:h-6" />
              </button>

              <div className="grid grid-cols-1 md:grid-cols-2">
                <div className="aspect-[3/4] relative">
                  <img 
                    src={selectedBook.coverImage || `https://picsum.photos/seed/${selectedBook.id}/800/1200`} 
                    className="w-full h-full object-cover"
                    referrerPolicy="no-referrer"
                  />
                  <div className="absolute top-8 left-8 glass-gold px-4 py-2 rounded-full text-xs font-bold text-gold uppercase tracking-widest">
                    {selectedBook.tier || 'Growth'}
                  </div>
                </div>
                
                <div className="p-8 md:p-16 flex flex-col justify-center">
                  <div className="mb-6 md:mb-8">
                    <div className="flex items-center gap-2 text-gold mb-4">
                      <Star size={16} fill="currentColor" />
                      <span className="font-bold tracking-widest text-[10px] md:text-xs uppercase">{selectedBook.rating} {t('common.rating')}</span>
                    </div>
                    <h2 className="text-3xl md:text-5xl font-bold tracking-tighter mb-4">{selectedBook.title}</h2>
                    <p className="text-lg md:text-xl text-luxury-accent italic">{t('common.by')} {selectedBook.author}</p>
                  </div>

                  <p className="text-luxury-accent leading-relaxed mb-12 line-clamp-4">
                    {selectedBook.description}
                  </p>

                  <div className="flex items-center justify-between mb-12 p-6 glass rounded-2xl border-white/5">
                    <div>
                      <div className="text-xs text-luxury-accent uppercase tracking-widest font-bold mb-1">{t('common.investment')}</div>
                      <div className="text-4xl font-bold text-gold">${selectedBook.price}</div>
                    </div>
                    <div className="text-right">
                      <div className="text-xs text-luxury-accent uppercase tracking-widest font-bold mb-1">{t('common.availability')}</div>
                      <div className="text-lg font-bold">{selectedBook.stock > 0 ? t('common.instock') : t('common.waitlist')}</div>
                    </div>
                  </div>

                  <div className="flex flex-col sm:flex-row gap-4">
                    <Link 
                      to={`/book/${selectedBook.id}`}
                      className="btn-gold flex-1 py-4 text-center font-bold tracking-widest uppercase text-sm"
                    >
                      {t('common.details')}
                    </Link>
                    <button 
                      onClick={() => selectedBook && addToCart(selectedBook)}
                      className="btn-outline flex-1 py-4 font-bold tracking-widest uppercase text-sm flex items-center justify-center gap-2"
                    >
                      <ShoppingCart size={18} />
                      {t('common.addvault')}
                    </button>
                  </div>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}
