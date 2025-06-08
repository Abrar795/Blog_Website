import express from 'express';
import fetch from 'node-fetch';
import cors from 'cors';

const app = express();
const PORT = 5050; // Proxy server port

// Enable CORS for all routes
app.use(cors());

// Proxy route to fetch sports events from SerpAPI
app.get('/api/events', async (req, res) => {
  const { q, location, apiKey } = req.query;

  if (!apiKey) {
    return res.status(400).json({
      success: false,
      message: 'API key is required',
    });
  }

  if (!q || q.trim() === '') {
    return res.status(400).json({
      success: false,
      message: 'Search query is required',
    });
  }

  try {
    // Build the SerpAPI request URL
    const params = new URLSearchParams({
      api_key: apiKey,
      engine: 'google_events',
      q: q.trim(),  // Use the query parameter directly without a default value
      location: location || '',
      hl: 'en',
      gl: 'us',
    });

    const response = await fetch(`https://serpapi.com/search?${params}`);
    const data = await response.json();

    // Send the response back to the frontend
    res.json({
      success: true,
      data,
    });
  } catch (error) {
    console.error('Error fetching events from SerpAPI:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch events from SerpAPI',
    });
  }
});

// Start the server
app.listen(PORT, () => {
  console.log(`Proxy server running on http://localhost:${PORT}`);
});