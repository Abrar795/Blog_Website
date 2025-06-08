import React, { useState } from 'react';
import { TextField, InputAdornment, IconButton, Paper, List, ListItem, ListItemText, Typography, Box } from '@mui/material';
import SearchIcon from '@mui/icons-material/Search';

interface SearchBarProps {
  onSearch: (query: string) => void;
  searchResults: any[];
  isSearching: boolean;
  navigateToPost: (category: string, postId: number) => void;
}

const SearchBar: React.FC<SearchBarProps> = ({ 
  onSearch, 
  searchResults, 
  isSearching,
  navigateToPost 
}) => {
  const [query, setQuery] = useState('');
  const [showResults, setShowResults] = useState(false);

  const handleSearch = () => {
    if (query.trim()) {
      onSearch(query);
      setShowResults(true);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleSearch();
    }
  };

  const handleResultClick = (category: string, postId: number) => {
    navigateToPost(category, postId);
    setShowResults(false);
  };

  return (
    <Box sx={{ position: 'relative', width: '100%', maxWidth: 500, mb: 3 }}>
      <TextField
        fullWidth
        variant="outlined"
        placeholder="Search posts..."
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        onKeyPress={handleKeyPress}
        InputProps={{
          endAdornment: (
            <InputAdornment position="end">
              <IconButton onClick={handleSearch} edge="end">
                <SearchIcon />
              </IconButton>
            </InputAdornment>
          ),
        }}
      />
      
      {showResults && (
        <Paper 
          elevation={3} 
          sx={{ 
            position: 'absolute', 
            width: '100%', 
            mt: 0.5, 
            maxHeight: 300, 
            overflow: 'auto',
            zIndex: 10 
          }}
        >
          {isSearching ? (
            <Box sx={{ p: 2, textAlign: 'center' }}>
              <Typography>Searching...</Typography>
            </Box>
          ) : searchResults.length > 0 ? (
            <List>
              {searchResults.map((result) => (
                <ListItem 
                  button 
                  key={result.id}
                  onClick={() => handleResultClick(result.category, result.id)}
                >
                  <ListItemText 
                    primary={result.title} 
                    secondary={
                      <>
                        <Typography component="span" variant="body2" color="textPrimary">
                          {result.category}
                        </Typography>
                        {" - " + result.description}
                      </>
                    } 
                  />
                </ListItem>
              ))}
            </List>
          ) : (
            <Box sx={{ p: 2, textAlign: 'center' }}>
              <Typography>No results found</Typography>
            </Box>
          )}
        </Paper>
      )}
    </Box>
  );
};

export default SearchBar;