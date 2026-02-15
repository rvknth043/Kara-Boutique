import { Request, Response } from 'express';
import UserAddressModel from '../models/UserAddress.model';
import { asyncHandler } from '../middleware/errorHandler';

export class AddressController {
  /**
   * Get user's addresses
   * GET /api/v1/users/addresses
   */
  static getUserAddresses = asyncHandler(async (req: Request, res: Response) => {
    const userId = req.user!.userId;
    
    const addresses = await UserAddressModel.getUserAddresses(userId);
    
    res.status(200).json({
      success: true,
      data: addresses,
    });
  });
  
  /**
   * Get address by ID
   * GET /api/v1/users/addresses/:id
   */
  static getAddressById = asyncHandler(async (req: Request, res: Response) => {
    const { id } = req.params;
    const userId = req.user!.userId;
    
    const address = await UserAddressModel.findById(id);
    
    if (!address) {
      return res.status(404).json({
        success: false,
        error: {
          code: 'ADDRESS_NOT_FOUND',
          message: 'Address not found',
        },
      });
    }
    
    // Verify ownership
    if (address.user_id !== userId) {
      return res.status(403).json({
        success: false,
        error: {
          code: 'ACCESS_DENIED',
          message: 'Access denied',
        },
      });
    }
    
    res.status(200).json({
      success: true,
      data: address,
    });
  });
  
  /**
   * Create new address
   * POST /api/v1/users/addresses
   */
  static createAddress = asyncHandler(async (req: Request, res: Response) => {
    const userId = req.user!.userId;
    const {
      address_line1,
      address_line2,
      city,
      state,
      pincode,
      country,
      is_default,
    } = req.body;
    
    const address = await UserAddressModel.create({
      user_id: userId,
      address_line1,
      address_line2,
      city,
      state,
      pincode,
      country,
      is_default,
    });
    
    res.status(201).json({
      success: true,
      message: 'Address created successfully',
      data: address,
    });
  });
  
  /**
   * Update address
   * PUT /api/v1/users/addresses/:id
   */
  static updateAddress = asyncHandler(async (req: Request, res: Response) => {
    const { id } = req.params;
    const userId = req.user!.userId;
    const updateData = req.body;
    
    const address = await UserAddressModel.update(id, userId, updateData);
    
    if (!address) {
      return res.status(404).json({
        success: false,
        error: {
          code: 'ADDRESS_NOT_FOUND',
          message: 'Address not found or unauthorized',
        },
      });
    }
    
    res.status(200).json({
      success: true,
      message: 'Address updated successfully',
      data: address,
    });
  });
  
  /**
   * Delete address
   * DELETE /api/v1/users/addresses/:id
   */
  static deleteAddress = asyncHandler(async (req: Request, res: Response) => {
    const { id } = req.params;
    const userId = req.user!.userId;
    
    const deleted = await UserAddressModel.delete(id, userId);
    
    if (!deleted) {
      return res.status(404).json({
        success: false,
        error: {
          code: 'ADDRESS_NOT_FOUND',
          message: 'Address not found or unauthorized',
        },
      });
    }
    
    res.status(200).json({
      success: true,
      message: 'Address deleted successfully',
    });
  });
  
  /**
   * Set default address
   * PUT /api/v1/users/addresses/:id/default
   */
  static setDefaultAddress = asyncHandler(async (req: Request, res: Response) => {
    const { id } = req.params;
    const userId = req.user!.userId;
    
    const address = await UserAddressModel.update(id, userId, { is_default: true });
    
    if (!address) {
      return res.status(404).json({
        success: false,
        error: {
          code: 'ADDRESS_NOT_FOUND',
          message: 'Address not found or unauthorized',
        },
      });
    }
    
    res.status(200).json({
      success: true,
      message: 'Default address updated',
      data: address,
    });
  });
}

export default AddressController;
