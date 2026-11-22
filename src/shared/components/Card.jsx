import { Pressable, StyleSheet, View } from 'react-native';
import { colors, radius, shadows, spacing, borderWidth } from '../theme';

/**
 * Kartu konten. Jika `onPress` diberikan, kartu menjadi pressable.
 */
export default function Card({
  children,
  onPress,
  style,
  padded = true,
  tone = 'default',
  accessibilityLabel,
  ...rest
}) {
  const cardStyle = [
    styles.card,
    tone === 'muted' && styles.muted,
    padded && styles.padded,
    style,
  ];

  if (!onPress) {
    return <View style={cardStyle}>{children}</View>;
  }

  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="button"
      accessibilityLabel={accessibilityLabel}
      style={({ pressed }) => [cardStyle, pressed && styles.pressed]}
      {...rest}
    >
      {children}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: colors.surface,
    borderRadius: radius.lg,
    borderWidth: borderWidth.hairline,
    borderColor: colors.border,
    ...shadows.card,
  },
  muted: {
    backgroundColor: colors.surfaceMuted,
    shadowOpacity: 0,
    elevation: 0,
  },
  padded: {
    padding: spacing.lg,
  },
  pressed: {
    backgroundColor: colors.surfaceMuted,
  },
});
