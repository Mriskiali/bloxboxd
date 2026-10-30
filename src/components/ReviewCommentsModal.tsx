import React, { useState, useEffect } from 'react';
import { X, Send, MessageSquare, Loader2, User, Trash2 } from 'lucide-react';
import { Review, safeAvatarSrc } from '../types';
import { useApp, authHeaders } from '../context/AppContext';

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
  const { user, setLoginModalOpen, incrementReviewCommentsCount, viewUserProfile, language, t, showConfirm, showToast } = useApp();
  const [comments, setComments] = useState<CommentItem[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [newComment, setNewComment] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleDeleteComment = (commentId: string) => {
    if (!user) return;
    showConfirm({
      title: language === 'id' ? 'Hapus Komentar' : 'Delete Comment',
      message: language === 'id' ? 'Yakin ingin menghapus komentar ini?' : 'Are you sure you want to delete this comment?',
      confirmText: language === 'id' ? 'Ya, Hapus' : 'Yes, Delete',
      isDestructive: true,
      onConfirm: async () => {
        try {
          const res = await fetch(`/api/reviews/comments/${encodeURIComponent(commentId)}?userId=${encodeURIComponent(user.id)}`, {
            method: 'DELETE',
            headers: { ...authHeaders() }
          });
          if (res.ok) {
            setComments((prev: CommentItem[]) => prev.filter((c: CommentItem) => c.id !== commentId));
            showToast(language === 'id' ? 'Komentar telah dihapus.' : 'Comment deleted.', 'info');
          }
        } catch {
          showToast(language === 'id' ? 'Gagal menghapus komentar.' : 'Failed to delete comment.', 'error');
        }
      }
    });
  };

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
        headers: { 'Content-Type': 'application/json', ...authHeaders() },
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
          incrementReviewCommentsCount(review.id);
        }
      }
    } catch (err) {
      console.error('Error posting comment:', err);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-[#0a0e12]/85  animate-in fade-in duration-200">
      <div 
        onClick={(e) => e.stopPropagation()}
        className="w-full max-w-lg bg-panel border border-line rounded-[3px] shadow-[0_8px_24px_rgba(0,0,0,0.55)] overflow-hidden flex flex-col max-h-[85vh]"
      >
        {/* Modal Header */}
        <div className="px-5 py-4 border-b border-line flex items-center justify-between bg-panel">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-[3px] bg-green/10 text-green">
              <MessageSquare className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-white">
                {t('comments_modal_title')}
              </h3>
              <p className="text-xs text-muted truncate max-w-xs">
                {language === 'id' 
                  ? `Ulasan ${review.username} tentang ${review.gameTitle}` 
                  : `${review.username}'s review on ${review.gameTitle}`}
              </p>
            </div>
          </div>
          <button 
            onClick={onClose}
            className="p-1.5 text-muted hover:text-white rounded-[2px] hover:bg-panel-2 transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Original Review Snippet */}
        <div className="p-4 bg-bg border-b border-line flex items-start gap-3 text-xs">
          <img 
            src={safeAvatarSrc(review.userAvatar)} 
            alt={review.username} 
            onClick={() => {
              onClose();
              viewUserProfile(review.userId);
            }}
            className="w-8 h-8 rounded-full object-cover bg-black/40 flex-shrink-0 border border-white/10 hover:border-green cursor-pointer transition-colors"
          />
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-1">
              <span 
                onClick={() => {
                  onClose();
                  viewUserProfile(review.userId);
                }}
                className="font-bold text-white hover:text-green cursor-pointer transition-colors"
              >
                {review.username}
              </span>
              {review.rating && (
                <span className="text-green font-mono font-bold">★ {review.rating.toFixed(1)}</span>
              )}
            </div>
            <p className="text-ink italic line-clamp-2">
              "{review.reviewText}"
            </p>
          </div>
        </div>

        {/* Comments List */}
        <div className="flex-1 overflow-y-auto p-4 space-y-3 divide-y divide-line/50">
          {isLoading ? (
            <div className="py-12 flex flex-col items-center justify-center gap-2 text-muted text-xs">
              <Loader2 className="w-5 h-5 animate-spin text-green" />
              <span>{t('comments_modal_loading')}</span>
            </div>
          ) : comments.length > 0 ? (
            comments.map((c) => (
              <div key={c.id} className="pt-3 first:pt-0 flex items-start gap-3 text-xs">
                <img 
                  src={safeAvatarSrc(c.userAvatar)} 
                  alt={c.username}
                  onClick={() => {
                    onClose();
                    viewUserProfile(c.userId);
                  }}
                  className="w-7 h-7 rounded-full object-cover bg-black/40 flex-shrink-0 border border-white/10 hover:border-green cursor-pointer transition-colors mt-0.5" 
                />
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between gap-2 mb-1">
                    <span 
                      onClick={() => {
                        onClose();
                        viewUserProfile(c.userId);
                      }}
                      className="font-bold text-white hover:text-green cursor-pointer transition-colors"
                    >
                      {c.username}
                    </span>
                    <div className="flex items-center gap-1.5">
                      <span className="text-[10px] text-faint">
                        {new Date(c.createdAt).toLocaleDateString(language === 'id' ? 'id-ID' : 'en-US', { hour: '2-digit', minute: '2-digit' })}
                      </span>
                      {user && (c.userId === user.id || c.userId.replace('user-roblox-', '') === user.id.replace('user-roblox-')) && (
                        <button
                          type="button"
                          onClick={() => handleDeleteComment(c.id)}
                          className="text-faint hover:text-red-400 p-0.5 transition-colors cursor-pointer"
                          title={language === 'id' ? 'Hapus komentar' : 'Delete comment'}
                        >
                          <Trash2 className="w-3 h-3" />
                        </button>
                      )}
                    </div>
                  </div>
                  <p className="text-ink leading-relaxed break-words bg-bg p-2.5 rounded-[3px] border border-line">
                    {c.commentText}
                  </p>
                </div>
              </div>
            ))
          ) : (
            <div className="py-12 text-center text-muted text-xs space-y-1">
              <p className="font-semibold text-ink">
                {language === 'id' ? 'Belum ada komentar.' : 'No comments yet.'}
              </p>
              <p className="text-faint">
                {language === 'id' ? 'Jadilah yang pertama mengomentari ulasan ini!' : 'Be the first to reply to this review!'}
              </p>
            </div>
          )}
        </div>

        {/* Comment Input Footer */}
        <form onSubmit={handleSubmit} className="p-3 bg-panel border-t border-line flex items-center gap-2">
          {user ? (
            <>
              <input
                type="text"
                placeholder={t('comments_modal_ph')}
                value={newComment}
                onChange={(e) => setNewComment(e.target.value)}
                maxLength={300}
                className="flex-1 px-3.5 py-2 text-xs bg-panel-2 border border-line focus:border-green rounded-[3px] text-white placeholder:text-faint outline-none transition-colors"
              />
              <button
                type="submit"
                disabled={isSubmitting || !newComment.trim()}
                className="p-2 bg-green hover:bg-[#00c94b] disabled:opacity-50 text-black rounded-[3px] transition-colors font-bold flex-shrink-0 active:scale-95"
                title={t('comments_modal_send')}
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
              <span className="text-muted">{t('comments_modal_login_prompt')}</span>
              <button
                type="button"
                onClick={() => {
                  onClose();
                  setLoginModalOpen(true);
                }}
                className="px-3 py-1 bg-green text-black font-bold rounded-[2px] text-xs hover:bg-[#00c94b] transition-colors"
              >
                {t('nav_login_roblox')}
              </button>
            </div>
          )}
        </form>
      </div>
    </div>
  );
};
