import Ionicons from '@expo/vector-icons/Ionicons';
import { useState } from 'react';
import {
  Modal,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import {
  AmountInput,
  AppButton,
  DateField,
  SelectField,
} from '@/shared/components';
import { colors, radius, spacing, typography } from '@/shared/theme';
import { formatRupiah } from '@/shared/utils/currency';
import { fromDateKey, occurredAtToDateKey } from '@/shared/utils/date';

const TYPE_OPTIONS = [
  { label: 'Income', value: 'income', description: 'Uang masuk ke sebuah Fund.' },
  { label: 'Expense', value: 'expense', description: 'Uang keluar dari Active Fund.' },
  { label: 'Transfer', value: 'transfer', description: 'Pindah dana antar-Fund.' },
];

/**
 * Form transaksi standalone. Jenis transaksi tidak bisa diubah saat edit
 * karena RPC menjaga TRANSACTION_TYPE_IMMUTABLE.
 */
export default function TransactionForm({
  visible,
  transaction = null,
  funds = [],
  categories = { income: [], expense: [] },
  saving = false,
  onSubmit,
  onCancel,
}) {
  const isEditing = Boolean(transaction);
  const [type, setType] = useState(transaction?.type ?? 'income');
  const [amount, setAmount] = useState(transaction?.amount ?? 0);
  const [date, setDate] = useState(() => {
    const key = occurredAtToDateKey(transaction?.occurredAt);
    return (key ? fromDateKey(key) : null) ?? new Date();
  });
  const [sourceFundId, setSourceFundId] = useState(transaction?.sourceFundId ?? '');
  const [destinationFundId, setDestinationFundId] = useState(
    transaction?.destinationFundId ?? ''
  );
  const [categoryId, setCategoryId] = useState(transaction?.categoryId ?? '');
  const [errors, setErrors] = useState({});

  const availableFunds = funds.filter((fund) => !fund.isArchived);

  const fundOptions = (list) =>
    list.map((fund) => ({
      label: fund.name,
      value: fund.id,
      description: `Saldo ${formatRupiah(fund.balance ?? fund.openingBalance ?? 0)}`,
    }));

  const sourceOptions = fundOptions(
    type === 'expense'
      ? availableFunds.filter((fund) => fund.fundType === 'active')
      : availableFunds
  );
  const destinationOptions = fundOptions(
    availableFunds.filter((fund) => fund.id !== sourceFundId)
  );
  const categoryOptions = (categories[type] ?? []).map((category) => ({
    label: category.name,
    value: category.id,
  }));

  const handleTypeChange = (nextType) => {
    setType(nextType);
    setSourceFundId('');
    setDestinationFundId('');
    setCategoryId('');
    setErrors({});
  };

  const handleSourceChange = (nextSourceFundId) => {
    setSourceFundId(nextSourceFundId);
    if (nextSourceFundId === destinationFundId) {
      setDestinationFundId('');
    }
  };

  const handleSubmit = () => {
    const nextErrors = {};
    const numericAmount = Number(amount);

    if (!Number.isFinite(numericAmount) || numericAmount <= 0) {
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
    if (type === 'transfer' && sourceFundId && sourceFundId === destinationFundId) {
      nextErrors.destinationFundId = 'Fund tujuan harus berbeda dari Fund sumber.';
    }
    if (type !== 'transfer' && !categoryId) {
      nextErrors.categoryId = 'Category wajib dipilih.';
    }

    setErrors(nextErrors);
    if (Object.keys(nextErrors).length > 0) {
      return;
    }

    onSubmit?.({
      type,
      amount: numericAmount,
      date,
      sourceFundId: type === 'income' ? null : sourceFundId,
      destinationFundId: type === 'expense' ? null : destinationFundId,
      categoryId: type === 'transfer' ? null : categoryId,
    });
  };

  return (
    <Modal
      visible={visible}
      animationType="slide"
      onRequestClose={() => !saving && onCancel?.()}
    >
      <View style={styles.container} accessibilityViewIsModal>
        <View style={styles.header}>
          <Text style={styles.title}>
            {isEditing ? 'Ubah Transaksi' : 'Transaksi Baru'}
          </Text>
          <Pressable
            onPress={() => !saving && onCancel?.()}
            disabled={saving}
            accessibilityRole="button"
            accessibilityLabel="Tutup form transaksi"
            hitSlop={8}
          >
            <Ionicons name="close" size={24} color={colors.textMuted} />
          </Pressable>
        </View>

        <ScrollView
          contentContainerStyle={styles.content}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          <SelectField
            label="Jenis Transaksi"
            value={type}
            options={TYPE_OPTIONS}
            onChange={handleTypeChange}
            disabled={isEditing || saving}
            required
            helperText={
              isEditing
                ? 'Jenis transaksi tidak dapat diubah setelah dibuat.'
                : undefined
            }
          />

          <AmountInput
            value={amount}
            onChangeValue={setAmount}
            error={errors.amount}
            required
          />

          <DateField
            label="Tanggal"
            value={date}
            onChange={setDate}
            error={errors.date}
            required
            helperText="Disimpan pukul 12.00 waktu lokal agar tanggal tidak bergeser."
          />

          {type !== 'income' ? (
            <SelectField
              label="Fund Sumber"
              value={sourceFundId}
              options={sourceOptions}
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
              options={destinationOptions}
              onChange={setDestinationFundId}
              error={errors.destinationFundId}
              placeholder="Pilih Fund tujuan"
              disabled={saving}
              required
            />
          ) : null}

          {type !== 'transfer' ? (
            <SelectField
              label="Category"
              value={categoryId}
              options={categoryOptions}
              onChange={setCategoryId}
              error={errors.categoryId}
              placeholder={`Pilih Category ${type}`}
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
              title={isEditing ? 'Simpan Perubahan' : 'Simpan Transaksi'}
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
