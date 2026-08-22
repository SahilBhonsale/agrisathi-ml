require('dotenv').config();

const config = {
  // Server Configuration
  PORT: process.env.PORT || 5001,
  NODE_ENV: process.env.NODE_ENV || 'development',
  
  // Database Configuration
  MONGODB_URI: process.env.MONGODB_URI || 'mongodb://localhost:27017/agrisathi',
  
  // JWT Configuration
  JWT_SECRET: process.env.JWT_SECRET || 'your_super_secret_key',
  JWT_EXPIRES_IN: process.env.JWT_EXPIRES_IN || '7d',
  
  // Frontend Configuration
  FRONTEND_URL: process.env.FRONTEND_URL || 'http://localhost:5173',
  
  // API Keys
  GEMINI_API_KEY: process.env.GEMINI_API_KEY,
  
  // CORS Configuration
  isLocalOrigin(origin) {
    if (!origin) {
      return false;
    }

    return /^https?:\/\/(localhost|127\.0\.0\.1)(:\d+)?$/.test(origin);
  },

  getCorsOrigins() {
    return this.NODE_ENV === 'production' 
      ? [this.FRONTEND_URL] 
      : [this.FRONTEND_URL, 'http://localhost:3000', 'http://localhost:5173', 'http://localhost:5174'];
  },
  
  // Cookie Configuration
  getCookieConfig() {
    return {
      httpOnly: true,
      secure: this.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 7 * 24 * 60 * 60 * 1000 // 7 days
    };
  },
  
  // Get base URL for API
  getBaseURL() {
    return `http://localhost:${this.PORT}`;
  }
};

module.exports = config;