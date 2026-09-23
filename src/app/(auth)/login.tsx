import { Link } from 'expo-router';
import { useState } from 'react';

import { AuthScreen } from '@/components/auth/auth-screen';
import { ThemedText } from '@/components/themed-text';
import { Button } from '@/components/ui/button';
import { TextField } from '@/components/ui/text-field';
import { getSupabaseClient } from '@/lib/supabase/client';
import { validateEmail, validatePassword } from '@/lib/profile/validation';
import { useAuth } from '@/providers/auth-provider';

export default function LoginScreen() {
  const { isConfigured } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  async function signIn() {
    const emailError = validateEmail(email);
    const passwordError = validatePassword(password);
    const nextError = emailError ?? passwordError;

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

    const { error: signInError } = await client.auth.signInWithPassword({
      email: email.trim(),
      password,
    });

    setSubmitting(false);

    if (signInError) {
      setError(signInError.message);
    }
  }

  return (
    <AuthScreen
      title="Log in"
      message="Use the email and password for your account."
      error={
        isConfigured
          ? error
          : 'Add the Supabase URL and publishable key to .env, then restart the app.'
      }
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
      <Button
        label={submitting ? 'Logging in' : 'Log in'}
        disabled={!isConfigured || submitting}
        onPress={() => {
          void signIn();
        }}
      />
      <Link href="/signup">
        <ThemedText themeColor="link">Create an account</ThemedText>
      </Link>
    </AuthScreen>
  );
}
