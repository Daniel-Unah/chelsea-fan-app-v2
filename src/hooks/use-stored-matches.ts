import { useEffect, useState } from 'react';

import { loadStoredMatches } from '@/lib/sports/load-matches';
import type { StoredMatch } from '@/lib/sports/matches';
import { useAuth } from '@/providers/auth-provider';

export function useStoredMatches() {
  const { isLoggedIn } = useAuth();
  const [matches, setMatches] = useState<StoredMatch[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!isLoggedIn) {
      return;
    }

    let active = true;

    async function load() {
      try {
        const stored = await loadStoredMatches();

        if (!active) {
          return;
        }

        setMatches(stored);
        setError(null);
      } catch (caught) {
        if (!active) {
          return;
        }

        setError(
          caught instanceof Error ? caught.message : 'Could not load matches.',
        );
      } finally {
        if (active) {
          setLoading(false);
        }
      }
    }

    void load();

    return () => {
      active = false;
    };
  }, [isLoggedIn]);

  return { matches, error, loading };
}
