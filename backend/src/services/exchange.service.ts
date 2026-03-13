import ExchangeModel, { ExchangeStatus, ExchangeReason, CreateExchangeData } from '../models/Exchange.model';
import OrderModel from '../models/Order.model';
import ProductVariantModel from '../models/ProductVariant.model';
import EmailService from './email.service';
import SMSService from './sms.service';
import { AppError } from '../middleware/errorHandler';
import StorefrontSettingsService from './storefrontSettings.service';

export class ExchangeService {
  /**
   * Request exchange for an order
   */
  static async requestExchange(data: CreateExchangeData) {
    const settings = await StorefrontSettingsService.getSettings();
    if (!settings.allow_exchanges) {
      throw new AppError('Exchanges are currently disabled by the store', 400, 'EXCHANGES_DISABLED');
    }

    // Check if order is eligible for exchange
    const eligibility = await ExchangeModel.isEligibleForExchange(data.order_id);
    
    if (!eligibility.eligible) {
      throw new AppError(eligibility.reason || 'Order not eligible for exchange', 400, 'NOT_ELIGIBLE');
    }
    
    // Get order details
    const order = await OrderModel.findByIdWithDetails(data.order_id);
    
    if (!order) {
      throw new AppError('Order not found', 404, 'ORDER_NOT_FOUND');
    }
    
    // Verify ownership
    if (order.user_id !== data.user_id) {
      throw new AppError('Access denied', 403, 'ACCESS_DENIED');
    }
    
    // If exchange variant specified, check stock
    if (data.exchange_variant_id) {
      const variant = await ProductVariantModel.findById(data.exchange_variant_id);
      
      if (!variant) {
        throw new AppError('Exchange variant not found', 404, 'VARIANT_NOT_FOUND');
      }
      
      const availableStock = variant.stock_quantity - variant.reserved_quantity;
      
      if (availableStock < 1) {
        throw new AppError('Exchange variant out of stock', 400, 'OUT_OF_STOCK');
      }
    }
    
    // Create exchange request
    const exchange = await ExchangeModel.create(data);
    
    // Send notification emails
    try {
      await EmailService.sendEmail(
        order.user_email,
        'Exchange Request Received',
        `
          <h2>Exchange Request Received</h2>
          <p>Hi ${order.user_name},</p>
          <p>We have received your exchange request for order #${order.order_number}.</p>
          <p><strong>Reason:</strong> ${this.getReasonLabel(data.reason)}</p>
          <p><strong>Details:</strong> ${data.reason_details}</p>
          <p>Our team will review your request and get back to you within 24 hours.</p>
          <p>Thank you for your patience!</p>
        `
      );
      
      // Notify admin
      await EmailService.sendEmail(
        'admin@karaboutique.com',
        'New Exchange Request',
        `
          <h2>New Exchange Request</h2>
          <p>Order: #${order.order_number}</p>
          <p>Customer: ${order.user_name} (${order.user_email})</p>
          <p>Reason: ${this.getReasonLabel(data.reason)}</p>
          <p>Details: ${data.reason_details}</p>
          <p><a href="${process.env.FRONTEND_URL}/admin/exchanges/${exchange.id}">View Exchange Request</a></p>
        `
      );
    } catch (emailError) {
      console.error('Failed to send exchange notification email:', emailError);
      // Don't fail the request if email fails
    }
    
    return exchange;
  }
  
  /**
   * Get user's exchange requests
   */
  static async getUserExchanges(userId: string) {
    return await ExchangeModel.getUserExchanges(userId);
  }
  
  /**
   * Get all exchange requests (admin)
   */
  static async getAllExchanges(
    status?: ExchangeStatus,
    page: number = 1,
    limit: number = 20
  ) {
    const result = await ExchangeModel.getAll(status, page, limit);
    
    return {
      exchanges: result.exchanges,
      total: result.total,
      page,
      limit,
      totalPages: Math.ceil(result.total / limit),
    };
  }
  
  /**
   * Get exchange by ID
   */
  static async getExchangeById(id: string, userId?: string) {
    const exchange = await ExchangeModel.findById(id);
    
    if (!exchange) {
      throw new AppError('Exchange request not found', 404, 'EXCHANGE_NOT_FOUND');
    }
    
    // If userId provided, verify ownership
    if (userId && exchange.user_id !== userId) {
      throw new AppError('Access denied', 403, 'ACCESS_DENIED');
    }
    
    return exchange;
  }
  
  /**
   * Update exchange status (admin)
   */
  static async updateExchangeStatus(
    id: string,
    status: ExchangeStatus,
    adminNotes?: string
  ) {
    const exchange = await ExchangeModel.findById(id);
    
    if (!exchange) {
      throw new AppError('Exchange request not found', 404, 'EXCHANGE_NOT_FOUND');
    }
    
    // Update status
    const updated = await ExchangeModel.updateStatus(id, status, adminNotes);
    
    // Get order details for notification
    const order = await OrderModel.findByIdWithDetails(exchange.order_id);
    
    if (!order) {
      return updated;
    }
    
    // Send notification based on status
    try {
      if (status === ExchangeStatus.APPROVED) {
        await EmailService.sendEmail(
          order.user_email,
          'Exchange Request Approved',
          `
            <h2>Exchange Request Approved!</h2>
            <p>Hi ${order.user_name},</p>
            <p>Great news! Your exchange request for order #${order.order_number} has been approved.</p>
            ${adminNotes ? `<p><strong>Note:</strong> ${adminNotes}</p>` : ''}
            <p>We will arrange for pickup of the product. You will receive a confirmation email with pickup details shortly.</p>
            <p>Thank you for shopping with us!</p>
          `
        );
        
        // Send SMS
        if (order.user_email) {
          await SMSService.sendSMS(
            order.user_email, // Assuming phone stored in user
            `Your exchange request for order ${order.order_number} has been approved. Pickup will be scheduled soon.`
          );
        }
      } else if (status === ExchangeStatus.REJECTED) {
        await EmailService.sendEmail(
          order.user_email,
          'Exchange Request Update',
          `
            <h2>Exchange Request Update</h2>
            <p>Hi ${order.user_name},</p>
            <p>We have reviewed your exchange request for order #${order.order_number}.</p>
            <p>Unfortunately, we are unable to process this exchange request.</p>
            ${adminNotes ? `<p><strong>Reason:</strong> ${adminNotes}</p>` : ''}
            <p>If you have any questions, please contact our customer support.</p>
          `
        );
      } else if (status === ExchangeStatus.COMPLETED) {
        await EmailService.sendEmail(
          order.user_email,
          'Exchange Completed',
          `
            <h2>Exchange Completed Successfully!</h2>
            <p>Hi ${order.user_name},</p>
            <p>Your exchange for order #${order.order_number} has been completed.</p>
            <p>Your new product has been shipped and will arrive soon.</p>
            <p>Thank you for shopping with Kara Boutique!</p>
          `
        );
      }
    } catch (emailError) {
      console.error('Failed to send exchange status email:', emailError);
    }
    
    return updated;
  }
  
  /**
   * Cancel exchange request (user)
   */
  static async cancelExchange(id: string, userId: string) {
    const exchange = await ExchangeModel.findById(id);
    
    if (!exchange) {
      throw new AppError('Exchange request not found', 404, 'EXCHANGE_NOT_FOUND');
    }
    
    // Verify ownership
    if (exchange.user_id !== userId) {
      throw new AppError('Access denied', 403, 'ACCESS_DENIED');
    }
    
    // Can only cancel if status is 'requested'
    if (exchange.status !== ExchangeStatus.REQUESTED) {
      throw new AppError('Cannot cancel exchange at this stage', 400, 'CANNOT_CANCEL');
    }
    
    // Update status to cancelled
    return await ExchangeModel.updateStatus(id, ExchangeStatus.CANCELLED);
  }
  
  /**
   * Helper: Get readable reason label
   */
  private static getReasonLabel(reason: ExchangeReason): string {
    const labels: Record<ExchangeReason, string> = {
      [ExchangeReason.SIZE_ISSUE]: 'Size Issue',
      [ExchangeReason.COLOR_DIFFERENCE]: 'Color Difference',
      [ExchangeReason.DEFECTIVE]: 'Defective Product',
      [ExchangeReason.WRONG_ITEM]: 'Wrong Item Received',
      [ExchangeReason.OTHER]: 'Other',
    };
    
    return labels[reason] || reason;
  }
}

export default ExchangeService;
