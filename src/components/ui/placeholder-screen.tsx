import { type ReactNode } from 'react';
import { StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { MaxContentWidth, Spacing } from '@/constants/theme';

type PlaceholderScreenProps = {
  title: string;
  message: string;
  footer?: ReactNode;
};

export function PlaceholderScreen({
  title,
  message,
  footer,
}: PlaceholderScreenProps) {
  return (
    <ThemedView style={styles.screen}>
      <SafeAreaView edges={['top']} style={styles.safeArea}>
        <ThemedText accessibilityRole="header" type="title">
          {title}
        </ThemedText>
        <ThemedText themeColor="textSecondary">{message}</ThemedText>
        {footer}
      </SafeAreaView>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
  },
  safeArea: {
    flex: 1,
    width: '100%',
    maxWidth: MaxContentWidth,
    alignSelf: 'center',
    paddingHorizontal: Spacing.four,
    paddingTop: Spacing.four,
    gap: Spacing.two,
  },
});
