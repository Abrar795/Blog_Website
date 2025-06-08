import * as React from "react";
import { Dialog, DialogTitle, DialogContent, TextField, Button, DialogActions, MenuItem, Select, InputLabel, FormControl, Container, Typography } from "@mui/material";

const categories = [
  "Academic Resources",
  "Career Services",
  "Campus",
  "Culture",
  "Local Community Resources",
  "Social",
  "Sports",
  "Health and Wellness",
  "Technology",
  "Travel",
  "Alumni",
];

const CreatePostModal = ({ open, handleClose, onCreate }) => {
  const [title, setTitle] = React.useState("");
  const [content, setContent] = React.useState("");
  const [category, setCategory] = React.useState(categories[0]);

  const handleSubmit = () => {
    if (!title || !content || !category) {
      alert("All fields are mandatory!");
      return;
    }

    const newPost = {
      id: Date.now(),
      title,
      content,
      category,
      replies: [],
    };

    onCreate(newPost);
  };

  return (
    <Dialog open={open} onClose={handleClose}>
      <DialogTitle>Create Blog Post</DialogTitle>
      <DialogContent>
        <TextField
          label="Title"
          fullWidth
          margin="normal"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
        />
        <TextField
          label="Content"
          fullWidth
          margin="normal"
          multiline
          rows={4}
          value={content}
          onChange={(e) => setContent(e.target.value)}
        />
        <FormControl fullWidth margin="normal">
          <InputLabel>Category</InputLabel>
          <Select
            value={category}
            onChange={(e) => setCategory(e.target.value)}
          >
            {categories.map((category) => (
              <MenuItem key={category} value={category}>
                {category}
              </MenuItem>
            ))}
          </Select>
        </FormControl>
      </DialogContent>
      <DialogActions>
        <Button onClick={handleClose} color="secondary">Cancel</Button>
        <Button variant="contained" color="primary" onClick={handleSubmit}>
          Create
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default CreatePostModal;

export function Post() {
  return (
    <Container maxWidth="md">
      <Typography variant="h2" gutterBottom>
        Title of a longer featured blog post
      </Typography>
      <Typography variant="h5" paragraph>
        Multiple lines of text that form the lede, informing new readers quickly and efficiently about what's most interesting in this post's contents.
      </Typography>
      <Typography variant="body1" paragraph>
        This is the full content of the post. Here you can add more detailed information about the topic, including images, links, and other media.
      </Typography>
    </Container>
  );
}