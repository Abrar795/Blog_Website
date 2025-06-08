import React, { useState, useEffect } from 'react';
import { 
  Typography, Grid, Button, Switch, FormControlLabel, Box, CircularProgress,
  Paper, Divider, Chip, Tooltip, IconButton, Card, CardContent, MenuItem, 
  Select, InputLabel, FormControl, Alert, Dialog, DialogTitle, DialogContent,
  DialogActions, Fab, Drawer, Tab, Tabs
} from '@mui/material';
import SmartToyIcon from '@mui/icons-material/SmartToy';
import BoltIcon from '@mui/icons-material/Bolt';
import HelpOutlineIcon from '@mui/icons-material/HelpOutline';
import RocketLaunchIcon from '@mui/icons-material/RocketLaunch';
import AutorenewIcon from '@mui/icons-material/Autorenew';
import CloseIcon from '@mui/icons-material/Close';
import ChatIcon from '@mui/icons-material/Chat';

interface GlobalAIReplyGeneratorProps {
  categories: Array<{
    name: string;
    posts: Array<any>;
  }>;
  auth: boolean;
  handleReplyButtonClick: (postId: string) => void;
  handleReplyChange: (event: React.ChangeEvent<HTMLInputElement>) => void;
  truncateContent: (content: string) => string;
}

const GlobalAIReplyGenerator: React.FC<GlobalAIReplyGeneratorProps> = ({
  categories,
  auth,
  handleReplyButtonClick,
  handleReplyChange,
  truncateContent
}) => {
  // Hardcoded API key - Replace with your actual API key
  const OPENAI_API_KEY = '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';
  
  const [isLoading, setIsLoading] = useState(false);
  const [creativeMode, setCreativeMode] = useState(false);
  const [aiEnabled, setAiEnabled] = useState(true);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [selectedCategoryIndex, setSelectedCategoryIndex] = useState(0);
  const [selectedPostId, setSelectedPostId] = useState('');
  const [generationResult, setGenerationResult] = useState('');

  // Handler for creative mode toggle
  const handleCreativeModeToggle = () => {
    setCreativeMode(!creativeMode);
  };
  
  // Handler for AI assistant toggle
  const handleAiToggle = () => {
    setAiEnabled(!aiEnabled);
  };

  // Handler for category selection
  const handleCategoryChange = (event: React.SyntheticEvent, newValue: number) => {
    setSelectedCategoryIndex(newValue);
    setSelectedPostId('');
    setGenerationResult('');
  };

  // Handler for post selection
  const handlePostSelect = (event) => {
    setSelectedPostId(event.target.value);
    setGenerationResult('');
  };

  // Get selected post content
  const getSelectedPost = () => {
    if (selectedCategoryIndex >= 0 && selectedCategoryIndex < categories.length) {
      const categoryPosts = categories[selectedCategoryIndex].posts;
      return categoryPosts.find(post => post.id === selectedPostId);
    }
    return null;
  };

  // Function to generate reply using OpenAI
  const generateReply = async () => {
    if (!aiEnabled) {
      alert('AI Assistant is turned off. Please enable it first.');
      return;
    }

    if (!selectedPostId) {
      alert('Please select a post first.');
      return;
    }

    const selectedPost = getSelectedPost();
    if (!selectedPost) {
      alert('Selected post not found.');
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
            { role: 'user', content: `Generate a reply to this post: "${selectedPost.content}"` }
          ],
          temperature: creativeMode ? 0.8 : 0.3
        })
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error?.message || 'Failed to generate reply');
      }

      const data = await response.json();
      const generatedReply = data.choices[0].message.content;
      
      // Store the generated reply
      setGenerationResult(generatedReply);
    } catch (error) {
      console.error('Error generating reply:', error);
      alert(`Error: ${error.message || 'Failed to generate reply'}`);
    } finally {
      setIsLoading(false);
    }
  };

  // Apply generated reply to the selected post
  const applyGeneratedReply = () => {
    if (!generationResult || !selectedPostId) return;
    
    handleReplyButtonClick(selectedPostId);
    handleReplyChange({ target: { value: generationResult } } as React.ChangeEvent<HTMLInputElement>);
    setDrawerOpen(false); // Close drawer after applying
  };

  // Toggle drawer open/closed
  const toggleDrawer = () => {
    setDrawerOpen(!drawerOpen);
  };

  // Only render if user is authenticated
  if (!auth) return null;

  return (
    <>
      {/* Floating action button to open AI Generator */}
      <Fab 
        color="primary" 
        aria-label="AI Reply Generator" 
        sx={{ 
          position: 'fixed', 
          bottom: 20, 
          right: 20,
          zIndex: 1000
        }}
        onClick={toggleDrawer}
      >
        <ChatIcon />
      </Fab>

      {/* AI Generator Drawer */}
      <Drawer
        anchor="right"
        open={drawerOpen}
        onClose={toggleDrawer}
        sx={{
          '& .MuiDrawer-paper': { 
            width: { xs: '100%', sm: '80%', md: '60%', lg: '50%' },
            maxWidth: '800px',
            p: 0
          },
        }}
      >
        <Box sx={{ 
          p: 0, 
          height: '100%',
          display: 'flex',
          flexDirection: 'column'
        }}>
          {/* Header */}
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
              <RocketLaunchIcon sx={{ mr: 1.5 }} />
              <Typography variant="h6">Global AI Reply Generator</Typography>
            </Box>
            <Box sx={{ display: 'flex', alignItems: 'center' }}>
              <FormControlLabel
                control={
                  <Switch 
                    checked={aiEnabled}
                    onChange={handleAiToggle}
                    color="default"
                    sx={{ '& .MuiSwitch-switchBase.Mui-checked': { color: 'white' } }}
                  />
                }
                label="AI Enabled"
              />
              <IconButton color="inherit" onClick={toggleDrawer} sx={{ ml: 1 }}>
                <CloseIcon />
              </IconButton>
            </Box>
          </Box>

          {/* Category Tabs */}
          <Box sx={{ borderBottom: 1, borderColor: 'divider' }}>
            <Tabs 
              value={selectedCategoryIndex} 
              onChange={handleCategoryChange}
              variant="scrollable"
              scrollButtons="auto"
              allowScrollButtonsMobile
            >
              {categories.map((category, index) => (
                <Tab key={index} label={category.name} />
              ))}
            </Tabs>
          </Box>

          {/* Main Content */}
          <Box sx={{ 
            p: 3, 
            opacity: aiEnabled ? 1 : 0.6, 
            transition: 'opacity 0.3s ease',
            bgcolor: 'background.paper',
            flexGrow: 1,
            overflow: 'auto'
          }}>
            <Grid container spacing={3}>
              {/* Left Panel - Configuration */}
              <Grid item xs={12} md={5}>
                <Card variant="outlined" sx={{ height: '100%', borderColor: aiEnabled ? 'primary.light' : 'grey.300' }}>
                  <CardContent>
                    <Typography variant="h6" sx={{ mb: 2, display: 'flex', alignItems: 'center' }}>
                      <SmartToyIcon sx={{ mr: 1 }} />
                      Configuration
                    </Typography>
                    
                    {selectedCategoryIndex >= 0 && categories[selectedCategoryIndex] && (
                      <FormControl fullWidth sx={{ mb: 3 }}>
                        <InputLabel id="post-select-label">Select a Post</InputLabel>
                        <Select
                          labelId="post-select-label"
                          id="post-select"
                          value={selectedPostId}
                          label="Select a Post"
                          onChange={handlePostSelect}
                          disabled={!aiEnabled}
                        >
                          {categories[selectedCategoryIndex].posts.map(post => (
                            <MenuItem key={post.id} value={post.id}>
                              {truncateContent(post.title || post.content)}
                            </MenuItem>
                          ))}
                        </Select>
                      </FormControl>
                    )}
                    
                    <Box sx={{ 
                      display: 'flex', 
                      alignItems: 'center',
                      mb: 2,
                      p: 1.5,
                      border: '1px solid',
                      borderColor: creativeMode && aiEnabled ? 'warning.light' : 'grey.300',
                      borderRadius: 1,
                      bgcolor: creativeMode && aiEnabled ? 'warning.50' : 'transparent'
                    }}>
                      <BoltIcon 
                        color={creativeMode && aiEnabled ? "warning" : "disabled"} 
                        sx={{ mr: 1 }} 
                      />
                      
                      <FormControlLabel
                        control={
                          <Switch 
                            checked={creativeMode}
                            onChange={handleCreativeModeToggle}
                            color="warning"
                            disabled={!aiEnabled}
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

                    <Divider sx={{ my: 2 }} />
                    
                    <Box sx={{ display: 'flex', justifyContent: 'center', mt: 2 }}>
                      <Button
                        variant="contained"
                        color={creativeMode ? "warning" : "primary"}
                        onClick={generateReply}
                        disabled={isLoading || !aiEnabled || !selectedPostId}
                        fullWidth
                        size="large"
                        sx={{ 
                          py: 1.5, 
                          borderRadius: 2,
                          position: 'relative',
                          boxShadow: 3
                        }}
                        startIcon={isLoading ? <CircularProgress size={20} color="inherit" /> : <AutorenewIcon />}
                      >
                        {isLoading ? 'Generating...' : 'Generate AI Reply'}
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
                  </CardContent>
                </Card>
              </Grid>
              
              {/* Right Panel - Generated Content */}
              <Grid item xs={12} md={7}>
                <Card variant="outlined" sx={{ 
                  height: '100%', 
                  display: 'flex', 
                  flexDirection: 'column',
                  borderColor: aiEnabled ? 'primary.light' : 'grey.300'
                }}>
                  <CardContent sx={{ flexGrow: 1 }}>
                    <Typography variant="h6" sx={{ mb: 2 }}>Generated Reply</Typography>
                    
                    {!selectedPostId && (
                      <Alert severity="info" sx={{ mb: 2 }}>
                        Please select a post to generate a reply.
                      </Alert>
                    )}
                    
                    <Box sx={{ 
                      p: 2, 
                      bgcolor: '#f5f5f5', 
                      borderRadius: 1, 
                      minHeight: '150px',
                      border: '1px solid',
                      borderColor: 'grey.300',
                      overflowY: 'auto',
                      maxHeight: '300px'
                    }}>
                      {generationResult ? (
                        <Typography>{generationResult}</Typography>
                      ) : (
                        <Typography color="text.secondary" sx={{ fontStyle: 'italic' }}>
                          {isLoading ? "Generating reply..." : "Generated content will appear here"}
                        </Typography>
                      )}
                    </Box>
                  </CardContent>
                  
                  <Box sx={{ p: 2, display: 'flex', justifyContent: 'flex-end' }}>
                    <Button 
                      variant="outlined" 
                      color="primary"
                      onClick={applyGeneratedReply}
                      disabled={!generationResult || !selectedPostId}
                      sx={{ mr: 1 }}
                    >
                      Apply to Reply Form
                    </Button>
                    <Button 
                      variant="contained" 
                      color="primary"
                      onClick={toggleDrawer}
                    >
                      Close
                    </Button>
                  </Box>
                </Card>
              </Grid>
            </Grid>
          </Box>
        </Box>
      </Drawer>
    </>
  );
};

export default GlobalAIReplyGenerator;