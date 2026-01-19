const blacklist = new Map<string, number>();

// Add a token to the blacklist until its expiration time (in seconds since epoch)
export const blacklistToken = (token: string, expSeconds: number) => {
  const expiresAtMs = expSeconds * 1000;
  blacklist.set(token, expiresAtMs);
  cleanupExpired();
};

// Check whether a token is blacklisted
export const isTokenBlacklisted = (token: string): boolean => {
  const expiresAtMs = blacklist.get(token);
  if (expiresAtMs === undefined) return false;
  if (expiresAtMs <= Date.now()) {
    blacklist.delete(token);
    return false;
  }
  return true;
};

// Remove expired entries
const cleanupExpired = () => {
  const now = Date.now();
  for (const [token, expiresAtMs] of blacklist.entries()) {
    if (expiresAtMs <= now) {
      blacklist.delete(token);
    }
  }
};
