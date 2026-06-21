import React, { useEffect } from "react";
import { NavigationContainer } from "@react-navigation/native";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import { SafeAreaProvider } from "react-native-safe-area-context";
import * as Notifications from 'expo-notifications';
import * as SplashScreen from 'expo-splash-screen';
import { useFonts, Poppins_400Regular, Poppins_500Medium, Poppins_600SemiBold, Poppins_700Bold } from '@expo-google-fonts/poppins';

import { ThemeProvider } from "./context/ThemeContext";
import { ToastProvider } from "./components/CustomToast";
import { SidebarProvider } from "./context/SidebarContext";

SplashScreen.preventAutoHideAsync();



import LoginScreen from "./screens/LoginScreen";
import RegisterScreen from "./screens/RegisterScreen";
import ForgotPasswordScreen from "./screens/ForgotPasswordScreen";
import VerifyCodeScreen from "./screens/VerifyCodeScreen";
import ResetPasswordScreen from "./screens/ResetPasswordScreen";
import MapScreen from "./screens/MapScreen";
import ReportesScreen from "./screens/ReportesScreen";
import ReportScreen from "./screens/ReportScreen";
import TabNavigator from "./navigation/TabNavigator";
import PerfilScreen from "./screens/PerfilScreen";
import ReporteDetalleScreen from "./screens/ReporteDetalleScreen";

import AdminScreen from "./screens/admin/AdminScreen";
import AdminUsuariosScreen from "./screens/admin/AdminUsuariosScreen";
import AdminReportesScreen from "./screens/admin/AdminReportesScreen";
import TecnicosListScreen from "./screens/admin/TecnicosListScreen";
import TecnicoDetalleScreen from "./screens/admin/TecnicoDetalleScreen";

import TecnicoPanelScreen from "./screens/tecnico/TecnicoPanelScreen";
import TecnicoReporteDetalleScreen from "./screens/tecnico/TecnicoReporteDetalleScreen";

import { getCurrentUser } from './service/auth.api';

export type RootStackParamList = {
  Login: undefined;
  Register: undefined;
  ForgotPassword: undefined;
  VerifyCode: { email?: string };
  ResetPassword: { email?: string; code?: string };
  
  Panel: undefined;
  MapScreen: undefined;
  Reportes: undefined;
  Report: undefined;

  AdminScreen: undefined;
  AdminUsuarios: undefined;
  AdminReportes: undefined;
  TecnicosList: undefined;
  TecnicoDetalle: { tecnicoId: string; tecnicoNombre: string };
  
  TecnicoPanel: undefined;
  TecnicoReporteDetalle: { reporteId: string };
  
  Perfil: undefined;
  ReporteDetalle: { reporteId: string };
};

const Stack = createNativeStackNavigator<RootStackParamList>();

// Configuración global de notificaciones
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: true,
    shouldShowBanner: true,
    shouldShowList: true,
  }),
});

export default function App() {
  const [fontsLoaded] = useFonts({
    Poppins_400Regular,
    Poppins_500Medium,
    Poppins_600SemiBold,
    Poppins_700Bold,
  });

  useEffect(() => {
    if (fontsLoaded) {
      SplashScreen.hideAsync();
    }
  }, [fontsLoaded]);

  // Configurar listener para notificaciones cuando la app está en primer plano
  useEffect(() => {
    const subscription = Notifications.addNotificationReceivedListener(notification => {
      console.log('📬 Notificación recibida en primer plano:', notification);
    });

    return () => {
      subscription.remove();
    };
  }, []);

  if (!fontsLoaded) {
    return null;
  }

  return (
    <ThemeProvider>
      <SidebarProvider>
        <ToastProvider>
          <SafeAreaProvider>
            <NavigationContainer>
            <Stack.Navigator 
              initialRouteName="Login"
              screenOptions={{
                headerStyle: {
                  backgroundColor: "#1A237E",
                },
                headerTintColor: "#fff",
                headerTitleStyle: {
                  fontFamily: "Poppins_700Bold",
                  fontSize: 18,
                },
                headerBackTitle: "Atrás",
                contentStyle: {
                  backgroundColor: "#f5f7fa",
                },
              }}
            >
              {/* ========== PANTALLAS DE AUTENTICACIÓN ========== */}
              <Stack.Screen
                name="Login"
                component={LoginScreen}
                options={{ headerShown: false }}
              />

              <Stack.Screen
                name="Register"
                component={RegisterScreen}
                options={{ 
                  title: "Registro",
                  headerShown: true,
                }}
              />

              <Stack.Screen
                name="ForgotPassword"
                component={ForgotPasswordScreen}
                options={{ 
                  title: "Recuperar Contraseña",
                  headerShown: true,
                }}
              />

              <Stack.Screen
                name="VerifyCode"
                component={VerifyCodeScreen}
                options={{ 
                  title: "Verificar Código",
                  headerShown: true,
                }}
              />

              <Stack.Screen
                name="ResetPassword"
                component={ResetPasswordScreen}
                options={{ 
                  title: "Nueva Contraseña",
                  headerShown: true,
                }}
              />

              {/* ========== PANTALLA PRINCIPAL (TABS) ========== */}
              <Stack.Screen
                name="Panel"
                component={TabNavigator}
                options={{ headerShown: false }}
              />

              {/* ========== PANTALLAS DE USUARIO ========== */}
              <Stack.Screen
                name="MapScreen"
                component={MapScreen}
                options={{ headerShown: false }}
              />

              <Stack.Screen
                name="Reportes"
                component={ReportesScreen}
                options={{ 
                  headerShown: false,
                }}
              />

              <Stack.Screen
                name="Report"
                component={ReportScreen}
                options={{
                  title: "Nueva Incidencia",
                  headerStyle: {
                    backgroundColor: "#1A237E",
                  },
                  headerTintColor: "#fff",
                  headerTitleStyle: {
                    fontWeight: "bold",
                    fontSize: 18,
                  },
                  presentation: "modal",
                  animation: "slide_from_bottom",
                }}
              />
              
              <Stack.Screen
                name="Perfil"
                component={PerfilScreen}
                options={{ headerShown: false }}
              />

              <Stack.Screen
                name="ReporteDetalle"
                component={ReporteDetalleScreen}
                options={{ headerShown: false }}
              />

              {/* ========== PANTALLAS DE ADMIN ========== */}
              <Stack.Screen
                name="AdminScreen"
                component={AdminScreen}
                options={{
                  headerShown: false,
                }}
              />

              <Stack.Screen
                name="AdminUsuarios"
                component={AdminUsuariosScreen}
                options={{ 
                  headerShown: false,
                }}
              />

              <Stack.Screen
                name="AdminReportes"
                component={AdminReportesScreen}
                options={{ 
                  headerShown: false,
                }}
              />

              <Stack.Screen
                name="TecnicosList"
                component={TecnicosListScreen}
                options={{ 
                  headerShown: false,
                }}
              />

              <Stack.Screen
                name="TecnicoDetalle"
                component={TecnicoDetalleScreen}
                options={{ 
                  headerShown: false,
                }}
              />
              
              {/* ========== PANTALLAS DE TÉCNICO ========== */}
              <Stack.Screen
                name="TecnicoPanel"
                component={TecnicoPanelScreen}
                options={{ 
                  headerShown: false,
                }}
              />

              <Stack.Screen
                name="TecnicoReporteDetalle"
                component={TecnicoReporteDetalleScreen}
                options={{ 
                  headerShown: false,
                }}
              />
            </Stack.Navigator>
          </NavigationContainer>
        </SafeAreaProvider>
        </ToastProvider>
      </SidebarProvider>
    </ThemeProvider>
  );
}