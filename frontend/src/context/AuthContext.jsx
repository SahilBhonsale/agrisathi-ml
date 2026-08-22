/* eslint-disable react-refresh/only-export-components */
import React, { createContext, useContext, useState, useEffect } from 'react';
import config from '../config/config';

const AuthContext = createContext();

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const checkSession = async () => {
      try {
        const response = await fetch(
          config.getApiUrl(config.endpoints.auth.me),
          config.getFetchConfig()
        );

        if (response.ok) {
          const data = await response.json();
          setUser(data.user);
        } else {
          setUser(null);
        }
      } catch (error) {
        console.error('Error checking session:', error);
        setUser(null);
      } finally {
        setLoading(false);
      }
    };

    checkSession();
  }, []);

  const logout = async () => {
    try {
      await fetch(
        config.getApiUrl(config.endpoints.auth.logout),
        config.getFetchConfig({ method: 'POST' })
      );
      setUser(null);
    } catch (error) {
      console.error('Logout error:', error);
      setUser(null);
    }
  };

  const login = async (email, password) => {
    try {
      const response = await fetch(
        config.getApiUrl(config.endpoints.auth.login),
        config.getFetchConfig({
          method: 'POST',
          body: JSON.stringify({ email, password })
        })
      );

      const data = await response.json();

      if (response.ok) {
        setUser(data.user);
        return { success: true, user: data.user };
      } else {
        return { success: false, message: data.message };
      }
    } catch (error) {
      console.error('Login error:', error);
      return { success: false, message: 'Network error' };
    }
  };

  const register = async (name, email, password) => {
    try {
      const response = await fetch(
        config.getApiUrl(config.endpoints.auth.register),
        config.getFetchConfig({
          method: 'POST',
          body: JSON.stringify({ name, email, password })
        })
      );

      const data = await response.json();

      if (response.ok) {
        setUser(data.user);
        return { success: true, user: data.user };
      } else {
        return { success: false, message: data.message };
      }
    } catch (error) {
      console.error('Register error:', error);
      return { success: false, message: 'Network error' };
    }
  };

  const refreshUser = async () => {
    try {
      const response = await fetch(
        config.getApiUrl(config.endpoints.auth.me),
        config.getFetchConfig()
      );

      if (response.ok) {
        const data = await response.json();
        setUser(data.user);
        return { success: true };
      }
    } catch (error) {
      console.error('Error refreshing user:', error);
    }
    return { success: false };
  };

  const googleLogin = async (token) => {
    try {
      const response = await fetch(
        config.getApiUrl(config.endpoints.auth.googleLogin),
        config.getFetchConfig({
          method: 'POST',
          body: JSON.stringify({ token })
        })
      );

      const data = await response.json();

      if (response.ok) {
        setUser(data.user);
        return { success: true, user: data.user };
      }

      return { success: false, message: data.message };
    } catch (error) {
      console.error('Google login error:', error);
      return { success: false, message: 'Network error' };
    }
  };

  const value = {
    user,
    setUser,
    logout,
    login,
    register,
    refreshUser,
    googleLogin,
    loading
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};
