const express = require('express');
const router = express.Router();

// Get all posts with enhanced search
router.get('/', async (req, res) => {
  try {
    const { esClient } = req.app.locals;
    const { category, query, title, searchType } = req.query;
    
    let searchBody = {
      query: {
        match_all: {}
      },
      sort: [
        { date: { order: 'desc' } }
      ]
    };
    
    // Search by category if provided
    if (category) {
      searchBody.query = {
        term: { category: category }
      };
    }
    
    // Title-only search
    else if (title && searchType === 'title') {
      searchBody.query = {
        match: {
          title: title
        }
      };
    }
    // General text search if query provided
    else if (query) {
      searchBody.query = {
        multi_match: {
          query: query,
          fields: ['title^2', 'description', 'content'],  // Boost title matches
          fuzziness: "AUTO"
        }
      };
    }
    
    const response = await esClient.search({
      index: 'posts',
      body: searchBody
    });
    
    const posts = response.body.hits.hits.map(hit => ({
      ...hit._source,
      id: hit._source.id || hit._id,
      score: hit._score
    }));
    
    res.json(posts);
  } catch (error) {
    console.error('Error fetching posts:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Get post by ID
router.get('/:id', async (req, res) => {
  try {
    const { esClient } = req.app.locals;
    const { id } = req.params;
    
    const response = await esClient.search({
      index: 'posts',
      body: {
        query: {
          term: { id: id }
        }
      }
    });
    
    if (response.body.hits.hits.length === 0) {
      return res.status(404).json({ message: 'Post not found' });
    }
    
    const post = response.body.hits.hits[0]._source;
    res.json(post);
  } catch (error) {
    console.error('Error fetching post:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Create new post
router.post('/', async (req, res) => {
  try {
    const { esClient } = req.app.locals;
    const post = req.body;
    
    // Ensure post has an ID
    if (!post.id) {
      post.id = Date.now().toString();
    }
    
    // Ensure post has a date
    if (!post.date) {
      post.date = new Date().toISOString();
    }
    
    const response = await esClient.index({
      index: 'posts',
      id: post.id,
      body: post,
      refresh: true // Make the document immediately available for search
    });
    
    res.status(201).json({ 
      message: 'Post created successfully',
      post: {
        ...post,
        id: response.body._id
      }
    });
  } catch (error) {
    console.error('Error creating post:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Update post
router.put('/:id', async (req, res) => {
  try {
    const { esClient } = req.app.locals;
    const { id } = req.params;
    const post = req.body;
    
    const exists = await esClient.exists({
      index: 'posts',
      id
    });
    
    if (!exists.body) {
      return res.status(404).json({ message: 'Post not found' });
    }
    
    await esClient.update({
      index: 'posts',
      id,
      body: {
        doc: post
      },
      refresh: true
    });
    
    res.json({ message: 'Post updated successfully' });
  } catch (error) {
    console.error('Error updating post:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Delete post
router.delete('/:id', async (req, res) => {
  try {
    const { esClient } = req.app.locals;
    const { id } = req.params;
    
    const exists = await esClient.exists({
      index: 'posts',
      id
    });
    
    if (!exists.body) {
      return res.status(404).json({ message: 'Post not found' });
    }
    
    await esClient.delete({
      index: 'posts',
      id,
      refresh: true
    });
    
    res.json({ message: 'Post deleted successfully' });
  } catch (error) {
    console.error('Error deleting post:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Store a new post in Elasticsearch - Use the same esClient from app.locals
router.post('/add', async (req, res) => {
  try {
    const { esClient } = req.app.locals;
    const { title, content, author, tags } = req.body;

    const response = await esClient.index({
      index: 'posts', // Index name in Elasticsearch
      body: { 
        title, 
        content, 
        author, 
        tags, 
        date: new Date(),
        id: Date.now().toString()
      },
      refresh: true
    });

    res.json({ 
      success: true, 
      response: response.body
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// Search for posts in Elasticsearch - Use the same esClient from app.locals
router.get('/search', async (req, res) => {
  try {
    const { esClient } = req.app.locals;
    const { query } = req.query;

    const response = await esClient.search({
      index: 'posts',
      body: {
        query: {
          match: { content: query },
        },
      },
    });

    const posts = response.body.hits.hits.map(hit => ({
      ...hit._source,
      id: hit._source.id || hit._id,
      score: hit._score
    }));

    res.json({ success: true, posts });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// Add the debug endpoint to check Elasticsearch status
router.get('/debug/stats', async (req, res) => {
  try {
    const { esClient } = req.app.locals;
    
    // Get index stats
    const indexStats = await esClient.indices.stats({ index: 'posts' });
    
    // Get document count
    const count = await esClient.count({ index: 'posts' });
    
    // Get a sample of documents
    const sample = await esClient.search({
      index: 'posts',
      size: 5,
      sort: [{ date: { order: 'desc' } }]
    });
    
    res.json({
      indexExists: true,
      documentCount: count.body.count,
      indexStats: indexStats.body,
      recentDocuments: sample.body.hits.hits.map(hit => ({
        id: hit._id,
        ...hit._source
      }))
    });
  } catch (error) {
    console.error('Error getting Elasticsearch stats:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

module.exports = router;