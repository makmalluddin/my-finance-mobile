import { supabase } from '@/data/supabase/client';
import { mapRepositoryError, requireResult, toMoney } from './error-mapper';

/**
 * Akses data Automation. Seluruh mutasi memakai RPC agar template, occurrence,
 * Notification, dan transaksi aktual tetap konsisten di database.
 */
const AUTOMATION_COLUMNS = [
  'id',
  'pocket_item_id',
  'frequency',
  'start_date',
  'next_run_at',
  'timezone',
  'is_active',
  'created_at',
  'updated_at',
  'item:pocket_items!automations_pocket_item_fk(id,name,amount,fund_id,status,pocket_id)',
].join(',');

const OCCURRENCE_COLUMNS = [
  'id',
  'automation_id',
  'pocket_item_id',
  'scheduled_for',
  'status',
  'confirmed_amount',
  'transaction_id',
  'processed_at',
  'created_at',
].join(',');

function mapAutomation(row) {
  if (!row) {
    return null;
  }

  const item = Array.isArray(row.item) ? row.item[0] : row.item;

  return {
    id: row.id,
    pocketItemId: row.pocket_item_id,
    frequency: row.frequency,
    startDate: row.start_date ?? null,
    nextRunAt: row.next_run_at ?? null,
    timezone: row.timezone ?? null,
    isActive: Boolean(row.is_active),
    item: item
      ? {
          id: item.id,
          name: item.name,
          amount: toMoney(item.amount),
          fundId: item.fund_id ?? null,
          status: item.status,
          pocketId: item.pocket_id ?? null,
        }
      : null,
    createdAt: row.created_at ?? null,
    updatedAt: row.updated_at ?? null,
  };
}

function mapOccurrence(row) {
  if (!row) {
    return null;
  }

  return {
    id: row.id,
    automationId: row.automation_id ?? null,
    pocketItemId: row.pocket_item_id,
    scheduledFor: row.scheduled_for ?? null,
    status: row.status,
    confirmedAmount: toMoney(row.confirmed_amount),
    transactionId: row.transaction_id ?? null,
    processedAt: row.processed_at ?? null,
    createdAt: row.created_at ?? null,
  };
}

async function callRpc(name, params, fallbackMessage) {
  const { data, error } = await supabase.rpc(name, params);
  if (error) {
    throw mapRepositoryError(error, fallbackMessage);
  }
  return data;
}

export const automationRepository = {
  async listAutomations() {
    const { data, error } = await supabase
      .from('automations')
      .select(AUTOMATION_COLUMNS)
      .order('created_at', { ascending: false });

    if (error) {
      throw mapRepositoryError(error, 'Gagal memuat daftar Automation.');
    }
    return (data ?? []).map(mapAutomation);
  },

  async listOccurrences({ automationId } = {}) {
    let query = supabase.from('automation_occurrences').select(OCCURRENCE_COLUMNS);
    if (automationId) {
      query = query.eq('automation_id', automationId);
    }

    const { data, error } = await query.order('scheduled_for', { ascending: false });
    if (error) {
      throw mapRepositoryError(error, 'Gagal memuat occurrence Automation.');
    }
    return (data ?? []).map(mapOccurrence);
  },

  createAutomation({ pocketId, name, amount, fundId, frequency, startDate, timezone }) {
    return callRpc(
      'rpc_create_automation',
      {
        p_pocket_id: pocketId,
        p_name: name,
        p_amount: amount,
        p_fund_id: fundId,
        p_frequency: frequency,
        p_start_date: startDate,
        p_timezone: timezone,
      },
      'Gagal membuat Automation.'
    ).then((data) => mapAutomation(requireResult(data)));
  },

  updateAutomation({ automationId, name, amount, fundId, frequency, startDate, timezone }) {
    return callRpc(
      'rpc_update_automation',
      {
        p_automation_id: automationId,
        p_name: name,
        p_amount: amount,
        p_fund_id: fundId,
        p_frequency: frequency,
        p_start_date: startDate,
        p_timezone: timezone,
      },
      'Gagal memperbarui Automation.'
    ).then((data) => mapAutomation(requireResult(data)));
  },

  deleteAutomation(automationId) {
    return callRpc(
      'rpc_delete_automation',
      { p_automation_id: automationId },
      'Gagal menghapus Automation.'
    );
  },

  processDueAutomations() {
    return callRpc('rpc_process_due_automations', {}, 'Gagal memproses jadwal Automation.');
  },

  confirmOccurrence({ occurrenceId, fundId, amount }) {
    return callRpc(
      'rpc_confirm_occurrence',
      {
        p_occurrence_id: occurrenceId,
        p_fund_id: fundId,
        p_amount: amount ?? null,
      },
      'Gagal mengonfirmasi occurrence.'
    ).then((data) => requireResult(data));
  },

  rejectOccurrence(occurrenceId) {
    return callRpc(
      'rpc_reject_occurrence',
      { p_occurrence_id: occurrenceId },
      'Gagal menolak occurrence.'
    );
  },
};

export default automationRepository;
