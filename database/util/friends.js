const { pool, isMySQLConnected } = require('../connect_mysql');

/**
 * Send a friend request
 * @param {number} requestUserId - User ID sending the request
 * @param {number} receiveUserId - User ID receiving the request
 * @returns {Promise<{success: boolean, message: string}>}
 */
async function sendFriendRequest(requestUserId, receiveUserId) {
  try {
    const isConnected = await isMySQLConnected();
    if (!isConnected) {
      throw new Error('MySQL connection is not available');
    }

    // Check if users are the same
    if (requestUserId === receiveUserId) {
      return { success: false, message: 'Cannot send friend request to yourself' };
    }

    // Check if users exist
    const [requestUser] = await pool.execute('SELECT user_id FROM user WHERE user_id = ?', [requestUserId]);
    const [receiveUser] = await pool.execute('SELECT user_id FROM user WHERE user_id = ?', [receiveUserId]);
    
    if (requestUser.length === 0 || receiveUser.length === 0) {
      return { success: false, message: 'User not found' };
    }

    // Check if already friends (ensure user1_id < user2_id for consistency)
    const user1Id = Math.min(requestUserId, receiveUserId);
    const user2Id = Math.max(requestUserId, receiveUserId);
    const [existingFriendship] = await pool.execute(
      'SELECT user_friend_id FROM user_friend WHERE user1_id = ? AND user2_id = ?',
      [user1Id, user2Id]
    );

    if (existingFriendship.length > 0) {
      return { success: false, message: 'Already friends' };
    }

    // Check if request already exists
    const [existingRequest] = await pool.execute(
      'SELECT user_friend_request_id FROM user_friend_request WHERE request_user_id = ? AND receive_user_id = ?',
      [requestUserId, receiveUserId]
    );

    if (existingRequest.length > 0) {
      return { success: false, message: 'Friend request already sent' };
    }

    // Check if reverse request exists (they sent you a request)
    const [reverseRequest] = await pool.execute(
      'SELECT user_friend_request_id FROM user_friend_request WHERE request_user_id = ? AND receive_user_id = ?',
      [receiveUserId, requestUserId]
    );

    if (reverseRequest.length > 0) {
      return { success: false, message: 'This user has already sent you a friend request' };
    }

    // Insert friend request
    await pool.execute(
      'INSERT INTO user_friend_request (request_user_id, receive_user_id) VALUES (?, ?)',
      [requestUserId, receiveUserId]
    );

    return { success: true, message: 'Friend request sent successfully' };
  } catch (error) {
    console.error('Error sending friend request:', error);
    throw error;
  }
}

/**
 * Accept a friend request
 * @param {number} requestUserId - User ID who sent the request
 * @param {number} receiveUserId - User ID who received the request (current user)
 * @returns {Promise<{success: boolean, message: string}>}
 */
async function acceptFriendRequest(requestUserId, receiveUserId) {
  try {
    const isConnected = await isMySQLConnected();
    if (!isConnected) {
      throw new Error('MySQL connection is not available');
    }

    // Check if request exists
    const [request] = await pool.execute(
      'SELECT user_friend_request_id FROM user_friend_request WHERE request_user_id = ? AND receive_user_id = ?',
      [requestUserId, receiveUserId]
    );

    if (request.length === 0) {
      return { success: false, message: 'Friend request not found' };
    }

    // Start transaction
    const connection = await pool.getConnection();
    await connection.beginTransaction();

    try {
      // Create friendship (ensure user1_id < user2_id)
      const user1Id = Math.min(requestUserId, receiveUserId);
      const user2Id = Math.max(requestUserId, receiveUserId);
      
      await connection.execute(
        'INSERT INTO user_friend (user1_id, user2_id) VALUES (?, ?)',
        [user1Id, user2Id]
      );

      // Delete the friend request
      await connection.execute(
        'DELETE FROM user_friend_request WHERE request_user_id = ? AND receive_user_id = ?',
        [requestUserId, receiveUserId]
      );

      await connection.commit();
      return { success: true, message: 'Friend request accepted' };
    } catch (error) {
      await connection.rollback();
      throw error;
    } finally {
      connection.release();
    }
  } catch (error) {
    console.error('Error accepting friend request:', error);
    throw error;
  }
}

/**
 * Reject/Delete a friend request
 * @param {number} requestUserId - User ID who sent the request
 * @param {number} receiveUserId - User ID who received the request (current user)
 * @returns {Promise<{success: boolean, message: string}>}
 */
async function rejectFriendRequest(requestUserId, receiveUserId) {
  try {
    const isConnected = await isMySQLConnected();
    if (!isConnected) {
      throw new Error('MySQL connection is not available');
    }

    const [result] = await pool.execute(
      'DELETE FROM user_friend_request WHERE request_user_id = ? AND receive_user_id = ?',
      [requestUserId, receiveUserId]
    );

    if (result.affectedRows === 0) {
      return { success: false, message: 'Friend request not found' };
    }

    return { success: true, message: 'Friend request rejected' };
  } catch (error) {
    console.error('Error rejecting friend request:', error);
    throw error;
  }
}

/**
 * Get all friends for a user
 * @param {number} userId - User ID
 * @returns {Promise<Array>} Array of friend user objects
 */
async function getFriends(userId) {
  try {
    const isConnected = await isMySQLConnected();
    if (!isConnected) {
      throw new Error('MySQL connection is not available');
    }

    // Get friends where user is user1_id or user2_id
    const [friends] = await pool.execute(
      `SELECT u.user_id, u.username, u.email
       FROM user u
       INNER JOIN user_friend uf ON (
         (uf.user1_id = ? AND uf.user2_id = u.user_id) OR
         (uf.user2_id = ? AND uf.user1_id = u.user_id)
       )
       WHERE u.user_id != ?
       ORDER BY u.username`,
      [userId, userId, userId]
    );

    return friends;
  } catch (error) {
    console.error('Error getting friends:', error);
    throw error;
  }
}

/**
 * Get pending friend requests received by a user
 * @param {number} userId - User ID (receiver)
 * @returns {Promise<Array>} Array of friend request objects with sender info
 */
async function getPendingFriendRequests(userId) {
  try {
    const isConnected = await isMySQLConnected();
    if (!isConnected) {
      throw new Error('MySQL connection is not available');
    }

    const [requests] = await pool.execute(
      `SELECT ufr.user_friend_request_id, ufr.request_user_id, u.user_id, u.username, u.email
       FROM user_friend_request ufr
       INNER JOIN user u ON ufr.request_user_id = u.user_id
       WHERE ufr.receive_user_id = ?
       ORDER BY ufr.user_friend_request_id DESC`,
      [userId]
    );

    return requests;
  } catch (error) {
    console.error('Error getting pending friend requests:', error);
    throw error;
  }
}

/**
 * Get sent friend requests by a user
 * @param {number} userId - User ID (sender)
 * @returns {Promise<Array>} Array of friend request objects with receiver info
 */
async function getSentFriendRequests(userId) {
  try {
    const isConnected = await isMySQLConnected();
    if (!isConnected) {
      throw new Error('MySQL connection is not available');
    }

    const [requests] = await pool.execute(
      `SELECT ufr.user_friend_request_id, ufr.receive_user_id, u.user_id, u.username, u.email
       FROM user_friend_request ufr
       INNER JOIN user u ON ufr.receive_user_id = u.user_id
       WHERE ufr.request_user_id = ?
       ORDER BY ufr.user_friend_request_id DESC`,
      [userId]
    );

    return requests;
  } catch (error) {
    console.error('Error getting sent friend requests:', error);
    throw error;
  }
}

/**
 * Search users by username or email (excluding current user and existing friends/requests)
 * @param {number} userId - Current user ID
 * @param {string} searchTerm - Search term
 * @returns {Promise<Array>} Array of user objects
 */
async function searchUsers(userId, searchTerm) {
  try {
    const isConnected = await isMySQLConnected();
    if (!isConnected) {
      throw new Error('MySQL connection is not available');
    }

    const searchPattern = `%${searchTerm}%`;
    
    // Get user IDs that are already friends
    const [friendIds] = await pool.execute(
      `SELECT CASE 
         WHEN user1_id = ? THEN user2_id 
         WHEN user2_id = ? THEN user1_id 
       END AS friend_id
       FROM user_friend
       WHERE user1_id = ? OR user2_id = ?`,
      [userId, userId, userId, userId]
    );
    const friendIdList = friendIds.map(f => f.friend_id).filter(Boolean);

    // Get user IDs that have pending requests (either sent or received)
    const [requestIds] = await pool.execute(
      `SELECT DISTINCT CASE 
         WHEN request_user_id = ? THEN receive_user_id 
         WHEN receive_user_id = ? THEN request_user_id 
       END AS request_id
       FROM user_friend_request
       WHERE request_user_id = ? OR receive_user_id = ?`,
      [userId, userId, userId, userId]
    );
    const requestIdList = requestIds.map(r => r.request_id).filter(Boolean);

    // Combine excluded IDs
    const excludedIds = [userId, ...friendIdList, ...requestIdList];
    const placeholders = excludedIds.map(() => '?').join(',');

    const [users] = await pool.execute(
      `SELECT user_id, username, email
       FROM user
       WHERE (username LIKE ? OR email LIKE ?)
       AND user_id NOT IN (${placeholders})
       LIMIT 20`,
      [searchPattern, searchPattern, ...excludedIds]
    );

    return users;
  } catch (error) {
    console.error('Error searching users:', error);
    throw error;
  }
}

/**
 * Check if two users are friends
 * @param {number} userId1 - First user ID
 * @param {number} userId2 - Second user ID
 * @returns {Promise<boolean>}
 */
async function areFriends(userId1, userId2) {
  try {
    const user1Id = Math.min(userId1, userId2);
    const user2Id = Math.max(userId1, userId2);
    
    const [result] = await pool.execute(
      'SELECT user_friend_id FROM user_friend WHERE user1_id = ? AND user2_id = ?',
      [user1Id, user2Id]
    );

    return result.length > 0;
  } catch (error) {
    console.error('Error checking friendship:', error);
    return false;
  }
}

module.exports = {
  sendFriendRequest,
  acceptFriendRequest,
  rejectFriendRequest,
  getFriends,
  getPendingFriendRequests,
  getSentFriendRequests,
  searchUsers,
  areFriends
};

