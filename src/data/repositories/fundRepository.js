import { supabase } from '@/data/supabase/client';
import { mapRepositoryError, requireResult, toMoney } from './error-mapper';

/**
 * Akses data Fund. Seluruh mutasi memakai RPC agar aturan kepemilikan,
 * pengarsipan, dan integritas saldo tetap ditegakkan di database.
 */

function mapFund(row) {
  if (!row) {
    return null;
  }

  return {
    id: row.id,
    name: row.name,
    fundType: row.fund_type,
    isArchived: Boolean(row.is_archived),
    openingBalance: toMoney(row.opening_balance),
    ...(row.balance === undefined ? {} : { balance: toMoney(row.balance) }),
    ...(row.created_at ? { createdAt: row.created_at } : {}),
    ...(row.updated_at ? { updatedAt: row.updated_at } : {}),
  };
}

async function callRpc(name, params, fallbackMessage) {
  const { data, error } = await supabase.rpc(name, params);
  if (error) {
    throw mapRepositoryError(error, fallbackMessage);
  }
  return data;
}

export const fundRepository = {
  async listFunds({ includeArchived = false } = {}) {
    const data = await callRpc(
      'rpc_get_fund_balances',
      { p_include_archived: includeArchived },
      'Gagal memuat daftar Fund.'
    );
    return (data ?? []).map(mapFund);
  },

  async createFund({ name, openingBalance, fundType }) {
    const data = await callRpc(
      'rpc_create_fund',
      { p_name: name, p_opening_balance: openingBalance, p_fund_type: fundType },
      'Gagal membuat Fund.'
    );
    return mapFund(requireResult(data));
  },

  async updateFund({ fundId, name, fundType }) {
    const data = await callRpc(
      'rpc_update_fund',
      { p_fund_id: fundId, p_name: name, p_fund_type: fundType },
      'Gagal memperbarui Fund.'
    );
    return mapFund(requireResult(data));
  },

  async archiveFund(fundId) {
    const data = await callRpc(
      'rpc_archive_fund',
      { p_fund_id: fundId },
      'Gagal mengarsipkan Fund.'
    );
    return mapFund(requireResult(data));
  },

  async unarchiveFund(fundId) {
    const data = await callRpc(
      'rpc_unarchive_fund',
      { p_fund_id: fundId },
      'Gagal mengaktifkan kembali Fund.'
    );
    return mapFund(requireResult(data));
  },

  async deleteFund(fundId) {
    await callRpc('rpc_delete_fund', { p_fund_id: fundId }, 'Gagal menghapus Fund.');
  },
};

export default fundRepository;
