import { useState, useEffect } from 'react';
import { 
  Box, Typography, Paper, Table, TableBody, TableCell, 
  TableContainer, TableHead, TableRow, Button, Chip,
  Snackbar, Alert, Tabs, Tab, CircularProgress
} from '@mui/material';

const AdminDashboard = () => {
  const [users, setUsers] = useState([]);
  const [alert, setAlert] = useState({ open: false, message: '', severity: 'info' });
  const [tabValue, setTabValue] = useState(0);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadUsers = () => {
      try {
        const storedUsers = JSON.parse(localStorage.getItem('users')) || [];
        setUsers(storedUsers);
      } catch (error) {
        setAlert({ open: true, message: 'Error loading users', severity: 'error' });
      } finally {
        setLoading(false);
      }
    };
    loadUsers();
  }, []);

  const handleUserUpdate = (email, updates) => {
    const updatedUsers = users.map(user => 
      user.email === email ? { ...user, ...updates } : user
    );
    
    localStorage.setItem('users', JSON.stringify(updatedUsers));
    setUsers(updatedUsers);
  };

  const handleApproval = (email, approve) => {
    handleUserUpdate(email, { isApproved: approve });
    setAlert({
      open: true,
      message: `User ${approve ? 'approved' : 'rejected'} successfully`,
      severity: approve ? 'success' : 'info'
    });
  };

  const handleEnableUser = (email, enable) => {
    handleUserUpdate(email, { enabled: enable });
    setAlert({
      open: true,
      message: `User ${enable ? 'enabled' : 'disabled'} successfully`,
      severity: 'success'
    });
  };

  return (
    <Box sx={{ p: 3 }}>
      <Typography variant="h4" gutterBottom sx={{ mb: 3 }}>
        User Management Dashboard
      </Typography>

      <Tabs value={tabValue} onChange={(e, newValue) => setTabValue(newValue)} sx={{ mb: 3 }}>
        <Tab label="Pending Approvals" />
        <Tab label="All Users" />
      </Tabs>

      {loading ? (
        <CircularProgress />
      ) : (
        <TableContainer component={Paper}>
          <Table>
            <TableHead>
              <TableRow>
                <TableCell>Name</TableCell>
                <TableCell>Email</TableCell>
                <TableCell>Role</TableCell>
                <TableCell>Status</TableCell>
                <TableCell>Actions</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {users
                .filter(user => 
                  tabValue === 0 ? !user.isApproved : true
                )
                .map((user) => (
                  <TableRow key={user.email}>
                    <TableCell>{user.fullName}</TableCell>
                    <TableCell>{user.email}</TableCell>
                    <TableCell>{user.userType}</TableCell>
                    <TableCell>
                      <Chip 
                        label={user.isApproved ? 'Approved' : 'Pending'} 
                        color={user.isApproved ? 'success' : 'warning'} 
                        sx={{ mr: 1 }}
                      />
                      <Chip
                        label={user.enabled ? 'Enabled' : 'Disabled'}
                        color={user.enabled ? 'success' : 'error'}
                      />
                    </TableCell>
                    <TableCell>
                      {!user.isApproved && (
                        <>
                          <Button 
                            variant="contained" 
                            color="success" 
                            sx={{ mr: 1 }}
                            onClick={() => handleApproval(user.email, true)}
                          >
                            Approve
                          </Button>
                          <Button 
                            variant="outlined" 
                            color="error"
                            onClick={() => handleApproval(user.email, false)}
                          >
                            Reject
                          </Button>
                        </>
                      )}
                      <Button
                        variant="outlined"
                        color={user.enabled ? 'error' : 'success'}
                        sx={{ ml: 1 }}
                        onClick={() => handleEnableUser(user.email, !user.enabled)}
                      >
                        {user.enabled ? 'Disable' : 'Enable'}
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
            </TableBody>
          </Table>
        </TableContainer>
      )}

      <Snackbar
        open={alert.open}
        autoHideDuration={4000}
        onClose={() => setAlert(prev => ({ ...prev, open: false }))}
      >
        <Alert severity={alert.severity}>
          {alert.message}
        </Alert>
      </Snackbar>
    </Box>
  );
};

export default AdminDashboard;