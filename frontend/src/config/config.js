const defaultApiBaseUrl = import.meta.env.PROD ? '' : 'http://localhost:5002';

const config = {
  API_BASE_URL: (import.meta.env.VITE_API_BASE_URL || defaultApiBaseUrl).replace(/\/$/, ''),
  
  getApiUrl(endpoint = '') {
    return `${this.API_BASE_URL}${endpoint}`;
  },

  getAssetUrl(path = '') {
    if (!path) return '';
    if (/^(https?:|data:|blob:)/.test(path)) return path;
    return `${this.API_BASE_URL}${path}`;
  },
  
  endpoints: {
    auth: {
      login: '/api/auth/login',
      register: '/api/auth/register',
      me: '/api/auth/me',
      logout: '/api/auth/logout',
      googleLogin: '/api/auth/google-login'
    },
    careTips: '/api/care-tips',
    forum: {
      questions: '/api/forum/questions'
    },
    marketplace: {
      products: '/api/marketplace/products'
    },
    chatbot: {
      message: '/api/chatbot/message',
      history: '/api/chatbot/history',
      status: '/api/chatbot/status'
    },
    scanner: {
      analyze: '/api/scanner/analyze',
      status: '/api/scanner/status'
    }
  },
  
  getFetchConfig(options = {}) {
    return {
      credentials: 'include',
      headers: {
        'Content-Type': 'application/json',
        ...options.headers
      },
      ...options
    };
  }
};

export default config;
