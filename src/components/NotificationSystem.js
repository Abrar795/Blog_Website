import React from 'react';
import { Badge, IconButton, Menu, MenuItem, Typography, ListItemText, Divider } from '@mui/material';
import NotificationsIcon from '@mui/icons-material/Notifications';

const NotificationSystem = ({ auth, notifications, markNotificationAsRead }) => {
  const [anchorEl, setAnchorEl] = React.useState(null);
  
  // Get notifications for the current user
  const userNotifications = auth.isAuthenticated && auth.user ? 
    (notifications[auth.user.id] || []).filter(n => !n.read) : [];
  
  const handleClick = (event) => {
    setAnchorEl(event.currentTarget);
  };

  const handleClose = () => {
    setAnchorEl(null);
  };

  const handleNotificationClick = (notificationId) => {
    markNotificationAsRead(notificationId);
    handleClose();
  };

  return (
    <>
      <IconButton 
        color="inherit" 
        onClick={handleClick}
        aria-label={`${userNotifications.length} new notifications`}
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
          userNotifications.map((notification) => (
            <MenuItem 
              key={notification.id} 
              onClick={() => handleNotificationClick(notification.id)}
              sx={{ minWidth: 250 }}
            >
              <ListItemText
                primary={notification.category}
                secondary={
                  <>
                    <Typography variant="body2" component="span" color="text.primary">
                      {notification.action}: 
                    </Typography>
                    {' '}{notification.message}
                    <Typography variant="caption" display="block" color="text.secondary">
                      {new Date(notification.timestamp).toLocaleString()}
                    </Typography>
                  </>
                }
              />
            </MenuItem>
          ))
        ) : (
          <MenuItem disabled>No new notifications</MenuItem>
        )}
        {userNotifications.length > 0 && (
          <>
            <Divider />
            <MenuItem onClick={() => markNotificationAsRead('all')}>
              Mark all as read
            </MenuItem>
          </>
        )}
      </Menu>
    </>
  );
};

export default NotificationSystem;