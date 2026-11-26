import { StyleSheet, Text, View } from 'react-native';
import { AppButton } from '@/shared/components';
import { colors, radius, spacing, borderWidth, typography } from '@/shared/theme';
import { formatRupiah } from '@/shared/utils/currency';
import { formatDate, occurredAtToDateKey } from '@/shared/utils/date';

const STATUS_META = {
  pending: { label: 'Menunggu konfirmasi', color: colors.warning },
  confirmed: { label: 'Terkonfirmasi', color: colors.success },
  planned: { label: 'Direncanakan', color: colors.warning },
  converted: { label: 'Terkonversi', color: colors.success },
  completed: { label: 'Selesai', color: colors.success },
  template: { label: 'Template Automation', color: colors.primary },
};

function fundName(funds, fundId) {
  return funds.find((fund) => fund.id === fundId)?.name ?? 'Fund';
}

function transactionSummary(transaction, funds) {
  if (!transaction) {
    return null;
  }
  if (transaction.type === 'transfer') {
    return `${fundName(funds, transaction.sourceFundId)} → ${fundName(
      funds,
      transaction.destinationFundId
    )}`;
  }
  if (transaction.type === 'expense') {
    return `Dari ${fundName(funds, transaction.sourceFundId)}`;
  }
  return `Ke ${fundName(funds, transaction.destinationFundId)}`;
}

function ItemRow({ item, funds, busy, actions }) {
  const status = STATUS_META[item.status] ?? { label: item.status, color: colors.textMuted };
  const transaction = item.transaction;
  const amount = transaction?.amount ?? item.amount;

  return (
    <View style={styles.row}>
      <View style={styles.identity}>
        <Text style={styles.name} numberOfLines={1}>
          {item.name}
        </Text>
        <View style={styles.metaRow}>
          <Text style={[styles.status, { color: status.color }]}>{status.label}</Text>
          <Text style={styles.dot}>·</Text>
          <Text style={styles.meta}>{formatRupiah(item.amount)}</Text>
        </View>
        {transaction ? (
          <>
            <Text style={styles.meta} numberOfLines={1}>
              {transactionSummary(transaction, funds)}
            </Text>
            <Text style={styles.meta}>
              {formatDate(occurredAtToDateKey(transaction.occurredAt) ?? transaction.occurredAt)} ·{' '}
              {formatRupiah(amount)}
            </Text>
          </>
        ) : null}
      </View>

      <View style={styles.actions}>
        {item.status === 'pending' ? (
          <>
            <AppButton
              title="Konfirmasi"
              size="sm"
              onPress={() => actions.onConfirm?.(item)}
              disabled={busy}
            />
            <AppButton
              title="Hapus"
              size="sm"
              variant="ghost"
              onPress={() => actions.onDeleteItem?.(item)}
              disabled={busy}
            />
          </>
        ) : null}

        {item.status === 'planned' ? (
          <>
            <AppButton
              title="Ubah"
              size="sm"
              variant="ghost"
              onPress={() => actions.onEditItem?.(item)}
              disabled={busy}
            />
            <AppButton
              title="Konversi"
              size="sm"
              onPress={() => actions.onConvert?.(item)}
              disabled={busy}
            />
            <AppButton
              title="Hapus"
              size="sm"
              variant="ghost"
              onPress={() => actions.onDeleteItem?.(item)}
              disabled={busy}
            />
          </>
        ) : null}

        {['confirmed', 'converted', 'completed'].includes(item.status) && transaction ? (
          <>
            <AppButton
              title="Ubah trx"
              size="sm"
              variant="ghost"
              onPress={() => actions.onEditTransaction?.(item)}
              disabled={busy}
            />
            <AppButton
              title="Hapus trx"
              size="sm"
              variant="ghost"
              onPress={() => actions.onDeleteTransaction?.(item)}
              disabled={busy}
            />
          </>
        ) : null}
      </View>
    </View>
  );
}

export default function PocketItemList({ items = [], funds = [], busy = false, actions = {} }) {
  return (
    <View style={styles.card}>
      {items.map((item) => (
        <ItemRow key={item.id} item={item} funds={funds} busy={busy} actions={actions} />
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: colors.surface,
    borderRadius: radius.lg,
    borderWidth: borderWidth.hairline,
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
  identity: {
    flex: 1,
    paddingRight: spacing.sm,
  },
  name: {
    ...typography.bodyStrong,
    color: colors.text,
  },
  metaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: spacing.xxs,
  },
  status: {
    ...typography.caption,
  },
  dot: {
    ...typography.caption,
    color: colors.textSubtle,
    marginHorizontal: spacing.xxs,
  },
  meta: {
    ...typography.caption,
    color: colors.textMuted,
    marginTop: spacing.xxs,
  },
  actions: {
    alignItems: 'flex-end',
    flexWrap: 'wrap',
    maxWidth: 150,
  },
});
