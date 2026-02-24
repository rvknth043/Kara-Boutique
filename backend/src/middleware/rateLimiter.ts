import rateLimit from 'express-rate-limit';
import { Request, Response, RequestHandler } from 'express';

// General API rate limiter
const baseRateLimiter = rateLimit({
  windowMs: parseInt(process.env.RATE_LIMIT_WINDOW_MS || '60000'), // 1 minute
  max: parseInt(process.env.RATE_LIMIT_MAX_REQUESTS || '100'), // 100 requests per minute
  message: {
    success: false,
    error: {
      code: 'RATE_LIMIT_EXCEEDED',
      message: 'Too many requests, please try again later',
    },
  },
  standardHeaders: true,
  legacyHeaders: false,
  handler: (req: Request, res: Response) => {
    res.status(429).json({
      success: false,
      error: {
        code: 'RATE_LIMIT_EXCEEDED',
        message: 'Too many requests, please try again later',
      },
    });
  },
});

// Strict rate limiter for auth endpoints
const baseAuthRateLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 5, // 5 requests per 15 minutes
  skipSuccessfulRequests: true,
  message: {
    success: false,
    error: {
      code: 'AUTH_RATE_LIMIT_EXCEEDED',
      message: 'Too many authentication attempts, please try again after 15 minutes',
    },
  },
});

// OTP rate limiter
const baseOtpRateLimiter = rateLimit({
  windowMs: 10 * 60 * 1000, // 10 minutes
  max: 3, // 3 OTP requests per 10 minutes
  message: {
    success: false,
    error: {
      code: 'OTP_RATE_LIMIT_EXCEEDED',
      message: 'Too many OTP requests, please try again after 10 minutes',
    },
  },
});

// Upload rate limiter
const baseUploadRateLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hour
  max: 50, // 50 uploads per hour
  message: {
    success: false,
    error: {
      code: 'UPLOAD_RATE_LIMIT_EXCEEDED',
      message: 'Too many file uploads, please try again later',
    },
  },
});

// Cast through unknown to isolate cross-package express type resolution mismatches.
export const rateLimiter = baseRateLimiter as unknown as RequestHandler;
export const authRateLimiter = baseAuthRateLimiter as unknown as RequestHandler;
export const otpRateLimiter = baseOtpRateLimiter as unknown as RequestHandler;
export const uploadRateLimiter = baseUploadRateLimiter as unknown as RequestHandler;

export default rateLimiter;
