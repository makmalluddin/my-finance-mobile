import { StyleSheet, Text, View } from 'react-native';
import { AppButton, EmptyState } from '@/shared/components';
import { colors, spacing, typography } from '@/shared/theme';
import FundCard from './FundCard';

function Section({ title, children }) {
  return (
    <View style={styles.section}>
      <Text style={styles.sectionTitle}>{title}</Text>
      {children}
    </View>
  );
}

export default function FundList({
  funds,
  busy = false,
  onCreate,
  onEdit,
  onArchive,
  onUnarchive,
  onDelete,
}) {
  const activeFunds = funds.filter((fund) => !fund.isArchived);
  const archivedFunds = funds.filter((fund) => fund.isArchived);

  const renderCards = (items) =>
    items.map((fund) => (
      <FundCard
        key={fund.id}
        fund={fund}
        busy={busy}
        onEdit={onEdit}
        onArchive={onArchive}
        onUnarchive={onUnarchive}
        onDelete={onDelete}
      />
    ));

  return (
    <View>
      <Section title={activeFunds.length > 0 ? 'Daftar Fund' : 'Belum ada Fund'}>
        {activeFunds.length > 0 ? (
          renderCards(activeFunds)
        ) : (
          <EmptyState
            icon="wallet-outline"
            title="Belum ada Fund"
            message="Buat Fund pertama untuk mencatat saldo awal dan aktivitas keuangan Anda."
            action={
              <AppButton
                title="Buat Fund"
                onPress={onCreate}
                disabled={busy}
                style={styles.createButton}
              />
            }
          />
        )}
      </Section>

      {archivedFunds.length > 0 ? (
        <Section title={`Diarsipkan (${archivedFunds.length})`}>{renderCards(archivedFunds)}</Section>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  section: {
    marginBottom: spacing.lg,
  },
  sectionTitle: {
    ...typography.heading,
    color: colors.text,
    marginBottom: spacing.sm,
  },
  createButton: {
    minWidth: 160,
  },
});
