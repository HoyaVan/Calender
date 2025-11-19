const { ObjectId } = require('mongodb');
const { client } = require('../connect_mongoDB');

const DB_NAME = process.env.MONGODB_DB_NAME || 'projectcalender';
const COLLECTION_NAME = 'users';

/**
 * Get user by email or username
 * @param {Object} params - { user: username (optional), email: email (optional) }
 * @returns {Promise<Object|null>} User object or null if not found
 */
async function getUser({ user = null, email = null }) {
  try {
    const db = client.db(DB_NAME);
    const collection = db.collection(COLLECTION_NAME);
    
    const query = {};
    if (email) {
      query.email = email.toLowerCase().trim();
    }
    if (user) {
      query.username = user.trim();
    }
    
    // If both are provided, check if either exists
    if (email && user) {
      const userByEmail = await collection.findOne({ email: email.toLowerCase().trim() });
      const userByUsername = await collection.findOne({ username: user.trim() });
      return userByEmail || userByUsername || null;
    }
    
    const result = await collection.findOne(query);
    return result;
  } catch (error) {
    console.error('Error getting user:', error);
    throw error;
  }
}

/**
 * Create a new user
 * @param {Object} params - { email: string, user: string (username), hashedPassword: string }
 * @returns {Promise<boolean>} True if successful, false otherwise
 */
async function createUser({ email, user: username, hashedPassword }) {
  try {
    const db = client.db(DB_NAME);
    const collection = db.collection(COLLECTION_NAME);
    
    // Check if user already exists
    const existingUser = await getUser({ user: username, email });
    if (existingUser) {
      return false;
    }
    
    // Create user document
    const userDoc = {
      username: username.trim(),
      email: email.toLowerCase().trim(),
      password_hash: hashedPassword,
      avatar_url: process.env.DEFAULT_AVATAR_URL || null,
      created_at: new Date(),
      updated_at: new Date()
    };
    
    const result = await collection.insertOne(userDoc);
    
    if (result.insertedId) {
      return true;
    }
    return false;
  } catch (error) {
    console.error('Error creating user:', error);
    throw error;
  }
}

/**
 * Get user by ID
 * @param {string} userId - User ID (MongoDB ObjectId as string)
 * @returns {Promise<Object|null>} User object or null if not found
 */
async function getUserById(userId) {
  try {
    const db = client.db(DB_NAME);
    const collection = db.collection(COLLECTION_NAME);
    
    const result = await collection.findOne({ _id: new ObjectId(userId) });
    return result;
  } catch (error) {
    console.error('Error getting user by ID:', error);
    return null;
  }
}

/**
 * Update user information
 * @param {string} userId - User ID
 * @param {Object} updates - Fields to update
 * @returns {Promise<boolean>} True if successful
 */
async function updateUser(userId, updates) {
  try {
    const db = client.db(DB_NAME);
    const collection = db.collection(COLLECTION_NAME);
    
    updates.updated_at = new Date();
    
    const result = await collection.updateOne(
      { _id: new ObjectId(userId) },
      { $set: updates }
    );
    
    return result.modifiedCount > 0;
  } catch (error) {
    console.error('Error updating user:', error);
    throw error;
  }
}

module.exports = {
  getUser,
  createUser,
  getUserById,
  updateUser
};
