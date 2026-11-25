import { Pressable, StyleSheet, Text, View } from 'react-native';
import Ionicons from '@expo/vector-icons/Ionicons';
import { AppButton, Card } from '@/shared/components';
import { colors, spacing, typography } from '@/shared/theme';
import { formatDateInTimeZone } from '@/shared/utils/date';
import { formatRupiah } from '@/shared/utils/currency';

/** Kartu notifikasi pending. Kartu persist di database sampai Confirm/Reject. */
export default function NotificationCard({
  notification,
  timezone = null,
  busy = false,
  onConfirm,
  onReject,
}) {
  const isIncome = notification.pocketType === 'income';

  return (
    <Card style={styles.card}>
      <Pressable
        onPress={() => onConfirm?.(notification)}
        disabled={busy}
        accessibilityRole="button"
        accessibilityLabel={`Buka konfirmasi ${notification.itemName}`}
        accessibilityState={{ disabled: busy }}
        style={({ pressed }) => [pressed && styles.pressed]}
      >
        <View style={styles.row}>
          <View
            style={[
              styles.iconWrap,
              { backgroundColor: isIncome ? colors.successSoft : colors.warningSoft },
            ]}
          >
            <Ionicons
              name={isIncome ? 'arrow-down-circle-outline' : 'wallet-outline'}
              size={20}
              color={isIncome ? colors.success : colors.warning}
            />
          </View>
          <View style={styles.body}>
            <Text style={styles.title} numberOfLines={1}>
              {notification.itemName}
            </Text>
            <Text style={styles.subtitle} numberOfLines={1}>
              {isIncome ? 'Income' : 'Expense'} · {notification.pocketName}
            </Text>
            <Text style={styles.subtitle}>
              Jadwal{' '}
              {notification.scheduledFor
                ? formatDateInTimeZone(notification.scheduledFor, timezone)
                : '-'}
            </Text>
          </View>
          <Text style={styles.amount}>{formatRupiah(notification.templateAmount)}</Text>
        </View>
      </Pressable>

      <View style={styles.actions}>
        <AppButton
          title="Tolak"
          size="sm"
          variant="secondary"
          onPress={() => onReject?.(notification.occurrenceId)}
          disabled={busy}
          style={styles.action}
        />
        <AppButton
          title="Konfirmasi"
          size="sm"
          onPress={() => onConfirm?.(notification)}
          disabled={busy}
          style={styles.action}
        />
      </View>
    </Card>
  );
}

const styles = StyleSheet.create({
  card: {
    marginBottom: spacing.md,
  },
  pressed: {
    opacity: 0.7,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  iconWrap: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
  },
  body: {
    flex: 1,
    marginLeft: spacing.sm,
  },
  title: {
    ...typography.bodyStrong,
    color: colors.text,
  },
  subtitle: {
    ...typography.caption,
    color: colors.textMuted,
  },
  amount: {
    ...typography.bodyStrong,
    color: colors.text,
    marginLeft: spacing.sm,
  },
  actions: {
    flexDirection: 'row',
    gap: spacing.sm,
    marginTop: spacing.md,
  },
  action: {
    flex: 1,
  },
});
