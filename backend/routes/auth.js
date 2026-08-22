const express = require('express');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { OAuth2Client } = require('google-auth-library');
const User = require('../models/user');
const { authenticate } = require('../middleware/auth');
const config = require('../config/config');
require('dotenv').config();

const router = express.Router();
const googleClient = new OAuth2Client(process.env.GOOGLE_CLIENT_ID);

// Register
router.post('/register', async (req, res) => {
  try {
    const name = req.body.name?.trim();
    const email = req.body.email?.trim().toLowerCase();
    const { password } = req.body;

    if (!name || !email || !password) {
      return res.status(400).json({ success: false, message: 'Name, email and password are required' });
    }

    if (!/^\S+@\S+\.\S+$/.test(email)) {
      return res.status(400).json({ success: false, message: 'Please enter a valid email address' });
    }

    if (password.length < 8) {
      return res.status(400).json({ success: false, message: 'Password must be at least 8 characters' });
    }

    console.log('📝 Registration attempt:', email);

    // Check if user already exists
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(400).json({
        success: false,
        message: 'User already exists with this email'
      });
    }

    // Create user
    const user = new User({
      name,
      email,
      password // Let the model's pre-save hook handle hashing
    });

    await user.save();

    // Generate JWT token
    const token = jwt.sign(
      { userId: user._id },
      config.JWT_SECRET,
      { expiresIn: config.JWT_EXPIRES_IN }
    );

    // Set cookie
    res.cookie('token', token, config.getCookieConfig());

    console.log('✅ User registered successfully:', user.name);

    res.status(201).json({
      success: true,
      message: 'User registered successfully',
      user: {
        _id: user._id,
        name: user.name,
        email: user.email,
        isAdmin: user.isAdmin
      }
    });
  } catch (error) {
    console.error('❌ Registration error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error during registration'
    });
  }
});

// Login
router.post('/login', async (req, res) => {
  try {
    const email = req.body.email?.trim().toLowerCase();
    const { password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ success: false, message: 'Email and password are required' });
    }
    console.log('🔐 Login attempt:', email);

    // Find user
    const user = await User.findOne({ email });
    if (!user) {
      return res.status(400).json({
        success: false,
        message: 'Invalid email or password'
      });
    }

    // Check password
    const isValidPassword = await user.comparePassword(password);
    if (!isValidPassword) {
      return res.status(400).json({
        success: false,
        message: 'Invalid email or password'
      });
    }

    // Generate JWT token
    const token = jwt.sign(
      { userId: user._id },
      config.JWT_SECRET,
      { expiresIn: config.JWT_EXPIRES_IN }
    );

    // Set cookie
    res.cookie('token', token, config.getCookieConfig());

    console.log('✅ User logged in successfully:', user.name);

    res.json({
      success: true,
      message: 'Login successful',
      user: {
        _id: user._id,
        name: user.name,
        email: user.email,
        isAdmin: user.isAdmin
      }
    });
  } catch (error) {
    console.error('❌ Login error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error during login'
    });
  }
});

// Get current user (me)
router.get('/me', authenticate, async (req, res) => {
  try {
    console.log('👤 Current user request for:', req.user.name);
    res.json({
      success: true,
      user: {
        _id: req.user._id,
        name: req.user.name,
        email: req.user.email,
        isAdmin: req.user.isAdmin,
        profilePicture: req.user.profilePicture,
        authProvider: req.user.authProvider,
        createdAt: req.user.createdAt
      }
    });
  } catch (error) {
    console.error('❌ Get user error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
});

// Logout
router.post('/logout', (req, res) => {
  console.log('🚪 Logout request');
  res.clearCookie('token');
  res.json({
    success: true,
    message: 'Logged out successfully'
  });
});

// Google OAuth Login
router.post('/google-login', async (req, res) => {
  try {
    if (!process.env.GOOGLE_CLIENT_ID) {
      return res.status(503).json({
        success: false,
        message: 'Google sign-in is not configured on the server'
      });
    }

    const { token } = req.body;

    if (!token) {
      return res.status(400).json({
        success: false,
        message: 'Google token is required'
      });
    }

    const ticket = await googleClient.verifyIdToken({
      idToken: token,
      audience: process.env.GOOGLE_CLIENT_ID
    });

    const payload = ticket.getPayload();
    const { sub: googleId, email, name, picture } = payload;

    if (!payload.email_verified) {
      return res.status(401).json({ success: false, message: 'Google email is not verified' });
    }

    let user = await User.findOne({ $or: [{ googleId }, { email: email.toLowerCase() }] });

    if (!user) {
      user = await User.create({
        name,
        email: email.toLowerCase(),
        googleId,
        profilePicture: picture,
        authProvider: 'google'
      });
    } else if (!user.googleId) {
      user.googleId = googleId;
      user.profilePicture = user.profilePicture || picture;
      user.authProvider = 'google';
      await user.save();
    }

    const authToken = jwt.sign(
      { userId: user._id },
      config.JWT_SECRET,
      { expiresIn: config.JWT_EXPIRES_IN }
    );

    res.cookie('token', authToken, config.getCookieConfig());

    return res.json({
      success: true,
      message: 'Google login successful',
      user: {
        _id: user._id,
        name: user.name,
        email: user.email,
        profilePicture: user.profilePicture,
        isAdmin: user.isAdmin
      }
    });
  } catch (error) {
    console.error('❌ Google login error:', error.message);
    return res.status(401).json({
      success: false,
      message: 'Invalid Google token'
    });
  }
});

module.exports = router;
