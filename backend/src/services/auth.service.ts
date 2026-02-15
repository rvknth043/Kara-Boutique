import UserModel, { CreateUserData } from '../models/User.model';
import { hashPassword, comparePassword } from '../utils/bcrypt';
import { generateToken, JWTPayload } from '../utils/jwt';
import { generateAndStoreOTP, verifyOTP } from '../utils/otp';
import { AppError } from '../middleware/errorHandler';
import { User, UserRole } from '../types/shared.types';
import { sanitizePhone } from '../utils/helpers';

export interface RegisterData {
  full_name: string;
  email: string;
  phone?: string;
  password: string;
}

export interface LoginData {
  email: string;
  password: string;
}

export interface OTPLoginData {
  phone: string;
  otp?: string;
}

export interface AuthResponse {
  user: Omit<User, 'password_hash'>;
  token: string;
}

export class AuthService {
  /**
   * Register new user
   */
  static async register(data: RegisterData): Promise<AuthResponse> {
    // Check if email already exists
    const emailExists = await UserModel.emailExists(data.email);
    if (emailExists) {
      throw new AppError('Email already registered', 409, 'EMAIL_EXISTS');
    }
    
    // Check if phone already exists
    if (data.phone) {
      const phoneExists = await UserModel.phoneExists(data.phone);
      if (phoneExists) {
        throw new AppError('Phone number already registered', 409, 'PHONE_EXISTS');
      }
    }
    
    // Hash password
    const password_hash = await hashPassword(data.password);
    
    // Create user
    const userData: CreateUserData = {
      full_name: data.full_name,
      email: data.email,
      phone: data.phone,
      password_hash,
      role: UserRole.CUSTOMER,
    };
    
    const user = await UserModel.create(userData);
    
    // Generate JWT token
    const tokenPayload: JWTPayload = {
      userId: user.id,
      email: user.email,
      role: user.role,
    };
    
    const token = generateToken(tokenPayload);
    
    // Remove password from response
    const { password_hash: _, ...userWithoutPassword } = user as any;
    
    return {
      user: userWithoutPassword,
      token,
    };
  }
  
  /**
   * Login with email and password
   */
  static async login(data: LoginData): Promise<AuthResponse> {
    // Find user by email
    const user = await UserModel.findByEmail(data.email);
    
    if (!user) {
      throw new AppError('Invalid email or password', 401, 'INVALID_CREDENTIALS');
    }
    
    // Check if user is active
    if (!user.is_active) {
      throw new AppError('Account is deactivated', 403, 'ACCOUNT_DEACTIVATED');
    }
    
    // Check if user has password (might be Google-only user)
    if (!user.password_hash) {
      throw new AppError('Please login with Google', 400, 'NO_PASSWORD');
    }
    
    // Verify password
    const isPasswordValid = await comparePassword(data.password, user.password_hash);
    
    if (!isPasswordValid) {
      throw new AppError('Invalid email or password', 401, 'INVALID_CREDENTIALS');
    }
    
    // Generate JWT token
    const tokenPayload: JWTPayload = {
      userId: user.id,
      email: user.email,
      role: user.role,
    };
    
    const token = generateToken(tokenPayload);
    
    // Remove password from response
    const { password_hash: _, ...userWithoutPassword } = user as any;
    
    return {
      user: userWithoutPassword,
      token,
    };
  }
  
  /**
   * Request OTP for phone login
   */
  static async requestOTP(phone: string): Promise<{ message: string }> {
    // Sanitize phone number
    const sanitizedPhone = sanitizePhone(phone);
    
    // Check if user exists with this phone
    const user = await UserModel.findByPhone(sanitizedPhone);
    
    if (!user) {
      throw new AppError('Phone number not registered', 404, 'PHONE_NOT_FOUND');
    }
    
    // Generate and store OTP
    const otp = await generateAndStoreOTP(sanitizedPhone);
    
    // TODO: Send OTP via SMS service
    // For now, in development, log it
    if (process.env.NODE_ENV === 'development') {
      console.log(`OTP for ${sanitizedPhone}: ${otp}`);
    }
    
    return {
      message: 'OTP sent successfully',
    };
  }
  
  /**
   * Verify OTP and login
   */
  static async verifyOTPAndLogin(data: OTPLoginData): Promise<AuthResponse> {
    // Sanitize phone number
    const sanitizedPhone = sanitizePhone(data.phone);
    
    if (!data.otp) {
      throw new AppError('OTP is required', 400, 'OTP_REQUIRED');
    }
    
    // Verify OTP
    const isOTPValid = await verifyOTP(sanitizedPhone, data.otp);
    
    if (!isOTPValid) {
      throw new AppError('Invalid or expired OTP', 401, 'INVALID_OTP');
    }
    
    // Find user
    const user = await UserModel.findByPhone(sanitizedPhone);
    
    if (!user) {
      throw new AppError('User not found', 404, 'USER_NOT_FOUND');
    }
    
    // Check if user is active
    if (!user.is_active) {
      throw new AppError('Account is deactivated', 403, 'ACCOUNT_DEACTIVATED');
    }
    
    // Generate JWT token
    const tokenPayload: JWTPayload = {
      userId: user.id,
      email: user.email,
      role: user.role,
    };
    
    const token = generateToken(tokenPayload);
    
    // Remove password from response
    const { password_hash: _, ...userWithoutPassword } = user as any;
    
    return {
      user: userWithoutPassword,
      token,
    };
  }
  
  /**
   * Google OAuth login
   */
  static async googleLogin(googleId: string, email: string, full_name: string): Promise<AuthResponse> {
    // Try to find user by Google ID
    let user = await UserModel.findByGoogleId(googleId);
    
    // If not found, try to find by email
    if (!user) {
      user = await UserModel.findByEmail(email);
    }
    
    // If still not found, create new user
    if (!user) {
      const userData: CreateUserData = {
        full_name,
        email,
        google_id: googleId,
        role: UserRole.CUSTOMER,
      };
      
      user = await UserModel.create(userData);
    }
    
    // Check if user is active
    if (!user.is_active) {
      throw new AppError('Account is deactivated', 403, 'ACCOUNT_DEACTIVATED');
    }
    
    // Generate JWT token
    const tokenPayload: JWTPayload = {
      userId: user.id,
      email: user.email,
      role: user.role,
    };
    
    const token = generateToken(tokenPayload);
    
    // Remove password from response
    const { password_hash: _, ...userWithoutPassword } = user as any;
    
    return {
      user: userWithoutPassword,
      token,
    };
  }
  
  /**
   * Get user profile
   */
  static async getProfile(userId: string): Promise<Omit<User, 'password_hash'>> {
    const user = await UserModel.findById(userId);
    
    if (!user) {
      throw new AppError('User not found', 404, 'USER_NOT_FOUND');
    }
    
    // Remove password from response
    const { password_hash: _, ...userWithoutPassword } = user as any;
    
    return userWithoutPassword;
  }
}

export default AuthService;
