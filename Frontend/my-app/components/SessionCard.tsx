import { Pressable, StyleSheet, Text, View } from 'react-native';
import { useRouter } from 'expo-router';

export type SessionItem = {
  id: number;
  room: string;
  subject: string;
  time: string;
  teacher_name: string | null;
  class_name: string | null;
};

type Props = {
  session: SessionItem;
  token: string;
  isToday: boolean;
};

export default function SessionCard({ session, token, isToday }: Props) {
  const router = useRouter();

  return (
    <Pressable
      style={[styles.card, isToday && styles.todayCard]}
      onPress={() =>
        router.push({
          pathname: '/sessionInfo',
          params: { sessionId: String(session.id), token },
        })
      }
    >
      <Text style={styles.subject}>{session.subject}</Text>
      <Text style={styles.meta}>Room: {session.room || '-'}</Text>
      <Text style={styles.meta}>Class: {session.class_name || '-'}</Text>
      <Text style={styles.meta}>Teacher: {session.teacher_name || '-'}</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: '#fff',
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#e2e8f0',
    marginBottom: 12,
    shadowColor: '#000',
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  todayCard: {
    borderColor: '#16a34a',
    backgroundColor: '#f0fdf4',
  },
  subject: { fontSize: 18, fontWeight: '700', marginBottom: 4 },
  meta: { color: '#475569', fontSize: 14 },
});