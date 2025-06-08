import React, { useState, useEffect } from 'react';
import { 
  Box, 
  Typography, 
  CircularProgress, 
  Paper,
  Chip
} from '@mui/material';
import WbSunnyIcon from '@mui/icons-material/WbSunny';
import AcUnitIcon from '@mui/icons-material/AcUnit';
import CloudIcon from '@mui/icons-material/Cloud';
import GrainIcon from '@mui/icons-material/Grain';
import UmbrellaIcon from '@mui/icons-material/Umbrella';
import ThunderstormIcon from '@mui/icons-material/Thunderstorm';

interface WeatherDisplayProps {
  location: { lat: number; lng: number } | null;
  cityName?: string;
}

interface WeatherData {
  main: {
    temp: number;
    feels_like: number;
    humidity: number;
    pressure?: number;
  };
  weather: Array<{
    description: string;
    icon: string;
    main?: string;
  }>;
  wind: {
    speed: number;
  };
  name?: string;
}

const WeatherDisplay: React.FC<WeatherDisplayProps> = ({ location, cityName }) => {
  const [weather, setWeather] = useState<WeatherData | null>(null);
  const [loadingWeather, setLoadingWeather] = useState<boolean>(false);
  const [weatherError, setWeatherError] = useState<string | null>(null);

  useEffect(() => {
    if (location) {
      fetchWeather(location.lat, location.lng);
    }
  }, [location]);

  // Generate sample weather data for demo purposes
  const generateSampleWeather = (): WeatherData => {
    const conditions = [
      { temp: 22, feels_like: 24, humidity: 60, wind_speed: 10, description: "Sunny", icon: "01d", main: "Clear" },
      { temp: 18, feels_like: 17, humidity: 70, wind_speed: 15, description: "Partly cloudy", icon: "02d", main: "Clouds" },
      { temp: 15, feels_like: 14, humidity: 80, wind_speed: 20, description: "Cloudy", icon: "03d", main: "Clouds" },
      { temp: 10, feels_like: 8, humidity: 75, wind_speed: 25, description: "Light rain", icon: "10d", main: "Rain" },
      { temp: 5, feels_like: 2, humidity: 85, wind_speed: 30, description: "Snow", icon: "13d", main: "Snow" },
      { temp: 12, feels_like: 9, humidity: 78, wind_speed: 28, description: "Thunderstorm", icon: "11d", main: "Thunderstorm" },
    ];
    
    const randomCondition = conditions[Math.floor(Math.random() * conditions.length)];
    
    return {
      main: {
        temp: randomCondition.temp,
        feels_like: randomCondition.feels_like,
        humidity: randomCondition.humidity,
        pressure: 1013
      },
      weather: [
        { 
          description: randomCondition.description,
          icon: randomCondition.icon,
          main: randomCondition.main
        }
      ],
      wind: {
        speed: randomCondition.wind_speed / 3.6 // Convert to m/s
      },
      name: cityName || "Your Location"
    };
  };

  const fetchWeather = async (lat: number, lng: number) => {
    try {
      setLoadingWeather(true);
      setWeatherError(null);
      
      // Replace with your OpenWeatherMap API key
      const WEATHER_API_KEY = "4673ed0222740b7fe90ac7e6580203db";
      
      if (WEATHER_API_KEY === "YOUR_OPENWEATHER_API_KEY") {
        // If no API key is provided, use sample data
        setTimeout(() => {
          setWeather(generateSampleWeather());
          setLoadingWeather(false);
        }, 1000); // Simulate API delay
        return;
      }
      
      const url = `https://api.openweathermap.org/data/2.5/weather?lat=${lat}&lon=${lng}&units=metric&appid=${WEATHER_API_KEY}`;
      
      const response = await fetch(url);
      if (!response.ok) {
        throw new Error(`Failed to fetch weather: ${response.status}`);
      }
      
      const data = await response.json();
      setWeather(data);
    } catch (err: any) {
      console.error("Error fetching weather:", err);
      setWeatherError(err.message || "Failed to fetch weather");
      
      // Fallback to sample data
      setWeather(generateSampleWeather());
    } finally {
      setLoadingWeather(false);
    }
  };

  const getWeatherIcon = (iconCode: string) => {
    if (!iconCode) return <CloudIcon />;
    
    // First two characters of icon code determine weather type
    const weatherType = iconCode.substring(0, 2);
    
    switch (weatherType) {
      case '01': // Clear sky
        return <WbSunnyIcon sx={{ color: '#FFD700' }} />;
      case '02': // Few clouds
      case '03': // Scattered clouds
      case '04': // Broken/overcast clouds
        return <CloudIcon sx={{ color: '#A9A9A9' }} />;
      case '09': // Shower rain
      case '10': // Rain
        return <UmbrellaIcon sx={{ color: '#4682B4' }} />;
      case '11': // Thunderstorm
        return <ThunderstormIcon sx={{ color: '#4B0082' }} />;
      case '13': // Snow
        return <AcUnitIcon sx={{ color: '#E0FFFF' }} />;
      case '50': // Mist, fog, etc
        return <GrainIcon sx={{ color: '#D3D3D3' }} />;
      default:
        return <CloudIcon />;
    }
  };

  const getWeatherColor = (temp: number) => {
    if (temp > 30) return '#FF5722'; // Hot (orange/red)
    if (temp > 20) return '#FF9800'; // Warm (orange)
    if (temp > 10) return '#4CAF50'; // Mild (green)
    if (temp > 0) return '#2196F3';  // Cool (blue)
    return '#9C27B0';               // Cold (purple)
  };

  return (
    <Paper elevation={2} sx={{ p: 2, borderRadius: 2, bgcolor: 'rgba(255,255,255,0.9)' }}>
      <Typography variant="h6" gutterBottom>
        Current Weather
      </Typography>
      
      {loadingWeather && (
        <Box display="flex" alignItems="center" justifyContent="center" py={2}>
          <CircularProgress size={40} />
          <Typography ml={2}>Loading weather data...</Typography>
        </Box>
      )}
      
      {weatherError && !loadingWeather && (
        <Typography color="error" py={1}>
          {weatherError}
        </Typography>
      )}
      
      {weather && !loadingWeather && (
        <>
          <Box display="flex" alignItems="center" justifyContent="space-between" mb={2}>
            <Box>
              <Typography 
                variant="h3" 
                sx={{
                  fontWeight: 'bold',
                  color: getWeatherColor(weather.main.temp)
                }}
              >
                {Math.round(weather.main.temp)}°C
              </Typography>
              <Typography 
                variant="subtitle1" 
                textTransform="capitalize" 
                fontWeight="medium"
              >
                {weather.weather[0]?.description}
              </Typography>
            </Box>
            
            <Box sx={{ fontSize: 64 }}>
              {weather.weather[0]?.icon ? 
                getWeatherIcon(weather.weather[0].icon) :
                <img 
                  src={`http://openweathermap.org/img/wn/${weather.weather[0]?.icon || '01d'}@2x.png`} 
                  alt={weather.weather[0]?.description || 'weather'} 
                  style={{ width: 80, height: 80 }}
                />
              }
            </Box>
          </Box>
          
          <Box display="flex" flexWrap="wrap" gap={1} mt={2}>
            <Chip 
              icon={<span role="img" aria-label="temperature">🌡️</span>}
              label={`Feels Like: ${Math.round(weather.main.feels_like)}°C`} 
              size="small"
            />
            <Chip 
              icon={<span role="img" aria-label="humidity">💧</span>}
              label={`Humidity: ${weather.main.humidity}%`} 
              size="small"
            />
            <Chip 
              icon={<span role="img" aria-label="wind">💨</span>}
              label={`Wind: ${Math.round(weather.wind.speed * 3.6)} km/h`} 
              size="small"
            />
          </Box>
        </>
      )}
    </Paper>
  );
};

export default WeatherDisplay;