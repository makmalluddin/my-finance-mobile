import { Text, View } from 'react-native';
import { DateField, SelectField } from '@/shared/components';
import { colors, spacing, typography } from '@/shared/theme';
import { getDeviceTimezone } from '@/appservices/automation/automationService';
import { formatRupiah } from '@/shared/utils/currency';

export const FREQUENCY_OPTIONS = [
  { label: 'Setiap minggu', value: 'weekly' },
  { label: 'Setiap dua minggu', value: 'every_two_weeks' },
  { label: 'Setiap bulan', value: 'monthly' },
];

/**
 * Field konfigurasi jadwal Automation. Dipakai saat membuat item Pocket dan
 * saat mengubah Automation yang sudah ada.
 */
export default function AutomationFields({
  funds = [],
  pocketType,
  fundId,
  onFundIdChange,
  frequency,
  onFrequencyChange,
  startDate,
  onStartDateChange,
  errors = {},
  disabled = false,
}) {
  const isExpense = pocketType === 'expense';
  const eligibleFunds = funds.filter(
    (fund) => !fund.isArchived && (!isExpense || fund.fundType === 'active')
  );
  const fundOptions = eligibleFunds.map((fund) => ({
    label: fund.name,
    value: fund.id,
    description: `Saldo ${formatRupiah(fund.balance ?? fund.openingBalance ?? 0)}`,
  }));

  return (
    <View style={styles.container}>
      <SelectField
        label={isExpense ? 'Fund Sumber Default' : 'Fund Tujuan Default'}
        value={fundId}
        options={fundOptions}
        onChange={onFundIdChange}
        error={errors.fundId}
        placeholder={isExpense ? 'Pilih Active Fund' : 'Pilih Fund tujuan'}
        helperText={
          isExpense
            ? 'Automation Expense hanya dapat memakai Active Fund.'
            : 'Fund tujuan boleh Active maupun Savings/Goal.'
        }
        disabled={disabled}
        required
      />
      <SelectField
        label="Frekuensi"
        value={frequency}
        options={FREQUENCY_OPTIONS}
        onChange={onFrequencyChange}
        error={errors.frequency}
        placeholder="Pilih frekuensi"
        disabled={disabled}
        required
      />
      <DateField
        label="Tanggal Mulai"
        value={startDate}
        onChange={onStartDateChange}
        error={errors.startDate}
        helperText="Jadwal bulanan pada tanggal 31 otomatis memakai hari terakhir bulan."
        disabled={disabled}
        required
      />
      <Text style={styles.timezone}>
        Zona waktu jadwal: {getDeviceTimezone()}. Zona waktu tersimpan pada Automation dan tidak
        berubah saat zona waktu perangkat berubah.
      </Text>
    </View>
  );
}

const styles = {
  container: {
    gap: spacing.md,
    marginTop: spacing.sm,
  },
  timezone: {
    ...typography.caption,
    color: colors.textMuted,
  },
};
