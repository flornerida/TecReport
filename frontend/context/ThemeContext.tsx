import React, { createContext, useState, useContext, useEffect } from "react";
import { useColorScheme } from "react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";

type Theme = "light" | "dark";

export const lightColors = {
  background: "#F8FAFC",
  card: "#FFFFFF",
  text: "#0F172A",
  textSecondary: "#64748B",
  primary: "#1A237E",
  primaryLight: "#EEF2FF",
  border: "#E2E8F0",
  accent: "#2563EB",
  success: "#10B981",
  successBg: "#D1FAE5",
  warning: "#F59E0B",
  warningBg: "#FEF3C7",
  danger: "#EF4444",
  dangerBg: "#FEE2E2",
  shadow: "#000000",
};

export const darkColors = {
  background: "#0F172A",
  card: "#1E293B",
  text: "#F8FAFC",
  textSecondary: "#94A3B8",
  primary: "#3B82F6",
  primaryLight: "#1E3A8A",
  border: "#334155",
  accent: "#60A5FA",
  success: "#34D399",
  successBg: "#064E3B",
  warning: "#FBBF24",
  warningBg: "#78350F",
  danger: "#F87171",
  dangerBg: "#7F1D1D",
  shadow: "#000000",
};

type ThemeContextType = {
  theme: Theme;
  colors: typeof lightColors;
  toggleTheme: () => void;
};

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

export const ThemeProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const systemScheme = useColorScheme();
  const [theme, setTheme] = useState<Theme>("light");

  useEffect(() => {
    const loadTheme = async () => {
      try {
        const savedTheme = await AsyncStorage.getItem("app_theme");
        if (savedTheme === "light" || savedTheme === "dark") {
          setTheme(savedTheme);
        } else if (systemScheme) {
          setTheme(systemScheme);
        }
      } catch (e) {
        console.error("Error loading theme:", e);
      }
    };
    loadTheme();
  }, [systemScheme]);

  const toggleTheme = async () => {
    try {
      const nextTheme = theme === "light" ? "dark" : "light";
      setTheme(nextTheme);
      await AsyncStorage.setItem("app_theme", nextTheme);
    } catch (e) {
      console.error("Error saving theme:", e);
    }
  };

  const colors = theme === "light" ? lightColors : darkColors;

  return (
    <ThemeContext.Provider value={{ theme, colors, toggleTheme }}>
      {children}
    </ThemeContext.Provider>
  );
};

export const useTheme = () => {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error("useTheme must be used within a ThemeProvider");
  }
  return context;
};
