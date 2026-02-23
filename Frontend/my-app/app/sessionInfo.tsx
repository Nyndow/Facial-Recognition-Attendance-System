import { ScrollView, ActivityIndicator, StyleSheet, Text, View } from 'react-native';
import { useLocalSearchParams } from 'expo-router';
import useSessions from '@/hooks/useSessions';
import SessionCard from '@/components/SessionCard';
import { getDateOnly, getLocalTodayDate } from '@/utils/date';

export default function SessionByClassPage() {
  const params = useLocalSearchParams<{ token?: string }>();
  const token = params.token ?? '';

  const { sessions, isLoading, status } = useSessions(token);

  const todayDate = getLocalTodayDate();

  return (
    <ScrollView style={styles.page} contentContainerStyle={styles.container}>
      <Text style={styles.title}>Class Sessions</Text>
      <Text style={styles.status}>{status}</Text>

      {isLoading && <ActivityIndicator size="large" color="#16a34a" style={{ marginVertical: 16 }} />}

      {sessions.map((session) => (
        <SessionCard
          key={session.id}
          session={session}
          token={token}
          isToday={getDateOnly(session.time) === todayDate}
        />
      ))}

      {!isLoading && sessions.length === 0 && (
        <View style={styles.emptyContainer}>
          <Text style={styles.emptyText}>No sessions found.</Text>
        </View>
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  page: { backgroundColor: '#f8fafc', flex: 1 },
  container: { padding: 16 },
  title: { fontSize: 28, fontWeight: '800', marginBottom: 8 },
  status: { color: '#64748b', marginBottom: 16 },
  emptyContainer: { marginTop: 32, alignItems: 'center' },
  emptyText: { color: '#64748b', fontSize: 16 },
});