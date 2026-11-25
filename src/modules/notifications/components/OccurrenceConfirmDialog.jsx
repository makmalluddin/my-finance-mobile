import { useState } from 'react';
import { Modal, ScrollView, StyleSheet, Text, View } from 'react-native';
import Ionicons from '@expo/vector-icons/Ionicons';
import { AmountInput, AppButton, SelectField } from '@/shared/components';
import { colors, radius, spacing, typography } from '@/shared/theme';
import { formatDate } from '@/shared/utils/date';
import { formatRupiah } from '@/shared/utils/currency';

/**
 * Dialog konfirmasi occurrence. Income memakai nominal template dan menampilkan
 * peringatan permanen; Expense memungkinkan nominal occurrence diubah tanpa
 * mengubah template.
 */
export default function OccurrenceConfirmDialog({
  visible,
  notification,
  funds = [],
  saving = false,
  fundsLoading = false,
  onSubmit,
  onReject,
  onCancel,
}) {
  const isIncome = notification?.pocketType === 'income';
  const eligibleFunds = funds.filter(
    (fund) => !fund.isArchived && (isIncome || fund.fundType === 'active')
  );
  const [fundId, setFundId] = useState(notification?.defaultFundId ?? '');
  const [amount, setAmount] = useState(notification?.templateAmount ?? 0);
  const [error, setError] = useState(null);

  const handleConfirm = () => {
    if (!fundId) {
      setError('Fund wajib dipilih.');
      return;
    }
    if (!isIncome && Number(amount) <= 0) {
      setError('Nominal harus lebih besar dari nol.');
      return;
    }
    setError(null);
    onSubmit?.({
      occurrenceId: notification.occurrenceId,
      fundId,
      pocketType: notification.pocketType,
      amount: isIncome ? null : Number(amount),
    });
  };

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={() => !saving && onCancel?.()}>
      <View style={styles.backdrop}>
        <View style={styles.dialog}>
          <ScrollView showsVerticalScrollIndicator={false}>
            <Text style={styles.title}>{isIncome ? 'Konfirmasi Income' : 'Konfirmasi Expense'}</Text>
            <Text style={styles.message}>
              {notification?.itemName ?? ''} · {notification?.pocketName ?? ''}
              {'\n'}Jadwal {notification?.scheduledFor ? formatDate(new Date(notification.scheduledFor)) : '-'}
            </Text>
            <Text style={styles.amount}>
              Nominal template {formatRupiah(notification?.templateAmount ?? 0)}
            </Text>

            {isIncome ? (
              <View style={styles.warning}>
                <Ionicons name="warning-outline" size={18} color={colors.warning} />
                <Text style={styles.warningText}>
                  Setelah dikonfirmasi, transaksi Income tercatat permanen dan tidak dapat dihapus.
                </Text>
              </View>
            ) : (
              <AmountInput
                label="Nominal Konfirmasi"
                value={amount}
                onChangeValue={setAmount}
                helperText="Nominal ini hanya untuk occurrence ini; template tidak berubah."
              />
            )}

            <SelectField
              label={isIncome ? 'Fund Tujuan' : 'Fund Sumber (Active)'}
              value={fundId}
              options={eligibleFunds.map((fund) => ({
                label: fund.name,
                value: fund.id,
                description: `Saldo ${formatRupiah(fund.balance ?? fund.openingBalance ?? 0)}`,
              }))}
              onChange={setFundId}
              error={error}
              placeholder={fundsLoading ? 'Memuat Fund...' : 'Pilih Fund'}
              disabled={saving || fundsLoading}
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
                title="Tolak"
                variant="danger"
                size="sm"
                onPress={() => onReject?.(notification.occurrenceId)}
                disabled={saving}
                style={styles.action}
              />
            </View>
            <AppButton
              title="Konfirmasi"
              onPress={handleConfirm}
              loading={saving}
              disabled={saving}
              style={styles.confirm}
            />
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
    maxHeight: '90%',
    backgroundColor: colors.surface,
    borderRadius: radius.xl,
    padding: spacing.lg,
  },
  title: {
    ...typography.subheading,
    color: colors.text,
  },
  message: {
    ...typography.body,
    color: colors.textMuted,
    marginTop: spacing.xs,
  },
  amount: {
    ...typography.bodyStrong,
    color: colors.text,
    marginTop: spacing.sm,
  },
  warning: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: spacing.sm,
    backgroundColor: colors.warningSoft,
    borderRadius: radius.md,
    padding: spacing.md,
    marginTop: spacing.md,
  },
  warningText: {
    ...typography.caption,
    color: colors.warning,
    flex: 1,
  },
  actions: {
    flexDirection: 'row',
    gap: spacing.sm,
    marginTop: spacing.lg,
  },
  action: {
    flex: 1,
  },
  confirm: {
    marginTop: spacing.sm,
  },
});
