import { authService } from '@/appservices/auth/authService';
import { authRepository } from '@/data/repositories/authRepository';
import { loginHistoryRepository } from '@/data/repositories/loginHistoryRepository';
import { toAppError } from '@/shared/utils/errors';

jest.mock('@/data/repositories/authRepository', () => ({
  authRepository: {
    getSession: jest.fn(),
    getUser: jest.fn(),
    signIn: jest.fn(),
    signUp: jest.fn(),
    signOut: jest.fn(),
    updateUser: jest.fn(),
    onAuthStateChange: jest.fn(),
  },
}));

jest.mock('@/data/repositories/loginHistoryRepository', () => ({
  loginHistoryRepository: {
    list: jest.fn(),
    remember: jest.fn(),
    remove: jest.fn(),
    clear: jest.fn(),
  },
}));

beforeEach(() => {
  jest.resetAllMocks();
});

describe('authService', () => {
  test('signIn menormalkan email sebelum memanggil repository', async () => {
    authRepository.signIn.mockResolvedValue({
      data: { session: { access_token: 'token' } },
      error: null,
    });

    const data = await authService.signIn({
      email: '  User@Example.COM ',
      password: 'rahasia',
    });

    expect(authRepository.signIn).toHaveBeenCalledWith({
      email: 'user@example.com',
      password: 'rahasia',
    });
    expect(data.session.access_token).toBe('token');
  });

  test('email tidak valid ditolak sebelum memanggil backend', async () => {
    await expect(
      authService.signIn({ email: 'bukan-email', password: 'rahasia' })
    ).rejects.toMatchObject({ code: 'INVALID_EMAIL' });
    expect(authRepository.signIn).not.toHaveBeenCalled();
  });

  test('signUp menolak kata sandi kurang dari enam karakter', async () => {
    await expect(
      authService.signUp({ email: 'user@example.com', password: '12345' })
    ).rejects.toMatchObject({ code: 'WEAK_PASSWORD' });
    expect(authRepository.signUp).not.toHaveBeenCalled();
  });

  test('pesan error Supabase diterjemahkan menjadi pesan aman', async () => {
    authRepository.signIn.mockResolvedValue({
      data: null,
      error: { message: 'Invalid login credentials' },
    });

    await expect(
      authService.signIn({ email: 'user@example.com', password: 'salah' })
    ).rejects.toMatchObject({
      code: 'INVALID_CREDENTIALS',
      message: 'Email atau kata sandi salah.',
    });
  });

  test('signOut menggagalkan proses saat backend mengembalikan error jaringan', async () => {
    authRepository.signOut.mockResolvedValue({
      error: { message: 'Failed to fetch' },
    });

    await expect(authService.signOut()).rejects.toMatchObject({ code: 'NETWORK_ERROR' });
  });

  test('subscribe mengembalikan fungsi unsubscribe', () => {
    const unsubscribe = jest.fn();
    authRepository.onAuthStateChange.mockReturnValue({
      data: { subscription: { unsubscribe } },
    });

    const dispose = authService.subscribe(jest.fn());
    dispose();

    expect(unsubscribe).toHaveBeenCalledTimes(1);
  });

  test('updateDisplayName memangkas spasi dan mengirim metadata', async () => {
    const user = { id: 'user-1', user_metadata: { display_name: 'Nadia' } };
    authRepository.updateUser.mockResolvedValue({ data: { user }, error: null });

    const result = await authService.updateDisplayName('  Nadia  ');

    expect(authRepository.updateUser).toHaveBeenCalledWith({
      data: { display_name: 'Nadia' },
    });
    expect(result).toEqual(user);
  });

  test('updateDisplayName mengosongkan metadata untuk fallback User', async () => {
    authRepository.updateUser.mockResolvedValue({
      data: { user: { id: 'user-1' } },
      error: null,
    });

    await authService.updateDisplayName('   ');

    expect(authRepository.updateUser).toHaveBeenCalledWith({
      data: { display_name: null },
    });
  });

  test('updateDisplayName menolak nama lebih dari 50 karakter', async () => {
    await expect(authService.updateDisplayName('a'.repeat(51))).rejects.toMatchObject({
      code: 'VALIDATION_ERROR',
      message: 'Nama pengguna maksimal 50 karakter.',
    });
    expect(authRepository.updateUser).not.toHaveBeenCalled();
  });

  test('updateDisplayName menerjemahkan error backend dengan aman', async () => {
    authRepository.updateUser.mockResolvedValue({
      data: null,
      error: { message: 'Failed to fetch' },
    });

    await expect(authService.updateDisplayName('Nadia')).rejects.toMatchObject({
      code: 'NETWORK_ERROR',
    });
  });
});

describe('authService — riwayat email login', () => {
  test('signIn berhasil menyimpan email yang sudah dinormalkan', async () => {
    authRepository.signIn.mockResolvedValue({
      data: { session: { access_token: 'token' } },
      error: null,
    });

    await authService.signIn({ email: '  User@Example.COM ', password: 'rahasia' });

    expect(loginHistoryRepository.remember).toHaveBeenCalledWith('user@example.com');
  });

  test('signIn gagal tidak menyimpan riwayat', async () => {
    authRepository.signIn.mockResolvedValue({
      data: null,
      error: { message: 'Invalid login credentials' },
    });

    await expect(
      authService.signIn({ email: 'user@example.com', password: 'salah' })
    ).rejects.toMatchObject({ code: 'INVALID_CREDENTIALS' });
    expect(loginHistoryRepository.remember).not.toHaveBeenCalled();
  });

  test('signIn tetap berhasil walau penyimpanan riwayat gagal', async () => {
    authRepository.signIn.mockResolvedValue({
      data: { session: { access_token: 'token' } },
      error: null,
    });
    loginHistoryRepository.remember.mockRejectedValue(new Error('storage error'));

    await expect(
      authService.signIn({ email: 'user@example.com', password: 'rahasia' })
    ).resolves.toMatchObject({ session: { access_token: 'token' } });
  });

  test('signUp tidak menyimpan riwayat', async () => {
    authRepository.signUp.mockResolvedValue({ data: { user: {} }, error: null });

    await authService.signUp({ email: 'user@example.com', password: 'rahasia123' });

    expect(loginHistoryRepository.remember).not.toHaveBeenCalled();
  });

  test('listLoginHistory diteruskan ke repository', async () => {
    const entries = [{ email: 'user@example.com', lastUsedAt: '2026-11-28T00:00:00.000Z' }];
    loginHistoryRepository.list.mockResolvedValue(entries);

    await expect(authService.listLoginHistory()).resolves.toEqual(entries);
  });

  test('removeLoginEmail menormalkan email sebelum menghapus', async () => {
    loginHistoryRepository.remove.mockResolvedValue([]);

    await authService.removeLoginEmail('  User@Example.COM  ');

    expect(loginHistoryRepository.remove).toHaveBeenCalledWith('user@example.com');
  });

  test('clearLoginHistory diteruskan ke repository', async () => {
    loginHistoryRepository.clear.mockResolvedValue([]);

    await expect(authService.clearLoginHistory()).resolves.toEqual([]);
    expect(loginHistoryRepository.clear).toHaveBeenCalledTimes(1);
  });
});

describe('toAppError untuk Auth', () => {
  test('email belum dikonfirmasi dikenali', () => {
    expect(toAppError({ message: 'Email not confirmed' })).toMatchObject({
      code: 'EMAIL_NOT_CONFIRMED',
    });
  });

  test('pesan yang tidak dikenali tetap memakai fallback', () => {
    expect(toAppError({ message: 'kesalahan teknis' }, 'Gagal memproses akun.')).toMatchObject({
      code: 'UNKNOWN_ERROR',
      message: 'Gagal memproses akun.',
    });
  });
});
