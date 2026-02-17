import 'express';

// Extend Express Request to include user info (set by auth middleware)
declare global {
  namespace Express {
    interface Request {
      userId?: number;
      user?: {
        id: number;
        role?: string;
        organizationId?: number;
        organizationMember?: any;
      };
      file?: Multer.File;
      files?: Multer.File[];
    }
  }
}

// Type for authenticated requests where user is guaranteed to exist
export type AuthenticatedRequest = Express.Request & {
  user: {
    id: number;
    role?: string;
    organizationId?: number;
    organizationMember?: any;
  };
  userId: number;
};

export {};
