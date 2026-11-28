import Ionicons from '@expo/vector-icons/Ionicons';
import { useState } from 'react';
import { Modal, Pressable, StyleSheet, Text, View } from 'react-native';
import { colors, radius, spacing, borderWidth, typography, shadows } from '@/shared/theme';
import { formatRupiah } from '@/shared/utils/currency';
import { fromDateKey, MONTHS_SHORT, occurredAtToDateKey } from '@/shared/utils/date';

const TYPE_META = {
  income: {
    label: 'Income',
    icon: 'arrow-down-outline',
    color: colors.success,
    background: colors.successSoft,
  },
  expense: {
    label: 'Expense',
    icon: 'arrow-up-outline',
    color: colors.danger,
    background: colors.dangerSoft,
  },
  transfer: {
    label: 'Transfer',
    icon: 'swap-horizontal-outline',
    color: colors.transfer,
    background: colors.transferSoft,
  },
};

function groupByDate(transactions) {
  return transactions.reduce((groups, transaction) => {
    const key = occurredAtToDateKey(transaction.occurredAt) ?? 'unknown';
    const group = groups.find((item) => item.key === key);
    if (group) {
      group.items.push(transaction);
    } else {
      groups.push({ key, items: [transaction] });
    }
    return groups;
  }, []);
}

function dateLabel(key) {
  const date = fromDateKey(key);
  if (!date) {
    return key;
  }
  if (key === occurredAtToDateKey(new Date())) {
    return 'Hari ini';
  }
  return `${date.getDate()} ${MONTHS_SHORT[date.getMonth()]} ${date.getFullYear()}`;
}

function transactionDetail(transaction) {
  if (transaction.type === 'transfer') {
    return `${transaction.sourceFundName ?? 'Fund sumber'} → ${
      transaction.destinationFundName ?? 'Fund tujuan'
    }`;
  }
  if (transaction.type === 'expense') {
    return transaction.sourceFundName ?? 'Fund sumber';
  }
  return transaction.destinationFundName ?? 'Fund tujuan';
}

function TransactionRow({ transaction, busy, onEdit, onDelete }) {
  const [menuOpen, setMenuOpen] = useState(false);
  const meta = TYPE_META[transaction.type] ?? TYPE_META.transfer;
  const managedByPocket = Boolean(transaction.pocketItemId);
  const sign = transaction.type === 'income' ? '+' : transaction.type === 'expense' ? '−' : '';

  return (
    <View style={styles.row}>
      <View style={[styles.iconWrap, { backgroundColor: meta.background }]}>
        <Ionicons name={meta.icon} size={18} color={meta.color} />
      </View>

      <View style={styles.identity}>
        <Text style={styles.title} numberOfLines={1}>
          {transaction.categoryName ?? meta.label}
        </Text>
        <Text style={styles.detail} numberOfLines={1}>
          {transactionDetail(transaction)}
        </Text>
        {managedByPocket ? (
          <Text style={styles.pocketBadge}>Dikelola di Pocket</Text>
        ) : null}
      </View>

      <View style={styles.trailing}>
        <Text style={[styles.amount, { color: meta.color }]}>
          {sign}
          {formatRupiah(transaction.amount)}
        </Text>
        <Pressable
          onPress={() => setMenuOpen(true)}
          disabled={busy}
          accessibilityRole="button"
          accessibilityLabel={`Aksi ${transaction.categoryName ?? meta.label}`}
          style={({ pressed }) => [styles.actionButton, pressed && styles.actionPressed]}
        >
          <Ionicons name="ellipsis-horizontal" size={20} color={colors.iconMuted} />
        </Pressable>
      </View>

      <Modal visible={menuOpen} transparent animationType="fade" onRequestClose={() => setMenuOpen(false)}>
        <Pressable style={styles.backdrop} onPress={() => setMenuOpen(false)} accessibilityRole="button" accessibilityLabel="Tutup aksi" />
        <View style={styles.menu}>
          <Pressable
            style={styles.menuItem}
            disabled={busy || managedByPocket}
            onPress={() => {
              setMenuOpen(false);
              onEdit?.(transaction);
            }}
            accessibilityRole="button"
          >
            <Text style={styles.menuLabel}>Ubah transaksi</Text>
          </Pressable>
          <Pressable
            style={[styles.menuItem, styles.menuItemDanger]}
            disabled={busy || managedByPocket}
            onPress={() => {
              setMenuOpen(false);
              onDelete?.(transaction);
            }}
            accessibilityRole="button"
          >
            <Text style={[styles.menuLabel, styles.menuLabelDanger]}>Hapus transaksi</Text>
          </Pressable>
        </View>
      </Modal>
    </View>
  );
}

export default function TransactionList({ transactions, busy = false, onEdit, onDelete }) {
  return (
    <View>
      {groupByDate(transactions).map((group) => (
        <View key={group.key} style={styles.group}>
          <Text style={styles.groupTitle}>
            {group.key === 'unknown' ? 'Tanggal tidak diketahui' : dateLabel(group.key)}
          </Text>
          <View style={styles.groupCard}>
            {group.items.map((transaction) => (
              <TransactionRow
                key={transaction.id}
                transaction={transaction}
                busy={busy}
                onEdit={onEdit}
                onDelete={onDelete}
              />
            ))}
          </View>
        </View>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  group: {
    marginBottom: spacing.lg,
  },
  groupTitle: {
    ...typography.captionStrong,
    color: colors.textSubtle,
    marginBottom: spacing.md,
  },
  groupCard: {
    backgroundColor: colors.surface,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    paddingVertical: spacing.sm,
    marginBottom: spacing.sm,
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
    paddingRight: spacing.sm,
  },
  title: {
    ...typography.bodyStrong,
    color: colors.text,
  },
  detail: {
    ...typography.meta,
    color: colors.textMuted,
    marginTop: spacing.xxs,
  },
  pocketBadge: {
    ...typography.meta,
    color: colors.warning,
    marginTop: spacing.xxs,
  },
  trailing: {
    alignItems: 'flex-end',
  },
  amount: {
    ...typography.amountSmall,
  },
  actionButton: {
    width: 44,
    height: 44,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: -12,
    borderRadius: radius.button,
  },
  actionPressed: {
    backgroundColor: colors.surfaceMuted,
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
    borderWidth: borderWidth.hairline,
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
