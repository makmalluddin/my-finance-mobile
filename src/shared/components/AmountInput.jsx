import TextField from './TextField';
import { formatAmountDigits, toAmountDigits } from '../utils/currency';

/**
 * Input nominal rupiah.
 *
 * `value` adalah nominal dalam `number` (atau string angka). Nilai `0`
 * ditampilkan sebagai input kosong. `onChangeValue` menerima `number`
 * (0 ketika input dikosongkan).
 */
export default function AmountInput({
  value,
  onChangeValue,
  label = 'Nominal',
  ...rest
}) {
  const numeric = Number(value);
  const digits = Number.isFinite(numeric) && numeric > 0 ? String(Math.round(numeric)) : '';

  const handleChangeText = (text) => {
    const nextDigits = toAmountDigits(text);
    onChangeValue?.(nextDigits ? Number(nextDigits) : 0);
  };

  return (
    <TextField
      label={label}
      value={formatAmountDigits(digits)}
      onChangeText={handleChangeText}
      keyboardType="number-pad"
      inputMode="numeric"
      prefix="Rp"
      placeholder="0"
      maxLength={20}
      {...rest}
    />
  );
}
