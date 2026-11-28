import Ionicons from '@expo/vector-icons/Ionicons';
import { StyleSheet, Text, View } from 'react-native';
import { AppButton, Badge, Card } from '@/shared/components';
import { colors, radius, spacing, typography } from '@/shared/theme';
import { formatDate, formatDateInTimeZone, fromDateKey } from '@/shared/utils/date';
import { FREQUENCY_OPTIONS } from './AutomationFields';

function frequencyLabel(frequency) {
  return (
    FREQUENCY_OPTIONS.find((option) => option.value === frequency)?.label ?? frequency ?? '-'
  );
}

function InfoRow({ label, value }) {
  return (
    <View style={styles.row}>
      <Text style={styles.rowLabel}>{label}</Text>
      <Text style={styles.rowValue}>{value}</Text>
    </View>
  );
}

/** Daftar Automation milik Pocket yang sedang dibuka. */
export default function AutomationSection({ automations = [], busy = false, onEdit, onDelete }) {
  if (automations.length === 0) {
    return null;
  }

  return (
    <View style={styles.section}>
      <Text style={styles.sectionTitle}>Otomasi</Text>
      {automations.map((automation) => {
        const startDate = automation.startDate
          ? fromDateKey(automation.startDate) ?? automation.startDate
          : null;
        const startLabel = startDate ? formatDate(startDate) : '-';
        const schedule = `${frequencyLabel(automation.frequency)}${
          startDate ? ` · setiap tanggal ${startDate.getDate?.() ?? ''}` : ''
        }`;

        return (
          <Card key={automation.id} style={styles.card}>
            <View style={styles.head}>
              <View style={styles.iconWrap}>
                <Ionicons name="calendar-outline" size={18} color={colors.primary} />
              </View>
              <View style={styles.headText}>
                <Text style={styles.name} numberOfLines={1}>
                  {schedule}
                </Text>
                <Badge label="Aktif" tone="success" />
              </View>
            </View>
            <InfoRow label="Tanggal mulai" value={startLabel} />
            <InfoRow
              label="Jadwal berikutnya"
              value={
                automation.nextRunAt
                  ? formatDateInTimeZone(automation.nextRunAt, automation.timezone)
                  : '-'
              }
            />
            <InfoRow label="Zona waktu" value={automation.timezone ?? '-'} />
            <View style={styles.actions}>
              <AppButton
                title="Edit"
                size="sm"
                variant="outline"
                onPress={() => onEdit?.(automation)}
                disabled={busy}
                style={styles.actionButton}
              />
              <AppButton
                title="Hapus"
                size="sm"
                variant="dangerOutline"
                onPress={() => onDelete?.(automation)}
                disabled={busy}
                style={styles.actionButton}
              />
            </View>
          </Card>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  section: {
    marginBottom: spacing.lg,
  },
  sectionTitle: {
    ...typography.heading,
    color: colors.text,
    marginBottom: spacing.sm,
  },
  card: {
    marginBottom: spacing.sm,
  },
  head: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: spacing.md,
  },
  iconWrap: {
    width: 37,
    height: 37,
    borderRadius: radius.tab,
    backgroundColor: colors.primarySoft,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: spacing.md,
  },
  headText: {
    flex: 1,
  },
  name: {
    ...typography.subheading,
    color: colors.text,
    marginBottom: spacing.xs,
  },
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: spacing.xs,
  },
  rowLabel: {
    ...typography.caption,
    color: colors.textMuted,
  },
  rowValue: {
    ...typography.bodyStrong,
    fontWeight: '700',
    color: colors.text,
  },
  actions: {
    flexDirection: 'row',
    marginTop: spacing.md,
  },
  actionButton: {
    minWidth: 60,
    marginRight: spacing.sm,
  },
});
