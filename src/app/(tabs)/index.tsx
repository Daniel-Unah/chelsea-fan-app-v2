import { Link } from 'expo-router';

import { ThemedText } from '@/components/themed-text';
import { PlaceholderScreen } from '@/components/ui/placeholder-screen';

export default function HomeScreen() {
  return (
    <PlaceholderScreen
      title="Home"
      message="Your sports home will show the next match, live games, and community activity."
      footer={
        <Link href="/dev/sports">
          <ThemedText themeColor="link">Inspect sports data</ThemedText>
        </Link>
      }
    />
  );
}
