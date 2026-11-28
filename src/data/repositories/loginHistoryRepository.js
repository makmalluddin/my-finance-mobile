import Storage from 'expo-sqlite/kv-store';

/**
 * Riwayat email yang pernah berhasil login, disimpan lokal di perangkat.
 * Bukan data finansial dan tidak pernah menyimpan kata sandi atau token.
 * Storage memakai expo-sqlite/kv-store yang sudah tersedia tanpa dependency baru.
 */
const STORAGE_KEY = 'udins.login_history';
const MAX_ENTRIES = 5;
const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

function normalizeEmail(email) {
  return typeof email === 'string' ? email.trim().toLowerCase() : '';
}

function normalizeEntry(entry) {
  const email = normalizeEmail(entry?.email);
  if (!EMAIL_PATTERN.test(email)) {
    return null;
  }

  return {
    email,
    lastUsedAt:
      typeof entry?.lastUsedAt === 'string' ? entry.lastUsedAt : new Date().toISOString(),
  };
}

async function readEntries() {
  try {
    const raw = await Storage.getItem(STORAGE_KEY);
    if (!raw) {
      return [];
    }

    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) {
      return [];
    }

    return parsed.map(normalizeEntry).filter(Boolean).slice(0, MAX_ENTRIES);
  } catch {
    return [];
  }
}

async function writeEntries(entries) {
  await Storage.setItem(STORAGE_KEY, JSON.stringify(entries.slice(0, MAX_ENTRIES)));
  return entries.slice(0, MAX_ENTRIES);
}

export const loginHistoryRepository = {
  async list() {
    return readEntries();
  },

  async remember(email) {
    const normalized = normalizeEmail(email);
    if (!EMAIL_PATTERN.test(normalized)) {
      return readEntries();
    }

    const current = await readEntries();
    const next = [
      { email: normalized, lastUsedAt: new Date().toISOString() },
      ...current.filter((entry) => entry.email !== normalized),
    ];

    return writeEntries(next);
  },

  async remove(email) {
    const normalized = normalizeEmail(email);
    const current = await readEntries();
    const next = current.filter((entry) => entry.email !== normalized);

    return writeEntries(next);
  },

  async clear() {
    await Storage.removeItem(STORAGE_KEY);
    return [];
  },
};

export default loginHistoryRepository;
