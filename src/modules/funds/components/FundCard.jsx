import Ionicons from '@expo/vector-icons/Ionicons';
import { StyleSheet, Text, View } from 'react-native';
import { AppButton, Badge, Card } from '@/shared/components';
import { colors, radius, spacing, typography } from '@/shared/theme';
import { formatRupiah } from '@/shared/utils/currency';

const TYPE_META = {
  active: { label: 'Active', tone: 'active' },
  savings_goal: { label: 'Savings/Goal', tone: 'transfer' },
};

function DetailRow({ label, value, negative = false }) {
  return (
    <View style={styles.detailRow}>
      <Text style={styles.detailLabel}>{label}</Text>
      <Text style={[styles.detailValue, negative && styles.negative]}>{value}</Text>
    </View>
  );
}

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
  const meta = TYPE_META[fund.fundType] ?? {
    label: fund.fundType,
    tone: 'neutral',
  };

  return (
    <Card style={styles.card}>
      <View style={styles.header}>
        <View style={styles.iconWrap}>
          <Ionicons name="wallet-outline" size={18} color={colors.primary} />
        </View>
        <View style={styles.identity}>
          <Text style={styles.name} numberOfLines={1}>
            {fund.name}
          </Text>
          <View style={styles.badges}>
            <Badge label={meta.label} tone={meta.tone} />
            {fund.isArchived ? <Badge label="Diarsipkan" tone="neutral" /> : null}
          </View>
        </View>
      </View>

      <DetailRow label="Saldo" value={formatRupiah(balance)} negative={balance < 0} />
      <DetailRow label="Saldo awal" value={formatRupiah(fund.openingBalance)} />

      <View style={styles.actions}>
        <AppButton
          title="Edit"
          variant="outline"
          size="sm"
          onPress={() => onEdit?.(fund)}
          disabled={busy}
          style={styles.action}
        />
        {fund.isArchived ? (
          <AppButton
            title="Aktifkan"
            variant="outline"
            size="sm"
            onPress={() => onUnarchive?.(fund)}
            disabled={busy}
            style={styles.action}
          />
        ) : (
          <AppButton
            title="Arsipkan"
            variant="outline"
            size="sm"
            onPress={() => onArchive?.(fund)}
            disabled={busy}
            style={styles.action}
          />
        )}
        <AppButton
          title="Hapus"
          variant="dangerOutline"
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
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: spacing.md,
  },
  iconWrap: {
    width: 37,
    height: 37,
    borderRadius: radius.tab,
    backgroundColor: colors.primarySoft,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: spacing.md,
  },
  identity: {
    flex: 1,
  },
  name: {
    ...typography.subheading,
    color: colors.text,
    marginBottom: spacing.xs,
  },
  badges: {
    flexDirection: 'row',
  },
  detailRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: spacing.xs,
  },
  detailLabel: {
    ...typography.caption,
    color: colors.textMuted,
  },
  detailValue: {
    ...typography.bodyStrong,
    fontWeight: '700',
    color: colors.text,
  },
  negative: {
    color: colors.danger,
  },
  actions: {
    flexDirection: 'row',
    marginTop: spacing.md,
  },
  action: {
    minWidth: 60,
    marginRight: spacing.sm,
  },
});
