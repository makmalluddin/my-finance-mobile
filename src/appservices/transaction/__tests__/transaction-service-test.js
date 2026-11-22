import { transactionService } from '@/appservices/transaction/transactionService';
import { transactionRepository } from '@/data/repositories/transactionRepository';
import { toOccurredAt } from '@/shared/utils/date';

jest.mock('@/data/repositories/transactionRepository', () => ({
  transactionRepository: {
    listTransactions: jest.fn(),
    createIncome: jest.fn(),
    createExpense: jest.fn(),
    createTransfer: jest.fn(),
    updateTransaction: jest.fn(),
    deleteTransaction: jest.fn(),
  },
}));

beforeEach(() => {
  jest.resetAllMocks();
});

describe('transactionService', () => {
  test('createIncome meneruskan Fund tujuan dan Category income', async () => {
    transactionRepository.createIncome.mockResolvedValue({ id: 'trx-1' });
    const date = new Date(2026, 10, 22);

    await transactionService.createTransaction({
      type: 'income',
      amount: '1500000',
      date,
      destinationFundId: 'fund-b',
      categoryId: 'cat-income',
      sourceFundId: 'fund-diabaikan',
    });

    expect(transactionRepository.createIncome).toHaveBeenCalledWith({
      amount: 1500000,
      occurredAt: toOccurredAt(date),
      sourceFundId: null,
      destinationFundId: 'fund-b',
      categoryId: 'cat-income',
    });
    expect(transactionRepository.createExpense).not.toHaveBeenCalled();
  });

  test('createExpense menolak transaksi tanpa Category', async () => {
    await expect(
      transactionService.createTransaction({
        type: 'expense',
        amount: 10000,
        date: new Date(),
        sourceFundId: 'fund-a',
      })
    ).rejects.toMatchObject({ code: 'CATEGORY_REQUIRED' });
    expect(transactionRepository.createExpense).not.toHaveBeenCalled();
  });

  test('createTransfer menolak Fund sumber dan tujuan yang sama', async () => {
    await expect(
      transactionService.createTransaction({
        type: 'transfer',
        amount: 10000,
        date: new Date(),
        sourceFundId: 'fund-a',
        destinationFundId: 'fund-a',
      })
    ).rejects.toMatchObject({ code: 'SAME_FUND_TRANSFER' });
    expect(transactionRepository.createTransfer).not.toHaveBeenCalled();
  });

  test('Transfer tidak meneruskan Category', async () => {
    transactionRepository.createTransfer.mockResolvedValue({ id: 'trx-2' });

    await transactionService.createTransaction({
      type: 'transfer',
      amount: 250000,
      date: new Date(2026, 10, 22),
      sourceFundId: 'fund-a',
      destinationFundId: 'fund-b',
      categoryId: 'cat-expense',
    });

    expect(transactionRepository.createTransfer).toHaveBeenCalledWith(
      expect.objectContaining({ categoryId: null })
    );
  });

  test('nominal nol dan tanggal tidak valid ditolak sebelum memanggil repository', async () => {
    await expect(
      transactionService.createTransaction({
        type: 'income',
        amount: 0,
        date: new Date(),
        destinationFundId: 'fund-b',
        categoryId: 'cat-income',
      })
    ).rejects.toMatchObject({ code: 'INVALID_AMOUNT' });

    await expect(
      transactionService.createTransaction({
        type: 'income',
        amount: 1000,
        date: 'tanggal-bukan-kalender',
        destinationFundId: 'fund-b',
        categoryId: 'cat-income',
      })
    ).rejects.toMatchObject({ code: 'INVALID_DATE' });

    expect(transactionRepository.createIncome).not.toHaveBeenCalled();
  });

  test('updateTransaction mempertahankan bentuk transaksi lama', async () => {
    transactionRepository.updateTransaction.mockResolvedValue({ id: 'trx-3' });
    const date = new Date(2026, 10, 21);

    await transactionService.updateTransaction({
      transactionId: 'trx-3',
      type: 'expense',
      amount: 50000,
      date,
      sourceFundId: 'fund-a',
      categoryId: 'cat-expense',
    });

    expect(transactionRepository.updateTransaction).toHaveBeenCalledWith({
      transactionId: 'trx-3',
      amount: 50000,
      occurredAt: toOccurredAt(date),
      sourceFundId: 'fund-a',
      destinationFundId: null,
      categoryId: 'cat-expense',
    });
  });

  test('deleteTransaction menolak id kosong', async () => {
    await expect(transactionService.deleteTransaction('  ')).rejects.toMatchObject({
      code: 'TRANSACTION_NOT_FOUND',
    });
    expect(transactionRepository.deleteTransaction).not.toHaveBeenCalled();
  });

  test('listTransactions menerjemahkan filter jenis dan periode', async () => {
    transactionRepository.listTransactions.mockResolvedValue([]);
    jest.useFakeTimers().setSystemTime(new Date(2026, 10, 22, 9, 0, 0));

    await transactionService.listTransactions({ type: 'expense', range: '7d' });

    expect(transactionRepository.listTransactions).toHaveBeenCalledWith(
      expect.objectContaining({
        type: 'expense',
        from: expect.any(String),
        to: expect.any(String),
        limit: 200,
      })
    );
    jest.useRealTimers();
  });
});
