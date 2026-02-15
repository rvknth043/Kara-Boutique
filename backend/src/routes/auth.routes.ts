import { Router } from 'express';
import AuthController from '../controllers/auth.controller';
import { authenticate } from '../middleware/auth.middleware';
import { validate } from '../middleware/validate.middleware';
import { authRateLimiter, otpRateLimiter } from '../middleware/rateLimiter';
import {
  registerValidator,
  loginValidator,
  otpRequestValidator,
  otpVerifyValidator,
  googleLoginValidator,
} from '../validators/auth.validator';

const router = Router();

/**
 * @route   POST /api/v1/auth/register
 * @desc    Register new user
 * @access  Public
 */
router.post(
  '/register',
  authRateLimiter,
  validate(registerValidator),
  AuthController.register
);

/**
 * @route   POST /api/v1/auth/login
 * @desc    Login with email and password
 * @access  Public
 */
router.post(
  '/login',
  authRateLimiter,
  validate(loginValidator),
  AuthController.login
);

/**
 * @route   POST /api/v1/auth/otp-request
 * @desc    Request OTP for phone login
 * @access  Public
 */
router.post(
  '/otp-request',
  otpRateLimiter,
  validate(otpRequestValidator),
  AuthController.requestOTP
);

/**
 * @route   POST /api/v1/auth/otp-verify
 * @desc    Verify OTP and login
 * @access  Public
 */
router.post(
  '/otp-verify',
  authRateLimiter,
  validate(otpVerifyValidator),
  AuthController.verifyOTP
);

/**
 * @route   POST /api/v1/auth/google-login
 * @desc    Login with Google OAuth
 * @access  Public
 */
router.post(
  '/google-login',
  validate(googleLoginValidator),
  AuthController.googleLogin
);

/**
 * @route   GET /api/v1/auth/me
 * @desc    Get current user profile
 * @access  Private
 */
router.get(
  '/me',
  authenticate,
  AuthController.getProfile
);

/**
 * @route   POST /api/v1/auth/logout
 * @desc    Logout (client-side)
 * @access  Private
 */
router.post(
  '/logout',
  authenticate,
  AuthController.logout
);

export default router;
