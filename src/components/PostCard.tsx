import React from 'react';
import { Card, CardContent, Typography, Link, Button, TextField, Box } from '@mui/material';

const PostCard = ({ 
  post, 
  auth, 
  handleOpenAuth, 
  replyVisibility, 
  replyContent, 
  replyData,
  handleReplyButtonClick, 
  handleReplyChange, 
  handleReplySubmit, 
  truncateContent 
}) => {
  return (
    <Card>
      <CardContent>
        <Typography gutterBottom variant="h5" component="div">
          {post.title}
        </Typography>
        <Typography variant="body2" color="text.secondary">
          {post.description}
        </Typography>
        <Typography variant="body1" color="text.primary">
          {auth.isAuthenticated ? post.content : truncateContent(post.content, 100)}
        </Typography>
        {!auth.isAuthenticated && (
          <Link component="button" variant="body2" onClick={() => handleOpenAuth("login")}>
            View Post
          </Link>
        )}
        {auth.isAuthenticated && (
          <>
            {!replyVisibility[post.id] && (
              <Button variant="outlined" color="primary" onClick={() => handleReplyButtonClick(post.id)}>
                Reply
              </Button>
            )}
            {replyVisibility[post.id] && (
              <>
                <TextField
                  fullWidth
                  label="Write a reply"
                  value={replyContent}
                  onChange={handleReplyChange}
                  margin="normal"
                  multiline
                  rows={2}
                />
                <Button variant="contained" color="primary" onClick={() => handleReplySubmit(post.id)}>
                  Submit Reply
                </Button>
              </>
            )}
            {replyData[post.id] && replyData[post.id].map(reply => (
              <Box key={reply.id} sx={{ mt: 2, pl: 2, borderLeft: '2px solid #ccc' }}>
                <Typography variant="body2" color="text.secondary">
                  {reply.user.fullName} - {new Date(reply.date).toLocaleString()}
                </Typography>
                <Typography variant="body1" color="text.primary">
                  {reply.content}
                </Typography>
              </Box>
            ))}
          </>
        )}
      </CardContent>
    </Card>
  );
};

export default PostCard;