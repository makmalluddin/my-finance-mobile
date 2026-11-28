import { StyleSheet, Text, View } from 'react-native';
import { colors, radius, spacing, typography } from '@/shared/theme';
import { formatRupiah } from '@/shared/utils/currency';
import { formatDate, fromDateKey, MONTHS_SHORT } from '@/shared/utils/date';

const BAR_HEIGHT = 94;

function dayLabel(dateKey) {
  const date = fromDateKey(dateKey);
  return date ? String(date.getDate()) : String(dateKey ?? '').slice(8);
}

function shortMonth(dateKey) {
  const date = fromDateKey(dateKey);
  return date ? MONTHS_SHORT[date.getMonth()] : '';
}

/**
 * Grafik batang sederhana tanpa library tambahan. Sumbu Y dan hari dengan
 * pengeluaran terbesar mengikuti mockup Fase 7B.
 */
export default function ExpenseChart({ series = [] }) {
  const points = Array.isArray(series) ? series : [];
  const values = points.map((point) => Number(point.total) || 0);
  const max = Math.max(...values, 0);
  const axisMax = Math.max(Math.ceil(max / 10000) * 10000, 10000);
  const total = values.reduce((sum, value) => sum + value, 0);
  const peak = max > 0 ? values.indexOf(max) : -1;

  const first = points[0]?.date;
  const last = points[points.length - 1]?.date;
  const range = first
    ? `${dayLabel(first)}${last && last !== first ? `–${dayLabel(last)}` : ''} ${
        shortMonth(last ?? first)
      }`
    : '';

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <View style={styles.headerSpacer} />
        {range ? <Text style={styles.range}>{range}</Text> : null}
      </View>

      <View style={styles.chart}>
        <View style={styles.yAxis}>
          {[1, 0.66, 0.33, 0].map((ratio, index) => (
            <Text key={index} style={styles.yLabel}>
              {index === 3 ? '0' : `${Math.round((axisMax * ratio) / 1000)}rb`}
            </Text>
          ))}
        </View>
        <View style={styles.plot}>
          {points.map((point, index) => {
            const value = values[index];
            const height = value > 0 ? Math.max(4, Math.round((value / axisMax) * BAR_HEIGHT)) : 0;
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
                  {height > 0 ? (
                    <View style={[styles.bar, { height }]} />
                  ) : null}
                </View>
                <Text
                  style={[
                    styles.label,
                    index === peak && styles.labelPeak,
                  ]}
                  numberOfLines={1}
                >
                  {dayLabel(point.date)}
                </Text>
              </View>
            );
          })}
        </View>
      </View>

      <View style={styles.footer}>
        <View style={styles.footerLeft}>
          <View style={styles.footerDot} />
          <Text style={styles.footerLabel}>Total pengeluaran</Text>
        </View>
        <Text style={styles.footerValue}>{formatRupiah(total)}</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginTop: spacing.xs,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.sm,
  },
  headerSpacer: {
    flex: 1,
  },
  range: {
    ...typography.chartLabel,
    fontWeight: '650',
    color: colors.textSubtle,
  },
  chart: {
    flexDirection: 'row',
  },
  yAxis: {
    width: 34,
    height: BAR_HEIGHT + 20,
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  yLabel: {
    ...typography.chartLabel,
    color: colors.textSubtle,
  },
  plot: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'flex-end',
    justifyContent: 'space-between',
    height: BAR_HEIGHT + 20,
  },
  column: {
    flex: 1,
    alignItems: 'center',
    paddingHorizontal: 2,
  },
  track: {
    height: BAR_HEIGHT,
    width: '100%',
    maxWidth: 18,
    justifyContent: 'flex-end',
  },
  bar: {
    width: '100%',
    borderTopLeftRadius: radius.xs,
    borderTopRightRadius: radius.xs,
    backgroundColor: colors.chartBar,
  },
  label: {
    ...typography.chartLabel,
    color: colors.textSubtle,
    marginTop: spacing.xxs,
    paddingHorizontal: spacing.xs,
    borderRadius: radius.xs,
    fontWeight: '600',
  },
  labelPeak: {
    backgroundColor: colors.chartHighlightBg,
    color: colors.chartHighlightText,
    fontWeight: '750',
  },
  footer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: spacing.sm,
  },
  footerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  footerDot: {
    width: 7,
    height: 7,
    borderRadius: radius.xs,
    backgroundColor: colors.chartBar,
    marginRight: spacing.sm,
  },
  footerLabel: {
    fontSize: 11,
    color: colors.textMuted,
  },
  footerValue: {
    ...typography.bodyStrong,
    color: colors.text,
  },
});
