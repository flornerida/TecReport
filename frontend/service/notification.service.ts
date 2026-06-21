import * as Notifications from 'expo-notifications';
import * as Device from 'expo-device';
import { Platform } from 'react-native';
import { getToken } from './auth.api';
import { API_URL } from '../config/api.config';
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: true,
    shouldShowBanner: true,
    shouldShowList: true,
  }),
});

export const registerForPushNotifications = async (): Promise<string | null> => {
  try {
    if (!Device.isDevice) {
      console.log('Las notificaciones push solo funcionan en dispositivos físicos');
      return null;
    }

    const { status: existingStatus } = await Notifications.getPermissionsAsync();
    let finalStatus = existingStatus;
    
    if (existingStatus !== 'granted') {
      const { status } = await Notifications.requestPermissionsAsync();
      finalStatus = status;
    }
    
    if (finalStatus !== 'granted') {
      console.log('Permiso de notificaciones denegado');
      return null;
    }

    if (Platform.OS === 'android') {
      await Notifications.setNotificationChannelAsync('incidencias', {
        name: 'Incidencias TI',
        importance: Notifications.AndroidImportance.MAX,
        vibrationPattern: [0, 250, 250, 250],
        lightColor: '#1A237E',
        sound: 'default',
        enableVibrate: true,
        enableLights: true,
      });
    }

    const tokenData = await Notifications.getExpoPushTokenAsync();
    const pushToken = tokenData.data;
    console.log('📱 Token push obtenido:', pushToken);

    const authToken = getToken();
    if (authToken) {
      const response = await fetch(`${API_URL}/notificaciones/registrar-token`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${authToken}`,
        },
        body: JSON.stringify({ pushToken }),
      });
      
      const result = await response.json();
      if (result.success) {
        console.log('✅ Token registrado en el backend');
      } else {
        console.log('⚠️ Error registrando token:', result.message);
      }
    }

    return pushToken;
  } catch (error) {
    console.error('❌ Error registrando notificaciones push:', error);
    return null;
  }
};

/**
 * Enviar notificación local inmediata
 */
export const sendLocalNotification = async (
  titulo: string,
  mensaje: string,
  data?: any
): Promise<void> => {
  try {
    await Notifications.scheduleNotificationAsync({
      content: {
        title: titulo,
        body: mensaje,
        data: data,
        sound: 'default',
      },
      trigger: null,
    });
    console.log('📬 Notificación local enviada:', titulo);
  } catch (error) {
    console.error('❌ Error enviando notificación local:', error);
  }
};

/**
 * Programar una notificación para más tarde
 */
export const scheduleNotification = async (
  titulo: string,
  mensaje: string,
  seconds: number,
  data?: any
): Promise<string> => {
  try {
    const identifier = await Notifications.scheduleNotificationAsync({
      content: {
        title: titulo,
        body: mensaje,
        data: data,
        sound: 'default',
      },
      trigger: { seconds: seconds } as any,
    });
    console.log(`📅 Notificación programada en ${seconds} segundos:`, titulo);
    return identifier;
  } catch (error) {
    console.error('❌ Error programando notificación:', error);
    return '';
  }
};

/**
 * Cancelar una notificación programada
 */
export const cancelScheduledNotification = async (identifier: string): Promise<void> => {
  try {
    await Notifications.cancelScheduledNotificationAsync(identifier);
    console.log('🗑️ Notificación cancelada:', identifier);
  } catch (error) {
    console.error('❌ Error cancelando notificación:', error);
  }
};

/**
 * Cancelar todas las notificaciones
 */
export const cancelAllNotifications = async (): Promise<void> => {
  try {
    await Notifications.cancelAllScheduledNotificationsAsync();
    console.log('🗑️ Todas las notificaciones canceladas');
  } catch (error) {
    console.error('❌ Error cancelando notificaciones:', error);
  }
};

/**
 * Obtener el estado de los permisos de notificación
 */
export const getNotificationPermissions = async (): Promise<boolean> => {
  try {
    const { status } = await Notifications.getPermissionsAsync();
    return status === 'granted';
  } catch (error) {
    console.error('❌ Error obteniendo permisos:', error);
    return false;
  }
};

/**
 * Solicitar permisos de notificación nuevamente
 */
export const requestNotificationPermissions = async (): Promise<boolean> => {
  try {
    const { status } = await Notifications.requestPermissionsAsync();
    return status === 'granted';
  } catch (error) {
    console.error('Error solicitando permisos:', error);
    return false;
  }
};

/**
 * Escuchar cuando se recibe una notificación (app en primer plano)
 */
export const addNotificationReceivedListener = (callback: (notification: any) => void) => {
  return Notifications.addNotificationReceivedListener(callback);
};

/**
 * Escuchar cuando el usuario toca una notificación
 */
export const addNotificationResponseListener = (callback: (response: any) => void) => {
  return Notifications.addNotificationResponseReceivedListener(callback);
};