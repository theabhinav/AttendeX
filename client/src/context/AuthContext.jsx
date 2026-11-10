import React, { createContext, useContext, useEffect, useState } from 'react';
import { authService } from '../services/authService';
import toast from 'react-hot-toast';

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(() => localStorage.getItem('attendx_token'));
  const [loading, setLoading] = useState(true);

  // Initialize user profile on load if token exists
  useEffect(() => {
    const initAuth = async () => {
      const storedToken = localStorage.getItem('attendx_token');
      if (storedToken) {
        try {
          const profile = await authService.getCurrentUser();
          setUser(profile.user);
        } catch (error) {
          console.error('Failed to restore session:', error);
          localStorage.removeItem('attendx_token');
          localStorage.removeItem('attendx_user');
          setToken(null);
          setUser(null);
        }
      }
      setLoading(false);
    };

    initAuth();
  }, []);

  const login = async (email, password) => {
    try {
      const data = await authService.login({ email, password });
      localStorage.setItem('attendx_token', data.token);
      localStorage.setItem('attendx_user', JSON.stringify(data.user));
      setToken(data.token);
      setUser(data.user);
      toast.success(`Welcome back, ${data.user.name}!`);
      return data;
    } catch (err) {
      const msg = err.response?.data?.message || 'Login failed. Please check your credentials.';
      toast.error(msg);
      throw err;
    }
  };

  const register = async (name, email, password) => {
    try {
      const data = await authService.register({ name, email, password });
      localStorage.setItem('attendx_token', data.token);
      localStorage.setItem('attendx_user', JSON.stringify(data.user));
      setToken(data.token);
      setUser(data.user);
      toast.success('Account created successfully!');
      return data;
    } catch (err) {
      const msg = err.response?.data?.message || 'Registration failed.';
      toast.error(msg);
      throw err;
    }
  };

  const googleLogin = async (credentialToken) => {
    try {
      const data = await authService.googleAuth(credentialToken);
      localStorage.setItem('attendx_token', data.token);
      localStorage.setItem('attendx_user', JSON.stringify(data.user));
      setToken(data.token);
      setUser(data.user);
      toast.success(`Welcome, ${data.user.name}!`);
      return data;
    } catch (err) {
      const msg = err.response?.data?.message || 'Google authentication failed.';
      toast.error(msg);
      throw err;
    }
  };

  const logout = () => {
    localStorage.removeItem('attendx_token');
    localStorage.removeItem('attendx_user');
    setToken(null);
    setUser(null);
    toast.success('Logged out successfully');
  };

  const updateUser = (updatedUserData) => {
    setUser((prev) => {
      const merged = { ...prev, ...updatedUserData };
      localStorage.setItem('attendx_user', JSON.stringify(merged));
      return merged;
    });
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        token,
        loading,
        isAuthenticated: !!token && !!user,
        isOnboarded: !!user?.isOnboarded,
        login,
        register,
        googleLogin,
        logout,
        updateUser,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth must be used within an AuthProvider');
  return context;
};
