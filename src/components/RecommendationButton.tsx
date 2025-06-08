import React, { useState, useCallback, useEffect } from "react";
import {
  Box,
  Button,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Typography,
  CircularProgress,
  Alert,
} from "@mui/material";
import LocationOnIcon from "@mui/icons-material/LocationOn";
import { GoogleMap, Marker, useLoadScript } from "@react-google-maps/api";

// Replace with your actual API key - make sure it has the correct APIs enabled
const GOOGLE_MAPS_API_KEY = "AIzaSyA6_MQyYuTqgCx91FUEmaU39lcoTqMDtzI";

// Map container style
const mapContainerStyle = {
  width: "100%",
  height: "100%",
};

// Map options
const mapOptions = {
  streetViewControl: false,
  mapTypeControl: true,
  fullscreenControl: false,
  zoomControl: true,
};

// Define libraries as a static constant to avoid recreation on each render
const libraries = ["places"];

const LocationFinder = () => {
  const [openModal, setOpenModal] = useState(false);
  const [userLocation, setUserLocation] = useState(null);
  const [locationName, setLocationName] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [mapLoaded, setMapLoaded] = useState(false);

  // Load Google Maps scripts
  const { isLoaded, loadError } = useLoadScript({
    googleMapsApiKey: GOOGLE_MAPS_API_KEY,
    libraries,
  });

  const reverseGeocode = async (lat, lng) => {
    try {
      const response = await fetch(
        `https://maps.googleapis.com/maps/api/geocode/json?latlng=${lat},${lng}&key=${GOOGLE_MAPS_API_KEY}`
      );
      const data = await response.json();
      
      if (data.status === "REQUEST_DENIED") {
        console.error("Geocoding API request denied:", data.error_message);
        return "Location found (address lookup failed)";
      }
      
      if (data.results && data.results.length > 0) {
        return data.results[0].formatted_address;
      }
      return "Your current location";
    } catch (err) {
      console.error("Reverse geocoding error:", err);
      return "Your current location";
    }
  };

  const handleFetchLocation = async () => {
    if (!navigator.geolocation) {
      setError("Geolocation is not supported by your browser");
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const position = await new Promise((resolve, reject) => {
        navigator.geolocation.getCurrentPosition(
          resolve,
          reject,
          {
            enableHighAccuracy: true,
            timeout: 10000,
            maximumAge: 0
          }
        );
      });

      const { latitude, longitude } = position.coords;
      console.log("Got location:", latitude, longitude);
      
      setUserLocation({ lat: latitude, lng: longitude });
      
      // Get address
      const address = await reverseGeocode(latitude, longitude);
      setLocationName(address);
      
      // Open modal after location is set
      setOpenModal(true);
    } catch (err) {
      console.error("Geolocation error:", err);
      setError(err.message || "Failed to get your location. Please ensure location permissions are granted.");
    } finally {
      setLoading(false);
    }
  };

  // Callback when map loads
  const onMapLoad = useCallback((map) => {
    console.log("Map loaded successfully");
    setMapLoaded(true);
  }, []);

  // Log when map is ready to render
  useEffect(() => {
    if (isLoaded) {
      console.log("Google Maps scripts loaded successfully");
    }
  }, [isLoaded]);

  // Default coordinates (used as fallback)
  const defaultLocation = { lat: 40.7128, lng: -74.006 }; // NYC
  
  return (
    <Box sx={{ p: 2 }}>
      <Button
        variant="contained"
        color="primary"
        onClick={handleFetchLocation}
        disabled={loading}
        startIcon={<LocationOnIcon />}
        sx={{ mb: 2 }}
      >
        {loading ? (
          <>
            <CircularProgress size={20} sx={{ mr: 1 }} />
            Locating...
          </>
        ) : (
          "Find My Location"
        )}
      </Button>

      {error && (
        <Alert severity="error" sx={{ mb: 2 }}>
          {error}
        </Alert>
      )}

      {loadError && (
        <Alert severity="error" sx={{ mb: 2 }}>
          Failed to load Google Maps: {loadError?.message}
        </Alert>
      )}

      <Dialog 
        open={openModal} 
        onClose={() => setOpenModal(false)} 
        maxWidth="md"
        fullWidth
      >
        <DialogTitle>Your Current Location</DialogTitle>
        <DialogContent dividers>
          {isLoaded ? (
            <Box sx={{ height: "400px", position: "relative" }}>
              <GoogleMap
                mapContainerStyle={mapContainerStyle}
                center={userLocation || defaultLocation}
                zoom={15}
                options={mapOptions}
                onLoad={onMapLoad}
              >
                {userLocation && (
                  <Marker
                    position={userLocation}
                    title="Your current location"
                    // Using a standard Google Maps marker icon
                    icon={{
                      url: "https://maps.google.com/mapfiles/ms/icons/blue-dot.png",
                      scaledSize: new window.google.maps.Size(40, 40)
                    }}
                  />
                )}
              </GoogleMap>
              {userLocation && (
                <Box
                  sx={{
                    position: "absolute",
                    bottom: 10,
                    left: 10,
                    backgroundColor: "white",
                    padding: "8px",
                    borderRadius: "4px",
                    boxShadow: 3,
                    zIndex: 1,
                    maxWidth: "80%",
                  }}
                >
                  <Typography variant="subtitle1" component="div">
                    <strong>Address:</strong> {locationName}
                  </Typography>
                  <Typography variant="body2" component="div">
                    <strong>Coordinates:</strong> {userLocation.lat.toFixed(6)}, {userLocation.lng.toFixed(6)}
                  </Typography>
                </Box>
              )}
            </Box>
          ) : (
            <Box sx={{ height: "400px", display: "flex", alignItems: "center", justifyContent: "center" }}>
              <CircularProgress />
              <Typography variant="body1" sx={{ ml: 2 }}>
                {loadError ? "Failed to load maps" : "Loading Google Maps..."}
              </Typography>
            </Box>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpenModal(false)}>Close</Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default LocationFinder;