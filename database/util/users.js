const { pool, isMySQLConnected } = require('../connect_mysql');

const TABLE_NAME = 'users';

/**
 * Get user by email or username
 * @param {Object} params - { user: username (optional), email: email (optional) }
 * @returns {Promise<Object|null>} User object or null if not found
 */
async function getUser({ user = null, email = null }) {
  try {
    // Verify MySQL connection before proceeding
    const isConnected = await isMySQLConnected();
    if (!isConnected) {
      console.error('Cannot get user: MySQL is not connected');
      throw new Error('MySQL connection is not available. Please check your MYSQL_HOST configuration.');
    }
    
    // If no parameters provided, return null
    if (!email && !user) {
      return null;
    }
    
    let query = `SELECT user_id, username, email, password_hash FROM ${TABLE_NAME} WHERE `;
    const params = [];
    
    if (email && user) {
      // If both are provided, check if either exists (for duplicate checking)
      query += `(LOWER(email) = LOWER(?) OR username = ?) LIMIT 1`;
      params.push(email.trim(), user.trim());
    } else if (email) {
      query += `LOWER(email) = LOWER(?) LIMIT 1`;
      params.push(email.trim());
    } else if (user) {
      query += `username = ? LIMIT 1`;
      params.push(user.trim());
    }
    
    const [rows] = await pool.execute(query, params);
    return rows.length > 0 ? rows[0] : null;
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
    // Verify MySQL connection before proceeding
    const isConnected = await isMySQLConnected();
    if (!isConnected) {
      console.error('Cannot create user: MySQL is not connected');
      throw new Error('MySQL connection is not available. Please check your MYSQL_HOST configuration.');
    }
    
    // Normalize inputs
    const normalizedEmail = email.toLowerCase().trim();
    const normalizedUsername = username.trim();
    
    // Check if email already exists
    const existingEmail = await getUser({ email: normalizedEmail });
    if (existingEmail) {
      console.log(`User creation failed: Email ${normalizedEmail} already exists`);
      return false;
    }
    
    // Check if username already exists
    const existingUsername = await getUser({ user: normalizedUsername });
    if (existingUsername) {
      console.log(`User creation failed: Username ${normalizedUsername} already exists`);
      return false;
    }
    
    // Insert new user
    const query = `INSERT INTO ${TABLE_NAME} (username, email, password_hash) VALUES (?, ?, ?)`;
    const [result] = await pool.execute(query, [
      normalizedUsername,
      normalizedEmail,
      hashedPassword
    ]);
    
    if (result.insertId > 0) {
      console.log(`User created successfully: user_id=${result.insertId}, username=${normalizedUsername}, email=${normalizedEmail}`);
      return true;
    }
    
    return false;
  } catch (error) {
    // Handle MySQL duplicate entry error (ER_DUP_ENTRY = 1062)
    if (error.code === 'ER_DUP_ENTRY') {
      console.error('Duplicate entry error:', error.message);
      return false;
    }
    console.error('Error creating user:', error);
    throw error;
  }
}

/**
 * Get user by ID
 * @param {number|string} userId - User ID (MySQL INT)
 * @returns {Promise<Object|null>} User object or null if not found
 */
async function getUserById(userId) {
  try {
    const query = `SELECT user_id, username, email, password_hash FROM ${TABLE_NAME} WHERE user_id = ? LIMIT 1`;
    const [rows] = await pool.execute(query, [userId]);
    return rows.length > 0 ? rows[0] : null;
  } catch (error) {
    console.error('Error getting user by ID:', error);
    return null;
  }
}

/**
 * Update user information
 * @param {number|string} userId - User ID
 * @param {Object} updates - Fields to update (e.g., { username: 'newusername', email: 'newemail' })
 * @returns {Promise<boolean>} True if successful
 */
async function updateUser(userId, updates) {
  try {
    // Build dynamic UPDATE query
    const fields = Object.keys(updates);
    if (fields.length === 0) {
      return false;
    }
    
    const setClause = fields.map(field => `${field} = ?`).join(', ');
    const query = `UPDATE ${TABLE_NAME} SET ${setClause} WHERE user_id = ?`;
    const values = [...fields.map(field => updates[field]), userId];
    
    const [result] = await pool.execute(query, values);
    return result.affectedRows > 0;
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
