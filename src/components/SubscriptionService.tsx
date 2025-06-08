import React from 'react';
import { Button, Badge, IconButton, Menu, MenuItem, Typography, Box } from '@mui/material';
import NotificationsIcon from '@mui/icons-material/Notifications';

const SubscriptionService = ({ 
  auth, 
  categorySubscriptions, 
  notifications, 
  handleSubscribe, 
  handleUnsubscribe,
  markNotificationAsRead,
  category 
}) => {
  const [anchorEl, setAnchorEl] = React.useState(null);
  
  const isSubscribed = auth.isAuthenticated && 
    categorySubscriptions[category] && 
    categorySubscriptions[category].includes(auth.user.id);
  
  const userNotifications = auth.isAuthenticated && notifications[auth.user.id] 
    ? notifications[auth.user.id].filter(n => n.category === category && !n.read) 
    : [];
  
  const handleClick = (event) => {
    setAnchorEl(event.currentTarget);
  };

  const handleClose = () => {
    setAnchorEl(null);
  };

  const handleNotificationRead = (notificationId) => {
    markNotificationAsRead(auth.user.id, notificationId);
    handleClose();
  };

  return (
    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
      {auth.isAuthenticated && (
        <>
          <Button
            variant="outlined"
            size="small"
            color={isSubscribed ? "secondary" : "primary"}
            onClick={() => isSubscribed ? handleUnsubscribe(category) : handleSubscribe(category)}
          >
            {isSubscribed ? "Unsubscribe" : "Subscribe"}
          </Button>
          
          {isSubscribed && (
            <>
              <IconButton 
                color="primary" 
                onClick={handleClick}
                disabled={userNotifications.length === 0}
              >
                <Badge badgeContent={userNotifications.length} color="error">
                  <NotificationsIcon />
                </Badge>
              </IconButton>
              <Menu
                id="notifications-menu"
                anchorEl={anchorEl}
                keepMounted
                open={Boolean(anchorEl)}
                onClose={handleClose}
              >
                {userNotifications.length > 0 ? (
                  userNotifications.map(notification => (
                    <MenuItem 
                      key={notification.id} 
                      onClick={() => handleNotificationRead(notification.id)}
                    >
                      <Typography variant="body2">{notification.message}</Typography>
                    </MenuItem>
                  ))
                ) : (
                  <MenuItem>No new notifications</MenuItem>
                )}
              </Menu>
            </>
          )}
        </>
      )}
    </Box>
  );
};

export default SubscriptionService;