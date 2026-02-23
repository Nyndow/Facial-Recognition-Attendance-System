import { DarkTheme, DefaultTheme, ThemeProvider } from '@react-navigation/native';
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import 'react-native-reanimated';

import { HeaderUserButton } from '@/components/header-user-button';
import { AppThemeProvider, useAppTheme } from '@/context/theme-context';

function RootLayoutInner() {
  const appTheme = useAppTheme();
  const colorScheme = appTheme?.colorScheme ?? 'light';

  return (
    <ThemeProvider value={colorScheme === 'dark' ? DarkTheme : DefaultTheme}>
      <Stack
        screenOptions={{
          headerRight: () => <HeaderUserButton />,
          headerTitleAlign: 'left',
          headerShadowVisible: false,
          headerStyle: { backgroundColor: '#f8fafc' },
          headerTitleStyle: { fontWeight: '700', color: '#0f172a' },
        }}>
        <Stack.Screen name="index" options={{ headerShown: false }} />
        <Stack.Screen name="login" options={{ title: '', headerRight: () => null }} />
        <Stack.Screen name="sessionByClass" options={{ title: '' }} />
        <Stack.Screen name="studentPage" options={{ title: '' }} />
        <Stack.Screen name="sessionPage" options={{ title: '' }} />
        <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
      </Stack>
      <StatusBar style="auto" />
    </ThemeProvider>
  );
}

export default function RootLayout() {
  return (
    <AppThemeProvider>
      <RootLayoutInner />
    </AppThemeProvider>
  );
}
