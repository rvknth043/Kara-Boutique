import { CacheService, CACHE_KEYS, CACHE_TTL } from '../config/redis';

/**
 * Generate 6-digit OTP
 */
export const generateOTP = (): string => {
  return Math.floor(100000 + Math.random() * 900000).toString();
};

/**
 * Store OTP in Redis with expiration
 */
export const storeOTP = async (phone: string, otp: string): Promise<void> => {
  const key = CACHE_KEYS.OTP(phone);
  await CacheService.set(key, { otp, createdAt: new Date() }, CACHE_TTL.OTP);
};

/**
 * Verify OTP
 */
export const verifyOTP = async (phone: string, otp: string): Promise<boolean> => {
  const key = CACHE_KEYS.OTP(phone);
  const storedData = await CacheService.get<{ otp: string; createdAt: Date }>(key);
  
  if (!storedData) {
    return false;
  }
  
  // Delete OTP after verification attempt
  await CacheService.del(key);
  
  return storedData.otp === otp;
};

/**
 * Generate and store OTP
 */
export const generateAndStoreOTP = async (phone: string): Promise<string> => {
  const otp = generateOTP();
  await storeOTP(phone, otp);
  return otp;
};

export default {
  generateOTP,
  storeOTP,
  verifyOTP,
  generateAndStoreOTP,
};
