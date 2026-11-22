import { StyleSheet, Text } from 'react-native';
import { Card, EmptyState, PageHeader, Screen } from '@/shared/components';
import { colors, spacing, typography } from '@/shared/theme';

export default function FundsScreen() {
  return (
    <Screen>
      <PageHeader
        title="Fund"
        subtitle="Active Fund dan Savings/Goal Fund"
      />

      <Card style={styles.card}>
        <Text style={styles.sectionTitle}>Daftar Fund</Text>
        <EmptyState
          icon="wallet-outline"
          title="Belum ada Fund"
          message="Saldo Fund dihitung dari Opening Balance dan transaksi aktual."
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
