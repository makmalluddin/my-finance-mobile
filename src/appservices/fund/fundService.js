import { fundRepository } from '@/data/repositories/fundRepository';
import { AppError, getErrorMessage } from '@/shared/utils/errors';

const FUND_TYPES = new Set(['active', 'savings_goal']);

function validateName(value) {
  if (typeof value !== 'string' || value.trim() === '') {
    throw new AppError('VALIDATION_ERROR', 'Nama Fund wajib diisi.', {
      details: { field: 'name' },
    });
  }
  return value.trim();
}

function validateOpeningBalance(value) {
  const amount = Number(value);
  if (!Number.isFinite(amount) || amount < 0) {
    throw new AppError('INVALID_AMOUNT', getErrorMessage('INVALID_AMOUNT'), {
      details: { field: 'opening_balance' },
    });
  }
  if (Math.abs(amount * 100 - Math.round(amount * 100)) > 1e-6) {
    throw new AppError('INVALID_AMOUNT', 'Opening Balance maksimal dua angka desimal.', {
      details: { field: 'opening_balance' },
    });
  }
  return amount;
}

function validateFundType(value) {
  if (!FUND_TYPES.has(value)) {
    throw new AppError('INVALID_FUND_TYPE', getErrorMessage('INVALID_FUND_TYPE'), {
      details: { fund_type: value },
    });
  }
  return value;
}

function validateFundId(value) {
  if (typeof value !== 'string' || value.trim() === '') {
    throw new AppError('FUND_NOT_FOUND', getErrorMessage('FUND_NOT_FOUND'));
  }
  return value;
}

/**
 * Use case Fund. Tidak ada fungsi untuk menulis saldo: saldo selalu berasal
 * dari Opening Balance dan transaksi aktual yang dihitung database.
 */
export const fundService = {
  async listFunds(options = {}) {
    return fundRepository.listFunds(options);
  },

  async createFund({ name, openingBalance, fundType } = {}) {
    return fundRepository.createFund({
      name: validateName(name),
      openingBalance: validateOpeningBalance(openingBalance ?? 0),
      fundType: validateFundType(fundType),
    });
  },

  async updateFund({ fundId, name, fundType } = {}) {
    return fundRepository.updateFund({
      fundId: validateFundId(fundId),
      name: validateName(name),
      fundType: validateFundType(fundType),
    });
  },

  async archiveFund(fundId) {
    return fundRepository.archiveFund(validateFundId(fundId));
  },

  async unarchiveFund(fundId) {
    return fundRepository.unarchiveFund(validateFundId(fundId));
  },

  async deleteFund(fundId) {
    return fundRepository.deleteFund(validateFundId(fundId));
  },
};

export default fundService;
