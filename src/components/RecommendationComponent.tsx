import React, { useState } from "react";
import {
  Box,
  Button,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Typography,
  CircularProgress,
} from "@mui/material";
import GoogleMapReact from "google-map-react";
import CssBaseline from "@mui/material/CssBaseline";
import Container from "@mui/material/Container";
import { ThemeProvider } from "@mui/material/styles";
import Header from "./Header";
import Footer from "./Footer";

const RecommendationComponent = () => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [openModal, setOpenModal] = useState(false);
  const [userLocation, setUserLocation] = useState(null);
  const [recommendations, setRecommendations] = useState(null);

  // Fetch user's current location
  const getUserLocation = async () => {
    return new Promise((resolve, reject) => {
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
        console.error("Geolocation is not supported by this browser.");
        reject(new Error("Geolocation not supported"));
      }
    });
  };

  // Fetch recommendations using OpenAI
  const fetchRecommendations = async (location) => {
    const OPENAI_API_KEY =
      "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";

    const prompt = `
      I'm at latitude ${location.lat}, longitude ${location.lng}.
      Recommend:
      - 3 restaurants (with a short description each)
      - 3 musical events or concerts (with a short description each)
      - 3 sports events (with a short description each)
    `;

    const response = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${OPENAI_API_KEY}`,
      },
      body: JSON.stringify({
        model: "gpt-3.5-turbo",
        messages: [
          { role: "system", content: "You are a helpful assistant." },
          { role: "user", content: prompt },
        ],
        max_tokens: 400,
        temperature: 0.7,
      }),
    });

    if (!response.ok) {
      throw new Error("Failed to fetch recommendations.");
    }

    const data = await response.json();
    return JSON.parse(data.choices[0].message.content);
  };

  // Handle fetching recommendations
  const handleFetchRecommendations = async () => {
    try {
      setLoading(true);
      setError(null);

      // Step 1: Fetch user's location
      const location = await getUserLocation();
      setUserLocation(location);

      // Step 2: Fetch recommendations
      const recommendations = await fetchRecommendations(location);
      setRecommendations(recommendations);

      // Step 3: Open the modal
      setOpenModal(true);
    } catch (error) {
      console.error("Error fetching recommendations:", error);
      setError(error.message || "Failed to fetch recommendations.");
    } finally {
      setLoading(false);
    }
  };

  // Render markers on Google Map
  const renderMarkers = (map, maps) => {
    if (!userLocation || !recommendations) return;

    // Add user location marker
    new maps.Marker({
      position: userLocation,
      map,
      title: "Your Location",
      icon: "http://maps.google.com/mapfiles/ms/icons/green-dot.png",
    });

    // Add restaurant markers
    recommendations.restaurants.forEach((restaurant) => {
      new maps.Marker({
        position: { lat: restaurant.lat, lng: restaurant.lng },
        map,
        title: restaurant.name,
        icon: "http://maps.google.com/mapfiles/ms/icons/red-dot.png",
      });
    });

    // Add musical event markers
    recommendations.musicalEvents.forEach((event) => {
      new maps.Marker({
        position: { lat: event.lat, lng: event.lng },
        map,
        title: event.name,
        icon: "http://maps.google.com/mapfiles/ms/icons/blue-dot.png",
      });
    });

    // Add sports event markers
    recommendations.sportsEvents.forEach((event) => {
      new maps.Marker({
        position: { lat: event.lat, lng: event.lng },
        map,
        title: event.name,
        icon: "http://maps.google.com/mapfiles/ms/icons/yellow-dot.png",
      });
    });
  };

  return (
    <Box>
      {/* Button to fetch recommendations */}
      <Button
        variant="contained"
        color="secondary"
        onClick={handleFetchRecommendations}
        disabled={loading}
        sx={{ position: "absolute", top: 16, right: 16 }}
      >
        {loading ? <CircularProgress size={20} /> : "Recommended For You"}
      </Button>

      {/* Error message */}
      {error && (
        <Typography color="error" sx={{ mt: 2 }}>
          {error}
        </Typography>
      )}

      {/* Recommendation Modal */}
      <Dialog
        open={openModal}
        onClose={() => setOpenModal(false)}
        maxWidth="lg"
        fullWidth
      >
        <DialogTitle>Recommended For You</DialogTitle>
        <DialogContent>
          <Box sx={{ height: "400px", width: "100%" }}>
            <GoogleMapReact
              bootstrapURLKeys={{ key: "AIzaSyA6_MQyYuTqgCx91FUEmaU39lcoTqMDtzI" }}
              defaultCenter={userLocation || { lat: 37.7749, lng: -122.4194 }}
              defaultZoom={12}
              yesIWantToUseGoogleMapApiInternals
              onGoogleApiLoaded={({ map, maps }) => renderMarkers(map, maps)}
            />
          </Box>
          <Box mt={2}>
            <Typography variant="h6">Recommendations</Typography>
            <Typography variant="subtitle1">Restaurants:</Typography>
            <ul>
              {recommendations?.restaurants.map((r, index) => (
                <li key={index}>{r.name}</li>
              ))}
            </ul>
            <Typography variant="subtitle1">Musical Events:</Typography>
            <ul>
              {recommendations?.musicalEvents.map((e, index) => (
                <li key={index}>{e.name}</li>
              ))}
            </ul>
            <Typography variant="subtitle1">Sports Events:</Typography>
            <ul>
              {recommendations?.sportsEvents.map((e, index) => (
                <li key={index}>{e.name}</li>
              ))}
            </ul>
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpenModal(false)}>Close</Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

const Blog = () => {
  return (
    <ThemeProvider theme={defaultTheme}>
      <CssBaseline />
      <Container maxWidth="lg">
        <Header
          title="Blog"
          sections={sections}
          auth={auth}
          onLogin={() => handleOpenAuth("login")}
          onSignUp={() => handleOpenAuth("signup")}
          onLogout={handleLogout}
          onSectionClick={(url) => scrollToSection(url.replace("#", ""))}
          onSubscribe={handleSubscribe}
          onUnsubscribe={handleUnsubscribe}
          userSubscriptions={auth.isAuthenticated ? subscriptions[auth.user.id] || [] : []}
          onSearchClick={handleOpenSearchModal}
        />

        {/* Add the RecommendationComponent */}
        <RecommendationComponent sx={{ position: "absolute", top: 16, right: 16 }} />

        <main>
          {/* Your existing blog content */}
        </main>
      </Container>
      <Footer title="Footer" description="Something here to give the footer a purpose!" />
    </ThemeProvider>
  );
};

export default Blog;