export function getTodayTimerHistory(): Record<string, number> {
  const d = new Date();
  const key = `timer-history-${d.getFullYear()}-${d.getMonth() + 1}-${d.getDate()}`;
  const raw = localStorage.getItem(key);
  return raw ? JSON.parse(raw) : {};
}

export function msToHours(ms: number): number {
  return Number((ms / (1000 * 60 * 60)).toFixed(2));
}
