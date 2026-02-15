import { Request, Response } from 'express';
import { asyncHandler } from '../middleware/errorHandler';
import EmailVerificationService from '../services/emailVerification.service';

export class EmailVerificationController {
  /**
   * @route   POST /api/v1/email-verification/send
   * @desc    Send email verification
   * @access  Private
   */
  static sendVerification = asyncHandler(async (req: Request, res: Response) => {
    const userId = req.user!.userId;
    const email = req.user!.email;

    await EmailVerificationService.createVerificationToken(userId, email);

    res.status(200).json({
      success: true,
      message: 'Verification email sent successfully',
    });
  });

  /**
   * @route   POST /api/v1/email-verification/verify
   * @desc    Verify email with token
   * @access  Public
   */
  static verifyEmail = asyncHandler(async (req: Request, res: Response) => {
    const { token } = req.body;

    const result = await EmailVerificationService.verifyToken(token);

    res.status(200).json({
      success: true,
      message: 'Email verified successfully',
      data: result,
    });
  });

  /**
   * @route   POST /api/v1/email-verification/resend
   * @desc    Resend verification email
   * @access  Public
   */
  static resendVerification = asyncHandler(async (req: Request, res: Response) => {
    const { email } = req.body;

    await EmailVerificationService.resendVerification(email);

    res.status(200).json({
      success: true,
      message: 'Verification email resent successfully',
    });
  });

  /**
   * @route   GET /api/v1/email-verification/status
   * @desc    Check verification status
   * @access  Private
   */
  static checkStatus = asyncHandler(async (req: Request, res: Response) => {
    const userId = req.user!.userId;

    const isVerified = await EmailVerificationService.isVerified(userId);

    res.status(200).json({
      success: true,
      data: {
        isVerified,
      },
    });
  });
}

export default EmailVerificationController;
