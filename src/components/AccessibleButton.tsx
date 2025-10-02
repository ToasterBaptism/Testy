/**
 * Accessible Button Component
 * Fully accessible button with TalkBack support, high contrast, and haptic feedback
 */

import React from 'react';
import {
  TouchableOpacity,
  Text,
  StyleSheet,
  ViewStyle,
  TextStyle,
  AccessibilityRole,
} from 'react-native';
import {useSelector} from 'react-redux';
import {selectSettings} from '@/services/store';
import {triggerHapticFeedback, HapticType} from '@/services/haptics';

interface AccessibleButtonProps {
  title: string;
  onPress: () => void;
  disabled?: boolean;
  style?: ViewStyle;
  textStyle?: TextStyle;
  accessibilityLabel?: string;
  accessibilityHint?: string;
  accessibilityRole?: AccessibilityRole;
  variant?: 'primary' | 'secondary' | 'danger' | 'success';
  size?: 'small' | 'medium' | 'large';
}

const AccessibleButton: React.FC<AccessibleButtonProps> = ({
  title,
  onPress,
  disabled = false,
  style,
  textStyle,
  accessibilityLabel,
  accessibilityHint,
  accessibilityRole = 'button',
  variant = 'primary',
  size = 'medium',
}) => {
  const settings = useSelector(selectSettings);

  const handlePress = () => {
    if (disabled) return;

    // Trigger haptic feedback if enabled
    if (settings.hapticFeedbackEnabled) {
      triggerHapticFeedback(HapticType.IMPACT_LIGHT);
    }

    onPress();
  };

  const getButtonStyle = (): ViewStyle => {
    const baseStyle = styles.button;
    const sizeStyle = styles[`${size}Button` as keyof typeof styles] as ViewStyle;
    const variantStyle = styles[`${variant}Button` as keyof typeof styles] as ViewStyle;
    const disabledStyle = disabled ? styles.disabledButton : {};
    const highContrastStyle = settings.highContrastMode ? styles.highContrastButton : {};

    return {
      ...baseStyle,
      ...sizeStyle,
      ...variantStyle,
      ...disabledStyle,
      ...highContrastStyle,
      ...style,
    };
  };

  const getTextStyle = (): TextStyle => {
    const baseStyle = styles.text;
    const sizeStyle = styles[`${size}Text` as keyof typeof styles] as TextStyle;
    const variantStyle = styles[`${variant}Text` as keyof typeof styles] as TextStyle;
    const disabledStyle = disabled ? styles.disabledText : {};
    const largeTextStyle = settings.largeTextMode ? styles.largeText : {};
    const highContrastStyle = settings.highContrastMode ? styles.highContrastText : {};

    return {
      ...baseStyle,
      ...sizeStyle,
      ...variantStyle,
      ...disabledStyle,
      ...largeTextStyle,
      ...highContrastStyle,
      ...textStyle,
    };
  };

  return (
    <TouchableOpacity
      style={getButtonStyle()}
      onPress={handlePress}
      disabled={disabled}
      accessible={true}
      accessibilityRole={accessibilityRole}
      accessibilityLabel={accessibilityLabel || title}
      accessibilityHint={accessibilityHint}
      accessibilityState={{
        disabled,
        selected: false,
      }}
      // Ensure minimum touch target size for accessibility
      hitSlop={{top: 10, bottom: 10, left: 10, right: 10}}>
      <Text style={getTextStyle()}>{title}</Text>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  // Base styles
  button: {
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: {width: 0, height: 1},
    shadowOpacity: 0.22,
    shadowRadius: 2.22,
  },
  text: {
    fontWeight: '600',
    textAlign: 'center',
  },

  // Size variants
  smallButton: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    minHeight: 36,
  },
  mediumButton: {
    paddingHorizontal: 16,
    paddingVertical: 12,
    minHeight: 44, // Minimum touch target size
  },
  largeButton: {
    paddingHorizontal: 24,
    paddingVertical: 16,
    minHeight: 52,
  },

  smallText: {
    fontSize: 14,
  },
  mediumText: {
    fontSize: 16,
  },
  largeText: {
    fontSize: 18,
  },

  // Color variants
  primaryButton: {
    backgroundColor: '#1976D2',
  },
  primaryText: {
    color: '#FFFFFF',
  },

  secondaryButton: {
    backgroundColor: '#E0E0E0',
    borderWidth: 1,
    borderColor: '#BDBDBD',
  },
  secondaryText: {
    color: '#424242',
  },

  dangerButton: {
    backgroundColor: '#F44336',
  },
  dangerText: {
    color: '#FFFFFF',
  },

  successButton: {
    backgroundColor: '#4CAF50',
  },
  successText: {
    color: '#FFFFFF',
  },

  // Disabled state
  disabledButton: {
    backgroundColor: '#E0E0E0',
    elevation: 0,
    shadowOpacity: 0,
  },
  disabledText: {
    color: '#9E9E9E',
  },

  // Accessibility enhancements
  extraLargeText: {
    fontSize: 20,
  },

  highContrastButton: {
    borderWidth: 2,
    borderColor: '#000000',
  },
  highContrastText: {
    fontWeight: 'bold',
  },
});

export default AccessibleButton;