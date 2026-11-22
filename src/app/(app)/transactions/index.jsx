import { Card, EmptyState, PageHeader, Screen } from '@/shared/components';
import { StyleSheet, Text } from 'react-native';
import { colors, spacing, typography } from '@/shared/theme';

export default function TransactionsScreen() {
  return (
    <Screen>
      <PageHeader
        title="Transaksi"
        subtitle="Riwayat Income, Expense, dan Transfer"
      />

      <Card style={styles.card}>
        <Text style={styles.sectionTitle}>Riwayat</Text>
        <EmptyState
          icon="receipt-outline"
          title="Belum ada transaksi"
          message="Pencatatan transaksi tersedia setelah data layer dan AppServices terpasang."
        />
      </Card>
    </Screen>
  );
}

const styles = StyleSheet.create({
  card: {
    marginBottom: spacing.lg,
  },
  sectionTitle: {
    ...typography.subheading,
    color: colors.text,
    marginBottom: spacing.sm,
  },
});
