import axios from 'axios';
import dotenv from 'dotenv';

dotenv.config();

// SMS Gateway Configuration (Using a generic SMS API structure)
// Replace with your actual SMS provider (Twilio, AWS SNS, MSG91, etc.)
const SMS_API_URL = process.env.SMS_API_URL || '';
const SMS_API_KEY = process.env.SMS_API_KEY || '';
const SMS_SENDER_ID = process.env.SMS_SENDER_ID || 'KARABOU';

export class SMSService {
  /**
   * Send SMS
   */
  static async sendSMS(phone: string, message: string) {
    try {
      // Example: Generic SMS API call
      // Replace with your actual SMS provider's API
      const response = await axios.post(SMS_API_URL, {
        apikey: SMS_API_KEY,
        sender: SMS_SENDER_ID,
        phone: phone,
        message: message,
      });
      
      console.log('SMS sent successfully:', response.data);
      return response.data;
    } catch (error) {
      console.error('SMS send error:', error);
      // Don't throw error - SMS is not critical
      return null;
    }
  }
  
  /**
   * Send OTP SMS
   */
  static async sendOTP(phone: string, otp: string) {
    const message = `Your OTP for Kara Boutique is: ${otp}. Valid for 10 minutes. Do not share with anyone.`;
    
    // For development, just log the OTP
    if (process.env.NODE_ENV === 'development') {
      console.log(`[DEV] OTP for ${phone}: ${otp}`);
      return { success: true, dev: true };
    }
    
    return await this.sendSMS(phone, message);
  }
  
  /**
   * Send order confirmation SMS
   */
  static async sendOrderConfirmationSMS(phone: string, orderNumber: string) {
    const message = `Your order ${orderNumber} has been confirmed. Thank you for shopping with Kara Boutique!`;
    
    if (process.env.NODE_ENV === 'development') {
      console.log(`[DEV] SMS to ${phone}: ${message}`);
      return { success: true, dev: true };
    }
    
    return await this.sendSMS(phone, message);
  }
  
  /**
   * Send shipping notification SMS
   */
  static async sendShippingSMS(
    phone: string,
    orderNumber: string,
    trackingNumber: string
  ) {
    const message = `Your order ${orderNumber} has been shipped. Track: ${trackingNumber}. - Kara Boutique`;
    
    if (process.env.NODE_ENV === 'development') {
      console.log(`[DEV] SMS to ${phone}: ${message}`);
      return { success: true, dev: true };
    }
    
    return await this.sendSMS(phone, message);
  }
  
  /**
   * Send delivery notification SMS
   */
  static async sendDeliverySMS(phone: string, orderNumber: string) {
    const message = `Your order ${orderNumber} has been delivered. Enjoy your purchase! - Kara Boutique`;
    
    if (process.env.NODE_ENV === 'development') {
      console.log(`[DEV] SMS to ${phone}: ${message}`);
      return { success: true, dev: true };
    }
    
    return await this.sendSMS(phone, message);
  }
  
  /**
   * Send admin 2FA SMS
   */
  static async send2FASMS(phone: string, code: string) {
    const message = `Your Kara Boutique admin verification code is: ${code}. Do not share.`;
    
    if (process.env.NODE_ENV === 'development') {
      console.log(`[DEV] 2FA SMS to ${phone}: ${code}`);
      return { success: true, dev: true };
    }
    
    return await this.sendSMS(phone, message);
  }
}

export default SMSService;
