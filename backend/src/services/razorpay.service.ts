import Razorpay from 'razorpay';
import crypto from 'crypto';
import dotenv from 'dotenv';

dotenv.config();

// Initialize Razorpay instance
const razorpay = new Razorpay({
  key_id: process.env.RAZORPAY_KEY_ID || '',
  key_secret: process.env.RAZORPAY_KEY_SECRET || '',
});

export interface CreateRazorpayOrderData {
  amount: number; // in paise (smallest currency unit)
  currency?: string;
  receipt: string;
  notes?: Record<string, string>;
}

export interface RazorpayOrder {
  id: string;
  entity: string;
  amount: number;
  amount_paid: number;
  amount_due: number;
  currency: string;
  receipt: string;
  status: string;
  attempts: number;
  notes: Record<string, string>;
  created_at: number;
}

export class RazorpayService {
  /**
   * Create Razorpay order
   */
  static async createOrder(data: CreateRazorpayOrderData): Promise<RazorpayOrder> {
    try {
      const options = {
        amount: data.amount, // Amount in paise
        currency: data.currency || 'INR',
        receipt: data.receipt,
        notes: data.notes || {},
      };
      
      const order = await razorpay.orders.create(options);
      return order as RazorpayOrder;
    } catch (error: any) {
      console.error('Razorpay create order error:', error);
      throw new Error(`Failed to create Razorpay order: ${error.message}`);
    }
  }
  
  /**
   * Verify payment signature
   */
  static verifyPaymentSignature(
    razorpayOrderId: string,
    razorpayPaymentId: string,
    razorpaySignature: string
  ): boolean {
    try {
      const body = razorpayOrderId + '|' + razorpayPaymentId;
      
      const expectedSignature = crypto
        .createHmac('sha256', process.env.RAZORPAY_KEY_SECRET || '')
        .update(body.toString())
        .digest('hex');
      
      return expectedSignature === razorpaySignature;
    } catch (error) {
      console.error('Signature verification error:', error);
      return false;
    }
  }
  
  /**
   * Verify webhook signature
   */
  static verifyWebhookSignature(
    webhookBody: string,
    webhookSignature: string
  ): boolean {
    try {
      const expectedSignature = crypto
        .createHmac('sha256', process.env.RAZORPAY_WEBHOOK_SECRET || '')
        .update(webhookBody)
        .digest('hex');
      
      return expectedSignature === webhookSignature;
    } catch (error) {
      console.error('Webhook signature verification error:', error);
      return false;
    }
  }
  
  /**
   * Fetch payment details
   */
  static async fetchPayment(paymentId: string) {
    try {
      const payment = await razorpay.payments.fetch(paymentId);
      return payment;
    } catch (error: any) {
      console.error('Razorpay fetch payment error:', error);
      throw new Error(`Failed to fetch payment: ${error.message}`);
    }
  }
  
  /**
   * Capture payment
   */
  static async capturePayment(paymentId: string, amount: number) {
    try {
      const payment = await razorpay.payments.capture(paymentId, amount, 'INR');
      return payment;
    } catch (error: any) {
      console.error('Razorpay capture payment error:', error);
      throw new Error(`Failed to capture payment: ${error.message}`);
    }
  }
  
  /**
   * Refund payment
   */
  static async refundPayment(
    paymentId: string,
    amount?: number,
    notes?: Record<string, string>
  ) {
    try {
      const options: any = {};
      
      if (amount) {
        options.amount = amount; // Amount in paise
      }
      
      if (notes) {
        options.notes = notes;
      }
      
      const refund = await razorpay.payments.refund(paymentId, options);
      return refund;
    } catch (error: any) {
      console.error('Razorpay refund error:', error);
      throw new Error(`Failed to refund payment: ${error.message}`);
    }
  }
  
  /**
   * Get payment status
   */
  static async getPaymentStatus(paymentId: string): Promise<string> {
    try {
      const payment = await this.fetchPayment(paymentId);
      return payment.status;
    } catch (error) {
      return 'unknown';
    }
  }
  
  /**
   * Create refund for order
   */
  static async createRefund(
    paymentId: string,
    amount: number,
    orderId: string
  ) {
    try {
      const refund = await this.refundPayment(paymentId, amount, {
        order_id: orderId,
        reason: 'Order cancellation/return',
      });
      
      return refund;
    } catch (error: any) {
      console.error('Create refund error:', error);
      throw new Error(`Failed to create refund: ${error.message}`);
    }
  }
}

export default RazorpayService;
