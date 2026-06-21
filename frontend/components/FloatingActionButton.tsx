import React, { useRef } from "react";
import { StyleSheet, TouchableWithoutFeedback, Animated } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useTheme } from "../context/ThemeContext";

interface FABProps {
  onPress: () => void;
  iconName?: keyof typeof Ionicons.glyphMap;
  backgroundColor?: string;
  iconColor?: string;
}

export const FAB: React.FC<FABProps> = ({
  onPress,
  iconName = "add",
  backgroundColor,
  iconColor = "#FFFFFF",
}) => {
  const { colors } = useTheme();
  const scale = useRef(new Animated.Value(1)).current;

  const handlePressIn = () => {
    Animated.spring(scale, {
      toValue: 0.9,
      friction: 4,
      tension: 40,
      useNativeDriver: true,
    }).start();
  };

  const handlePressOut = () => {
    Animated.spring(scale, {
      toValue: 1,
      friction: 4,
      tension: 40,
      useNativeDriver: true,
    }).start();
  };

  return (
    <TouchableWithoutFeedback
      onPress={onPress}
      onPressIn={handlePressIn}
      onPressOut={handlePressOut}
    >
      <Animated.View
        style={[
          styles.container,
          {
            backgroundColor: backgroundColor || colors.primary,
            transform: [{ scale }],
            shadowColor: colors.shadow,
          },
        ]}
      >
        <Ionicons name={iconName} size={28} color={iconColor} />
      </Animated.View>
    </TouchableWithoutFeedback>
  );
};

const styles = StyleSheet.create({
  container: {
    position: "absolute",
    bottom: 80,
    right: 20,
    width: 60,
    height: 60,
    borderRadius: 30,
    justifyContent: "center",
    alignItems: "center",
    elevation: 8,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    zIndex: 9999,
  },
});

export default FAB;
