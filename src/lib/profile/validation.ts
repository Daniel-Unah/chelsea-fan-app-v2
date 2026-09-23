const USERNAME_PATTERN = /^[A-Za-z0-9_]+$/;

export function validateUsername(username: string): string | null {
  const value = username.trim();

  if (value.length < 3) {
    return 'Username must be at least 3 characters.';
  }

  if (value.length > 24) {
    return 'Username must be 24 characters or fewer.';
  }

  if (!USERNAME_PATTERN.test(value)) {
    return 'Username can use letters, numbers, and underscores.';
  }

  return null;
}

export function validateDisplayName(displayName: string): string | null {
  const value = displayName.trim();

  if (value.length < 1) {
    return 'Display name is required.';
  }

  if (value.length > 40) {
    return 'Display name must be 40 characters or fewer.';
  }

  return null;
}

export function validateBio(bio: string): string | null {
  if (bio.trim().length > 160) {
    return 'Bio must be 160 characters or fewer.';
  }

  return null;
}

export function validateEmail(email: string): string | null {
  const value = email.trim();

  if (!value.includes('@') || value.startsWith('@') || value.endsWith('@')) {
    return 'Enter a valid email address.';
  }

  return null;
}

export function validatePassword(password: string): string | null {
  if (password.length < 6) {
    return 'Password must be at least 6 characters.';
  }

  return null;
}
