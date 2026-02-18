/**
 * AUTH CONTROLLER
 * ===============
 * Handles HTTP requests for authentication endpoints
 */

import { Request, Response } from 'express';
import authService from '../services/auth.service';

const REFRESH_TOKEN_COOKIE_NAME = 'refreshToken';
const REFRESH_TOKEN_MAX_AGE = 30 * 24 * 60 * 60 * 1000; // 30 days in milliseconds

export const authController = {
  /**
   * POST /api/auth/register
   * Register new user
   */
  async register(req: Request, res: Response) {
    try {
      const { email, password, name } = req.body;

      // Validation
      if (!email || !password || !name) {
        return res.status(400).json({
          success: false,
          message: 'Email, password, and name are required',
          code: 'VALIDATION_ERROR',
        });
      }

      if (password.length < 6) {
        return res.status(400).json({
          success: false,
          message: 'Password must be at least 6 characters',
          code: 'VALIDATION_ERROR',
        });
      }

      // Register user
      const { user, accessToken, refreshToken } = await authService.register(
        email.toLowerCase().trim(),
        password,
        name.trim()
      );

      // Set refresh token in httpOnly cookie
      res.cookie(REFRESH_TOKEN_COOKIE_NAME, refreshToken, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'lax',
        maxAge: REFRESH_TOKEN_MAX_AGE,
        path: '/',
      });

      return res.status(201).json({
        success: true,
        user,
        accessToken,
      });
    } catch (error: any) {
      console.error('Register error:', error);
      
      if (error.message === 'Email already registered') {
        return res.status(409).json({
          success: false,
          message: error.message,
          code: 'EMAIL_EXISTS',
        });
      }

      return res.status(500).json({
        success: false,
        message: 'Registration failed',
        code: 'REGISTRATION_ERROR',
      });
    }
  },

  /**
   * POST /api/auth/login
   * Login user
   */
  async login(req: Request, res: Response) {
    try {
      const { email, password } = req.body;

      // Validation
      if (!email || !password) {
        return res.status(400).json({
          success: false,
          message: 'Email and password are required',
          code: 'VALIDATION_ERROR',
        });
      }

      // Login user
      const { user, accessToken, refreshToken } = await authService.login(
        email.toLowerCase().trim(),
        password
      );

      // Set refresh token in httpOnly cookie
      res.cookie(REFRESH_TOKEN_COOKIE_NAME, refreshToken, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'lax',
        maxAge: REFRESH_TOKEN_MAX_AGE,
        path: '/',
      });

      return res.json({
        success: true,
        user,
        accessToken,
      });
    } catch (error: any) {
      console.error('Login error:', error);

      if (error.message === 'Invalid email or password') {
        return res.status(401).json({
          success: false,
          message: error.message,
          code: 'INVALID_CREDENTIALS',
        });
      }

      return res.status(500).json({
        success: false,
        message: 'Login failed',
        code: 'LOGIN_ERROR',
      });
    }
  },

  /**
   * POST /api/auth/refresh
   * Refresh access token using refresh token
   */
  async refreshToken(req: Request, res: Response) {
    try {
      // Get refresh token from cookie or body
      const refreshToken = req.cookies?.[REFRESH_TOKEN_COOKIE_NAME] || req.body.refreshToken;

      if (!refreshToken) {
        return res.status(401).json({
          success: false,
          message: 'Refresh token not found',
          code: 'NO_REFRESH_TOKEN',
        });
      }

      // Refresh access token
      const { accessToken } = await authService.refreshAccessToken(refreshToken);

      return res.json({
        success: true,
        accessToken,
      });
    } catch (error: any) {
      console.error('Refresh token error:', error);

      // Clear invalid cookie
      res.clearCookie(REFRESH_TOKEN_COOKIE_NAME);

      return res.status(401).json({
        success: false,
        message: 'Invalid or expired refresh token',
        code: 'INVALID_REFRESH_TOKEN',
      });
    }
  },

  /**
   * POST /api/auth/logout
   * Logout user (invalidate refresh token)
   */
  async logout(req: Request, res: Response) {
    try {
      const refreshToken = req.cookies?.[REFRESH_TOKEN_COOKIE_NAME] || req.body.refreshToken;

      if (refreshToken) {
        await authService.logout(refreshToken);
      }

      // Clear cookie
      res.clearCookie(REFRESH_TOKEN_COOKIE_NAME);

      return res.json({
        success: true,
        message: 'Logged out successfully',
      });
    } catch (error: any) {
      console.error('Logout error:', error);

      // Still clear cookie even if there's an error
      res.clearCookie(REFRESH_TOKEN_COOKIE_NAME);

      return res.json({
        success: true,
        message: 'Logged out successfully',
      });
    }
  },

  /**
   * GET /api/auth/me
   * Get current user info (requires auth)
   */
  async me(req: Request, res: Response) {
    try {
      // User ID is set by auth middleware
      const userId = (req as any).user?.userId;

      if (!userId) {
        return res.status(401).json({
          success: false,
          message: 'Not authenticated',
          code: 'NOT_AUTHENTICATED',
        });
      }

      const user = await authService.getUserById(userId);

      return res.json({
        success: true,
        user,
      });
    } catch (error: any) {
      console.error('Get user error:', error);

      return res.status(404).json({
        success: false,
        message: 'User not found',
        code: 'USER_NOT_FOUND',
      });
    }
  },
};

export default authController;
