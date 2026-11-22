/**
 * Pemetaan kode error backend ke pesan Bahasa Indonesia.
 * Sumber kebenaran kode: `docs/backend-contract.md` bagian 3.
 */
export const ERROR_MESSAGES = {
  UNAUTHENTICATED: 'Sesi Anda berakhir. Silakan masuk kembali.',
  INVALID_EMAIL: 'Alamat email tidak valid.',
  INVALID_PASSWORD: 'Kata sandi wajib diisi.',
  WEAK_PASSWORD: 'Kata sandi minimal 6 karakter.',
  INVALID_CREDENTIALS: 'Email atau kata sandi salah.',
  EMAIL_NOT_CONFIRMED: 'Email belum dikonfirmasi. Periksa kotak masuk Anda.',
  EMAIL_ALREADY_REGISTERED: 'Email ini sudah terdaftar. Silakan masuk.',
  TOO_MANY_REQUESTS: 'Terlalu banyak percobaan. Coba lagi beberapa saat.',
  AUTH_ERROR: 'Gagal memproses akun. Coba lagi.',
  VALIDATION_ERROR: 'Data yang dimasukkan tidak valid.',
  INVALID_AMOUNT: 'Nominal harus lebih besar dari nol.',
  INVALID_DATE: 'Tanggal tidak valid.',
  INVALID_FUND_TYPE: 'Klasifikasi Fund tidak valid.',
  INVALID_POCKET_TYPE: 'Tipe Pocket tidak valid.',
  INVALID_FREQUENCY: 'Frekuensi Automation tidak valid.',
  FUND_NOT_FOUND: 'Fund tidak ditemukan.',
  FUND_ARCHIVED: 'Fund sudah diarsipkan dan tidak dapat digunakan.',
  SOURCE_FUND_NOT_ACTIVE:
    'Pengeluaran hanya dapat menggunakan Active Fund. Pindahkan dana ke Active Fund terlebih dahulu.',
  SAME_FUND_TRANSFER: 'Fund sumber dan tujuan harus berbeda.',
  INSUFFICIENT_BALANCE: 'Saldo Fund tidak mencukupi.',
  FUND_BALANCE_NEGATIVE: 'Perubahan ini membuat saldo Fund menjadi negatif.',
  FUND_BALANCE_NOT_ZERO: 'Fund masih memiliki saldo dan tidak dapat diarsipkan.',
  FUND_HAS_TRANSACTIONS: 'Fund memiliki transaksi dan tidak dapat dihapus.',
  FUND_REFERENCED_BY_POCKET: 'Fund masih terhubung dengan Pocket Item.',
  OPENING_BALANCE_IMMUTABLE: 'Opening Balance tidak dapat diubah.',
  CATEGORY_REQUIRED: 'Category wajib dipilih.',
  CATEGORY_FORBIDDEN: 'Category tidak digunakan untuk transaksi ini.',
  CATEGORY_TYPE_MISMATCH: 'Category tidak sesuai dengan jenis transaksi.',
  CATEGORY_NOT_FOUND: 'Category tidak ditemukan.',
  POCKET_NOT_FOUND: 'Pocket tidak ditemukan.',
  POCKET_ARCHIVED: 'Pocket sudah diarsipkan.',
  POCKET_TYPE_IMMUTABLE: 'Tipe Pocket tidak dapat diubah setelah memiliki item.',
  POCKET_TYPE_MISMATCH: 'Item tidak sesuai dengan tipe Pocket.',
  POCKET_ITEM_NOT_FOUND: 'Item Pocket tidak ditemukan.',
  POCKET_ITEM_STATUS_INVALID: 'Tindakan tidak tersedia untuk status item saat ini.',
  POCKET_ITEM_NOT_PLANNED: 'Hanya Planned Expense yang dapat diproses.',
  TRANSACTION_NOT_FOUND: 'Transaksi tidak ditemukan.',
  TRANSACTION_TYPE_IMMUTABLE: 'Jenis transaksi tidak dapat diubah.',
  TRANSACTION_PROTECTED:
    'Transaksi ini berasal dari Automation dan tidak dapat dihapus.',
  TRANSACTION_MANAGED_BY_POCKET:
    'Transaksi ini dikelola melalui halaman Pocket.',
  AMOUNT_IMMUTABLE: 'Nominal transaksi hasil konversi tidak dapat diubah.',
  AUTOMATION_NOT_FOUND: 'Automation tidak ditemukan.',
  AUTOMATION_TYPE_UNSUPPORTED: 'Automation tidak tersedia untuk Pocket Transfer.',
  OCCURRENCE_NOT_FOUND: 'Occurrence tidak ditemukan.',
  OCCURRENCE_ALREADY_PROCESSED: 'Occurrence ini sudah diproses.',
  AMOUNT_NOT_ALLOWED:
    'Nominal Income mengikuti template dan tidak dapat diubah.',
  NOT_FOUND: 'Data tidak ditemukan.',
  CONFLICT: 'Data sudah ada.',
  DATABASE_ERROR: 'Terjadi kesalahan pada server. Coba lagi.',
  NETWORK_ERROR: 'Tidak dapat terhubung ke server. Periksa koneksi Anda.',
  UNKNOWN_ERROR: 'Terjadi kesalahan yang tidak terduga. Coba lagi.',
};

const NETWORK_ERROR_PATTERN = /network request failed|failed to fetch|network error/i;

const AUTH_ERROR_PATTERNS = [
  [/invalid login credentials|invalid email or password|bad credentials/i, 'INVALID_CREDENTIALS'],
  [/email not confirmed/i, 'EMAIL_NOT_CONFIRMED'],
  [/user already registered|email address is already in use/i, 'EMAIL_ALREADY_REGISTERED'],
  [/password should be at least/i, 'WEAK_PASSWORD'],
  [/unable to validate email|invalid email format/i, 'INVALID_EMAIL'],
  [/too many requests|email rate limit exceeded/i, 'TOO_MANY_REQUESTS'],
];

/**
 * Error aplikasi dengan kode stabil dan konteks tambahan dari backend.
 */
export class AppError extends Error {
  constructor(code, message, options = {}) {
    super(message || getErrorMessage(code));
    this.name = 'AppError';
    this.code = code || 'UNKNOWN_ERROR';
    this.details = options.details ?? null;
    this.cause = options.cause ?? null;
  }
}

export function getErrorMessage(code) {
  if (!code) {
    return ERROR_MESSAGES.UNKNOWN_ERROR;
  }
  return ERROR_MESSAGES[code] || ERROR_MESSAGES.UNKNOWN_ERROR;
}

/**
 * Mengambil kode error dari berbagai bentuk error Supabase/PostgREST.
 *
 * - Error bisnis: `message` berisi kode (mis. `INSUFFICIENT_BALANCE`).
 * - Unique violation: `code === '23505'`.
 * - Foreign key: `code === '23503'`.
 * - Check constraint: `code === '23514'`.
 */
export function extractErrorCode(error) {
  if (!error) {
    return null;
  }
  if (error instanceof AppError) {
    return error.code;
  }

  const message = typeof error.message === 'string' ? error.message.trim() : '';
  const uppercase = message.toUpperCase();

  if (ERROR_MESSAGES[uppercase]) {
    return uppercase;
  }

  for (const [pattern, code] of AUTH_ERROR_PATTERNS) {
    if (pattern.test(message)) {
      return code;
    }
  }

  switch (error.code) {
    case '23505':
      return 'CONFLICT';
    case '23503':
    case '23514':
      return 'VALIDATION_ERROR';
    case '42501':
      return 'UNAUTHENTICATED';
    case 'PGRST301':
      return 'UNAUTHENTICATED';
    default:
      break;
  }

  if (uppercase.startsWith('INVALID_') || uppercase.startsWith('POCKET_')) {
    return uppercase;
  }

  return null;
}

/**
 * Menormalkan error apa pun menjadi `AppError`.
 *
 * Pesan teknis dari library tidak pernah ditampilkan ke UI. Jika kode tidak
 * dikenali, `fallbackMessage` atau pesan generik yang dipakai.
 */
export function toAppError(error, fallbackMessage) {
  if (error instanceof AppError) {
    return error;
  }

  const details = parseDetails(error);
  const code = extractErrorCode(error);

  if (code) {
    return new AppError(code, getErrorMessage(code), {
      details,
      cause: error ?? null,
    });
  }

  if (typeof error?.message === 'string' && NETWORK_ERROR_PATTERN.test(error.message)) {
    return new AppError('NETWORK_ERROR', getErrorMessage('NETWORK_ERROR'), {
      details,
      cause: error,
    });
  }

  return new AppError('UNKNOWN_ERROR', fallbackMessage || getErrorMessage('UNKNOWN_ERROR'), {
    details,
    cause: error ?? null,
  });
}

function parseDetails(error) {
  if (!error?.details) {
    return null;
  }
  if (typeof error.details !== 'string') {
    return error.details;
  }
  try {
    return JSON.parse(error.details);
  } catch {
    return error.details;
  }
}

export default AppError;
