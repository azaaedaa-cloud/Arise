import { motion, useScroll, useTransform } from 'motion/react';
import { ShoppingCart, Heart, ArrowRight, Star, BookOpen, Shield, Zap, Globe, TrendingUp, DollarSign, Crown } from 'lucide-react';
import { Link } from 'react-router-dom';
import { useState, useEffect, useRef } from 'react';
import { collection, query, limit, getDocs, where } from 'firebase/firestore';
import { db } from '../firebase';
import { Book } from '../types';
import { sounds, spawnEmoji } from '../utils/interactions';

export default function Home() {
  const [featuredBooks, setFeaturedBooks] = useState<Book[]>([]);
  const [loading, setLoading] = useState(true);
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
            The Journey Begins
          </motion.div>
          
          <motion.h1 
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.7, duration: 0.8 }}
            className="text-7xl md:text-9xl font-bold tracking-tighter mb-8 leading-[0.8]"
          >
            FROM <span className="text-luxury-accent">ZERO</span> <br />
            TO <span className="text-gold text-glow">POWER</span>
          </motion.h1>

          <motion.p 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 1, duration: 1 }}
            className="text-xl text-luxury-accent mb-12 max-w-2xl mx-auto leading-relaxed"
          >
            Knowledge is the only bridge between where you are and where you belong. Start your ascent today.
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
              Start Your Ascent
              <ArrowRight className="group-hover:translate-x-1 transition-transform" />
            </Link>
            <Link 
              to="/catalog?tier=poverty" 
              onClick={(e) => handleInteraction(e as any, '✨')}
              className="btn-outline w-full md:w-auto justify-center"
            >
              The Foundation
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
          <div className="text-gold font-bold uppercase tracking-widest mb-4">Phase 01: Growth</div>
          <h2 className="text-5xl font-bold tracking-tighter mb-8">BUILD THE <br /> <span className="text-gold">FOUNDATION</span></h2>
          <p className="text-luxury-accent text-lg leading-relaxed mb-12">
            Every empire starts with a single thought. Our "Growth" collection provides the essential wisdom needed to break the cycle and start the climb.
          </p>
          <div className="grid grid-cols-2 gap-8">
            <div className="glass p-6 rounded-2xl">
              <Zap className="text-gold mb-4" size={24} />
              <div className="font-bold mb-2">Mental Clarity</div>
              <p className="text-xs text-luxury-accent">Sharpen your mind for the battles ahead.</p>
            </div>
            <div className="glass p-6 rounded-2xl">
              <Shield className="text-gold mb-4" size={24} />
              <div className="font-bold mb-2">Resilience</div>
              <p className="text-xs text-luxury-accent">Develop the skin of a sovereign individual.</p>
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
          <div className="text-gold font-bold uppercase tracking-widest mb-4">Phase 02: Wealth</div>
          <h2 className="text-6xl font-bold tracking-tighter">ACCUMULATE <span className="text-gold">ABUNDANCE</span></h2>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {[
            { title: "Financial Mastery", icon: DollarSign, desc: "The rules of money have changed. Learn the new game." },
            { title: "Strategic Leverage", icon: Zap, desc: "Work smarter, not harder. Use the tools of the elite." },
            { title: "Network Power", icon: Globe, desc: "Your network is your net worth. Connect with the best." },
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
            <h2 className="text-7xl md:text-9xl font-bold tracking-tighter mb-8">ULTIMATE <span className="text-gold text-glow">POWER</span></h2>
            <p className="text-2xl text-luxury-accent max-w-3xl mx-auto leading-relaxed mb-12">
              The final stage of the journey. Sovereignty, legacy, and total control over your destiny.
            </p>
            <Link 
              to="/catalog?tier=power" 
              onClick={(e) => handleInteraction(e as any, '✨')}
              className="btn-gold px-16 py-5 text-lg"
            >
              Enter the Inner Circle
            </Link>
          </motion.div>
        </div>
      </section>

      {/* Featured Books */}
      <section className="max-w-7xl mx-auto w-full px-6 mb-40">
        <div className="flex items-end justify-between mb-12">
          <div>
            <h2 className="text-4xl font-bold tracking-tighter mb-4">ELITE <span className="text-gold">SELECTIONS</span></h2>
            <p className="text-luxury-accent">Masterpieces curated for your current stage of growth.</p>
          </div>
          <Link to="/catalog" className="hidden md:flex items-center gap-2 text-gold font-bold hover:underline">
            View Full Catalog <ArrowRight size={18} />
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
                  <Link 
                    to={`/book/${book.id}`} 
                    onClick={(e) => handleInteraction(e as any, '📖')}
                    className="btn-gold w-full text-center py-3 text-sm"
                  >
                    Quick View
                  </Link>
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
    </motion.div>
  );
}
