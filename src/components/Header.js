import * as React from "react";
import PropTypes from "prop-types";
import Toolbar from "@mui/material/Toolbar";
import Button from "@mui/material/Button";
import IconButton from "@mui/material/IconButton";
import SearchIcon from "@mui/icons-material/Search";
import Typography from "@mui/material/Typography";
import Link from "@mui/material/Link";
import AppBar from "@mui/material/AppBar";
import Menu from "@mui/material/Menu";
import MenuItem from "@mui/material/MenuItem";
import Box from "@mui/material/Box"; // Add Box for layout
import List from "@mui/material/List"; // Add List for displaying subscriptions
import ListItem from "@mui/material/ListItem"; // Add ListItem for subscriptions
import ListItemText from "@mui/material/ListItemText"; // Add ListItemText for subscriptions
import TextField from "@mui/material/TextField"; // Add TextField for search bar
import InputAdornment from "@mui/material/InputAdornment"; // Add InputAdornment for search bar

// Add onSearchClick to the props destructuring
function Header({
  sections,
  title,
  auth,
  onLogin,
  onSignUp,
  onLogout,
  onSectionClick,
  onSubscribe,
  onUnsubscribe,
  userSubscriptions,
  onSearchClick, // Add this new prop
}) {
  const [anchorEl, setAnchorEl] = React.useState(null);
  // Remove these two lines since search will be handled by the modal in Blog.tsx
  // const [searchQuery, setSearchQuery] = React.useState("");
  // const [isSearching, setIsSearching] = React.useState(false);

  const handleSubscribeClick = (event) => {
    setAnchorEl(event.currentTarget);
  };

  const handleSubscribeClose = () => {
    setAnchorEl(null);
  };

  // Remove these functions as they'll be handled in Blog.tsx
  // const handleSearch = (event) => {
  //   event.preventDefault();
  //   setIsSearching(true);
  // };
  // 
  // const handleClearSearch = () => {
  //   setSearchQuery("");
  //   setIsSearching(false);
  // };

  return (
    <React.Fragment>
      <AppBar position="static" sx={{ backgroundColor: "#1976d2" }}>
        <Toolbar sx={{ borderBottom: 1, borderColor: "divider" }}>
          <Button
            size="small"
            color="inherit"
            onClick={handleSubscribeClick}
          >
            Subscribe
          </Button>
          <Typography
            component="h1"
            variant="h6"
            color="inherit"
            align="center"
            noWrap
            sx={{ flex: 1 }}
          >
            {title}
          </Typography>
          {/* Update the search icon to use the onSearchClick prop */}
          <IconButton color="inherit" onClick={onSearchClick}>
            <SearchIcon />
          </IconButton>
          {auth.isAuthenticated ? (
            <Button
              variant="outlined"
              color="inherit"
              size="small"
              onClick={onLogout}
            >
              Logout ({auth.user.fullName})
            </Button>
          ) : (
            <>
              <Button
                variant="outlined"
                color="inherit"
                size="small"
                onClick={onLogin}
              >
                Login
              </Button>
              <Button
                variant="outlined"
                color="inherit"
                size="small"
                onClick={onSignUp}
                sx={{ ml: 1 }}
              >
                Sign Up
              </Button>
            </>
          )}
        </Toolbar>
      </AppBar>
      <Toolbar
        component="nav"
        variant="dense"
        sx={{ justifyContent: "space-between", overflowX: "auto" }}
      >
        {sections.map((section) => (
          <Link
            color="inherit"
            noWrap
            key={section.title}
            variant="body2"
            href={section.url}
            sx={{ p: 1, flexShrink: 0 }}
            onClick={(e) => {
              e.preventDefault();
              onSectionClick(section.url);
            }}
          >
            {section.title}
          </Link>
        ))}
      </Toolbar>

      {/* Subscription Menu */}
      <Menu
        anchorEl={anchorEl}
        open={Boolean(anchorEl)}
        onClose={handleSubscribeClose}
      >
        {sections.map((section) => (
          <MenuItem
            key={section.title}
            onClick={() => {
              if (userSubscriptions.includes(section.title)) {
                onUnsubscribe(section.title);
              } else {
                onSubscribe(section.title);
              }
              handleSubscribeClose();
            }}
          >
            {section.title}
            {userSubscriptions.includes(section.title) && " ✔"}
          </MenuItem>
        ))}
      </Menu>

      {/* Display User's Subscriptions */}
      {auth.isAuthenticated && (
        <Box sx={{ mt: 2, p: 2, border: "1px solid #ddd", borderRadius: 1 }}>
          <Typography variant="h6">Your Subscriptions</Typography>
          <List>
            {userSubscriptions.map((category) => (
              <ListItem key={category}>
                <ListItemText primary={category} />
                <Button
                  variant="contained"
                  color="secondary"
                  size="small"
                  onClick={() => onUnsubscribe(category)}
                >
                  Unsubscribe
                </Button>
              </ListItem>
            ))}
          </List>
        </Box>
      )}

      {/* Remove the search bar and search status from here */}
    </React.Fragment>
  );
}

// Update prop types to include onSearchClick
Header.propTypes = {
  sections: PropTypes.arrayOf(
    PropTypes.shape({
      title: PropTypes.string.isRequired,
      url: PropTypes.string.isRequired,
    })
  ).isRequired,
  title: PropTypes.string.isRequired,
  auth: PropTypes.shape({
    isAuthenticated: PropTypes.bool.isRequired,
    user: PropTypes.shape({
      fullName: PropTypes.string.isRequired,
    }),
  }).isRequired,
  onLogin: PropTypes.func.isRequired,
  onSignUp: PropTypes.func.isRequired,
  onLogout: PropTypes.func.isRequired,
  onSectionClick: PropTypes.func.isRequired,
  onSubscribe: PropTypes.func.isRequired,
  onUnsubscribe: PropTypes.func.isRequired,
  userSubscriptions: PropTypes.arrayOf(PropTypes.string).isRequired,
  onSearchClick: PropTypes.func, // Add this prop type
};

export default Header;