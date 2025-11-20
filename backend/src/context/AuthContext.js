import React, { createContext, useState, useContext, useEffect, useCallback } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import axios from 'axios';
import { API_BASE_URL } from '../config/api';

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [userToken, setUserToken] = useState(null);
  const [currentUser, setCurrentUser] = useState(null);
  const [isLoading, setIsLoading] = useState(true);

  const logout = useCallback(async () => {
    try {
      await AsyncStorage.removeItem('userToken');
      await AsyncStorage.removeItem('refreshToken');
      setUserToken(null);
      setCurrentUser(null);
    } catch (error) {
      console.error('Çıkış yapılırken hata:', error);
    }
  }, []);

  // Axios interceptor - 401 hatalarını yakala
  useEffect(() => {
    const interceptor = axios.interceptors.response.use(
      (response) => response,
      async (error) => {
        if (error.response?.status === 401) {
          console.log('401 Unauthorized - Token geçersiz veya süresi dolmuş');
          await logout();
        }
        return Promise.reject(error);
      }
    );

    return () => {
      axios.interceptors.response.eject(interceptor);
    };
  }, [logout]);

  useEffect(() => {
    loadStoredToken();
  }, []);

  const loadStoredToken = async () => {
    try {
      const token = await AsyncStorage.getItem('userToken');
      if (token) {
        setUserToken(token);
        await fetchUserInfo(token);
      }
    } catch (error) {
      console.error('Token yükleme hatası:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const fetchUserInfo = async (token) => {
    try {
      const response = await axios.get(`${API_BASE_URL}/users/me`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setCurrentUser(response.data);
    } catch (error) {
      console.error('Kullanıcı bilgisi alınamadı:', error);
      await logout();
    }
  };

  const login = async (email, password) => {
    try {
      const params = new URLSearchParams();
      params.append('username', email);
      params.append('password', password);

      const response = await axios.post(
        `${API_BASE_URL}/auth/login`,
        params.toString(),
        {
          headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        }
      );

      const { access_token, refresh_token } = response.data;
      await AsyncStorage.setItem('userToken', access_token);
      await AsyncStorage.setItem('refreshToken', refresh_token);
      setUserToken(access_token);
      await fetchUserInfo(access_token);
    } catch (error) {
      const errorMessage = error.response?.data?.detail || error.message || 'Giriş yapılırken bir hata oluştu';
      throw new Error(errorMessage);
    }
  };

  const register = async (fullName, email, password) => {
    try {
      const response = await axios.post(`${API_BASE_URL}/auth/register`, {
        email,
        password,
        full_name: fullName,
      });
      await login(email, password);
    } catch (error) {
      const errorMessage = error.response?.data?.detail || error.message || 'Kayıt olurken bir hata oluştu';
      throw new Error(errorMessage);
    }
  };

  const value = {
    userToken,
    currentUser,
    isLoading,
    login,
    register,
    logout,
    isAuthenticated: !!userToken,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

