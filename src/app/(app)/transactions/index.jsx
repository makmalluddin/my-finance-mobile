import { useFocusEffect } from 'expo-router';
import { useCallback, useState } from 'react';
import { RefreshControl, StyleSheet } from 'react-native';
import { useCategories } from '@/modules/categories';
import { useFunds } from '@/modules/funds';
import {
  TransactionForm,
  TransactionList,
  useTransactions,
} from '@/modules/transactions';
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
import { spacing } from '@/shared/theme';

const TYPE_OPTIONS = [
  { label: 'Semua jenis', value: 'all' },
  { label: 'Income', value: 'income' },
  { label: 'Expense', value: 'expense' },
  { label: 'Transfer', value: 'transfer' },
];

const RANGE_OPTIONS = [
  { label: 'Semua waktu', value: 'all' },
  { label: 'Hari ini', value: 'today' },
  { label: '7 hari terakhir', value: '7d' },
  { label: '30 hari terakhir', value: '30d' },
  { label: 'Bulan ini', value: 'thisMonth' },
];

export default function TransactionsScreen() {
  const {
    transactions,
    filters,
    setFilters,
    loading,
    saving,
    error,
    refresh,
    clearError,
    createTransaction,
    updateTransaction,
    deleteTransaction,
  } = useTransactions();
  const {
    funds,
    loading: fundsLoading,
    error: fundsError,
    clearError: clearFundsError,
    refresh: refreshFunds,
  } = useFunds();
  const {
    categories,
    error: categoriesError,
    clearError: clearCategoriesError,
    refresh: refreshCategories,
  } = useCategories();

  const [formVisible, setFormVisible] = useState(false);
  const [editingTransaction, setEditingTransaction] = useState(null);
  const [pendingDelete, setPendingDelete] = useState(null);

  useFocusEffect(
    useCallback(() => {
      refresh();
      refreshFunds();
      refreshCategories();
    }, [refresh, refreshFunds, refreshCategories])
  );

  const openCreateForm = () => {
    setEditingTransaction(null);
    setFormVisible(true);
  };

  const handleSubmit = async (input) => {
    const success = editingTransaction
      ? await updateTransaction({ transactionId: editingTransaction.id, ...input })
      : await createTransaction(input);

    if (success) {
      setFormVisible(false);
      setEditingTransaction(null);
    }
  };

  const handleDelete = async () => {
    if (!pendingDelete) {
      return;
    }
    const success = await deleteTransaction(pendingDelete.id);
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
        title="Transaksi"
        subtitle="Riwayat Income, Expense, dan Transfer"
        right={
          <AppButton
            title="Tambah"
            size="sm"
            fullWidth={false}
            onPress={openCreateForm}
            disabled={fundsLoading || loading}
            style={styles.headerButton}
          />
        }
      />

      <ErrorBanner message={error} onDismiss={clearError} />
      <ErrorBanner message={fundsError} onDismiss={clearFundsError} />
      <ErrorBanner message={categoriesError} onDismiss={clearCategoriesError} />

      <Card style={styles.filterCard}>
        <SelectField
          label="Jenis"
          value={filters.type}
          options={TYPE_OPTIONS}
          onChange={(type) => setFilters((current) => ({ ...current, type }))}
          containerStyle={styles.filterField}
        />
        <SelectField
          label="Periode"
          value={filters.range}
          options={RANGE_OPTIONS}
          onChange={(range) => setFilters((current) => ({ ...current, range }))}
          containerStyle={styles.filterField}
        />
      </Card>

      {loading && transactions.length === 0 ? (
        <LoadingState message="Memuat riwayat transaksi..." />
      ) : transactions.length > 0 ? (
        <TransactionList
          transactions={transactions}
          busy={saving}
          onEdit={(transaction) => {
            setEditingTransaction(transaction);
            setFormVisible(true);
          }}
          onDelete={setPendingDelete}
        />
      ) : (
        <Card>
          <EmptyState
            icon="receipt-outline"
            title="Belum ada transaksi"
            message={
              filters.type === 'all' && filters.range === 'all'
                ? 'Catat Income, Expense, atau Transfer pertama Anda.'
                : 'Tidak ada transaksi untuk filter yang dipilih.'
            }
            action={
              <AppButton
                title="Tambah Transaksi"
                onPress={openCreateForm}
                disabled={fundsLoading}
                style={styles.createButton}
              />
            }
          />
        </Card>
      )}

      <TransactionForm
        key={`${formVisible ? 'open' : 'closed'}-${editingTransaction?.id ?? 'new'}`}
        visible={formVisible}
        transaction={editingTransaction}
        funds={funds}
        categories={categories}
        saving={saving}
        onSubmit={handleSubmit}
        onCancel={() => {
          if (!saving) {
            setFormVisible(false);
            setEditingTransaction(null);
          }
        }}
      />

      <ConfirmDialog
        visible={Boolean(pendingDelete)}
        title="Hapus transaksi?"
        message="Dampak transaksi pada saldo Fund akan dibatalkan. Tindakan ini tidak dapat dibatalkan."
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
    marginTop: spacing.xxs,
  },
  filterCard: {
    marginBottom: spacing.lg,
  },
  filterField: {
    marginBottom: spacing.sm,
  },
  createButton: {
    minWidth: 180,
  },
});
