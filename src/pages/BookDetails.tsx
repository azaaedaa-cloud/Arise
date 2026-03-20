import { useParams, useNavigate, Link } from 'react-router-dom';
import { useState, useEffect, useRef } from 'react';
import { doc, getDoc, collection, query, where, getDocs, addDoc } from 'firebase/firestore';
import { db, auth } from '../firebase';
import { Book, Review } from '../types';
import { motion, useScroll, useTransform } from 'motion/react';
import { Star, ShoppingCart, Heart, Share2, Shield, Zap, Globe, ArrowLeft, Send } from 'lucide-react';

export default function BookDetails() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
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
    <div className="max-w-7xl mx-auto px-6 py-20">
      <button onClick={() => navigate(-1)} className="flex items-center gap-2 text-luxury-accent hover:text-gold transition-colors mb-12">
        <ArrowLeft size={18} />
        Back to Catalog
      </button>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-20 mb-32">
        {/* Book Cover */}
        <motion.div 
          initial={{ opacity: 0, x: -50 }}
          animate={{ opacity: 1, x: 0 }}
          className="relative aspect-[3/4] rounded-[3rem] overflow-hidden shadow-[0_50px_100px_rgba(0,0,0,0.5)]"
        >
          <motion.img 
            style={{ y }}
            src={book.coverImage || `https://picsum.photos/seed/${book.id}/800/1200`} 
            className="w-full h-full object-cover scale-110"
            referrerPolicy="no-referrer"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-luxury-black/80 via-transparent to-transparent" />
          {book.isDigital && (
            <div className="absolute top-8 left-8 glass-gold px-6 py-2 rounded-full text-sm font-bold text-gold uppercase tracking-widest">
              Digital Masterpiece
            </div>
          )}
        </motion.div>

        {/* Book Info */}
        <motion.div 
          initial={{ opacity: 0, x: 50 }}
          animate={{ opacity: 1, x: 0 }}
          className="flex flex-col"
        >
          <div className="flex items-center gap-4 mb-6">
            <span className="text-gold font-bold uppercase tracking-widest text-sm">{book.category}</span>
            <div className="flex items-center gap-1 text-gold font-bold">
              <Star size={16} fill="currentColor" />
              {book.rating} ({book.reviewCount} Reviews)
            </div>
          </div>

          <h1 className="text-5xl md:text-7xl font-bold tracking-tighter mb-4 leading-tight">{book.title}</h1>
          <p className="text-2xl text-luxury-accent mb-8 font-medium">By {book.author}</p>
          
          <div className="text-4xl font-bold text-white mb-10">${book.price}</div>

          <p className="text-luxury-accent text-lg leading-relaxed mb-12">
            {book.description || "Experience a literary journey like no other. This masterpiece combines profound wisdom with captivating storytelling, meticulously curated for our elite readers."}
          </p>

          <div className="flex flex-col sm:flex-row items-center gap-6 mb-12">
            <div className="flex items-center glass rounded-2xl p-1 w-full sm:w-auto">
              <button 
                onClick={() => setQuantity(Math.max(1, quantity - 1))}
                className="w-12 h-12 flex items-center justify-center hover:bg-white/10 rounded-xl transition-colors"
              >
                -
              </button>
              <span className="w-12 text-center font-bold">{quantity}</span>
              <button 
                onClick={() => setQuantity(quantity + 1)}
                className="w-12 h-12 flex items-center justify-center hover:bg-white/10 rounded-xl transition-colors"
              >
                +
              </button>
            </div>
            <button className="btn-gold flex-grow flex items-center justify-center gap-3 w-full sm:w-auto">
              <ShoppingCart size={20} />
              Add to Collection
            </button>
            <button className="p-4 glass rounded-2xl hover:text-red-500 transition-colors">
              <Heart size={24} />
            </button>
            <button 
              onClick={handleShare}
              className="p-4 glass rounded-2xl hover:text-gold transition-colors"
              title="Share Masterpiece"
            >
              <Share2 size={24} />
            </button>
          </div>

          <div className="grid grid-cols-3 gap-4">
            {[
              { label: "Secure", icon: Shield, color: "text-blue-400" },
              { label: "Instant", icon: Zap, color: "text-gold" },
              { label: "Global", icon: Globe, color: "text-emerald-400" },
            ].map((feature, i) => (
              <div key={i} className="glass p-4 rounded-2xl text-center">
                <feature.icon className={`mx-auto mb-2 ${feature.color}`} size={20} />
                <div className="text-[10px] font-bold uppercase tracking-widest text-luxury-accent">{feature.label}</div>
              </div>
            ))}
          </div>
        </motion.div>
      </div>

      {/* Reviews Section */}
      <section className="max-w-4xl mx-auto">
        <h2 className="text-3xl font-bold mb-12 flex items-center gap-4">
          READER <span className="text-gold">REVIEWS</span>
          <span className="text-sm text-luxury-accent font-normal">({reviews.length})</span>
        </h2>

        {/* Add Review */}
        {auth.currentUser ? (
          <form onSubmit={handleAddReview} className="glass p-8 rounded-3xl mb-16 border-gold/10">
            <h3 className="text-xl font-bold mb-6">Share your thoughts</h3>
            <div className="flex items-center gap-4 mb-6">
              <span className="text-sm text-luxury-accent uppercase font-bold tracking-widest">Rating</span>
              <div className="flex gap-2">
                {[1, 2, 3, 4, 5].map(star => (
                  <button 
                    key={star}
                    type="button"
                    onClick={() => setNewReview({ ...newReview, rating: star })}
                    className={`transition-colors ${newReview.rating >= star ? 'text-gold' : 'text-luxury-gray'}`}
                  >
                    <Star size={24} fill={newReview.rating >= star ? "currentColor" : "none"} />
                  </button>
                ))}
              </div>
            </div>
            <textarea 
              placeholder="Write your elite review here..."
              className="w-full h-32 glass border-white/10 rounded-2xl p-6 outline-none focus:border-gold transition-all mb-6 resize-none"
              value={newReview.comment}
              onChange={(e) => setNewReview({ ...newReview, comment: e.target.value })}
              required
            />
            <button type="submit" className="btn-gold flex items-center gap-2">
              Post Review <Send size={18} />
            </button>
          </form>
        ) : (
          <div className="glass p-8 rounded-3xl text-center mb-16">
            <p className="text-luxury-accent mb-4">Please sign in to share your thoughts on this masterpiece.</p>
            <Link to="/auth" className="text-gold font-bold hover:underline">Sign In Now</Link>
          </div>
        )}

        {/* Review List */}
        <div className="space-y-8">
          {reviews.length > 0 ? (
            reviews.map((review, i) => (
              <motion.div 
                key={review.id}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.1 }}
                className="glass p-8 rounded-3xl border-white/5"
              >
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 bg-luxury-gray rounded-full flex items-center justify-center font-bold text-gold">
                      {review.userName[0]}
                    </div>
                    <div>
                      <div className="font-bold">{review.userName}</div>
                      <div className="text-xs text-luxury-accent">{new Date(review.createdAt).toLocaleDateString()}</div>
                    </div>
                  </div>
                  <div className="flex items-center gap-1 text-gold">
                    {Array(review.rating).fill(0).map((_, i) => <Star key={i} size={14} fill="currentColor" />)}
                  </div>
                </div>
                <p className="text-luxury-accent leading-relaxed">{review.comment}</p>
              </motion.div>
            ))
          ) : (
            <div className="text-center py-20 glass rounded-3xl border-dashed border-white/10">
              <p className="text-luxury-accent">Be the first elite reader to review this masterpiece.</p>
            </div>
          )}
        </div>
      </section>
    </div>
  );
}
