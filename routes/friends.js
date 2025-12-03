const router = require("express").Router();
require("dotenv").config();

const db_friends = include('database/util/friends');
const db_users = include('database/util/users');

// Authentication middleware
const requireAuth = (req, res, next) => {
  if (req.session?.user) {
    return next();
  }
  return res.redirect('/login');
};

// Profile page - show friends, pending requests, and search
router.get('/profile', requireAuth, async (req, res) => {
  try {
    const userId = req.session.user.user_id;
    
    const friends = await db_friends.getFriends(userId);
    const pendingRequests = await db_friends.getPendingFriendRequests(userId);
    const sentRequests = await db_friends.getSentFriendRequests(userId);
    
    const error = req.session.error;
    const success = req.session.success;
    req.session.error = null;
    req.session.success = null;

    res.render('profile', {
      friends,
      pendingRequests,
      sentRequests,
      error,
      success
    });
  } catch (error) {
    console.error('Error loading profile:', error);
    res.render('profile', {
      friends: [],
      pendingRequests: [],
      sentRequests: [],
      error: 'Failed to load profile data',
      success: null
    });
  }
});

// Search users for friend requests
router.post('/friends/search', requireAuth, async (req, res) => {
  try {
    const userId = req.session.user.user_id;
    const { searchTerm } = req.body;

    if (!searchTerm || searchTerm.trim().length === 0) {
      return res.json({ success: false, message: 'Search term is required', users: [] });
    }

    const users = await db_friends.searchUsers(userId, searchTerm.trim());
    return res.json({ success: true, users });
  } catch (error) {
    console.error('Error searching users:', error);
    return res.json({ success: false, message: 'Error searching users', users: [] });
  }
});

// Send friend request
router.post('/friends/send-request', requireAuth, async (req, res) => {
  try {
    const requestUserId = req.session.user.user_id;
    const { receiveUserId } = req.body;

    if (!receiveUserId) {
      req.session.error = 'User ID is required';
      return res.redirect('/profile');
    }

    const receiveUserIdInt = parseInt(receiveUserId);
    if (isNaN(receiveUserIdInt)) {
      req.session.error = 'Invalid user ID';
      return res.redirect('/profile');
    }

    const result = await db_friends.sendFriendRequest(requestUserId, receiveUserIdInt);
    
    if (result.success) {
      req.session.success = result.message;
    } else {
      req.session.error = result.message;
    }

    return res.redirect('/profile');
  } catch (error) {
    console.error('Error sending friend request:', error);
    req.session.error = 'Failed to send friend request';
    return res.redirect('/profile');
  }
});

// Accept friend request
router.post('/friends/accept-request', requireAuth, async (req, res) => {
  try {
    const receiveUserId = req.session.user.user_id;
    const { requestUserId } = req.body;

    if (!requestUserId) {
      req.session.error = 'Request ID is required';
      return res.redirect('/profile');
    }

    const requestUserIdInt = parseInt(requestUserId);
    if (isNaN(requestUserIdInt)) {
      req.session.error = 'Invalid request ID';
      return res.redirect('/profile');
    }

    const result = await db_friends.acceptFriendRequest(requestUserIdInt, receiveUserId);
    
    if (result.success) {
      req.session.success = result.message;
    } else {
      req.session.error = result.message;
    }

    return res.redirect('/profile');
  } catch (error) {
    console.error('Error accepting friend request:', error);
    req.session.error = 'Failed to accept friend request';
    return res.redirect('/profile');
  }
});

// Reject friend request
router.post('/friends/reject-request', requireAuth, async (req, res) => {
  try {
    const receiveUserId = req.session.user.user_id;
    const { requestUserId } = req.body;

    if (!requestUserId) {
      req.session.error = 'Request ID is required';
      return res.redirect('/profile');
    }

    const requestUserIdInt = parseInt(requestUserId);
    if (isNaN(requestUserIdInt)) {
      req.session.error = 'Invalid request ID';
      return res.redirect('/profile');
    }

    const result = await db_friends.rejectFriendRequest(requestUserIdInt, receiveUserId);
    
    if (result.success) {
      req.session.success = result.message;
    } else {
      req.session.error = result.message;
    }

    return res.redirect('/profile');
  } catch (error) {
    console.error('Error rejecting friend request:', error);
    req.session.error = 'Failed to reject friend request';
    return res.redirect('/profile');
  }
});

module.exports = router;

