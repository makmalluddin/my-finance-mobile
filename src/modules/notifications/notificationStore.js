let pending = [];

const listeners = new Set();

export function getPendingNotifications() {
  return pending;
}

export function setPendingNotifications(next) {
  pending = Array.isArray(next) ? next : [];
  listeners.forEach((listener) => listener());
}

export function subscribePendingNotifications(listener) {
  listeners.add(listener);
  return () => listeners.delete(listener);
}
