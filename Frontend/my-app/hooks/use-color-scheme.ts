import { useColorScheme as useRNColorScheme } from 'react-native';
import { useAppTheme } from '@/context/theme-context';

export function useColorScheme() {
  const appTheme = useAppTheme();

  if (appTheme) {
    return appTheme.colorScheme;
  }

  return useRNColorScheme();
}
