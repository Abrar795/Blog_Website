const API_BASE_URL = 'http://localhost:5000/api';

// Fetch all posts
export const fetchAllPosts = async () => {
  try {
    const response = await fetch(`${API_BASE_URL}/posts`);
    if (!response.ok) {
      throw new Error(`Error: ${response.status}`);
    }
    return await response.json();
  } catch (error) {
    console.error('Error fetching posts:', error);
    throw error;
  }
};

// Fetch posts by category
export const fetchPostsByCategory = async (category) => {
  try {
    const response = await fetch(`${API_BASE_URL}/posts?category=${encodeURIComponent(category)}`);
    if (!response.ok) {
      throw new Error(`Error: ${response.status}`);
    }
    return await response.json();
  } catch (error) {
    console.error(`Error fetching posts for category ${category}:`, error);
    throw error;
  }
};

// Create a new post
export const createPost = async (post) => {
  try {
    const response = await fetch(`${API_BASE_URL}/posts`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(post),
    });
    
    if (!response.ok) {
      throw new Error(`Error: ${response.status}`);
    }
    
    return await response.json();
  } catch (error) {
    console.error('Error creating post:', error);
    throw error;
  }
};

// Delete a post
export const deletePost = async (postId) => {
  try {
    const response = await fetch(`${API_BASE_URL}/posts/${postId}`, {
      method: 'DELETE',
    });
    
    if (!response.ok) {
      throw new Error(`Error: ${response.status}`);
    }
    
    return await response.json();
  } catch (error) {
    console.error('Error deleting post:', error);
    throw error;
  }
};

// Search posts by query
export const searchPosts = async (query) => {
  try {
    const response = await fetch(`${API_BASE_URL}/posts?query=${encodeURIComponent(query)}`);
    if (!response.ok) {
      throw new Error(`Error: ${response.status}`);
    }
    return await response.json();
  } catch (error) {
    console.error('Error searching posts:', error);
    throw error;
  }
};