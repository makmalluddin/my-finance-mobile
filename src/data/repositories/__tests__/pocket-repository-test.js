import { pocketRepository } from '@/data/repositories/pocketRepository';
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

describe('pocketRepository', () => {
  test('createPlannedExpenseItem memanggil RPC kontrak dan memetakan item', async () => {
    supabase.rpc.mockResolvedValue({
      data: {
        id: 'item-1',
        pocket_id: 'pocket-1',
        name: 'Rencana makan',
        amount: '150000.00',
        fund_id: null,
        status: 'planned',
      },
      error: null,
    });

    const result = await pocketRepository.createPlannedExpenseItem({
      pocketId: 'pocket-1',
      name: 'Rencana makan',
      amount: 150000,
    });

    expect(supabase.rpc).toHaveBeenCalledWith('rpc_create_planned_expense_item', {
      p_pocket_id: 'pocket-1',
      p_name: 'Rencana makan',
      p_amount: 150000,
    });
    expect(result).toMatchObject({
      id: 'item-1',
      amount: 150000,
      status: 'planned',
      transaction: null,
    });
  });

  test('listPocketItems menerapkan filter Pocket dan memetakan transaksi terkait', async () => {
    const chain = {
      select: jest.fn(),
      eq: jest.fn(),
      order: jest.fn(),
    };
    chain.select.mockReturnValue(chain);
    chain.eq.mockReturnValue(chain);
    chain.order.mockResolvedValue({
      data: [
        {
          id: 'item-2',
          pocket_id: 'pocket-2',
          name: 'Transfer bulanan',
          amount: '250000.00',
          status: 'completed',
          transaction: [
            {
              id: 'trx-1',
              type: 'transfer',
              amount: '250000.00',
              occurred_at: '2026-11-22T05:00:00.000Z',
              source: { name: 'BCA' },
              destination: { name: 'Tabungan' },
            },
          ],
        },
      ],
      error: null,
    });
    supabase.from.mockReturnValue(chain);

    const result = await pocketRepository.listPocketItems({ pocketId: 'pocket-2' });

    expect(supabase.from).toHaveBeenCalledWith('pocket_items');
    expect(chain.eq).toHaveBeenCalledWith('pocket_id', 'pocket-2');
    expect(result[0]).toMatchObject({
      id: 'item-2',
      amount: 250000,
      transaction: {
        id: 'trx-1',
        amount: 250000,
        sourceFundName: 'BCA',
        destinationFundName: 'Tabungan',
      },
    });
  });

  test('listTransferSummaries memetakan ringkasan dari view', async () => {
    const chain = {
      select: jest.fn(),
    };
    chain.select.mockResolvedValue({
      data: [
        {
          pocket_id: 'pocket-3',
          incoming: '300000.00',
          outgoing: '300000.00',
          net: '0.00',
          item_count: 3,
        },
      ],
      error: null,
    });
    supabase.from.mockReturnValue(chain);

    const result = await pocketRepository.listTransferSummaries();

    expect(supabase.from).toHaveBeenCalledWith('v_pocket_transfer_summary');
    expect(result).toEqual([
      { pocketId: 'pocket-3', incoming: 300000, outgoing: 300000, net: 0, itemCount: 3 },
    ]);
  });
});
