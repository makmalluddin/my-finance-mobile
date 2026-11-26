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
  ghost: {
    background: 'transparent',
    pressedBackground: colors.primarySoft,
    border: 'transparent',
    text: colors.primary,
    disabledBackground: 'transparent',
  },
  danger: {
    background: colors.danger,
    pressedBackground: colors.dangerPressed,
    border: colors.danger,
    text: colors.textInverse,
    disabledBackground: colors.dangerDisabled,
  },
};

const SIZES = {
  sm: {
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.md,
    fontSize: typography.button.fontSize,
  },
  md: {
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.lg,
    fontSize: typography.body.fontSize,
  },
  lg: {
    paddingVertical: spacing.lg,
    paddingHorizontal: spacing.xl,
    fontSize: typography.subheading.fontSize,
  },
};

/**
 * Tombol utama aplikasi dengan variasi `primary`, `secondary`, `ghost`,
 * dan `danger`. Menonaktifkan diri otomatis saat `loading`.
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
          paddingVertical: sizing.paddingVertical,
          paddingHorizontal: sizing.paddingHorizontal,
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
          color={variant === 'primary' || variant === 'danger' ? colors.textInverse : colors.primary}
        />
      ) : (
        <View style={styles.content}>
          {icon ? <View style={styles.icon}>{icon}</View> : null}
          <Text
            style={[
              styles.label,
              {
                fontSize: sizing.fontSize,
                color: isDisabled ? colors.textSubtle : palette.text,
              },
            ]}
            numberOfLines={1}
          >
            {title}
          </Text>
        </View>
      )}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  base: {
    borderRadius: radius.md,
    borderWidth: borderWidth.hairline,
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 44,
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
    ...typography.bodyStrong,
  },
});
