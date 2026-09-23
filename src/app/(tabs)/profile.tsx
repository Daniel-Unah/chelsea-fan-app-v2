import { useEffect, useState } from 'react';
import { ScrollView, StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { Button } from '@/components/ui/button';
import { TextField } from '@/components/ui/text-field';
import { MaxContentWidth, Spacing } from '@/constants/theme';
import {
  validateBio,
  validateDisplayName,
  validateUsername,
} from '@/lib/profile/validation';
import { getSupabaseClient } from '@/lib/supabase/client';
import { useAuth } from '@/providers/auth-provider';
import { isProfile, type Profile } from '@/types/profile';
import { useTheme } from '@/hooks/use-theme';

export default function ProfileScreen() {
  const theme = useTheme();
  const { session } = useAuth();
  const userId = session?.user.id;
  const [profile, setProfile] = useState<Profile | null>(null);
  const [username, setUsername] = useState('');
  const [displayName, setDisplayName] = useState('');
  const [bio, setBio] = useState('');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    const client = getSupabaseClient();

    if (!client || !userId) {
      return;
    }

    let active = true;

    async function loadProfile() {
      if (!client || !userId) {
        return;
      }

      setLoading(true);
      const { data, error: loadError } = await client
        .from('profiles')
        .select(
          'id, username, display_name, avatar_url, bio, created_at, updated_at',
        )
        .eq('id', userId)
        .single();

      if (!active) {
        return;
      }

      if (loadError || !isProfile(data)) {
        setError(loadError?.message ?? 'Profile could not be loaded.');
        setLoading(false);
        return;
      }

      setProfile(data);
      setUsername(data.username);
      setDisplayName(data.display_name);
      setBio(data.bio ?? '');
      setError(null);
      setLoading(false);
    }

    void loadProfile();

    return () => {
      active = false;
    };
  }, [userId]);

  async function saveProfile() {
    const client = getSupabaseClient();
    const nextError =
      validateUsername(username) ??
      validateDisplayName(displayName) ??
      validateBio(bio);

    if (nextError) {
      setError(nextError);
      setSaved(false);
      return;
    }

    if (!client || !userId) {
      setError('You need to be logged in to update your profile.');
      return;
    }

    setSaving(true);
    setSaved(false);
    setError(null);

    const { data, error: saveError } = await client
      .from('profiles')
      .update({
        username: username.trim(),
        display_name: displayName.trim(),
        bio: bio.trim() === '' ? null : bio.trim(),
      })
      .eq('id', userId)
      .select(
        'id, username, display_name, avatar_url, bio, created_at, updated_at',
      )
      .single();

    setSaving(false);

    if (saveError || !isProfile(data)) {
      setError(saveError?.message ?? 'Profile could not be saved.');
      return;
    }

    setProfile(data);
    setSaved(true);
  }

  async function logOut() {
    const client = getSupabaseClient();
    const { error: signOutError } = (await client?.auth.signOut()) ?? {
      error: null,
    };

    if (signOutError) {
      setError(signOutError.message);
    }
  }

  return (
    <ThemedView style={styles.screen}>
      <SafeAreaView edges={['top']} style={styles.safeArea}>
        <ScrollView
          contentContainerStyle={styles.content}
          keyboardShouldPersistTaps="handled"
        >
          <ThemedText accessibilityRole="header" type="title">
            Profile
          </ThemedText>
          {loading ? (
            <ThemedText themeColor="textSecondary">Loading profile</ThemedText>
          ) : null}
          {error ? (
            <ThemedText style={{ color: theme.danger }}>{error}</ThemedText>
          ) : null}
          {saved ? (
            <ThemedText themeColor="link">Profile saved.</ThemedText>
          ) : null}
          <ThemedText themeColor="textSecondary">
            {session?.user.email}
          </ThemedText>
          <TextField
            label="Username"
            autoCapitalize="none"
            autoCorrect={false}
            editable={!loading}
            value={username}
            onChangeText={setUsername}
          />
          <TextField
            label="Display name"
            editable={!loading}
            value={displayName}
            onChangeText={setDisplayName}
          />
          <TextField
            label="Bio"
            editable={!loading}
            multiline
            value={bio}
            onChangeText={setBio}
          />
          <Button
            label={saving ? 'Saving' : 'Save profile'}
            disabled={loading || saving || profile === null}
            onPress={() => {
              void saveProfile();
            }}
          />
          <Button
            label="Log out"
            onPress={() => {
              void logOut();
            }}
          />
        </ScrollView>
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
  },
  content: {
    width: '100%',
    maxWidth: MaxContentWidth,
    alignSelf: 'center',
    paddingHorizontal: Spacing.four,
    paddingTop: Spacing.four,
    paddingBottom: Spacing.six,
    gap: Spacing.three,
  },
});
