import { Link } from 'expo-router';
import { useState } from 'react';

import { AuthScreen } from '@/components/auth/auth-screen';
import { ThemedText } from '@/components/themed-text';
import { Button } from '@/components/ui/button';
import { TextField } from '@/components/ui/text-field';
import {
  validateDisplayName,
  validateEmail,
  validatePassword,
  validateUsername,
} from '@/lib/profile/validation';
import { getSupabaseClient } from '@/lib/supabase/client';
import { useAuth } from '@/providers/auth-provider';

export default function SignupScreen() {
  const { isConfigured } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [username, setUsername] = useState('');
  const [displayName, setDisplayName] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  async function signUp() {
    const nextError =
      validateEmail(email) ??
      validatePassword(password) ??
      validateUsername(username) ??
      validateDisplayName(displayName);

    if (nextError) {
      setError(nextError);
      return;
    }

    const client = getSupabaseClient();

    if (!client) {
      setError('Supabase is not configured.');
      return;
    }

    setSubmitting(true);
    setError(null);
    setNotice(null);

    const { data, error: signUpError } = await client.auth.signUp({
      email: email.trim(),
      password,
      options: {
        data: {
          username: username.trim(),
          display_name: displayName.trim(),
        },
      },
    });

    setSubmitting(false);

    if (signUpError) {
      setError(signUpError.message);
      return;
    }

    if (!data.session) {
      setNotice('Check your email to confirm the account, then log in.');
    }
  }

  return (
    <AuthScreen
      title="Create account"
      message={
        notice ?? 'Choose a username. You can update your profile later.'
      }
      error={error}
    >
      <TextField
        label="Email"
        autoCapitalize="none"
        autoComplete="email"
        keyboardType="email-address"
        value={email}
        onChangeText={setEmail}
      />
      <TextField
        label="Password"
        autoCapitalize="none"
        secureTextEntry
        value={password}
        onChangeText={setPassword}
      />
      <TextField
        label="Username"
        autoCapitalize="none"
        autoCorrect={false}
        value={username}
        onChangeText={setUsername}
      />
      <TextField
        label="Display name"
        value={displayName}
        onChangeText={setDisplayName}
      />
      <Button
        label={submitting ? 'Creating account' : 'Create account'}
        disabled={!isConfigured || submitting}
        onPress={() => {
          void signUp();
        }}
      />
      <Link href="/login">
        <ThemedText themeColor="link">
          Already have an account? Log in
        </ThemedText>
      </Link>
    </AuthScreen>
  );
}
