import React, { createContext, useContext, useState, useRef, useCallback } from "react";
import { StyleSheet, Text, Animated, Dimensions, Platform } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useTheme } from "../context/ThemeContext";

type ToastType = "success" | "error" | "info" | "warning";

interface ToastContextType {
  showToast: (message: string, type?: ToastType) => void;
}

const ToastContext = createContext<ToastContextType | undefined>(undefined);

export const ToastProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { colors } = useTheme();
  const [visible, setVisible] = useState(false);
  const [message, setMessage] = useState("");
  const [type, setType] = useState<ToastType>("info");
  
  const slideAnim = useRef(new Animated.Value(-150)).current;

  const showToast = useCallback((msg: string, toastType: ToastType = "info") => {
    setMessage(msg);
    setType(toastType);
    setVisible(true);

    Animated.spring(slideAnim, {
      toValue: 20,
      friction: 6,
      tension: 40,
      useNativeDriver: true,
    }).start();

    // Auto dismiss after 3 seconds
    setTimeout(() => {
      Animated.timing(slideAnim, {
        toValue: -150,
        duration: 300,
        useNativeDriver: true,
      }).start(() => setVisible(false));
    }, 3200);
  }, []);

  const getToastStyle = () => {
    switch (type) {
      case "success":
        return { bg: colors.successBg, border: colors.success, icon: "checkmark-circle", color: colors.success };
      case "error":
        return { bg: colors.dangerBg, border: colors.danger, icon: "close-circle", color: colors.danger };
      case "warning":
        return { bg: colors.warningBg, border: colors.warning, icon: "warning", color: colors.warning };
      default:
        return { bg: colors.primaryLight, border: colors.accent, icon: "information-circle", color: colors.accent };
    }
  };

  const styleConfig = getToastStyle();

  return (
    <ToastContext.Provider value={{ showToast }}>
      {children}
      {visible && (
        <Animated.View
          style={[
            styles.toast,
            {
              backgroundColor: styleConfig.bg,
              borderLeftColor: styleConfig.border,
              transform: [{ translateY: slideAnim }],
            },
          ]}
        >
          <Ionicons name={styleConfig.icon as any} size={24} color={styleConfig.color} />
          <Text style={[styles.message, { color: colors.text }]}>{message}</Text>
        </Animated.View>
      )}
    </ToastContext.Provider>
  );
};

export const useToast = () => {
  const context = useContext(ToastContext);
  if (!context) {
    throw new Error("useToast must be used within a ToastProvider");
  }
  return context;
};

const { width } = Dimensions.get("window");

const styles = StyleSheet.create({
  toast: {
    position: "absolute",
    top: Platform.OS === "ios" ? 40 : 20,
    left: 16,
    right: 16,
    borderRadius: 14,
    paddingVertical: 14,
    paddingHorizontal: 16,
    flexDirection: "row",
    alignItems: "center",
    borderLeftWidth: 6,
    elevation: 10,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    zIndex: 99999,
    gap: 12,
  },
  message: {
    fontSize: 14,
    fontFamily: "Poppins_600SemiBold",
    flex: 1,
  },
});
