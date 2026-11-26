import { useFocusEffect, useLocalSearchParams, router } from 'expo-router';
import { useCallback, useState } from 'react';
import Ionicons from '@expo/vector-icons/Ionicons';
import { Pressable, RefreshControl, StyleSheet, Text, View } from 'react-native';
import {
  AutomationForm,
  AutomationSection,
  useAutomation,
} from '@/modules/automation';
import { useFunds } from '@/modules/funds';
import {
  PocketFundDialog,
  PocketItemForm,
  PocketItemList,
  PocketTransactionForm,
  usePockets,
} from '@/modules/pockets';
import {
  AppButton,
  Badge,
  Card,
  ConfirmDialog,
  EmptyState,
  ErrorBanner,
  LoadingState,
  PageHeader,
  Screen,
} from '@/shared/components';
import { colors, radius, spacing, typography } from '@/shared/theme';
import { formatRupiah } from '@/shared/utils/currency';

const ADD_LABEL = {
  income: 'Tambah Income Item',
  expense: 'Tambah Planned Expense',
  transfer: 'Tambah Transfer Item',
};

export default function PocketDetailScreen() {
  const { id } = useLocalSearchParams();
  const pocketId = Array.isArray(id) ? id[0] : id;

  const {
    itemsByPocket,
    summaryByPocket,
    saving,
    loading,
    error,
    refresh,
    clearError,
    getPocket,
    createIncomeItem,
    confirmIncomeItem,
    createPlannedExpenseItem,
    updatePlannedExpenseItem,
    convertPlannedExpense,
    createTransferItem,
    deletePocketItem,
    updatePocketTransaction,
    deletePocketTransaction,
  } = usePockets();
  const {
    funds,
    error: fundsError,
    clearError: clearFundsError,
    refresh: refreshFunds,
  } = useFunds();
  const {
    automations,
    saving: automationSaving,
    error: automationError,
    refresh: refreshAutomations,
    clearError: clearAutomationError,
    createAutomation,
    updateAutomation,
    deleteAutomation,
  } = useAutomation();

  const [itemFormVisible, setItemFormVisible] = useState(false);
  const [editingItem, setEditingItem] = useState(null);
  const [fundAction, setFundAction] = useState(null);
  const [editingTransaction, setEditingTransaction] = useState(null);
  const [pendingDelete, setPendingDelete] = useState(null);
  const [editingAutomation, setEditingAutomation] = useState(null);
  const [pendingAutomationDelete, setPendingAutomationDelete] = useState(null);

  useFocusEffect(
    useCallback(() => {
      refresh();
      refreshAutomations({ silent: true });
      refreshFunds();
    }, [refresh, refreshAutomations, refreshFunds])
  );

  const pocket = getPocket(pocketId);
  const items = itemsByPocket.get(pocketId) ?? [];
  const summary = summaryByPocket.get(pocketId);
  const pocketAutomations = automations.filter(
    (automation) => automation.item?.pocketId === pocketId
  );
  const activeFunds = funds.filter((fund) => fund.fundType === 'active');
  const busy = saving || automationSaving;

  const closeItemForm = () => {
    setItemFormVisible(false);
    setEditingItem(null);
  };

  const handleItemSubmit = async (input) => {
    let success = false;
    if (input.automation) {
      success = await createAutomation({ pocketId, ...input.automation });
    } else if (editingItem) {
      success = await updatePlannedExpenseItem(input);
    } else if (pocket.type === 'income') {
      success = await createIncomeItem(input);
    } else if (pocket.type === 'expense') {
      success = await createPlannedExpenseItem(input);
    } else {
      success = await createTransferItem(input);
    }

    if (success) {
      closeItemForm();
    }
  };

  const handleAutomationSubmit = async (input) => {
    const success = await updateAutomation(input);
    if (success) {
      setEditingAutomation(null);
    }
  };

  const handleAutomationDelete = async () => {
    if (!pendingAutomationDelete) {
      return;
    }
    const success = await deleteAutomation(pendingAutomationDelete.id);
    if (success) {
      setPendingAutomationDelete(null);
    }
  };

  const handleFundAction = async (fundId) => {
    if (!fundAction) {
      return;
    }
    const success =
      fundAction.mode === 'confirm'
        ? await confirmIncomeItem({ itemId: fundAction.item.id, destinationFundId: fundId })
        : await convertPlannedExpense({ itemId: fundAction.item.id, sourceFundId: fundId });

    if (success) {
      setFundAction(null);
    }
  };

  const handleTransactionSubmit = async (input) => {
    const success = await updatePocketTransaction(input);
    if (success) {
      setEditingTransaction(null);
    }
  };

  const handleDelete = async () => {
    if (!pendingDelete) {
      return;
    }
    const success =
      pendingDelete.kind === 'item'
        ? await deletePocketItem(pendingDelete.item.id)
        : await deletePocketTransaction(pendingDelete.item.transaction.id);

    if (success) {
      setPendingDelete(null);
    }
  };

  if (loading && !pocket) {
    return <Screen><LoadingState message="Memuat Pocket..." /></Screen>;
  }

  if (!pocket) {
    return (
      <Screen>
        <PageHeader title="Pocket" subtitle="Pocket tidak ditemukan" />
        <Card>
          <EmptyState
            icon="alert-circle-outline"
            title="Pocket tidak ditemukan"
            message="Pocket mungkin sudah dihapus atau bukan milik akun ini."
            action={<AppButton title="Kembali" onPress={() => router.back()} />}
          />
        </Card>
      </Screen>
    );
  }

  return (
    <Screen
      refreshControl={
        <RefreshControl
          refreshing={loading}
          onRefresh={() => {
            refresh({ silent: true });
            refreshAutomations({ silent: true });
            refreshFunds({ silent: true });
          }}
        />
      }
    >
      <View style={styles.header}>
        <Pressable
          onPress={() => router.back()}
          accessibilityRole="button"
          accessibilityLabel="Kembali ke daftar Pocket"
          style={styles.backButton}
          hitSlop={8}
        >
          <Ionicons name="arrow-back" size={22} color={colors.text} />
        </Pressable>
        <View style={styles.headerTitle}>
          <Text style={styles.headerName} numberOfLines={1}>
            {pocket.name}
          </Text>
          <Badge
            label={pocket.isArchived ? 'Diarsipkan' : pocket.type}
            tone={pocket.isArchived ? 'neutral' : pocket.type}
          />
        </View>
        {!pocket.isArchived ? (
          <AppButton
            title="Tambah"
            size="sm"
            fullWidth={false}
            onPress={() => {
              setEditingItem(null);
              setItemFormVisible(true);
            }}
            disabled={busy}
            style={styles.headerButton}
          />
        ) : null}
      </View>

      <ErrorBanner message={error} onDismiss={clearError} />
      <ErrorBanner message={automationError} onDismiss={clearAutomationError} />
      <ErrorBanner message={fundsError} onDismiss={clearFundsError} />

      <Card style={styles.infoCard}>
        <View style={styles.infoHead}>
          <View style={[styles.infoIcon, styles.infoIconExpense]}>
            <Ionicons name="wallet-outline" size={18} color={colors.danger} />
          </View>
          <View style={styles.infoIdentity}>
            <Text style={styles.infoTitle}>Info Pocket</Text>
            <Text style={styles.infoType}>{pocket.type}</Text>
          </View>
        </View>
        {pocket.description ? (
          <Text style={styles.infoDescription}>{pocket.description}</Text>
        ) : null}
        {pocket.type === 'transfer' && summary ? (
          <View style={styles.summaryRow}>
            <Text style={styles.summaryText}>Masuk {formatRupiah(summary.incoming)}</Text>
            <Text style={styles.summaryText}>Keluar {formatRupiah(summary.outgoing)}</Text>
            <Text style={styles.summaryText}>Bersih {formatRupiah(summary.net)}</Text>
          </View>
        ) : null}
        {pocket.isArchived ? (
          <Text style={styles.archivedNote}>
            Pocket diarsipkan. Item lama tetap dapat diproses, tetapi item baru tidak bisa ditambahkan.
          </Text>
        ) : null}
      </Card>

      <AutomationSection
        automations={pocketAutomations}
        busy={busy}
        onEdit={(automation) => setEditingAutomation(automation)}
        onDelete={(automation) => setPendingAutomationDelete(automation)}
      />

      <Text style={styles.sectionTitle}>Item Pocket</Text>

      {items.length > 0 ? (
        <PocketItemList
          items={items}
          funds={funds}
          busy={saving}
          actions={{
            onConfirm: (item) => setFundAction({ mode: 'confirm', item }),
            onEditItem: (item) => {
              setEditingItem(item);
              setItemFormVisible(true);
            },
            onConvert: (item) => setFundAction({ mode: 'convert', item }),
            onDeleteItem: (item) => setPendingDelete({ kind: 'item', item }),
            onEditTransaction: (item) => setEditingTransaction(item),
            onDeleteTransaction: (item) => setPendingDelete({ kind: 'transaction', item }),
          }}
        />
      ) : (
        <Card>
          <EmptyState
            icon="receipt-outline"
            title="Belum ada item"
            message={ADD_LABEL[pocket.type] ?? 'Tambah item pertama Pocket ini.'}
            action={
              !pocket.isArchived ? (
                <AppButton
                  title={ADD_LABEL[pocket.type] ?? 'Tambah Item'}
                  onPress={() => {
                    setEditingItem(null);
                    setItemFormVisible(true);
                  }}
                  disabled={busy}
                />
              ) : null
            }
          />
        </Card>
      )}

      <PocketItemForm
        key={itemFormVisible ? `item-form-${editingItem?.id ?? 'new'}` : 'item-form-closed'}
        visible={itemFormVisible}
        pocket={pocket}
        item={editingItem}
        funds={funds}
        saving={busy}
        onSubmit={handleItemSubmit}
        onCancel={closeItemForm}
      />

      <AutomationForm
        key={editingAutomation ? `automation-form-${editingAutomation.id}-open` : 'automation-form-closed'}
        visible={Boolean(editingAutomation)}
        automation={editingAutomation}
        pocketType={pocket.type}
        funds={funds}
        saving={busy}
        onSubmit={handleAutomationSubmit}
        onCancel={() => !busy && setEditingAutomation(null)}
      />

      <PocketFundDialog
        key={fundAction ? `fund-dialog-${fundAction.mode}-${fundAction.item.id}` : 'fund-dialog-closed'}
        visible={Boolean(fundAction)}
        title={fundAction?.mode === 'confirm' ? 'Konfirmasi Income' : 'Konversi Planned Expense'}
        message={
          fundAction?.mode === 'confirm'
            ? `Pilih Fund tujuan untuk item "${fundAction?.item.name ?? ''}".`
            : `Pilih Active Fund sumber untuk item "${fundAction?.item.name ?? ''}". Nominal mengikuti item.`
        }
        funds={fundAction?.mode === 'confirm' ? funds : activeFunds}
        confirmLabel={fundAction?.mode === 'confirm' ? 'Konfirmasi' : 'Konversi'}
        saving={busy}
        onSubmit={handleFundAction}
        onCancel={() => !busy && setFundAction(null)}
      />

      <PocketTransactionForm
        key={editingTransaction ? `transaction-form-${editingTransaction.id}` : 'transaction-form-closed'}
        visible={Boolean(editingTransaction)}
        transaction={editingTransaction?.transaction}
        amountLocked={Boolean(
          editingTransaction?.status === 'converted' &&
            editingTransaction?.transaction?.type === 'expense'
        )}
        funds={funds}
        saving={busy}
        onSubmit={handleTransactionSubmit}
        onCancel={() => !busy && setEditingTransaction(null)}
      />

      <ConfirmDialog
        visible={Boolean(pendingAutomationDelete)}
        title="Hapus Automation?"
        message="Template, occurrence, dan Notification pending akan dihapus. Transaksi yang sudah dikonfirmasi tetap dipertahankan."
        confirmLabel="Hapus"
        destructive
        loading={busy}
        onConfirm={handleAutomationDelete}
        onCancel={() => !busy && setPendingAutomationDelete(null)}
      />

      <ConfirmDialog
        visible={Boolean(pendingDelete)}
        title={pendingDelete?.kind === 'item' ? 'Hapus item Pocket?' : 'Hapus transaksi Pocket?'}
        message={
          pendingDelete?.kind === 'item'
            ? 'Item akan dihapus. Jika item unpaid Planned Expense, alokasinya akan dilepaskan.'
            : 'Dampak transaksi pada saldo Fund akan dibatalkan dan item kembali ke status sebelumnya.'
        }
        confirmLabel="Hapus"
        destructive
        loading={busy}
        onConfirm={handleDelete}
        onCancel={() => !busy && setPendingDelete(null)}
      />
    </Screen>
  );
}

const styles = StyleSheet.create({
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: spacing.xl,
  },
  backButton: {
    width: 44,
    height: 44,
    borderRadius: radius.button,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitle: {
    flex: 1,
    marginLeft: spacing.sm,
  },
  headerName: {
    ...typography.detailTitle,
    color: colors.text,
  },
  headerButton: {
    minWidth: 97,
    paddingHorizontal: spacing.md,
  },
  infoCard: {
    marginBottom: spacing.lg,
  },
  infoHead: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  infoIcon: {
    width: 37,
    height: 37,
    borderRadius: radius.button,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: spacing.md,
  },
  infoIconExpense: {
    backgroundColor: colors.dangerSoft,
  },
  infoIdentity: {
    flex: 1,
  },
  infoTitle: {
    ...typography.subheading,
    color: colors.text,
  },
  infoType: {
    ...typography.body,
    color: colors.textMuted,
    marginTop: spacing.xxs,
  },
  infoDescription: {
    ...typography.caption,
    color: colors.textMuted,
    marginTop: spacing.md,
  },
  summaryRow: {
    marginTop: spacing.md,
    paddingTop: spacing.sm,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: colors.border,
  },
  summaryText: {
    ...typography.caption,
    color: colors.textMuted,
    marginBottom: spacing.xxs,
  },
  archivedNote: {
    ...typography.caption,
    color: colors.warning,
    marginTop: spacing.sm,
  },
  sectionTitle: {
    ...typography.heading,
    color: colors.text,
    marginBottom: spacing.sm,
  },
});
