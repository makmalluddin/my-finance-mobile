import { pocketService } from '@/appservices/pocket/pocketService';
import { pocketRepository } from '@/data/repositories/pocketRepository';
import { toOccurredAt } from '@/shared/utils/date';

jest.mock('@/data/repositories/pocketRepository', () => ({
  pocketRepository: {
    listPockets: jest.fn(),
    listPocketItems: jest.fn(),
    listTransferSummaries: jest.fn(),
    getOutstandingAllocation: jest.fn(),
    createPocket: jest.fn(),
    updatePocket: jest.fn(),
    archivePocket: jest.fn(),
    unarchivePocket: jest.fn(),
    deletePocket: jest.fn(),
    createIncomeItem: jest.fn(),
    confirmIncomeItem: jest.fn(),
    createPlannedExpenseItem: jest.fn(),
    updatePlannedExpenseItem: jest.fn(),
    convertPlannedExpense: jest.fn(),
    createTransferItem: jest.fn(),
    deletePocketItem: jest.fn(),
    updatePocketTransaction: jest.fn(),
    deletePocketTransaction: jest.fn(),
  },
}));

beforeEach(() => {
  jest.resetAllMocks();
});

describe('pocketService', () => {
  test('createPocket memanggil repository dengan nama bersih dan deskripsi opsional', async () => {
    pocketRepository.createPocket.mockResolvedValue({ id: 'pocket-1' });

    await pocketService.createPocket({
      name: '  Liburan  ',
      description: '   ',
      type: 'expense',
    });

    expect(pocketRepository.createPocket).toHaveBeenCalledWith({
      name: 'Liburan',
      description: null,
      type: 'expense',
    });
  });

  test('nama kosong dan tipe tidak valid ditolak sebelum memanggil repository', async () => {
    await expect(pocketService.createPocket({ name: '   ', type: 'income' })).rejects.toMatchObject({
      code: 'VALIDATION_ERROR',
    });
    await expect(pocketService.createPocket({ name: 'Pocket', type: 'tabungan' })).rejects.toMatchObject({
      code: 'INVALID_POCKET_TYPE',
    });
    expect(pocketRepository.createPocket).not.toHaveBeenCalled();
  });

  test('nominal item harus lebih dari nol', async () => {
    await expect(
      pocketService.createIncomeItem({ pocketId: 'pocket-1', name: 'Gaji', amount: 0 })
    ).rejects.toMatchObject({ code: 'INVALID_AMOUNT' });
    expect(pocketRepository.createIncomeItem).not.toHaveBeenCalled();
  });

  test('confirmIncomeItem dan convertPlannedExpense meneruskan Fund yang dipilih', async () => {
    pocketRepository.confirmIncomeItem.mockResolvedValue({ id: 'trx-1' });
    pocketRepository.convertPlannedExpense.mockResolvedValue({ id: 'trx-2' });

    await pocketService.confirmIncomeItem({ itemId: 'item-1', destinationFundId: 'fund-b' });
    await pocketService.convertPlannedExpense({ itemId: 'item-2', sourceFundId: 'fund-a' });

    expect(pocketRepository.confirmIncomeItem).toHaveBeenCalledWith({
      itemId: 'item-1',
      destinationFundId: 'fund-b',
    });
    expect(pocketRepository.convertPlannedExpense).toHaveBeenCalledWith({
      itemId: 'item-2',
      sourceFundId: 'fund-a',
    });
  });

  test('createTransferItem menolak Fund sumber dan tujuan yang sama', async () => {
    await expect(
      pocketService.createTransferItem({
        pocketId: 'pocket-1',
        name: 'Transfer',
        amount: 10000,
        sourceFundId: 'fund-a',
        destinationFundId: 'fund-a',
        date: new Date(),
      })
    ).rejects.toMatchObject({ code: 'SAME_FUND_TRANSFER' });
    expect(pocketRepository.createTransferItem).not.toHaveBeenCalled();
  });

  test('createTransferItem menormalkan tanggal lokal', async () => {
    pocketRepository.createTransferItem.mockResolvedValue({ id: 'item-3' });
    const date = new Date(2026, 10, 22);

    await pocketService.createTransferItem({
      pocketId: 'pocket-1',
      name: 'Transfer',
      amount: 10000,
      sourceFundId: 'fund-a',
      destinationFundId: 'fund-b',
      date,
    });

    expect(pocketRepository.createTransferItem).toHaveBeenCalledWith(
      expect.objectContaining({ occurredAt: toOccurredAt(date) })
    );
  });

  test('updatePocketTransaction menjaga bentuk transaksi Income', async () => {
    pocketRepository.updatePocketTransaction.mockResolvedValue({ id: 'trx-3' });
    const date = new Date(2026, 10, 21);

    await pocketService.updatePocketTransaction({
      transactionId: 'trx-3',
      type: 'income',
      amount: 50000,
      date,
      destinationFundId: 'fund-b',
      sourceFundId: 'fund-diabaikan',
    });

    expect(pocketRepository.updatePocketTransaction).toHaveBeenCalledWith({
      transactionId: 'trx-3',
      amount: 50000,
      occurredAt: toOccurredAt(date),
      sourceFundId: null,
      destinationFundId: 'fund-b',
    });
  });

  test('deletePocketItem dan deletePocketTransaction menolak id kosong', async () => {
    await expect(pocketService.deletePocketItem('  ')).rejects.toMatchObject({
      code: 'POCKET_ITEM_NOT_FOUND',
    });
    await expect(pocketService.deletePocketTransaction('')).rejects.toMatchObject({
      code: 'TRANSACTION_NOT_FOUND',
    });
    expect(pocketRepository.deletePocketItem).not.toHaveBeenCalled();
    expect(pocketRepository.deletePocketTransaction).not.toHaveBeenCalled();
  });
});
