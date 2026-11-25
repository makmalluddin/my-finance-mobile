import { supabase } from '@/data/supabase/client';
import { mapRepositoryError, toMoney } from './error-mapper';

/**
 * Notifikasi berasal dari view `v_pending_notifications` melalui RPC
 * `rpc_get_pending_notifications`. Penghapusan notifikasi bukan operasi
 * tersendiri, melainkan bagian dari RPC confirm/reject/delete.
 */
function mapNotification(row) {
  return {
    id: row.id,
    occurrenceId: row.occurrence_id,
    automationId: row.automation_id ?? null,
    pocketId: row.pocket_id,
    pocketName: row.pocket_name,
    pocketType: row.pocket_type,
    pocketItemId: row.pocket_item_id,
    itemName: row.item_name,
    templateAmount: toMoney(row.template_amount),
    defaultFundId: row.default_fund_id ?? null,
    scheduledFor: row.scheduled_for ?? null,
    createdAt: row.created_at ?? null,
  };
}

export const notificationRepository = {
  async listPendingNotifications() {
    const { data, error } = await supabase.rpc('rpc_get_pending_notifications');
    if (error) {
      throw mapRepositoryError(error, 'Gagal memuat notifikasi.');
    }
    return (data ?? []).map(mapNotification);
  },
};

export default notificationRepository;
