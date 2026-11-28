const MORNING_START_HOUR = 5;
const AFTERNOON_START_HOUR = 12;
const EVENING_START_HOUR = 18;

/**
 * Sapaan Dashboard mengikuti jam perangkat. Batas mengikuti kebiasaan umum:
 * pagi 05.00–11.59, siang 12.00–17.59, malam 18.00–04.59.
 */
export function getGreeting(date = new Date()) {
  const hour = date.getHours();

  if (hour >= MORNING_START_HOUR && hour < AFTERNOON_START_HOUR) {
    return 'Good morning';
  }

  if (hour >= AFTERNOON_START_HOUR && hour < EVENING_START_HOUR) {
    return 'Good afternoon';
  }

  return 'Good evening';
}

export default getGreeting;
