import React, { useState, useRef } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Dimensions,
  Animated,
  Platform,
  TouchableWithoutFeedback,
} from "react-native";
import { createBottomTabNavigator } from "@react-navigation/bottom-tabs";
import { Ionicons } from "@expo/vector-icons";
import MapScreen from "../screens/MapScreen";
import ReportesScreen from "../screens/ReportesScreen";
import AdminScreen from "../screens/admin/AdminScreen";
import TecnicoPanelScreen from "../screens/tecnico/TecnicoPanelScreen";
import { getCurrentUser, setCurrentUser } from "../service/auth.api";
import { useTheme } from "../context/ThemeContext";
import { useToast } from "../components/CustomToast";
import { useSidebar } from "../context/SidebarContext";

const Tab = createBottomTabNavigator();
const { width } = Dimensions.get("window");
const SIDEBAR_WIDTH = width * 0.75;

export default function TabNavigator({ navigation }: any) {
  const user = getCurrentUser();
  const role = user?.rol || "USUARIO";
  const { theme, colors, toggleTheme } = useTheme();
  const { showToast } = useToast();

  const { isOpen: sidebarOpen, setIsOpen: setSidebarOpen, toggleSidebar } = useSidebar();
  const slideAnim = useRef(new Animated.Value(-SIDEBAR_WIDTH)).current;
  const backdropOpacity = useRef(new Animated.Value(0)).current;

  React.useEffect(() => {
    if (sidebarOpen) {
      // Open
      Animated.parallel([
        Animated.timing(slideAnim, {
          toValue: 0,
          duration: 300,
          useNativeDriver: true,
        }),
        Animated.timing(backdropOpacity, {
          toValue: 0.4,
          duration: 300,
          useNativeDriver: true,
        }),
      ]).start();
    } else {
      // Close
      Animated.parallel([
        Animated.timing(slideAnim, {
          toValue: -SIDEBAR_WIDTH,
          duration: 250,
          useNativeDriver: true,
        }),
        Animated.timing(backdropOpacity, {
          toValue: 0,
          duration: 250,
          useNativeDriver: true,
        }),
      ]).start();
    }
  }, [sidebarOpen]);

  const handleLogout = () => {
    toggleSidebar();
    setCurrentUser(null);
    showToast("Sesión cerrada correctamente", "info");
    navigation.replace("Login");
  };

  // Modern Premium Tab Bar style dynamically adapted to Dark/Light mode
  const premiumTabBarStyle = {
    position: "absolute" as const,
    bottom: 20,
    left: 20,
    right: 20,
    height: 64,
    borderRadius: 20,
    backgroundColor: colors.card,
    borderTopWidth: 0,
    elevation: 8,
    shadowColor: colors.shadow,
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.12,
    shadowRadius: 12,
    paddingBottom: Platform.OS === "ios" ? 4 : 8,
    paddingTop: 8,
  };

  // Reusable custom Sidebar / Drawer element
  const renderSidebar = () => {
    if (!sidebarOpen) return null;
    return (
      <View style={StyleSheet.absoluteFillObject}>
        {/* Backdrop overlay */}
        <TouchableWithoutFeedback onPress={toggleSidebar}>
          <Animated.View style={[styles.backdrop, { opacity: backdropOpacity }]} />
        </TouchableWithoutFeedback>

        {/* Sliding Panel */}
        <Animated.View
          style={[
            styles.sidebarContainer,
            {
              backgroundColor: colors.card,
              transform: [{ translateX: slideAnim }],
              shadowColor: colors.shadow,
            },
          ]}
        >
          {/* Sidebar Header */}
          <View style={[styles.sidebarHeader, { borderBottomColor: colors.border }]}>
            <View style={[styles.avatar, { backgroundColor: colors.primaryLight }]}>
              <Text style={[styles.avatarText, { color: colors.primary }]}>
                {(user?.nombre || "U").charAt(0).toUpperCase()}
              </Text>
            </View>
            <Text style={[styles.userName, { color: colors.text }]}>
              {user?.nombre || "Usuario"}
            </Text>
            <View style={[styles.roleBadge, { backgroundColor: colors.primaryLight }]}>
              <Text style={[styles.roleText, { color: colors.primary }]}>
                {role}
              </Text>
            </View>
          </View>

          {/* Sidebar Menu Options */}
          <View style={styles.menuOptions}>
            <TouchableOpacity
              style={[styles.menuItem, { borderBottomColor: colors.border }]}
              onPress={() => {
                toggleSidebar();
                navigation.navigate("Perfil");
              }}
            >
              <Ionicons name="person-outline" size={22} color={colors.textSecondary} />
              <Text style={[styles.menuItemText, { color: colors.text }]}>Mi Perfil</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.menuItem, { borderBottomColor: colors.border }]}
              onPress={toggleTheme}
            >
              <Ionicons
                name={theme === "light" ? "moon-outline" : "sunny-outline"}
                size={22}
                color={colors.textSecondary}
              />
              <Text style={[styles.menuItemText, { color: colors.text }]}>
                Modo {theme === "light" ? "Oscuro" : "Claro"}
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.menuItem, { borderBottomColor: colors.border }]}
              onPress={() => {
                toggleSidebar();
                showToast("Notificaciones al día", "info");
              }}
            >
              <Ionicons name="notifications-outline" size={22} color={colors.textSecondary} />
              <Text style={[styles.menuItemText, { color: colors.text }]}>Notificaciones</Text>
            </TouchableOpacity>
          </View>

          {/* Log Out */}
          <TouchableOpacity style={styles.logoutButton} onPress={handleLogout}>
            <Ionicons name="log-out-outline" size={22} color={colors.danger} />
            <Text style={[styles.logoutText, { color: colors.danger }]}>Cerrar Sesión</Text>
          </TouchableOpacity>
        </Animated.View>
      </View>
    );
  };

  const renderTabHeader = () => (
    <TouchableOpacity style={styles.sidebarToggle} onPress={toggleSidebar}>
      <Ionicons name="menu-outline" size={26} color="#FFFFFF" />
    </TouchableOpacity>
  );

  const getCommonOptions = (title: string) => ({
    title,
    headerShown: false,
    headerLeft: () => renderTabHeader(),
    headerStyle: {
      backgroundColor: colors.primary,
      elevation: 4,
      shadowColor: colors.shadow,
    },
    headerTintColor: "#FFFFFF",
    headerTitleStyle: {
      fontFamily: "Poppins_700Bold",
      fontSize: 18,
    },
  });

  const renderNavigator = () => {
    if (role === "ADMIN") {
      return (
        <Tab.Navigator
          screenOptions={{
            tabBarIcon: ({ focused, color, size }) => (
              <Ionicons name={focused ? "shield" : "shield-outline"} size={size} color={color} />
            ),
            tabBarActiveTintColor: colors.primary,
            tabBarInactiveTintColor: colors.textSecondary,
            tabBarStyle: premiumTabBarStyle,
            tabBarLabelStyle: { fontFamily: "Poppins_500Medium", fontSize: 11 },
          }}
        >
          <Tab.Screen
            name="Admin"
            component={AdminScreen}
            options={getCommonOptions("Administración")}
          />
        </Tab.Navigator>
      );
    }

    if (role === "TECNICO") {
      return (
        <Tab.Navigator
          screenOptions={{
            tabBarIcon: ({ focused, color, size }) => (
              <Ionicons name={focused ? "construct" : "construct-outline"} size={size} color={color} />
            ),
            tabBarActiveTintColor: colors.primary,
            tabBarInactiveTintColor: colors.textSecondary,
            tabBarStyle: premiumTabBarStyle,
            tabBarLabelStyle: { fontFamily: "Poppins_500Medium", fontSize: 11 },
          }}
        >
          <Tab.Screen
            name="TecnicoPanel"
            component={TecnicoPanelScreen}
            options={getCommonOptions("Panel Técnico")}
          />
        </Tab.Navigator>
      );
    }

    return (
      <Tab.Navigator
        screenOptions={({ route }) => ({
          tabBarIcon: ({ focused, color, size }) => {
            let iconName: keyof typeof Ionicons.glyphMap = "home-outline";
            if (route.name === "Inicio") {
              iconName = focused ? "home" : "home-outline";
            } else if (route.name === "MisReportes") {
              iconName = focused ? "list" : "list-outline";
            }
            return <Ionicons name={iconName} size={size} color={color} />;
          },
          tabBarActiveTintColor: colors.primary,
          tabBarInactiveTintColor: colors.textSecondary,
          tabBarStyle: premiumTabBarStyle,
          tabBarLabelStyle: { fontFamily: "Poppins_500Medium", fontSize: 11 },
        })}
      >
        <Tab.Screen
          name="Inicio"
          component={MapScreen}
          options={getCommonOptions("Inicio")}
        />
        <Tab.Screen
          name="MisReportes"
          component={ReportesScreen}
          options={getCommonOptions("Mis Reportes")}
        />
      </Tab.Navigator>
    );
  };

  return (
    <View style={{ flex: 1, backgroundColor: colors.background }}>
      {renderNavigator()}
      {renderSidebar()}
    </View>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "#000000",
    zIndex: 99998,
  },
  sidebarContainer: {
    position: "absolute",
    left: 0,
    top: 0,
    bottom: 0,
    width: SIDEBAR_WIDTH,
    zIndex: 99999,
    paddingTop: Platform.OS === "ios" ? 50 : 30,
    paddingHorizontal: 20,
    elevation: 16,
    shadowOffset: { width: 4, height: 0 },
    shadowOpacity: 0.15,
    shadowRadius: 16,
  },
  sidebarToggle: {
    paddingHorizontal: 16,
    justifyContent: "center",
    alignItems: "center",
  },
  sidebarHeader: {
    alignItems: "center",
    paddingVertical: 24,
    borderBottomWidth: 1,
  },
  avatar: {
    width: 72,
    height: 72,
    borderRadius: 36,
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 12,
  },
  avatarText: {
    fontSize: 32,
    fontFamily: "Poppins_700Bold",
  },
  userName: {
    fontSize: 18,
    fontFamily: "Poppins_700Bold",
    marginBottom: 6,
  },
  roleBadge: {
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 12,
  },
  roleText: {
    fontSize: 11,
    fontFamily: "Poppins_600SemiBold",
    textTransform: "uppercase",
  },
  menuOptions: {
    marginTop: 20,
    flex: 1,
  },
  menuItem: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 16,
    borderBottomWidth: 1,
    gap: 12,
  },
  menuItemText: {
    fontSize: 14,
    fontFamily: "Poppins_500Medium",
  },
  logoutButton: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 20,
    borderTopWidth: 1,
    borderTopColor: "#E2E8F0",
    gap: 12,
    marginBottom: Platform.OS === "ios" ? 30 : 16,
  },
  logoutText: {
    fontSize: 14,
    fontFamily: "Poppins_700Bold",
  },
});