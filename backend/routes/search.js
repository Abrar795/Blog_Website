const express = require('express');
const router = express.Router();
const axios = require('axios');

// Proxy endpoint for SerpAPI
router.get('/events', async (req, res) => {
  try {
    const { query, location, apiKey } = req.query;

    if (!apiKey) {
      return res.status(400).json({
        success: false,
        message: 'API key is required',
      });
    }

    // Build parameters for SerpAPI
    const params = new URLSearchParams({
      api_key: apiKey,
      engine: 'google_events',
      q: query || 'events',
      location: location || '',
      hl: 'en',
      gl: 'us',
    });

    // Make the request to SerpAPI
    const response = await axios.get(`https://serpapi.com/search?${params}`);

    // Send the response back to the frontend
    res.json({
      success: true,
      data: response.data,
    });
  } catch (error) {
    console.error('Error proxying search request:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Error proxying search request',
    });
  }
});

module.exports = router;

const searchRoutes = require('./routes/search');
app.use('/api/search', searchRoutes);