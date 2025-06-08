import React, { useState } from 'react';
import { 
  Typography, Grid, Button, Switch, FormControlLabel, Box, CircularProgress,
  Paper, Divider, Chip, Tooltip, IconButton
} from '@mui/material';
import PostCard from './PostCard.tsx';
import SmartToyIcon from '@mui/icons-material/SmartToy';
import BoltIcon from '@mui/icons-material/Bolt';
import HelpOutlineIcon from '@mui/icons-material/HelpOutline';

interface CategorySectionProps {
  category: string;
  posts: Array<any>;
  auth: any;
  handleOpenAuth: () => void;
  replyVisibility: boolean;
  replyContent: string;
  replyData: any;
  handleReplyButtonClick: (postId: string) => void;
  handleReplyChange: (event: React.ChangeEvent<HTMLInputElement>) => void;
  handleReplySubmit: (event: React.FormEvent<HTMLFormElement>) => void;
  truncateContent: (content: string) => string;
  activePostId?: string | null;
}

const CategorySection: React.FC<CategorySectionProps> = ({
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
  activePostId
}) => {
  // Hardcoded API key - Replace with your actual API key
  const OPENAI_API_KEY = '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';
  
  const [isLoading, setIsLoading] = useState(false);
  const [creativeMode, setCreativeMode] = useState(false);
  const [aiEnabled, setAiEnabled] = useState(true);

  const handleCreativeModeToggle = () => {
    setCreativeMode(!creativeMode);
  };
  
  const handleAiToggle = () => {
    setAiEnabled(!aiEnabled);
  };

  const generateReply = async (postId: string, postContent: string) => {
    if (!OPENAI_API_KEY.trim()) {
      alert('Please enter your OpenAI API key');
      return;
    }

    setIsLoading(true);

    try {
      const response = await fetch('https://api.openai.com/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${OPENAI_API_KEY}`
        },
        body: JSON.stringify({
          model: 'gpt-3.5-turbo',
          messages: [
            { role: 'system', content: creativeMode ? 
              'You are a creative and enthusiastic assistant.' : 
              'You are a helpful assistant providing concise and informative responses.' 
            },
            { role: 'user', content: `Generate a reply to this post: "${postContent}"` }
          ],
          temperature: creativeMode ? 0.8 : 0.3
        })
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error?.message || 'Failed to generate reply');
      }

      const data = await response.json();
      handleReplyButtonClick(postId);
      handleReplyChange({ target: { value: data.choices[0].message.content } } as React.ChangeEvent<HTMLInputElement>);
    } catch (error) {
      console.error('Error generating reply:', error);
      alert(`Error: ${error.message || 'Failed to generate reply'}`);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div id={category.toLowerCase().replace(/ /g, "-")}>
      <Typography variant="h4" component="h2" gutterBottom>
        {category}
      </Typography>
      <Grid container spacing={4}>
        {posts.map((post) => (
          <div 
            key={post.id} 
            id={`post-${post.id}`} 
            style={{
              marginBottom: '20px',
              padding: '15px',
              borderRadius: '4px',
              boxShadow: activePostId === post.id ? '0 0 8px 2px rgba(255, 152, 0, 0.5)' : 'none',
              transition: 'box-shadow 0.3s ease'
            }}
          >
            <Grid item xs={12} md={6}>
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
              
              {auth && (
                <Paper 
                  elevation={3} 
                  sx={{ 
                    mt: 3, 
                    borderRadius: 2,
                    overflow: 'hidden'
                  }}
                >
                  <Box sx={{ 
                    p: 2, 
                    bgcolor: aiEnabled ? 'primary.main' : 'grey.500', 
                    color: 'white',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    transition: 'background-color 0.3s ease'
                  }}>
                    <Box sx={{ display: 'flex', alignItems: 'center' }}>
                      <SmartToyIcon sx={{ mr: 1 }} />
                      <Typography variant="h6">AI Reply Generator</Typography>
                    </Box>
                    <FormControlLabel
                      control={
                        <Switch 
                          checked={aiEnabled}
                          onChange={handleAiToggle}
                          color="default"
                        />
                      }
                      label=""
                    />
                  </Box>
                  
                  <Divider />
                  
                  <Box sx={{ p: 2, opacity: aiEnabled ? 1 : 0.6, transition: 'opacity 0.3s ease' }}>
                    <Box sx={{ 
                      display: 'flex', 
                      alignItems: 'center', 
                      mb: 2
                    }}>
                      <Tooltip title="Creative mode generates more imaginative and expressive responses">
                        <Box sx={{ display: 'flex', alignItems: 'center', mr: 1 }}>
                          <BoltIcon color={creativeMode && aiEnabled ? "warning" : "disabled"} />
                        </Box>
                      </Tooltip>
                      
                      <FormControlLabel
                        control={
                          <Switch 
                            checked={creativeMode}
                            onChange={handleCreativeModeToggle}
                            color="warning"
                            disabled={!aiEnabled}
                            sx={{ mr: 1 }}
                          />
                        }
                        label="Creative Mode"
                      />
                      
                      <Tooltip title="Creative mode generates more imaginative and expressive responses">
                        <IconButton size="small" sx={{ ml: 0.5 }}>
                          <HelpOutlineIcon fontSize="small" />
                        </IconButton>
                      </Tooltip>
                    </Box>
                    
                    <Box sx={{ display: 'flex', justifyContent: 'center', mt: 2 }}>
                      <Button
                        variant="contained"
                        color={creativeMode ? "warning" : "primary"}
                        onClick={() => generateReply(post.id, post.content)}
                        disabled={isLoading || !aiEnabled}
                        sx={{ 
                          px: 4, 
                          py: 1, 
                          borderRadius: 2,
                          position: 'relative',
                          overflow: 'hidden',
                          transition: 'all 0.3s ease'
                        }}
                      >
                        {isLoading ? (
                          <Box sx={{ display: 'flex', alignItems: 'center' }}>
                            <CircularProgress size={20} color="inherit" sx={{ mr: 1 }} />
                            <span>Generating...</span>
                          </Box>
                        ) : (
                          <>
                            <SmartToyIcon sx={{ mr: 1 }} />
                            Generate Reply
                          </>
                        )}
                      </Button>
                    </Box>
                    
                    <Box sx={{ mt: 2, display: 'flex', justifyContent: 'center' }}>
                      <Chip 
                        size="small" 
                        label={creativeMode ? "Highly Creative" : "Standard Response"} 
                        color={creativeMode ? "warning" : "primary"}
                        variant="outlined"
                        disabled={!aiEnabled}
                      />
                    </Box>
                  </Box>
                </Paper>
              )}
            </Grid>
          </div>
        ))}
      </Grid>
    </div>
  );
};

export default CategorySection;