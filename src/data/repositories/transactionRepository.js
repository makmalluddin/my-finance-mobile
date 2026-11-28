import { supabase } from '@/data/supabase/client';
import { mapRepositoryError, requireResult, toMoney } from './error-mapper';

/**
 * Akses data transaksi. Mutasi selalu lewat RPC agar validasi bentuk, saldo,
 * dan penguncian Fund tetap ditegakkan di database. Riwayat dibaca langsung
 * dari tabel yang dilindungi RLS.
 */
const TRANSACTION_COLUMNS = [
  'id',
  'type',
  'amount',
  'occurred_at',
  'source_fund_id',
  'destination_fund_id',
  'category_id',
  'pocket_item_id',
  'created_at',
  'updated_at',
  'source:funds!transactions_source_fund_fk(name)',
  'destination:funds!transactions_destination_fund_fk(name)',
  'category:categories!transactions_category_id_fkey(name)',
].join(',');

function relatedName(value) {
  return value && typeof value === 'object' ? value.name ?? null : null;
}

export function mapTransaction(row) {
  if (!row) {
    return null;
  }

  return {
    id: row.id,
    type: row.type,
    amount: toMoney(row.amount),
    occurredAt: row.occurred_at,
    sourceFundId: row.source_fund_id ?? null,
    destinationFundId: row.destination_fund_id ?? null,
    categoryId: row.category_id ?? null,
    pocketItemId: row.pocket_item_id ?? null,
    sourceFundName: relatedName(row.source),
    destinationFundName: relatedName(row.destination),
    categoryName: relatedName(row.category),
    createdAt: row.created_at ?? null,
    updatedAt: row.updated_at ?? null,
  };
}

async function callRpc(name, params, fallbackMessage) {
  const { data, error } = await supabase.rpc(name, params);
  if (error) {
    throw mapRepositoryError(error, fallbackMessage);
  }
  return data;
}

export const transactionRepository = {
  async listTransactions({ type, from, to, limit = 200 } = {}) {
    let query = supabase.from('transactions').select(TRANSACTION_COLUMNS);

    if (type) {
      query = query.eq('type', type);
    }
    if (from) {
      query = query.gte('occurred_at', from);
    }
    if (to) {
      query = query.lt('occurred_at', to);
    }

    const { data, error } = await query
      .order('occurred_at', { ascending: false })
      .order('created_at', { ascending: false })
      .limit(limit);

    if (error) {
      throw mapRepositoryError(error, 'Gagal memuat riwayat transaksi.');
    }
    return (data ?? []).map(mapTransaction);
  },

  async createIncome({ amount, occurredAt, destinationFundId, categoryId }) {
    const data = await callRpc(
      'rpc_create_income',
      {
        p_amount: amount,
        p_occurred_at: occurredAt,
        p_destination_fund_id: destinationFundId,
        p_category_id: categoryId,
      },
      'Gagal mencatat Income.'
    );
    return mapTransaction(requireResult(data));
  },

  async createExpense({ amount, occurredAt, sourceFundId, categoryId }) {
    const data = await callRpc(
      'rpc_create_expense',
      {
        p_amount: amount,
        p_occurred_at: occurredAt,
        p_source_fund_id: sourceFundId,
        p_category_id: categoryId,
      },
      'Gagal mencatat Expense.'
    );
    return mapTransaction(requireResult(data));
  },

  async createTransfer({ amount, occurredAt, sourceFundId, destinationFundId }) {
    const data = await callRpc(
      'rpc_create_transfer',
      {
        p_amount: amount,
        p_occurred_at: occurredAt,
        p_source_fund_id: sourceFundId,
        p_destination_fund_id: destinationFundId,
      },
      'Gagal mencatat Transfer.'
    );
    return mapTransaction(requireResult(data));
  },

  async updateTransaction({
    transactionId,
    amount,
    occurredAt,
    sourceFundId,
    destinationFundId,
    categoryId,
  }) {
    const data = await callRpc(
      'rpc_update_standalone_transaction',
      {
        p_transaction_id: transactionId,
        p_amount: amount,
        p_occurred_at: occurredAt,
        p_source_fund_id: sourceFundId ?? null,
        p_destination_fund_id: destinationFundId ?? null,
        p_category_id: categoryId ?? null,
      },
      'Gagal memperbarui transaksi.'
    );
    return mapTransaction(requireResult(data));
  },

  async deleteTransaction(transactionId) {
    await callRpc(
      'rpc_delete_standalone_transaction',
      { p_transaction_id: transactionId },
      'Gagal menghapus transaksi.'
    );
  },
};

export default transactionRepository;
