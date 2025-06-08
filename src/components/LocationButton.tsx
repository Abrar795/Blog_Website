import React, { useState, useEffect } from 'react';
import { 
  Button, 
  Dialog, 
  DialogTitle, 
  DialogContent, 
  DialogActions,
  Box,
  IconButton,
  Typography,
  CircularProgress,
  List,
  ListItem,
  ListItemText,
  Link,
  Chip,
  Divider,
  Tab,
  Tabs,
  Alert,
  Paper,
  Card,
  CardContent,
  CardActions
} from '@mui/material';
import CloseIcon from '@mui/icons-material/Close';
import LocationOnIcon from '@mui/icons-material/LocationOn';
import RestaurantIcon from '@mui/icons-material/Restaurant';
import SportsIcon from '@mui/icons-material/Sports';
import MusicNoteIcon from '@mui/icons-material/MusicNote';
import RefreshIcon from '@mui/icons-material/Refresh';
import AutoAwesomeIcon from '@mui/icons-material/AutoAwesome';
import GoogleMapReact from 'google-map-react';
import WeatherDisplay from './WeatherDisplay.tsx';

// Add this style definition at the top of your component
const recommendedButtonStyle = {
  position: 'fixed',
  top: '20px',
  right: '20px',
  zIndex: 1000,
  boxShadow: '0 3px 5px rgba(0,0,0,0.2)',
};

interface LocationButtonProps {
  userLocation: { lat: number; lng: number } | null;
}

interface Restaurant {
  name: string;
  rating: string;
  address: string;
  hours?: string;
  website?: string;
  lat: number;
  lng: number;
}

interface SportsEvent {
  title: string;
  venue: string;
  time: string;
  date?: string;
  link?: string;
  address?: string[];
  location?: {
    lat: number;
    lng: number;
  };
}

interface MusicEvent {
  title: string;
  venue: string;
  time: string;
  date?: string;
  link?: string;
  address?: string[];
  performers?: string[];
  genre?: string;
  location?: {
    lat: number;
    lng: number;
  };
}

const SERP_API_KEY = "b435b7f260ea7e50daf8be5dbe9a6404192bdaf095a74c789c87905f5aaad58d";
const GOOGLE_MAPS_API_KEY = "AIzaSyA6_MQyYuTqgCx91FUEmaU39lcoTqMDtzI";
const OPENAI_API_KEY = "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";

const LocationButton: React.FC<LocationButtonProps> = ({ userLocation }) => {
  const [open, setOpen] = useState(false);
  const [location, setLocation] = useState<{ lat: number; lng: number } | null>(null);
  const [address, setAddress] = useState<string>("");
  const [loadingAddress, setLoadingAddress] = useState<boolean>(false);
  const [restaurants, setRestaurants] = useState<Restaurant[]>([]);
  const [loadingRestaurants, setLoadingRestaurants] = useState<boolean>(false);
  const [restaurantError, setRestaurantError] = useState<string | null>(null);
  const [sportsEvents, setSportsEvents] = useState<SportsEvent[]>([]);
  const [loadingSportsEvents, setLoadingSportsEvents] = useState<boolean>(false);
  const [sportsError, setSportsError] = useState<string | null>(null);
  const [musicEvents, setMusicEvents] = useState<MusicEvent[]>([]);
  const [loadingMusicEvents, setLoadingMusicEvents] = useState<boolean>(false);
  const [musicError, setMusicError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState(0);
  const [debugInfo, setDebugInfo] = useState<string | null>(null);
  const [recommendations, setRecommendations] = useState<{
    restaurants: string[];
    sportsEvents: string[];
    musicEvents: string[];
    explanation: string;
  }>({ restaurants: [], sportsEvents: [], musicEvents: [], explanation: '' });
  const [loadingRecommendations, setLoadingRecommendations] = useState<boolean>(false);
  const [recommendationsError, setRecommendationsError] = useState<string | null>(null);

  useEffect(() => {
    if (userLocation) {
      setLocation(userLocation);
      fetchAddress(userLocation);
    } else {
      getUserLocation()
        .then(location => {
          setLocation(location);
          fetchAddress(location);
        })
        .catch(err => console.error("Could not get user location:", err));
    }
  }, [userLocation]);

  const handleOpen = async () => {
    setOpen(true);
    if (location) {
      await Promise.all([
        fetchRestaurants(location.lat, location.lng),
        fetchSportsEvents(location.lat, location.lng),
        fetchMusicEvents(location.lat, location.lng)
      ]);
    }
  };

  const handleClose = () => setOpen(false);

  const handleTabChange = (event: React.SyntheticEvent, newValue: number) => {
    setActiveTab(newValue);
    
    // Generate recommendations when switching to AI Recommendations tab
    if (newValue === 4 && recommendations.restaurants.length === 0) {
      generateRecommendations();
    }
  };

  const getUserLocation = async () => {
    return new Promise<{ lat: number; lng: number }>((resolve, reject) => {
      if (navigator.geolocation) {
        navigator.geolocation.getCurrentPosition(
          (position) => {
            const { latitude, longitude } = position.coords;
            resolve({ lat: latitude, lng: longitude });
          },
          (error) => {
            console.error("Error fetching location:", error);
            reject(error);
          }
        );
      } else {
        reject(new Error("Geolocation not supported"));
      }
    });
  };

  const fetchAddress = async (location: { lat: number; lng: number }) => {
    try {
      setLoadingAddress(true);
      const response = await fetch(
        `https://maps.googleapis.com/maps/api/geocode/json?latlng=${location.lat},${location.lng}&key=${GOOGLE_MAPS_API_KEY}`
      );
      
      const data = await response.json();
      
      if (data.status === "OK" && data.results && data.results.length > 0) {
        setAddress(data.results[0].formatted_address);
      } else {
        setAddress("Address not found");
      }
    } catch (error) {
      console.error("Error fetching address:", error);
      setAddress("Error fetching address");
    } finally {
      setLoadingAddress(false);
    }
  };

  const geocodeAddress = async (addressParts: string[]): Promise<{ lat: number; lng: number } | null> => {
    if (!addressParts || addressParts.length === 0) return null;
    
    try {
      const fullAddress = addressParts.join(", ");
      
      console.log(`Geocoding address: ${fullAddress}`);
      
      const response = await fetch(
        `https://maps.googleapis.com/maps/api/geocode/json?address=${encodeURIComponent(fullAddress)}&key=${GOOGLE_MAPS_API_KEY}`
      );
      
      const data = await response.json();
      
      if (data.status === "OK" && data.results && data.results.length > 0) {
        const location = data.results[0].geometry.location;
        console.log(`Geocoded result: ${location.lat}, ${location.lng}`);
        return { lat: location.lat, lng: location.lng };
      } else {
        console.error(`Geocoding error: ${data.status} - ${JSON.stringify(data.error_message || 'No error message')}`);
        return null;
      }
    } catch (error) {
      console.error("Error geocoding address:", error);
      return null;
    }
  };

  const getRandomRestaurants = (restaurants: Restaurant[], count: number = 3): Restaurant[] => {
    if (restaurants.length <= count) return restaurants;
    
    const shuffled = [...restaurants].sort(() => 0.5 - Math.random());
    return shuffled.slice(0, count);
  };

  const generateRestaurantCoordinates = (userLoc: { lat: number; lng: number }): Restaurant[] => {
    if (!userLoc) return [];
    
    const sampleRestaurants = [
      {
        name: "The Delicious Corner",
        rating: "4.7",
        address: "123 Main St, Nearby City",
        hours: "9:00 AM - 10:00 PM",
        website: "https://example.com/restaurant1",
        lat: 0, 
        lng: 0  
      },
      {
        name: "Pasta Paradise",
        rating: "4.5",
        address: "456 Oak Ave, Nearby City",
        hours: "11:00 AM - 11:00 PM",
        website: "https://example.com/restaurant2",
        lat: 0,
        lng: 0
      },
      {
        name: "Burger Heaven",
        rating: "4.2",
        address: "789 Pine Blvd, Nearby City",
        hours: "10:00 AM - 9:00 PM",
        website: "https://example.com/restaurant3",
        lat: 0,
        lng: 0
      }
    ];
    
    return sampleRestaurants.map((restaurant) => {
      const latOffset = (Math.random() * 0.01) * (Math.random() > 0.5 ? 1 : -1);
      const lngOffset = (Math.random() * 0.01) * (Math.random() > 0.5 ? 1 : -1);
      
      return {
        ...restaurant,
        lat: userLoc.lat + latOffset,
        lng: userLoc.lng + lngOffset
      };
    });
  };

  const generateSportsEvents = (userLoc: { lat: number; lng: number }): SportsEvent[] => {
    if (!userLoc) return [];
    
    const sampleEvents = [
      {
        title: "Local Basketball Tournament",
        venue: "City Sports Arena",
        time: "7:00 PM",
        date: "2025-04-25",
        link: "https://example.com/basketball-tournament",
        address: ["City Sports Arena, 123 Sports Ave", "Nearby City, State"],
        location: { lat: 0, lng: 0 }
      },
      {
        title: "Community Soccer Match",
        venue: "Central Park Fields",
        time: "4:30 PM",
        date: "2025-04-24",
        link: "https://example.com/soccer-match",
        address: ["Central Park Fields, 456 Park Rd", "Nearby City, State"],
        location: { lat: 0, lng: 0 }
      },
      {
        title: "Marathon Event",
        venue: "Downtown Area",
        time: "8:00 AM",
        date: "2025-04-27",
        link: "https://example.com/marathon",
        address: ["Downtown Area, 789 Main St", "Nearby City, State"],
        location: { lat: 0, lng: 0 }
      }
    ];
    
    return sampleEvents.map(event => {
      const latOffset = (Math.random() * 0.02) * (Math.random() > 0.5 ? 1 : -1);
      const lngOffset = (Math.random() * 0.02) * (Math.random() > 0.5 ? 1 : -1);
      
      return {
        ...event,
        location: {
          lat: userLoc.lat + latOffset,
          lng: userLoc.lng + lngOffset
        }
      };
    });
  };

  const generateMusicEvents = (userLoc: { lat: number; lng: number }): MusicEvent[] => {
    if (!userLoc) return [];
    
    const sampleEvents = [
      {
        title: "Jazz in the Park",
        venue: "Central Park Amphitheater",
        time: "8:00 PM",
        date: "2025-04-26",
        link: "https://example.com/jazz-in-park",
        address: ["Central Park Amphitheater", "Nearby City, State"],
        performers: ["Jazz Ensemble", "Local Quartet"],
        genre: "Jazz",
        location: { lat: 0, lng: 0 }
      },
      {
        title: "Rock Festival",
        venue: "City Stadium",
        time: "6:00 PM",
        date: "2025-04-28",
        link: "https://example.com/rock-festival",
        address: ["City Stadium, 123 Stadium Way", "Nearby City, State"],
        performers: ["Rock Band A", "Rock Band B", "Famous Singer"],
        genre: "Rock",
        location: { lat: 0, lng: 0 }
      },
      {
        title: "Classical Music Night",
        venue: "Opera House",
        time: "7:30 PM",
        date: "2025-04-30",
        link: "https://example.com/classical-night",
        address: ["Opera House, 456 Arts Blvd", "Nearby City, State"],
        performers: ["Symphony Orchestra", "Guest Conductor"],
        genre: "",
        location: { lat: 0, lng: 0 }
      }
    ];
    
    return sampleEvents.map(event => {
      const latOffset = (Math.random() * 0.02) * (Math.random() > 0.5 ? 1 : -1);
      const lngOffset = (Math.random() * 0.02) * (Math.random() > 0.5 ? 1 : -1);
      
      return {
        ...event,
        location: {
          lat: userLoc.lat + latOffset,
          lng: userLoc.lng + lngOffset
        }
      };
    });
  };

  const fetchRestaurants = async (lat: number, lng: number) => {
    try {
      setLoadingRestaurants(true);
      setRestaurantError(null);
      
      try {
        const response = await fetch(`http://localhost:3000/api/restaurants?lat=${lat}&lng=${lng}`);
        
        if (!response.ok) {
          throw new Error(`Failed to fetch restaurants: ${response.status}`);
        }
        
        const data = await response.json();
        
        if (data.restaurants && data.restaurants.length > 0) {
          const restaurantsWithCoords = data.restaurants.map(restaurant => ({
            ...restaurant,
            lat: restaurant.lat || lat + (Math.random() * 0.01 - 0.005),
            lng: restaurant.lng || lng + (Math.random() * 0.01 - 0.005)
          }));
          setRestaurants(getRandomRestaurants(restaurantsWithCoords));
          return;
        }
      } catch (apiError) {
        console.log("Local API fetch failed, trying SERP API...", apiError);
      }
      
      const cityMatch = address.match(/([^,]+),/);
      const cityName = cityMatch ? cityMatch[1].trim() : "nearby";
      
      const serpUrl = `http://localhost:5050/api/events?q=restaurants+in+${encodeURIComponent(cityName)}&location=${encodeURIComponent(
        cityName
      )}&apiKey=${SERP_API_KEY}`;
      
      const serpResponse = await fetch(serpUrl);
      
      if (!serpResponse.ok) {
        throw new Error(`Failed to fetch restaurants: ${serpResponse.status}`);
      }
      
      const serpData = await serpResponse.json();
      
      if (serpData.success && serpData.data?.events_results) {
        const apiRestaurants = serpData.data.events_results.map((result: any) => ({
          name: result.title || 'Unknown Restaurant',
          rating: result.rating || '4.0',
          address: result.venue?.name || 'Address not available',
          hours: result.date?.when || 'Hours not available',
          website: result.link || null,
          lat: lat + (Math.random() * 0.01 - 0.005),
          lng: lng + (Math.random() * 0.01 - 0.005)
        }));
        
        setRestaurants(getRandomRestaurants(apiRestaurants));
      } else {
        const localRestaurants = generateRestaurantCoordinates({ lat, lng });
        setRestaurants(localRestaurants);
        setRestaurantError("No restaurants found in this area. Showing sample data.");
      }
    } catch (err: any) {
      console.error("Error fetching restaurants:", err);
      setRestaurantError(err.message || "Failed to fetch restaurants");
      
      const localRestaurants = generateRestaurantCoordinates({ lat, lng });
      setRestaurants(localRestaurants);
    } finally {
      setLoadingRestaurants(false);
    }
  };

  const fetchSportsEvents = async (lat: number, lng: number) => {
    try {
      setLoadingSportsEvents(true);
      setSportsError(null);
      setDebugInfo(null);

      // IMPROVED: Extract city name from address - same as music events
      let cityName = "Chicago"; // Default fallback
      
      if (address) {
        // Try to find city in typical address format "Street, City, State ZIP"
        const addressParts = address.split(',').map(part => part.trim());
        
        // Use second part if available (usually the city)
        if (addressParts.length >= 2 && addressParts[1]) {
          // Clean up the city name (remove state abbreviation if present)
          cityName = addressParts[1].replace(/\s+[A-Z]{2}\s+\d+/, '').trim();
        }
        
        // If city name still contains numbers or looks like a street, use default
        if (cityName.match(/^\d+/) || cityName.match(/ave|street|st\.|road|rd\./) || cityName.length < 3) {
          console.log(`Invalid city name extracted: "${cityName}". Using default.`);
          cityName = "Chicago";
        }
      }
      
      // More specific search query
      const searchQuery = "sports events OR games OR matches";
      console.log(`Searching for: ${searchQuery} in city: ${cityName}`);
      
      const url = `http://localhost:5050/api/events?q=${encodeURIComponent(searchQuery)}&location=${encodeURIComponent(
        cityName
      )}&apiKey=${SERP_API_KEY}`;

      console.log("API request URL:", url);
      
      const response = await fetch(url);
      if (!response.ok) {
        throw new Error(`Failed to fetch sports events: ${response.status}`);
      }

      const data = await response.json();
      console.log("Sports events API response:", data);
      
      if (data.success && data.data?.error) {
        console.error(`API returned error: ${data.data.error}`);
        setDebugInfo(`API error: ${data.data.error}`);
        
        const sampleEvents = generateSportsEvents({ lat, lng });
        setSportsEvents(sampleEvents);
        setSportsError(`Location error: ${data.data.error}. Showing sample data.`);
        return;
      }
      
      if (data.success && data.data?.events_results && data.data.events_results.length > 0) {
        // Log the first event for debugging
        if (data.data.events_results[0]) {
          console.log("Sample event from API:", data.data.events_results[0]);
        }

        // Process events and geocode their addresses
        const processedEvents = [];
        
        for (const event of data.data.events_results) {
          // Create the basic event object
          const processedEvent: SportsEvent = {
            title: event.title || 'Unknown Event',
            venue: event.venue?.name || 'Unknown Venue',
            time: event.date?.when || event.date?.start_date || 'Unknown Time',
            date: event.date?.start_date || '',
            link: event.link || '',
            address: event.address || []
          };
          
          // Check if the event has address data
          if (event.address && event.address.length > 0) {
            // Try to geocode the address
            const addressCoords = await geocodeAddress(event.address);
            
            if (addressCoords) {
              processedEvent.location = addressCoords;
              console.log(`Geocoded ${processedEvent.title} to ${addressCoords.lat}, ${addressCoords.lng}`);
            } else {
              // If geocoding fails, use random coordinates
              const latOffset = (Math.random() * 0.02) * (Math.random() > 0.5 ? 1 : -1);
              const lngOffset = (Math.random() * 0.02) * (Math.random() > 0.5 ? 1 : -1);
              
              processedEvent.location = {
                lat: lat + latOffset,
                lng: lng + lngOffset
              };
              
              console.log(`Using random coordinates for ${processedEvent.title}: ${processedEvent.location.lat}, ${processedEvent.location.lng}`);
            }
          } else {
            // If no address, use random coordinates
            const latOffset = (Math.random() * 0.02) * (Math.random() > 0.5 ? 1 : -1);
            const lngOffset = (Math.random() * 0.02) * (Math.random() > 0.5 ? 1 : -1);
            
            processedEvent.location = {
              lat: lat + latOffset,
              lng: lng + lngOffset
            };
            
            console.log(`No address for ${processedEvent.title}, using random coordinates: ${processedEvent.location.lat}, ${processedEvent.location.lng}`);
          }
          
          processedEvents.push(processedEvent);
        }
        
        setSportsEvents(processedEvents);
        setDebugInfo(`Retrieved ${processedEvents.length} sports events successfully for ${cityName}. Geocoded ${processedEvents.filter(e => e.address && e.address.length > 0).length} addresses.`);
      } else {
        // If no results or API response issue, use sample data
        const sampleEvents = generateSportsEvents({ lat, lng });
        setSportsEvents(sampleEvents);
        setSportsError(`No sports events found in ${cityName}. Showing sample data.`);
        setDebugInfo("API response did not contain expected events_results data");
      }
    } catch (err: any) {
      console.error("Error fetching sports events:", err);
      setSportsError(err.message || "Failed to fetch sports events");
      
      // Generate sample events if API fails
      const sampleEvents = generateSportsEvents({ lat, lng });
      setSportsEvents(sampleEvents);
      setDebugInfo(`API error: ${err.message}`);
    } finally {
      setLoadingSportsEvents(false);
    }
  };

  const fetchMusicEvents = async (lat: number, lng: number) => {
    try {
      setLoadingMusicEvents(true);
      setMusicError(null);
      setDebugInfo(null);

      // IMPROVED: Extract city name from address
      let cityName = "Chicago"; // Default fallback
      
      if (address) {
        // Try to find city in typical address format "Street, City, State ZIP"
        const addressParts = address.split(',').map(part => part.trim());
        
        // Use second part if available (usually the city)
        if (addressParts.length >= 2 && addressParts[1]) {
          // Clean up the city name (remove state abbreviation if present)
          cityName = addressParts[1].replace(/\s+[A-Z]{2}\s+\d+/, '').trim();
        }
        
        // If city name still contains numbers or looks like a street, use default
        if (cityName.match(/^\d+/) || cityName.match(/ave|street|st\.|road|rd\./) || cityName.length < 3) {
          console.log(`Invalid city name extracted: "${cityName}". Using default.`);
          cityName = "Chicago";
        }
      }
      
      const searchQuery = "concerts OR music events";
      console.log(`Searching for: ${searchQuery} in city: ${cityName}`);
      
      const url = `http://localhost:5050/api/events?q=${encodeURIComponent(searchQuery)}&location=${encodeURIComponent(
        cityName
      )}&apiKey=${SERP_API_KEY}`;

      console.log("API request URL:", url);
      
      const response = await fetch(url);
      if (!response.ok) {
        throw new Error(`Failed to fetch music events: ${response.status}`);
      }

      const data = await response.json();
      console.log("Music events API response:", data);
      
      if (data.success && data.data?.error) {
        console.error(`API returned error: ${data.data.error}`);
        setDebugInfo(`API error: ${data.data.error}`);
        
        const sampleEvents = generateMusicEvents({ lat, lng });
        setMusicEvents(sampleEvents);
        setMusicError(`Location error: ${data.data.error}. Showing sample data.`);
        return;
      }
      
      if (data.success && data.data?.events_results && data.data.events_results.length > 0) {
        // Process events and geocode their addresses
        const processedEvents = [];
        
        for (const event of data.data.events_results) {
          // Create the basic event object
          const processedEvent: MusicEvent = {
            title: event.title || 'Unknown Event',
            venue: event.venue?.name || 'Unknown Venue',
            time: event.date?.when || event.date?.start_date || 'Unknown Time',
            date: event.date?.start_date || '',
            link: event.link || '',
            address: event.address || [],
            performers: event.performers || [],
            genre: event.genre || ''
          };
          
          // Check if the event has address data
          if (event.address && event.address.length > 0) {
            // Try to geocode the address
            const addressCoords = await geocodeAddress(event.address);
            
            if (addressCoords) {
              processedEvent.location = addressCoords;
              console.log(`Geocoded ${processedEvent.title} to ${addressCoords.lat}, ${addressCoords.lng}`);
            } else {
              // If geocoding fails, use random coordinates
              const latOffset = (Math.random() * 0.02) * (Math.random() > 0.5 ? 1 : -1);
              const lngOffset = (Math.random() * 0.02) * (Math.random() > 0.5 ? 1 : -1);
              
              processedEvent.location = {
                lat: lat + latOffset,
                lng: lng + lngOffset
              };
              
              console.log(`Using random coordinates for ${processedEvent.title}: ${processedEvent.location.lat}, ${processedEvent.location.lng}`);
            }
          } else {
            // If no address, use random coordinates
            const latOffset = (Math.random() * 0.02) * (Math.random() > 0.5 ? 1 : -1);
            const lngOffset = (Math.random() * 0.02) * (Math.random() > 0.5 ? 1 : -1);
            
            processedEvent.location = {
              lat: lat + latOffset,
              lng: lng + lngOffset
            };
            
            console.log(`No address for ${processedEvent.title}, using random coordinates: ${processedEvent.location.lat}, ${processedEvent.location.lng}`);
          }
          
          processedEvents.push(processedEvent);
        }
        
        setMusicEvents(processedEvents);
        setDebugInfo(`Retrieved ${processedEvents.length} music events successfully for ${cityName}. Geocoded ${processedEvents.filter(e => e.address && e.address.length > 0).length} addresses.`);
      } else {
        // If no results or API response issue, use sample data
        const sampleEvents = generateMusicEvents({ lat, lng });
        setMusicEvents(sampleEvents);
        setMusicError(`No music events found in ${cityName}. Showing sample data.`);
        setDebugInfo("API response did not contain expected events_results data");
      }
    } catch (err: any) {
      console.error("Error fetching music events:", err);
      setMusicError(err.message || "Failed to fetch music events");
      
      // Generate sample events if API fails
      const sampleEvents = generateMusicEvents({ lat, lng });
      setMusicEvents(sampleEvents);
      setDebugInfo(`API error: ${err.message}`);
    } finally {
      setLoadingMusicEvents(false);
    }
  };

  const fetchWeatherForRecommendations = async (lat: number, lng: number) => {
    try {
      // Using the same OpenWeatherMap API key as in the WeatherDisplay component
      const WEATHER_API_KEY = "4673ed0222740b7fe90ac7e6580203db";
      
      const url = `https://api.openweathermap.org/data/2.5/weather?lat=${lat}&lon=${lng}&units=metric&appid=${WEATHER_API_KEY}`;
      
      const response = await fetch(url);
      if (!response.ok) {
        throw new Error(`Failed to fetch weather: ${response.status}`);
      }
      
      const data = await response.json();
      return {
        description: data.weather[0]?.description || "unknown",
        temperature: `${Math.round(data.main?.temp)}°C`,
        conditions: data.weather[0]?.main || "unknown",
        feelsLike: data.main?.feels_like || 0,
        humidity: data.main?.humidity || 0,
        windSpeed: data.wind?.speed || 0
      };
    } catch (error) {
      console.error("Error fetching weather for recommendations:", error);
      return {
        description: "unknown",
        temperature: "unknown",
        conditions: "unknown",
        feelsLike: 0,
        humidity: 0,
        windSpeed: 0
      };
    }
  };

  const generateRecommendations = async () => {
    try {
      setLoadingRecommendations(true);
      setRecommendationsError(null);
      
      // Directly fetch the weather data
      let weatherData = { description: "unknown", temperature: "unknown", conditions: "unknown" };
      if (location) {
        weatherData = await fetchWeatherForRecommendations(location.lat, location.lng);
      }
      
      // Prepare the data for OpenAI
      const availableRestaurants = restaurants.map(r => ({
        name: r.name,
        address: r.address,
        rating: r.rating,
        hours: r.hours || "Unknown hours"
      }));

      const availableSportsEvents = sportsEvents.map(e => ({
        title: e.title,
        venue: e.venue,
        time: e.time,
        date: e.date
      }));

      const availableMusicEvents = musicEvents.map(e => ({
        title: e.title,
        venue: e.venue,
        time: e.time,
        date: e.date,
        genre: e.genre || "",
        performers: e.performers || []
      }));

      // Create a comprehensive prompt with detailed weather information
      const prompt = `
        I'm currently in ${address || "an unknown location"}.
        The current weather is: ${weatherData.description} at ${weatherData.temperature} (${weatherData.conditions}).
        Additional weather info: Feels like ${weatherData.feelsLike}°C, Humidity: ${weatherData.humidity}%, Wind: ${(weatherData.windSpeed * 3.6).toFixed(1)} km/h.
        
        Based on my location and the current weather conditions, please recommend:
        - 3 restaurants from this list: ${JSON.stringify(availableRestaurants)}
        - 3 sports events from this list: ${JSON.stringify(availableSportsEvents)}
        - 3 music events from this list: ${JSON.stringify(availableMusicEvents)}
        
        For each recommendation, consider:
        - Weather appropriateness (indoor vs outdoor for current conditions)
        - Time of day and date
        - Location convenience
        - Rating and reviews for restaurants
        - Genre preferences for music events
        
        Format your response as JSON with the following structure:
        {
          "restaurants": ["Restaurant Name 1", "Restaurant Name 2", "Restaurant Name 3"],
          "sportsEvents": ["Sports Event Title 1", "Sports Event Title 2", "Sports Event Title 3"],
          "musicEvents": ["Music Event Title 1", "Music Event Title 2", "Music Event Title 3"],
          "explanation": "Brief explanation of your recommendations considering the weather and location"
        }
      `;

      console.log("Sending request to OpenAI with weather data:", weatherData);
      
      // Make the actual OpenAI API call
      const response = await fetch("https://api.openai.com/v1/chat/completions", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${OPENAI_API_KEY}`
        },
        body: JSON.stringify({
          model: "gpt-3.5-turbo",
          messages: [
            { role: "system", content: "You are a helpful assistant that recommends local activities based on location and weather." },
            { role: "user", content: prompt }
          ],
          temperature: 0.7,
          max_tokens: 800
        })
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(`OpenAI API error: ${errorData.error?.message || response.statusText}`);
      }
      
      const data = await response.json();
      console.log("OpenAI API response:", data);
      
      if (data.choices && data.choices.length > 0) {
        try {
          const content = data.choices[0].message.content;
          // Parse JSON from the content
          let parsedRecommendations;
          
          // Handle different response formats
          if (content.includes("```json")) {
            const jsonMatch = content.match(/```json\n([\s\S]*?)```/);
            parsedRecommendations = JSON.parse(jsonMatch[1]);
          } else if (content.includes("```")) {
            const jsonMatch = content.match(/```\n([\s\S]*?)```/);
            parsedRecommendations = JSON.parse(jsonMatch[1]);
          } else {
            parsedRecommendations = JSON.parse(content);
          }
          
          setRecommendations({
            restaurants: parsedRecommendations.restaurants.slice(0, 3),
            sportsEvents: parsedRecommendations.sportsEvents.slice(0, 3),
            musicEvents: parsedRecommendations.musicEvents.slice(0, 3),
            explanation: parsedRecommendations.explanation
          });
        } catch (parseError) {
          console.error("Error parsing recommendations:", parseError, data.choices[0].message.content);
          
          // Fallback to using available data if parsing fails
          setRecommendations({
            restaurants: availableRestaurants.slice(0, 3).map(r => r.name),
            sportsEvents: availableSportsEvents.slice(0, 3).map(e => e.title),
            musicEvents: availableMusicEvents.slice(0, 3).map(e => e.title),
            explanation: "Based on your location and weather, here are some recommendations. " +
                        "Note: There was an issue processing the AI response, so these are selected from available options."
          });
        }
      } else {
        throw new Error("No recommendations received from OpenAI");
      }
    } catch (error: any) {
      console.error("Error generating recommendations:", error);
      setRecommendationsError(error.message || "Failed to generate recommendations");
      
      // Fallback to simple recommendations if the API call fails
      setRecommendations({
        restaurants: restaurants.slice(0, 3).map(r => r.name),
        sportsEvents: sportsEvents.slice(0, 3).map(e => e.title),
        musicEvents: musicEvents.slice(0, 3).map(e => e.title),
        explanation: "Here are some nearby options. (Note: AI-powered recommendations are currently unavailable.)"
      });
    } finally {
      setLoadingRecommendations(false);
    }
  };

  const refreshData = async () => {
    if (location) {
      setActiveTab(0);
      
      setLoadingRestaurants(true);
      setLoadingSportsEvents(true);
      setLoadingMusicEvents(true);
      
      setRestaurantError(null);
      setSportsError(null);
      setMusicError(null);
      setDebugInfo(null);
      
      await Promise.all([
        fetchRestaurants(location.lat, location.lng),
        fetchSportsEvents(location.lat, location.lng),
        fetchMusicEvents(location.lat, location.lng)
      ]);
    }
  };

  return (
    <>
      <Button
        variant="contained"
        color="primary"
        startIcon={<LocationOnIcon />}
        onClick={handleOpen}
      >
        Explore Nearby
      </Button>

      <Button
        variant="contained"
        color="secondary"
        startIcon={<AutoAwesomeIcon />}
        onClick={() => {
          setActiveTab(4); // Set to AI Recommendations tab
          setOpen(true); // Open the dialog
          if (location) {
            Promise.all([
              fetchRestaurants(location.lat, location.lng),
              fetchSportsEvents(location.lat, location.lng),
              fetchMusicEvents(location.lat, location.lng)
            ]).then(() => {
              generateRecommendations();
            });
          } else {
            getUserLocation()
              .then(location => {
                setLocation(location);
                fetchAddress(location);
                return Promise.all([
                  fetchRestaurants(location.lat, location.lng),
                  fetchSportsEvents(location.lat, location.lng),
                  fetchMusicEvents(location.lat, location.lng)
                ]);
              })
              .then(() => {
                generateRecommendations();
              })
              .catch(err => console.error("Could not get user location:", err));
          }
        }}
        sx={recommendedButtonStyle}
      >
        Recommended For You
      </Button>

      <Dialog open={open} onClose={handleClose} fullWidth maxWidth="md">
        <DialogTitle>
          <Box display="flex" justifyContent="space-between" alignItems="center">
            <Typography variant="h6">Explore Nearby Locations</Typography>
            <Box>
              <IconButton onClick={refreshData} size="small" sx={{ mr: 1 }}>
                <RefreshIcon />
              </IconButton>
              <IconButton onClick={handleClose} size="small">
                <CloseIcon />
              </IconButton>
            </Box>
          </Box>
        </DialogTitle>
        
        <Divider />
        
        <Tabs value={activeTab} onChange={handleTabChange} variant="fullWidth">
          <Tab label="Map View" icon={<LocationOnIcon />} iconPosition="start" />
          <Tab label="Restaurants" icon={<RestaurantIcon />} iconPosition="start" />
          <Tab label="Sports Events" icon={<SportsIcon />} iconPosition="start" />
          <Tab label="Music & Concerts" icon={<MusicNoteIcon />} iconPosition="start" />
          <Tab label="AI Recommendations" icon={<AutoAwesomeIcon />} iconPosition="start" />
        </Tabs>
        
        <DialogContent>
          {activeTab === 0 && (
            <>
              <Box sx={{ height: "400px", width: "100%" }}>
                {location ? (
                  <GoogleMapReact
                    bootstrapURLKeys={{ key: GOOGLE_MAPS_API_KEY }}
                    center={location}
                    defaultZoom={14}
                    yesIWantToUseGoogleMapApiInternals
                    onGoogleApiLoaded={({ map, maps }) => {
                      const userMarker = new maps.Marker({
                        position: location,
                        map,
                        title: "Your Current Location",
                        icon: "http://maps.google.com/mapfiles/ms/icons/green-dot.png",
                        animation: maps.Animation.DROP,
                        zIndex: 1000
                      });
                      
                      const userInfoWindow = new maps.InfoWindow({
                        content: `
                          <div>
                            <h3>Your Location</h3>
                            <p>${address || "Current Location"}</p>
                            <p>Coordinates: ${location.lat.toFixed(6)}, ${location.lng.toFixed(6)}</p>
                          </div>
                        `
                      });
                      
                      userMarker.addListener('click', () => {
                        userInfoWindow.open({
                          anchor: userMarker,
                          map,
                        });
                      });
                      
                      const restaurantMarkers = restaurants.map((restaurant) => {
                        const restaurantMarker = new maps.Marker({
                          position: { lat: restaurant.lat, lng: restaurant.lng },
                          map,
                          title: restaurant.name,
                          icon: {
                            url: "http://maps.google.com/mapfiles/ms/icons/red-dot.png",
                            scaledSize: new maps.Size(40, 40)
                          },
                          animation: maps.Animation.DROP
                        });
                        
                        const infoWindow = new maps.InfoWindow({
                          content: `
                            <div>
                              <h3>${restaurant.name}</h3>
                              <p>${restaurant.address}</p>
                              <p>${restaurant.hours || "Hours not available"}</p>
                              ${restaurant.rating ? `<p>Rating: ★ ${restaurant.rating}</p>` : ''}
                              ${restaurant.website ? `<p><a href="${restaurant.website}" target="_blank">Visit Website</a></p>` : ''}
                            </div>
                          `
                        });
                        
                        restaurantMarker.addListener('click', () => {
                          infoWindow.open({
                            anchor: restaurantMarker,
                            map,
                          });
                        });
                        
                        return restaurantMarker;
                      });
                      
                      const eventMarkers = sportsEvents.map((event) => {
                        if (!event.location) return null;
                        
                        const eventMarker = new maps.Marker({
                          position: event.location,
                          map,
                          title: event.title,
                          icon: {
                            url: "http://maps.google.com/mapfiles/ms/icons/blue-dot.png",
                            scaledSize: new maps.Size(40, 40)
                          },
                          animation: maps.Animation.DROP
                        });
                        
                        const infoWindow = new maps.InfoWindow({
                          content: `
                            <div>
                              <h3>${event.title}</h3>
                              <p>Venue: ${event.venue}</p>
                              <p>Time: ${event.time}</p>
                              ${event.date ? `<p>Date: ${event.date}</p>` : ''}
                              ${event.address && event.address.length > 0 ? 
                                `<p>Address: ${event.address.join(', ')}</p>` : ''}
                              ${event.link ? `<p><a href="${event.link}" target="_blank">More Info</a></p>` : ''}
                            </div>
                          `
                        });
                        
                        eventMarker.addListener('click', () => {
                          infoWindow.open({
                            anchor: eventMarker,
                            map,
                          });
                        });
                        
                        return eventMarker;
                      }).filter(marker => marker !== null);

                      const musicEventMarkers = musicEvents.map((event) => {
                        if (!event.location) return null;
                        
                        const musicMarker = new maps.Marker({
                          position: event.location,
                          map,
                          title: event.title,
                          icon: {
                            url: "http://maps.google.com/mapfiles/ms/icons/yellow-dot.png",
                            scaledSize: new maps.Size(40, 40)
                          },
                          animation: maps.Animation.DROP
                        });
                        
                        const infoWindow = new maps.InfoWindow({
                          content: `
                            <div>
                              <h3>${event.title}</h3>
                              <p>Venue: ${event.venue}</p>
                              <p>Time: ${event.time}</p>
                              ${event.date ? `<p>Date: ${event.date}</p>` : ''}
                              ${event.performers && event.performers.length > 0 ? 
                                `<p>Performers: ${event.performers.join(', ')}</p>` : ''}
                              ${event.genre ? `<p>Genre: ${event.genre}</p>` : ''}
                              ${event.address && event.address.length > 0 ? 
                                `<p>Address: ${event.address.join(', ')}</p>` : ''}
                              ${event.link ? `<p><a href="${event.link}" target="_blank">Tickets & Info</a></p>` : ''}
                            </div>
                          `
                        });
                        
                        musicMarker.addListener('click', () => {
                          infoWindow.open({
                            anchor: musicMarker,
                            map,
                          });
                        });
                        
                        return musicMarker;
                      }).filter(marker => marker !== null);
                      
                      const locationControlDiv = document.createElement('div');
                      const controlButton = document.createElement('button');
                      controlButton.style.backgroundColor = '#fff';
                      controlButton.style.border = '2px solid #fff';
                      controlButton.style.borderRadius = '3px';
                      controlButton.style.boxShadow = '0 2px 6px rgba(0,0,0,.3)';
                      controlButton.style.color = 'rgb(25,25,25)';
                      controlButton.style.cursor = 'pointer';
                      controlButton.style.fontFamily = 'Roboto,Arial,sans-serif';
                      controlButton.style.fontSize = '16px';
                      controlButton.style.lineHeight = '38px';
                      controlButton.style.margin = '8px 0 22px';
                      controlButton.style.padding = '0 5px';
                      controlButton.style.textAlign = 'center';
                      controlButton.textContent = 'Center on My Location';
                      controlButton.title = 'Click to recenter the map on your location';
                      controlButton.type = 'button';
                      controlButton.addEventListener('click', () => {
                        map.panTo(location);
                        map.setZoom(15);
                        userMarker.setAnimation(maps.Animation.BOUNCE);
                        setTimeout(() => userMarker.setAnimation(null), 2100);
                      });
                      
                      locationControlDiv.appendChild(controlButton);
                      
                      map.controls[maps.ControlPosition.TOP_RIGHT].push(locationControlDiv);
                      
                      const bounds = new maps.LatLngBounds();
                      bounds.extend(location);
                      restaurants.forEach(restaurant => {
                        bounds.extend({ lat: restaurant.lat, lng: restaurant.lng });
                      });
                      sportsEvents.forEach(event => {
                        if (event.location) bounds.extend(event.location);
                      });
                      musicEvents.forEach(event => {
                        if (event.location) bounds.extend(event.location);
                      });

                      map.fitBounds(bounds);
                    }}
                  />
                ) : (
                  <Typography>Loading your location...</Typography>
                )}
              </Box>
              <Box mt={2}>
                <Typography variant="h6" gutterBottom>
                  Map Legend
                </Typography>
                <Box display="flex" alignItems="center" mb={1}>
                  <Box 
                    component="span" 
                    sx={{ 
                      width: 16, 
                      height: 16, 
                      borderRadius: '50%', 
                      bgcolor: 'green', 
                      display: 'inline-block',
                      mr: 1
                    }} 
                  />
                  <Typography variant="body2">Your Location</Typography>
                </Box>
                <Box display="flex" alignItems="center" mb={1}>
                  <Box 
                    component="span" 
                    sx={{ 
                      width: 16, 
                      height: 16, 
                      borderRadius: '50%', 
                      bgcolor: 'red', 
                      display: 'inline-block',
                      mr: 1
                    }} 
                  />
                  <Typography variant="body2">Restaurants ({restaurants.length})</Typography>
                </Box>
                <Box display="flex" alignItems="center" mb={1}>
                  <Box 
                    component="span" 
                    sx={{ 
                      width: 16, 
                      height: 16, 
                      borderRadius: '50%', 
                      bgcolor: 'blue', 
                      display: 'inline-block',
                      mr: 1
                    }} 
                  />
                  <Typography variant="body2">Sports Events ({sportsEvents.length})</Typography>
                </Box>
                <Box display="flex" alignItems="center" mb={1}>
                  <Box 
                    component="span" 
                    sx={{ 
                      width: 16, 
                      height: 16, 
                      borderRadius: '50%', 
                      bgcolor: 'yellow', // Changed from purple to yellow
                      display: 'inline-block',
                      mr: 1
                    }} 
                  />
                  <Typography variant="body2">Music Events ({musicEvents.length})</Typography>
                </Box>
              </Box>
              {location && (
                <Box mt={2}>
                  <Typography variant="body1">
                    <strong>Coordinates:</strong> {location.lat.toFixed(6)}, {location.lng.toFixed(6)}
                  </Typography>
                  <Typography variant="body1" sx={{ mt: 1 }}>
                    <strong>Address:</strong> {loadingAddress ? (
                      <Box component="span" sx={{ display: 'inline-flex', alignItems: 'center' }}>
                        <CircularProgress size={16} sx={{ mr: 1 }} /> Loading address...
                      </Box>
                    ) : address}
                  </Typography>
                  
                  <Box mt={2}>
                    <WeatherDisplay 
                      location={location} 
                      cityName={address ? address.split(',')[0] : undefined} 
                    />
                  </Box>
                </Box>
              )}
            </>
          )}
          {activeTab === 1 && (
            <>
              <Typography variant="h6" sx={{ mb: 2 }}>
                Restaurants Near {address || "Your Location"}
              </Typography>
              {loadingRestaurants && (
                <Box display="flex" justifyContent="center" my={3}>
                  <CircularProgress />
                </Box>
              )}
              {restaurantError && !loadingRestaurants && (
                <Box display="flex" alignItems="center" sx={{ my: 2 }}>
                  <Typography color="error">
                    {restaurantError}
                  </Typography>
                </Box>
              )}
              {restaurants.length > 0 ? (
                <List>
                  {restaurants.map((restaurant, index) => (
                    <ListItem key={index} divider>
                      <ListItemText
                        primary={
                          <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                            <Typography variant="h6" component="span">
                              {restaurant.name}
                            </Typography>
                            {restaurant.rating && (
                              <Chip 
                                size="small" 
                                label={`★ ${restaurant.rating}`} 
                                color="primary" 
                              />
                            )}
                          </Box>
                        }
                        secondary={
                          <>
                            <Typography variant="body2" component="div">
                              <strong>Address:</strong> {restaurant.address}
                            </Typography>
                            <Typography variant="body2" component="div" sx={{ mt: 1 }}>
                              <strong>Hours:</strong> {restaurant.hours || "Hours not available"}
                            </Typography>
                            {restaurant.website && (
                              <Link
                                href={restaurant.website}
                                target="_blank"
                                rel="noopener"
                                sx={{ mt: 1, display: "block" }}
                              >
                                Visit Website
                              </Link>
                            )}
                          </>
                        }
                      />
                    </ListItem>
                  ))}
                </List>
              ) : !loadingRestaurants && !restaurantError ? (
                <Typography>No restaurants found in this area.</Typography>
              ) : null}
            </>
          )}
          {activeTab === 2 && (
            <>
              <Typography variant="h6" sx={{ mb: 2 }}>
                Sports Events Near {address || "Your Location"}
              </Typography>
              
              {loadingSportsEvents && (
                <Box display="flex" justifyContent="center" my={3}>
                  <CircularProgress />
                </Box>
              )}
              
              {sportsError && !loadingSportsEvents && (
                <Box display="flex" alignItems="center" sx={{ my: 2 }}>
                  <Typography color="error">
                    {sportsError}
                  </Typography>
                </Box>
              )}
              
              {sportsEvents.length > 0 ? (
                <List>
                  {sportsEvents.map((event, index) => (
                    <ListItem key={index} divider>
                      <ListItemText
                        primary={
                          <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                            <Typography variant="h6" component="span">
                              {event.title}
                            </Typography>
                            {event.date && (
                              <Chip 
                                size="small" 
                                label={event.date} 
                                color="secondary" 
                              />
                            )}
                          </Box>
                        }
                        secondary={
                          <>
                            <Typography variant="body2" component="div">
                              <strong>Venue:</strong> {event.venue}
                            </Typography>
                            <Typography variant="body2" component="div" sx={{ mt: 1 }}>
                              <strong>Time:</strong> {event.time}
                            </Typography>
                            {event.address && event.address.length > 0 && (
                              <Typography variant="body2" component="div" sx={{ mt: 1 }}>
                                <strong>Address:</strong> {event.address.join(', ')}
                              </Typography>
                            )}
                            {event.location && (
                              <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
                                <strong>Location:</strong> {event.location.lat.toFixed(6)}, {event.location.lng.toFixed(6)}
                              </Typography>
                            )}
                            {event.link && (
                              <Link
                                href={event.link}
                                target="_blank"
                                rel="noopener"
                                sx={{ mt: 1, display: "block" }}
                              >
                                More Info
                              </Link>
                            )}
                          </>
                        }
                      />
                    </ListItem>
                  ))}
                </List>
              ) : !loadingSportsEvents && !sportsError ? (
                <Typography>No sports events found in this area.</Typography>
              ) : null}
            </>
          )}
          {activeTab === 3 && (
            <>
              <Typography variant="h6" sx={{ mb: 2 }}>
                Music Events & Concerts Near {address || "Your Location"}
              </Typography>
              
              {loadingMusicEvents && (
                <Box display="flex" justifyContent="center" my={3}>
                  <CircularProgress />
                </Box>
              )}
              
              {musicError && !loadingMusicEvents && (
                <Box display="flex" alignItems="center" sx={{ my: 2 }}>
                  <Typography color="error">
                    {musicError}
                  </Typography>
                </Box>
              )}
              
              {musicEvents.length > 0 ? (
                <List>
                  {musicEvents.map((event, index) => (
                    <ListItem key={index} divider>
                      <ListItemText
                        primary={
                          <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                            <Typography variant="h6" component="span">
                              {event.title}
                            </Typography>
                            {event.date && (
                              <Chip 
                                size="small" 
                                label={event.date} 
                                color="secondary" 
                              />
                            )}
                            {event.genre && (
                              <Chip 
                                size="small" 
                                label={event.genre} 
                                color="primary"
                                variant="outlined" 
                              />
                            )}
                          </Box>
                        }
                        secondary={
                          <>
                            <Typography variant="body2" component="div">
                              <strong>Venue:</strong> {event.venue}
                            </Typography>
                            <Typography variant="body2" component="div" sx={{ mt: 1 }}>
                              <strong>Time:</strong> {event.time}
                            </Typography>
                            {event.performers && event.performers.length > 0 && (
                              <Typography variant="body2" component="div" sx={{ mt: 1 }}>
                                <strong>Performers:</strong> {event.performers.join(', ')}
                              </Typography>
                            )}
                            {event.address && event.address.length > 0 && (
                              <Typography variant="body2" component="div" sx={{ mt: 1 }}>
                                <strong>Address:</strong> {event.address.join(', ')}
                              </Typography>
                            )}
                            {event.location && (
                              <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
                                <strong>Location:</strong> {event.location.lat.toFixed(6)}, {event.location.lng.toFixed(6)}
                              </Typography>
                            )}
                            {event.link && (
                              <Link
                                href={event.link}
                                target="_blank"
                                rel="noopener"
                                sx={{ mt: 1, display: "block" }}
                              >
                                Tickets & Info
                              </Link>
                            )}
                          </>
                        }
                      />
                    </ListItem>
                  ))}
                </List>
              ) : !loadingMusicEvents && !musicError ? (
                <Typography>No music events found in this area.</Typography>
              ) : null}
            </>
          )}
          {activeTab === 4 && (
            <>
              <Typography variant="h6" sx={{ mb: 2 }}>
                AI Recommendations for {address || "Your Location"}
              </Typography>
              
              {loadingRecommendations && (
                <Box display="flex" flexDirection="column" alignItems="center" my={3}>
                  <CircularProgress />
                  <Typography sx={{ mt: 2 }}>
                    Analyzing location and weather to generate personalized recommendations...
                  </Typography>
                </Box>
              )}
              
              {recommendationsError && !loadingRecommendations && (
                <Alert severity="error" sx={{ mb: 2 }}>
                  {recommendationsError}
                </Alert>
              )}
              
              {!loadingRecommendations && !recommendationsError && recommendations && (
                <>
                  <Paper elevation={0} sx={{ p: 2, mb: 3, bgcolor: 'background.default' }}>
                    <Typography variant="body1">
                      {recommendations.explanation || "Here are your personalized recommendations based on location and weather."}
                    </Typography>
                  </Paper>
                  
                  <Typography variant="h6" sx={{ mt: 3, mb: 1 }}>
                    Recommended Restaurants
                  </Typography>
                  <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 2, mb: 3 }}>
                    {recommendations.restaurants.map((recommendation, index) => (
                      <Card key={`restaurant-${index}`} sx={{ minWidth: '30%', flex: 1 }}>
                        <CardContent>
                          <Typography variant="h6" component="div">
                            {recommendation}
                          </Typography>
                          <Typography variant="body2" color="text.secondary">
                            {restaurants.find(r => r.name === recommendation)?.address || ''}
                          </Typography>
                        </CardContent>
                      </Card>
                    ))}
                  </Box>
                  
                  <Typography variant="h6" sx={{ mt: 3, mb: 1 }}>
                    Recommended Sports Events
                  </Typography>
                  <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 2, mb: 3 }}>
                    {recommendations.sportsEvents.map((recommendation, index) => (
                      <Card key={`sports-${index}`} sx={{ minWidth: '30%', flex: 1 }}>
                        <CardContent>
                          <Typography variant="h6" component="div">
                            {recommendation}
                          </Typography>
                          <Typography variant="body2" color="text.secondary">
                            {sportsEvents.find(e => e.title === recommendation)?.venue || ''} - 
                            {sportsEvents.find(e => e.title === recommendation)?.time || ''}
                          </Typography>
                        </CardContent>
                      </Card>
                    ))}
                  </Box>
                  
                  <Typography variant="h6" sx={{ mt: 3, mb: 1 }}>
                    Recommended Music Events
                  </Typography>
                  <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 2, mb: 3 }}>
                    {recommendations.musicEvents.map((recommendation, index) => (
                      <Card key={`music-${index}`} sx={{ minWidth: '30%', flex: 1 }}>
                        <CardContent>
                          <Typography variant="h6" component="div">
                            {recommendation}
                          </Typography>
                          <Typography variant="body2" color="text.secondary">
                            {musicEvents.find(e => e.title === recommendation)?.venue || ''} - 
                            {musicEvents.find(e => e.title === recommendation)?.time || ''}
                          </Typography>
                          {musicEvents.find(e => e.title === recommendation)?.genre && (
                            <Typography variant="body2" color="text.secondary">
                              Genre: {musicEvents.find(e => e.title === recommendation)?.genre}
                            </Typography>
                          )}
                        </CardContent>
                      </Card>
                    ))}
                  </Box>
                  
                  <Box sx={{ mt: 3, display: 'flex', justifyContent: 'center' }}>
                    <Button 
                      variant="contained" 
                      color="primary"
                      startIcon={<RefreshIcon />}
                      onClick={generateRecommendations}
                      disabled={loadingRecommendations}
                    >
                      Refresh Recommendations
                    </Button>
                  </Box>
                </>
              )}
            </>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={handleClose}>Close</Button>
        </DialogActions>
      </Dialog>
    </>
  );
};

export default LocationButton;