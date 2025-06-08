import React, { useState } from "react";
import { Box, Button, Typography, CircularProgress, Paper } from "@mui/material";
import RestaurantIcon from "@mui/icons-material/Restaurant";

// This component expects location and weather as props from the parent component
const RecommendationGenerator = ({ location, weather }) => {
  const [loading, setLoading] = useState(false);
  const [recommendations, setRecommendations] = useState(null);
  const [error, setError] = useState("");

  const handleGenerate = async () => {
    setLoading(true);
    setError("");
    setRecommendations(null);

    try {
      if (!location || !weather) {
        throw new Error("Location or weather data is missing.");
      }

      // Extract details from props
      const weatherDesc = weather.weather?.[0]?.description || "unknown";
      const temp = weather.main?.temp ?? "unknown";
      const locationName =
        location.name ||
        (location.latitude && location.longitude
          ? `lat ${location.latitude}, lon ${location.longitude}`
          : "your location");

      const prompt = `
I am currently in ${locationName}. The weather is "${weatherDesc}" with a temperature of ${temp}°C.
Please recommend:
- 3 restaurants (with a short description each)
- 3 musical events or concerts (with a short description each)
- 3 sports events (with a short description each)
All recommendations should be relevant to my location and the current weather conditions. List each category separately.
      `;

      const response = await fetch("https://api.openai.com/v1/chat/completions", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization:
            "Bearer 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",
        },
        body: JSON.stringify({
          model: "gpt-3.5-turbo",
          messages: [
            {
              role: "system",
              content: "You are a helpful assistant that provides local recommendations.",
            },
            { role: "user", content: prompt },
          ],
          max_tokens: 400,
          temperature: 0.7,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(
          `OpenAI API error: ${response.status} - ${errorData.error?.message || "Unknown error"}`
        );
      }

      const data = await response.json();
      if (data.choices && data.choices.length > 0) {
        setRecommendations(data.choices[0].message.content.trim());
      } else {
        throw new Error("Failed to generate recommendations.");
      }
    } catch (err) {
      setError(err.message || "Failed to generate recommendations.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Paper elevation={3} sx={{ my: 3, p: 3, borderRadius: 2 }}>
      <Box display="flex" alignItems="center" justifyContent="space-between" mb={2}>
        <Typography variant="h6" gutterBottom>
          Personalized Recommendations
        </Typography>
        <Button 
          variant="contained" 
          onClick={handleGenerate} 
          disabled={loading}
          startIcon={loading ? <CircularProgress size={20} color="inherit" /> : <RestaurantIcon />}
          color="primary"
          size="large"
        >
          {loading ? "Generating..." : "Get Recommendations"}
        </Button>
      </Box>
      
      {location && weather && (
        <Typography variant="body2" color="text.secondary" mb={2}>
          Based on your location ({location.name || "Unknown"}) and current weather ({weather.weather?.[0]?.description || "unknown"})
        </Typography>
      )}
      
      {error && (
        <Box mt={2} p={1.5} bgcolor="#fff4e5" borderRadius={1}>
          <Typography color="error">{error}</Typography>
        </Box>
      )}
      
      {recommendations && (
        <Box mt={3}>
          {recommendations.split("\n").map((line, idx) => (
            <Typography key={idx} paragraph={line.trim() !== ""} variant={line.includes("Restaurant") || line.includes("Musical") || line.includes("Sports") ? "subtitle1" : "body1"}>
              {line}
            </Typography>
          ))}
        </Box>
      )}
    </Paper>
  );
};

export default RecommendationGenerator;