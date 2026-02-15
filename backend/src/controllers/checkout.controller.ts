import { Request, Response } from 'express';
import CheckoutService from '../services/checkout.service';
import { asyncHandler } from '../middleware/errorHandler';

export class CheckoutController {
  /**
   * Initiate checkout (reserve stock)
   * POST /api/v1/checkout/initiate
   */
  static initiateCheckout = asyncHandler(async (req: Request, res: Response) => {
    const userId = req.user!.userId;
    
    const reservation = await CheckoutService.initiateCheckout(userId);
    
    res.status(200).json({
      success: true,
      message: 'Checkout initiated. Stock reserved for 10 minutes.',
      data: reservation,
    });
  });
  
  /**
   * Complete checkout (create order)
   * POST /api/v1/checkout/complete
   */
  static completeCheckout = asyncHandler(async (req: Request, res: Response) => {
    const userId = req.user!.userId;
    const { shipping_address_id, payment_method, reservation_id, coupon_code } = req.body;
    
    const order = await CheckoutService.completeCheckout(
      {
        user_id: userId,
        shipping_address_id,
        payment_method,
        coupon_code,
      },
      reservation_id
    );
    
    res.status(201).json({
      success: true,
      message: 'Order created successfully',
      data: order,
    });
  });
  
  /**
   * Release stock reservation
   * POST /api/v1/checkout/release/:reservationId
   */
  static releaseReservation = asyncHandler(async (req: Request, res: Response) => {
    const { reservationId } = req.params;
    
    await CheckoutService.releaseReservation(reservationId);
    
    res.status(200).json({
      success: true,
      message: 'Stock reservation released',
    });
  });
  
  /**
   * Validate pincode for COD
   * GET /api/v1/checkout/validate-pincode/:pincode
   */
  static validatePincode = asyncHandler(async (req: Request, res: Response) => {
    const { pincode } = req.params;
    
    const result = await CheckoutService.validatePincodeForCOD(pincode);
    
    res.status(200).json({
      success: true,
      data: result,
    });
  });
}

export default CheckoutController;
