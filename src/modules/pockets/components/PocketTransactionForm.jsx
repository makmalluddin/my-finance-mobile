import Ionicons from '@expo/vector-icons/Ionicons';
import { useState } from 'react';
import { Modal, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import {
  AmountInput,
  AppButton,
  DateField,
  SelectField,
} from '@/shared/components';
import { colors, radius, spacing, typography } from '@/shared/theme';
import { formatRupiah } from '@/shared/utils/currency';
import { fromDateKey, occurredAtToDateKey } from '@/shared/utils/date';

function fundOptions(funds) {
  return funds
    .filter((fund) => !fund.isArchived)
    .map((fund) => ({
      label: fund.name,
      value: fund.id,
      description: `Saldo ${formatRupiah(fund.balance ?? fund.openingBalance ?? 0)}`,
    }));
}

/**
 * Mengubah transaksi yang dikelola Pocket. Jenis transaksi tidak bisa diubah
 * dan nominal Expense hasil konversi terkunci di backend.
 */
export default function PocketTransactionForm({
  visible,
  transaction,
  amountLocked = false,
  funds = [],
  saving = false,
  onSubmit,
  onCancel,
}) {
  const [amount, setAmount] = useState(transaction?.amount ?? 0);
  const [date, setDate] = useState(() => {
    const key = occurredAtToDateKey(transaction?.occurredAt);
    return (key ? fromDateKey(key) : null) ?? new Date();
  });
  const [sourceFundId, setSourceFundId] = useState(transaction?.sourceFundId ?? '');
  const [destinationFundId, setDestinationFundId] = useState(
    transaction?.destinationFundId ?? ''
  );
  const [errors, setErrors] = useState({});

  const type = transaction?.type;
  const options = fundOptions(
    type === 'expense' ? funds.filter((fund) => fund.fundType === 'active') : funds
  );

  const handleSourceChange = (nextSourceFundId) => {
    setSourceFundId(nextSourceFundId);
    if (nextSourceFundId === destinationFundId) {
      setDestinationFundId('');
    }
  };

  const handleSubmit = () => {
    const nextErrors = {};
    if (Number(amount) <= 0) {
      nextErrors.amount = 'Nominal harus lebih besar dari nol.';
    }
    if (!(date instanceof Date) || Number.isNaN(date.getTime())) {
      nextErrors.date = 'Tanggal tidak valid.';
    }
    if (type !== 'income' && !sourceFundId) {
      nextErrors.sourceFundId = 'Fund sumber wajib dipilih.';
    }
    if (type !== 'expense' && !destinationFundId) {
      nextErrors.destinationFundId = 'Fund tujuan wajib dipilih.';
    }
    if (
      type === 'transfer' &&
      sourceFundId &&
      sourceFundId === destinationFundId
    ) {
      nextErrors.destinationFundId = 'Fund tujuan harus berbeda dari sumber.';
    }

    setErrors(nextErrors);
    if (Object.keys(nextErrors).length > 0) {
      return;
    }

    onSubmit?.({
      transactionId: transaction.id,
      type,
      amount: Number(amount),
      date,
      sourceFundId: type === 'income' ? null : sourceFundId,
      destinationFundId: type === 'expense' ? null : destinationFundId,
    });
  };

  return (
    <Modal visible={visible} animationType="slide" onRequestClose={() => !saving && onCancel?.()}>
      <View style={styles.container} accessibilityViewIsModal>
        <View style={styles.header}>
          <Text style={styles.title}>Ubah Transaksi Pocket</Text>
          <Pressable
            onPress={() => !saving && onCancel?.()}
            disabled={saving}
            accessibilityRole="button"
            accessibilityLabel="Tutup form transaksi Pocket"
            hitSlop={8}
          >
            <Ionicons name="close" size={24} color={colors.textMuted} />
          </Pressable>
        </View>

        <ScrollView
          contentContainerStyle={styles.content}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
          <AmountInput
            value={amount}
            onChangeValue={setAmount}
            error={errors.amount}
            editable={!amountLocked}
            helperText={
              amountLocked ? 'Nominal hasil konversi tidak dapat diubah.' : undefined
            }
            required
          />
          <DateField value={date} onChange={setDate} error={errors.date} label="Tanggal" required />

          {type !== 'income' ? (
            <SelectField
              label="Fund Sumber"
              value={sourceFundId}
              options={options}
              onChange={handleSourceChange}
              error={errors.sourceFundId}
              placeholder="Pilih Fund sumber"
              disabled={saving}
              required
            />
          ) : null}

          {type !== 'expense' ? (
            <SelectField
              label="Fund Tujuan"
              value={destinationFundId}
              options={options.filter((option) => option.value !== sourceFundId)}
              onChange={setDestinationFundId}
              error={errors.destinationFundId}
              placeholder="Pilih Fund tujuan"
              disabled={saving}
              required
            />
          ) : null}

          <View style={styles.actions}>
            <AppButton
              title="Batal"
              variant="secondary"
              onPress={onCancel}
              disabled={saving}
              style={styles.cancelButton}
            />
            <AppButton
              title="Simpan Perubahan"
              onPress={handleSubmit}
              loading={saving}
              style={styles.submitButton}
            />
          </View>
        </ScrollView>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    backgroundColor: colors.surface,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  title: {
    ...typography.heading,
    color: colors.text,
  },
  content: {
    padding: spacing.lg,
    paddingBottom: spacing.xxxl,
  },
  actions: {
    flexDirection: 'row',
    marginTop: spacing.sm,
  },
  cancelButton: {
    flex: 1,
    marginRight: spacing.sm,
    borderRadius: radius.md,
  },
  submitButton: {
    flex: 2,
    borderRadius: radius.md,
  },
});
