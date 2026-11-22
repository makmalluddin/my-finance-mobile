import { StyleSheet, Text } from 'react-native';
import { Card, EmptyState, PageHeader, Screen } from '@/shared/components';
import { colors, spacing, typography } from '@/shared/theme';

export default function PocketsScreen() {
  return (
    <Screen>
      <PageHeader
        title="Pocket"
        subtitle="Kelola rencana dan alokasi dana"
      />

      <Card style={styles.card}>
        <Text style={styles.sectionTitle}>Daftar Pocket</Text>
        <EmptyState
          icon="albums-outline"
          title="Belum ada Pocket"
          message="Pocket Income, Expense, dan Transfer akan tampil di sini."
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
