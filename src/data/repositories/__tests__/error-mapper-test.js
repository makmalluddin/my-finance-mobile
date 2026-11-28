import { mapRepositoryError, toMoney } from '@/data/repositories/error-mapper';

describe('mapRepositoryError', () => {
  test('kode error RPC menjadi AppError dengan detail JSON', () => {
    const error = mapRepositoryError({
      message: 'FUND_BALANCE_NOT_ZERO',
      details: '{"fund_id":"fund-1","balance":"50000.00"}',
    });

    expect(error).toMatchObject({
      code: 'FUND_BALANCE_NOT_ZERO',
      message: 'Fund masih memiliki saldo dan tidak dapat diarsipkan.',
      details: { fund_id: 'fund-1', balance: '50000.00' },
    });
  });

  test('error jaringan diterjemahkan menjadi pesan aman', () => {
    expect(mapRepositoryError({ message: 'Network request failed' })).toMatchObject({
      code: 'NETWORK_ERROR',
    });
  });

  test('error tidak dikenali memakai fallback', () => {
    expect(mapRepositoryError({ message: 'kegagalan aneh' }, 'Gagal memuat Fund.')).toMatchObject({
      code: 'UNKNOWN_ERROR',
      message: 'Gagal memuat Fund.',
    });
  });
});

describe('toMoney', () => {
  test('numeric string dari PostgREST diubah menjadi angka', () => {
    expect(toMoney('1500000.50')).toBe(1500000.5);
    expect(toMoney(null)).toBe(0);
  });
});
