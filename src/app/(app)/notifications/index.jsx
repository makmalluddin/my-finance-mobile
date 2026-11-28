import { router, useFocusEffect } from 'expo-router';
import { useCallback, useState } from 'react';
import Ionicons from '@expo/vector-icons/Ionicons';
import { Pressable, RefreshControl, StyleSheet, Text, View } from 'react-native';
import { automationService } from '@/appservices/automation/automationService';
import { useFunds } from '@/modules/funds';
import {
  NotificationCard,
  OccurrenceConfirmDialog,
  useNotifications,
} from '@/modules/notifications';
import {
  EmptyState,
  ErrorBanner,
  LoadingState,
  Screen,
} from '@/shared/components';
import { colors, radius, spacing, typography } from '@/shared/theme';

/**
 * Daftar kartu konfirmasi Automation. Semua aksi mengubah occurrence di
 * backend, lalu daftar disegarkan dari store bersama.
 */
export default function NotificationsScreen() {
  const { notifications, saving, error, refresh, clearError, confirmOccurrence, rejectOccurrence } =
    useNotifications();
  const {
    funds,
    loading: loadingFunds,
    error: fundsError,
    clearError: clearFundsError,
    refresh: refreshFunds,
  } = useFunds();
  const [refreshing, setRefreshing] = useState(false);
  const [selectedOccurrenceId, setSelectedOccurrenceId] = useState(null);
  const [timezones, setTimezones] = useState({});

  const refreshAll = useCallback(async () => {
    setRefreshing(true);
    try {
      const [automations] = await Promise.all([
        automationService.listAutomations().catch(() => []),
        refresh(),
        refreshFunds({ silent: true }),
      ]);
      setTimezones(
        Object.fromEntries(
          automations
            .filter((automation) => automation.id && automation.timezone)
            .map((automation) => [automation.id, automation.timezone])
        )
      );
    } finally {
      setRefreshing(false);
    }
  }, [refresh, refreshFunds]);

  useFocusEffect(
    useCallback(() => {
      refreshAll();
    }, [refreshAll])
  );

  const selected =
    notifications.find((item) => item.occurrenceId === selectedOccurrenceId) ?? null;
  const selectedTimezone = selected?.automationId ? timezones[selected.automationId] : null;

  const handleConfirm = async (input) => {
    const success = await confirmOccurrence(input);
    if (success) {
      setSelectedOccurrenceId(null);
    }
  };

  const handleReject = async (occurrenceId) => {
    const success = await rejectOccurrence(occurrenceId);
    if (success && selectedOccurrenceId === occurrenceId) {
      setSelectedOccurrenceId(null);
    }
  };

  return (
    <Screen
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={refreshAll} />}
    >
      <View style={styles.header}>
        <Pressable
          onPress={() => router.back()}
          accessibilityRole="button"
          accessibilityLabel="Kembali ke Dashboard"
          hitSlop={8}
          style={styles.backButton}
        >
          <Ionicons name="arrow-back" size={22} color={colors.text} />
        </Pressable>
        <View style={styles.headerText}>
          <Text style={styles.headerTitle}>Notifikasi</Text>
          <Text style={styles.headerSubtitle}>
            Konfirmasi jadwal pemasukan dan pengeluaran yang jatuh tempo.
          </Text>
        </View>
      </View>

      {error ? <ErrorBanner message={error} onDismiss={clearError} /> : null}
      {fundsError ? <ErrorBanner message={fundsError} onDismiss={clearFundsError} /> : null}

      {refreshing && notifications.length === 0 ? (
        <LoadingState message="Memuat notifikasi..." />
      ) : notifications.length === 0 ? (
        <EmptyState
          icon="notifications-outline"
          title="Tidak ada notifikasi"
          message="Kartu konfirmasi muncul ketika Automation mencapai tanggal jadwalnya."
        />
      ) : (
        notifications.map((notification) => (
          <NotificationCard
            key={notification.id}
            notification={notification}
            timezone={notification.automationId ? timezones[notification.automationId] : null}
            busy={saving}
            onConfirm={(item) => setSelectedOccurrenceId(item.occurrenceId)}
            onReject={handleReject}
          />
        ))
      )}

      <OccurrenceConfirmDialog
        key={selected?.occurrenceId ?? 'none'}
        visible={Boolean(selected)}
        notification={selected}
        timezone={selectedTimezone}
        funds={funds}
        saving={saving}
        fundsLoading={loadingFunds}
        onSubmit={handleConfirm}
        onReject={handleReject}
        onCancel={() => setSelectedOccurrenceId(null)}
      />
    </Screen>
  );
}

const styles = StyleSheet.create({
  header: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: spacing.xl,
  },
  backButton: {
    width: 44,
    height: 44,
    borderRadius: radius.button,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerText: {
    flex: 1,
    marginLeft: spacing.sm,
    paddingTop: spacing.xs,
  },
  headerTitle: {
    ...typography.detailTitle,
    color: colors.text,
  },
  headerSubtitle: {
    ...typography.body,
    color: colors.textMuted,
    marginTop: spacing.sm,
  },
});
