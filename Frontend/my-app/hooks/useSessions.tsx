import { useCallback, useEffect, useState } from 'react';
import { API_BASE_URL } from '@/constants/env';
import type { SessionItem } from '@/components/SessionCard';

export default function useSessions(token?: string) {
  const [sessions, setSessions] = useState<SessionItem[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [status, setStatus] = useState('');

  const loadSessions = useCallback(async () => {
    if (!token) return;

    setIsLoading(true);
    try {
      const res = await fetch(`${API_BASE_URL}/sessions`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      const data = await res.json();
      setSessions(data);
      setStatus(`Loaded ${data.length} sessions`);
    } catch (e) {
      setStatus('Failed to load sessions');
    } finally {
      setIsLoading(false);
    }
  }, [token]);

  useEffect(() => {
    loadSessions();
  }, [loadSessions]);

  return { sessions, isLoading, status, reload: loadSessions };
}