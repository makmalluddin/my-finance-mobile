import { useFocusEffect } from 'expo-router';
import { useCallback, useState } from 'react';
import { RefreshControl, StyleSheet } from 'react-native';
import {
  FundForm,
  FundList,
  useFunds,
} from '@/modules/funds';
import {
  AppButton,
  ConfirmDialog,
  ErrorBanner,
  LoadingState,
  PageHeader,
  Screen,
} from '@/shared/components';
import { spacing } from '@/shared/theme';

const CONFIRM_COPY = {
  archive: {
    title: 'Arsipkan Fund?',
    message:
      'Fund dapat diarsipkan jika saldonya nol dan tidak direferensikan Pocket Item.',
    confirmLabel: 'Arsipkan',
  },
  delete: {
    title: 'Hapus Fund?',
    message:
      'Fund hanya dapat dihapus jika tidak memiliki transaksi dan tidak direferensikan Pocket Item. Tindakan ini tidak dapat dibatalkan.',
    confirmLabel: 'Hapus',
  },
};

export default function FundsScreen() {
  const {
    funds,
    loading,
    saving,
    error,
    refresh,
    clearError,
    createFund,
    updateFund,
    archiveFund,
    unarchiveFund,
    deleteFund,
  } = useFunds();

  const [formVisible, setFormVisible] = useState(false);
  const [editingFund, setEditingFund] = useState(null);
  const [confirmation, setConfirmation] = useState(null);

  useFocusEffect(
    useCallback(() => {
      refresh();
    }, [refresh])
  );

  const handleSubmit = async (input) => {
    const success = editingFund
      ? await updateFund({ fundId: editingFund.id, ...input })
      : await createFund(input);

    if (success) {
      setFormVisible(false);
      setEditingFund(null);
    }
  };

  const handleConfirm = async () => {
    if (!confirmation) {
      return;
    }

    const success =
      confirmation.kind === 'delete'
        ? await deleteFund(confirmation.fund.id)
        : await archiveFund(confirmation.fund.id);

    if (success) {
      setConfirmation(null);
    }
  };

  const handleUnarchive = async (fund) => {
    await unarchiveFund(fund.id);
  };

  const copy = confirmation ? CONFIRM_COPY[confirmation.kind] : null;

  return (
    <Screen
      refreshControl={
        <RefreshControl refreshing={loading} onRefresh={() => refresh({ silent: true })} />
      }
    >
      <PageHeader
        title="Fund"
        subtitle="Active Fund dan Savings/Goal Fund"
        right={
          <AppButton
            title="Buat Fund"
            size="sm"
            fullWidth={false}
            onPress={() => {
              setEditingFund(null);
              setFormVisible(true);
            }}
            disabled={loading}
            style={styles.headerButton}
          />
        }
      />

      <ErrorBanner message={error} onDismiss={clearError} />

      {loading && funds.length === 0 ? (
        <LoadingState message="Memuat daftar Fund..." />
      ) : (
        <FundList
          funds={funds}
          busy={saving}
          onCreate={() => {
            setEditingFund(null);
            setFormVisible(true);
          }}
          onEdit={(fund) => {
            setEditingFund(fund);
            setFormVisible(true);
          }}
          onArchive={(fund) => setConfirmation({ kind: 'archive', fund })}
          onUnarchive={handleUnarchive}
          onDelete={(fund) => setConfirmation({ kind: 'delete', fund })}
        />
      )}

      <FundForm
        key={`${formVisible ? 'open' : 'closed'}-${editingFund?.id ?? 'new'}`}
        visible={formVisible}
        fund={editingFund}
        saving={saving}
        onSubmit={handleSubmit}
        onCancel={() => {
          if (!saving) {
            setFormVisible(false);
            setEditingFund(null);
          }
        }}
      />

      <ConfirmDialog
        visible={Boolean(confirmation)}
        title={copy?.title}
        message={copy?.message}
        confirmLabel={copy?.confirmLabel}
        destructive={confirmation?.kind === 'delete'}
        loading={saving}
        onConfirm={handleConfirm}
        onCancel={() => !saving && setConfirmation(null)}
      />
    </Screen>
  );
}

const styles = StyleSheet.create({
  headerButton: {
    minWidth: 110,
    marginTop: spacing.xxs,
  },
});
