import { useParams, useNavigate, Link } from 'react-router-dom';
import { useState, useEffect, useRef } from 'react';
import { doc, getDoc, collection, query, where, getDocs, addDoc } from 'firebase/firestore';
import { db, auth } from '../firebase';
import { Book, Review } from '../types';
import { motion, useScroll, useTransform } from 'motion/react';
import { Star, ShoppingCart, Heart, Share2, Shield, Zap, Globe, ArrowLeft, Send, Crown } from 'lucide-react';
import { useAppContext } from '../contexts/AppContext';

export default function BookDetails() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { t } = useAppContext();
  const [book, setBook] = useState<Book | null>(null);
  const [reviews, setReviews] = useState<Review[]>([]);
  const [loading, setLoading] = useState(true);
  const [quantity, setQuantity] = useState(1);
  const [newReview, setNewReview] = useState({ rating: 5, comment: '' });

  const { scrollY } = useScroll();
  const y = useTransform(scrollY, [0, 1000], [0, 150]);

  useEffect(() => {
    const fetchBook = async () => {
      if (!id) return;
      setLoading(true);
      try {
        const docRef = doc(db, 'books', id);
        const docSnap = await getDoc(docRef);
        if (docSnap.exists()) {
          setBook({ id: docSnap.id, ...docSnap.data() } as Book);
          
          // Fetch reviews
          const reviewsRef = collection(db, 'books', id, 'reviews');
          const reviewsSnap = await getDocs(reviewsRef);
          setReviews(reviewsSnap.docs.map(doc => ({ id: doc.id, ...doc.data() } as Review)));
        } else {
          navigate('/catalog');
        }
      } catch (error) {
        console.error("Error fetching book details:", error);
      } finally {
        setLoading(false);
      }
    };
    fetchBook();
  }, [id, navigate]);

  const handleAddReview = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!auth.currentUser || !id) return;
    
    try {
      const reviewData = {
        bookId: id,
        userId: auth.currentUser.uid,
        userName: auth.currentUser.displayName || 'Anonymous',
        rating: newReview.rating,
        comment: newReview.comment,
        createdAt: new Date().toISOString()
      };
      await addDoc(collection(db, 'books', id, 'reviews'), reviewData);
      setReviews([...reviews, { id: 'temp', ...reviewData }]);
      setNewReview({ rating: 5, comment: '' });
    } catch (error) {
      console.error("Error adding review:", error);
    }
  };

  const handleShare = async () => {
    const shareData = {
      title: book?.title || 'Araize Masterpiece',
      text: `Check out this masterpiece: ${book?.title} by ${book?.author}`,
      url: window.location.href,
    };

    try {
      if (navigator.share) {
        await navigator.share(shareData);
      } else {
        await navigator.clipboard.writeText(window.location.href);
        // Using a simple notification since alert is discouraged
        const notification = document.createElement('div');
        notification.className = 'fixed bottom-8 left-1/2 -translate-x-1/2 glass px-8 py-4 rounded-full text-gold font-bold z-50 animate-bounce';
        notification.innerText = 'Link copied to clipboard!';
        document.body.appendChild(notification);
        setTimeout(() => notification.remove(), 3000);
      }
    } catch (err) {
      if ((err as Error).name !== 'AbortError') {
        console.error('Error sharing:', err);
      }
    }
  };

  if (loading) return (
    <div className="max-w-7xl mx-auto px-6 py-40 flex flex-col items-center justify-center gap-8">
      <div className="w-16 h-16 border-4 border-gold border-t-transparent rounded-full animate-spin" />
      <p className="text-luxury-accent animate-pulse">Accessing elite archives...</p>
    </div>
  );

  if (!book) return null;

  return (
    <div className="bg-luxury-black min-h-screen text-[#F5F5F5] pt-32 pb-40">
      <div className="container mx-auto px-6">
        <button 
          onClick={() => navigate(-1)} 
          className="flex items-center gap-3 text-gold text-[11px] font-bold uppercase tracking-[0.3em] hover:text-gold-light transition-colors mb-16 font-accent"
        >
          <ArrowLeft size={14} className="rtl:rotate-180" />
          {t('common.back')}
        </button>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-24 mb-40">
          {/* Book Cover */}
          <motion.div 
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="relative aspect-[3/4] overflow-hidden shadow-[0_50px_100px_rgba(0,0,0,0.6)]"
          >
            <motion.img 
              style={{ y }}
              src={book.coverImage || `https://picsum.photos/seed/${book.id}/800/1200`} 
              className="w-full h-full object-cover scale-110 grayscale hover:grayscale-0 transition-all duration-1000"
              referrerPolicy="no-referrer"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-luxury-black/60 via-transparent to-transparent" />
            {book.isDigital && (
              <div className="absolute top-8 left-8 bg-white text-black px-6 py-2 text-[10px] font-bold uppercase tracking-[0.3em]">
                Digital Masterpiece
              </div>
            )}
            <div className="absolute bottom-8 left-8">
              <div className="px-6 py-2 bg-gold text-black text-[10px] font-bold uppercase tracking-[0.3em] flex items-center gap-3">
                <Crown size={14} />
                {book.tier || 'Growth'} Tier
              </div>
            </div>
          </motion.div>

          {/* Book Info */}
          <motion.div 
            initial={{ opacity: 0, x: 30 }}
            animate={{ opacity: 1, x: 0 }}
            className="flex flex-col justify-center"
          >
            <div className="flex items-center gap-6 mb-8">
              <span className="text-gold text-[11px] font-bold uppercase tracking-[0.3em] font-accent">{book.category}</span>
              <div className="flex items-center gap-2 text-gold font-bold text-sm">
                <Star size={14} fill="currentColor" />
                {book.rating} <span className="text-luxury-accent font-light">({book.reviewCount} {t('common.reviews')})</span>
              </div>
            </div>

            <h1 className="text-5xl md:text-7xl font-display mb-6 leading-tight max-w-xl">{book.title}</h1>
            <p className="text-2xl text-luxury-accent mb-12 font-light italic">By {book.author}</p>
            
            <div className="text-5xl font-display text-white mb-12">${book.price}</div>

            <p className="text-luxury-accent text-lg leading-relaxed mb-16 font-light max-w-xl">
              {book.description || "Experience a literary journey like no other. This masterpiece combines profound wisdom with captivating storytelling, meticulously curated for our elite readers."}
            </p>

            <div className="flex flex-col sm:flex-row items-center gap-8 mb-16">
              <div className="flex items-center border border-white/10 p-1 w-full sm:w-auto">
                <button 
                  onClick={() => setQuantity(Math.max(1, quantity - 1))}
                  className="w-14 h-14 flex items-center justify-center hover:bg-white/5 transition-colors text-luxury-accent"
                >
                  -
                </button>
                <span className="w-14 text-center font-display text-xl">{quantity}</span>
                <button 
                  onClick={() => setQuantity(quantity + 1)}
                  className="w-14 h-14 flex items-center justify-center hover:bg-white/5 transition-colors text-luxury-accent"
                >
                  +
                </button>
              </div>
              <button className="btn-luxury flex-grow flex items-center justify-center gap-4 w-full sm:w-auto">
                <ShoppingCart size={18} />
                {t('common.addtocart')}
              </button>
              <div className="flex gap-4 w-full sm:w-auto">
                <button className="p-5 border border-white/10 hover:border-white/30 transition-colors text-luxury-accent hover:text-white">
                  <Heart size={24} />
                </button>
                <button 
                  onClick={handleShare}
                  className="p-5 border border-white/10 hover:border-white/30 transition-colors text-luxury-accent hover:text-white"
                  title="Share Masterpiece"
                >
                  <Share2 size={24} />
                </button>
              </div>
            </div>

            <div className="grid grid-cols-3 gap-8 border-t border-white/5 pt-12">
              {[
                { label: "Secure", icon: Shield, color: "text-gold/60" },
                { label: "Elite", icon: Crown, color: "text-gold/60" },
                { label: "Global", icon: Globe, color: "text-gold/60" },
              ].map((feature, i) => (
                <div key={i} className="text-center">
                  <feature.icon className={`mx-auto mb-4 ${feature.color}`} size={24} />
                  <div className="text-[10px] font-bold uppercase tracking-[0.3em] text-luxury-accent font-accent">{feature.label}</div>
                </div>
              ))}
            </div>
          </motion.div>
        </div>

        {/* Reviews Section */}
        <section className="max-w-4xl mx-auto">
          <div className="text-center mb-24">
            <h2 className="text-4xl md:text-6xl font-display mb-6">
              READER <span className="gold-text italic">REVIEWS</span>
            </h2>
            <p className="text-luxury-accent font-light uppercase tracking-widest text-xs">Insights from the elite community ({reviews.length})</p>
          </div>

          {/* Add Review */}
          {auth.currentUser ? (
            <form onSubmit={handleAddReview} className="bg-white/[0.02] border border-white/5 p-12 mb-24">
              <h3 className="text-2xl font-display mb-10">Share your thoughts</h3>
              <div className="flex items-center gap-6 mb-10">
                <span className="text-[10px] text-luxury-accent uppercase font-bold tracking-[0.3em] font-accent">Rating</span>
                <div className="flex gap-3">
                  {[1, 2, 3, 4, 5].map(star => (
                    <button 
                      key={star}
                      type="button"
                      onClick={() => setNewReview({ ...newReview, rating: star })}
                      className={`transition-colors ${newReview.rating >= star ? 'text-gold' : 'text-white/10'}`}
                    >
                      <Star size={24} fill={newReview.rating >= star ? "currentColor" : "none"} />
                    </button>
                  ))}
                </div>
              </div>
              <textarea 
                placeholder="Write your elite review here..."
                className="w-full h-40 bg-white/[0.03] border border-white/10 p-8 outline-none focus:border-gold/50 transition-all mb-10 resize-none font-light leading-relaxed"
                value={newReview.comment}
                onChange={(e) => setNewReview({ ...newReview, comment: e.target.value })}
                required
              />
              <button type="submit" className="btn-luxury px-12 flex items-center gap-4">
                Post Review <Send size={16} />
              </button>
            </form>
          ) : (
            <div className="bg-white/[0.02] border border-white/5 p-12 text-center mb-24">
              <p className="text-luxury-accent font-light mb-8">Please sign in to share your thoughts on this masterpiece.</p>
              <Link to="/auth" className="text-gold text-[11px] font-bold uppercase tracking-[0.3em] hover:text-gold-light transition-colors font-accent">Sign In Now</Link>
            </div>
          )}

          {/* Review List */}
          <div className="space-y-12">
            {reviews.length > 0 ? (
              reviews.map((review, i) => (
                <motion.div 
                  key={review.id}
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: i * 0.1 }}
                  className="bg-white/[0.02] border border-white/5 p-12"
                >
                  <div className="flex items-center justify-between mb-8">
                    <div className="flex items-center gap-6">
                      <div className="w-14 h-14 border border-gold/20 flex items-center justify-center font-display text-2xl text-gold">
                        {review.userName[0]}
                      </div>
                      <div>
                        <div className="text-lg font-display mb-1">{review.userName}</div>
                        <div className="text-[10px] text-luxury-accent uppercase tracking-widest font-light">{new Date(review.createdAt).toLocaleDateString()}</div>
                      </div>
                    </div>
                    <div className="flex items-center gap-1 text-gold">
                      {Array(review.rating).fill(0).map((_, i) => <Star key={i} size={14} fill="currentColor" />)}
                    </div>
                  </div>
                  <p className="text-luxury-accent leading-relaxed font-light text-lg italic">"{review.comment}"</p>
                </motion.div>
              ))
            ) : (
              <div className="text-center py-24 border border-dashed border-white/10">
                <p className="text-luxury-accent font-light italic">Be the first elite reader to review this masterpiece.</p>
              </div>
            )}
          </div>
        </section>
      </div>
    </div>
  );
}
