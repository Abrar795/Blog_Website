import React from 'react';
import { Modal, Box, Typography, TextField, Button, FormControl, InputLabel, Select, MenuItem } from '@mui/material';

const modalStyle = {
  position: 'absolute',
  top: '50%',
  left: '50%',
  transform: 'translate(-50%, -50%)',
  width: 400,
  bgcolor: 'background.paper',
  boxShadow: 24,
  p: 4,
};

interface CreatePostModalProps {
  open: boolean;
  onClose: () => void;
  formData: {
    title: string;
    description: string;
    content: string;
    category: string;
  };
  handleChange: (event: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | { name?: string; value: unknown }>) => void;
  handleSubmit: (event: React.FormEvent<HTMLFormElement>) => void;
  sections: { title: string }[];
  isLoading?: boolean;
}

const CreatePostModal: React.FC<CreatePostModalProps> = ({ open, onClose, formData, handleChange, handleSubmit, sections, isLoading }) => {
  return (
    <Modal
      open={open}
      onClose={onClose}
      aria-labelledby="modal-modal-title"
      aria-describedby="modal-modal-description"
    >
      <Box sx={modalStyle}>
        <Typography id="modal-modal-title" variant="h6" component="h2">
          Create New Post
        </Typography>
        <Box component="form" onSubmit={handleSubmit} sx={{ mt: 2 }}>
          <TextField
            fullWidth
            label="Post Title"
            name="title"
            value={formData.title}
            onChange={handleChange}
            margin="normal"
            required
          />
          <TextField
            fullWidth
            label="Short Description"
            name="description"
            value={formData.description}
            onChange={handleChange}
            margin="normal"
            required
          />
          <TextField
            fullWidth
            label="Post Content"
            name="content"
            value={formData.content}
            onChange={handleChange}
            margin="normal"
            required
            multiline
            rows={4}
          />
          <FormControl fullWidth margin="normal" required>
            <InputLabel id="category-label">Category</InputLabel>
            <Select
              labelId="category-label"
              name="category"
              value={formData.category}
              onChange={handleChange}
              label="Category"
            >
              {sections.map((section) => (
                <MenuItem key={section.title} value={section.title}>
                  {section.title}
                </MenuItem>
              ))}
            </Select>
          </FormControl>
          <Button 
            type="submit" 
            variant="contained" 
            color="primary"
            disabled={isLoading}
            sx={{ mt: 2 }}
          >
            {isLoading ? 'Creating...' : 'Create Post'}
          </Button>
        </Box>
      </Box>
    </Modal>
  );
};

export default CreatePostModal;