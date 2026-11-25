import { notificationRepository } from '@/data/repositories/notificationRepository';

/**
 * Notification Service hanya membaca dan mengarahkan aksi. Tidak ada mutasi
 * notifikasi langsung: confirm/reject dijalankan Automation Service dan RPC
 * backend yang menghapus notifikasi terkait secara atomik.
 */
export const notificationService = {
  listPendingNotifications() {
    return notificationRepository.listPendingNotifications();
  },
};

export default notificationService;
