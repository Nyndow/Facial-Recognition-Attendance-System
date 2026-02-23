import { useWindowDimensions } from 'react-native';

type ResponsiveOptions = {
  maxWidth?: number;
  minPadding?: number;
  maxPadding?: number;
  paddingVertical?: number;
};

export function useResponsiveContentStyle(options: ResponsiveOptions = {}) {
  const { width } = useWindowDimensions();
  const maxWidth = options.maxWidth ?? 920;
  const minPadding = options.minPadding ?? 16;
  const maxPadding = options.maxPadding ?? 32;
  const paddingVertical = options.paddingVertical ?? 16;

  const paddingHorizontal = Math.min(
    maxPadding,
    Math.max(minPadding, Math.round(width * 0.04))
  );

  return {
    flexGrow: 1,
    width: '100%',
    maxWidth,
    alignSelf: 'center' as const,
    paddingHorizontal,
    paddingVertical,
  };
}
