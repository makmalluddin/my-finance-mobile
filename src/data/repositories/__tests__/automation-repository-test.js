import { automationRepository } from '@/data/repositories/automationRepository';
import { notificationRepository } from '@/data/repositories/notificationRepository';
import { supabase } from '@/data/supabase/client';

jest.mock('@/data/supabase/client', () => ({
  supabase: {
    rpc: jest.fn(),
    from: jest.fn(),
  },
}));

function mockSelect(data) {
  const chain = {
    select: jest.fn(() => chain),
    eq: jest.fn(() => chain),
    order: jest.fn().mockResolvedValue({ data, error: null }),
  };
  return chain;
}

beforeEach(() => {
  jest.resetAllMocks();
});

describe('automationRepository', () => {
  test('createAutomation memanggil RPC kontrak dan memetakan hasil', async () => {
    supabase.rpc.mockResolvedValue({
      data: {
        id: 'automation-1',
        pocket_item_id: 'item-1',
        frequency: 'weekly',
        start_date: '2026-11-25',
        next_run_at: '2026-11-25T00:00:00+07:00',
        timezone: 'Asia/Jakarta',
        is_active: true,
      },
      error: null,
    });

    const result = await automationRepository.createAutomation({
      pocketId: 'pocket-1',
      name: 'Planned Expense',
      amount: 250000,
      fundId: 'fund-1',
      frequency: 'weekly',
      startDate: '2026-11-25',
      timezone: 'Asia/Jakarta',
    });

    expect(supabase.rpc).toHaveBeenCalledWith('rpc_create_automation', {
      p_pocket_id: 'pocket-1',
      p_name: 'Planned Expense',
      p_amount: 250000,
      p_fund_id: 'fund-1',
      p_frequency: 'weekly',
      p_start_date: '2026-11-25',
      p_timezone: 'Asia/Jakarta',
    });
    expect(result).toMatchObject({
      id: 'automation-1',
      pocketItemId: 'item-1',
      isActive: true,
    });
  });

  test('listAutomations memetakan nominal dan item template', async () => {
    supabase.from.mockReturnValue(
      mockSelect([
        {
          id: 'automation-1',
          pocket_item_id: 'item-1',
          frequency: 'monthly',
          start_date: '2026-11-25',
          next_run_at: null,
          timezone: 'Asia/Jakarta',
          is_active: true,
          item: [
            {
              id: 'item-1',
              name: 'Sewa',
              amount: '1500000.00',
              fund_id: 'fund-1',
              status: 'template',
              pocket_id: 'pocket-1',
            },
          ],
        },
      ])
    );

    const [automation] = await automationRepository.listAutomations();

    expect(supabase.from).toHaveBeenCalledWith('automations');
    expect(automation.item).toMatchObject({
      id: 'item-1',
      name: 'Sewa',
      amount: 1500000,
      status: 'template',
      pocketId: 'pocket-1',
    });
  });

  test('confirmOccurrence meneruskan nominal null untuk Income', async () => {
    supabase.rpc.mockResolvedValue({ data: { id: 'transaction-1' }, error: null });

    await automationRepository.confirmOccurrence({
      occurrenceId: 'occurrence-1',
      fundId: 'fund-1',
      amount: null,
    });

    expect(supabase.rpc).toHaveBeenCalledWith('rpc_confirm_occurrence', {
      p_occurrence_id: 'occurrence-1',
      p_fund_id: 'fund-1',
      p_amount: null,
    });
  });

  test('processDueAutomations memanggil RPC tanpa parameter', async () => {
    supabase.rpc.mockResolvedValue({ data: { created_occurrences: 1 }, error: null });

    await automationRepository.processDueAutomations();

    expect(supabase.rpc).toHaveBeenCalledWith('rpc_process_due_automations', {});
  });
});

describe('notificationRepository', () => {
  test('listPendingNotifications memetakan baris view', async () => {
    supabase.rpc.mockResolvedValue({
      data: [
        {
          id: 'notification-1',
          occurrence_id: 'occurrence-1',
          automation_id: 'automation-1',
          pocket_id: 'pocket-1',
          pocket_name: 'Rumah',
          pocket_type: 'expense',
          pocket_item_id: 'item-1',
          item_name: 'Sewa',
          template_amount: '1500000.00',
          default_fund_id: 'fund-1',
          scheduled_for: '2026-11-25T00:00:00+07:00',
          created_at: '2026-11-25T00:00:00Z',
        },
      ],
      error: null,
    });

    const [notification] = await notificationRepository.listPendingNotifications();

    expect(supabase.rpc).toHaveBeenCalledWith('rpc_get_pending_notifications');
    expect(notification).toMatchObject({
      id: 'notification-1',
      occurrenceId: 'occurrence-1',
      pocketType: 'expense',
      itemName: 'Sewa',
      templateAmount: 1500000,
      defaultFundId: 'fund-1',
    });
  });
});
