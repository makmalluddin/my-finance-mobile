import Ionicons from '@expo/vector-icons/Ionicons';
import { StyleSheet, Text, View } from 'react-native';
import { AppButton } from '@/shared/components';
import { colors, spacing, typography } from '@/shared/theme';
import { formatRupiah } from '@/shared/utils/currency';
import { fromDateKey, MONTHS_SHORT, occurredAtToDateKey } from '@/shared/utils/date';

const TYPE_META = {
  income: { label: 'Income', icon: 'arrow-down-circle-outline', color: colors.success },
  expense: { label: 'Expense', icon: 'arrow-up-circle-outline', color: colors.danger },
  transfer: { label: 'Transfer', icon: 'swap-horizontal-outline', color: colors.primary },
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
  const meta = TYPE_META[transaction.type] ?? TYPE_META.transfer;
  const managedByPocket = Boolean(transaction.pocketItemId);
  const sign = transaction.type === 'income' ? '+' : transaction.type === 'expense' ? '-' : '';

  return (
    <View style={styles.row}>
      <View style={[styles.iconWrap, { backgroundColor: `${meta.color}18` }]}>
        <Ionicons name={meta.icon} size={20} color={meta.color} />
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
        <View style={styles.rowActions}>
          <AppButton
            title="Ubah"
            size="sm"
            variant="ghost"
            onPress={() => onEdit?.(transaction)}
            disabled={busy || managedByPocket}
          />
          <AppButton
            title="Hapus"
            size="sm"
            variant="ghost"
            onPress={() => onDelete?.(transaction)}
            disabled={busy || managedByPocket}
          />
        </View>
      </View>
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
    ...typography.label,
    color: colors.textMuted,
    marginBottom: spacing.sm,
  },
  groupCard: {
    backgroundColor: colors.surface,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: colors.border,
    paddingHorizontal: spacing.md,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    paddingVertical: spacing.md,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: colors.border,
  },
  iconWrap: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: spacing.sm,
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
    ...typography.caption,
    color: colors.textMuted,
    marginTop: spacing.xxs,
  },
  pocketBadge: {
    ...typography.caption,
    color: colors.warning,
    marginTop: spacing.xxs,
  },
  trailing: {
    alignItems: 'flex-end',
  },
  amount: {
    ...typography.bodyStrong,
  },
  rowActions: {
    flexDirection: 'row',
    marginTop: spacing.xs,
  },
});
