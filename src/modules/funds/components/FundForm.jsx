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
  SelectField,
  TextField,
} from '@/shared/components';
import { colors, radius, spacing, typography } from '@/shared/theme';

const FUND_TYPE_OPTIONS = [
  {
    label: 'Active',
    value: 'active',
    description: 'Dihitung dalam Active Balance dan dapat dipakai Expense.',
  },
  {
    label: 'Savings/Goal',
    value: 'savings_goal',
    description: 'Dana ditabung dan tidak dihitung dalam Active Balance.',
  },
];

/**
 * Form tambah/edit Fund. Opening Balance hanya dapat diisi saat pembuatan;
 * saat edit ditampilkan sebagai informasi yang tidak dapat diubah.
 */
export default function FundForm({
  visible,
  fund = null,
  saving = false,
  onSubmit,
  onCancel,
}) {
  const isEditing = Boolean(fund);
  const [name, setName] = useState(fund?.name ?? '');
  const [fundType, setFundType] = useState(fund?.fundType ?? 'active');
  const [openingBalance, setOpeningBalance] = useState(fund?.openingBalance ?? 0);
  const [errors, setErrors] = useState({});

  const handleSubmit = () => {
    const nextErrors = {};
    const trimmedName = typeof name === 'string' ? name.trim() : '';

    if (!trimmedName) {
      nextErrors.name = 'Nama Fund wajib diisi.';
    }

    if (!isEditing) {
      const amount = Number(openingBalance);
      if (!Number.isFinite(amount) || amount < 0) {
        nextErrors.openingBalance = 'Opening Balance tidak boleh negatif.';
      }
    }

    setErrors(nextErrors);
    if (Object.keys(nextErrors).length > 0) {
      return;
    }

    onSubmit?.({
      name: trimmedName,
      fundType,
      openingBalance: isEditing ? fund.openingBalance : Number(openingBalance) || 0,
    });
  };

  return (
    <Modal
      visible={visible}
      animationType="slide"
      onRequestClose={() => !saving && onCancel?.()}
    >
      <View style={styles.container}>
        <View style={styles.header}>
          <Text style={styles.title}>{isEditing ? 'Ubah Fund' : 'Fund Baru'}</Text>
          <Pressable
            onPress={() => !saving && onCancel?.()}
            disabled={saving}
            accessibilityRole="button"
            accessibilityLabel="Tutup form Fund"
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
          <TextField
            label="Nama Fund"
            value={name}
            onChangeText={setName}
            placeholder="Misalnya: Dompet Harian"
            error={errors.name}
            required
            autoCorrect={false}
          />

          <SelectField
            label="Klasifikasi"
            value={fundType}
            options={FUND_TYPE_OPTIONS}
            onChange={setFundType}
            required
          />

          <AmountInput
            label="Opening Balance"
            value={openingBalance}
            onChangeValue={setOpeningBalance}
            editable={!isEditing}
            error={errors.openingBalance}
            helperText={
              isEditing
                ? 'Opening Balance hanya ditentukan saat Fund dibuat dan tidak dapat diubah.'
                : 'Saldo awal Fund. Isi 0 bila belum ada saldo.'
            }
          />

          <View style={styles.actions}>
            <AppButton
              title="Batal"
              variant="secondary"
              onPress={onCancel}
              disabled={saving}
              style={styles.cancelButton}
            />
            <AppButton
              title={isEditing ? 'Simpan Perubahan' : 'Buat Fund'}
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
