const DIGITS_ONLY = /\D/g;
const GROUP_SEPARATOR = /(\d)(?=(\d{3})+(?!\d))/g;

/**
 * Mengubah input pengguna menjadi digit mentah.
 * `"1.500.000"` -> `"1500000"`.
 */
export function toAmountDigits(value) {
  if (value === null || value === undefined) {
    return '';
  }
  return String(value).replace(DIGITS_ONLY, '');
}

/**
 * Mengelompokkan digit dengan pemisah ribuan titik.
 * `"1500000"` -> `"1.500.000"`.
 */
export function formatAmountDigits(digits) {
  const clean = toAmountDigits(digits).replace(/^0+(?=\d)/, '');
  if (!clean) {
    return '';
  }
  return clean.replace(GROUP_SEPARATOR, '$1.');
}

/**
 * Format angka menjadi teks rupiah tanpa desimal.
 * Nilai bukan angka atau kosong menghasilkan `Rp 0`.
 */
export function formatRupiah(value) {
  const numeric = Number(value);
  const safe = Number.isFinite(numeric) ? numeric : 0;
  return `Rp ${formatNumber(safe)}`;
}

/**
 * Format angka dengan pemisah ribuan tanpa simbol mata uang.
 */
export function formatNumber(value) {
  const numeric = Number(value);
  const safe = Number.isFinite(numeric) ? numeric : 0;
  const rounded = Math.round(Math.abs(safe));
  const grouped = String(rounded).replace(GROUP_SEPARATOR, '$1.');
  return safe < 0 ? `-${grouped}` : grouped;
}

/**
 * Mengubah digit mentah menjadi `number`. String kosong menghasilkan `0`.
 */
export function digitsToNumber(digits) {
  const clean = toAmountDigits(digits);
  if (!clean) {
    return 0;
  }
  return Number(clean);
}

/**
 * Mengubah nominal menjadi digit mentah untuk `AmountInput`.
 */
export function numberToDigits(value) {
  const numeric = Number(value);
  if (!Number.isFinite(numeric) || numeric <= 0) {
    return '';
  }
  return String(Math.round(numeric));
}
