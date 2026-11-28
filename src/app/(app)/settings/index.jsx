import Constants from 'expo-constants';
import { useFocusEffect } from 'expo-router';
import { useCallback, useState } from 'react';
import Ionicons from '@expo/vector-icons/Ionicons';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { ProfileNameDialog, useAuth } from '@/modules/auth';
import { CategorySummary, useCategories } from '@/modules/categories';
import {
  AppButton,
  Card,
  ConfirmDialog,
  ErrorBanner,
  PageHeader,
  Screen,
} from '@/shared/components';
import { colors, radius, spacing, typography } from '@/shared/theme';
import { getDeviceTimezone } from '@/shared/utils/date';
import { toAppError } from '@/shared/utils/errors';

function InfoRow({ label, value, action, last = false }) {
  return (
    <View style={[styles.row, !last && styles.rowDivider]}>
      <Text style={styles.rowLabel}>{label}</Text>
      <View style={styles.rowRight}>
        <Text style={styles.rowValue}>{value}</Text>
        {action ? <View style={styles.rowAction}>{action}</View> : null}
      </View>
    </View>
  );
}

function SectionTitle({ icon, children }) {
  return (
    <View style={styles.sectionHead}>
      <View style={styles.sectionIcon}>
        <Ionicons name={icon} size={18} color={colors.primary} />
      </View>
      <Text style={styles.sectionTitle}>{children}</Text>
    </View>
  );
}

export default function SettingsScreen() {
  const { user, displayName, signOut, updateDisplayName } = useAuth();
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
  const [nameDialogVisible, setNameDialogVisible] = useState(false);
  const [nameDraft, setNameDraft] = useState('');
  const [savingName, setSavingName] = useState(false);
  const [nameError, setNameError] = useState(null);

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

  const openNameDialog = () => {
    setNameDraft(user?.user_metadata?.display_name ?? '');
    setNameError(null);
    setNameDialogVisible(true);
  };

  const handleSaveName = async (name) => {
    setSavingName(true);
    setNameError(null);

    try {
      await updateDisplayName(name);
      setNameDialogVisible(false);
    } catch (saveError) {
      setNameError(toAppError(saveError).message);
    } finally {
      setSavingName(false);
    }
  };

  return (
    <Screen>
      <PageHeader title="Pengaturan" />

      <Card style={styles.card}>
        <SectionTitle icon="person-outline">Akun</SectionTitle>
        <InfoRow
          label="Nama"
          value={displayName}
          action={
            <Pressable
              onPress={openNameDialog}
              accessibilityRole="button"
              accessibilityLabel="Ubah nama"
              style={({ pressed }) => [styles.editButton, pressed && styles.editButtonPressed]}
            >
              <Ionicons name="pencil-outline" size={18} color={colors.primary} />
            </Pressable>
          }
        />
        <InfoRow label="Email" value={user?.email ?? '-'} last />
        <ErrorBanner message={error} onDismiss={() => setError(null)} />
        <AppButton
          title="Keluar"
          variant="dangerOutline"
          size="sm"
          onPress={() => setConfirmVisible(true)}
          style={styles.signOut}
        />
      </Card>

      <Card style={styles.card}>
        <SectionTitle icon="list-outline">Kategori Sistem</SectionTitle>
        <ErrorBanner message={categoriesError} onDismiss={clearCategoriesError} />
        <CategorySummary categories={categories} loading={categoriesLoading} />
      </Card>

      <Card>
        <SectionTitle icon="information-circle-outline">Aplikasi</SectionTitle>
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

      <ProfileNameDialog
        visible={nameDialogVisible}
        name={nameDraft}
        onChangeName={setNameDraft}
        loading={savingName}
        error={nameError}
        onSave={handleSaveName}
        onClose={() => !savingName && setNameDialogVisible(false)}
      />
    </Screen>
  );
}

const styles = StyleSheet.create({
  card: {
    padding: spacing.md + 2,
    marginBottom: spacing.lg,
  },
  sectionHead: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: spacing.md,
  },
  sectionIcon: {
    width: 32,
    height: 32,
    borderRadius: radius.tab,
    backgroundColor: colors.primarySoft,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: spacing.sm,
  },
  sectionTitle: {
    ...typography.heading,
    color: colors.text,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: spacing.sm,
  },
  rowDivider: {
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: colors.border,
  },
  rowLabel: {
    ...typography.caption,
    color: colors.textMuted,
    marginRight: spacing.md,
  },
  rowRight: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'flex-end',
  },
  rowValue: {
    flexShrink: 1,
    ...typography.bodyStrong,
    fontWeight: '700',
    color: colors.text,
    textAlign: 'right',
  },
  rowAction: {
    marginLeft: spacing.xs,
  },
  editButton: {
    width: 44,
    height: 44,
    borderRadius: radius.button,
    alignItems: 'center',
    justifyContent: 'center',
  },
  editButtonPressed: {
    backgroundColor: colors.primarySoft,
  },
  signOut: {
    minWidth: 98,
    marginTop: spacing.sm,
  },
});
