import crypto from 'crypto';
import { query } from '../config/database';
import { EmailService } from './email.service';
import { AppError } from '../middleware/errorHandler';

export class EmailVerificationService {
  /**
   * Generate verification token
   */
  private static generateToken(): string {
    return crypto.randomBytes(32).toString('hex');
  }

  /**
   * Create verification token for user
   */
  static async createVerificationToken(userId: string, email: string): Promise<string> {
    const token = this.generateToken();
    const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000); // 24 hours

    await query(
      `INSERT INTO email_verification_tokens (user_id, token, expires_at) 
       VALUES ($1, $2, $3)
       ON CONFLICT (user_id) 
       DO UPDATE SET token = $2, expires_at = $3, created_at = CURRENT_TIMESTAMP`,
      [userId, token, expiresAt]
    );

    // Send verification email
    await this.sendVerificationEmail(email, token);

    return token;
  }

  /**
   * Send verification email
   */
  private static async sendVerificationEmail(email: string, token: string) {
    const verificationUrl = `${process.env.FRONTEND_URL}/verify-email?token=${token}`;

    const emailContent = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <div style="background-color: #D4A373; padding: 20px; text-align: center;">
          <h1 style="color: white; margin: 0;">Kara Boutique</h1>
        </div>
        
        <div style="padding: 40px 20px; background-color: #f9f9f9;">
          <h2 style="color: #333;">Verify Your Email Address</h2>
          
          <p style="color: #666; line-height: 1.6;">
            Thank you for registering with Kara Boutique! To complete your registration 
            and start shopping, please verify your email address.
          </p>
          
          <div style="text-align: center; margin: 30px 0;">
            <a href="${verificationUrl}" 
               style="background-color: #D4A373; color: white; padding: 15px 30px; 
                      text-decoration: none; border-radius: 5px; display: inline-block;">
              Verify Email Address
            </a>
          </div>
          
          <p style="color: #666; font-size: 14px;">
            Or copy and paste this link in your browser:<br>
            <a href="${verificationUrl}" style="color: #D4A373;">${verificationUrl}</a>
          </p>
          
          <p style="color: #666; font-size: 14px; margin-top: 30px;">
            This link will expire in 24 hours. If you didn't create an account with 
            Kara Boutique, please ignore this email.
          </p>
        </div>
        
        <div style="background-color: #333; padding: 20px; text-align: center; color: white; font-size: 12px;">
          <p>© 2024 Kara Boutique. All rights reserved.</p>
        </div>
      </div>
    `;

    await EmailService.sendEmail({
      to: email,
      subject: 'Verify Your Email - Kara Boutique',
      html: emailContent,
    });
  }

  /**
   * Verify email token
   */
  static async verifyToken(token: string): Promise<{ success: boolean; userId?: string }> {
    const result = await query(
      `SELECT user_id, expires_at FROM email_verification_tokens 
       WHERE token = $1`,
      [token]
    );

    if (result.rows.length === 0) {
      throw new AppError('Invalid verification token', 400, 'INVALID_TOKEN');
    }

    const { user_id, expires_at } = result.rows[0];

    if (new Date() > new Date(expires_at)) {
      throw new AppError('Verification token has expired', 400, 'TOKEN_EXPIRED');
    }

    // Mark user as verified
    await query(
      `UPDATE users SET is_verified = true WHERE id = $1`,
      [user_id]
    );

    // Delete the token
    await query(
      `DELETE FROM email_verification_tokens WHERE token = $1`,
      [token]
    );

    return {
      success: true,
      userId: user_id,
    };
  }

  /**
   * Resend verification email
   */
  static async resendVerification(email: string): Promise<void> {
    const userResult = await query(
      `SELECT id, is_verified FROM users WHERE email = $1`,
      [email]
    );

    if (userResult.rows.length === 0) {
      throw new AppError('User not found', 404, 'USER_NOT_FOUND');
    }

    const user = userResult.rows[0];

    if (user.is_verified) {
      throw new AppError('Email already verified', 400, 'ALREADY_VERIFIED');
    }

    await this.createVerificationToken(user.id, email);
  }

  /**
   * Check if user is verified
   */
  static async isVerified(userId: string): Promise<boolean> {
    const result = await query(
      `SELECT is_verified FROM users WHERE id = $1`,
      [userId]
    );

    return result.rows[0]?.is_verified || false;
  }
}

export default EmailVerificationService;
