import type { Express } from 'express';
import {
  getAllReviews,
  upsertReview,
  toggleReviewLike,
  getAllCustomLists,
  upsertCustomList,
  deleteCustomList,
  toggleListLike,
  toggleFollowUser,
  getFollowStatus,
  getCommunityFeed,
  getTrendingReviewsAndLeaderboard,
  getReviewComments,
  addReviewComment,
  deleteReviewComment
} from '../db/index';
import { requireAuth } from '../lib/auth';
import { sanitizeText } from '../lib/security';

/** Reviews, custom lists, follows, feed and comments. */
export function registerSocialRoutes(app: Express): void {
// Get community reviews (optional ?gameId=...)
app.get('/api/reviews', async (req, res) => {
  try {
    const gameId = (req.query.gameId as string)?.trim();
    const reviews = await getAllReviews(gameId);
    return res.json({ reviews });
  } catch (err) {
    console.error('Error fetching reviews:', err);
    return res.status(500).json({ error: 'Failed to fetch reviews' });
  }
});

// Create or update review
app.post('/api/reviews', async (req, res) => {
  try {
    const review = req.body;
    if (!review || !review.userId || !review.gameId || !review.reviewText?.trim()) {
      return res.status(400).json({ error: 'Invalid review payload' });
    }
    if (!await requireAuth(req, res, review.userId)) return;
    // Security: Sanitize review text and bound length (Anti-XSS & Payload Protection)
    review.reviewText = sanitizeText(review.reviewText, 3000);
    review.username = sanitizeText(review.username, 50);

    await upsertReview(review);
    return res.json({ success: true, message: 'Review saved' });
  } catch (err) {
    console.error('Error saving review:', err);
    return res.status(500).json({ error: 'Failed to save review' });
  }
});

// Toggle review like
app.post('/api/reviews/:id/like', async (req, res) => {
  try {
    const reviewId = req.params.id;
    const { userId } = req.body;
    if (!reviewId || !userId) {
      return res.status(400).json({ error: 'reviewId and userId are required' });
    }
    if (!await requireAuth(req, res, userId)) return;
    const result = await toggleReviewLike(userId, reviewId);
    return res.json({ success: true, ...result });
  } catch (err) {
    console.error('Error liking review:', err);
    return res.status(500).json({ error: 'Failed to like review' });
  }
});

// Get public custom lists
app.get('/api/lists', async (req, res) => {
  try {
    const userId = (req.query.userId as string)?.trim();
    const lists = await getAllCustomLists(userId);
    return res.json({ lists });
  } catch (err) {
    console.error('Error fetching lists:', err);
    return res.status(500).json({ error: 'Failed to fetch lists' });
  }
});

// Create or update custom list
app.post('/api/lists', async (req, res) => {
  try {
    const list = req.body;
    if (!list || !list.userId || !list.title?.trim()) {
      return res.status(400).json({ error: 'userId and title are required' });
    }
    // Security: Sanitize list fields (Anti-XSS & length bounding)
    list.title = sanitizeText(list.title, 120);
    list.description = sanitizeText(list.description, 1000);
    list.userName = sanitizeText(list.userName, 50);

    if (!await requireAuth(req, res, list.userId)) return;
    await upsertCustomList(list);
    return res.json({ success: true, message: 'List saved' });
  } catch (err) {
    console.error('Error saving list:', err);
    return res.status(500).json({ error: 'Failed to save list' });
  }
});

// Delete custom list
app.delete('/api/lists/:id', async (req, res) => {
  try {
    const listId = req.params.id;
    const userId = (req.query.userId as string)?.trim();
    if (!listId || !userId) {
      return res.status(400).json({ error: 'listId and userId query are required' });
    }
    if (!await requireAuth(req, res, userId)) return;
    const deleted = await deleteCustomList(userId, listId);
    if (!deleted) {
      return res.status(404).json({ error: 'List not found' });
    }
    return res.json({ success: true, message: 'List deleted' });
  } catch (err) {
    console.error('Error deleting list:', err);
    return res.status(500).json({ error: 'Failed to delete list' });
  }
});

// Toggle list like
app.post('/api/lists/:id/like', async (req, res) => {
  try {
    const listId = req.params.id;
    const { userId } = req.body;
    if (!listId || !userId) {
      return res.status(400).json({ error: 'listId and userId are required' });
    }
    if (!await requireAuth(req, res, userId)) return;
    const result = await toggleListLike(userId, listId);
    return res.json({ success: true, ...result });
  } catch (err) {
    console.error('Error liking list:', err);
    return res.status(500).json({ error: 'Failed to like list' });
  }
});

// ===========================================================================
// Social Features Endpoints: Follow, Feed, Trending & Leaderboard, Comments
// ===========================================================================

// Follow / Unfollow user
app.post('/api/users/:id/follow', async (req, res) => {
  try {
    const targetUserId = req.params.id;
    const { followerId } = req.body;
    if (!targetUserId || !followerId) {
      return res.status(400).json({ error: 'targetUserId and followerId are required' });
    }
    if (targetUserId === followerId) {
      return res.status(400).json({ error: 'Cannot follow yourself' });
    }
    if (!await requireAuth(req, res, followerId)) return;
    const result = await toggleFollowUser(followerId, targetUserId);
    return res.json({ success: true, ...result });
  } catch (err) {
    console.error('Error toggling follow:', err);
    return res.status(500).json({ error: 'Failed to toggle follow' });
  }
});

// Follow status and counts
app.get('/api/users/:id/follow-status', async (req, res) => {
  try {
    const targetUserId = req.params.id;
    const currentUserId = (req.query.currentUserId as string)?.trim() || '';
    if (!targetUserId) {
      return res.status(400).json({ error: 'User ID is required' });
    }
    const status = await getFollowStatus(currentUserId, targetUserId);
    return res.json(status);
  } catch (err) {
    console.error('Error fetching follow status:', err);
    return res.status(500).json({ error: 'Failed to fetch follow status' });
  }
});

// Community / Friend Activity Feed
app.get('/api/community/feed', async (req, res) => {
  try {
    const userId = (req.query.userId as string)?.trim();
    const feed = await getCommunityFeed(userId);
    return res.json({ feed });
  } catch (err) {
    console.error('Error fetching community feed:', err);
    return res.status(500).json({ error: 'Failed to fetch community feed' });
  }
});

// Trending Reviews this week & Leaderboard
app.get('/api/community/trending', async (req, res) => {
  try {
    const data = await getTrendingReviewsAndLeaderboard();
    return res.json(data);
  } catch (err) {
    console.error('Error fetching trending and leaderboard:', err);
    return res.status(500).json({ error: 'Failed to fetch trending and leaderboard' });
  }
});

// Get comments for a review
app.get('/api/reviews/:id/comments', async (req, res) => {
  try {
    const reviewId = req.params.id;
    if (!reviewId) {
      return res.status(400).json({ error: 'reviewId is required' });
    }
    const comments = await getReviewComments(reviewId);
    return res.json({ comments });
  } catch (err) {
    console.error('Error fetching review comments:', err);
    return res.status(500).json({ error: 'Failed to fetch review comments' });
  }
});

// Add comment to a review
app.post('/api/reviews/:id/comments', async (req, res) => {
  try {
    const reviewId = req.params.id;
    const { userId, username, userAvatar, commentText } = req.body;
    if (!reviewId || !userId || !commentText?.trim()) {
      return res.status(400).json({ error: 'reviewId, userId, and non-empty commentText are required' });
    }
    if (!await requireAuth(req, res, userId)) return;
    const cleanComment = sanitizeText(commentText, 600);
    const cleanUsername = sanitizeText(username, 50) || 'RobloxPlayer';

    const comment = await addReviewComment({
      reviewId,
      userId,
      username: cleanUsername,
      userAvatar,
      commentText: cleanComment
    });
    return res.json({ success: true, comment });
  } catch (err) {
    console.error('Error adding review comment:', err);
    return res.status(500).json({ error: 'Failed to add review comment' });
  }
});

// Delete comment from a review
app.delete('/api/reviews/comments/:id', async (req, res) => {
  try {
    const commentId = req.params.id;
    const userId = (req.query.userId as string)?.trim();
    if (!commentId || !userId) {
      return res.status(400).json({ error: 'commentId and userId query are required' });
    }
    if (!await requireAuth(req, res, userId)) return;
    const deleted = await deleteReviewComment(userId, commentId);
    if (!deleted) {
      return res.status(404).json({ error: 'Comment not found or unauthorized' });
    }
    return res.json({ success: true, message: 'Comment deleted' });
  } catch (err) {
    console.error('Error deleting review comment:', err);
    return res.status(500).json({ error: 'Failed to delete review comment' });
  }
});

}
