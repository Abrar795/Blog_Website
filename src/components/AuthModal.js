import { Dialog, DialogTitle, DialogContent, TextField, Button, DialogActions, MenuItem, Select, InputLabel, FormControl } from "@mui/material";
import { useState } from "react";

const AuthModal = ({ open, handleClose, type, onLogin }) => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [fullName, setFullName] = useState("");
  const [userType, setUserType] = useState("Student");

  const handleSignUp = () => {
    if (!fullName || !email || !password || !userType) {
      alert("All fields are mandatory!");
      return;
    }

    const users = JSON.parse(localStorage.getItem("users")) || [];
    const existingUser = users.find(user => user.email === email);

    if (existingUser) {
      alert("User with this email already exists!");
      return;
    }

    // Generate a unique ID for the user
    const userId = Date.now().toString();

    const userDetails = {
      id: userId, // Add a unique ID
      fullName,
      email,
      password,
      userType,
      enabled: true,
    };

    users.push(userDetails);
    localStorage.setItem("users", JSON.stringify(users));

    // Initialize the user's subscriptions in localStorage
    localStorage.setItem(`subscriptions_${userId}`, JSON.stringify([]));

    alert("Sign-up successful!");
    handleClose();
  };

  const handleLogin = () => {
    const users = JSON.parse(localStorage.getItem("users")) || [];
    const storedDetails = users.find(user => user.email === email && user.password === password);

    if (email === "user1" && password === "abcd") {
      alert("Administrator login successful!");
      onLogin({ 
        id: "admin", // Hardcoded admin ID
        fullName: "Administrator", 
        email, 
        userType: "Administrator" 
      });
      managePermissions(true); // Pass true to indicate the hardcoded admin
    } else if (storedDetails) {
      if (storedDetails.enabled) {
        alert(`Login successful! User type: ${storedDetails.userType}`);
        onLogin(storedDetails); // Pass user details to onLogin
      } else {
        alert("Account is disabled!");
      }
    } else {
      alert("Invalid credentials!");
    }
    handleClose();
  };

  const handleSubmit = () => {
    if (type === "signup") {
      handleSignUp();
    } else {
      handleLogin();
    }
  };

  const managePermissions = (isHardcodedAdmin) => {
    const users = JSON.parse(localStorage.getItem("users")) || [];
    const userEmails = users.map(user => user.email).join("\n");
    const emailToToggle = prompt(`Enter the email of the user to enable/disable:\n${userEmails}`);
    const userIndex = users.findIndex(user => user.email === emailToToggle);

    if (userIndex !== -1) {
      const userToToggle = users[userIndex];
      if (isHardcodedAdmin) {
        // Hardcoded admin can enable/disable any user
        userToToggle.enabled = !userToToggle.enabled;
        localStorage.setItem("users", JSON.stringify(users));
        alert(`User ${userToToggle.enabled ? "enabled" : "disabled"} successfully!`);
      } else {
        // New admins can only enable/disable non-admin users
        if (userToToggle.userType === "Administrator") {
          alert("You cannot enable/disable other Administrators!");
        } else {
          userToToggle.enabled = !userToToggle.enabled;
          localStorage.setItem("users", JSON.stringify(users));
          alert(`User ${userToToggle.enabled ? "enabled" : "disabled"} successfully!`);
        }
      }
    } else {
      alert("User not found!");
    }
  };

  return (
    <Dialog open={open} onClose={handleClose}>
      <DialogTitle>{type === "login" ? "Login" : "Sign Up"}</DialogTitle>
      <DialogContent>
        {type === "signup" && (
          <>
            <TextField
              label="Full Name"
              fullWidth
              margin="normal"
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
            />
            <FormControl fullWidth margin="normal">
              <InputLabel>User Type</InputLabel>
              <Select
                value={userType}
                onChange={(e) => setUserType(e.target.value)}
              >
                <MenuItem value="Student">Student</MenuItem>
                <MenuItem value="Faculty">Faculty</MenuItem>
                <MenuItem value="Staff">Staff</MenuItem>
                <MenuItem value="Moderator">Moderator</MenuItem>
                <MenuItem value="Administrator">Administrator</MenuItem>
              </Select>
            </FormControl>
          </>
        )}
        <TextField
          label="Email"
          fullWidth
          margin="normal"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
        />
        <TextField
          label="Password"
          type="password"
          fullWidth
          margin="normal"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
        />
      </DialogContent>
      <DialogActions>
        <Button onClick={handleClose} color="secondary">Cancel</Button>
        <Button variant="contained" color="primary" onClick={handleSubmit}>
          {type === "login" ? "Login" : "Sign Up"}
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default AuthModal;