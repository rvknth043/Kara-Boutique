import { Request, Response, NextFunction } from 'express';
import AuthService from '../services/auth.service';
import { asyncHandler } from '../middleware/errorHandler';

export class AuthController {
  /**
   * Register new user
   * POST /api/v1/auth/register
   */
  static register = asyncHandler(async (req: Request, res: Response) => {
    const { full_name, email, phone, password } = req.body;
    
    const result = await AuthService.register({
      full_name,
      email,
      phone,
      password,
    });
    
    res.status(201).json({
      success: true,
      message: 'Registration successful',
      data: result,
    });
  });
  
  /**
   * Login with email and password
   * POST /api/v1/auth/login
   */
  static login = asyncHandler(async (req: Request, res: Response) => {
    const { email, password } = req.body;
    
    const result = await AuthService.login({ email, password });
    
    res.status(200).json({
      success: true,
      data: result,
    });
  });
  
  /**
   * Request OTP for phone login
   * POST /api/v1/auth/otp-request
   */
  static requestOTP = asyncHandler(async (req: Request, res: Response) => {
    const { phone } = req.body;
    
    const result = await AuthService.requestOTP(phone);
    
    res.status(200).json({
      success: true,
      message: result.message,
    });
  });
  
  /**
   * Verify OTP and login
   * POST /api/v1/auth/otp-verify
   */
  static verifyOTP = asyncHandler(async (req: Request, res: Response) => {
    const { phone, otp } = req.body;
    
    const result = await AuthService.verifyOTPAndLogin({ phone, otp });
    
    res.status(200).json({
      success: true,
      data: result,
    });
  });
  
  /**
   * Google OAuth login
   * POST /api/v1/auth/google-login
   */
  static googleLogin = asyncHandler(async (req: Request, res: Response) => {
    const { google_id, email, full_name } = req.body;
    
    const result = await AuthService.googleLogin(google_id, email, full_name);
    
    res.status(200).json({
      success: true,
      data: result,
    });
  });
  
  /**
   * Get current user profile
   * GET /api/v1/auth/me
   */
  static getProfile = asyncHandler(async (req: Request, res: Response) => {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        error: {
          code: 'UNAUTHORIZED',
          message: 'Authentication required',
        },
      });
    }
    
    const profile = await AuthService.getProfile(req.user.userId);
    
    res.status(200).json({
      success: true,
      data: profile,
    });
  });
  
  /**
   * Logout (client-side token removal)
   * POST /api/v1/auth/logout
   */
  static logout = asyncHandler(async (req: Request, res: Response) => {
    // JWT is stateless, so logout is handled client-side
    // This endpoint is for consistency and future features (e.g., token blacklisting)
    
    res.status(200).json({
      success: true,
      message: 'Logged out successfully',
    });
  });
}

export default AuthController;
