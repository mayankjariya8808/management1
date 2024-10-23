import React, { useState, useEffect } from 'react';
import { TextField, Button, Box, Typography, Link, Modal } from '@mui/material';
import { useNavigate } from 'react-router-dom';

const Login = () => {
  const staticUsername = 'yugdeep';
  
  // Retrieve password from localStorage or use the initial static password
  const initialPassword = localStorage.getItem('password') || '989814yug';
  
  const [password, setPassword] = useState(initialPassword);
  const [username, setUsername] = useState('');
  const [inputPassword, setInputPassword] = useState('');
  const [openModal, setOpenModal] = useState(false);
  const [newPassword, setNewPassword] = useState('');
  const navigate = useNavigate();

  // Store the password in localStorage when it's changed
  useEffect(() => {
    localStorage.setItem('password', password);
  }, [password]);

  // Handle login submission
  const handleLogin = (e) => {
    e.preventDefault();

    if (username === staticUsername && inputPassword === password) {
      alert('Login successful!');
      navigate('/dashboard');
    } else {
      alert('Invalid username or password');
    }
  };

  // Open the modal for password reset
  const handleForgotPassword = () => {
    setOpenModal(true);
  };

  // Close the modal and reset the new password input field
  const handleCloseModal = () => {
    setOpenModal(false);
    setNewPassword('');
  };

  // Handle the password reset process
  const handleResetPassword = () => {
    if (newPassword.trim()) {
      setPassword(newPassword); // Update the state and trigger useEffect to store in localStorage
      handleCloseModal();
      alert('Password has been reset successfully. Please use the new password to log in.');
    } else {
      alert('Password cannot be empty.');
    }
  };

  return (
    <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh' }}>
      <Box sx={{ width: 300, padding: 3, border: '1px solid #ccc', borderRadius: 4 }}>
        <Typography variant="h5" align="center" gutterBottom>
          Login
        </Typography>
        <form onSubmit={handleLogin}>
          <TextField
            label="Username"
            variant="outlined"
            fullWidth
            margin="normal"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            placeholder="Enter yugdeep"
          />
          <TextField
            label="Password"
            variant="outlined"
            type="password"
            fullWidth
            margin="normal"
            value={inputPassword}
            onChange={(e) => setInputPassword(e.target.value)}
            placeholder="Enter password"
          />
          <Button type="submit" variant="contained" color="primary" fullWidth sx={{ marginTop: 2 }}>
            Login
          </Button>
          <Box sx={{ textAlign: 'center', marginTop: 2 }}>
            <Link component="button" variant="body2" onClick={handleForgotPassword}>
              Forgot Password?
            </Link>
          </Box>
        </form>
      </Box>

      {/* Modal for resetting the password */}
      <Modal
        open={openModal}
        onClose={handleCloseModal}
        aria-labelledby="forgot-password-modal"
        aria-describedby="reset-password-modal"
      >
        <Box
          sx={{
            position: 'absolute',
            top: '50%',
            left: '50%',
            transform: 'translate(-50%, -50%)',
            width: 300,
            bgcolor: 'background.paper',
            boxShadow: 24,
            p: 4,
            borderRadius: 2,
          }}
        >
          <Typography variant="h6" component="h2" gutterBottom>
            Reset Password
          </Typography>
          <TextField
            label="New Password"
            type="password"
            fullWidth
            margin="normal"
            value={newPassword}
            onChange={(e) => setNewPassword(e.target.value)}
            placeholder="Enter new password"
          />
          <Button onClick={handleResetPassword} variant="contained" fullWidth sx={{ mt: 2 }}>
            Reset Password
          </Button>
        </Box>
      </Modal>
    </Box>
  );
};

export default Login;