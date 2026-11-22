import { useState } from 'react';
import { Modal, ScrollView, StyleSheet, Text, View } from 'react-native';
import { AppButton, SelectField } from '@/shared/components';
import { colors, radius, spacing, typography } from '@/shared/theme';
import { formatRupiah } from '@/shared/utils/currency';

/**
 * Dialog pemilih Fund untuk konfirmasi Income Item atau konversi Planned
 * Expense. Opsi Fund disaring oleh pemanggil (Expense hanya Active Fund).
 */
export default function PocketFundDialog({
  visible,
  title,
  message,
  funds = [],
  confirmLabel = 'Lanjutkan',
  saving = false,
  onSubmit,
  onCancel,
}) {
  const [fundId, setFundId] = useState('');
  const [error, setError] = useState(null);

  const options = funds
    .filter((fund) => !fund.isArchived)
    .map((fund) => ({
      label: fund.name,
      value: fund.id,
      description: `Saldo ${formatRupiah(fund.balance ?? fund.openingBalance ?? 0)}`,
    }));

  const handleConfirm = () => {
    if (!fundId) {
      setError('Fund wajib dipilih.');
      return;
    }
    setError(null);
    onSubmit?.(fundId);
  };

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={() => !saving && onCancel?.()}>
      <View style={styles.backdrop}>
        <View style={styles.dialog}>
          <ScrollView showsVerticalScrollIndicator={false}>
            <Text style={styles.title}>{title}</Text>
            {message ? <Text style={styles.message}>{message}</Text> : null}
            <SelectField
              label="Fund"
              value={fundId}
              options={options}
              onChange={setFundId}
              error={error}
              placeholder="Pilih Fund"
              disabled={saving}
              required
            />
            <View style={styles.actions}>
              <AppButton
                title="Batal"
                variant="secondary"
                size="sm"
                onPress={onCancel}
                disabled={saving}
                style={styles.action}
              />
              <AppButton
                title={confirmLabel}
                size="sm"
                onPress={handleConfirm}
                loading={saving}
                style={styles.action}
              />
            </View>
          </ScrollView>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: colors.overlay,
    alignItems: 'center',
    justifyContent: 'center',
    padding: spacing.xl,
  },
  dialog: {
    width: '100%',
    maxWidth: 420,
    maxHeight: '85%',
    backgroundColor: colors.surface,
    borderRadius: 16,
    padding: spacing.lg,
  },
  title: {
    ...typography.subheading,
    color: colors.text,
    marginBottom: spacing.xs,
  },
  message: {
    ...typography.body,
    color: colors.textMuted,
    marginBottom: spacing.md,
  },
  actions: {
    flexDirection: 'row',
    marginTop: spacing.md,
  },
  action: {
    flex: 1,
    borderRadius: radius.md,
  },
});
