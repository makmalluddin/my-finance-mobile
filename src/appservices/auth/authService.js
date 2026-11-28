import { authRepository } from '@/data/repositories/authRepository';
import { AppError, getErrorMessage, toAppError } from '@/shared/utils/errors';

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const MIN_PASSWORD_LENGTH = 6;
const MAX_DISPLAY_NAME_LENGTH = 50;

function normalizeEmail(email) {
  return typeof email === 'string' ? email.trim().toLowerCase() : '';
}

function validateCredentials({ email, password }, { checkStrength = false } = {}) {
  const normalizedEmail = normalizeEmail(email);

  if (!EMAIL_PATTERN.test(normalizedEmail)) {
    throw new AppError('INVALID_EMAIL', getErrorMessage('INVALID_EMAIL'));
  }
  if (typeof password !== 'string' || password.length === 0) {
    throw new AppError('INVALID_PASSWORD', getErrorMessage('INVALID_PASSWORD'));
  }
  if (checkStrength && password.length < MIN_PASSWORD_LENGTH) {
    throw new AppError('WEAK_PASSWORD', getErrorMessage('WEAK_PASSWORD'));
  }

  return { email: normalizedEmail, password };
}

/**
 * Orkestrasi autentikasi. UI tidak memanggil Supabase Auth secara langsung.
 * Semua kegagalan dinormalkan menjadi AppError agar pesannya aman ditampilkan.
 */
export const authService = {
  async getSession() {
    const { data, error } = await authRepository.getSession();
    if (error) {
      throw toAppError(error, getErrorMessage('AUTH_ERROR'));
    }
    return data?.session ?? null;
  },

  async signIn(credentials) {
    const payload = validateCredentials(credentials);
    const { data, error } = await authRepository.signIn(payload);
    if (error) {
      throw toAppError(error, getErrorMessage('AUTH_ERROR'));
    }
    return data;
  },

  async signUp(credentials) {
    const payload = validateCredentials(credentials, { checkStrength: true });
    const { data, error } = await authRepository.signUp(payload);
    if (error) {
      throw toAppError(error, getErrorMessage('AUTH_ERROR'));
    }
    return data;
  },

  async signOut() {
    const { error } = await authRepository.signOut();
    if (error) {
      throw toAppError(error, getErrorMessage('AUTH_ERROR'));
    }
  },

  async updateDisplayName(name) {
    const displayName = typeof name === 'string' ? name.trim() : '';

    if (displayName.length > MAX_DISPLAY_NAME_LENGTH) {
      throw new AppError(
        'VALIDATION_ERROR',
        `Nama pengguna maksimal ${MAX_DISPLAY_NAME_LENGTH} karakter.`
      );
    }

    const { data, error } = await authRepository.updateUser({
      data: { display_name: displayName || null },
    });

    if (error) {
      throw toAppError(error, getErrorMessage('AUTH_ERROR'));
    }

    return data?.user ?? null;
  },

  subscribe(callback) {
    const { data } = authRepository.onAuthStateChange(callback);
    return () => data?.subscription?.unsubscribe();
  },
};

export default authService;
