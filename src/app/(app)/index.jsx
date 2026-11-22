import { StyleSheet, Text, View } from 'react-native';
import { Card, EmptyState, PageHeader, Screen } from '@/shared/components';
import { colors, spacing, typography } from '@/shared/theme';

export default function DashboardScreen() {
  return (
    <Screen>
      <PageHeader
        title="Dashboard"
        subtitle="Ringkasan keuangan Anda"
      />

      <Card style={styles.summary}>
        <Text style={styles.summaryLabel}>Active Balance</Text>
        <Text style={styles.summaryAmount}>Rp 0</Text>
        <Text style={styles.summaryHint}>
          Saldo akan muncul setelah Fund dan transaksi dibuat.
        </Text>
      </Card>

      <Card>
        <Text style={styles.sectionTitle}>Pengeluaran 7 Hari</Text>
        <EmptyState
          icon="bar-chart-outline"
          title="Belum ada pengeluaran"
          message="Grafik muncul setelah Expense pertama tercatat."
        />
      </Card>

      <View style={styles.footer}>
        <Text style={styles.footerText}>
          Dashboard terhubung ke Supabase pada tahap implementasi berikutnya.
        </Text>
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  summary: {
    marginBottom: spacing.lg,
  },
  summaryLabel: {
    ...typography.label,
    color: colors.textMuted,
    textTransform: 'uppercase',
    letterSpacing: 0.6,
  },
  summaryAmount: {
    ...typography.display,
    color: colors.text,
    marginTop: spacing.xs,
  },
  summaryHint: {
    ...typography.caption,
    color: colors.textMuted,
    marginTop: spacing.xs,
  },
  sectionTitle: {
    ...typography.subheading,
    color: colors.text,
    marginBottom: spacing.sm,
  },
  footer: {
    marginTop: spacing.xl,
    paddingHorizontal: spacing.xs,
  },
  footerText: {
    ...typography.caption,
    color: colors.textSubtle,
    textAlign: 'center',
  },
});
