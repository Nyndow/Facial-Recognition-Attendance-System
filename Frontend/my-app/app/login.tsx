import { Link, useRouter } from 'expo-router';
import { useEffect, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useResponsiveContentStyle } from '@/hooks/use-responsive-content';
import { API_BASE_URL } from '@/constants/env';

export default function LoginPage() {
  const router = useRouter();
  const responsiveContentStyle = useResponsiveContentStyle({ paddingVertical: 20 });
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [status, setStatus] = useState('Enter credentials and press Login.');
  const [profile, setProfile] = useState('');

  // Check if a token already exists
  useEffect(() => {
    const checkToken = async () => {
      try {
        const token = await AsyncStorage.getItem('jwt_token');
        if (token) {
          // Redirect automatically if logged in
          router.replace({
            pathname: '/sessionByClass',
            params: { token },
          });
        }
      } catch (error) {
        console.error("Error checking for existing token:", error);
        setStatus('Login failed: Could not retrieve token.'); // Provide a more user-friendly message
      }
    };
    checkToken();
  }, []);

  const doLogin = async () => {
    setStatus('Logging in...');
    setProfile('');

    try {
      const response = await fetch(`${API_BASE_URL}/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
        body: JSON.stringify({ username, password }),
      });

      const raw = await response.text();
      let parsed: Record<string, any> = {};
      try {
        parsed = JSON.parse(raw);
      } catch {
        parsed = { message: raw };
      }

      if (!response.ok) {
        setStatus(`Login failed (${response.status}): ${String(parsed.error ?? raw)}`);
        return;
      }

      const token = String(parsed.token ?? '');
      if (!token) {
        setStatus('Login failed: no token returned');
        return;
      }

      // Store token in AsyncStorage
      await AsyncStorage.setItem('jwt_token', token);

      setStatus('Login success. Redirecting...');
      router.replace({
        pathname: '/sessionByClass',
        params: { token },
      });
    } catch (error) {
      setStatus(`Login request failed: ${String(error)}`);
    }
  };

  const checkCurrentUser = async () => {
    const token = await AsyncStorage.getItem('jwt_token');
    if (!token) {
      setStatus('Please login first.');
      return;
    }

    setStatus('Checking /auth/me ...');
    try {
      const response = await fetch(`${API_BASE_URL}/auth/me`, {
        method: 'GET',
        headers: { Accept: 'application/json', Authorization: `Bearer ${token}` },
      });

      const raw = await response.text();
      setProfile(raw);
      setStatus(`Auth check complete (${response.status}).`);
    } catch (error) {
      setStatus(`Auth check failed: ${String(error)}`);
    }
  };

  return (
    <ScrollView style={styles.page} contentContainerStyle={[styles.container]}>

      <Text style={styles.label}>Username</Text>
      <TextInput style={styles.input} value={username} onChangeText={setUsername} autoCapitalize="none" />

      <Text style={styles.label}>Password</Text>
      <TextInput
        style={styles.input}
        value={password}
        onChangeText={setPassword}
        secureTextEntry
        autoCapitalize="none"
      />

      <Pressable style={styles.button} onPress={doLogin}>
        <Text style={styles.buttonText}>Login</Text>
      </Pressable>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  page: { backgroundColor: '#f8fafc' },
  container: { gap: 10, paddingBottom: 40, justifyContent: "center" },
  title: { fontSize: 28, fontWeight: '800', color: '#0f172a' },
  subtitle: { color: '#475569', marginBottom: 4 },
  label: { color: '#0f172a', fontWeight: '600' },
  input: { borderWidth: 1, borderColor: '#cbd5e1', borderRadius: 10, paddingHorizontal: 12, paddingVertical: 10, backgroundColor: '#ffffff' },
  button: { marginTop: 4, backgroundColor: '#1d4ed8', borderRadius: 10, paddingVertical: 12, alignItems: 'center' },
  buttonText: { color: '#ffffff', fontWeight: '700' },
  secondaryButton: { backgroundColor: '#e2e8f0', borderRadius: 10, paddingVertical: 10, alignItems: 'center' },
  secondaryButtonText: { color: '#1e293b', fontWeight: '700' },
  statusBox: { borderWidth: 1, borderColor: '#e2e8f0', borderRadius: 10, padding: 12, backgroundColor: '#ffffff', gap: 8 },
  statusText: { color: '#334155' },
  profileText: { fontFamily: 'monospace', color: '#0f172a' },
  sectionTitle: { marginTop: 8, fontSize: 18, fontWeight: '700', color: '#0f172a' },
  navGrid: { gap: 10 },
  navCard: { borderWidth: 1, borderColor: '#cbd5e1', borderRadius: 12, padding: 12, backgroundColor: '#ffffff' },
  navTitle: { fontWeight: '700', color: '#0f172a' },
  navSub: { color: '#475569', marginTop: 2 },
  link: { marginTop: 2, color: '#1d4ed8', fontWeight: '700' },
});
