import { useFocusEffect, router } from 'expo-router';
import { useCallback, useState } from 'react';
import { RefreshControl, StyleSheet, Text, View } from 'react-native';
import {
  PocketCard,
  PocketForm,
  usePockets,
} from '@/modules/pockets';
import {
  AppButton,
  Card,
  ConfirmDialog,
  EmptyState,
  ErrorBanner,
  LoadingState,
  PageHeader,
  Screen,
  SelectField,
} from '@/shared/components';
import { colors, spacing, typography } from '@/shared/theme';
import { formatRupiah } from '@/shared/utils/currency';

const FILTER_OPTIONS = [
  { label: 'Semua Pocket', value: 'all' },
  { label: 'Income', value: 'income' },
  { label: 'Expense', value: 'expense' },
  { label: 'Transfer', value: 'transfer' },
];

export default function PocketsScreen() {
  const {
    pockets,
    itemsByPocket,
    summaryByPocket,
    allocation,
    loading,
    saving,
    error,
    refresh,
    clearError,
    createPocket,
    updatePocket,
    archivePocket,
    unarchivePocket,
    deletePocket,
  } = usePockets();

  const [filter, setFilter] = useState('all');
  const [formVisible, setFormVisible] = useState(false);
  const [editingPocket, setEditingPocket] = useState(null);
  const [pendingDelete, setPendingDelete] = useState(null);

  useFocusEffect(
    useCallback(() => {
      refresh();
    }, [refresh])
  );

  const visiblePockets =
    filter === 'all' ? pockets : pockets.filter((pocket) => pocket.type === filter);

  const openCreateForm = () => {
    setEditingPocket(null);
    setFormVisible(true);
  };

  const handleSubmit = async (input) => {
    const success = editingPocket
      ? await updatePocket({ pocketId: editingPocket.id, ...input })
      : await createPocket(input);

    if (success) {
      setFormVisible(false);
      setEditingPocket(null);
    }
  };

  const handleDelete = async () => {
    if (!pendingDelete) {
      return;
    }
    const success = await deletePocket(pendingDelete.id);
    if (success) {
      setPendingDelete(null);
    }
  };

  return (
    <Screen
      refreshControl={
        <RefreshControl refreshing={loading} onRefresh={() => refresh({ silent: true })} />
      }
    >
      <PageHeader
        title="Pocket"
        subtitle="Kelola rencana dan alokasi dana"
        right={
          <AppButton
            title="Tambah"
            size="sm"
            fullWidth={false}
            onPress={openCreateForm}
            disabled={loading}
            style={styles.headerButton}
          />
        }
      />

      <ErrorBanner message={error} onDismiss={clearError} />

      <Card style={styles.allocationCard}>
        <Text style={styles.allocationLabel}>Alokasi Planned Expense</Text>
        <Text style={styles.allocationValue}>{formatRupiah(allocation)}</Text>
        <Text style={styles.allocationHint}>
          Nominal ini sudah mengurangi Active Balance di Dashboard.
        </Text>
      </Card>

      <SelectField
        label="Filter Pocket"
        value={filter}
        options={FILTER_OPTIONS}
        onChange={setFilter}
        containerStyle={styles.filter}
      />

      {loading && pockets.length === 0 ? (
        <LoadingState message="Memuat Pocket..." />
      ) : visiblePockets.length > 0 ? (
        <View>
          {visiblePockets.map((pocket) => (
            <PocketCard
              key={pocket.id}
              pocket={pocket}
              itemCount={(itemsByPocket.get(pocket.id) ?? []).length}
              summary={summaryByPocket.get(pocket.id)}
              busy={saving}
              onPress={(nextPocket) => router.push(`/pockets/${nextPocket.id}`)}
              onEdit={(nextPocket) => {
                setEditingPocket(nextPocket);
                setFormVisible(true);
              }}
              onArchive={(nextPocket) => archivePocket(nextPocket.id)}
              onUnarchive={(nextPocket) => unarchivePocket(nextPocket.id)}
              onDelete={setPendingDelete}
            />
          ))}
        </View>
      ) : (
        <Card>
          <EmptyState
            icon="albums-outline"
            title={filter === 'all' ? 'Belum ada Pocket' : 'Tidak ada Pocket pada filter ini'}
            message="Buat Pocket Income, Expense, atau Transfer untuk mengelompokkan aktivitas keuangan."
            action={
              <AppButton
                title="Buat Pocket"
                onPress={openCreateForm}
                style={styles.createButton}
              />
            }
          />
        </Card>
      )}

      <PocketForm
        key={formVisible ? `pocket-form-${editingPocket?.id ?? 'new'}` : 'pocket-form-closed'}
        visible={formVisible}
        pocket={editingPocket}
        saving={saving}
        onSubmit={handleSubmit}
        onCancel={() => {
          if (!saving) {
            setFormVisible(false);
            setEditingPocket(null);
          }
        }}
      />

      <ConfirmDialog
        visible={Boolean(pendingDelete)}
        title="Hapus Pocket?"
        message="Pocket dan seluruh item-nya akan dihapus permanen. Transaksi aktual tetap tersimpan sebagai transaksi standalone."
        confirmLabel="Hapus"
        destructive
        loading={saving}
        onConfirm={handleDelete}
        onCancel={() => !saving && setPendingDelete(null)}
      />
    </Screen>
  );
}

const styles = StyleSheet.create({
  headerButton: {
    minWidth: 90,
  },
  allocationCard: {
    marginBottom: spacing.lg,
  },
  allocationLabel: {
    ...typography.caption,
    color: colors.textMuted,
  },
  allocationValue: {
    ...typography.heading,
    color: colors.text,
    marginTop: spacing.xxs,
  },
  allocationHint: {
    ...typography.caption,
    color: colors.textSubtle,
    marginTop: spacing.xxs,
  },
  filter: {
    marginBottom: spacing.lg,
  },
  createButton: {
    minWidth: 160,
  },
});
