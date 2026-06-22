import axios from 'axios';
import { API_URL } from './api.config';
import { getToken, logout } from './auth.state';
import { Alert } from 'react-native';

const apiClient = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

apiClient.interceptors.request.use(
  (config) => {
    const token = getToken();
    if (token && config.headers) {
      config.headers['Authorization'] = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

apiClient.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response && error.response.status === 401) {
      console.warn('Token expirado o inválido (401). Cerrando sesión...');
      logout();
      Alert.alert(
        'Sesión Expirada',
        'Tu sesión ha expirado. Por favor, inicia sesión nuevamente.',
        [{ text: 'OK' }]
      );
    }
    return Promise.reject(error);
  }
);

export default apiClient;
