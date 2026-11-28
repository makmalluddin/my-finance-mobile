import Storage from 'expo-sqlite/kv-store';
import { loginHistoryRepository } from '@/data/repositories/loginHistoryRepository';

jest.mock('expo-sqlite/kv-store', () => ({
  __esModule: true,
  default: {
    getItem: jest.fn(),
    setItem: jest.fn(),
    removeItem: jest.fn(),
  },
}));

const STORAGE_KEY = 'udins.login_history';

let store;

beforeEach(() => {
  jest.resetAllMocks();
  store = {};

  Storage.getItem.mockImplementation(async (key) => store[key] ?? null);
  Storage.setItem.mockImplementation(async (key, value) => {
    store[key] = value;
  });
  Storage.removeItem.mockImplementation(async (key) => {
    delete store[key];
  });
});

describe('loginHistoryRepository', () => {
  test('list mengembalikan array kosong saat belum ada riwayat', async () => {
    await expect(loginHistoryRepository.list()).resolves.toEqual([]);
    expect(Storage.getItem).toHaveBeenCalledWith(STORAGE_KEY);
  });

  test('remember menormalkan email dan menyimpan waktu terakhir', async () => {
    const result = await loginHistoryRepository.remember('  User@Example.COM  ');

    expect(result).toEqual([
      { email: 'user@example.com', lastUsedAt: expect.any(String) },
    ]);
    expect(JSON.parse(store[STORAGE_KEY])[0].email).toBe('user@example.com');
    expect(Number.isNaN(Date.parse(JSON.parse(store[STORAGE_KEY])[0].lastUsedAt))).toBe(false);
  });

  test('remember memindahkan email yang sama ke urutan teratas tanpa duplikat', async () => {
    await loginHistoryRepository.remember('first@example.com');
    await loginHistoryRepository.remember('second@example.com');
    const result = await loginHistoryRepository.remember(' FIRST@example.com ');

    expect(result.map((entry) => entry.email)).toEqual([
      'first@example.com',
      'second@example.com',
    ]);
  });

  test('remember membatasi riwayat maksimal lima email terakhir', async () => {
    for (let index = 1; index <= 7; index += 1) {
      await loginHistoryRepository.remember(`user${index}@example.com`);
    }

    const result = await loginHistoryRepository.list();

    expect(result).toHaveLength(5);
    expect(result.map((entry) => entry.email)).toEqual([
      'user7@example.com',
      'user6@example.com',
      'user5@example.com',
      'user4@example.com',
      'user3@example.com',
    ]);
  });

  test('remember mengabaikan email yang tidak valid', async () => {
    const result = await loginHistoryRepository.remember('bukan-email');

    expect(result).toEqual([]);
    expect(Storage.setItem).not.toHaveBeenCalled();
  });

  test('remove menghapus satu email dan mempertahankan sisinya', async () => {
    await loginHistoryRepository.remember('first@example.com');
    await loginHistoryRepository.remember('second@example.com');

    const result = await loginHistoryRepository.remove(' FIRST@Example.com ');

    expect(result.map((entry) => entry.email)).toEqual(['second@example.com']);
  });

  test('clear menghapus seluruh riwayat dari storage', async () => {
    await loginHistoryRepository.remember('user@example.com');

    const result = await loginHistoryRepository.clear();

    expect(result).toEqual([]);
    expect(Storage.removeItem).toHaveBeenCalledWith(STORAGE_KEY);
    expect(store[STORAGE_KEY]).toBeUndefined();
  });

  test('data rusak dibaca sebagai riwayat kosong', async () => {
    store[STORAGE_KEY] = '{json-tidak-valid';

    await expect(loginHistoryRepository.list()).resolves.toEqual([]);
  });

  test('data berbentuk objek dibaca sebagai riwayat kosong', async () => {
    store[STORAGE_KEY] = JSON.stringify({ email: 'user@example.com' });

    await expect(loginHistoryRepository.list()).resolves.toEqual([]);
  });

  test('entri rusak dibuang saat membaca riwayat', async () => {
    store[STORAGE_KEY] = JSON.stringify([
      null,
      { email: 'bukan-email' },
      { email: 'valid@example.com', lastUsedAt: '2026-11-28T00:00:00.000Z' },
    ]);

    await expect(loginHistoryRepository.list()).resolves.toEqual([
      { email: 'valid@example.com', lastUsedAt: '2026-11-28T00:00:00.000Z' },
    ]);
  });
});
