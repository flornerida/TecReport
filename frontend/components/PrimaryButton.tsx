import React, { useRef } from 'react';
import { Animated, Pressable, StyleSheet, StyleProp, ViewStyle, ActivityIndicator } from 'react-native';
import { CustomText } from './CustomText';
import { theme } from '../theme/theme';

interface PrimaryButtonProps {
  title: string;
  onPress: () => void;
  loading?: boolean;
  disabled?: boolean;
  style?: StyleProp<ViewStyle>;
  variant?: 'primary' | 'outline' | 'ghost';
}

export const PrimaryButton: React.FC<PrimaryButtonProps> = ({
  title,
  onPress,
  loading = false,
  disabled = false,
  style,
  variant = 'primary',
}) => {
  const scale = useRef(new Animated.Value(1)).current;

  const handlePressIn = () => {
    Animated.spring(scale, {
      toValue: 0.95,
      useNativeDriver: true,
    }).start();
  };

  const handlePressOut = () => {
    Animated.spring(scale, {
      toValue: 1,
      useNativeDriver: true,
    }).start();
  };

  const getContainerStyle = () => {
    switch (variant) {
      case 'outline':
        return [styles.containerOutline, disabled && styles.containerDisabled];
      case 'ghost':
        return [styles.containerGhost, disabled && styles.containerDisabled];
      default:
        return [styles.containerPrimary, disabled && styles.containerDisabled];
    }
  };

  const getTextColor = () => {
    if (disabled && variant === 'primary') return '#FFF';
    if (disabled) return theme.colors.textMuted;
    if (variant === 'primary') return '#FFF';
    return theme.colors.primary;
  };

  return (
    <Animated.View style={[{ transform: [{ scale }] }, style]}>
      <Pressable
        onPress={onPress}
        onPressIn={handlePressIn}
        onPressOut={handlePressOut}
        disabled={disabled || loading}
        style={getContainerStyle()}
      >
        {loading ? (
          <ActivityIndicator color={getTextColor()} />
        ) : (
          <CustomText weight="semiBold" size={16} color={getTextColor()}>
            {title}
          </CustomText>
        )}
      </Pressable>
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  containerPrimary: {
    backgroundColor: theme.colors.primary,
    paddingVertical: theme.spacing.md,
    paddingHorizontal: theme.spacing.lg,
    borderRadius: theme.radii.lg,
    alignItems: 'center',
    justifyContent: 'center',
    ...theme.shadows.medium,
  },
  containerOutline: {
    backgroundColor: 'transparent',
    borderWidth: 2,
    borderColor: theme.colors.primary,
    paddingVertical: theme.spacing.md - 2, // Compensate for border
    paddingHorizontal: theme.spacing.lg,
    borderRadius: theme.radii.lg,
    alignItems: 'center',
    justifyContent: 'center',
  },
  containerGhost: {
    backgroundColor: 'transparent',
    paddingVertical: theme.spacing.md,
    paddingHorizontal: theme.spacing.lg,
    borderRadius: theme.radii.lg,
    alignItems: 'center',
    justifyContent: 'center',
  },
  containerDisabled: {
    backgroundColor: theme.colors.border,
    borderColor: theme.colors.border,
    shadowOpacity: 0,
    elevation: 0,
  },
});
