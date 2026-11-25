import { Text, View } from 'react-native';
import { AppButton, Card } from '@/shared/components';
import { colors, spacing, typography } from '@/shared/theme';
import { formatDate } from '@/shared/utils/date';
import { formatRupiah } from '@/shared/utils/currency';
import { FREQUENCY_OPTIONS } from './AutomationFields';

function frequencyLabel(frequency) {
  return (
    FREQUENCY_OPTIONS.find((option) => option.value === frequency)?.label ?? frequency ?? '-'
  );
}

/** Daftar Automation milik Pocket yang sedang dibuka. */
export default function AutomationSection({ automations = [], busy = false, onEdit, onDelete }) {
  if (automations.length === 0) {
    return null;
  }

  return (
    <View style={styles.section}>
      <Text style={styles.sectionTitle}>Automation</Text>
      {automations.map((automation) => (
        <Card key={automation.id} style={styles.card}>
          <Text style={styles.name}>{automation.item?.name ?? 'Item Automation'}</Text>
          <Text style={styles.detail}>
            {formatRupiah(automation.item?.amount ?? 0)} · {frequencyLabel(automation.frequency)}
          </Text>
          <Text style={styles.detail}>
            Mulai {automation.startDate ? formatDate(new Date(`${automation.startDate}T00:00:00`)) : '-'}
            {' · '}Berikutnya{' '}
            {automation.nextRunAt ? formatDate(new Date(automation.nextRunAt)) : '-'}
          </Text>
          <View style={styles.actions}>
            <AppButton
              title="Ubah Jadwal"
              size="sm"
              variant="ghost"
              onPress={() => onEdit?.(automation)}
              disabled={busy}
            />
            <AppButton
              title="Hapus"
              size="sm"
              variant="danger"
              onPress={() => onDelete?.(automation)}
              disabled={busy}
            />
          </View>
        </Card>
      ))}
    </View>
  );
}

const styles = {
  section: {
    marginBottom: spacing.lg,
  },
  sectionTitle: {
    ...typography.subheading,
    color: colors.text,
    marginBottom: spacing.sm,
  },
  card: {
    marginBottom: spacing.sm,
  },
  name: {
    ...typography.bodyStrong,
    color: colors.text,
  },
  detail: {
    ...typography.caption,
    color: colors.textMuted,
    marginTop: spacing.xxs ?? 2,
  },
  actions: {
    flexDirection: 'row',
    marginTop: spacing.sm,
    gap: spacing.sm,
  },
};
