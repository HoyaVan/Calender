const mysql = require('mysql2/promise');
const dotenv = require('dotenv');
const fs = require('fs').promises;
const path = require('path');

dotenv.config();

const MYSQL_HOST = process.env.MYSQL_HOST;

// Validate MySQL connection string
if (!MYSQL_HOST) {
  console.error('ERROR: MYSQL_HOST environment variable is not set!');
  console.error('Please set MYSQL_HOST in your environment variables or .env file');
  throw new Error('MYSQL_HOST is required but not provided');
}

// Create MySQL connection pool
// MYSQL_HOST can be a full connection URI (mysql://user:pass@host:port/db) or connection object
const pool = mysql.createPool(MYSQL_HOST, {
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0,
  enableKeepAlive: true,
  keepAliveInitialDelay: 0
});

// Test MySQL connection
async function connectToMySQL() {
  try {
    const connection = await pool.getConnection();
    await connection.ping();
    connection.release();
    console.log("Successfully connected to MySQL!");

    // Create users table if it doesn't exist
    //await createUsersTableIfNotExists();

    return pool;
  } catch (error) {
    console.error("Failed to connect to MySQL:", error);
    throw error;
  }
}

// Get MySQL pool
function getMySQLPool() {
  return pool;
}

// Check if MySQL is connected
async function isMySQLConnected() {
  try {
    const connection = await pool.getConnection();
    await connection.ping();
    connection.release();
    return true;
  } catch (error) {
    console.error('MySQL connection check failed:', error);
    return false;
  }
}

// Initialize connection on module load
connectToMySQL().catch(console.error);

// Graceful shutdown
process.on('SIGINT', async () => {
  try {
    await pool.end();
    console.log('MySQL connection pool closed.');
  } catch (error) {
    console.error('Error closing MySQL connection pool:', error);
  }
});

module.exports = {
  pool,
  connectToMySQL,
  getMySQLPool,
  isMySQLConnected,
};

