import { AppError, toAppError } from '@/shared/utils/errors';

/**
 * Pemetaan error backend → AppError untuk seluruh repository.
 *
 * Error bisnis RPC sudah membawa kode stabil pada `message` dan detail JSON
 * pada `details`. Kode SQLSTATE generik dan pesan jaringan ditangani oleh
 * `toAppError` di shared utils.
 */
export function mapRepositoryError(error, fallbackMessage) {
  return toAppError(error, fallbackMessage);
}

/**
 * Memastikan RPC mengembalikan data. Beberapa RPC void (misalnya delete Fund)
 * secara sah mengembalikan `null`, sehingga pemeriksaan ini hanya dipakai
 * untuk RPC yang seharusnya mengembalikan record.
 */
export function requireResult(data, code = 'DATABASE_ERROR', message) {
  if (data === undefined) {
    throw new AppError(code, message);
  }
  return data;
}

/**
 * PostgREST mengembalikan `numeric` sebagai string. Mengubahnya di repository
 * menjaga AppService tetap berada dalam domain aplikasi.
 */
export function toMoney(value) {
  if (value === null || value === undefined || value === '') {
    return 0;
  }
  const numeric = Number(value);
  return Number.isFinite(numeric) ? numeric : 0;
}
