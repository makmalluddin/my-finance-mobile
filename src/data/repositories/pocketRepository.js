import { supabase } from '@/data/supabase/client';
import { mapRepositoryError, requireResult, toMoney } from './error-mapper';
import { mapTransaction } from './transactionRepository';

/**
 * Akses data Pocket. Mutasi selalu lewat RPC agar status item, alokasi Planned
 * Expense, dan dampak saldo transaksi tetap ditegakkan di database.
 */
const POCKET_COLUMNS = [
  'id',
  'name',
  'description',
  'type',
  'is_archived',
  'has_ever_had_item',
  'created_at',
  'updated_at',
].join(',');

const ITEM_COLUMNS = [
  'id',
  'pocket_id',
  'name',
  'amount',
  'fund_id',
  'status',
  'created_at',
  'updated_at',
  'transaction:transactions!transactions_pocket_item_fk(' +
    'id,type,amount,occurred_at,source_fund_id,destination_fund_id,category_id,' +
    'pocket_item_id,created_at,updated_at,' +
    'source:funds!transactions_source_fund_fk(name),' +
    'destination:funds!transactions_destination_fund_fk(name),' +
    'category:categories!transactions_category_id_fkey(name)' +
    ')',
].join(',');

function mapPocket(row) {
  if (!row) {
    return null;
  }

  return {
    id: row.id,
    name: row.name,
    description: row.description ?? null,
    type: row.type,
    isArchived: Boolean(row.is_archived),
    hasEverHadItem: Boolean(row.has_ever_had_item),
    createdAt: row.created_at ?? null,
    updatedAt: row.updated_at ?? null,
  };
}

function mapItem(row) {
  if (!row) {
    return null;
  }

  // Relasi ke transaksi bersifat satu-ke-banyak; satu item hanya memiliki satu
  // transaksi aktual, jadi PostgREST selalu mengembalikan array 0 atau 1 baris.
  const related = Array.isArray(row.transaction) ? row.transaction[0] : row.transaction;

  return {
    id: row.id,
    pocketId: row.pocket_id,
    name: row.name,
    amount: toMoney(row.amount),
    fundId: row.fund_id ?? null,
    status: row.status,
    transaction: mapTransaction(related),
    createdAt: row.created_at ?? null,
    updatedAt: row.updated_at ?? null,
  };
}

function mapSummary(row) {
  return {
    pocketId: row.pocket_id,
    incoming: toMoney(row.incoming),
    outgoing: toMoney(row.outgoing),
    net: toMoney(row.net),
    itemCount: Number(row.item_count ?? 0),
  };
}

async function callRpc(name, params, fallbackMessage) {
  const { data, error } = await supabase.rpc(name, params);
  if (error) {
    throw mapRepositoryError(error, fallbackMessage);
  }
  return data;
}

export const pocketRepository = {
  async listPockets() {
    const { data, error } = await supabase
      .from('pockets')
      .select(POCKET_COLUMNS)
      .order('created_at', { ascending: false });

    if (error) {
      throw mapRepositoryError(error, 'Gagal memuat daftar Pocket.');
    }
    return (data ?? []).map(mapPocket);
  },

  async listPocketItems({ pocketId } = {}) {
    let query = supabase.from('pocket_items').select(ITEM_COLUMNS);
    if (pocketId) {
      query = query.eq('pocket_id', pocketId);
    }

    const { data, error } = await query.order('created_at', { ascending: false });
    if (error) {
      throw mapRepositoryError(error, 'Gagal memuat item Pocket.');
    }
    return (data ?? []).map(mapItem);
  },

  async listTransferSummaries() {
    const { data, error } = await supabase
      .from('v_pocket_transfer_summary')
      .select('pocket_id,incoming,outgoing,net,item_count');

    if (error) {
      throw mapRepositoryError(error, 'Gagal memuat ringkasan Transfer Pocket.');
    }
    return (data ?? []).map(mapSummary);
  },

  async getOutstandingAllocation() {
    const { data, error } = await supabase
      .from('v_outstanding_expense_allocation')
      .select('total')
      .limit(1);

    if (error) {
      throw mapRepositoryError(error, 'Gagal memuat alokasi Planned Expense.');
    }
    return toMoney(data?.[0]?.total);
  },

  createPocket({ name, description, type }) {
    return callRpc(
      'rpc_create_pocket',
      { p_name: name, p_description: description ?? null, p_type: type },
      'Gagal membuat Pocket.'
    ).then((data) => mapPocket(requireResult(data)));
  },

  updatePocket({ pocketId, name, description, type }) {
    return callRpc(
      'rpc_update_pocket',
      {
        p_pocket_id: pocketId,
        p_name: name,
        p_description: description ?? null,
        p_type: type,
      },
      'Gagal memperbarui Pocket.'
    ).then((data) => mapPocket(requireResult(data)));
  },

  archivePocket(pocketId) {
    return callRpc('rpc_archive_pocket', { p_pocket_id: pocketId }, 'Gagal mengarsipkan Pocket.').then(
      (data) => mapPocket(requireResult(data))
    );
  },

  unarchivePocket(pocketId) {
    return callRpc(
      'rpc_unarchive_pocket',
      { p_pocket_id: pocketId },
      'Gagal mengaktifkan Pocket.'
    ).then((data) => mapPocket(requireResult(data)));
  },

  async deletePocket(pocketId) {
    await callRpc('rpc_delete_pocket', { p_pocket_id: pocketId }, 'Gagal menghapus Pocket.');
  },

  createIncomeItem({ pocketId, name, amount }) {
    return callRpc(
      'rpc_create_income_item',
      { p_pocket_id: pocketId, p_name: name, p_amount: amount },
      'Gagal menambah Income Item.'
    ).then((data) => mapItem(requireResult(data)));
  },

  confirmIncomeItem({ itemId, destinationFundId }) {
    return callRpc(
      'rpc_confirm_income_item',
      { p_item_id: itemId, p_destination_fund_id: destinationFundId },
      'Gagal mengonfirmasi Income Item.'
    ).then((data) => mapTransaction(requireResult(data)));
  },

  createPlannedExpenseItem({ pocketId, name, amount }) {
    return callRpc(
      'rpc_create_planned_expense_item',
      { p_pocket_id: pocketId, p_name: name, p_amount: amount },
      'Gagal menambah Planned Expense.'
    ).then((data) => mapItem(requireResult(data)));
  },

  updatePlannedExpenseItem({ itemId, name, amount }) {
    return callRpc(
      'rpc_update_planned_expense_item',
      { p_item_id: itemId, p_name: name, p_amount: amount },
      'Gagal memperbarui Planned Expense.'
    ).then((data) => mapItem(requireResult(data)));
  },

  convertPlannedExpense({ itemId, sourceFundId }) {
    return callRpc(
      'rpc_convert_planned_expense',
      { p_item_id: itemId, p_source_fund_id: sourceFundId },
      'Gagal mengonversi Planned Expense.'
    ).then((data) => mapTransaction(requireResult(data)));
  },

  createTransferItem({ pocketId, name, amount, sourceFundId, destinationFundId, occurredAt }) {
    return callRpc(
      'rpc_create_transfer_item',
      {
        p_pocket_id: pocketId,
        p_name: name,
        p_amount: amount,
        p_source_fund_id: sourceFundId,
        p_destination_fund_id: destinationFundId,
        p_occurred_at: occurredAt,
      },
      'Gagal menambah Transfer Item.'
    ).then((data) => mapItem(requireResult(data)));
  },

  async deletePocketItem(itemId) {
    await callRpc('rpc_delete_pocket_item', { p_item_id: itemId }, 'Gagal menghapus item Pocket.');
  },

  updatePocketTransaction({
    transactionId,
    amount,
    occurredAt,
    sourceFundId,
    destinationFundId,
  }) {
    return callRpc(
      'rpc_update_pocket_transaction',
      {
        p_transaction_id: transactionId,
        p_amount: amount,
        p_occurred_at: occurredAt,
        p_source_fund_id: sourceFundId ?? null,
        p_destination_fund_id: destinationFundId ?? null,
      },
      'Gagal memperbarui transaksi Pocket.'
    ).then((data) => mapTransaction(requireResult(data)));
  },

  async deletePocketTransaction(transactionId) {
    await callRpc(
      'rpc_delete_pocket_transaction',
      { p_transaction_id: transactionId },
      'Gagal menghapus transaksi Pocket.'
    );
  },
};

export default pocketRepository;
