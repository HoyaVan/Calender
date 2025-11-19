const { MongoClient, ServerApiVersion } = require('mongodb');
const dotenv = require('dotenv');

dotenv.config();

const uri = process.env.MONGODB_URI;

// Validate MongoDB URI
if (!uri) {
  console.error('ERROR: MONGODB_URI environment variable is not set!');
  console.error('Please set MONGODB_URI in your environment variables or .env file');
  throw new Error('MONGODB_URI is required but not provided');
}

// Create a MongoClient with a MongoClientOptions object to set the Stable API version
const client = new MongoClient(uri, {
  serverApi: {
    version: ServerApiVersion.v1,
    strict: true,
    deprecationErrors: true,
  },
  // Connection pool options
  maxPoolSize: 10,
  minPoolSize: 2,
});

let isConnected = false;

// Connect to MongoDB
async function connectToMongo() {
  if (isConnected) {
    return client;
  }

  try {
    await client.connect();
    // Send a ping to confirm a successful connection
    await client.db("admin").command({ ping: 1 });
    console.log("Successfully connected to MongoDB!");
    isConnected = true;
    return client;
  } catch (error) {
    console.error("Failed to connect to MongoDB:", error);
    throw error;
  }
}

// Get the MongoDB client (for use with connect-mongo session store)
function getMongoClient() {
  if (!isConnected) {
    // Connect if not already connected
    connectToMongo().catch(console.error);
  }
  return client;
}

// Initialize connection on module load
connectToMongo().catch(console.error);

// Graceful shutdown
process.on('SIGINT', async () => {
  try {
    await client.close();
    console.log('MongoDB connection closed.');
    process.exit(0);
  } catch (error) {
    console.error('Error closing MongoDB connection:', error);
    process.exit(1);
  }
});

module.exports = {
  client,
  connectToMongo,
  getMongoClient,
};