export type Profile = {
  id: string;
  username: string;
  display_name: string;
  avatar_url: string | null;
  bio: string | null;
  created_at: string;
  updated_at: string;
};

export function isProfile(value: unknown): value is Profile {
  if (typeof value !== 'object' || value === null) {
    return false;
  }

  const record = value as Record<string, unknown>;

  return (
    typeof record.id === 'string' &&
    typeof record.username === 'string' &&
    typeof record.display_name === 'string' &&
    (record.avatar_url === null || typeof record.avatar_url === 'string') &&
    (record.bio === null || typeof record.bio === 'string') &&
    typeof record.created_at === 'string' &&
    typeof record.updated_at === 'string'
  );
}
