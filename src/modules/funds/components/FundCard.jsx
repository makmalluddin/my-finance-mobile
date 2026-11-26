import { StyleSheet, Text, View } from 'react-native';
import { AppButton, Card } from '@/shared/components';
import { colors, radius, spacing, typography } from '@/shared/theme';
import { formatRupiah } from '@/shared/utils/currency';

const TYPE_LABELS = {
  active: 'Active',
  savings_goal: 'Savings/Goal',
};

/**
 * Kartu Fund menampilkan saldo hasil perhitungan database, bukan saldo cache.
 */
export default function FundCard({
  fund,
  busy = false,
  onEdit,
  onArchive,
  onUnarchive,
  onDelete,
}) {
  const balance = fund.balance ?? fund.openingBalance ?? 0;

  return (
    <Card style={[styles.card, fund.isArchived && styles.archived]} tone={fund.isArchived ? 'muted' : 'default'}>
      <View style={styles.header}>
        <View style={styles.identity}>
          <Text style={styles.name}>{fund.name}</Text>
          <View style={styles.badges}>
            <Text style={styles.typeBadge}>{TYPE_LABELS[fund.fundType] ?? fund.fundType}</Text>
            {fund.isArchived ? <Text style={styles.archiveBadge}>Arsip</Text> : null}
          </View>
        </View>
        <Text style={[styles.balance, balance < 0 && styles.negative]}>{formatRupiah(balance)}</Text>
      </View>

      <Text style={styles.opening}>Opening Balance: {formatRupiah(fund.openingBalance)}</Text>

      <View style={styles.actions}>
        <AppButton
          title="Ubah"
          variant="secondary"
          size="sm"
          onPress={() => onEdit?.(fund)}
          disabled={busy}
          style={styles.action}
        />
        {fund.isArchived ? (
          <AppButton
            title="Aktifkan"
            variant="secondary"
            size="sm"
            onPress={() => onUnarchive?.(fund)}
            disabled={busy}
            style={styles.action}
          />
        ) : (
          <AppButton
            title="Arsipkan"
            variant="secondary"
            size="sm"
            onPress={() => onArchive?.(fund)}
            disabled={busy}
            style={styles.action}
          />
        )}
        <AppButton
          title="Hapus"
          variant="ghost"
          size="sm"
          onPress={() => onDelete?.(fund)}
          disabled={busy}
          style={styles.action}
        />
      </View>
    </Card>
  );
}

const styles = StyleSheet.create({
  card: {
    marginBottom: spacing.md,
  },
  archived: {
    opacity: 0.85,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
  },
  identity: {
    flex: 1,
    paddingRight: spacing.md,
  },
  name: {
    ...typography.subheading,
    color: colors.text,
  },
  badges: {
    flexDirection: 'row',
    marginTop: spacing.xs,
  },
  typeBadge: {
    ...typography.caption,
    color: colors.primary,
    backgroundColor: colors.primarySoft,
    borderRadius: radius.xs,
    paddingHorizontal: spacing.sm,
    paddingVertical: 2,
    overflow: 'hidden',
  },
  archiveBadge: {
    ...typography.caption,
    color: colors.textMuted,
    backgroundColor: colors.surfaceMuted,
    borderRadius: radius.xs,
    paddingHorizontal: spacing.sm,
    paddingVertical: 2,
    marginLeft: spacing.xs,
    overflow: 'hidden',
  },
  balance: {
    ...typography.bodyStrong,
    color: colors.success,
    textAlign: 'right',
  },
  negative: {
    color: colors.danger,
  },
  opening: {
    ...typography.caption,
    color: colors.textMuted,
    marginTop: spacing.sm,
  },
  actions: {
    flexDirection: 'row',
    marginTop: spacing.md,
  },
  action: {
    flex: 1,
    marginHorizontal: 2,
  },
});
