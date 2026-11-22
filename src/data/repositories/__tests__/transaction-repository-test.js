import { transactionRepository } from '@/data/repositories/transactionRepository';
import { supabase } from '@/data/supabase/client';

jest.mock('@/data/supabase/client', () => ({
  supabase: {
    rpc: jest.fn(),
    from: jest.fn(),
  },
}));

beforeEach(() => {
  jest.resetAllMocks();
});

describe('transactionRepository', () => {
  test('createExpense memanggil RPC dengan parameter kontrak dan memetakan hasil', async () => {
    supabase.rpc.mockResolvedValue({
      data: {
        id: 'trx-1',
        type: 'expense',
        amount: '25000.00',
        occurred_at: '2026-11-22T05:00:00.000Z',
        source_fund_id: 'fund-a',
        category: { name: 'Food' },
      },
      error: null,
    });

    const result = await transactionRepository.createExpense({
      amount: 25000,
      occurredAt: '2026-11-22T05:00:00.000Z',
      sourceFundId: 'fund-a',
      categoryId: 'cat-food',
    });

    expect(supabase.rpc).toHaveBeenCalledWith('rpc_create_expense', {
      p_amount: 25000,
      p_occurred_at: '2026-11-22T05:00:00.000Z',
      p_source_fund_id: 'fund-a',
      p_category_id: 'cat-food',
    });
    expect(result).toMatchObject({
      id: 'trx-1',
      amount: 25000,
      categoryName: 'Food',
      destinationFundId: null,
      pocketItemId: null,
    });
  });

  test('listTransactions menerapkan filter dan mengembalikan urutan dari backend', async () => {
    const chain = {
      select: jest.fn(),
      eq: jest.fn(),
      gte: jest.fn(),
      lt: jest.fn(),
      order: jest.fn(),
      limit: jest.fn(),
    };
    Object.values(chain).forEach((fn) => {
      if (fn !== chain.limit) {
        fn.mockReturnValue(chain);
      }
    });
    chain.select.mockReturnValue(chain);
    chain.order.mockReturnValue(chain);
    chain.limit.mockResolvedValue({ data: [], error: null });
    supabase.from.mockReturnValue(chain);

    await transactionRepository.listTransactions({
      type: 'transfer',
      from: '2026-11-01T00:00:00.000Z',
      to: '2026-12-01T00:00:00.000Z',
      limit: 50,
    });

    expect(supabase.from).toHaveBeenCalledWith('transactions');
    expect(chain.eq).toHaveBeenCalledWith('type', 'transfer');
    expect(chain.gte).toHaveBeenCalledWith('occurred_at', '2026-11-01T00:00:00.000Z');
    expect(chain.lt).toHaveBeenCalledWith('occurred_at', '2026-12-01T00:00:00.000Z');
    expect(chain.limit).toHaveBeenCalledWith(50);
  });
});
