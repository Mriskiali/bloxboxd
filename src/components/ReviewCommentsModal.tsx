import React, { useState, useEffect } from 'react';
import { X, Send, MessageSquare, Loader2, User } from 'lucide-react';
import { Review, safeAvatarSrc } from '../types';
import { useApp } from '../context/AppContext';

interface CommentItem {
  id: string;
  reviewId: string;
  userId: string;
  username: string;
  userAvatar?: string;
  commentText: string;
  createdAt: string;
}

interface ReviewCommentsModalProps {
  review: Review | null;
  isOpen: boolean;
  onClose: () => void;
}

export const ReviewCommentsModal: React.FC<ReviewCommentsModalProps> = ({ review, isOpen, onClose }) => {
  const { user, setLoginModalOpen } = useApp();
  const [comments, setComments] = useState<CommentItem[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [newComment, setNewComment] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (!isOpen || !review) return;

    let isMounted = true;
    setIsLoading(true);

    fetch(`/api/reviews/${encodeURIComponent(review.id)}/comments`)
      .then(res => res.ok ? res.json() : { comments: [] })
      .then(data => {
        if (isMounted && Array.isArray(data.comments)) {
          setComments(data.comments);
        }
      })
      .catch(err => console.warn('Error loading comments:', err))
      .finally(() => {
        if (isMounted) setIsLoading(false);
      });

    return () => { isMounted = false; };
  }, [isOpen, review?.id]);

  if (!isOpen || !review) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const text = newComment.trim();
    if (!text) return;

    if (!user) {
      setLoginModalOpen(true);
      return;
    }

    setIsSubmitting(true);
    try {
      const res = await fetch(`/api/reviews/${encodeURIComponent(review.id)}/comments`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId: user.id,
          username: user.username,
          userAvatar: user.avatarUrl,
          commentText: text
        })
      });

      if (res.ok) {
        const data = await res.json();
        if (data.comment) {
          setComments(prev => [...prev, data.comment]);
          setNewComment('');
        }
      }
    } catch (err) {
      console.error('Error posting comment:', err);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-200">
      <div 
        onClick={(e) => e.stopPropagation()}
        className="w-full max-w-lg bg-[#182028] border border-[#2b3947] rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[85vh]"
      >
        {/* Modal Header */}
        <div className="px-5 py-4 border-b border-[#26323f] flex items-center justify-between bg-[#151c23]">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-[#00E59B]/10 text-[#00E59B]">
              <MessageSquare className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-white">
                Komentar Ulasan
              </h3>
              <p className="text-xs text-gray-400 truncate max-w-xs">
                Ulasan {review.username} tentang {review.gameTitle}
              </p>
            </div>
          </div>
          <button 
            onClick={onClose}
            className="p-1.5 text-gray-400 hover:text-white rounded-lg hover:bg-[#202934] transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Original Review Snippet */}
        <div className="p-4 bg-[#131920] border-b border-[#222c37] flex items-start gap-3 text-xs">
          <img 
            src={safeAvatarSrc(review.userAvatar)} 
            alt={review.username} 
            className="w-8 h-8 rounded-full object-cover bg-black/40 flex-shrink-0 border border-white/10"
          />
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-1">
              <span className="font-bold text-white">{review.username}</span>
              {review.rating && (
                <span className="text-[#00E59B] font-mono font-bold">★ {review.rating.toFixed(1)}</span>
              )}
            </div>
            <p className="text-gray-300 italic line-clamp-2">
              "{review.reviewText}"
            </p>
          </div>
        </div>

        {/* Comments List */}
        <div className="flex-1 overflow-y-auto p-4 space-y-3 divide-y divide-[#222c37]/50">
          {isLoading ? (
            <div className="py-12 flex flex-col items-center justify-center gap-2 text-gray-400 text-xs">
              <Loader2 className="w-5 h-5 animate-spin text-[#00E59B]" />
              <span>Memuat komentar...</span>
            </div>
          ) : comments.length > 0 ? (
            comments.map((c) => (
              <div key={c.id} className="pt-3 first:pt-0 flex items-start gap-3 text-xs">
                <img 
                  src={safeAvatarSrc(c.userAvatar)} 
                  alt={c.username}
                  className="w-7 h-7 rounded-full object-cover bg-black/40 flex-shrink-0 border border-white/10 mt-0.5" 
                />
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between gap-2 mb-1">
                    <span className="font-bold text-white">{c.username}</span>
                    <span className="text-[10px] text-gray-500">
                      {new Date(c.createdAt).toLocaleDateString('id-ID', { hour: '2-digit', minute: '2-digit' })}
                    </span>
                  </div>
                  <p className="text-gray-200 leading-relaxed break-words bg-[#131920] p-2.5 rounded-xl border border-[#232c37]">
                    {c.commentText}
                  </p>
                </div>
              </div>
            ))
          ) : (
            <div className="py-12 text-center text-gray-400 text-xs space-y-1">
              <p className="font-semibold text-gray-300">Belum ada komentar.</p>
              <p className="text-gray-500">Jadilah yang pertama mengomentari ulasan ini!</p>
            </div>
          )}
        </div>

        {/* Comment Input Footer */}
        <form onSubmit={handleSubmit} className="p-3 bg-[#151c23] border-t border-[#26323f] flex items-center gap-2">
          {user ? (
            <>
              <input
                type="text"
                placeholder="Tulis komentar kamu..."
                value={newComment}
                onChange={(e) => setNewComment(e.target.value)}
                maxLength={300}
                className="flex-1 px-3.5 py-2 text-xs bg-[#1e2732] border border-[#2e3b4a] focus:border-[#00E59B] rounded-xl text-white placeholder:text-gray-500 outline-none transition-all"
              />
              <button
                type="submit"
                disabled={isSubmitting || !newComment.trim()}
                className="p-2 bg-[#00E59B] hover:bg-[#00c988] disabled:opacity-50 text-black rounded-xl transition-all font-bold flex-shrink-0 active:scale-95"
                title="Kirim komentar"
              >
                {isSubmitting ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <Send className="w-4 h-4" />
                )}
              </button>
            </>
          ) : (
            <div className="w-full flex items-center justify-between px-2 py-1 text-xs">
              <span className="text-gray-400">Masuk untuk menulis komentar</span>
              <button
                type="button"
                onClick={() => {
                  onClose();
                  setLoginModalOpen(true);
                }}
                className="px-3 py-1 bg-[#00E59B] text-black font-bold rounded-lg text-xs hover:bg-[#00c988] transition-colors"
              >
                Masuk Roblox
              </button>
            </div>
          )}
        </form>
      </div>
    </div>
  );
};
