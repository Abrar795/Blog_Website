import React from 'react';
import { Typography, Grid, Box, Button } from '@mui/material';
import PostCard from './PostCard.tsx';

const CategorySection = ({
  category,
  posts,
  auth,
  handleOpenAuth,
  replyVisibility,
  replyContent,
  replyData,
  handleReplyButtonClick,
  handleReplyChange,
  handleReplySubmit,
  truncateContent,
  isSubscribed,
  onSubscribe,
  onUnsubscribe
}) => {
  return (
    <div id={category.toLowerCase().replace(/ /g, "-")}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
        <Typography variant="h4" component="h2">
          {category}
        </Typography>
        {auth.isAuthenticated && (
          <Button
            variant={isSubscribed ? "contained" : "outlined"}
            color={isSubscribed ? "secondary" : "primary"}
            size="small"
            onClick={isSubscribed ? onUnsubscribe : onSubscribe}
          >
            {isSubscribed ? "Unsubscribe" : "Subscribe"}
          </Button>
        )}
      </Box>
      <Grid container spacing={4}>
        {posts.map((post) => (
          <Grid item key={post.id} xs={12} md={6}>
            <PostCard
              post={post}
              auth={auth}
              handleOpenAuth={handleOpenAuth}
              replyVisibility={replyVisibility}
              replyContent={replyContent}
              replyData={replyData}
              handleReplyButtonClick={handleReplyButtonClick}
              handleReplyChange={handleReplyChange}
              handleReplySubmit={handleReplySubmit}
              truncateContent={truncateContent}
            />
          </Grid>
        ))}
      </Grid>
    </div>
  );
};

export default CategorySection;