import { Pressable, StyleSheet, Text, View } from 'react-native';
import Ionicons from '@expo/vector-icons/Ionicons';
import { AppButton, Card } from '@/shared/components';
import { colors, radius, spacing, typography } from '@/shared/theme';
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
              { backgroundColor: isIncome ? colors.successSoft : colors.dangerSoft },
            ]}
          >
            <Ionicons
              name={isIncome ? 'arrow-down-outline' : 'wallet-outline'}
              size={18}
              color={isIncome ? colors.success : colors.danger}
            />
          </View>
          <View style={styles.body}>
            <Text style={styles.title} numberOfLines={1}>
              {notification.itemName}
            </Text>
            <Text style={styles.subtitle} numberOfLines={1}>
              {isIncome ? 'Income' : 'Expense'}·{notification.pocketName}
            </Text>
          </View>
        </View>
        <View style={styles.detailRow}>
          <Text style={styles.date}>
            {notification.scheduledFor
              ? formatDateInTimeZone(notification.scheduledFor, timezone)
              : '-'}
          </Text>
          <Text style={styles.amount}>{formatRupiah(notification.templateAmount)}</Text>
        </View>
      </Pressable>

      <View style={styles.actions}>
        <AppButton
          title="Tolak"
          size="sm"
          variant="dangerOutline"
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
    padding: spacing.md + 2,
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
    width: 37,
    height: 37,
    borderRadius: radius.button,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: spacing.md,
  },
  body: {
    flex: 1,
  },
  title: {
    ...typography.heading,
    color: colors.text,
  },
  subtitle: {
    ...typography.body,
    color: colors.textMuted,
    marginTop: spacing.xxs,
  },
  detailRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: spacing.md,
  },
  date: {
    ...typography.captionStrong,
    color: colors.textMuted,
  },
  amount: {
    ...typography.amountLarge,
    color: colors.text,
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
