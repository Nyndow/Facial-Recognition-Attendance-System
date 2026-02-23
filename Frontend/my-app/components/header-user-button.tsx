import AsyncStorage from '@react-native-async-storage/async-storage';
import { useRouter } from 'expo-router';
import { useState } from 'react';
import {
  Pressable,
  StyleSheet,
  View,
  Text,
} from 'react-native';

import { IconSymbol } from '@/components/ui/icon-symbol';
import { useAppTheme } from '@/context/theme-context';

export function HeaderUserButton() {
  const router = useRouter();
  const appTheme = useAppTheme();
  const [open, setOpen] = useState(false);

  const handleLogout = async () => {
    await AsyncStorage.removeItem('jwt_token');
    setOpen(false);
    router.replace('/login');
  };

  const handleProfile = () => {
    setOpen(false);
    router.push('/profile');
  };

  const handleToggleTheme = () => {
    appTheme?.toggleColorScheme();
    setOpen(false);
  };

  const themeLabel =
    appTheme?.colorScheme === 'dark' ? 'Switch to Light' : 'Switch to Dark';

  return (
    <View style={styles.wrapper}>
      {/* ICON BUTTON */}
      <Pressable
        accessibilityRole="button"
        accessibilityLabel="User menu"
        onPress={() => setOpen((prev) => !prev)}
        hitSlop={8}
        style={({ pressed }) => [
          styles.button,
          pressed ? styles.buttonPressed : null,
        ]}
      >
        <View style={styles.iconWrap}>
          <IconSymbol name="person.crop.circle" size={26} color="#0f172a" />
        </View>
      </Pressable>

      {/* DROPDOWN */}
      {open && (
        <View style={styles.dropdown}>
          <Pressable
            style={styles.dropdownItem}
            onPress={handleProfile}
          >
            <Text style={styles.dropdownText}>Profile</Text>
          </Pressable>

          <Pressable
            style={styles.dropdownItem}
            onPress={handleToggleTheme}
          >
            <Text style={styles.dropdownText}>{themeLabel}</Text>
          </Pressable>

          <View style={styles.divider} />

          <Pressable
            style={styles.dropdownItem}
            onPress={handleLogout}
          >
            <Text style={[styles.dropdownText, styles.logoutText]}>
              Logout
            </Text>
          </Pressable>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    position: 'relative',
  },

  button: {
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 16,
  },

  buttonPressed: {
    opacity: 0.7,
  },

  iconWrap: {
    width: 30,
    height: 30,
    borderRadius: 15,
    backgroundColor: '#e2e8f0',
    alignItems: 'center',
    justifyContent: 'center',
  },

  dropdown: {
    position: 'absolute',
    top: 40,
    right: 0,
    backgroundColor: '#ffffff',
    borderRadius: 12,
    width: 140,
    shadowColor: '#000',
    shadowOpacity: 0.15,
    shadowOffset: { width: 0, height: 4 },
    shadowRadius: 8,
    elevation: 5,
    borderWidth: 1,
    borderColor: '#e2e8f0',
  },

  dropdownItem: {
    paddingVertical: 10,
    paddingHorizontal: 14,
  },

  dropdownText: {
    fontSize: 14,
    color: '#0f172a',
    fontWeight: '600',
  },

  logoutText: {
    color: '#dc2626',
  },

  divider: {
    height: 1,
    backgroundColor: '#e2e8f0',
  },
});
