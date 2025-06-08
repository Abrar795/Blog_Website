const express = require('express');
const cors = require('cors');
const { client, testConnection } = require('./elasticsearch');
const postsRoutes = require('./routes/posts');

const app = express();
const port = process.env.PORT || 5000;

// Middleware
app.use(cors());
app.use(express.json());

// Share the Elasticsearch client with routes
app.locals.esClient = client;

// Initialize Elasticsearch index
async function initializeElasticsearch() {
  try {
    // Test connection
    const isConnected = await testConnection();
    
    if (!isConnected) {
      console.error('Could not connect to Elasticsearch. Is it running?');
      return false;
    }
    
    // Create index if it doesn't exist
    const indexExists = await client.indices.exists({ index: 'posts' });
    
    if (!indexExists.body) {
      await client.indices.create({
        index: 'posts',
        body: {
          settings: {
            number_of_shards: 1,
            number_of_replicas: 1
          },
          mappings: {
            properties: {
              id: { type: 'keyword' },
              title: { type: 'text' },
              description: { type: 'text' },
              content: { type: 'text' },
              category: { type: 'keyword' },
              author: { type: 'keyword' },
              date: { type: 'date' },
              tags: { type: 'keyword' }
            }
          }
        }
      });
      console.log('Posts index created successfully');
    } else {
      console.log('Posts index already exists');
    }
    
    return true;
  } catch (error) {
    console.error('Error initializing Elasticsearch:', error);
    return false;
  }
}

// Routes
app.use('/api/posts', postsRoutes);

// Health check route
app.get('/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date() });
});

// Start server
app.listen(port, async () => {
  console.log(`Server running on port ${port}`);
  
  // Initialize Elasticsearch
  const elasticsearchInitialized = await initializeElasticsearch();
  if (!elasticsearchInitialized) {
    console.warn('WARNING: Elasticsearch not properly initialized. Some features may not work correctly.');
  }
});
