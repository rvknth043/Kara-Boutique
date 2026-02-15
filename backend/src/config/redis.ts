import { createClient, RedisClientType } from 'redis';
import dotenv from 'dotenv';

dotenv.config();

// Redis configuration
const redisConfig = {
  host: process.env.REDIS_HOST || 'localhost',
  port: parseInt(process.env.REDIS_PORT || '6379'),
  password: process.env.REDIS_PASSWORD || undefined,
};

// Create Redis client
export const redisClient: RedisClientType = createClient({
  socket: {
    host: redisConfig.host,
    port: redisConfig.port,
  },
  password: redisConfig.password,
});

// Redis event handlers
redisClient.on('connect', () => {
  console.log('✅ Redis client connecting...');
});

redisClient.on('ready', () => {
  console.log('✅ Redis client ready');
});

redisClient.on('error', (err) => {
  console.error('❌ Redis error:', err);
});

redisClient.on('end', () => {
  console.log('Redis connection closed');
});

// Connect to Redis
export const connectRedis = async (): Promise<void> => {
  try {
    await redisClient.connect();
  } catch (error) {
    console.error('Failed to connect to Redis:', error);
    throw error;
  }
};

// Cache helper functions
export class CacheService {
  // Set value with expiration (in seconds)
  static async set(key: string, value: any, expireInSeconds?: number): Promise<void> {
    try {
      const stringValue = JSON.stringify(value);
      if (expireInSeconds) {
        await redisClient.setEx(key, expireInSeconds, stringValue);
      } else {
        await redisClient.set(key, stringValue);
      }
    } catch (error) {
      console.error('Redis SET error:', error);
      throw error;
    }
  }

  // Get value
  static async get<T>(key: string): Promise<T | null> {
    try {
      const value = await redisClient.get(key);
      if (!value) return null;
      return JSON.parse(value) as T;
    } catch (error) {
      console.error('Redis GET error:', error);
      return null;
    }
  }

  // Delete key
  static async del(key: string): Promise<void> {
    try {
      await redisClient.del(key);
    } catch (error) {
      console.error('Redis DEL error:', error);
      throw error;
    }
  }

  // Delete keys by pattern
  static async delPattern(pattern: string): Promise<void> {
    try {
      const keys = await redisClient.keys(pattern);
      if (keys.length > 0) {
        await redisClient.del(keys);
      }
    } catch (error) {
      console.error('Redis DEL pattern error:', error);
      throw error;
    }
  }

  // Check if key exists
  static async exists(key: string): Promise<boolean> {
    try {
      const result = await redisClient.exists(key);
      return result === 1;
    } catch (error) {
      console.error('Redis EXISTS error:', error);
      return false;
    }
  }

  // Increment value
  static async incr(key: string): Promise<number> {
    try {
      return await redisClient.incr(key);
    } catch (error) {
      console.error('Redis INCR error:', error);
      throw error;
    }
  }

  // Set expiration
  static async expire(key: string, seconds: number): Promise<void> {
    try {
      await redisClient.expire(key, seconds);
    } catch (error) {
      console.error('Redis EXPIRE error:', error);
      throw error;
    }
  }

  // Get TTL
  static async ttl(key: string): Promise<number> {
    try {
      return await redisClient.ttl(key);
    } catch (error) {
      console.error('Redis TTL error:', error);
      return -1;
    }
  }
}

// Predefined cache keys
export const CACHE_KEYS = {
  PRODUCTS: 'products:all',
  PRODUCT: (id: string) => `product:${id}`,
  PRODUCT_BY_SLUG: (slug: string) => `product:slug:${slug}`,
  CATEGORIES: 'categories:all',
  CATEGORY: (id: string) => `category:${id}`,
  USER: (id: string) => `user:${id}`,
  CART: (userId: string) => `cart:${userId}`,
  WISHLIST: (userId: string) => `wishlist:${userId}`,
  STOCK_RESERVATION: (reservationId: string) => `reservation:${reservationId}`,
  OTP: (phone: string) => `otp:${phone}`,
  RATE_LIMIT: (ip: string) => `rate_limit:${ip}`,
};

// Cache expiration times (in seconds)
export const CACHE_TTL = {
  PRODUCTS: 3600, // 1 hour
  PRODUCT: 3600, // 1 hour
  CATEGORIES: 7200, // 2 hours
  USER: 1800, // 30 minutes
  CART: 3600, // 1 hour
  WISHLIST: 3600, // 1 hour
  STOCK_RESERVATION: 600, // 10 minutes
  OTP: 600, // 10 minutes
  RATE_LIMIT: 60, // 1 minute
};

// Graceful shutdown
export const closeRedis = async (): Promise<void> => {
  await redisClient.quit();
  console.log('Redis connection closed');
};

export default redisClient;
