// Helper function to sanitize user data (remove sensitive fields)
export const sanitizeUser = <T extends object>(user: T): Omit<T, 'password_hash'> => {
  const { password_hash: _passwordHash, ...sanitized } = user as T & { password_hash?: string };
  return sanitized as Omit<T, 'password_hash'>;
};

//TODO sanitize User function based on user role (e.g., hide more fields for CLIENT vs ADMIN)