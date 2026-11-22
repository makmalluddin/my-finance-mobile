import Ionicons from '@expo/vector-icons/Ionicons';
import { useState } from 'react';
import { Modal, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import {
  AmountInput,
  AppButton,
  DateField,
  SelectField,
  TextField,
} from '@/shared/components';
import { colors, radius, spacing, typography } from '@/shared/theme';
import { formatRupiah } from '@/shared/utils/currency';

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
 * Form item Pocket. Transfer membuat transaksi sekaligus sehingga memerlukan
 * dua Fund dan tanggal; Income/Expense hanya membuat item.
 */
export default function PocketItemForm({
  visible,
  pocket,
  item = null,
  funds = [],
  saving = false,
  onSubmit,
  onCancel,
}) {
  const isEditing = Boolean(item);
  const isTransfer = pocket?.type === 'transfer';
  const [name, setName] = useState(item?.name ?? '');
  const [amount, setAmount] = useState(item?.amount ?? 0);
  const [sourceFundId, setSourceFundId] = useState(
    item?.transaction?.sourceFundId ?? ''
  );
  const [destinationFundId, setDestinationFundId] = useState(
    item?.transaction?.destinationFundId ?? ''
  );
  const [date, setDate] = useState(
    item?.transaction?.occurredAt ? new Date(item.transaction.occurredAt) : new Date()
  );
  const [errors, setErrors] = useState({});

  const options = fundOptions(funds);

  const handleSourceChange = (nextSourceFundId) => {
    setSourceFundId(nextSourceFundId);
    if (nextSourceFundId === destinationFundId) {
      setDestinationFundId('');
    }
  };

  const handleSubmit = () => {
    const nextErrors = {};
    if (name.trim() === '') {
      nextErrors.name = 'Nama item wajib diisi.';
    }
    if (Number(amount) <= 0) {
      nextErrors.amount = 'Nominal harus lebih besar dari nol.';
    }

    if (isTransfer) {
      if (!sourceFundId) {
        nextErrors.sourceFundId = 'Fund sumber wajib dipilih.';
      }
      if (!destinationFundId) {
        nextErrors.destinationFundId = 'Fund tujuan wajib dipilih.';
      }
      if (sourceFundId && sourceFundId === destinationFundId) {
        nextErrors.destinationFundId = 'Fund tujuan harus berbeda dari sumber.';
      }
      if (!(date instanceof Date) || Number.isNaN(date.getTime())) {
        nextErrors.date = 'Tanggal tidak valid.';
      }
    }

    setErrors(nextErrors);
    if (Object.keys(nextErrors).length > 0) {
      return;
    }

    const payload = { name: name.trim(), amount: Number(amount) };
    if (isEditing) {
      payload.itemId = item.id;
    } else {
      payload.pocketId = pocket.id;
    }
    if (isTransfer) {
      payload.sourceFundId = sourceFundId;
      payload.destinationFundId = destinationFundId;
      payload.date = date;
    }

    onSubmit?.(payload);
  };

  const title = isEditing
    ? 'Ubah Planned Expense'
    : isTransfer
      ? 'Transfer Item Baru'
      : pocket?.type === 'income'
        ? 'Income Item Baru'
        : 'Planned Expense Baru';

  return (
    <Modal visible={visible} animationType="slide" onRequestClose={() => !saving && onCancel?.()}>
      <View style={styles.container}>
        <View style={styles.header}>
          <Text style={styles.title}>{title}</Text>
          <Pressable
            onPress={() => !saving && onCancel?.()}
            disabled={saving}
            accessibilityRole="button"
            accessibilityLabel="Tutup form item"
            hitSlop={8}
          >
            <Ionicons name="close" size={24} color={colors.textMuted} />
          </Pressable>
        </View>

        <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
          <TextField
            label="Nama Item"
            value={name}
            onChangeText={setName}
            placeholder="Misalnya: Tiket pesawat"
            error={errors.name}
            required
          />
          <AmountInput value={amount} onChangeValue={setAmount} error={errors.amount} required />

          {isTransfer ? (
            <>
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
              <DateField
                label="Tanggal"
                value={date}
                onChange={setDate}
                error={errors.date}
                required
              />
            </>
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
              title="Simpan"
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
