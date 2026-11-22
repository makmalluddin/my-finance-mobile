import { ActivityIndicator, StyleSheet, Text, View } from 'react-native';
import { colors, spacing, typography } from '../theme';

/**
 * Indikator loading. `inline` dipakai di dalam kartu/daftar, sedangkan
 * mode default mengisi area layar.
 */
export default function LoadingState({ message = 'Memuat data...', inline = false, style }) {
  return (
    <View style={[inline ? styles.inline : styles.container, style]}>
      <ActivityIndicator size={inline ? 'small' : 'large'} color={colors.primary} />
      {message ? <Text style={styles.message}>{message}</Text> : null}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: spacing.huge,
  },
  inline: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: spacing.xxl,
  },
  message: {
    ...typography.body,
    color: colors.textMuted,
    marginTop: spacing.md,
    textAlign: 'center',
  },
});
