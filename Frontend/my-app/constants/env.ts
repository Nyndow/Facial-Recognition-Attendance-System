const FALLBACK_BASE_URL = 'http://127.0.0.1:5000';

export const API_BASE_URL = String(
  process.env.EXPO_PUBLIC_API_BASE_URL ?? FALLBACK_BASE_URL
).replace(/\/$/, '');
