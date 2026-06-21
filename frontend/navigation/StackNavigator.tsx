import React from "react";
import { createNativeStackNavigator } from "@react-navigation/native-stack";

import LoginScreen from "../screens/LoginScreen";
import RegisterScreen from "../screens/RegisterScreen";
import ForgotPasswordScreen from "../screens/ForgotPasswordScreen";
import TabNavigator from "./TabNavigator";
import VerifyCodeScreen from "../screens/VerifyCodeScreen";
import ResetPasswordScreen from "../screens/ResetPasswordScreen";
import ReportScreen from "../screens/ReportScreen"; 
import TecnicoPanelScreen from "../screens/tecnico/TecnicoPanelScreen";
import TecnicoReporteDetalleScreen from "../screens/tecnico/TecnicoReporteDetalleScreen";
import AdminScreen from "../screens/admin/AdminScreen";
import AdminUsuariosScreen from "../screens/admin/AdminUsuariosScreen";
import AdminReportesScreen from "../screens/admin/AdminReportesScreen";  
import TecnicosListScreen from "../screens/admin/TecnicosListScreen";
import TecnicoDetalleScreen from "../screens/admin/TecnicoDetalleScreen";
import PerfilScreen from "../screens/PerfilScreen";
import MisReportes from "../screens/ReportesScreen";  

const Stack = createNativeStackNavigator();
export default function StackNavigator() {
  return (
    <Stack.Navigator 
      initialRouteName="Login"
      screenOptions={{ 
        headerShown: false,
        headerStyle: {
          backgroundColor: '#1A237E',
        },
        headerTintColor: '#fff',
        headerTitleStyle: {
          fontWeight: 'bold',
        },
      }}
    >
      <Stack.Screen
        name="Login"
        component={LoginScreen}
        options={{ headerShown: false }}
      />

      <Stack.Screen
        name="Register"
        component={RegisterScreen}
        options={{ headerShown: false }}
      />

      <Stack.Screen
        name="ForgotPassword"
        component={ForgotPasswordScreen}
        options={{ headerShown: false }}
      />

      <Stack.Screen
        name="VerifyCode"
        component={VerifyCodeScreen}
        options={{ headerShown: false }}
      />

      <Stack.Screen
        name="ResetPassword"
        component={ResetPasswordScreen}
        options={{ headerShown: false }}
      />
      <Stack.Screen
        name="Panel"
        component={TabNavigator}
        options={{ headerShown: false }}
      />
      <Stack.Screen
        name="Report"
        component={ReportScreen}
        options={{ 
          headerShown: true,
          title: "Nueva Incidencia",
          headerStyle: {
            backgroundColor: '#1A237E',
          },
          headerTintColor: '#fff',
          headerTitleStyle: {
            fontWeight: 'bold',
          },
        }}
      />
      <Stack.Screen
        name="ReporteDetalle"
        component={TecnicoReporteDetalleScreen}
        options={{ 
          headerShown: false,
        }}
      />
      <Stack.Screen
        name="Reportes"
        component={MisReportes}
        options={{ 
          headerShown: false,
        }}
      />
      <Stack.Screen
        name="Perfil"
        component={PerfilScreen}
        options={{ 
          headerShown: true,
          title: "Mi Perfil",
          headerStyle: {
            backgroundColor: '#1A237E',
          },
          headerTintColor: '#fff',
          headerTitleStyle: {
            fontWeight: 'bold',
          },
        }}
      />
      <Stack.Screen
        name="TecnicoPanel"
        component={TecnicoPanelScreen}
        options={{ headerShown: false }}
      />
      <Stack.Screen
        name="AdminScreen"
        component={AdminScreen}
        options={{ headerShown: false }}
      />
      <Stack.Screen
        name="AdminUsuarios"
        component={AdminUsuariosScreen}
        options={{ 
          headerShown: true,
          title: "Gestión de Usuarios",
          headerStyle: {
            backgroundColor: '#1A237E',
          },
          headerTintColor: '#fff',
          headerTitleStyle: {
            fontWeight: 'bold',
          },
        }}
      />
      <Stack.Screen
        name="AdminReportes"
        component={AdminReportesScreen}
        options={{ 
          headerShown: true,
          title: "Gestión de Incidencias",
          headerStyle: {
            backgroundColor: '#1A237E',
          },
          headerTintColor: '#fff',
          headerTitleStyle: {
            fontWeight: 'bold',
          },
        }}
      />
      <Stack.Screen
        name="TecnicosList"
        component={TecnicosListScreen}
        options={{ 
          headerShown: true,
          title: "Lista de Técnicos",
          headerStyle: {
            backgroundColor: '#1A237E',
          },
          headerTintColor: '#fff',
          headerTitleStyle: {
            fontWeight: 'bold',
          },
        }}
      />
      <Stack.Screen
        name="TecnicoDetalle"
        component={TecnicoDetalleScreen}
        options={{ 
          headerShown: true,
          title: "Detalle del Técnico",
          headerStyle: {
            backgroundColor: '#1A237E',
          },
          headerTintColor: '#fff',
          headerTitleStyle: {
            fontWeight: 'bold',
          },
        }}
      />
    </Stack.Navigator>
  );
}