import slugify from 'slugify';

/**
 * Generate slug from string
 */
export const generateSlug = (text: string): string => {
  return slugify(text, {
    lower: true,
    strict: true,
    trim: true,
  });
};

/**
 * Generate unique SKU
 */
export const generateSKU = (
  productName: string,
  color: string,
  size: string
): string => {
  const prefix = productName
    .split(' ')
    .map(word => word.charAt(0).toUpperCase())
    .join('')
    .substring(0, 3);
  
  const colorCode = color.substring(0, 2).toUpperCase();
  const timestamp = Date.now().toString().slice(-4);
  
  return `${prefix}-${colorCode}-${size}-${timestamp}`;
};

/**
 * Generate order number
 */
export const generateOrderNumber = (): string => {
  const date = new Date();
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  const random = Math.floor(1000 + Math.random() * 9000);
  
  return `ORD-${year}${month}${day}-${random}`;
};

/**
 * Calculate shipping charge
 */
export const calculateShippingCharge = (
  subtotal: number,
  freeShippingThreshold: number = 1499,
  standardCharge: number = 99
): number => {
  return subtotal >= freeShippingThreshold ? 0 : standardCharge;
};

/**
 * Calculate discount amount
 */
export const calculateDiscount = (
  subtotal: number,
  discountType: 'percentage' | 'fixed',
  discountValue: number,
  maxDiscount?: number
): number => {
  let discount = 0;
  
  if (discountType === 'percentage') {
    discount = (subtotal * discountValue) / 100;
    if (maxDiscount && discount > maxDiscount) {
      discount = maxDiscount;
    }
  } else {
    discount = discountValue;
  }
  
  // Ensure discount doesn't exceed subtotal
  return Math.min(discount, subtotal);
};

/**
 * Format currency (INR)
 */
export const formatCurrency = (amount: number): string => {
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    minimumFractionDigits: 2,
  }).format(amount);
};

/**
 * Validate email format
 */
export const isValidEmail = (email: string): boolean => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
};

/**
 * Validate Indian phone number
 */
export const isValidIndianPhone = (phone: string): boolean => {
  const phoneRegex = /^(\+91)?[6-9]\d{9}$/;
  return phoneRegex.test(phone.replace(/\s/g, ''));
};

/**
 * Validate pincode
 */
export const isValidPincode = (pincode: string): boolean => {
  const pincodeRegex = /^[1-9][0-9]{5}$/;
  return pincodeRegex.test(pincode);
};

/**
 * Sanitize phone number
 */
export const sanitizePhone = (phone: string): string => {
  // Remove all spaces and special characters
  let sanitized = phone.replace(/\s|-/g, '');
  
  // Add +91 if not present
  if (!sanitized.startsWith('+91') && !sanitized.startsWith('91')) {
    sanitized = '+91' + sanitized;
  } else if (sanitized.startsWith('91')) {
    sanitized = '+' + sanitized;
  }
  
  return sanitized;
};

/**
 * Generate random string
 */
export const generateRandomString = (length: number = 32): string => {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
  let result = '';
  for (let i = 0; i < length; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return result;
};

/**
 * Sleep utility
 */
export const sleep = (ms: number): Promise<void> => {
  return new Promise(resolve => setTimeout(resolve, ms));
};

/**
 * Truncate text
 */
export const truncateText = (text: string, maxLength: number): string => {
  if (text.length <= maxLength) return text;
  return text.substring(0, maxLength) + '...';
};

/**
 * Get file extension
 */
export const getFileExtension = (filename: string): string => {
  return filename.split('.').pop()?.toLowerCase() || '';
};

/**
 * Check if file is image
 */
export const isImageFile = (filename: string): boolean => {
  const imageExtensions = ['jpg', 'jpeg', 'png', 'gif', 'webp', 'svg'];
  const extension = getFileExtension(filename);
  return imageExtensions.includes(extension);
};

export default {
  generateSlug,
  generateSKU,
  generateOrderNumber,
  calculateShippingCharge,
  calculateDiscount,
  formatCurrency,
  isValidEmail,
  isValidIndianPhone,
  isValidPincode,
  sanitizePhone,
  generateRandomString,
  sleep,
  truncateText,
  getFileExtension,
  isImageFile,
};
