import React, { useState, useEffect } from 'react';
import { 
  Container, Typography, Box, Button, TextField, 
  Table, TableBody, TableCell, TableContainer, 
  TableHead, TableRow, Paper, CircularProgress,
  IconButton, Card, CardContent, Divider, Chip,
  MenuItem, Select, FormControl, InputLabel
} from '@mui/material';
import RefreshIcon from '@mui/icons-material/Refresh';
import SearchIcon from '@mui/icons-material/Search';
import DeleteIcon from '@mui/icons-material/Delete';
import { deletePost } from '../utils/elasticsearchApi';

const ElasticsearchViewer = () => {
  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('all');
  const [categories, setCategories] = useState([]);
  const [stats, setStats] = useState({
    total: 0,
    categories: 0,
    latestPost: null
  });

  // Load posts on component mount
  useEffect(() => {
    fetchPosts();
  }, []);

  // Fetch posts from Elasticsearch
  const fetchPosts = async (query = '', category = 'all') => {
    setLoading(true);
    setError(null);
    try {
      // Build the URL based on filters
      let url = 'http://localhost:5000/api/posts';
      
      // Add query parameters if needed
      const params = [];
      if (query) params.push(`query=${encodeURIComponent(query)}`);
      if (category && category !== 'all') params.push(`category=${encodeURIComponent(category)}`);
      
      if (params.length > 0) {
        url += '?' + params.join('&');
      }
      
      const response = await fetch(url);
      
      if (!response.ok) {
        throw new Error(`Error ${response.status}: ${response.statusText}`);
      }
      
      const data = await response.json();
      setPosts(data);
      
      // Extract categories
      const uniqueCategories = [...new Set(data.map(post => post.category))];
      setCategories(uniqueCategories);
      
      // Set stats
      setStats({
        total: data.length,
        categories: uniqueCategories.length,
        latestPost: data.length > 0 ? new Date(Math.max(...data.map(post => new Date(post.date)))) : null
      });
      
    } catch (err) {
      console.error('Error fetching posts:', err);
      setError(err.message || 'Failed to fetch posts from Elasticsearch');
    } finally {
      setLoading(false);
    }
  };

  // Handle search submit
  const handleSearch = (e) => {
    e.preventDefault();
    fetchPosts(searchQuery, categoryFilter);
  };

  // Handle category filter change
  const handleCategoryChange = (e) => {
    setCategoryFilter(e.target.value);
    fetchPosts(searchQuery, e.target.value);
  };

  // Handle post deletion
  const handleDeletePost = async (id) => {
    if (!window.confirm('Are you sure you want to delete this post?')) {
      return;
    }
    
    try {
      setLoading(true);
      await deletePost(id);
      
      // Refresh posts after deletion
      await fetchPosts(searchQuery, categoryFilter);
      
    } catch (err) {
      console.error('Error deleting post:', err);
      alert(`Failed to delete post: ${err.message}`);
    } finally {
      setLoading(false);
    }
  };

  // Format date for display
  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    return new Date(dateString).toLocaleString();
  };

  return (
    <Container maxWidth="lg" sx={{ mt: 4, mb: 4 }}>
      <Typography variant="h4" gutterBottom>
        Elasticsearch Data Explorer
      </Typography>
      
      {/* Stats Card */}
      <Card sx={{ mb: 3 }}>
        <CardContent>
          <Typography variant="h6" gutterBottom>Statistics</Typography>
          <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 3 }}>
            <Box>
              <Typography variant="subtitle2" color="text.secondary">
                Total Posts
              </Typography>
              <Typography variant="h5">{stats.total}</Typography>
            </Box>
            <Divider orientation="vertical" flexItem />
            <Box>
              <Typography variant="subtitle2" color="text.secondary">
                Categories
              </Typography>
              <Typography variant="h5">{stats.categories}</Typography>
            </Box>
            <Divider orientation="vertical" flexItem />
            <Box>
              <Typography variant="subtitle2" color="text.secondary">
                Latest Post
              </Typography>
              <Typography variant="h5">
                {stats.latestPost ? formatDate(stats.latestPost) : 'None'}
              </Typography>
            </Box>
          </Box>
        </CardContent>
      </Card>
      
      {/* Controls */}
      <Box sx={{ mb: 3, display: 'flex', gap: 2, flexWrap: 'wrap' }}>
        <form onSubmit={handleSearch} style={{ display: 'flex', flexGrow: 1 }}>
          <TextField
            label="Search Posts"
            variant="outlined"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            fullWidth
            size="small"
          />
          <Button 
            type="submit" 
            variant="contained" 
            sx={{ ml: 1 }}
            startIcon={<SearchIcon />}
          >
            Search
          </Button>
        </form>
        
        <FormControl sx={{ minWidth: 200 }}>
          <InputLabel id="category-filter-label">Filter by Category</InputLabel>
          <Select
            labelId="category-filter-label"
            value={categoryFilter}
            label="Filter by Category"
            onChange={handleCategoryChange}
            size="small"
          >
            <MenuItem value="all">All Categories</MenuItem>
            {categories.map(category => (
              <MenuItem key={category} value={category}>{category}</MenuItem>
            ))}
          </Select>
        </FormControl>
        
        <Button 
          variant="outlined" 
          onClick={() => fetchPosts()}
          startIcon={<RefreshIcon />}
        >
          Refresh
        </Button>
      </Box>
      
      {/* Error message */}
      {error && (
        <Box sx={{ mb: 2, p: 2, bgcolor: '#ffebee', borderRadius: 1 }}>
          <Typography color="error">{error}</Typography>
        </Box>
      )}
      
      {/* Loading indicator */}
      {loading && (
        <Box sx={{ display: 'flex', justifyContent: 'center', my: 4 }}>
          <CircularProgress />
        </Box>
      )}
      
      {/* Results */}
      {!loading && (
        <>
          {posts.length === 0 ? (
            <Box sx={{ textAlign: 'center', py: 4 }}>
              <Typography variant="h6" color="text.secondary">
                No posts found in Elasticsearch
              </Typography>
            </Box>
          ) : (
            <TableContainer component={Paper}>
              <Table>
                <TableHead>
                  <TableRow>
                    <TableCell>ID</TableCell>
                    <TableCell>Title</TableCell>
                    <TableCell>Category</TableCell>
                    <TableCell>Author</TableCell>
                    <TableCell>Date</TableCell>
                    <TableCell>Actions</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {posts.map((post) => (
                    <TableRow key={post.id}>
                      <TableCell>{post.id}</TableCell>
                      <TableCell>
                        <Typography variant="body2" fontWeight="bold">
                          {post.title}
                        </Typography>
                        {post.description && (
                          <Typography variant="caption" display="block" color="text.secondary">
                            {post.description.length > 60 
                              ? post.description.substring(0, 60) + '...' 
                              : post.description}
                          </Typography>
                        )}
                      </TableCell>
                      <TableCell>
                        <Chip label={post.category} size="small" />
                      </TableCell>
                      <TableCell>{post.author}</TableCell>
                      <TableCell>{formatDate(post.date)}</TableCell>
                      <TableCell>
                        <IconButton 
                          size="small" 
                          color="error"
                          onClick={() => handleDeletePost(post.id)}
                        >
                          <DeleteIcon />
                        </IconButton>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
          )}
        </>
      )}
    </Container>
  );
};

export default ElasticsearchViewer;