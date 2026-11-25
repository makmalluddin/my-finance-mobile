import { automationRepository } from '@/data/repositories/automationRepository';
import { addDays, fromDateKey, toDateKey } from '@/shared/utils/date';
import { AppError, getErrorMessage } from '@/shared/utils/errors';

export const AUTOMATION_FREQUENCIES = new Set(['weekly', 'every_two_weeks', 'monthly']);

const FREQUENCY_DAYS = {
  weekly: 7,
  every_two_weeks: 14,
};

function fail(code, message) {
  throw new AppError(code, message ?? getErrorMessage(code));
}

function validateId(value, code) {
  if (typeof value !== 'string' || value.trim() === '') {
    fail(code);
  }
  return value;
}

function validateName(value) {
  const name = typeof value === 'string' ? value.trim() : '';
  if (!name) {
    fail('VALIDATION_ERROR', 'Nama item wajib diisi.');
  }
  return name;
}

function validateAmount(value) {
  const amount = Number(value);
  if (!Number.isFinite(amount) || amount <= 0) {
    fail('INVALID_AMOUNT');
  }
  if (Math.abs(amount * 100 - Math.round(amount * 100)) > 1e-6) {
    fail('INVALID_AMOUNT', 'Nominal maksimal dua angka desimal.');
  }
  return amount;
}

function validateFrequency(value) {
  if (!AUTOMATION_FREQUENCIES.has(value)) {
    fail('INVALID_FREQUENCY');
  }
  return value;
}

function validateStartDate(value) {
  const date = typeof value === 'string' ? fromDateKey(value) : value;
  if (!(date instanceof Date) || Number.isNaN(date.getTime())) {
    fail('INVALID_DATE');
  }
  return date;
}

function validateTimezone(value) {
  const timezone = typeof value === 'string' ? value.trim() : '';
  if (!timezone) {
    fail('VALIDATION_ERROR', 'Zona waktu wajib diisi.');
  }
  return timezone;
}

/** Zona waktu perangkat saat Automation dibuat. Perubahan berikutnya tidak otomatis mengubah template. */
export function getDeviceTimezone() {
  try {
    return Intl.DateTimeFormat().resolvedOptions().timeZone || 'UTC';
  } catch {
    return 'UTC';
  }
}

function daysBetweenLocalDates(from, to) {
  const fromUtc = Date.UTC(from.getFullYear(), from.getMonth(), from.getDate());
  const toUtc = Date.UTC(to.getFullYear(), to.getMonth(), to.getDate());
  return Math.round((toUtc - fromUtc) / 86400000);
}

function monthlyCandidate(start, index) {
  const year = start.getFullYear();
  const month = start.getMonth() + index;
  const lastDay = new Date(year, month + 1, 0).getDate();
  return new Date(year, month, Math.min(start.getDate(), lastDay));
}

/**
 * Tanggal jadwal pertama setelah `afterDate`. Dipakai untuk preview dan tes;
 * pembuatan occurrence tetap dihitung backend di zona waktu Automation.
 */
export function nextScheduleDate(startDate, frequency, afterDate) {
  const start = validateStartDate(startDate);
  const after = validateStartDate(afterDate);
  const step = FREQUENCY_DAYS[frequency];

  if (after < start) {
    return start;
  }

  if (step) {
    const elapsed = Math.max(0, daysBetweenLocalDates(start, after));
    let index = Math.floor(elapsed / step) + 1;
    let candidate = addDays(start, index * step);
    while (candidate <= after) {
      index += 1;
      candidate = addDays(start, index * step);
    }
    return candidate;
  }

  let index = Math.max(
    0,
    (after.getFullYear() - start.getFullYear()) * 12 + (after.getMonth() - start.getMonth())
  );
  let candidate = monthlyCandidate(start, index);
  while (candidate <= after) {
    index += 1;
    candidate = monthlyCandidate(start, index);
  }
  return candidate;
}

function normalizeAutomationInput(input) {
  return {
    name: validateName(input.name),
    amount: validateAmount(input.amount),
    fundId: validateId(input.fundId, 'FUND_NOT_FOUND'),
    frequency: validateFrequency(input.frequency),
    startDate: toDateKey(validateStartDate(input.startDate)),
    timezone: validateTimezone(input.timezone ?? getDeviceTimezone()),
  };
}

/**
 * Satu-satunya jalur mutasi Automation untuk Presentation Layer. Transaksi
 * aktual dan siklus occurrence sepenuhnya ditentukan RPC di backend.
 */
export const automationService = {
  listAutomations() {
    return automationRepository.listAutomations();
  },

  listOccurrences({ automationId } = {}) {
    return automationRepository.listOccurrences({ automationId });
  },

  createAutomation(input = {}) {
    return automationRepository.createAutomation({
      pocketId: validateId(input.pocketId, 'POCKET_NOT_FOUND'),
      ...normalizeAutomationInput(input),
    });
  },

  updateAutomation(input = {}) {
    return automationRepository.updateAutomation({
      automationId: validateId(input.automationId, 'AUTOMATION_NOT_FOUND'),
      ...normalizeAutomationInput(input),
    });
  },

  deleteAutomation(automationId) {
    return automationRepository.deleteAutomation(validateId(automationId, 'AUTOMATION_NOT_FOUND'));
  },

  processDueAutomations() {
    return automationRepository.processDueAutomations();
  },

  confirmOccurrence(input = {}) {
    const amount = input.amount === undefined || input.amount === null || input.amount === ''
      ? null
      : validateAmount(input.amount);

    if (amount !== null && input.pocketType === 'income') {
      fail('AMOUNT_NOT_ALLOWED');
    }

    return automationRepository.confirmOccurrence({
      occurrenceId: validateId(input.occurrenceId, 'OCCURRENCE_NOT_FOUND'),
      fundId: validateId(input.fundId, 'FUND_NOT_FOUND'),
      amount,
    });
  },

  rejectOccurrence(occurrenceId) {
    return automationRepository.rejectOccurrence(validateId(occurrenceId, 'OCCURRENCE_NOT_FOUND'));
  },
};

export default automationService;
