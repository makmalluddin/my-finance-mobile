import Ionicons from '@expo/vector-icons/Ionicons';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { colors, radius, spacing, typography } from '../theme';

const TONES = {
  error: {
    background: colors.dangerSoft,
    border: colors.danger,
    text: colors.danger,
    icon: 'alert-circle-outline',
  },
  warning: {
    background: colors.warningSoft,
    border: colors.warning,
    text: colors.warning,
    icon: 'warning-outline',
  },
  info: {
    background: colors.primarySoft,
    border: colors.primary,
    text: colors.primary,
    icon: 'information-circle-outline',
  },
  success: {
    background: colors.successSoft,
    border: colors.success,
    text: colors.success,
    icon: 'checkmark-circle-outline',
  },
};

/**
 * Banner pesan error/informasi. `onDismiss` opsional menampilkan tombol tutup.
 */
export default function ErrorBanner({
  message,
  tone = 'error',
  onDismiss,
  style,
}) {
  const palette = TONES[tone] || TONES.error;

  if (!message) {
    return null;
  }

  return (
    <View
      style={[
        styles.container,
        { backgroundColor: palette.background, borderColor: palette.border },
        style,
      ]}
      accessibilityRole="alert"
      accessibilityLiveRegion="polite"
    >
      <Ionicons name={palette.icon} size={20} color={palette.text} />
      <Text style={[styles.message, { color: palette.text }]}>{message}</Text>
      {onDismiss ? (
        <Pressable
          onPress={onDismiss}
          accessibilityRole="button"
          accessibilityLabel="Tutup pesan"
          hitSlop={8}
          style={styles.dismiss}
        >
          <Ionicons name="close" size={18} color={palette.text} />
        </Pressable>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    padding: spacing.md,
    borderRadius: radius.md,
    borderWidth: 1,
    marginBottom: spacing.lg,
  },
  message: {
    flex: 1,
    ...typography.body,
    marginLeft: spacing.sm,
  },
  dismiss: {
    marginLeft: spacing.sm,
  },
});
