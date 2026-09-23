import { useSyncExternalStore } from 'react';
import { useColorScheme as useRNColorScheme } from 'react-native';

function subscribe() {
  return () => {};
}

/**
 * Static web rendering must match the server on the first paint.
 * After hydration, follow the device color scheme.
 */
export function useColorScheme() {
  const isHydrated = useSyncExternalStore(
    subscribe,
    () => true,
    () => false,
  );
  const colorScheme = useRNColorScheme();

  if (isHydrated && (colorScheme === 'light' || colorScheme === 'dark')) {
    return colorScheme;
  }

  return 'light';
}
