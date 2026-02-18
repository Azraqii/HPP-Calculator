/**
 * EXPRESS TYPE EXTENSIONS
 * =======================
 * Extend Express Request type to include user property
 */

declare namespace Express {
  export interface Request {
    user?: {
      userId: string;
      email: string;
      role: string;
    };
  }
}
