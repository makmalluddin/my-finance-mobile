import { useFocusEffect } from 'expo-router';
import { useCallback } from 'react';
import { RefreshControl } from 'react-native';
import { DashboardOverview, useDashboard } from '@/modules/dashboard';
import { ErrorBanner, PageHeader, Screen } from '@/shared/components';

export default function DashboardScreen() {
  const { dashboard, loading, error, refresh, clearError } = useDashboard();

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
      <PageHeader title="Dashboard" subtitle="Ringkasan keuangan Anda" />

      <ErrorBanner message={error} onDismiss={clearError} />
      <DashboardOverview dashboard={dashboard} loading={loading} />
    </Screen>
  );
}
