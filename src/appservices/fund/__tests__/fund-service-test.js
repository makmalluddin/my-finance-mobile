import { fundService } from '@/appservices/fund/fundService';
import { fundRepository } from '@/data/repositories/fundRepository';
import { AppError, toAppError } from '@/shared/utils/errors';

jest.mock('@/data/repositories/fundRepository', () => ({
  fundRepository: {
    listFunds: jest.fn(),
    createFund: jest.fn(),
    updateFund: jest.fn(),
    archiveFund: jest.fn(),
    unarchiveFund: jest.fn(),
    deleteFund: jest.fn(),
  },
}));

beforeEach(() => {
  jest.resetAllMocks();
});

describe('fundService', () => {
  test('createFund memanggil repository dengan nama bersih dan nilai tervalidasi', async () => {
    fundRepository.createFund.mockResolvedValue({ id: 'fund-1', name: 'Dompet' });

    const result = await fundService.createFund({
      name: '  Dompet  ',
      openingBalance: 1500000,
      fundType: 'active',
    });

    expect(fundRepository.createFund).toHaveBeenCalledWith({
      name: 'Dompet',
      openingBalance: 1500000,
      fundType: 'active',
    });
    expect(result.id).toBe('fund-1');
  });

  test('opening balance kosong dianggap nol', async () => {
    fundRepository.createFund.mockResolvedValue({ id: 'fund-1' });

    await fundService.createFund({ name: 'Tabungan', fundType: 'savings_goal' });

    expect(fundRepository.createFund).toHaveBeenCalledWith({
      name: 'Tabungan',
      openingBalance: 0,
      fundType: 'savings_goal',
    });
  });

  test('nama kosong ditolak sebelum memanggil repository', async () => {
    await expect(
      fundService.createFund({ name: '   ', openingBalance: 0, fundType: 'active' })
    ).rejects.toMatchObject({ code: 'VALIDATION_ERROR' });
    expect(fundRepository.createFund).not.toHaveBeenCalled();
  });

  test('opening balance negatif ditolak', async () => {
    await expect(
      fundService.createFund({ name: 'Dompet', openingBalance: -1, fundType: 'active' })
    ).rejects.toMatchObject({ code: 'INVALID_AMOUNT' });
    expect(fundRepository.createFund).not.toHaveBeenCalled();
  });

  test('opening balance lebih dari dua desimal ditolak', async () => {
    await expect(
      fundService.createFund({ name: 'Dompet', openingBalance: 10.555, fundType: 'active' })
    ).rejects.toMatchObject({ code: 'INVALID_AMOUNT' });
  });

  test('klasifikasi Fund tidak valid ditolak', async () => {
    await expect(
      fundService.createFund({ name: 'Dompet', openingBalance: 0, fundType: 'investment' })
    ).rejects.toMatchObject({ code: 'INVALID_FUND_TYPE' });
  });

  test('updateFund meneruskan identitas dan field yang diizinkan', async () => {
    fundRepository.updateFund.mockResolvedValue({ id: 'fund-1' });

    await fundService.updateFund({
      fundId: 'fund-1',
      name: 'Dompet Baru',
      fundType: 'savings_goal',
    });

    expect(fundRepository.updateFund).toHaveBeenCalledWith({
      fundId: 'fund-1',
      name: 'Dompet Baru',
      fundType: 'savings_goal',
    });
  });

  test('error backend diteruskan tanpa diubah menjadi pesan teknis', async () => {
    const backendError = toAppError({ message: 'FUND_BALANCE_NOT_ZERO' });
    fundRepository.archiveFund.mockRejectedValue(backendError);

    await expect(fundService.archiveFund('fund-1')).rejects.toMatchObject({
      code: 'FUND_BALANCE_NOT_ZERO',
    });
  });

  test('deleteFund dengan id kosong ditolak', async () => {
    await expect(fundService.deleteFund('')).rejects.toBeInstanceOf(AppError);
    expect(fundRepository.deleteFund).not.toHaveBeenCalled();
  });
});
