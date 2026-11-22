import { StyleSheet, Text, View } from 'react-native';
import { Card, EmptyState, LoadingState } from '@/shared/components';
import { colors, spacing, typography } from '@/shared/theme';
import { formatRupiah } from '@/shared/utils/currency';
import ExpenseChart from './ExpenseChart';

export default function DashboardOverview({ dashboard, loading = false }) {
  if (loading) {
    return <LoadingState message="Memuat ringkasan keuangan..." />;
  }

  const activeFunds = dashboard?.activeFunds ?? [];
  const outstanding = dashboard?.outstandingExpenseAllocation ?? 0;

  return (
    <View>
      <Card style={styles.summary}>
        <Text style={styles.summaryLabel}>Active Balance</Text>
        <Text style={styles.summaryAmount}>
          {formatRupiah(dashboard?.activeBalance ?? 0)}
        </Text>
        <Text style={styles.summaryHint}>
          Saldo Active Fund dikurangi alokasi Expense yang masih direncanakan.
        </Text>
        <View style={styles.summaryDetails}>
          <Text style={styles.detailLabel}>Total saldo Active Fund</Text>
          <Text style={styles.detailValue}>
            {formatRupiah(dashboard?.totalActiveFundsBalance ?? 0)}
          </Text>
        </View>
        <View style={styles.summaryDetails}>
          <Text style={styles.detailLabel}>Alokasi Expense planned</Text>
          <Text style={styles.detailValue}>{formatRupiah(outstanding)}</Text>
        </View>
      </Card>

      <Card style={styles.card}>
        <Text style={styles.sectionTitle}>Active Fund</Text>
        {activeFunds.length > 0 ? (
          activeFunds.map((fund) => (
            <View key={fund.id} style={styles.fundRow}>
              <Text style={styles.fundName}>{fund.name}</Text>
              <Text style={styles.fundBalance}>{formatRupiah(fund.balance)}</Text>
            </View>
          ))
        ) : (
          <EmptyState
            icon="wallet-outline"
            title="Belum ada Active Fund"
            message="Buat Fund berklasifikasi Active pada halaman Fund untuk mulai mencatat saldo."
          />
        )}
      </Card>

      <Card style={styles.card}>
        <Text style={styles.sectionTitle}>Pengeluaran 7 Hari</Text>
        <ExpenseChart series={dashboard?.expenseSeries} />
      </Card>
    </View>
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
  summaryDetails: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: spacing.md,
    paddingTop: spacing.md,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: colors.border,
  },
  detailLabel: {
    ...typography.body,
    color: colors.textMuted,
  },
  detailValue: {
    ...typography.bodyStrong,
    color: colors.text,
  },
  card: {
    marginBottom: spacing.lg,
  },
  sectionTitle: {
    ...typography.subheading,
    color: colors.text,
    marginBottom: spacing.sm,
  },
  fundRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: spacing.sm,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: colors.border,
  },
  fundName: {
    ...typography.body,
    color: colors.text,
    flex: 1,
    paddingRight: spacing.md,
  },
  fundBalance: {
    ...typography.bodyStrong,
    color: colors.success,
  },
});
