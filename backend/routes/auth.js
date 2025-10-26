// routes/api/auth.js
const express = require('express');
const router = express.Router();
const axios = require('axios');

// Firebase Realtime Database URL
//const FIREBASE_URL = 'https://medtest-ai-default-rtdb.firebaseio.com/users.json';
const FIREBASE_URL = 'https://med-test-269d5-default-rtdb.firebaseio.com/users.json';

// POST /signup route
router.post('/signup', async function(req, res) {
  const { name, email, password } = req.body;
  
  console.log('Signup attempt:', { name, email });
  
  // Basic validation
  if (!name || !email || !password) {
    return res.status(400).json({ error: 'All fields are required.' });
  }

  try {
    // Step 1: Fetch all existing users
    const getResponse = await axios.get(FIREBASE_URL);
    const users = getResponse.data;
    
    // Step 2: Check if email already exists
    const emailExists = users && Object.values(users).some(user => user.email === email);
    
    if (emailExists) {
      return res.status(409).json({ error: 'User with this email already exists.' });
    }
    
    // Step 3: Create new user
    const postResponse = await axios.post(FIREBASE_URL, { name, email, password });
    
    // Step 4: Automatically log in the user after signup
    req.session.user = { 
      email: email, 
      name: name 
    };
    
    // Save session explicitly
    req.session.save((err) => {
      if (err) {
        console.error('Session save error after signup:', err);
        return res.status(500).json({ error: 'Session error' });
      }
      
      res.status(201).json({
        message: 'User signed up successfully!',
        user: req.session.user,
        data: postResponse.data
      });
    });
    
  } catch (error) {
    console.error('Firebase Error:', error.message);
    res.status(500).json({ error: 'Failed to sign up user.' });
  }
});

// POST /login route
router.post('/login', async function(req, res) {
  const { email, password } = req.body;
  
  console.log('Login attempt:', { email });
  
  if (!email || !password) {
    return res.status(400).json({ error: 'Email and password are required.' });
  }

  try {
    const response = await axios.get(FIREBASE_URL);
    const users = response.data;

    if (!users) {
      return res.status(404).json({ error: 'No users found.' });
    }

    // Find user with matching credentials
    const userEntry = Object.entries(users).find(([key, user]) => 
      user.email === email && user.password === password
    );

    if (!userEntry) {
      return res.status(401).json({ error: 'Invalid email or password.' });
    }

    const [userId, user] = userEntry;

    // Store user in session
    req.session.user = { 
      id: userId,
      email: user.email, 
      name: user.name 
    };

    // Save session explicitly
    req.session.save((err) => {
      if (err) {
        console.error('Session save error:', err);
        return res.status(500).json({ error: 'Session error' });
      }
      
      console.log('Login successful, session saved:', req.session.user);
      
      res.status(200).json({
        message: 'Login successful!',
        user: req.session.user,
      });
    });

  } catch (error) {
    console.error('Firebase Error:', error.message);
    res.status(500).json({ error: 'Failed to log in.' });
  }
});

// POST /google-signup route - Handle Google OAuth signup
router.post('/google-signup', async function(req, res) {
  const { uid, name, email, photoURL } = req.body;
  
  console.log('Google signup attempt:', { uid, name, email });
  
  // Basic validation
  if (!uid || !name || !email) {
    return res.status(400).json({ 
      message: 'Missing required Google auth data (uid, name, email)' 
    });
  }

  try {
    // Step 1: Fetch all existing users
    const getResponse = await axios.get(FIREBASE_URL);
    const users = getResponse.data;
    
    // Step 2: Check if user already exists (by email or Firebase UID)
    const existingUser = users && Object.entries(users).find(([key, user]) => 
      user.email === email || user.firebaseUid === uid
    );
    
    if (existingUser) {
      // User already exists, treat as login
      const [userId, userData] = existingUser;
      
      req.session.user = { 
        id: userId,
        email: userData.email, 
        name: userData.name,
        photoURL: userData.photoURL || photoURL
      };
      
      req.session.save((err) => {
        if (err) {
          console.error('Session save error after Google login:', err);
          return res.status(500).json({ message: 'Session error' });
        }
        
        res.status(200).json({
          message: 'Google login successful (existing user)!',
          user: req.session.user,
        });
      });
      
      return;
    }
    
    // Step 3: Create new user with Google data
    const newUser = {
      name,
      email,
      firebaseUid: uid,
      photoURL: photoURL || null,
      authProvider: 'google',
      createdAt: new Date().toISOString()
    };
    
    const postResponse = await axios.post(FIREBASE_URL, newUser);
    
    // Step 4: Log in the user after signup
    req.session.user = { 
      email: email, 
      name: name,
      photoURL: photoURL
    };
    
    req.session.save((err) => {
      if (err) {
        console.error('Session save error after Google signup:', err);
        return res.status(500).json({ message: 'Session error' });
      }
      
      res.status(201).json({
        message: 'Google signup successful!',
        user: req.session.user,
        data: postResponse.data
      });
    });
    
  } catch (error) {
    console.error('Google Signup Error:', error.message);
    res.status(500).json({ 
      message: 'Failed to create account with Google.',
      error: error.message 
    });
  }
});

// POST /google-login route - Handle Google OAuth login
router.post('/google-login', async function(req, res) {
  const { uid, name, email, photoURL } = req.body;
  
  console.log('Google login attempt:', { uid, name, email });
  
  if (!uid || !email) {
    return res.status(400).json({ 
      message: 'Missing required Google auth data (uid, email)' 
    });
  }

  try {
    const response = await axios.get(FIREBASE_URL);
    const users = response.data;

    if (!users) {
      return res.status(404).json({ 
        message: 'No users found. Please sign up first.' 
      });
    }

    // Find user with matching email or Firebase UID
    const userEntry = Object.entries(users).find(([key, user]) => 
      user.email === email || user.firebaseUid === uid
    );

    if (!userEntry) {
      return res.status(404).json({ 
        message: 'No account found with this Google account. Please sign up first.' 
      });
    }

    const [userId, user] = userEntry;

    // Update user's Firebase UID if not already set
    if (!user.firebaseUid) {
      try {
        //const updateUrl = `https://medtest-ai-default-rtdb.firebaseio.com/users/${userId}.json`;
        const updateUrl = `https://med-test-269d5-default-rtdb.firebaseio.com/users/${userId}.json`;
        await axios.patch(updateUrl, { 
          firebaseUid: uid,
          photoURL: photoURL || user.photoURL,
          lastLogin: new Date().toISOString()
        });
      } catch (updateError) {
        console.error('Failed to update user Firebase UID:', updateError.message);
      }
    }

    // Store user in session
    req.session.user = { 
      id: userId,
      email: user.email, 
      name: user.name,
      photoURL: photoURL || user.photoURL
    };

    req.session.save((err) => {
      if (err) {
        console.error('Session save error after Google login:', err);
        return res.status(500).json({ message: 'Session error' });
      }
      
      console.log('Google login successful, session saved:', req.session.user);
      
      res.status(200).json({
        message: 'Google login successful!',
        user: req.session.user,
      });
    });

  } catch (error) {
    console.error('Google Login Error:', error.message);
    res.status(500).json({ 
      message: 'Failed to log in with Google.',
      error: error.message 
    });
  }
});

// GET /check route - Check if user is logged in
router.get('/check', (req, res) => {
  console.log('Auth check - Session ID:', req.sessionID);
  console.log('Auth check - Session user:', req.session.user);
  
  if (req.session && req.session.user) {
    return res.json({ 
      loggedIn: true, 
      user: req.session.user 
    });
  } else {
    return res.json({ 
      loggedIn: false 
    });
  }
});

// POST /logout route
router.post('/logout', (req, res) => {
  console.log('Logout attempt for user:', req.session.user);
  
  req.session.destroy((err) => {
    if (err) {
      console.error('Session destroy error:', err);
      return res.status(500).json({ error: 'Failed to logout' });
    }
    
    res.clearCookie('connect.sid'); // Clear the session cookie
    res.json({ message: 'Logged out successfully' });
  });
});

module.exports = router;