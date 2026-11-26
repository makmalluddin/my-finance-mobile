import { Pressable, StyleSheet, View } from 'react-native';
import { colors, radius, shadows, layout, borderWidth } from '../theme';

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
    tone === 'accent' && styles.accent,
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
    borderRadius: radius.md,
    borderWidth: borderWidth.hairline,
    borderColor: colors.border,
    ...shadows.card,
  },
  muted: {
    backgroundColor: colors.surfaceMuted,
    borderColor: colors.border,
  },
  accent: {
    backgroundColor: colors.surfaceAccent,
    borderColor: colors.balanceBorder,
  },
  padded: {
    padding: layout.cardPadding,
  },
  pressed: {
    backgroundColor: colors.surfaceMuted,
  },
});
