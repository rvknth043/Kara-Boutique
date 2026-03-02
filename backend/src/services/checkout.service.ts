import { transaction } from '../config/database';
import OrderModel, { CreateOrderData } from '../models/Order.model';
import OrderItemModel, { CreateOrderItemData } from '../models/OrderItem.model';
import CartModel from '../models/Cart.model';
import ProductVariantModel from '../models/ProductVariant.model';
import UserAddressModel from '../models/UserAddress.model';
import CouponService from './coupon.service';
import { AppError } from '../middleware/errorHandler';
import { generateOrderNumber, calculateShippingCharge, calculateDiscount } from '../utils/helpers';
import { CacheService, CACHE_KEYS } from '../config/redis';
import { PaymentMethod, PaymentStatus, OrderStatus } from '../types/shared.types';
import StorefrontSettingsService from './storefrontSettings.service';

export interface CheckoutData {
  user_id: string;
  shipping_address_id: string;
  payment_method: PaymentMethod;
  coupon_code?: string;
}

export interface StockReservation {
  reservation_id: string;
  expires_at: Date;
  items: Array<{
    variant_id: string;
    quantity: number;
  }>;
}

export class CheckoutService {
  private static RESERVATION_MINUTES = parseInt(process.env.STOCK_RESERVATION_MINUTES || '10');
  
  /**
   * Initiate checkout - Reserve stock
   */
  static async initiateCheckout(userId: string): Promise<StockReservation> {
    // Get cart items
    const cartItems = await CartModel.getUserCart(userId);
    
    if (cartItems.length === 0) {
      throw new AppError('Cart is empty', 400, 'CART_EMPTY');
    }
    
    // Validate stock availability
    const validation = await CartModel.validateCart(userId);
    
    if (!validation.valid) {
      throw new AppError(
        'Some items in your cart are out of stock',
        400,
        'INSUFFICIENT_STOCK'
      );
    }
    
    // Reserve stock for all items
    const reservedItems: Array<{ variant_id: string; quantity: number }> = [];
    
    await transaction(async (client) => {
      for (const item of cartItems) {
        const reserved = await ProductVariantModel.reserveStock(
          item.product_variant_id,
          item.quantity
        );
        
        if (!reserved) {
          throw new AppError(
            `Failed to reserve stock for ${item.product_name}`,
            400,
            'RESERVATION_FAILED'
          );
        }
        
        reservedItems.push({
          variant_id: item.product_variant_id,
          quantity: item.quantity,
        });
      }
    });
    
    // Create reservation ID and store in Redis
    const reservationId = `RES-${Date.now()}-${userId}`;
    const expiresAt = new Date(Date.now() + this.RESERVATION_MINUTES * 60 * 1000);
    
    const reservation: StockReservation = {
      reservation_id: reservationId,
      expires_at: expiresAt,
      items: reservedItems,
    };
    
    // Store reservation in Redis with expiration
    await CacheService.set(
      CACHE_KEYS.STOCK_RESERVATION(reservationId),
      reservation,
      this.RESERVATION_MINUTES * 60
    );
    
    return reservation;
  }
  
  /**
   * Complete checkout - Create order
   */
  static async completeCheckout(data: CheckoutData, reservationId?: string) {
    // Validate shipping address
    const address = await UserAddressModel.findById(data.shipping_address_id);
    
    if (!address) {
      throw new AppError('Shipping address not found', 404, 'ADDRESS_NOT_FOUND');
    }
    
    if (address.user_id !== data.user_id) {
      throw new AppError('Invalid shipping address', 403, 'INVALID_ADDRESS');
    }


    const storefrontSettings = await StorefrontSettingsService.getSettings();

    if (data.payment_method === PaymentMethod.COD) {
      const allowedByDefault = storefrontSettings.cod_default_enabled;
      const allowedPincodes = new Set(storefrontSettings.cod_enabled_pincodes || []);
      const pincode = String(address.pincode || '');
      const codAllowed = allowedByDefault || allowedPincodes.has(pincode);

      if (!codAllowed) {
        throw new AppError('Cash on Delivery is not available for this location', 400, 'COD_NOT_AVAILABLE');
      }
    }

    // Get cart
    const cartSummary = await CartModel.getUserCart(data.user_id);
    
    if (cartSummary.length === 0) {
      throw new AppError('Cart is empty', 400, 'CART_EMPTY');
    }
    
    // Calculate totals
    const totalAmount = cartSummary.reduce((sum, item) => sum + item.subtotal, 0);
    let shippingCharge = calculateShippingCharge(totalAmount);
    
    // Apply coupon if provided
    let discountAmount = 0;
    let freeShipping = false;
    
    if (data.coupon_code) {
      try {
        const couponResult = await CouponService.validateAndApplyCoupon(
          data.coupon_code,
          totalAmount,
          data.user_id
        );
        
        discountAmount = couponResult.discount;
        freeShipping = couponResult.freeShipping || false;
        
        if (freeShipping) {
          shippingCharge = 0;
        }
      } catch (error) {
        // If coupon validation fails, just proceed without discount
        console.error('Coupon validation failed:', error);
      }
    }
    
    const finalAmount = totalAmount + shippingCharge - discountAmount;
    
    // Create order in transaction
    const order = await transaction(async (client) => {
      // Create order
      const orderData: CreateOrderData = {
        user_id: data.user_id,
        order_number: generateOrderNumber(),
        total_amount: totalAmount,
        shipping_charge: shippingCharge,
        discount_amount: discountAmount,
        final_amount: finalAmount,
        payment_method: data.payment_method,
        shipping_address_id: data.shipping_address_id,
        coupon_code: data.coupon_code,
        payment_status: data.payment_method === PaymentMethod.COD 
          ? PaymentStatus.PENDING 
          : PaymentStatus.PENDING,
        order_status: OrderStatus.PLACED,
      };
      
      const createdOrder = await OrderModel.create(orderData, client);
      
      // Create order items and deduct stock
      const orderItems: CreateOrderItemData[] = [];
      
      for (const cartItem of cartSummary) {
        // Deduct stock (this also releases reservation)
        await ProductVariantModel.deductStock(
          cartItem.product_variant_id,
          cartItem.quantity
        );
        
        orderItems.push({
          order_id: createdOrder.id,
          product_variant_id: cartItem.product_variant_id,
          quantity: cartItem.quantity,
          price: cartItem.product_discount_price || cartItem.product_base_price,
          subtotal: cartItem.subtotal,
        });
      }
      
      await OrderItemModel.createMany(orderItems, client);
      
      // Clear cart
      await client.query('DELETE FROM cart WHERE user_id = $1', [data.user_id]);
      
      return createdOrder;
    });
    
    // Increment coupon usage if coupon was applied
    if (data.coupon_code && discountAmount > 0) {
      try {
        await CouponService.incrementUsage(data.coupon_code, data.user_id);
      } catch (error) {
        console.error('Failed to increment coupon usage:', error);
      }
    }
    
    // Clear reservation if exists
    if (reservationId) {
      await CacheService.del(CACHE_KEYS.STOCK_RESERVATION(reservationId));
    }
    
    // Clear cart cache
    await CacheService.del(CACHE_KEYS.CART(data.user_id));
    
    // Get complete order details
    const completeOrder = await OrderModel.findByIdWithDetails(order.id);
    
    return completeOrder;
  }
  
  /**
   * Release stock reservation (on timeout or cancellation)
   */
  static async releaseReservation(reservationId: string): Promise<void> {
    const reservation = await CacheService.get<StockReservation>(
      CACHE_KEYS.STOCK_RESERVATION(reservationId)
    );
    
    if (!reservation) {
      return; // Already released or expired
    }
    
    // Release stock for all items
    for (const item of reservation.items) {
      await ProductVariantModel.releaseStock(item.variant_id, item.quantity);
    }
    
    // Delete reservation from Redis
    await CacheService.del(CACHE_KEYS.STOCK_RESERVATION(reservationId));
  }
  
  /**
   * Validate pincode for COD
   */
  static async validatePincodeForCOD(pincode: string): Promise<{
    is_cod_available: boolean;
    is_serviceable: boolean;
  }> {
    const sql = `
      SELECT is_cod_available, is_serviceable 
      FROM pincode_cod 
      WHERE pincode = $1
    `;
    
    const { query } = await import('../config/database');
    const result = await query(sql, [pincode]);
    
    if (result.rows.length === 0) {
      return {
        is_cod_available: false,
        is_serviceable: false,
      };
    }
    
    return result.rows[0];
  }
}

export default CheckoutService;
