import { authService } from '@/appservices/auth/authService';
import { authRepository } from '@/data/repositories/authRepository';
import { toAppError } from '@/shared/utils/errors';

jest.mock('@/data/repositories/authRepository', () => ({
  authRepository: {
    getSession: jest.fn(),
    getUser: jest.fn(),
    signIn: jest.fn(),
    signUp: jest.fn(),
    signOut: jest.fn(),
    onAuthStateChange: jest.fn(),
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
