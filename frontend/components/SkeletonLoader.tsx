import React, { useEffect, useRef } from "react";
import { View, StyleSheet, Animated } from "react-native";
import { useTheme } from "../context/ThemeContext";

interface SkeletonProps {
  width?: any;
  height?: number;
  borderRadius?: number;
  style?: any;
}

export const Skeleton: React.FC<SkeletonProps> = ({
  width = "100%",
  height = 20,
  borderRadius = 6,
  style,
}) => {
  const { colors } = useTheme();
  const pulseAnim = useRef(new Animated.Value(0.3)).current;

  useEffect(() => {
    const pulse = Animated.sequence([
      Animated.timing(pulseAnim, {
        toValue: 0.8,
        duration: 800,
        useNativeDriver: true,
      }),
      Animated.timing(pulseAnim, {
        toValue: 0.3,
        duration: 800,
        useNativeDriver: true,
      }),
    ]);

    Animated.loop(pulse).start();
  }, []);

  return (
    <Animated.View
      style={[
        styles.skeleton,
        {
          width,
          height,
          borderRadius,
          opacity: pulseAnim,
          backgroundColor: colors.border,
        },
        style,
      ]}
    />
  );
};

export const SkeletonCardList = () => {
  const { colors } = useTheme();
  return (
    <View style={styles.listContainer}>
      {[1, 2, 3].map((key) => (
        <View key={key} style={[styles.card, { backgroundColor: colors.card, borderColor: colors.border }]}>
          <View style={styles.cardHeader}>
            <Skeleton width={80} height={18} borderRadius={10} />
            <Skeleton width={60} height={18} borderRadius={10} />
          </View>
          <View style={styles.cardRow}>
            <Skeleton width={40} height={16} borderRadius={4} />
            <Skeleton width={100} height={16} borderRadius={4} style={{ marginLeft: 8 }} />
          </View>
          <Skeleton width="90%" height={22} borderRadius={6} style={{ marginTop: 12, marginBottom: 8 }} />
          <Skeleton width="100%" height={32} borderRadius={6} />
          <View style={styles.cardFooter}>
            <Skeleton width={120} height={14} borderRadius={4} />
            <Skeleton width={80} height={14} borderRadius={4} />
          </View>
        </View>
      ))}
    </View>
  );
};

const styles = StyleSheet.create({
  skeleton: {
    overflow: "hidden",
  },
  listContainer: {
    padding: 16,
    gap: 12,
  },
  card: {
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 6,
    elevation: 2,
    marginBottom: 12,
  },
  cardHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 12,
  },
  cardRow: {
    flexDirection: "row",
    alignItems: "center",
  },
  cardFooter: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    borderTopWidth: 1,
    borderTopColor: "#F1F5F9",
    marginTop: 12,
    paddingTop: 10,
  },
});
export default Skeleton;
