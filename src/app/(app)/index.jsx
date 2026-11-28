import { router, useFocusEffect } from 'expo-router';
import { useCallback } from 'react';
import Ionicons from '@expo/vector-icons/Ionicons';
import { Pressable, RefreshControl, StyleSheet, Text, View } from 'react-native';
import { useAuth } from '@/modules/auth';
import { DashboardOverview, useDashboard } from '@/modules/dashboard';
import { useNotifications } from '@/modules/notifications';
import { ErrorBanner, Screen } from '@/shared/components';
import { colors, borderWidth, radius, typography } from '@/shared/theme';

/** Tombol Notifikasi di header kanan. Badge memakai jumlah notifikasi pending. */
function NotificationButton({ count }) {
  return (
    <Pressable
      onPress={() => router.push('/notifications')}
      accessibilityRole="button"
      accessibilityLabel={count > 0 ? `Notifikasi, ${count} menunggu konfirmasi` : 'Notifikasi'}
      hitSlop={8}
      style={({ pressed }) => [styles.button, pressed && styles.pressed]}
    >
      <Ionicons name="notifications-outline" size={21} color={colors.text} />
      {count > 0 ? (
        <View style={styles.badge}>
          <Text style={styles.badgeText}>{count}</Text>
        </View>
      ) : null}
    </Pressable>
  );
}

export default function DashboardScreen() {
  const { displayName } = useAuth();
  const { dashboard, loading, error, refresh, clearError } = useDashboard();
  const { notifications } = useNotifications();

  useFocusEffect(
    useCallback(() => {
      refresh();
    }, [refresh])
  );

  return (
    <Screen
      refreshControl={
        <RefreshControl refreshing={loading} onRefresh={() => refresh({ silent: true })} />
      }
    >
      <View style={styles.header}>
        <View style={styles.headerText}>
          <Text style={styles.greetingName} numberOfLines={1} ellipsizeMode="tail">
            {displayName}
          </Text>
          <Text style={styles.greeting}>Good evening</Text>
        </View>
        <NotificationButton count={notifications.length} />
      </View>

      <ErrorBanner message={error} onDismiss={clearError} />
      <DashboardOverview dashboard={dashboard} loading={loading} />
    </Screen>
  );
}

const styles = StyleSheet.create({
  header: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    marginBottom: 24,
  },
  headerText: {
    flex: 1,
    paddingRight: 12,
  },
  greetingName: {
    ...typography.display,
    color: colors.text,
  },
  greeting: {
    ...typography.bodyStrong,
    fontWeight: '650',
    color: colors.success,
    marginTop: 4,
  },
  button: {
    width: 44,
    height: 44,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: radius.button,
    backgroundColor: colors.buttonSoft,
    borderWidth: borderWidth.hairline,
    borderColor: colors.border,
  },
  pressed: {
    opacity: 0.7,
  },
  badge: {
    position: 'absolute',
    top: -4,
    right: -4,
    minWidth: 19,
    height: 19,
    borderRadius: 20,
    borderWidth: borderWidth.thick,
    borderColor: colors.surface,
    backgroundColor: colors.notificationBadge,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 2,
  },
  badgeText: {
    ...typography.notificationBadge,
    color: colors.notificationBadgeText,
  },
});
