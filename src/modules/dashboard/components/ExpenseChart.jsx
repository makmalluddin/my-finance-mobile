import { StyleSheet, Text, View } from 'react-native';
import { colors, spacing, typography } from '@/shared/theme';
import { formatRupiah } from '@/shared/utils/currency';
import { formatDate, fromDateKey, MONTHS_SHORT } from '@/shared/utils/date';

const BAR_HEIGHT = 110;

function shortLabel(dateKey) {
  const date = fromDateKey(dateKey);
  if (!date) {
    return String(dateKey ?? '').slice(5);
  }
  return `${date.getDate()} ${MONTHS_SHORT[date.getMonth()]}`;
}

/**
 * Grafik batang sederhana tanpa library tambahan. Tinggi batang dihitung
 * relatif terhadap hari dengan Expense terbesar dalam rentang tujuh hari.
 */
export default function ExpenseChart({ series = [] }) {
  const points = Array.isArray(series) ? series : [];
  const max = Math.max(...points.map((point) => Number(point.total) || 0), 1);
  const total = points.reduce((sum, point) => sum + (Number(point.total) || 0), 0);

  return (
    <View style={styles.container}>
      <View style={styles.plot}>
        {points.map((point) => {
          const value = Number(point.total) || 0;
          const height = Math.max(value > 0 ? 4 : 2, Math.round((value / max) * BAR_HEIGHT));
          const date = fromDateKey(point.date);

          return (
            <View
              key={point.date}
              style={styles.column}
              accessible
              accessibilityLabel={`${
                date ? formatDate(date) : point.date
              }: ${formatRupiah(value)}`}
            >
              <View style={styles.track}>
                <View style={[styles.bar, { height, backgroundColor: colors.primary }]} />
              </View>
              <Text style={styles.label} numberOfLines={1}>
                {shortLabel(point.date)}
              </Text>
            </View>
          );
        })}
      </View>

      <View style={styles.footer}>
        <Text style={styles.footerLabel}>Total 7 hari</Text>
        <Text style={styles.footerValue}>{formatRupiah(total)}</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginTop: spacing.xs,
  },
  plot: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    justifyContent: 'space-between',
    minHeight: BAR_HEIGHT + 28,
  },
  column: {
    flex: 1,
    alignItems: 'center',
    paddingHorizontal: 2,
  },
  track: {
    height: BAR_HEIGHT,
    width: '100%',
    maxWidth: 28,
    justifyContent: 'flex-end',
  },
  bar: {
    borderRadius: 4,
    minHeight: 2,
  },
  label: {
    ...typography.caption,
    color: colors.textMuted,
    marginTop: spacing.xs,
    fontSize: 10,
  },
  footer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: spacing.md,
    paddingTop: spacing.sm,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: colors.border,
  },
  footerLabel: {
    ...typography.body,
    color: colors.textMuted,
  },
  footerValue: {
    ...typography.bodyStrong,
    color: colors.text,
  },
});
