const dotenv = require("dotenv");
const express = require("express");
const path = require("path");

dotenv.config();

const sessionMiddleware = require("./auth/session_check.js");
const { connectToMongo, client } = require("./database/connect_mongoDB.js");
const { connectToMySQL, pool: mysqlPool } = require("./database/connect_mysql.js");

global.base_dir = __dirname;
global.abs_path = function (p) { return base_dir + p; }
global.include = function (file) { return require(abs_path('/' + file)); }

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(sessionMiddleware); // must be before router

// Views / static
app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));           // ensure EJS path
app.use(express.static(path.join(__dirname, 'public')));

// Router
const router = include('routes/router');
app.use('/', router);

// Optional: MongoDB collections check
const checkMongoCollections = async () => {
  try {
    const dbName = process.env.MONGODB_DB_NAME || 'projectcalender';
    const db = client.db(dbName);
    const collections = await db.listCollections().toArray();
    
    console.log('\n=== MONGODB COLLECTIONS ===');
    console.log(`Database: ${dbName}`);
    console.log(`Collections found: ${collections.length}`);
    collections.forEach(col => console.log('-', col.name));
    console.log('=== END CHECK ===\n');
  } catch (error) {
    console.error('Error checking MongoDB collections:', error);
  }
};

// Optional: MongoDB connection check
const checkMongoConnection = async () => {
  try {
    const mongoClient = await connectToMongo();
    const db = mongoClient.db("admin");
    await db.command({ ping: 1 });
    console.log('\n=== MONGODB CONNECTION ===');
    console.log('MongoDB connection verified successfully!');
    console.log('Connection pool configured:');
    console.log(`  - Max pool size: ${client.options.maxPoolSize || 10}`);
    console.log(`  - Min pool size: ${client.options.minPoolSize || 2}`);
    console.log('=== END CHECK ===\n');
  } catch (error) {
    console.error('MongoDB connection check failed:', error);
  }
};

// Optional: MySQL connection check
const checkMySQLConnection = async () => {
  try {
    await connectToMySQL();
    
    // Get database and table information
    const connection = await mysqlPool.getConnection();
    const [dbRows] = await connection.query('SELECT DATABASE() as db');
    const dbName = dbRows[0]?.db || 'unknown';
    
    // Get tables in the database
    const [tables] = await connection.query(
      `SELECT TABLE_NAME FROM information_schema.TABLES WHERE TABLE_SCHEMA = ?`,
      [dbName]
    );
    
    // Get users table structure if it exists
    let usersTableInfo = null;
    if (tables.some(t => t.TABLE_NAME === 'users')) {
      const [columns] = await connection.query(
        `SELECT COLUMN_NAME, DATA_TYPE, IS_NULLABLE, COLUMN_KEY, EXTRA 
         FROM information_schema.COLUMNS 
         WHERE TABLE_SCHEMA = ? AND TABLE_NAME = 'users' 
         ORDER BY ORDINAL_POSITION`,
        [dbName]
      );
      usersTableInfo = columns;
    }
    
    connection.release();
    
    console.log('\n=== MYSQL CONNECTION ===');
    console.log('MySQL connection verified successfully!');
    console.log(`Database: ${dbName}`);
    console.log('Connection pool configured:');
    console.log(`  - Connection limit: 10`);
    console.log(`  - Wait for connections: true`);
    console.log(`Tables found: ${tables.length}`);
    tables.forEach(table => console.log(`  - ${table.TABLE_NAME}`));
    
    if (usersTableInfo && usersTableInfo.length > 0) {
      console.log('\nUsers table structure:');
      usersTableInfo.forEach(col => {
        const keyInfo = col.COLUMN_KEY ? ` [${col.COLUMN_KEY}]` : '';
        const extraInfo = col.EXTRA ? ` ${col.EXTRA}` : '';
        console.log(`  - ${col.COLUMN_NAME}: ${col.DATA_TYPE}${keyInfo}${extraInfo}`);
      });
    }
    
    console.log('=== END CHECK ===\n');
  } catch (error) {
    console.error('MySQL connection check failed:', error);
  }
};

// Start after DB setup
(async () => {
  try {
    // Initialize MongoDB connection (for sessions)
    await connectToMongo();
    
    // Initialize MySQL connection (for user data)
    await connectToMySQL();
    
    // Check connections
    await checkMongoConnection();
    await checkMySQLConnection();
    setTimeout(checkMongoCollections, 1000);
    
    // Start server
    app.listen(PORT, () => {
      console.log(`Server running on http://localhost:${PORT}`);
    });
  } catch (error) {
    console.error('Failed to initialize server:', error);
    process.exit(1);
  }
})();
