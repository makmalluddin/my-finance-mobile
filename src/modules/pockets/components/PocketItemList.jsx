import Ionicons from '@expo/vector-icons/Ionicons';
import { useState } from 'react';
import { Modal, Pressable, StyleSheet, Text, View } from 'react-native';
import { AppButton, Badge, Card } from '@/shared/components';
import { colors, radius, spacing, shadows, typography } from '@/shared/theme';
import { formatRupiah } from '@/shared/utils/currency';
import { formatDate, occurredAtToDateKey } from '@/shared/utils/date';

const STATUS_META = {
  pending: { label: 'Menunggu konfirmasi', tone: 'danger' },
  confirmed: { label: 'Terkonfirmasi', tone: 'success' },
  planned: { label: 'Direncanakan', tone: 'neutral' },
  converted: { label: 'Terkonversi', tone: 'success' },
  completed: { label: 'Selesai', tone: 'success' },
  template: { label: 'Template Automation', tone: 'primary' },
};

function fundName(funds, fundId) {
  return funds.find((fund) => fund.id === fundId)?.name ?? 'Fund';
}

function ItemRow({ item, funds, busy, actions }) {
  const [menuOpen, setMenuOpen] = useState(false);
  const status = STATUS_META[item.status] ?? { label: item.status, tone: 'neutral' };
  const transaction = item.transaction;
  const amount = transaction?.amount ?? item.amount;
  const displayFund = fundName(funds, item.fundId ?? item.sourceFundId ?? item.destinationFundId);

  const closeMenu = () => setMenuOpen(false);
  const run = (callback) => {
    closeMenu();
    callback?.();
  };

  return (
    <Card style={styles.card}>
      <View style={styles.head}>
        <View style={styles.headText}>
          <Text style={styles.name} numberOfLines={1}>
            {item.name}
          </Text>
          <Badge label={status.label} tone={status.tone} style={styles.status} />
        </View>
        <Pressable
          onPress={() => setMenuOpen(true)}
          disabled={busy}
          accessibilityRole="button"
          accessibilityLabel={`Aksi ${item.name}`}
          style={({ pressed }) => [styles.menuButton, pressed && styles.menuButtonPressed]}
        >
          <Ionicons name="ellipsis-horizontal" size={20} color={colors.iconMuted} />
        </Pressable>
      </View>

      <View style={styles.detailRow}>
        <Text style={styles.fund}>{displayFund}</Text>
        <Text style={styles.amount}>{formatRupiah(amount)}</Text>
      </View>

      {transaction ? (
        <Text style={styles.transactionNote} numberOfLines={1}>
          {formatDate(occurredAtToDateKey(transaction.occurredAt) ?? transaction.occurredAt)}
        </Text>
      ) : null}

      {item.status === 'pending' ? (
        <View style={styles.actions}>
          <AppButton
            title="Konfirmasi"
            size="sm"
            variant="ghost"
            onPress={() => actions.onConfirm?.(item)}
            disabled={busy}
            style={styles.actionButton}
          />
          <AppButton
            title="Ubah menjadi transaksi"
            size="sm"
            variant="outline"
            onPress={() => actions.onConvert?.(item)}
            disabled={busy}
            style={styles.actionButtonWide}
          />
        </View>
      ) : null}

      {item.status === 'planned' ? (
        <View style={styles.actions}>
          <AppButton
            title="Ubah menjadi transaksi"
            size="sm"
            variant="outline"
            onPress={() => actions.onConvert?.(item)}
            disabled={busy}
            style={styles.actionButtonWide}
          />
        </View>
      ) : null}

      <Modal visible={menuOpen} transparent animationType="fade" onRequestClose={closeMenu}>
        <Pressable style={styles.backdrop} onPress={closeMenu} accessibilityRole="button" accessibilityLabel="Tutup aksi" />
        <View style={styles.menu}>
          {['pending', 'planned', 'template'].includes(item.status) ? (
            <Pressable style={styles.menuItem} disabled={busy} onPress={() => run(() => actions.onEditItem?.(item))} accessibilityRole="button">
              <Text style={styles.menuLabel}>Ubah item</Text>
            </Pressable>
          ) : null}
          {!transaction ? (
            <Pressable style={styles.menuItem} disabled={busy} onPress={() => run(() => actions.onDeleteItem?.(item))} accessibilityRole="button">
              <Text style={styles.menuLabel}>Hapus item</Text>
            </Pressable>
          ) : (
            <>
              <Pressable style={styles.menuItem} disabled={busy} onPress={() => run(() => actions.onEditTransaction?.(item))} accessibilityRole="button">
                <Text style={styles.menuLabel}>Ubah transaksi</Text>
              </Pressable>
              <Pressable style={[styles.menuItem, styles.menuItemDanger]} disabled={busy} onPress={() => run(() => actions.onDeleteTransaction?.(item))} accessibilityRole="button">
                <Text style={[styles.menuLabel, styles.menuLabelDanger]}>Hapus transaksi</Text>
              </Pressable>
            </>
          )}
        </View>
      </Modal>
    </Card>
  );
}

export default function PocketItemList({ items = [], funds = [], busy = false, actions = {} }) {
  return (
    <View>
      {items.map((item) => (
        <ItemRow key={item.id} item={item} funds={funds} busy={busy} actions={actions} />
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    marginBottom: spacing.md,
  },
  head: {
    flexDirection: 'row',
    alignItems: 'flex-start',
  },
  headText: {
    flex: 1,
  },
  name: {
    ...typography.subheading,
    color: colors.text,
  },
  status: {
    marginTop: spacing.xs,
  },
  menuButton: {
    width: 44,
    height: 44,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: radius.button,
    marginTop: -8,
    marginRight: -8,
  },
  menuButtonPressed: {
    backgroundColor: colors.surfaceMuted,
  },
  detailRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: spacing.md,
  },
  fund: {
    ...typography.caption,
    color: colors.textMuted,
  },
  amount: {
    ...typography.bodyStrong,
    fontWeight: '700',
    color: colors.text,
  },
  transactionNote: {
    ...typography.meta,
    color: colors.textMuted,
    marginTop: spacing.xs,
  },
  actions: {
    flexDirection: 'row',
    marginTop: spacing.md,
  },
  actionButton: {
    minWidth: 96,
    marginRight: spacing.sm,
  },
  actionButtonWide: {
    minWidth: 163,
  },
  backdrop: {
    position: 'absolute',
    inset: 0,
    backgroundColor: colors.overlay,
  },
  menu: {
    position: 'absolute',
    left: spacing.xl,
    right: spacing.xl,
    top: '50%',
    backgroundColor: colors.surface,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.border,
    padding: spacing.sm,
    ...shadows.floating,
  },
  menuItem: {
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.md,
    borderRadius: radius.sm,
  },
  menuItemDanger: {
    backgroundColor: colors.dangerSoft,
  },
  menuLabel: {
    ...typography.bodyStrong,
    color: colors.text,
  },
  menuLabelDanger: {
    color: colors.danger,
  },
});
