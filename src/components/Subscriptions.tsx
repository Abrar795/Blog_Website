import React from 'react';
import { Box, Typography, List, ListItem, ListItemText, Button } from '@mui/material';

const Subscriptions = ({ subscriptions, auth, handleUnsubscribe }) => {
  if (!auth.isAuthenticated) {
    return null;
  }

  const userSubscriptions = Object.keys(subscriptions).filter(category =>
    subscriptions[category].includes(auth.user.id)
  );

  return (
    <Box sx={{ mt: 4 }}>
      <Typography variant="h6">Your Subscriptions</Typography>
      <List>
        {userSubscriptions.map(category => (
          <ListItem key={category}>
            <ListItemText primary={category} />
            <Button variant="contained" color="secondary" onClick={() => handleUnsubscribe(category)}>
              Unsubscribe
            </Button>
          </ListItem>
        ))}
      </List>
    </Box>
  );
};

export default Subscriptions;