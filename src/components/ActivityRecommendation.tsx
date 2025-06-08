import React, { useState } from 'react';
import { 
  Box, 
  Button, 
  Card, 
  CardContent, 
  Typography, 
  CircularProgress,
  TextField,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
  Divider,
  Grid,
  Alert,
  List,
  ListItem,
  ListItemText
} from '@mui/material';
import LocationOnIcon from '@mui/icons-material/LocationOn';
import SearchIcon from '@mui/icons-material/Search';
import RecommendIcon from '@mui/icons-material/Recommend';

const WEATHER_API_KEY = '4673ed0222740b7fe90ac7e6580203db';

export default function ActivityRecommendation() {
  const [location, setLocation] = useState(null);
  const [weather, setWeather] = useState(null);
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [userQuery, setUserQuery] = useState(''); // User's query for SerpAPI
  const [recommendations, setRecommendations] = useState(''); // OpenAI recommendations
  const [locationOption, setLocationOption] = useState(''); // For manual location selection

  // Predefined locations for SerpAPI (commonly accepted formats)
  const predefinedLocations = [
    { label: "New York, NY", value: "New York, NY" },
    { label: "Los Angeles, CA", value: "Los Angeles, CA" },
    { label: "Chicago, IL", value: "Chicago, IL" },
    { label: "San Francisco, CA", value: "San Francisco, CA" },
    { label: "Miami, FL", value: "Miami, FL" },
    { label: "Austin, TX", value: "Austin, TX" },
    { label: "Seattle, WA", value: "Seattle, WA" },
    { label: "Boston, MA", value: "Boston, MA" }
  ];

  // Fetch location, weather, and events when the user clicks "Fetch Data"
  const fetchData = async () => {
    setLoading(true);
    setError(null);

    if (!navigator.geolocation) {
      setError("Geolocation is not supported by this browser.");
      setLoading(false);
      return;
    }

    navigator.geolocation.getCurrentPosition(
      async (position) => {
        const { latitude, longitude } = position.coords;
        setLocation({ latitude, longitude });

        try {
          // Fetch location name and weather in parallel
          const [locationName, weatherData] = await Promise.all([
            fetchLocationName(latitude, longitude),
            fetchWeatherData(latitude, longitude),
          ]);

          setLocation((prev) => ({ ...prev, name: locationName }));
          setWeather(weatherData);
        } catch (err) {
          console.error('Error fetching location or weather:', err);
          setError('Failed to fetch location or weather.');
        } finally {
          setLoading(false);
        }
      },
      (err) => {
        setError(`Location error: ${err.message}`);
        setLoading(false);
      }
    );
  };

  // Fetch location name from coordinates
  const fetchLocationName = async (latitude, longitude) => {
    try {
      const response = await fetch(
        `https://api.openweathermap.org/geo/1.0/reverse?lat=${latitude}&lon=${longitude}&limit=1&appid=${WEATHER_API_KEY}`
      );
      const data = await response.json();
      if (data && data[0]) {
        // Format location in a simpler format that might work better with SerpAPI
        const city = data[0].name;
        const state = data[0].state ? data[0].state.replace(/[^A-Za-z]/g, '') : '';
        const stateCode = state.length > 2 ? state.slice(0, 2).toUpperCase() : state.toUpperCase();
        const locationName = stateCode ? `${city}, ${stateCode}` : city;
        return locationName.trim();
      } else {
        throw new Error('Failed to fetch location name.');
      }
    } catch (err) {
      console.error('Error fetching location name:', err);
      throw err;
    }
  };

  // Fetch weather data
  const fetchWeatherData = async (latitude, longitude) => {
    try {
      const response = await fetch(
        `https://api.openweathermap.org/data/2.5/weather?lat=${latitude}&lon=${longitude}&units=metric&appid=${WEATHER_API_KEY}`
      );
      const data = await response.json();
      return data;
    } catch (err) {
      console.error('Error fetching weather data:', err);
      throw err;
    }
  };

  // Handle location change from dropdown
  const handleLocationChange = (event) => {
    const selectedLocation = event.target.value;
    setLocationOption(selectedLocation);
    setLocation((prev) => ({ 
      ...(prev || {}), // Keep existing data or create new object
      name: selectedLocation 
    }));
  };

  // Fetch events from SerpAPI based on user query
  const fetchEventsFromSerpAPI = async () => {
    try {
      setLoading(true);
      setError(null);
      
      // Check if we have a search query
      if (!userQuery || userQuery.trim() === '') {
        throw new Error('Please enter a search term for events');
      }
      
      // Check if we have location information
      if (!locationOption && (!location || !location.name)) {
        throw new Error('Please select a location or fetch your current location first.');
      }
      
      const apiKey = 'b435b7f260ea7e50daf8be5dbe9a6404192bdaf095a74c789c87905f5aaad58d';
      
      // Use the user's query directly without modifications
      const searchQuery = userQuery.trim();
      
      // Use either the manually selected location or the auto-detected one
      const locationParam = locationOption || location?.name;
      
      console.log(`Searching for: ${searchQuery} in ${locationParam}`);
      
      const url = `http://localhost:5050/api/events?q=${encodeURIComponent(searchQuery)}&location=${encodeURIComponent(locationParam)}&apiKey=${apiKey}`;
      
      const response = await fetch(url);
      if (!response.ok) {
        throw new Error(`Failed to fetch events: ${response.status}`);
      }
      
      const data = await response.json();
      
      if (data.success && data.data.events_results && data.data.events_results.length > 0) {
        const serpEvents = data.data.events_results.map(event => ({
          title: event.title,
          venue: event.venue?.name || 'Unknown Venue',
          time: event.date?.start_date || 'Unknown Time',
        }));
        setEvents(serpEvents);
      } else if (data.success && data.data.error) {
        setError(`SerpAPI Error: ${data.data.error}`);
        setEvents([]);
      } else {
        setEvents([]);
        setError(`No events found for "${searchQuery}" in ${locationParam}`);
      }
    } catch (err) {
      console.error('Error fetching events from SerpAPI:', err);
      setError(err.message || 'Failed to fetch events');
    } finally {
      setLoading(false);
    }
  };

  // Generate recommendations using OpenAI
  const generateRecommendations = async () => {
    setLoading(true);
    setError(null);

    try {
      if (!weather || !location || events.length === 0) {
        throw new Error('Weather, location, or events data is missing.');
      }

      const OPENAI_API_KEY = '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';
      const weatherDesc = weather.weather[0].description;
      const temp = weather.main.temp;
      const locationName = location.name || locationOption || 'your location';
      const eventsText = events.map(e => `${e.title} at ${e.venue} (${e.time})`).join(', ');

      const prompt = `
        I'm in ${locationName}. The weather is ${weatherDesc} with a temperature of ${temp}°C.
        Here are some events happening nearby: ${eventsText}.
        Based on this information and the user's query "${userQuery}", recommend activities.
      `;

      const response = await fetch('https://api.openai.com/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${OPENAI_API_KEY}`,
        },
        body: JSON.stringify({
          model: 'gpt-3.5-turbo',
          messages: [
            { role: 'system', content: 'You are a helpful assistant that provides activity recommendations.' },
            { role: 'user', content: prompt },
          ],
          max_tokens: 200,
          temperature: 0.7,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        console.error('OpenAI API error:', errorData);
        throw new Error(`OpenAI API error: ${response.status} - ${errorData.error?.message || 'Unknown error'}`);
      }

      const data = await response.json();
      if (data.choices && data.choices.length > 0) {
        const recommendations = data.choices[0].message.content.trim();
        setRecommendations(recommendations);
      } else {
        throw new Error('Failed to generate recommendations.');
      }
    } catch (err) {
      console.error('Error generating recommendations:', err);
      setError(err.message || 'Failed to generate recommendations.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <Card sx={{ mb: 3 }}>
        <CardContent>
          <Typography variant="h5" gutterBottom>
            Activity Recommendations
          </Typography>
          
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, mb: 3 }}>
            <Typography variant="subtitle1">Step 1: Set your location</Typography>
            
            <Box sx={{ display: 'flex', gap: 2, flexDirection: { xs: 'column', sm: 'row' } }}>
              <Button 
                variant="contained" 
                color="primary" 
                startIcon={<LocationOnIcon />}
                onClick={fetchData}
                disabled={loading}
                sx={{ flex: 1 }}
              >
                Use Current Location
              </Button>
              
              <Typography variant="subtitle1" sx={{ alignSelf: 'center' }}>OR</Typography>
              
              <FormControl sx={{ flex: 2, minWidth: 200 }}>
                <InputLabel>Select a location</InputLabel>
                <Select
                  value={locationOption}
                  onChange={handleLocationChange}
                  label="Select a location"
                >
                  {predefinedLocations.map((option) => (
                    <MenuItem key={option.value} value={option.value}>
                      {option.label}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Box>
            
            {location && location.name && (
              <Alert severity="success">
                Current location: {location.name}
              </Alert>
            )}
            
            {weather && (
              <Box sx={{ mt: 2, p: 2, bgcolor: 'background.paper', borderRadius: 1 }}>
                <Typography variant="h6">Weather</Typography>
                <Typography>
                  {weather.weather[0].description}, {weather.main.temp}°C
                </Typography>
              </Box>
            )}
          </Box>
          
          <Divider sx={{ my: 3 }} />
          
          <Box sx={{ mb: 3 }}>
            <Typography variant="subtitle1" gutterBottom>Step 2: Search for events</Typography>
            
            <Box sx={{ display: 'flex', gap: 2 }}>
              <TextField
                fullWidth
                label="What types of events are you looking for?"
                value={userQuery}
                onChange={(e) => setUserQuery(e.target.value)}
                placeholder="concerts, art exhibitions, sports games, etc."
                sx={{ flex: 3 }}
              />
              
              <Button
                variant="contained"
                color="secondary"
                startIcon={<SearchIcon />}
                onClick={fetchEventsFromSerpAPI}
                disabled={loading || (!location && !locationOption)}
                sx={{ flex: 1 }}
              >
                Search Events
              </Button>
            </Box>
          </Box>
          
          {loading && (
            <Box sx={{ display: 'flex', justifyContent: 'center', my: 4 }}>
              <CircularProgress />
            </Box>
          )}
          
          {error && (
            <Alert severity="error" sx={{ my: 2 }}>
              {error}
            </Alert>
          )}
          
          {events.length > 0 && (
            <Box sx={{ my: 3 }}>
              <Typography variant="h6" gutterBottom>Events Found ({events.length})</Typography>
              <List>
                {events.map((event, index) => (
                  <ListItem key={index} divider>
                    <ListItemText
                      primary={event.title}
                      secondary={`${event.venue} | ${event.time}`}
                    />
                  </ListItem>
                ))}
              </List>
              
              <Button
                variant="contained"
                color="primary"
                startIcon={<RecommendIcon />}
                onClick={generateRecommendations}
                sx={{ mt: 2 }}
                disabled={loading}
              >
                Generate Recommendations
              </Button>
            </Box>
          )}
          
          {recommendations && (
            <Box sx={{ mt: 3, p: 2, bgcolor: 'rgba(0, 128, 0, 0.1)', borderRadius: 1 }}>
              <Typography variant="h6" gutterBottom>Personalized Recommendations</Typography>
              <Typography variant="body1" sx={{ whiteSpace: 'pre-line' }}>
                {recommendations}
              </Typography>
            </Box>
          )}
        </CardContent>
      </Card>
    </>
  );
}