import React, { useState, useEffect } from 'react';
import {
  Box,
  Typography,
  CircularProgress,
  Paper,
  Divider,
  List,
  ListItem,
  ListItemText,
  ListItemIcon,
  Chip,
  Button,
  Alert,
  Card,
  CardContent,
  CardActions,
  Grid
} from '@mui/material';
import RestaurantIcon from '@mui/icons-material/Restaurant';
import MusicNoteIcon from '@mui/icons-material/MusicNote';
import SportsIcon from '@mui/icons-material/Sports';
import RefreshIcon from '@mui/icons-material/Refresh';
import LightbulbIcon from '@mui/icons-material/Lightbulb';

interface RecommendationEngineProps {
  location: { lat: number; lng: number } | null;
  address: string;
  weather: any;
  restaurants: Array<any>;
  musicEvents: Array<any>;
  sportsEvents: Array<any>;
}

interface Recommendation {
  restaurants: Array<{
    name: string;
    reason: string;
  }>;
  musicEvents: Array<{
    name: string;
    reason: string;
  }>;
  sportsEvents: Array<{
    name: string;
    reason: string;
  }>;
  message?: string;
}

const RecommendationEngine: React.FC<RecommendationEngineProps> = ({
  location,
  address,
  weather,
  restaurants,
  musicEvents,
  sportsEvents
}) => {
  const [recommendations, setRecommendations] = useState<Recommendation | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [lastUpdate, setLastUpdate] = useState<Date | null>(null);

  useEffect(() => {
    if (location && weather && restaurants.length > 0) {
      generateRecommendations();
    }
  }, [location, weather]);

  const generateRecommendations = async () => {
    try {
      setLoading(true);
      setError(null);

      // Prepare data for the AI
      const weatherCondition = weather?.weather[0]?.description || "unknown weather";
      const temperature = weather?.main?.temp || "unknown temperature";
      const cityName = address.split(',')[0] || "your location";
      
      // Create a context message with all the information
      const contextMessage = `
        Location: ${cityName}
        Current weather: ${weatherCondition}, ${temperature}°C
        Available restaurants: ${restaurants.map(r => r.name).join(', ')}
        Available music events: ${musicEvents.map(e => e.title).join(', ')}
        Available sports events: ${sportsEvents.map(e => e.title).join(', ')}
      `;

      // Call OpenAI API
      const response = await fetch('http://localhost:5050/api/ai/recommendations', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          context: contextMessage,
          location: cityName,
          weather: {
            condition: weatherCondition,
            temperature: temperature
          }
        })
      });

      if (!response.ok) {
        throw new Error(`Failed to get recommendations: ${response.status}`);
      }

      const data = await response.json();
      
      if (data.error) {
        throw new Error(data.error);
      }

      // If no AI service is available, generate mock recommendations
      if (!data.recommendations) {
        const mockRecommendations = generateMockRecommendations();
        setRecommendations(mockRecommendations);
      } else {
        setRecommendations(data.recommendations);
      }
      
      setLastUpdate(new Date());
    } catch (err: any) {
      console.error("Error generating recommendations:", err);
      setError(err.message || "Failed to generate recommendations");
      
      // Fallback to mock recommendations
      const mockRecommendations = generateMockRecommendations();
      setRecommendations(mockRecommendations);
      
    } finally {
      setLoading(false);
    }
  };

  const generateMockRecommendations = (): Recommendation => {
    const weatherCondition = weather?.weather[0]?.description || "clear";
    const temperature = weather?.main?.temp || 20;
    const isWarm = temperature > 15;
    const isRainy = weatherCondition.includes('rain') || weatherCondition.includes('shower');
    
    // Use actual restaurant names if available
    const restaurantRecs = restaurants.slice(0, 3).map(restaurant => ({
      name: restaurant.name,
      reason: isRainy 
        ? `Perfect for a cozy meal during ${weatherCondition} weather` 
        : `Great ${isWarm ? 'outdoor' : 'indoor'} dining experience for ${weatherCondition} conditions`
    }));

    // Use actual music events if available
    const musicRecs = musicEvents.slice(0, 3).map(event => ({
      name: event.title,
      reason: isRainy 
        ? `Enjoy this indoor concert while staying dry from the ${weatherCondition}` 
        : `${isWarm ? 'Perfect evening for a ' : 'Warm up with a '} ${event.genre || 'music'} event`
    }));

    // Use actual sports events if available
    const sportsRecs = sportsEvents.slice(0, 3).map(event => ({
      name: event.title,
      reason: isRainy 
        ? `This indoor sports event is ideal during ${weatherCondition}` 
        : `Great ${isWarm ? 'weather' : 'opportunity'} to enjoy this ${event.venue} event`
    }));

    return {
      restaurants: restaurantRecs.length > 0 ? restaurantRecs : [
        { name: "Cozy Bistro", reason: "Perfect for the current weather conditions" },
        { name: "The Local Grill", reason: "Highly rated and matches your preferences" },
        { name: "Green Garden Restaurant", reason: "Fresh seasonal menu ideal for today" }
      ],
      musicEvents: musicRecs.length > 0 ? musicRecs : [
        { name: "Jazz in the Park", reason: "Appropriate for current weather conditions" },
        { name: "Symphony Orchestra Concert", reason: "Indoor event perfect for today" },
        { name: "Local Band Night", reason: "Popular event with great atmosphere" }
      ],
      sportsEvents: sportsRecs.length > 0 ? sportsRecs : [
        { name: "City Basketball Tournament", reason: "Indoor event perfect for today" },
        { name: "Weekend Running Event", reason: "Weather is ideal for this outdoor activity" },
        { name: "Local Soccer Match", reason: "Popular event happening near you" }
      ],
      message: `These recommendations are based on the current ${weatherCondition} conditions and ${temperature}°C temperature in your area.`
    };
  };

  return (
    <Paper elevation={3} sx={{ p: 3, borderRadius: 2, mt: 3, bgcolor: '#f9f9f9' }}>
      <Box display="flex" alignItems="center" justifyContent="space-between" mb={2}>
        <Box display="flex" alignItems="center">
          <LightbulbIcon sx={{ color: '#FFD700', mr: 1, fontSize: 28 }} />
          <Typography variant="h5" fontWeight="bold">
            AI Recommendations
          </Typography>
        </Box>
        <Button 
          startIcon={<RefreshIcon />}
          onClick={generateRecommendations}
          disabled={loading}
          size="small"
          variant="outlined"
        >
          Refresh
        </Button>
      </Box>
      
      {loading ? (
        <Box display="flex" alignItems="center" justifyContent="center" py={4}>
          <CircularProgress />
          <Typography variant="body1" ml={2}>
            Generating personalized recommendations...
          </Typography>
        </Box>
      ) : error ? (
        <Alert severity="error" sx={{ mb: 2 }}>
          {error}
        </Alert>
      ) : recommendations ? (
        <>
          {recommendations.message && (
            <Alert severity="info" sx={{ mb: 3 }}>
              {recommendations.message}
            </Alert>
          )}
          
          <Grid container spacing={3}>
            {/* Restaurant Recommendations */}
            <Grid item xs={12} md={4}>
              <Card sx={{ height: '100%' }}>
                <CardContent>
                  <Box display="flex" alignItems="center" mb={2}>
                    <RestaurantIcon sx={{ mr: 1, color: 'primary.main' }} />
                    <Typography variant="h6">Restaurant Picks</Typography>
                  </Box>
                  <List dense>
                    {recommendations.restaurants.map((rec, idx) => (
                      <ListItem key={idx} sx={{ pl: 0 }}>
                        <ListItemText
                          primary={<Typography fontWeight="medium">{rec.name}</Typography>}
                          secondary={rec.reason}
                        />
                      </ListItem>
                    ))}
                  </List>
                </CardContent>
              </Card>
            </Grid>
            
            {/* Music Event Recommendations */}
            <Grid item xs={12} md={4}>
              <Card sx={{ height: '100%' }}>
                <CardContent>
                  <Box display="flex" alignItems="center" mb={2}>
                    <MusicNoteIcon sx={{ mr: 1, color: 'secondary.main' }} />
                    <Typography variant="h6">Music Event Picks</Typography>
                  </Box>
                  <List dense>
                    {recommendations.musicEvents.map((rec, idx) => (
                      <ListItem key={idx} sx={{ pl: 0 }}>
                        <ListItemText
                          primary={<Typography fontWeight="medium">{rec.name}</Typography>}
                          secondary={rec.reason}
                        />
                      </ListItem>
                    ))}
                  </List>
                </CardContent>
              </Card>
            </Grid>
            
            {/* Sports Event Recommendations */}
            <Grid item xs={12} md={4}>
              <Card sx={{ height: '100%' }}>
                <CardContent>
                  <Box display="flex" alignItems="center" mb={2}>
                    <SportsIcon sx={{ mr: 1, color: 'info.main' }} />
                    <Typography variant="h6">Sports Event Picks</Typography>
                  </Box>
                  <List dense>
                    {recommendations.sportsEvents.map((rec, idx) => (
                      <ListItem key={idx} sx={{ pl: 0 }}>
                        <ListItemText
                          primary={<Typography fontWeight="medium">{rec.name}</Typography>}
                          secondary={rec.reason}
                        />
                      </ListItem>
                    ))}
                  </List>
                </CardContent>
              </Card>
            </Grid>
          </Grid>
          
          {lastUpdate && (
            <Typography variant="caption" color="text.secondary" sx={{ mt: 2, display: 'block', textAlign: 'right' }}>
              Last updated: {lastUpdate.toLocaleTimeString()}
            </Typography>
          )}
        </>
      ) : (
        <Alert severity="info">
          Click the refresh button to generate personalized recommendations based on your location and current weather.
        </Alert>
      )}
    </Paper>
  );
};

export default RecommendationEngine;