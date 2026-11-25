import Constants from 'expo-constants';
import { useFocusEffect } from 'expo-router';
import { useCallback, useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { useAuth } from '@/modules/auth';
import { CategorySummary, useCategories } from '@/modules/categories';
import {
  AppButton,
  Card,
  ConfirmDialog,
  ErrorBanner,
  PageHeader,
  Screen,
} from '@/shared/components';
import { colors, spacing, typography } from '@/shared/theme';
import { getDeviceTimezone } from '@/shared/utils/date';
import { toAppError } from '@/shared/utils/errors';

function InfoRow({ label, value, last = false }) {
  return (
    <View style={[styles.row, !last && styles.rowDivider]}>
      <Text style={styles.rowLabel}>{label}</Text>
      <Text style={styles.rowValue}>{value}</Text>
    </View>
  );
}

export default function SettingsScreen() {
  const { user, signOut } = useAuth();
  const {
    categories,
    loading: categoriesLoading,
    error: categoriesError,
    clearError: clearCategoriesError,
    refresh: refreshCategories,
  } = useCategories();
  const appVersion = Constants.expoConfig?.version ?? '1.0.0';
  const timezone = getDeviceTimezone();

  useFocusEffect(
    useCallback(() => {
      refreshCategories();
    }, [refreshCategories])
  );

  const [confirmVisible, setConfirmVisible] = useState(false);
  const [signingOut, setSigningOut] = useState(false);
  const [error, setError] = useState(null);

  const handleSignOut = async () => {
    setSigningOut(true);
    setError(null);

    try {
      await signOut();
    } catch (signOutError) {
      setError(toAppError(signOutError).message);
      setConfirmVisible(false);
    } finally {
      setSigningOut(false);
    }
  };

  return (
    <Screen>
      <PageHeader title="Pengaturan" subtitle="Preferensi dan informasi aplikasi" />

      <Card style={styles.card}>
        <Text style={styles.sectionTitle}>Akun</Text>
        <InfoRow label="Email" value={user?.email ?? '-'} last />
        <ErrorBanner message={error} onDismiss={() => setError(null)} />
        <AppButton
          title="Keluar"
          variant="secondary"
          size="sm"
          onPress={() => setConfirmVisible(true)}
        />
      </Card>

      <Card style={styles.card}>
        <Text style={styles.sectionTitle}>Kategori Sistem</Text>
        <ErrorBanner message={categoriesError} onDismiss={clearCategoriesError} />
        <CategorySummary categories={categories} loading={categoriesLoading} />
      </Card>

      <Card>
        <Text style={styles.sectionTitle}>Aplikasi</Text>
        <InfoRow label="Versi" value={appVersion} />
        <InfoRow label="Mata uang" value="IDR (Rupiah)" />
        <InfoRow label="Zona waktu" value={timezone} last />
      </Card>

      <ConfirmDialog
        visible={confirmVisible}
        title="Keluar dari akun?"
        message="Sesi Anda akan diakhiri dan aplikasi akan menampilkan halaman masuk."
        confirmLabel="Keluar"
        loading={signingOut}
        onConfirm={handleSignOut}
        onCancel={() => setConfirmVisible(false)}
      />
    </Screen>
  );
}

const styles = StyleSheet.create({
  card: {
    marginBottom: spacing.lg,
  },
  sectionTitle: {
    ...typography.subheading,
    color: colors.text,
    marginBottom: spacing.md,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    paddingVertical: spacing.md,
  },
  rowDivider: {
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: colors.border,
  },
  rowLabel: {
    ...typography.body,
    color: colors.textMuted,
    marginRight: spacing.md,
  },
  rowValue: {
    flex: 1,
    ...typography.bodyStrong,
    color: colors.text,
    textAlign: 'right',
  },
});
