import { StyleSheet, Text, View } from 'react-native';
import { Badge } from '@/shared/components';
import { colors, spacing, typography } from '@/shared/theme';

/**
 * Daftar Category sistem bersifat read-only. Dipakai untuk memverifikasi
 * CAT-001 dan CAT-002 tanpa menyediakan pengelolaan kategori kustom.
 */
export default function CategorySummary({ categories, loading = false }) {
  const income = categories?.income ?? [];
  const expense = categories?.expense ?? [];

  const renderNames = (items) =>
    loading
      ? 'Memuat kategori...'
      : items.length > 0
        ? items.map((item) => item.name).join(', ')
        : 'Tidak ada kategori.';

  return (
    <View style={styles.container}>
      <View style={styles.row}>
        <Badge label="Income" tone="income" />
        <Text style={styles.names}>{renderNames(income)}</Text>
      </View>
      <View style={[styles.row, styles.divider]}>
        <Badge label="Expense" tone="expense" />
        <Text style={styles.names}>{renderNames(expense)}</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginTop: spacing.sm,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: spacing.sm,
  },
  divider: {
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: colors.border,
  },
  names: {
    ...typography.captionStrong,
    color: colors.textMuted,
    marginLeft: spacing.md,
    flex: 1,
  },
});
