import Ionicons from '@expo/vector-icons/Ionicons';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { AppButton, Badge } from '@/shared/components';
import { colors, radius, spacing, borderWidth, typography } from '@/shared/theme';
import { formatRupiah } from '@/shared/utils/currency';

const TYPE_META = {
  income: {
    label: 'Income',
    icon: 'arrow-down-outline',
    color: colors.success,
    background: colors.successSoft,
    tone: 'income',
  },
  expense: {
    label: 'Expense',
    icon: 'wallet-outline',
    color: colors.danger,
    background: colors.dangerSoft,
    tone: 'expense',
  },
  transfer: {
    label: 'Transfer',
    icon: 'swap-horizontal-outline',
    color: colors.transfer,
    background: colors.transferSoft,
    tone: 'transfer',
  },
};

export default function PocketCard({
  pocket,
  itemCount = 0,
  summary,
  busy = false,
  onPress,
  onEdit,
  onArchive,
  onUnarchive,
  onDelete,
}) {
  const meta = TYPE_META[pocket.type] ?? TYPE_META.transfer;

  return (
    <View style={styles.card}>
      <Pressable
        onPress={() => onPress?.(pocket)}
        accessibilityRole="button"
        accessibilityLabel={`Buka Pocket ${pocket.name}`}
        style={({ pressed }) => [styles.main, pressed && styles.pressed]}
      >
        <View style={[styles.iconWrap, { backgroundColor: meta.background }]}>
          <Ionicons name={meta.icon} size={18} color={meta.color} />
        </View>
        <View style={styles.identity}>
          <Text style={styles.name} numberOfLines={1}>
            {pocket.name}
          </Text>
          <Badge label={pocket.isArchived ? 'Diarsipkan' : meta.label} tone={pocket.isArchived ? 'neutral' : meta.tone} />
        </View>
      </Pressable>

      {pocket.description ? (
        <Text style={styles.description} numberOfLines={2}>
          {pocket.description}
        </Text>
      ) : null}

      {pocket.type === 'transfer' && summary ? (
        <View style={styles.summary}>
          <View style={styles.summaryItem}>
            <Text style={styles.summaryLabel}>Masuk</Text>
            <Text style={styles.summaryValue}>{formatRupiah(summary.incoming)}</Text>
          </View>
          <View style={styles.summaryItem}>
            <Text style={styles.summaryLabel}>Keluar</Text>
            <Text style={styles.summaryValue}>{formatRupiah(summary.outgoing)}</Text>
          </View>
          <View style={styles.summaryItem}>
            <Text style={styles.summaryLabel}>Bersih</Text>
            <Text style={styles.summaryValue}>{formatRupiah(summary.net)}</Text>
          </View>
        </View>
      ) : null}

      <Text style={styles.itemCount}>{itemCount} item</Text>

      <View style={styles.actions}>
        <AppButton
          title="Edit"
          size="sm"
          variant="outline"
          onPress={() => onEdit?.(pocket)}
          disabled={busy}
          style={styles.actionButton}
        />
        <AppButton
          title={pocket.isArchived ? 'Aktifkan' : 'Arsipkan'}
          size="sm"
          variant="outline"
          onPress={() => (pocket.isArchived ? onUnarchive?.(pocket) : onArchive?.(pocket))}
          disabled={busy}
          style={styles.actionButton}
        />
        <AppButton
          title="Hapus"
          size="sm"
          variant="dangerOutline"
          onPress={() => onDelete?.(pocket)}
          disabled={busy}
          style={styles.actionButton}
        />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: colors.surface,
    borderRadius: radius.md,
    borderWidth: borderWidth.hairline,
    borderColor: colors.border,
    padding: spacing.md + 1,
    marginBottom: spacing.md,
  },
  main: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  pressed: {
    opacity: 0.7,
  },
  iconWrap: {
    width: 37,
    height: 37,
    borderRadius: radius.button,
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
  description: {
    ...typography.caption,
    color: colors.textMuted,
    marginTop: spacing.md,
  },
  summary: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: spacing.md,
    padding: spacing.sm,
    borderRadius: radius.sm,
    backgroundColor: colors.surfaceMuted,
  },
  summaryItem: {
    flex: 1,
  },
  summaryLabel: {
    ...typography.meta,
    color: colors.textMuted,
  },
  summaryValue: {
    ...typography.amountSmall,
    color: colors.text,
    marginTop: spacing.xxs,
  },
  itemCount: {
    ...typography.meta,
    fontWeight: '700',
    color: colors.textSubtle,
    marginTop: spacing.sm,
  },
  actions: {
    flexDirection: 'row',
    marginTop: spacing.md,
  },
  actionButton: {
    minWidth: 60,
    marginRight: spacing.sm,
  },
});
