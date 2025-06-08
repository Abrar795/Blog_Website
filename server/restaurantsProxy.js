const express = require('express');
const axios = require('axios');
const cors = require('cors');

const app = express();
const PORT = 3000; // You can change this port if needed

// ========== CONFIGURATION ========== //
// ⚠️ WARNING: Hardcoding API keys is unsafe for production!
const SERPAPI_KEY = "b435b7f260ea7e50daf8be5dbe9a6404192bdaf095a74c789c87905f5aaad58d"; // Replace with your actual key

// ========== MIDDLEWARE ========== //
app.use(cors()); // Enable CORS for frontend access
app.use(express.json()); // Parse JSON requests

// ========== RESTAURANT SEARCH ENDPOINT ========== //
app.get('/api/restaurants', async (req, res) => {
    try {
        const { lat, lng } = req.query;
        
        // Validate coordinates
        if (!lat || !lng) {
            return res.status(400).json({ 
                error: "Missing coordinates",
                message: "Please provide 'lat' and 'lng' query parameters" 
            });
        }

        // Fetch restaurant data from SerpAPI
        const response = await axios.get('https://serpapi.com/search', {
            params: {
                engine: "google_maps",
                q: "restaurants",
                ll: `@${lat},${lng},15z`, // Search near the given coordinates
                type: "search",
                api_key: SERPAPI_KEY, // Your hardcoded API key
                hl: "en", // Language: English
                no_cache: true // Ensure fresh results
            }
        });

        // Process and format the response
        const restaurants = response.data.local_results?.map(place => ({
            name: place.title,
            address: place.address,
            hours: place.hours || formatOperatingHours(place.operating_hours),
            rating: place.rating,
            price: place.price,
            website: place.website
        })) || [];

        // Return the formatted data
        res.json({ 
            success: true,
            count: restaurants.length,
            restaurants 
        });

    } catch (error) {
        console.error("API Error:", error.message);
        res.status(500).json({ 
            success: false,
            error: "Failed to fetch restaurant data",
            details: error.response?.data || error.message 
        });
    }
});

// ========== HELPER FUNCTION ========== //
function formatOperatingHours(hours) {
    if (!hours) return "Hours not available";
    if (typeof hours === 'string') return hours;
    
    // Format as "Monday: 9 AM - 10 PM, Tuesday: ..."
    return Object.entries(hours)
        .map(([day, time]) => `${day}: ${time}`)
        .join(', ');
}

// ========== START SERVER ========== //
app.listen(PORT, () => {
    console.log(`🚀 Server running on http://localhost:${PORT}`);
});