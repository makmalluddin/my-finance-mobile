import { useState } from 'react';
import { Modal, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import Ionicons from '@expo/vector-icons/Ionicons';
import { AmountInput, AppButton, TextField } from '@/shared/components';
import { colors, radius, spacing, typography } from '@/shared/theme';
import { getDeviceTimezone } from '@/appservices/automation/automationService';
import { fromDateKey, toDateKey } from '@/shared/utils/date';
import AutomationFields from './AutomationFields';

/**
 * Form pengubahan Automation yang sudah ada. Nama dan nominal template
 * diperbarui bersama jadwal melalui rpc_update_automation.
 */
export default function AutomationForm({
  visible,
  automation,
  pocketType = 'expense',
  funds = [],
  saving = false,
  onSubmit,
  onCancel,
}) {
  const [name, setName] = useState(automation?.item?.name ?? '');
  const [amount, setAmount] = useState(automation?.item?.amount ?? 0);
  const [fundId, setFundId] = useState(automation?.item?.fundId ?? '');
  const [frequency, setFrequency] = useState(automation?.frequency ?? 'weekly');
  const [startDate, setStartDate] = useState(() => {
    const parsed = automation?.startDate ? fromDateKey(automation.startDate) : new Date();
    return parsed && !Number.isNaN(parsed.getTime()) ? parsed : new Date();
  });
  const [errors, setErrors] = useState({});

  const handleSubmit = () => {
    const nextErrors = {};
    if (name.trim() === '') {
      nextErrors.name = 'Nama item wajib diisi.';
    }
    if (Number(amount) <= 0) {
      nextErrors.amount = 'Nominal harus lebih besar dari nol.';
    }
    if (!fundId) {
      nextErrors.fundId = 'Fund wajib dipilih.';
    }
    if (!(startDate instanceof Date) || Number.isNaN(startDate.getTime())) {
      nextErrors.startDate = 'Tanggal tidak valid.';
    }

    setErrors(nextErrors);
    if (Object.keys(nextErrors).length > 0) {
      return;
    }

    onSubmit?.({
      automationId: automation.id,
      name: name.trim(),
      amount: Number(amount),
      fundId,
      frequency,
      startDate: toDateKey(startDate),
      timezone: automation?.timezone ?? getDeviceTimezone(),
    });
  };

  return (
    <Modal visible={visible} animationType="slide" onRequestClose={() => !saving && onCancel?.()}>
      <View style={styles.container} accessibilityViewIsModal>
        <View style={styles.header}>
          <Text style={styles.title}>Ubah Automation</Text>
          <Pressable
            onPress={() => !saving && onCancel?.()}
            disabled={saving}
            accessibilityRole="button"
            accessibilityLabel="Tutup form Automation"
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
          <TextField
            label="Nama Item"
            value={name}
            onChangeText={setName}
            autoCorrect={false}
            returnKeyType="done"
            error={errors.name}
            required
          />
          <AmountInput value={amount} onChangeValue={setAmount} error={errors.amount} required />
          <AutomationFields
            funds={funds}
            pocketType={pocketType}
            fundId={fundId}
            onFundIdChange={setFundId}
            frequency={frequency}
            onFrequencyChange={setFrequency}
            startDate={startDate}
            onStartDateChange={setStartDate}
            errors={errors}
            disabled={saving}
          />

          <View style={styles.actions}>
            <AppButton
              title="Batal"
              variant="secondary"
              onPress={onCancel}
              disabled={saving}
              style={styles.cancelButton}
            />
            <AppButton title="Simpan" onPress={handleSubmit} loading={saving} disabled={saving} />
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
    padding: spacing.lg,
    backgroundColor: colors.surface,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  title: {
    ...typography.subheading,
    color: colors.text,
  },
  content: {
    padding: spacing.lg,
  },
  actions: {
    flexDirection: 'row',
    marginTop: spacing.xl,
    gap: spacing.md,
  },
  cancelButton: {
    borderRadius: radius.md,
  },
});
