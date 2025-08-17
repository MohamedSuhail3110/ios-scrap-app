import React from 'react';
import { TouchableOpacity, Text, StyleSheet, ViewStyle, TextStyle } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { colors } from '@/constants/colors';

interface CustomButtonProps {
  title: string;
  onPress: () => void;
  variant?: 'primary' | 'secondary' | 'success' | 'danger' | 'outline';
  size?: 'small' | 'medium' | 'large';
  disabled?: boolean;
  style?: ViewStyle;
  textStyle?: TextStyle;
}

export default function CustomButton({
  title,
  onPress,
  variant = 'primary',
  size = 'medium',
  disabled = false,
  style,
  textStyle
}: CustomButtonProps) {
  const getGradientColors = () => {
    switch (variant) {
      case 'success':
        return [colors.primary.green, colors.primary.greenLight];
      case 'danger':
        return [colors.primary.red, colors.primary.redLight];
      case 'primary':
        return [colors.primary.green, colors.primary.greenLight];
      default:
        return [colors.gray[300], colors.gray[400]];
    }
  };

  const getButtonStyle = () => {
    const baseStyle = [styles.button, styles[size]];
    if (variant === 'outline') {
      baseStyle.push(styles.outline);
    }
    if (disabled) {
      baseStyle.push(styles.disabled);
    }
    return baseStyle;
  };

  const getTextStyle = () => {
    const baseStyle = [styles.text, styles[`${size}Text`]];
    if (variant === 'outline') {
      baseStyle.push(styles.outlineText);
    }
    if (disabled) {
      baseStyle.push(styles.disabledText);
    }
    return baseStyle;
  };

  if (variant === 'outline' || disabled) {
    return (
      <TouchableOpacity
        style={[getButtonStyle(), style]}
        onPress={onPress}
        disabled={disabled}
        activeOpacity={0.8}
      >
        <Text style={[getTextStyle(), textStyle]}>{title}</Text>
      </TouchableOpacity>
    );
  }

  return (
    <TouchableOpacity style={[style]} onPress={onPress} disabled={disabled} activeOpacity={0.8}>
      <LinearGradient
        colors={getGradientColors()}
        style={getButtonStyle()}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 0 }}
      >
        <Text style={[getTextStyle(), textStyle]}>{title}</Text>
      </LinearGradient>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  button: {
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center'
  },
  small: {
    paddingHorizontal: 16,
    paddingVertical: 8
  },
  medium: {
    paddingHorizontal: 24,
    paddingVertical: 12
  },
  large: {
    paddingHorizontal: 32,
    paddingVertical: 16
  },
  outline: {
    borderWidth: 2,
    borderColor: colors.primary.green,
    backgroundColor: 'transparent'
  },
  disabled: {
    backgroundColor: colors.gray[300]
  },
  text: {
    fontWeight: '600',
    color: colors.text.white,
    textAlign: 'center'
  },
  smallText: {
    fontSize: 14
  },
  mediumText: {
    fontSize: 16
  },
  largeText: {
    fontSize: 18
  },
  outlineText: {
    color: colors.primary.green
  },
  disabledText: {
    color: colors.gray[500]
  }
});