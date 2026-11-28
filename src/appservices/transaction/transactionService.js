import { transactionRepository } from '@/data/repositories/transactionRepository';
import {
  addDays,
  startOfLocalDay,
  startOfNextLocalDay,
  toOccurredAt,
} from '@/shared/utils/date';
import { AppError, getErrorMessage } from '@/shared/utils/errors';

const TRANSACTION_TYPES = new Set(['income', 'expense', 'transfer']);

function validateType(value) {
  if (!TRANSACTION_TYPES.has(value)) {
    throw new AppError('VALIDATION_ERROR', getErrorMessage('VALIDATION_ERROR'), {
      details: { field: 'type', value },
    });
  }
  return value;
}

function validateAmount(value) {
  const amount = Number(value);
  if (!Number.isFinite(amount) || amount <= 0) {
    throw new AppError('INVALID_AMOUNT', getErrorMessage('INVALID_AMOUNT'), {
      details: { field: 'amount' },
    });
  }
  if (Math.abs(amount * 100 - Math.round(amount * 100)) > 1e-6) {
    throw new AppError('INVALID_AMOUNT', 'Nominal maksimal dua angka desimal.', {
      details: { field: 'amount' },
    });
  }
  return amount;
}

function normalizeOccurredAt(value) {
  try {
    return toOccurredAt(value ?? new Date());
  } catch {
    throw new AppError('INVALID_DATE', getErrorMessage('INVALID_DATE'), {
      details: { field: 'date' },
    });
  }
}

function validateId(value, code) {
  if (typeof value !== 'string' || value.trim() === '') {
    throw new AppError(code, getErrorMessage(code));
  }
  return value;
}

function validateCategoryId(value, required) {
  if (required && (typeof value !== 'string' || value.trim() === '')) {
    throw new AppError('CATEGORY_REQUIRED', getErrorMessage('CATEGORY_REQUIRED'));
  }
  return value ?? null;
}

/**
 * Menyusun bentuk transaksi sesuai aturan backend:
 * Income hanya punya Fund tujuan + Category income, Expense hanya punya Fund
 * sumber + Category expense, Transfer punya dua Fund dan tanpa Category.
 */
function buildShape({ type, sourceFundId, destinationFundId, categoryId }) {
  if (type === 'income') {
    return {
      sourceFundId: null,
      destinationFundId: validateId(destinationFundId, 'FUND_NOT_FOUND'),
      categoryId: validateCategoryId(categoryId, true),
    };
  }

  if (type === 'expense') {
    return {
      sourceFundId: validateId(sourceFundId, 'FUND_NOT_FOUND'),
      destinationFundId: null,
      categoryId: validateCategoryId(categoryId, true),
    };
  }

  const source = validateId(sourceFundId, 'FUND_NOT_FOUND');
  const destination = validateId(destinationFundId, 'FUND_NOT_FOUND');
  if (source === destination) {
    throw new AppError('SAME_FUND_TRANSFER', getErrorMessage('SAME_FUND_TRANSFER'));
  }
  return { sourceFundId: source, destinationFundId: destination, categoryId: null };
}

function resolveRange(range) {
  const today = new Date();
  const to = startOfNextLocalDay(today).toISOString();

  switch (range) {
    case 'today':
      return { from: startOfLocalDay(today).toISOString(), to };
    case '7d':
      return { from: startOfLocalDay(addDays(today, -6)).toISOString(), to };
    case '30d':
      return { from: startOfLocalDay(addDays(today, -29)).toISOString(), to };
    case 'thisMonth':
      return {
        from: startOfLocalDay(new Date(today.getFullYear(), today.getMonth(), 1)).toISOString(),
        to,
      };
    default:
      return {};
  }
}

/**
 * Satu-satunya jalur mutasi transaksi untuk Presentation Layer. UI tidak
 * pernah menulis saldo; saldo selalu merupakan konsekuensi RPC di backend.
 */
export const transactionService = {
  async listTransactions({ type = 'all', range = 'all' } = {}) {
    const normalizedType = type === 'all' ? undefined : validateType(type);
    return transactionRepository.listTransactions({
      type: normalizedType,
      ...resolveRange(range),
      limit: 200,
    });
  },

  async createTransaction(input = {}) {
    const type = validateType(input.type);
    const amount = validateAmount(input.amount);
    const occurredAt = normalizeOccurredAt(input.date);
    const shape = buildShape({ ...input, type });

    switch (type) {
      case 'income':
        return transactionRepository.createIncome({ amount, occurredAt, ...shape });
      case 'expense':
        return transactionRepository.createExpense({ amount, occurredAt, ...shape });
      default:
        return transactionRepository.createTransfer({ amount, occurredAt, ...shape });
    }
  },

  async updateTransaction(input = {}) {
    const transactionId = validateId(input.transactionId, 'TRANSACTION_NOT_FOUND');
    const type = validateType(input.type);
    const amount = validateAmount(input.amount);
    const occurredAt = normalizeOccurredAt(input.date);
    const shape = buildShape({ ...input, type });

    return transactionRepository.updateTransaction({
      transactionId,
      amount,
      occurredAt,
      ...shape,
    });
  },

  async deleteTransaction(transactionId) {
    return transactionRepository.deleteTransaction(
      validateId(transactionId, 'TRANSACTION_NOT_FOUND')
    );
  },
};

export default transactionService;
