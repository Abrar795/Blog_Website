import * as React from "react";
import CssBaseline from "@mui/material/CssBaseline";
import Container from "@mui/material/Container";
import {
  Box,
  Typography,
  List,
  ListItem,
  ListItemText,
  Button,
  CircularProgress,
  TextField,
  InputAdornment,
  IconButton,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  FormControlLabel,
  Radio,
  Chip,
  Link,
} from "@mui/material";
import { createTheme, ThemeProvider } from "@mui/material/styles";
import Header from "./Header";
import Footer from "./Footer";
import AuthModal from "./AuthModal";
import CreatePostModal from "./CreatePostModal.tsx";
import DeletePostModal from "./DeletePostModal.tsx";
import CategorySection from "./CategorySection.tsx";
import NotificationSystem from "./NotificationSystem.tsx";
import axios from "axios";
import { fetchAllPosts, createPost, deletePost, searchPosts } from "../utils/elasticsearchApi";
import SearchIcon from "@mui/icons-material/Search";
import ClearIcon from "@mui/icons-material/Clear";
import CloseIcon from "@mui/icons-material/Close";
import RecommendationModal from "./RecommendationModal";
import ImplementationModal from "./ImplementationModal";

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
  const [subscriptions, setSubscriptions] = React.useState({});
  const [notifications, setNotifications] = React.useState({});
  const [loading, setLoading] = React.useState(false);
  const [error, setError] = React.useState(null);
  const [searchQuery, setSearchQuery] = React.useState("");
  const [isSearching, setIsSearching] = React.useState(false);
  const [activePostId, setActivePostId] = React.useState(null);
  const [searchModalOpen, setSearchModalOpen] = React.useState(false);
  const [searchType, setSearchType] = React.useState("all");
  const [openRecommendationsModal, setOpenRecommendationsModal] = React.useState(false);
  const [recommendationDetails, setRecommendationDetails] = React.useState("");

  React.useEffect(() => {
    const loadAllPosts = async () => {
      try {
        setLoading(true);
        setError(null);

        const posts = await fetchAllPosts();

        const organizedPosts = {};
        posts.forEach((post) => {
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

  const handleReplyButtonClick = (postId) => {
    setReplyVisibility((prevVisibility) => ({
      ...prevVisibility,
      [postId]: true,
    }));
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

      const organizedPosts = {};
      posts.forEach((post) => {
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
    setActivePostId(null);
    try {
      setLoading(true);
      const posts = await fetchAllPosts();

      const organizedPosts = {};
      posts.forEach((post) => {
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
        {auth.isAuthenticated && (
          <Box sx={{ display: "flex", justifyContent: "flex-end", mt: 2, mb: 1 }}>
            <NotificationSystem
              auth={auth}
              notifications={notifications}
              markNotificationAsRead={markNotificationAsRead}
            />
          </Box>
        )}
        <main>
          <Box sx={{ display: "flex", gap: 2, my: 3 }}>
            <Button
              variant="contained"
              onClick={() => {
                setRecommendationDetails("Here are the details of the recommendation.");
                setOpenRecommendationsModal(true);
              }}
            >
              🌦️ Activity Recommendations
            </Button>
          </Box>
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
            />
          ))}
        </main>
      </Container>
      <Footer title="Footer" description="Something here to give the footer a purpose!" />

      <AuthModal
        open={openAuth}
        handleClose={handleCloseAuth}
        type={authType}
        onLogin={handleLogin}
      />

      <CreatePostModal
        open={openCreatePost}
        onClose={handleCloseCreatePost}
        formData={formData}
        handleChange={handleChange}
        handleSubmit={handleSubmit}
        sections={sections}
        isLoading={loading}
      />

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

      <RecommendationModal
        open={openRecommendationsModal}
        onClose={() => setOpenRecommendationsModal(false)}
        recommendationDetails={recommendationDetails}
      />
    </ThemeProvider>
  );
}