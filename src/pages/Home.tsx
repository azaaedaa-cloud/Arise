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
  const { t } = useAppContext();
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
    <motion.div ref={containerRef} style={{ backgroundColor: bgColor, color: textColor }} className="flex flex-col gap-40 transition-colors duration-1000">
      {/* Hero Section: The Beginning (Poverty/Darkness) */}
      <section className="relative h-screen flex items-center justify-center overflow-hidden px-6">
        <div className="absolute inset-0 z-0">
          <div className="absolute inset-0 bg-gradient-to-b from-transparent via-luxury-black/80 to-luxury-black z-10" />
          <motion.img 
            initial={{ scale: 1.1, opacity: 0 }}
            animate={{ scale: 1, opacity: 0.2 }}
            transition={{ duration: 2 }}
            src="https://picsum.photos/seed/darkness/1920/1080?blur=10" 
            className="w-full h-full object-cover"
            referrerPolicy="no-referrer"
          />
        </div>

        <div className="relative z-20 text-center max-w-4xl">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.5 }}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-full glass mb-8 text-xs font-bold tracking-widest uppercase"
          >
            <TrendingUp size={14} className="text-gold" />
            {t('hero.cta1')}
          </motion.div>
          
          <motion.h1 
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.7, duration: 0.8 }}
            className="text-7xl md:text-9xl font-bold tracking-tighter mb-8 leading-[0.8]"
          >
            {t('hero.title1')} <span className="text-luxury-accent">{t('hero.title2')}</span> <br />
            {t('hero.title3')} <span className="text-gold text-glow">{t('hero.title4')}</span>
          </motion.h1>

          <motion.p 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 1, duration: 1 }}
            className="text-xl text-luxury-accent mb-12 max-w-2xl mx-auto leading-relaxed"
          >
            {t('hero.subtitle')}
          </motion.p>

          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 1.2 }}
            className="flex flex-col md:flex-row items-center justify-center gap-6"
          >
            <Link 
              to="/catalog" 
              onClick={(e) => handleInteraction(e as any, '📈')}
              className="btn-gold group flex items-center gap-2 w-full md:w-auto justify-center"
            >
              {t('hero.cta1')}
              <ArrowRight className="group-hover:translate-x-1 transition-transform rtl:rotate-180" />
            </Link>
            <Link 
              to="/catalog?tier=poverty" 
              onClick={(e) => handleInteraction(e as any, '✨')}
              className="btn-outline w-full md:w-auto justify-center"
            >
              {t('hero.cta2')}
            </Link>
          </motion.div>
        </div>
      </section>

      {/* Tier 1: Growth (The Struggle) */}
      <section className="max-w-7xl mx-auto w-full px-6 grid grid-cols-1 md:grid-cols-2 gap-20 items-center">
        <motion.div
          initial={{ opacity: 0, x: -50 }}
          whileInView={{ opacity: 1, x: 0 }}
          viewport={{ once: true }}
        >
          <div className="text-gold font-bold uppercase tracking-widest mb-4">Phase 01: {t('common.growth')}</div>
          <h2 className="text-5xl font-bold tracking-tighter mb-8">{t('home.phase1.title')}</h2>
          <p className="text-luxury-accent text-lg leading-relaxed mb-12">
            {t('home.phase1.desc')}
          </p>
          <div className="grid grid-cols-2 gap-8">
            <div className="glass p-6 rounded-2xl">
              <Zap className="text-gold mb-4" size={24} />
              <div className="font-bold mb-2">{t('home.phase1.feature1.title')}</div>
              <p className="text-xs text-luxury-accent">{t('home.phase1.feature1.desc')}</p>
            </div>
            <div className="glass p-6 rounded-2xl">
              <Shield className="text-gold mb-4" size={24} />
              <div className="font-bold mb-2">{t('home.phase1.feature2.title')}</div>
              <p className="text-xs text-luxury-accent">{t('home.phase1.feature2.desc')}</p>
            </div>
          </div>
        </motion.div>
        <div className="relative aspect-square glass rounded-[3rem] overflow-hidden">
          <img src="https://picsum.photos/seed/growth/800/800" className="w-full h-full object-cover opacity-50" referrerPolicy="no-referrer" />
          <div className="absolute inset-0 flex items-center justify-center">
            <motion.div 
              animate={{ scale: [1, 1.1, 1] }}
              transition={{ duration: 3, repeat: Infinity }}
              className="w-32 h-32 bg-gold/20 rounded-full flex items-center justify-center border border-gold/30"
            >
              <TrendingUp size={48} className="text-gold" />
            </motion.div>
          </div>
        </div>
      </section>

      {/* Tier 2: Wealth (The Accumulation) */}
      <section className="max-w-7xl mx-auto w-full px-6">
        <div className="text-center mb-20">
          <div className="text-gold font-bold uppercase tracking-widest mb-4">Phase 02: {t('common.wealth')}</div>
          <h2 className="text-6xl font-bold tracking-tighter">{t('home.phase2.title')}</h2>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {[
            { title: t('home.phase2.feature1.title'), icon: DollarSign, desc: t('home.phase2.feature1.desc') },
            { title: t('home.phase2.feature2.title'), icon: Zap, desc: t('home.phase2.feature2.desc') },
            { title: t('home.phase2.feature3.title'), icon: Globe, desc: t('home.phase2.feature3.desc') },
          ].map((item, i) => (
            <motion.div 
              key={i}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.1 }}
              onClick={(e) => handleInteraction(e as any, '💰')}
              className="glass p-10 rounded-[2.5rem] border-white/5 hover:border-gold/30 transition-all cursor-pointer group"
            >
              <item.icon className="text-gold mb-8 group-hover:scale-110 transition-transform" size={40} />
              <h3 className="text-2xl font-bold mb-4">{item.title}</h3>
              <p className="text-luxury-accent leading-relaxed">{item.desc}</p>
            </motion.div>
          ))}
        </div>
      </section>

      {/* Tier 3: Power (The Ultimate Goal) */}
      <section className="relative py-40 overflow-hidden">
        <div className="absolute inset-0 poverty-to-wealth opacity-20 -z-10" />
        <div className="max-w-7xl mx-auto px-6 text-center">
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            whileInView={{ opacity: 1, scale: 1 }}
            viewport={{ once: true }}
          >
            <Crown className="mx-auto mb-8 text-gold" size={80} />
            <h2 className="text-7xl md:text-9xl font-bold tracking-tighter mb-8">{t('home.phase3.title')} <span className="text-gold text-glow">{t('common.power')}</span></h2>
            <p className="text-2xl text-luxury-accent max-w-3xl mx-auto leading-relaxed mb-12">
              {t('home.phase3.desc')}
            </p>
            <Link 
              to="/catalog?tier=power" 
              onClick={(e) => handleInteraction(e as any, '✨')}
              className="btn-gold px-16 py-5 text-lg"
            >
              {t('home.phase3.cta')}
            </Link>
          </motion.div>
        </div>
      </section>

      {/* Featured Books */}
      <section className="max-w-7xl mx-auto w-full px-6 mb-40">
        <div className="flex items-end justify-between mb-12">
          <div>
            <h2 className="text-4xl font-bold tracking-tighter mb-4">{t('common.elite')} <span className="text-gold">{t('common.selections')}</span></h2>
            <p className="text-luxury-accent">{t('home.featured.desc')}</p>
          </div>
          <Link to="/catalog" className="hidden md:flex items-center gap-2 text-gold font-bold hover:underline">
            {t('common.viewall')} <ArrowRight size={18} className="rtl:rotate-180" />
          </Link>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8">
          {loading ? (
            Array(4).fill(0).map((_, i) => (
              <div key={i} className="h-[450px] glass rounded-3xl animate-pulse" />
            ))
          ) : featuredBooks.map((book, i) => (
            <motion.div 
              key={book.id}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.1 }}
              className="group relative"
            >
              <div className="relative aspect-[3/4] rounded-3xl overflow-hidden mb-6 shadow-2xl transition-transform duration-500 group-hover:-translate-y-2">
                <img 
                  src={book.coverImage || `https://picsum.photos/seed/${book.id}/400/600`} 
                  className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110"
                  referrerPolicy="no-referrer"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-luxury-black via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-end p-6">
                  <button 
                    onClick={(e) => {
                      handleInteraction(e as any, '📖');
                      setSelectedBook(book);
                    }}
                    className="btn-gold w-full text-center py-3 text-sm glass group-hover:translate-y-0 translate-y-4 transition-all duration-500"
                  >
                    {t('common.quickview')}
                  </button>
                </div>
                <div className="absolute top-4 left-4 glass-gold px-3 py-1 rounded-full text-[10px] font-bold text-gold uppercase tracking-widest">
                  {book.tier || 'Growth'}
                </div>
              </div>
              <h3 className="text-xl font-bold mb-1 group-hover:text-gold transition-colors truncate">{book.title}</h3>
              <p className="text-luxury-accent text-sm mb-4">{book.author}</p>
              <div className="flex items-center justify-between">
                <span className="text-2xl font-bold text-gold">${book.price}</span>
                <div className="flex items-center gap-1 text-xs font-bold bg-white/5 px-2 py-1 rounded">
                  <Star size={12} fill="currentColor" className="text-gold" />
                  {book.rating}
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      </section>

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
              className="relative w-full max-w-5xl glass rounded-[3rem] overflow-hidden border-gold/20 shadow-[0_50px_100px_rgba(0,0,0,0.5)]"
            >
              <button 
                onClick={() => setSelectedBook(null)}
                className="absolute top-8 right-8 p-3 glass rounded-full hover:bg-white/10 transition-colors z-50"
              >
                <X size={24} />
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
                
                <div className="p-12 md:p-16 flex flex-col justify-center">
                  <div className="mb-8">
                    <div className="flex items-center gap-2 text-gold mb-4">
                      <Star size={16} fill="currentColor" />
                      <span className="font-bold tracking-widest text-xs uppercase">{selectedBook.rating} {t('common.rating')}</span>
                    </div>
                    <h2 className="text-5xl font-bold tracking-tighter mb-4">{selectedBook.title}</h2>
                    <p className="text-xl text-luxury-accent italic">{t('common.by')} {selectedBook.author}</p>
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
                    <button className="btn-outline flex-1 py-4 font-bold tracking-widest uppercase text-sm flex items-center justify-center gap-2">
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
