export function getDateOnly(value: string) {
  return value?.slice(0, 10) ?? '';
}

export function getLocalTodayDate() {
  const now = new Date();
  return now.toISOString().slice(0, 10);
}