import { pocketRepository } from '@/data/repositories/pocketRepository';
import { toOccurredAt } from '@/shared/utils/date';
import { AppError, getErrorMessage } from '@/shared/utils/errors';

const POCKET_TYPES = new Set(['income', 'expense', 'transfer']);

function fail(code, message) {
  throw new AppError(code, message ?? getErrorMessage(code));
}

function validateName(value) {
  const name = typeof value === 'string' ? value.trim() : '';
  if (!name) {
    fail('VALIDATION_ERROR', 'Nama wajib diisi.');
  }
  return name;
}

function validateDescription(value) {
  if (value === null || value === undefined) {
    return null;
  }
  const description = String(value).trim();
  return description === '' ? null : description;
}

function validateAmount(value) {
  const amount = Number(value);
  if (!Number.isFinite(amount) || amount <= 0) {
    fail('INVALID_AMOUNT');
  }
  if (Math.abs(amount * 100 - Math.round(amount * 100)) > 1e-6) {
    fail('INVALID_AMOUNT', 'Nominal maksimal dua angka desimal.');
  }
  return amount;
}

function validatePocketType(value) {
  if (!POCKET_TYPES.has(value)) {
    fail('INVALID_POCKET_TYPE');
  }
  return value;
}

function validateId(value, code) {
  if (typeof value !== 'string' || value.trim() === '') {
    fail(code);
  }
  return value;
}

function normalizeOccurredAt(value) {
  try {
    return toOccurredAt(value ?? new Date());
  } catch {
    fail('INVALID_DATE');
  }
}

/**
 * Satu-satunya jalur mutasi Pocket untuk Presentation Layer. Perubahan saldo
 * dan siklus status item sepenuhnya ditentukan RPC di backend.
 */
export const pocketService = {
  async listPockets() {
    return pocketRepository.listPockets();
  },

  async listPocketItems({ pocketId } = {}) {
    return pocketRepository.listPocketItems({
      pocketId: pocketId ? validateId(pocketId, 'POCKET_NOT_FOUND') : undefined,
    });
  },

  async listTransferSummaries() {
    return pocketRepository.listTransferSummaries();
  },

  async getOutstandingAllocation() {
    return pocketRepository.getOutstandingAllocation();
  },

  async createPocket(input = {}) {
    return pocketRepository.createPocket({
      name: validateName(input.name),
      description: validateDescription(input.description),
      type: validatePocketType(input.type),
    });
  },

  async updatePocket(input = {}) {
    return pocketRepository.updatePocket({
      pocketId: validateId(input.pocketId, 'POCKET_NOT_FOUND'),
      name: validateName(input.name),
      description: validateDescription(input.description),
      type: validatePocketType(input.type),
    });
  },

  async archivePocket(pocketId) {
    return pocketRepository.archivePocket(validateId(pocketId, 'POCKET_NOT_FOUND'));
  },

  async unarchivePocket(pocketId) {
    return pocketRepository.unarchivePocket(validateId(pocketId, 'POCKET_NOT_FOUND'));
  },

  async deletePocket(pocketId) {
    return pocketRepository.deletePocket(validateId(pocketId, 'POCKET_NOT_FOUND'));
  },

  async createIncomeItem(input = {}) {
    return pocketRepository.createIncomeItem({
      pocketId: validateId(input.pocketId, 'POCKET_NOT_FOUND'),
      name: validateName(input.name),
      amount: validateAmount(input.amount),
    });
  },

  async confirmIncomeItem(input = {}) {
    return pocketRepository.confirmIncomeItem({
      itemId: validateId(input.itemId, 'POCKET_ITEM_NOT_FOUND'),
      destinationFundId: validateId(input.destinationFundId, 'FUND_NOT_FOUND'),
    });
  },

  async createPlannedExpenseItem(input = {}) {
    return pocketRepository.createPlannedExpenseItem({
      pocketId: validateId(input.pocketId, 'POCKET_NOT_FOUND'),
      name: validateName(input.name),
      amount: validateAmount(input.amount),
    });
  },

  async updatePlannedExpenseItem(input = {}) {
    return pocketRepository.updatePlannedExpenseItem({
      itemId: validateId(input.itemId, 'POCKET_ITEM_NOT_FOUND'),
      name: validateName(input.name),
      amount: validateAmount(input.amount),
    });
  },

  async convertPlannedExpense(input = {}) {
    return pocketRepository.convertPlannedExpense({
      itemId: validateId(input.itemId, 'POCKET_ITEM_NOT_FOUND'),
      sourceFundId: validateId(input.sourceFundId, 'FUND_NOT_FOUND'),
    });
  },

  async createTransferItem(input = {}) {
    const sourceFundId = validateId(input.sourceFundId, 'FUND_NOT_FOUND');
    const destinationFundId = validateId(input.destinationFundId, 'FUND_NOT_FOUND');
    if (sourceFundId === destinationFundId) {
      fail('SAME_FUND_TRANSFER');
    }

    return pocketRepository.createTransferItem({
      pocketId: validateId(input.pocketId, 'POCKET_NOT_FOUND'),
      name: validateName(input.name),
      amount: validateAmount(input.amount),
      sourceFundId,
      destinationFundId,
      occurredAt: normalizeOccurredAt(input.date),
    });
  },

  async deletePocketItem(itemId) {
    return pocketRepository.deletePocketItem(validateId(itemId, 'POCKET_ITEM_NOT_FOUND'));
  },

  async updatePocketTransaction(input = {}) {
    const type = input.type;
    const sourceFundId = type === 'income' ? null : validateId(input.sourceFundId, 'FUND_NOT_FOUND');
    const destinationFundId =
      type === 'expense' ? null : validateId(input.destinationFundId, 'FUND_NOT_FOUND');

    if (type === 'transfer' && sourceFundId === destinationFundId) {
      fail('SAME_FUND_TRANSFER');
    }
    if (!['income', 'expense', 'transfer'].includes(type)) {
      fail('TRANSACTION_TYPE_IMMUTABLE');
    }

    return pocketRepository.updatePocketTransaction({
      transactionId: validateId(input.transactionId, 'TRANSACTION_NOT_FOUND'),
      amount: validateAmount(input.amount),
      occurredAt: normalizeOccurredAt(input.date),
      sourceFundId,
      destinationFundId,
    });
  },

  async deletePocketTransaction(transactionId) {
    return pocketRepository.deletePocketTransaction(
      validateId(transactionId, 'TRANSACTION_NOT_FOUND')
    );
  },
};

export default pocketService;
