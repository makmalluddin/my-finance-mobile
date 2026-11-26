import Ionicons from '@expo/vector-icons/Ionicons';
import { StyleSheet, Text, View } from 'react-native';
import { Badge, Card, EmptyState, LoadingState } from '@/shared/components';
import { colors, radius, spacing, typography } from '@/shared/theme';
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
      <Card style={styles.summary} tone="accent">
        <View style={styles.summaryHead}>
          <View style={styles.summaryIcon}>
            <Ionicons name="wallet-outline" size={17} color={colors.primary} />
          </View>
          <Text style={styles.summaryLabel}>Active Balance</Text>
        </View>
        <Text style={styles.summaryAmount}>
          {formatRupiah(dashboard?.activeBalance ?? 0)}
        </Text>
        <View style={styles.summaryDetails}>
          <Text style={styles.detailLabel}>Total saldo Active Fund</Text>
          <Text style={styles.detailValue}>
            {formatRupiah(dashboard?.totalActiveFundsBalance ?? 0)}
          </Text>
        </View>
        <View style={styles.summaryDetails}>
          <Text style={styles.detailLabel}>Alokasi Expense planned</Text>
          <Text style={[styles.detailValue, styles.detailNegative]}>
            − {formatRupiah(outstanding)}
          </Text>
        </View>
      </Card>

      <Card style={styles.card}>
        <View style={styles.sectionHead}>
          <Text style={styles.sectionTitle}>Active Fund</Text>
          <Badge label={`${activeFunds.length} Fund`} tone="neutral" />
        </View>
        {activeFunds.length > 0 ? (
          activeFunds.map((fund) => (
            <View key={fund.id} style={styles.fundRow}>
              <View style={styles.fundIcon}>
                <Ionicons name="wallet-outline" size={18} color={colors.primary} />
              </View>
              <View style={styles.fundIdentity}>
                <Text style={styles.fundName}>{fund.name}</Text>
                <Text style={styles.fundType}>Active</Text>
              </View>
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
    backgroundColor: colors.balanceBg,
    borderColor: colors.balanceBorder,
    borderRadius: 17,
    paddingVertical: spacing.lg,
    paddingHorizontal: 17,
    marginBottom: spacing.md,
  },
  summaryHead: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  summaryIcon: {
    width: 29,
    height: 29,
    borderRadius: radius.sm,
    backgroundColor: colors.balanceIconBg,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: spacing.lg,
  },
  summaryLabel: {
    ...typography.bodyStrong,
    color: colors.balanceLabel,
  },
  summaryAmount: {
    ...typography.balanceAmount,
    color: colors.balanceAmount,
    marginTop: spacing.md,
  },
  summaryDetails: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: spacing.md,
  },
  detailLabel: {
    fontSize: 11.5,
    lineHeight: 16,
    color: colors.detailMuted,
  },
  detailValue: {
    fontSize: 11.5,
    lineHeight: 16,
    fontWeight: '700',
    color: colors.text,
  },
  detailNegative: {
    color: colors.danger,
  },
  card: {
    marginBottom: spacing.md,
  },
  sectionHead: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: spacing.sm,
  },
  sectionTitle: {
    ...typography.sectionTitle,
    color: colors.text,
  },
  fundRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: spacing.xs,
  },
  fundIcon: {
    width: 37,
    height: 37,
    borderRadius: radius.tab,
    backgroundColor: colors.primarySoft,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: spacing.md,
  },
  fundIdentity: {
    flex: 1,
  },
  fundName: {
    ...typography.bodyStrong,
    color: colors.text,
  },
  fundType: {
    ...typography.meta,
    color: colors.textMuted,
    marginTop: spacing.xxs,
  },
  fundBalance: {
    ...typography.bodyStrong,
    color: colors.text,
  },
});
