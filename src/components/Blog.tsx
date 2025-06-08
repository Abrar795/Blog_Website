import * as React from "react";
import CssBaseline from "@mui/material/CssBaseline";
import Container from "@mui/material/Container";
import { Box, Typography, List, ListItem, ListItemText, Button, CircularProgress, TextField, InputAdornment, IconButton, Dialog, DialogTitle, DialogContent, DialogActions, FormControlLabel, Radio, Switch } from "@mui/material";
import { createTheme, ThemeProvider } from "@mui/material/styles";
import Header from "./Header";
import Footer from "./Footer";
import AuthModal from "./AuthModal";
import CreatePostModal from "./CreatePostModal.tsx";
import DeletePostModal from "./DeletePostModal.tsx";
import CategorySection from "./CategorySection.tsx";
import NotificationSystem from "./NotificationSystem.tsx";
import ActivityRecommendation from "./ActivityRecommendation.tsx";
import RecommendationButton from "./RecommendationButton.tsx"; // Import the RecommendationButton component
import LocationButton from "./LocationButton.tsx"; // Add this import
// Import the ElasticSearch API utilities
import { fetchAllPosts, createPost, deletePost, searchPosts } from "../utils/elasticsearchApi";
import SearchIcon from "@mui/icons-material/Search";
import ClearIcon from '@mui/icons-material/Clear';
import CloseIcon from '@mui/icons-material/Close';
import GoogleMapReact from "google-map-react";

const sections = [
  { title: "Academic Resources", url: "#academic-resources" },
  { title: "Career Services", url: "#career-services" },
  { title: "Campus", url: "#campus" },
  { title: "Culture", url: "#culture" },
  { title: "Local Community Resources", url: "#local-community-resources" },
  { title: "Social", url: "#social" },
  { title: "Sports", url: "#sports" },
  { title: "Health and Wellness", url: "#health-and-wellness" },
  { title: "Technology", url: "#technology" },
  { title: "Travel", url: "#travel" },
  { title: "Alumni", url: "#alumni" },
];

const defaultTheme = createTheme();

export default function Blog() {
  const [openAuth, setOpenAuth] = React.useState(false);
  const [authType, setAuthType] = React.useState("login");
  const [auth, setAuth] = React.useState({ isAuthenticated: false, user: null });
  const [openCreatePost, setOpenCreatePost] = React.useState(false);
  const [openDeletePost, setOpenDeletePost] = React.useState(false);
  const [postsByCategory, setPostsByCategory] = React.useState({});
  const [formData, setFormData] = React.useState({
    title: "",
    description: "",
    content: "",
    category: "",
  });
  const [deleteCategory, setDeleteCategory] = React.useState("");
  const [replyData, setReplyData] = React.useState({});
  const [replyContent, setReplyContent] = React.useState("");
  const [replyVisibility, setReplyVisibility] = React.useState({});
  const [subscriptions, setSubscriptions] = React.useState({}); // Track subscriptions
  const [notifications, setNotifications] = React.useState({}); // Add notifications state
  const [loading, setLoading] = React.useState(false); // Add loading state
  const [error, setError] = React.useState(null); // Add error state
  const [searchQuery, setSearchQuery] = React.useState("");
  const [isSearching, setIsSearching] = React.useState(false);
  const [activePostId, setActivePostId] = React.useState(null);
  const [searchModalOpen, setSearchModalOpen] = React.useState(false);
  const [searchType, setSearchType] = React.useState("all"); // "all" or "title"
  const [useOpenAI, setUseOpenAI] = React.useState(false); // Add OpenAI toggle state
  const [openRecommendationModal, setOpenRecommendationModal] = React.useState(false); // Modal state
  const [recommendations, setRecommendations] = React.useState(null); // Store fetched recommendations
  const [userLocation, setUserLocation] = React.useState(null); // Store user's current location

  // Load posts from ElasticSearch on component mount
  React.useEffect(() => {
    const loadAllPosts = async () => {
      try {
        setLoading(true);
        setError(null);
        
        const posts = await fetchAllPosts();
        
        // Organize posts by category
        const organizedPosts = {};
        posts.forEach(post => {
          if (!organizedPosts[post.category]) {
            organizedPosts[post.category] = [];
          }
          organizedPosts[post.category].push(post);
        });
        
        setPostsByCategory(organizedPosts);
      } catch (err) {
        console.error("Failed to load posts:", err);
        setError(err.message || "Failed to load posts");
      } finally {
        setLoading(false);
      }
    };
    
    loadAllPosts();
  }, []);

  // Add this useEffect to get the user's location when the component mounts
  React.useEffect(() => {
    const fetchUserLocation = async () => {
      try {
        const location = await getUserLocation();
        setUserLocation(location);
      } catch (error) {
        console.error("Error getting user location:", error);
      }
    };
    
    fetchUserLocation();
  }, []);

  // Helper functions for posts
  const getAllPosts = (postsByCategory) => {
    return Object.values(postsByCategory).flat();
  };

  const getRandomPost = (allPosts) => {
    if (allPosts.length === 0) return null;
    const randomIndex = Math.floor(Math.random() * allPosts.length);
    return allPosts[randomIndex];
  };

  const getFeaturedPosts = (allPosts, count) => {
    return allPosts.slice(0, count);
  };

  // Add a notification
  const addNotification = (userId, category, action, message) => {
    const newNotification = {
      id: Date.now(),
      category,
      action,
      message,
      read: false,
      timestamp: new Date().toISOString(),
    };

    setNotifications((prev) => {
      const userNotifications = prev[userId] || [];
      return {
        ...prev,
        [userId]: [newNotification, ...userNotifications],
      };
    });
  };

  // Mark notification as read
  const markNotificationAsRead = (notificationId) => {
    if (!auth.isAuthenticated || !auth.user) return;

    if (notificationId === "all") {
      // Mark all notifications as read
      setNotifications((prev) => {
        const userNotifications = prev[auth.user.id] || [];
        return {
          ...prev,
          [auth.user.id]: userNotifications.map((n) => ({ ...n, read: true })),
        }; // Add semicolon here
      });
    } else {
      // Mark specific notification as read
      setNotifications((prev) => {
        const userNotifications = prev[auth.user.id] || [];
        return {
          ...prev,
          [auth.user.id]: userNotifications.map((n) =>
            n.id === notificationId ? { ...n, read: true } : n
          ),
        }; // Add semicolon here
      });
    }
  };

  // Helper function to save subscriptions to localStorage
  const saveSubscriptionsToLocalStorage = (userId, subscriptions) => {
    localStorage.setItem(`subscriptions_${userId}`, JSON.stringify(subscriptions));
  };

  // Helper function to load subscriptions from localStorage
  const loadSubscriptionsFromLocalStorage = (userId) => {
    const subscriptions = localStorage.getItem(`subscriptions_${userId}`);
    return subscriptions ? JSON.parse(subscriptions) : [];
  };

  // Handle subscription to a category
  const handleSubscribe = (category) => {
    if (!auth.isAuthenticated) {
      handleOpenAuth("login"); // Prompt login if not authenticated
      return;
    }

    setSubscriptions((prevSubscriptions) => {
      const userSubscriptions = prevSubscriptions[auth.user.id] || [];
      if (!userSubscriptions.includes(category)) {
        // Add user to notification when they subscribe
        addNotification(
          auth.user.id,
          category,
          "Subscribed",
          `You are now subscribed to ${category}`
        );

        // Save updated subscriptions to localStorage
        saveSubscriptionsToLocalStorage(auth.user.id, [...userSubscriptions, category]);

        return {
          ...prevSubscriptions,
          [auth.user.id]: [...userSubscriptions, category],
        };
      }
      return prevSubscriptions;
    });
  };

  // Handle unsubscription from a category
  const handleUnsubscribe = (category) => {
    if (!auth.isAuthenticated) {
      handleOpenAuth("login"); // Prompt login if not authenticated
      return;
    }

    setSubscriptions((prevSubscriptions) => {
      const userSubscriptions = prevSubscriptions[auth.user.id] || [];

      // Add notification when user unsubscribes
      addNotification(
        auth.user.id,
        category,
        "Unsubscribed",
        `You have unsubscribed from ${category}`
      );

      // Save updated subscriptions to localStorage
      saveSubscriptionsToLocalStorage(
        auth.user.id,
        userSubscriptions.filter((cat) => cat !== category)
      );

      return {
        ...prevSubscriptions,
        [auth.user.id]: userSubscriptions.filter((cat) => cat !== category),
      };
    });
  };

  // Load subscriptions when user logs in
  React.useEffect(() => {
    if (auth.isAuthenticated && auth.user) {
      const userSubscriptions = loadSubscriptionsFromLocalStorage(auth.user.id);
      setSubscriptions((prevSubscriptions) => ({
        ...prevSubscriptions,
        [auth.user.id]: userSubscriptions,
      }));
    }
  }, [auth.isAuthenticated, auth.user]);

  // Notify subscribers when a new post is created or deleted
  const notifySubscribers = (category, action, message) => {
    Object.keys(subscriptions).forEach((userId) => {
      const userSubscriptions = subscriptions[userId] || [];
      if (userSubscriptions.includes(category) && userId !== auth.user?.id) {
        // Don't notify the user who created or deleted the post
        addNotification(userId, category, action, message);
      }
    });
  };

  const handleOpenAuth = (type) => {
    setAuthType(type);
    setOpenAuth(true);
  };

  const handleCloseAuth = () => {
    setOpenAuth(false);
  };

  const handleLogin = (user) => {
    setAuth({ isAuthenticated: true, user });
    setOpenAuth(false);
  };

  const handleLogout = () => {
    setAuth({ isAuthenticated: false, user: null });
  };

  const handleOpenCreatePost = () => {
    setOpenCreatePost(true);
  };

  const handleCloseCreatePost = () => {
    setOpenCreatePost(false);
  };

  const handleOpenDeletePost = () => {
    setOpenDeletePost(true);
  };

  const handleCloseDeletePost = () => {
    setOpenDeletePost(false);
  };

  const handleOpenSearchModal = () => {
    setSearchModalOpen(true);
  };

  const handleCloseSearchModal = () => {
    setSearchModalOpen(false);
  };

  // Store post in ElasticSearch
  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      setLoading(true);
      
      const newPost = {
        ...formData,
        date: new Date().toISOString(),
        id: Date.now().toString(), // Convert to string for Elasticsearch
        author: auth.user ? auth.user.fullName : "Anonymous",
      };
      
      // Store post in ElasticSearch
      const response = await createPost(newPost);
      console.log('Post stored in ElasticSearch:', response);
      
      // Update local state
      setPostsByCategory((prevPostsByCategory) => {
        const categoryPosts = prevPostsByCategory[formData.category] || [];
        return {
          ...prevPostsByCategory,
          [formData.category]: [newPost, ...categoryPosts],
        };
      });

      // Notify subscribers of the new post
      notifySubscribers(
        formData.category,
        "New Post",
        `"${formData.title}" by ${auth.user?.fullName || "Anonymous"}`
      );

      // Reset form and close modal
      setFormData({ title: "", description: "", content: "", category: "" });
      handleCloseCreatePost();
      
    } catch (err) {
      console.error("Failed to create post:", err);
      alert(`Failed to create post: ${err.message}`);
    } finally {
      setLoading(false);
    }
  };

  // Delete post from ElasticSearch
  const handleDeletePost = async (postId) => {
    try {
      setLoading(true);
      
      // Find the post before deleting it
      const post = postsByCategory[deleteCategory]?.find((p) => p.id === postId);

      if (post) {
        // Delete from ElasticSearch
        await deletePost(postId);
        console.log('Post deleted from ElasticSearch:', postId);
        
        // Notify subscribers about post deletion
        notifySubscribers(
          deleteCategory,
          "Post Deleted",
          `"${post.title}" has been removed`
        );
        
        // Update local state
        setPostsByCategory((prevPostsByCategory) => {
          const categoryPosts = prevPostsByCategory[deleteCategory].filter(
            (post) => post.id !== postId
          );
          return {
            ...prevPostsByCategory,
            [deleteCategory]: categoryPosts,
          };
        });
      }
    } catch (err) {
      console.error("Failed to delete post:", err);
      alert(`Failed to delete post: ${err.message}`);
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
  };

  const handleDeleteCategoryChange = (e) => {
    setDeleteCategory(e.target.value);
  };

  const handleReplyChange = (e) => {
    setReplyContent(e.target.value);
  };

  const handleReplySubmit = (postId) => {
    if (!auth.isAuthenticated) {
      handleOpenAuth("login");
      return;
    }

    const newReply = {
      content: replyContent,
      user: auth.user,
      date: new Date().toISOString(),
      id: Date.now(),
    };

    // Find the post and category for the reply
    let category = null;
    let post = null;

    Object.entries(postsByCategory).forEach(([cat, posts]) => {
      const foundPost = posts.find((p) => p.id === postId);
      if (foundPost) {
        category = cat;
        post = foundPost;
      }
    });

    setReplyData((prevReplyData) => {
      const postReplies = prevReplyData[postId] || [];
      return {
        ...prevReplyData,
        [postId]: [newReply, ...postReplies],
      };
    });

    // Notify subscribers about the new reply if we found the post
    if (category && post) {
      notifySubscribers(
        category,
        "New Reply",
        `${auth.user.fullName} replied to "${post.title}"`
      );
    }

    setReplyContent("");
    setReplyVisibility((prevVisibility) => ({
      ...prevVisibility,
      [postId]: false,
    }));
  };

  const truncateContent = (content, length) => {
    if (!content) return "";
    if (content.length <= length) return content;
    return content.substring(0, length) + "...";
  };

  const handleReplyButtonClick = (postId) => {
    setReplyVisibility((prevVisibility) => ({
      ...prevVisibility,
      [postId]: true,
    }));
  };

  // Function to handle scrolling to a section
  const scrollToSection = (id) => {
    const element = document.getElementById(id);
    if (element) {
      element.scrollIntoView({ behavior: "smooth" });
    }
  };

  const handleSearch = async (e) => {
    if (e) e.preventDefault();
    if (!searchQuery.trim()) {
      return;
    }
    
    try {
      setLoading(true);
      setIsSearching(true);
      setError(null);
      
      // Use a different endpoint URL based on the searchType
      let url = `http://localhost:5000/api/posts?`;
      
      if (searchType === "title") {
        url += `title=${encodeURIComponent(searchQuery)}&searchType=title`;
      } else {
        url += `query=${encodeURIComponent(searchQuery)}`;
      }
      
      const response = await fetch(url);
      if (!response.ok) {
        throw new Error(`Error: ${response.status}`);
      }
      
      const posts = await response.json();
      
      // Organize posts by category
      const organizedPosts = {};
      posts.forEach(post => {
        if (!organizedPosts[post.category]) {
          organizedPosts[post.category] = [];
        }
        organizedPosts[post.category].push(post);
      });
      
      setPostsByCategory(organizedPosts);
    } catch (err) {
      console.error("Failed to search posts:", err);
      setError(err.message || "Failed to search posts");
    } finally {
      setLoading(false);
    }
  };

  const handleClearSearch = async () => {
    if (!isSearching) return;
    
    setSearchQuery("");
    setIsSearching(false);
    setActivePostId(null); // Add this line
    
    try {
      setLoading(true);
      const posts = await fetchAllPosts();
      
      // Organize posts by category
      const organizedPosts = {};
      posts.forEach(post => {
        if (!organizedPosts[post.category]) {
          organizedPosts[post.category] = [];
        }
        organizedPosts[post.category].push(post);
      });
      
      setPostsByCategory(organizedPosts);
    } catch (err) {
      console.error("Failed to reset posts:", err);
      setError(err.message || "Failed to load posts");
    } finally {
      setLoading(false);
    }
  };

  // Handle clicking on a search result
  const handleSearchResultClick = (postId, category) => {
    setActivePostId(postId);
    
    // Scroll to the category section
    setTimeout(() => {
      // First scroll to the category
      scrollToSection(category.toLowerCase().replace(/\s+/g, '-'));
      
      // Then scroll to the specific post
      setTimeout(() => {
        const postElement = document.getElementById(`post-${postId}`);
        if (postElement) {
          postElement.scrollIntoView({ behavior: 'smooth', block: 'center' });
          
          // Add a highlight effect
          postElement.style.backgroundColor = '#fffde7';
          setTimeout(() => {
            postElement.style.transition = 'background-color 2s ease';
            postElement.style.backgroundColor = '';
          }, 100);
        }
      }, 500);
    }, 100);
  };

  // Handler for the OpenAI toggle switch
  const handleOpenAIToggle = (event) => {
    setUseOpenAI(event.target.checked);
  };

  // Handler to generate reply using OpenAI
  const generateOpenAIReply = async (postId, postContent) => {
    try {
      const apiKey = process.env.REACT_APP_OPENAI_API_KEY;
      
      const response = await fetch('https://api.openai.com/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${apiKey}`
        },
        body: JSON.stringify({
          model: 'gpt-3.5-turbo',
          messages: [
            { role: 'system', content: 'You are a helpful assistant.' },
            { role: 'user', content: `Generate a thoughtful reply to this post: "${postContent}"` }
          ],
          temperature: 0.7
        })
      });
      
      const data = await response.json();
      const generatedReply = data.choices[0].message.content;
      
      setReplyContent(generatedReply);
      handleReplyButtonClick(postId);
    } catch (error) {
      console.error('Error generating AI reply:', error);
    }
  };

  const fetchRecommendations = async () => {
    try {
      // Fetch user's current location
      const location = await getUserLocation();
      setUserLocation(location);

      // Fetch weather data (assume you have a `getWeather` function)
      const weather = await getWeather(location);

      // Fetch recommendations using OpenAI API
      const response = await fetch('https://api.openai.com/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer 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`,
        },
        body: JSON.stringify({
          model: 'gpt-3.5-turbo',
          messages: [
            { role: 'system', content: 'You are a helpful assistant.' },
            { role: 'user', content: `Based on the current location (${location.lat}, ${location.lng}) and weather (${weather.description}), recommend 3 restaurants, 3 musical events, and 3 sports events.` },
          ],
          temperature: 0.7,
        }),
      });

      const data = await response.json();
      setRecommendations(JSON.parse(data.choices[0].message.content)); // Parse recommendations
    } catch (error) {
      console.error('Error fetching recommendations:', error);
    }
  };

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
          onSearchClick={handleOpenSearchModal} // Add this line
        />

        {/* Add Activity Recommendation Component here */}
        <ActivityRecommendation />

        {/* Notification System */}
        {auth.isAuthenticated && (
          <Box sx={{ display: "flex", justifyContent: "flex-end", mt: 2, mb: 1 }}>
            <NotificationSystem
              auth={auth}
              notifications={notifications}
              markNotificationAsRead={markNotificationAsRead}
            />
          </Box>
        )}

        {/* Add the RecommendationButton */}
        <RecommendationButton />

        {/* Add the LocationButton component here */}
        <LocationButton userLocation={userLocation} />

        <main>
          {/* Loading indicator */}
          {loading && (
            <Box display="flex" justifyContent="center" my={4}>
              <CircularProgress />
            </Box>
          )}
          
          {/* Error display */}
          {error && (
            <Box mt={2} mb={2} p={2} bgcolor="#ffebee" borderRadius={1}>
              <Typography color="error">Error: {error}</Typography>
            </Box>
          )}

          {/* Search Status and Results */}
          {isSearching && (
            <Box mt={2} mb={4} p={2} border={1} borderColor="divider" borderRadius={1}>
              <Box display="flex" alignItems="center" justifyContent="space-between" mb={2}>
                <Typography variant="subtitle1" sx={{ display: 'flex', alignItems: 'center' }}>
                  <SearchIcon sx={{ mr: 1 }} fontSize="small" />
                  Showing results for {searchType === "title" ? "title" : "all content"}: "{searchQuery}"
                </Typography>
                <Button 
                  size="small" 
                  variant="outlined"
                  onClick={handleClearSearch} 
                  startIcon={<ClearIcon />}
                >
                  Clear search
                </Button>
              </Box>
              
              {/* Quick search results list */}
              {Object.keys(postsByCategory).length > 0 && (
                <List sx={{ maxHeight: '300px', overflow: 'auto', bgcolor: '#f5f5f5', borderRadius: 1 }}>
                  {Object.entries(postsByCategory).map(([category, posts]) => (
                    <React.Fragment key={category}>
                      <ListItem sx={{ bgcolor: '#e0e0e0', fontWeight: 'bold' }}>
                        <ListItemText primary={category} />
                      </ListItem>
                      {posts.map(post => (
                        <ListItem 
                          key={post.id} 
                          button
                          onClick={() => handleSearchResultClick(post.id, category)}
                          sx={{ 
                            pl: 4,
                            '&:hover': { bgcolor: '#e3f2fd' } 
                          }}
                        >
                          <ListItemText 
                            primary={post.title} 
                            secondary={post.description && truncateContent(post.description, 80)}
                            primaryTypographyProps={{ fontWeight: 'medium' }}
                          />
                        </ListItem>
                      ))}
                    </React.Fragment>
                  ))}
                </List>
              )}
            </Box>
          )}

          {/* Empty state message - no posts or no search results */}
          {!loading && Object.keys(postsByCategory).length === 0 && (
            <Box mt={4} mb={4} textAlign="center" p={3} border={1} borderColor="divider" borderRadius={1}>
              <Typography variant="h6" color="text.secondary" gutterBottom>
                {isSearching 
                  ? `No posts found matching "${searchQuery}"` 
                  : "No posts available yet."}
              </Typography>
              
              {isSearching ? (
                <Button 
                  variant="outlined" 
                  onClick={handleClearSearch}
                  startIcon={<ClearIcon />}
                  sx={{ mt: 2 }}
                >
                  Clear search
                </Button>
              ) : (
                auth.isAuthenticated && (
                  <Button 
                    variant="contained" 
                    color="primary"
                    onClick={handleOpenCreatePost}
                    sx={{ mt: 2 }}
                  >
                    Be the first to post
                  </Button>
                )
              )}
            </Box>
          )}
          
          {/* Create and Delete Post Buttons */}
          <Box sx={{ mb: 3 }}>
            <Button
              variant="contained"
              color="primary"
              onClick={() => {
                if (auth.isAuthenticated) {
                  handleOpenCreatePost();
                } else {
                  handleOpenAuth("login");
                }
              }}
              style={{ marginRight: "10px" }}
              disabled={loading}
            >
              Create Post
            </Button>
            
            {auth.isAuthenticated && auth.user && auth.user.userType === "Moderator" && (
              <Button
                variant="contained"
                color="secondary"
                onClick={handleOpenDeletePost}
                disabled={loading}
              >
                Delete Post
              </Button>
            )}
          </Box>
          
          {/* Display message if no posts */}
          {!loading && Object.keys(postsByCategory).length === 0 && (
            <Box mt={4} textAlign="center">
              <Typography variant="h6" color="textSecondary">
                No posts available yet.
              </Typography>
            </Box>
          )}
          
          {/* Display posts by category */}
          {Object.keys(postsByCategory).map((category) => (
            <CategorySection
              key={category}
              category={category}
              posts={postsByCategory[category]}
              auth={auth}
              handleOpenAuth={handleOpenAuth}
              replyVisibility={replyVisibility}
              replyContent={replyContent}
              replyData={replyData}
              handleReplyButtonClick={handleReplyButtonClick}
              handleReplyChange={handleReplyChange}
              handleReplySubmit={handleReplySubmit}
              truncateContent={truncateContent}
              isSubscribed={
                auth.isAuthenticated &&
                subscriptions[auth.user.id]?.includes(category)
              }
              onSubscribe={() => handleSubscribe(category)}
              onUnsubscribe={() => handleUnsubscribe(category)}
              activePostId={activePostId}
              useOpenAI={useOpenAI}
              handleOpenAIToggle={handleOpenAIToggle}
              generateOpenAIReply={generateOpenAIReply}
            />
          ))}
        </main>
      </Container>
      <Footer title="Footer" description="Something here to give the footer a purpose!" />

      {/* Auth Modal */}
      <AuthModal
        open={openAuth}
        handleClose={handleCloseAuth}
        type={authType}
        onLogin={handleLogin}
      />

      {/* Create Post Modal */}
      <CreatePostModal
        open={openCreatePost}
        onClose={handleCloseCreatePost}
        formData={formData}
        handleChange={handleChange}
        handleSubmit={handleSubmit}
        sections={sections}
        isLoading={loading}
      />

      {/* Delete Post Modal */}
      <DeletePostModal
        open={openDeletePost}
        onClose={handleCloseDeletePost}
        deleteCategory={deleteCategory}
        handleDeleteCategoryChange={handleDeleteCategoryChange}
        postsByCategory={postsByCategory}
        handleDeletePost={handleDeletePost}
        sections={sections}
        isLoading={loading}
      />

      {/* Search Modal */}
      <SearchModal
        open={searchModalOpen}
        onClose={handleCloseSearchModal}
        searchQuery={searchQuery}
        setSearchQuery={setSearchQuery}
        handleSearch={handleSearch}
        isSearching={isSearching}
        handleClearSearch={handleClearSearch}
        searchType={searchType}
        setSearchType={setSearchType}
      />

      {/* Recommendation Modal */}
      <Dialog
        open={openRecommendationModal}
        onClose={() => setOpenRecommendationModal(false)}
        maxWidth="lg"
        fullWidth
      >
        <DialogTitle>Recommended For You</DialogTitle>
        <DialogContent>
          <Box sx={{ height: "400px", width: "100%" }}>
            <GoogleMapReact
              bootstrapURLKeys={{ key: "AIzaSyA6_MQyYuTqgCx91FUEmaU39lcoTqMDtzI" }}
              defaultCenter={userLocation || { lat: 37.7749, lng: -122.4194 }} // Default to San Francisco if location is unavailable
              defaultZoom={12}
              yesIWantToUseGoogleMapApiInternals
              onGoogleApiLoaded={({ map, maps }) => {
                // Add user location marker
                if (userLocation) {
                  new maps.Marker({
                    position: userLocation,
                    map,
                    title: "Your Location",
                    icon: "http://maps.google.com/mapfiles/ms/icons/green-dot.png",
                  });
                }

                // Add recommendation markers
                if (recommendations) {
                  recommendations.restaurants.forEach((restaurant) => {
                    new maps.Marker({
                      position: { lat: restaurant.lat, lng: restaurant.lng },
                      map,
                      title: restaurant.name,
                      icon: "http://maps.google.com/mapfiles/ms/icons/red-dot.png",
                    });
                  });

                  recommendations.musicalEvents.forEach((event) => {
                    new maps.Marker({
                      position: { lat: event.lat, lng: event.lng },
                      map,
                      title: event.name,
                      icon: "http://maps.google.com/mapfiles/ms/icons/blue-dot.png",
                    });
                  });

                  recommendations.sportsEvents.forEach((event) => {
                    new maps.Marker({
                      position: { lat: event.lat, lng: event.lng },
                      map,
                      title: event.name,
                      icon: "http://maps.google.com/mapfiles/ms/icons/yellow-dot.png",
                    });
                  });
                }
              }}
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
          <Button onClick={() => setOpenRecommendationModal(false)}>Close</Button>
        </DialogActions>
      </Dialog>
    </ThemeProvider>
  );
}

// This is the finished Search Modal implementation
const SearchModal = ({ 
  open, 
  onClose, 
  searchQuery, 
  setSearchQuery, 
  handleSearch, 
  isSearching, 
  handleClearSearch,
  searchType,
  setSearchType 
}) => {
  return (
    <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
      <DialogTitle>
        <Box display="flex" alignItems="center" justifyContent="space-between">
          <Typography variant="h6">Search Posts</Typography>
          <IconButton onClick={onClose} size="small">
            <CloseIcon />
          </IconButton>
        </Box>
      </DialogTitle>
      <DialogContent>
        <form onSubmit={(e) => {
          handleSearch(e);
          onClose();
        }}>
          <TextField
            autoFocus
            margin="dense"
            placeholder="Search posts..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            fullWidth
            variant="outlined"
            InputProps={{
              endAdornment: (
                <InputAdornment position="end">
                  <IconButton type="submit">
                    <SearchIcon />
                  </IconButton>
                </InputAdornment>
              ),
            }}
          />
          <Box sx={{ display: 'flex', justifyContent: 'space-between', mt: 2 }}>
            <Box>
              <FormControlLabel
                control={
                  <Radio
                    checked={searchType === "all"}
                    onChange={() => setSearchType("all")}
                    value="all"
                    name="search-type"
                  />
                }
                label="All Content"
              />
              <FormControlLabel
                control={
                  <Radio
                    checked={searchType === "title"}
                    onChange={() => setSearchType("title")}
                    value="title"
                    name="search-type"
                  />
                }
                label="Title Only"
              />
            </Box>
            {isSearching && (
              <Button 
                onClick={handleClearSearch}
                startIcon={<ClearIcon />}
                sx={{ alignSelf: 'center' }}
              >
                Clear Search
              </Button>
            )}
          </Box>
        </form>
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose}>Cancel</Button>
        <Button 
          onClick={(e) => {
            handleSearch(e);
            onClose();
          }} 
          variant="contained" 
          color="primary"
          startIcon={<SearchIcon />}
        >
          Search
        </Button>
      </DialogActions>
    </Dialog>
  );
};

// Utility function to get user location
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