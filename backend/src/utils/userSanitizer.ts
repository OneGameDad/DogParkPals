import { User } from '@prisma/client'

// Helper function to sanitize user data (remove sensitive fields)
export const sanitizeUser = (user: User): Omit<User, 'password_hash' | 'resetToken' | 'resetTokenExpiry'> => {
  const { password_hash, resetToken, resetTokenExpiry, ...sanitized } = user;
  return sanitized;
};

//TODO sanitize User function based on user role (e.g., hide more fields for CLIENT vs ADMIN)