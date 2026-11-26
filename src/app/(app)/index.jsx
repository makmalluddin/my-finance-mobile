import { router, useFocusEffect } from 'expo-router';
import { useCallback } from 'react';
import Ionicons from '@expo/vector-icons/Ionicons';
import { Pressable, RefreshControl, StyleSheet, Text, View } from 'react-native';
import { DashboardOverview, useDashboard } from '@/modules/dashboard';
import { useNotifications } from '@/modules/notifications';
import { ErrorBanner, PageHeader, Screen } from '@/shared/components';
import { colors, radius, spacing, typography } from '@/shared/theme';

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
      <Ionicons name="notifications-outline" size={22} color={colors.text} />
      {count > 0 ? (
        <View style={styles.badge}>
          <Text style={styles.badgeText}>{count}</Text>
        </View>
      ) : null}
    </Pressable>
  );
}

export default function DashboardScreen() {
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
      <PageHeader
        title="Dashboard"
        subtitle="Ringkasan keuangan Anda"
        right={<NotificationButton count={notifications.length} />}
      />

      <ErrorBanner message={error} onDismiss={clearError} />
      <DashboardOverview dashboard={dashboard} loading={loading} />
    </Screen>
  );
}

const styles = StyleSheet.create({
  button: {
    width: 44,
    height: 44,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: radius.pill,
    backgroundColor: colors.surfaceMuted,
  },
  pressed: {
    opacity: 0.7,
  },
  badge: {
    position: 'absolute',
    top: 0,
    right: 0,
    minWidth: spacing.xl,
    height: spacing.xl,
    borderRadius: radius.pill,
    backgroundColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: spacing.xxs,
  },
  badgeText: {
    ...typography.captionStrong,
    color: colors.textInverse,
  },
});
