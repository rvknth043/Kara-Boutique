import { SESClient, SendEmailCommand } from '@aws-sdk/client-ses';
import dotenv from 'dotenv';

dotenv.config();

// Initialize SES client
const sesClient = new SESClient({
  region: process.env.AWS_SES_REGION || 'ap-south-1',
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID || '',
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY || '',
  },
});

const FROM_EMAIL = process.env.SES_FROM_EMAIL || 'noreply@karaboutique.com';
const FROM_NAME = process.env.SES_FROM_NAME || 'Kara Boutique';

export class EmailService {
  /**
   * Send email
   */
  static async sendEmail(
    to: string,
    subject: string,
    htmlBody: string,
    textBody?: string
  ) {
    try {
      const command = new SendEmailCommand({
        Source: `${FROM_NAME} <${FROM_EMAIL}>`,
        Destination: {
          ToAddresses: [to],
        },
        Message: {
          Subject: {
            Data: subject,
            Charset: 'UTF-8',
          },
          Body: {
            Html: {
              Data: htmlBody,
              Charset: 'UTF-8',
            },
            Text: {
              Data: textBody || htmlBody.replace(/<[^>]*>/g, ''),
              Charset: 'UTF-8',
            },
          },
        },
      });
      
      const response = await sesClient.send(command);
      console.log('Email sent successfully:', response.MessageId);
      return response;
    } catch (error) {
      console.error('Email send error:', error);
      throw error;
    }
  }
  
  /**
   * Send welcome email
   */
  static async sendWelcomeEmail(to: string, name: string) {
    const subject = 'Welcome to Kara Boutique!';
    const html = `
      <h2>Welcome to Kara Boutique, ${name}!</h2>
      <p>Thank you for joining us. We're excited to have you as part of our community.</p>
      <p>Explore our latest collection of ethnic and contemporary fashion.</p>
      <p>Happy Shopping!</p>
      <p>Best regards,<br>Team Kara Boutique</p>
    `;
    
    return await this.sendEmail(to, subject, html);
  }
  
  /**
   * Send order confirmation email
   */
  static async sendOrderConfirmation(
    to: string,
    orderNumber: string,
    orderDetails: any
  ) {
    const subject = `Order Confirmation - ${orderNumber}`;
    const html = `
      <h2>Order Confirmed!</h2>
      <p>Thank you for your order. Your order number is: <strong>${orderNumber}</strong></p>
      <h3>Order Summary:</h3>
      <p>Total Amount: ₹${orderDetails.final_amount}</p>
      <p>Payment Method: ${orderDetails.payment_method}</p>
      <p>We'll send you another email when your order ships.</p>
      <p>Best regards,<br>Team Kara Boutique</p>
    `;
    
    return await this.sendEmail(to, subject, html);
  }
  
  /**
   * Send shipping notification
   */
  static async sendShippingNotification(
    to: string,
    orderNumber: string,
    trackingNumber: string
  ) {
    const subject = `Your Order ${orderNumber} Has Shipped!`;
    const html = `
      <h2>Your Order is On Its Way!</h2>
      <p>Great news! Your order <strong>${orderNumber}</strong> has been shipped.</p>
      <p>Tracking Number: <strong>${trackingNumber}</strong></p>
      <p>You can track your order using the tracking number above.</p>
      <p>Best regards,<br>Team Kara Boutique</p>
    `;
    
    return await this.sendEmail(to, subject, html);
  }
  
  /**
   * Send delivery notification
   */
  static async sendDeliveryNotification(to: string, orderNumber: string) {
    const subject = `Your Order ${orderNumber} Has Been Delivered!`;
    const html = `
      <h2>Order Delivered Successfully!</h2>
      <p>Your order <strong>${orderNumber}</strong> has been delivered.</p>
      <p>We hope you love your purchase! Please leave a review to help other customers.</p>
      <p>Best regards,<br>Team Kara Boutique</p>
    `;
    
    return await this.sendEmail(to, subject, html);
  }
  
  /**
   * Send OTP email
   */
  static async sendOTPEmail(to: string, otp: string) {
    const subject = 'Your OTP for Kara Boutique';
    const html = `
      <h2>Your OTP Code</h2>
      <p>Your OTP is: <strong style="font-size: 24px;">${otp}</strong></p>
      <p>This OTP is valid for 10 minutes.</p>
      <p>If you didn't request this, please ignore this email.</p>
    `;
    
    return await this.sendEmail(to, subject, html);
  }
  
  /**
   * Send password reset email
   */
  static async sendPasswordResetEmail(to: string, resetLink: string) {
    const subject = 'Reset Your Password';
    const html = `
      <h2>Password Reset Request</h2>
      <p>Click the link below to reset your password:</p>
      <p><a href="${resetLink}">Reset Password</a></p>
      <p>This link will expire in 1 hour.</p>
      <p>If you didn't request this, please ignore this email.</p>
    `;
    
    return await this.sendEmail(to, subject, html);
  }
  
  /**
   * Send abandoned cart reminder
   */
  static async sendAbandonedCartEmail(
    to: string,
    cartItems: any[],
    cartTotal: number
  ) {
    const subject = "Don't Forget Your Cart!";
    const itemsList = cartItems.map(item => 
      `<li>${item.product_name} - ₹${item.price}</li>`
    ).join('');
    
    const html = `
      <h2>You Left Something Behind!</h2>
      <p>We noticed you left items in your cart:</p>
      <ul>${itemsList}</ul>
      <p>Total: ₹${cartTotal}</p>
      <p><a href="${process.env.FRONTEND_URL}/cart">Complete Your Purchase</a></p>
      <p>Best regards,<br>Team Kara Boutique</p>
    `;
    
    return await this.sendEmail(to, subject, html);
  }
}

export default EmailService;
