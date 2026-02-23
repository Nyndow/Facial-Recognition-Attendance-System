// app/sessionByClass.tsx

import { useLocalSearchParams, useRouter } from 'expo-router';
import { useCallback, useEffect, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  ScrollView,
  StyleSheet,
  Text,
  View,
  Pressable,
} from 'react-native';
import { API_BASE_URL } from '@/constants/env';

type SessionItem = {
  id: number;
  room: string;
  subject: string;
  time: string;
  teacher_name: string | null;
  class_name: string | null;
};

function getDateOnly(value: string) {
  return value?.slice(0, 10) ?? '';
}

function getLocalTodayDate() {
  const now = new Date();
  return now.toISOString().slice(0, 10);
}

export default function SessionByClassPage() {
  const router = useRouter();
  const params = useLocalSearchParams<{ token?: string }>();
  const token = (params.token ?? '').toString();

  const [sessions, setSessions] = useState<SessionItem[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [status, setStatus] = useState('');

  const todayDate = useMemo(() => getLocalTodayDate(), []);

  const loadSessions = useCallback(async () => {
    if (!token) return;

    setIsLoading(true);
    try {
      const res = await fetch(`${API_BASE_URL}/sessions`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
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

  return (
    <ScrollView style={styles.page} contentContainerStyle={styles.container}>
      <Text style={styles.title}>Class Sessions</Text>
      <Text style={styles.status}>{status}</Text>
      {isLoading && <ActivityIndicator />}

      {sessions.map((session) => {
        const isToday = getDateOnly(session.time) === todayDate;

        return (
          <Pressable
            key={session.id}
            style={[styles.card, isToday && styles.todayCard]}
            onPress={() =>
              router.push({
                pathname: '/sessionInfo',
                params: {
                  sessionId: String(session.id),
                  token,
                },
              })
            }
          >
            <Text style={styles.subject}>{session.subject}</Text>
            <Text style={styles.meta}>Room: {session.room}</Text>
            <Text style={styles.meta}>Class: {session.class_name}</Text>
            <Text style={styles.meta}>Teacher: {session.teacher_name}</Text>
          </Pressable>
        );
      })}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  page: { backgroundColor: '#f8fafc' },
  container: { padding: 16, gap: 12 },
  title: { fontSize: 26, fontWeight: '800' },
  status: { color: '#64748b' },
  card: {
    backgroundColor: '#ffffff',
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#e2e8f0',
  },
  todayCard: {
    borderColor: '#16a34a',
    backgroundColor: '#f0fdf4',
  },
  subject: { fontSize: 18, fontWeight: '700' },
  meta: { color: '#475569' },
});