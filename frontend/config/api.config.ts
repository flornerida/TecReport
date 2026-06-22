import Constants from 'expo-constants';

/**
 * modo desarrollo
 */
export const IS_DEV = true;

/**
 * Dirección IP por defecto para producción.
 */
const PRODUCTION_IP = '192.168.1.103'; 

/**
 * Detecta automáticamente la dirección IP del servidor en modo desarrollo.
 * Esto asegura que el frontend se conecte correctamente con la carpeta /backend.
 */
const getApiUrl = () => {
  if (IS_DEV) {
    // la IP de la máquina automáticamente (Expo Packager IP)
    const hostUri = Constants.expoConfig?.hostUri;
    
    if (hostUri) {
      const ip = hostUri.split(':')[0];
      return `http://${ip}:3000`;
    }
  }
  
  // URL para producción (puedes cambiar PRODUCTION_IP cuando despliegues el backend)
  return `http://${PRODUCTION_IP}:3000`;
};

export const API_URL = getApiUrl();

/**
 * Prueba la conexión con el servidor backend y muestra el resultado en consola.
 */
const checkBackendConnection = async () => {
  if (IS_DEV) {
    console.log('Verificando conexión con el backend en:', API_URL);
    try {
      const response = await fetch(API_URL, { 
        method: 'GET',
        headers: { 'Accept': 'application/json' }
      });
      const data = await response.json();
      
      if (data.success) {
        console.log('Backend conectado exitosamente:', data.message);
      } else {
        console.warn('El backend respondió pero con error:', data.message);
      }
    } catch (error) {
      console.error('Error de conexión con el backend:', error instanceof Error ? error.message : 'Desconocido');
      console.log('Tip: Asegúrate de que el servidor esté corriendo y que la IP en api.config.ts sea la correcta.');
    }
  }
};

checkBackendConnection();

import apiClient from './apiClient';

// Polyfill global fetch to use our Axios instance so that ANY request triggers the interceptors
const originalFetch = global.fetch;
global.fetch = async (url: RequestInfo | URL, options?: RequestInit): Promise<Response> => {
  // Solo interceptar peticiones a la API local
  if (typeof url === 'string' && url.includes(API_URL)) {
    try {
      const response = await apiClient({
        url: url.replace(API_URL, ''),
        method: options?.method || 'GET',
        headers: options?.headers as any,
        data: options?.body ? JSON.parse(options.body as string) : undefined,
      });

      return {
        ok: response.status >= 200 && response.status < 300,
        status: response.status,
        json: async () => response.data,
        text: async () => JSON.stringify(response.data),
        headers: new Headers(response.headers as any),
      } as Response;
    } catch (error: any) {
      if (error.response) {
        return {
          ok: false,
          status: error.response.status,
          json: async () => error.response.data,
          text: async () => JSON.stringify(error.response.data),
          headers: new Headers(error.response.headers as any),
        } as Response;
      }
      throw error;
    }
  }
  return originalFetch(url, options);
};
