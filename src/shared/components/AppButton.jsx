import { ActivityIndicator, Pressable, StyleSheet, Text, View } from 'react-native';
import { colors, radius, spacing, borderWidth, typography } from '../theme';

const VARIANTS = {
  primary: {
    background: colors.primary,
    pressedBackground: colors.primaryPressed,
    border: colors.primary,
    text: colors.textInverse,
    disabledBackground: colors.primaryDisabled,
  },
  secondary: {
    background: colors.surface,
    pressedBackground: colors.surfaceMuted,
    border: colors.borderStrong,
    text: colors.text,
    disabledBackground: colors.surfaceMuted,
  },
  outline: {
    background: 'transparent',
    pressedBackground: colors.primarySoft,
    border: colors.borderStrong,
    text: colors.iconMuted,
    disabledBackground: 'transparent',
  },
  danger: {
    background: colors.danger,
    pressedBackground: colors.dangerPressed,
    border: colors.danger,
    text: colors.textInverse,
    disabledBackground: colors.dangerDisabled,
  },
  dangerOutline: {
    background: colors.surface,
    pressedBackground: colors.dangerSoft,
    border: colors.borderStrong,
    text: colors.danger,
    disabledBackground: colors.surfaceMuted,
  },
  ghost: {
    background: 'transparent',
    pressedBackground: colors.primarySoft,
    border: 'transparent',
    text: colors.primary,
    disabledBackground: 'transparent',
  },
};

const SIZES = {
  sm: { paddingHorizontal: spacing.md, minHeight: 44 },
  md: { paddingHorizontal: spacing.lg, minHeight: 44 },
  lg: { paddingHorizontal: spacing.xl, minHeight: 48 },
};

/**
 * Tombol mockup: tinggi 44px, radius 10px, label 13px/700.
 * Varian `outline` dan `dangerOutline` dipakai untuk aksi sekunder.
 */
export default function AppButton({
  title,
  onPress,
  variant = 'primary',
  size = 'md',
  loading = false,
  disabled = false,
  icon = null,
  fullWidth = true,
  style,
  textStyle,
  accessibilityLabel,
}) {
  const palette = VARIANTS[variant] || VARIANTS.primary;
  const sizing = SIZES[size] || SIZES.md;
  const isDisabled = disabled || loading;

  return (
    <Pressable
      onPress={onPress}
      disabled={isDisabled}
      accessibilityRole="button"
      accessibilityLabel={accessibilityLabel || title}
      accessibilityState={{ disabled: isDisabled, busy: loading }}
      style={({ pressed }) => [
        styles.base,
        {
          paddingHorizontal: sizing.paddingHorizontal,
          minHeight: sizing.minHeight,
          backgroundColor: isDisabled
            ? palette.disabledBackground
            : pressed
              ? palette.pressedBackground
              : palette.background,
          borderColor: isDisabled ? colors.border : palette.border,
        },
        fullWidth && styles.fullWidth,
        style,
      ]}
    >
      {loading ? (
        <ActivityIndicator
          size="small"
          color={
            variant === 'primary' || variant === 'danger'
              ? colors.textInverse
              : colors.primary
          }
        />
      ) : (
        <View style={styles.content}>
          {icon ? <View style={styles.icon}>{icon}</View> : null}
          <Text style={[styles.label, { color: isDisabled ? colors.textSubtle : palette.text }, textStyle]} numberOfLines={1}>
            {title}
          </Text>
        </View>
      )}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  base: {
    borderRadius: radius.button,
    borderWidth: borderWidth.hairline,
    alignItems: 'center',
    justifyContent: 'center',
  },
  fullWidth: {
    alignSelf: 'stretch',
  },
  content: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  icon: {
    marginRight: spacing.sm,
  },
  label: {
    ...typography.button,
  },
});
