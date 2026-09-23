import {
  createSupabaseClient,
  type SupabaseAuthStorage,
} from '@/lib/supabase/create-client';

const webStorage: SupabaseAuthStorage = {
  getItem: (key) => {
    if (typeof window === 'undefined') {
      return null;
    }

    return window.localStorage.getItem(key);
  },
  setItem: (key, value) => {
    if (typeof window === 'undefined') {
      return;
    }

    window.localStorage.setItem(key, value);
  },
  removeItem: (key) => {
    if (typeof window === 'undefined') {
      return;
    }

    window.localStorage.removeItem(key);
  },
};

let client: ReturnType<typeof createSupabaseClient> | undefined;

export function getSupabaseClient() {
  client ??= createSupabaseClient(webStorage);
  return client;
}
