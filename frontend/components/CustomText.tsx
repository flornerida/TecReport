import React from 'react';
import { Text, TextProps, StyleSheet } from 'react-native';
import { theme } from '../theme/theme';

interface CustomTextProps extends TextProps {
  weight?: 'regular' | 'medium' | 'semiBold' | 'bold';
  color?: string;
  size?: number;
  align?: 'auto' | 'left' | 'right' | 'center' | 'justify';
}

export const CustomText: React.FC<CustomTextProps> = ({ 
  style, 
  weight = 'regular', 
  color = theme.colors.text,
  size = 14,
  align = 'left',
  children, 
  ...props 
}) => {
  return (
    <Text 
      style={[
        { 
          fontFamily: theme.typography[weight],
          color: color,
          fontSize: size,
          textAlign: align,
        },
        style
      ]} 
      {...props}
    >
      {children}
    </Text>
  );
};
