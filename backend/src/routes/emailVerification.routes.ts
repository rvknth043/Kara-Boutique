import { Router } from 'express';
import EmailVerificationController from '../controllers/emailVerification.controller';
import { authenticate } from '../middleware/auth.middleware';

const router = Router();

/**
 * @route   POST /api/v1/email-verification/send
 * @desc    Send verification email
 * @access  Private
 */
router.post('/send', authenticate, EmailVerificationController.sendVerification);

/**
 * @route   POST /api/v1/email-verification/verify
 * @desc    Verify email with token
 * @access  Public
 */
router.post('/verify', EmailVerificationController.verifyEmail);

/**
 * @route   POST /api/v1/email-verification/resend
 * @desc    Resend verification email
 * @access  Public
 */
router.post('/resend', EmailVerificationController.resendVerification);

/**
 * @route   GET /api/v1/email-verification/status
 * @desc    Check verification status
 * @access  Private
 */
router.get('/status', authenticate, EmailVerificationController.checkStatus);

export default router;
