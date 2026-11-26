import Ionicons from '@expo/vector-icons/Ionicons';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { AppButton } from '@/shared/components';
import { colors, radius, spacing, borderWidth, typography } from '@/shared/theme';
import { formatRupiah } from '@/shared/utils/currency';

const TYPE_META = {
  income: { label: 'Income Pocket', icon: 'arrow-down-circle-outline', color: colors.success },
  expense: { label: 'Expense Pocket', icon: 'wallet-outline', color: colors.warning },
  transfer: { label: 'Transfer Pocket', icon: 'swap-horizontal-outline', color: colors.primary },
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
        <View style={[styles.iconWrap, { backgroundColor: `${meta.color}18` }]}>
          <Ionicons name={meta.icon} size={22} color={meta.color} />
        </View>

        <View style={styles.identity}>
          <Text style={styles.name} numberOfLines={1}>
            {pocket.name}
          </Text>
          <Text style={styles.type}>{meta.label}</Text>
          {pocket.description ? (
            <Text style={styles.description} numberOfLines={2}>
              {pocket.description}
            </Text>
          ) : null}
          {pocket.isArchived ? <Text style={styles.badge}>Arsip</Text> : null}
        </View>

        <Ionicons name="chevron-forward" size={20} color={colors.textSubtle} />
      </Pressable>

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

      <View style={styles.footer}>
        <Text style={styles.itemCount}>
          {itemCount} item · {pocket.hasEverHadItem ? 'tipe terkunci' : 'tipe bisa diubah'}
        </Text>
        <View style={styles.actions}>
          <AppButton
            title="Ubah"
            size="sm"
            variant="ghost"
            onPress={() => onEdit?.(pocket)}
            disabled={busy}
          />
          <AppButton
            title={pocket.isArchived ? 'Aktifkan' : 'Arsipkan'}
            size="sm"
            variant="ghost"
            onPress={() =>
              pocket.isArchived ? onUnarchive?.(pocket) : onArchive?.(pocket)
            }
            disabled={busy}
          />
          <AppButton
            title="Hapus"
            size="sm"
            variant="ghost"
            onPress={() => onDelete?.(pocket)}
            disabled={busy}
          />
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: colors.surface,
    borderRadius: radius.lg,
    borderWidth: borderWidth.hairline,
    borderColor: colors.border,
    padding: spacing.md,
    marginBottom: spacing.md,
  },
  main: {
    flexDirection: 'row',
    alignItems: 'flex-start',
  },
  pressed: {
    opacity: 0.7,
  },
  iconWrap: {
    width: 40,
    height: 40,
    borderRadius: radius.pill,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: spacing.sm,
  },
  identity: {
    flex: 1,
    paddingRight: spacing.sm,
  },
  name: {
    ...typography.bodyStrong,
    color: colors.text,
  },
  type: {
    ...typography.caption,
    color: colors.textMuted,
    marginTop: spacing.xxs,
  },
  description: {
    ...typography.caption,
    color: colors.textMuted,
    marginTop: spacing.xxs,
  },
  badge: {
    ...typography.caption,
    color: colors.warning,
    marginTop: spacing.xxs,
  },
  summary: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: spacing.md,
    paddingTop: spacing.sm,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: colors.border,
  },
  summaryItem: {
    flex: 1,
  },
  summaryLabel: {
    ...typography.caption,
    color: colors.textMuted,
  },
  summaryValue: {
    ...typography.bodyStrong,
    color: colors.text,
    marginTop: spacing.xxs,
  },
  footer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: spacing.md,
    paddingTop: spacing.sm,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: colors.border,
  },
  itemCount: {
    ...typography.caption,
    color: colors.textMuted,
    flex: 1,
  },
  actions: {
    flexDirection: 'row',
  },
});
