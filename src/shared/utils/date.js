const MONTHS_SHORT = [
  'Jan',
  'Feb',
  'Mar',
  'Apr',
  'Mei',
  'Jun',
  'Jul',
  'Agu',
  'Sep',
  'Okt',
  'Nov',
  'Des',
];

const MONTHS_LONG = [
  'Januari',
  'Februari',
  'Maret',
  'April',
  'Mei',
  'Juni',
  'Juli',
  'Agustus',
  'September',
  'Oktober',
  'November',
  'Desember',
];

const DAY_NAMES = ['Minggu', 'Senin', 'Selasa', 'Rabu', 'Kamis', 'Jumat', 'Sabtu'];

function pad2(value) {
  return String(value).padStart(2, '0');
}

/** Zona waktu perangkat dengan fallback UTC bila tidak tersedia. */
export function getDeviceTimezone() {
  try {
    return Intl.DateTimeFormat().resolvedOptions().timeZone || 'UTC';
  } catch {
    return 'UTC';
  }
}

/**
 * Mengembalikan `Date` pada pukul 00.00 waktu lokal.
 * Menerima `Date` atau `"YYYY-MM-DD"`.
 */
export function startOfLocalDay(value = new Date()) {
  const date = coerceDate(value);
  return new Date(date.getFullYear(), date.getMonth(), date.getDate());
}

/**
 * Mengembalikan awal hari lokal berikutnya.
 */
export function startOfNextLocalDay(value = new Date()) {
  const start = startOfLocalDay(value);
  start.setDate(start.getDate() + 1);
  return start;
}

/**
 * Tanggal kalender lokal dalam format `YYYY-MM-DD`.
 */
export function toDateKey(value = new Date()) {
  const date = coerceDate(value);
  return `${date.getFullYear()}-${pad2(date.getMonth() + 1)}-${pad2(date.getDate())}`;
}

/**
 * Mengubah `"YYYY-MM-DD"` menjadi `Date` lokal pukul 00.00.
 * String tidak valid menghasilkan `null`.
 */
export function fromDateKey(dateKey) {
  if (typeof dateKey !== 'string') {
    return null;
  }
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(dateKey.trim());
  if (!match) {
    return null;
  }
  const [, year, month, day] = match;
  const date = new Date(Number(year), Number(month) - 1, Number(day));
  if (
    date.getFullYear() !== Number(year) ||
    date.getMonth() !== Number(month) - 1 ||
    date.getDate() !== Number(day)
  ) {
    return null;
  }
  return date;
}

/**
 * Nilai `occurred_at` untuk sebuah tanggal kalender lokal.
 *
 * Tanggal disimpan pada pukul 12.00 waktu lokal lalu dikonversi ke ISO UTC
 * agar tanggal tidak bergeser ketika dibaca kembali di zona waktu berbeda.
 */
export function toOccurredAt(value = new Date()) {
  const key = typeof value === 'string' ? value : toDateKey(value);
  const date = fromDateKey(key);
  if (!date) {
    throw new Error(`INVALID_DATE: ${String(value)}`);
  }
  date.setHours(12, 0, 0, 0);
  return date.toISOString();
}

/**
 * Mengubah `occurred_at` menjadi tanggal kalender lokal perangkat.
 */
export function occurredAtToDateKey(occurredAt) {
  if (!occurredAt) {
    return null;
  }
  const date = new Date(occurredAt);
  if (Number.isNaN(date.getTime())) {
    return null;
  }
  return toDateKey(date);
}

/**
 * Format tanggal ringkas, misalnya `21 Nov 2026`.
 */
export function formatDate(value) {
  const date = coerceDate(value);
  return `${date.getDate()} ${MONTHS_SHORT[date.getMonth()]} ${date.getFullYear()}`;
}

/**
 * Format timestamp ISO pada zona waktu tertentu, misalnya zona waktu yang
 * tersimpan pada Automation. Menghindari pergeseran tanggal ketika perangkat
 * berpindah zona waktu.
 */
export function formatDateInTimeZone(value, timezone) {
  const date = value instanceof Date ? value : new Date(value);
  if (Number.isNaN(date.getTime())) {
    return '-';
  }
  if (!timezone) {
    return formatDate(date);
  }
  try {
    const parts = new Intl.DateTimeFormat('id-ID', {
      timeZone: timezone,
      day: 'numeric',
      month: 'short',
      year: 'numeric',
    }).formatToParts(date);
    const part = (type) => parts.find((item) => item.type === type)?.value ?? '';
    return `${Number(part('day'))} ${part('month')} ${part('year')}`;
  } catch {
    return formatDate(date);
  }
}

/**
 * Format tanggal lengkap, misalnya `Sabtu, 21 November 2026`.
 */
export function formatDateLong(value) {
  const date = coerceDate(value);
  return `${DAY_NAMES[date.getDay()]}, ${date.getDate()} ${
    MONTHS_LONG[date.getMonth()]
  } ${date.getFullYear()}`;
}

/**
 * Menambah atau mengurangi hari tanpa mengubah jam.
 */
export function addDays(value, amount) {
  const date = coerceDate(value);
  const result = new Date(date.getTime());
  result.setDate(result.getDate() + amount);
  return result;
}

/**
 * Daftar tanggal `YYYY-MM-DD` dari `start` sampai `end` (inklusif).
 */
export function eachDateKey(start, end) {
  const first = startOfLocalDay(start);
  const last = startOfLocalDay(end);
  const result = [];
  for (let cursor = first; cursor <= last; cursor = addDays(cursor, 1)) {
    result.push(toDateKey(cursor));
  }
  return result;
}

export function isSameLocalDay(a, b) {
  return toDateKey(a) === toDateKey(b);
}

function coerceDate(value) {
  if (value instanceof Date && !Number.isNaN(value.getTime())) {
    return value;
  }
  if (typeof value === 'string') {
    const fromKey = fromDateKey(value);
    if (fromKey) {
      return fromKey;
    }
    const parsed = new Date(value);
    if (!Number.isNaN(parsed.getTime())) {
      return parsed;
    }
  }
  if (typeof value === 'number') {
    const parsed = new Date(value);
    if (!Number.isNaN(parsed.getTime())) {
      return parsed;
    }
  }
  return new Date();
}

export { MONTHS_SHORT, MONTHS_LONG, DAY_NAMES };
