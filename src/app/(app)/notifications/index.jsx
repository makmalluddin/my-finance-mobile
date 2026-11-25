import { useFocusEffect } from 'expo-router';
import { useCallback, useState } from 'react';
import { RefreshControl } from 'react-native';
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
  PageHeader,
  Screen,
} from '@/shared/components';

/**
 * Daftar kartu konfirmasi Automation. Semua aksi mengubah occurrence di
 * backend, lalu daftar disegarkan dari store bersama.
 */
export default function NotificationsScreen() {
  const { notifications, saving, error, refresh, clearError, confirmOccurrence, rejectOccurrence } =
    useNotifications();
  const { funds, loading: loadingFunds, refresh: refreshFunds } = useFunds();
  const [refreshing, setRefreshing] = useState(false);
  const [selectedOccurrenceId, setSelectedOccurrenceId] = useState(null);

  const refreshAll = useCallback(async () => {
    setRefreshing(true);
    await Promise.all([refresh(), refreshFunds({ silent: true })]);
    setRefreshing(false);
  }, [refresh, refreshFunds]);

  useFocusEffect(
    useCallback(() => {
      refreshAll();
    }, [refreshAll])
  );

  const selected =
    notifications.find((item) => item.occurrenceId === selectedOccurrenceId) ?? null;

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
      <PageHeader
        title="Notifikasi"
        subtitle="Konfirmasi jadwal Income dan Expense yang sudah jatuh tempo."
      />

      {error ? <ErrorBanner message={error} onDismiss={clearError} /> : null}

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
