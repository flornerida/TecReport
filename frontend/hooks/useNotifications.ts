// hooks/useNotifications.ts
// CORREGIDO - useRef con argumento inicial

import { useEffect, useRef } from 'react';
import { Alert } from 'react-native';
import * as Notifications from 'expo-notifications';
import {
  registerForPushNotifications,
  addNotificationReceivedListener,
  addNotificationResponseListener,
} from '../service/notification.service';

export const useNotifications = () => {
  // ✅ CORREGIDO: useRef con null como valor inicial
  const notificationListener = useRef<Notifications.Subscription | null>(null);
  const responseListener = useRef<Notifications.Subscription | null>(null);

  useEffect(() => {
    // Configurar el comportamiento de las notificaciones
    Notifications.setNotificationHandler({
      handleNotification: async () => ({
        shouldShowAlert: true,
        shouldPlaySound: true,
        shouldSetBadge: true,
        shouldShowBanner: true,
        shouldShowList: true,
      }),
    });

    // Registrar notificaciones
    registerForPushNotifications();

    // Escuchar notificaciones recibidas
    notificationListener.current = addNotificationReceivedListener((notification) => {
      console.log('📬 Notificación recibida:', notification);
      
      const title = notification.request.content.title;
      const body = notification.request.content.body;
      
      if (title && body) {
        Alert.alert(title, body, [{ text: 'OK' }]);
      }
    });

    // Escuchar cuando el usuario toca una notificación
    responseListener.current = addNotificationResponseListener((response) => {
      const data = response.notification.request.content.data;
      console.log('👆 Usuario tocó notificación:', data);
      
      if (data?.incidenciaId) {
        Alert.alert(
          'Notificación',
          `Ver incidencia: ${data.incidenciaId}`,
          [{ text: 'OK' }]
        );
      }
    });

    // Limpiar listeners
    return () => {
      if (notificationListener.current) {
        notificationListener.current.remove();
      }
      if (responseListener.current) {
        responseListener.current.remove();
      }
    };
  }, []);
};