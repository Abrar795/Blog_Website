import React from 'react';
import { Modal, Box, Typography, FormControl, InputLabel, Select, MenuItem, Button } from '@mui/material';

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

interface DeletePostModalProps {
  open: boolean;
  onClose: () => void;
  deleteCategory: string;
  handleDeleteCategoryChange: (event: React.ChangeEvent<{ name?: string; value: unknown }>) => void;
  postsByCategory: { [key: string]: { id: string; title: string; description: string }[] };
  handleDeletePost: (postId: string) => void;
  sections: { title: string }[];
  isLoading?: boolean;
}

const DeletePostModal: React.FC<DeletePostModalProps> = (props) => {
  return (
    <Modal
      open={props.open}
      onClose={props.onClose}
      aria-labelledby="modal-modal-title"
      aria-describedby="modal-modal-description"
    >
      <Box sx={modalStyle}>
        <Typography id="modal-modal-title" variant="h6" component="h2">
          Delete Post
        </Typography>
        <FormControl fullWidth margin="normal" required>
          <InputLabel id="delete-category-label">Category</InputLabel>
          <Select
            labelId="delete-category-label"
            name="deleteCategory"
            value={props.deleteCategory}
            onChange={props.handleDeleteCategoryChange}
            label="Category"
          >
            {props.sections.map((section) => (
              <MenuItem key={section.title} value={section.title}>
                {section.title}
              </MenuItem>
            ))}
          </Select>
        </FormControl>
        {props.deleteCategory && props.postsByCategory[props.deleteCategory] && (
          <Box sx={{ mt: 2 }}>
            {props.postsByCategory[props.deleteCategory].map((post) => (
              <Box key={post.id} sx={{ mb: 2 }}>
                <Typography variant="h6">{post.title}</Typography>
                <Typography variant="body2" color="text.secondary">
                  {post.description}
                </Typography>
                <Button 
                  onClick={() => props.handleDeletePost(post.id)} 
                  color="error"
                  disabled={props.isLoading}
                >
                  {props.isLoading ? 'Deleting...' : 'Delete'}
                </Button>
              </Box>
            ))}
          </Box>
        )}
      </Box>
    </Modal>
  );
};

export default DeletePostModal;