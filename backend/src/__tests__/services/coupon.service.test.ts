import { CouponService } from '../../services/coupon.service';
import CouponModel, { CouponType } from '../../models/Coupon.model';

jest.mock('../../models/Coupon.model');

describe('CouponService', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('validateCoupon', () => {
    it('should validate and apply percentage coupon', async () => {
      const mockCoupon = {
        id: '1',
        code: 'SAVE20',
        type: CouponType.PERCENTAGE,
        value: 20,
        min_order_value: 1000,
        is_active: true,
        valid_from: new Date('2024-01-01'),
        valid_until: new Date('2024-12-31'),
      };

      (CouponModel.validateCoupon as jest.Mock).mockResolvedValue({
        valid: true,
        coupon: mockCoupon,
      });

      const result = await CouponService.validateCoupon('SAVE20', 2000);

      expect(result.discount).toBe(400); // 20% of 2000
      expect(result.coupon.code).toBe('SAVE20');
    });

    it('should validate and apply fixed amount coupon', async () => {
      const mockCoupon = {
        id: '1',
        code: 'FLAT500',
        type: CouponType.FIXED,
        value: 500,
        min_order_value: 1000,
        is_active: true,
        valid_from: new Date('2024-01-01'),
        valid_until: new Date('2024-12-31'),
      };

      (CouponModel.validateCoupon as jest.Mock).mockResolvedValue({
        valid: true,
        coupon: mockCoupon,
      });

      const result = await CouponService.validateCoupon('FLAT500', 2000);

      expect(result.discount).toBe(500);
    });

    it('should apply free shipping coupon', async () => {
      const mockCoupon = {
        id: '1',
        code: 'FREESHIP',
        type: CouponType.FREE_SHIPPING,
        value: 0,
        min_order_value: 500,
        is_active: true,
        valid_from: new Date('2024-01-01'),
        valid_until: new Date('2024-12-31'),
      };

      (CouponModel.validateCoupon as jest.Mock).mockResolvedValue({
        valid: true,
        coupon: mockCoupon,
      });

      const result = await CouponService.validateCoupon('FREESHIP', 1000);

      expect(result.freeShipping).toBe(true);
      expect(result.discount).toBe(0);
    });

    it('should respect max discount for percentage coupons', async () => {
      const mockCoupon = {
        id: '1',
        code: 'SAVE20',
        type: CouponType.PERCENTAGE,
        value: 20,
        min_order_value: 1000,
        max_discount: 300,
        is_active: true,
        valid_from: new Date('2024-01-01'),
        valid_until: new Date('2024-12-31'),
      };

      (CouponModel.validateCoupon as jest.Mock).mockResolvedValue({
        valid: true,
        coupon: mockCoupon,
      });

      // Mock the calculateDiscount method
      (CouponModel.calculateDiscount as jest.Mock).mockReturnValue(300);

      const result = await CouponService.validateCoupon('SAVE20', 5000);

      // Should cap at max_discount (300) instead of 20% of 5000 (1000)
      expect(result.discount).toBe(300);
    });

    it('should throw error for invalid coupon', async () => {
      (CouponModel.validateCoupon as jest.Mock).mockResolvedValue({
        valid: false,
        reason: 'Coupon expired',
      });

      await expect(
        CouponService.validateCoupon('EXPIRED', 1000)
      ).rejects.toThrow('Coupon expired');
    });

    it('should throw error for order below minimum', async () => {
      const mockCoupon = {
        id: '1',
        code: 'SAVE20',
        type: CouponType.PERCENTAGE,
        value: 20,
        min_order_value: 2000,
        is_active: true,
      };

      (CouponModel.validateCoupon as jest.Mock).mockResolvedValue({
        valid: false,
        reason: 'Minimum order value not met',
      });

      await expect(
        CouponService.validateCoupon('SAVE20', 1000)
      ).rejects.toThrow('Minimum order value not met');
    });
  });

  describe('createCoupon', () => {
    it('should create a new coupon', async () => {
      const couponData = {
        code: 'NEWCODE',
        type: CouponType.PERCENTAGE,
        value: 15,
        min_order_value: 1000,
        valid_from: new Date('2024-06-01'),
        valid_until: new Date('2024-12-31'),
      };

      (CouponModel.findByCode as jest.Mock).mockResolvedValue(null);
      (CouponModel.create as jest.Mock).mockResolvedValue({
        id: '1',
        ...couponData,
      });

      const result = await CouponService.createCoupon(couponData);

      expect(result.code).toBe('NEWCODE');
      expect(CouponModel.create).toHaveBeenCalledWith(couponData);
    });

    it('should throw error for duplicate code', async () => {
      (CouponModel.findByCode as jest.Mock).mockResolvedValue({
        id: '1',
        code: 'EXISTS',
      });

      await expect(
        CouponService.createCoupon({
          code: 'EXISTS',
          type: CouponType.PERCENTAGE,
          value: 10,
          valid_from: new Date(),
          valid_until: new Date(),
        })
      ).rejects.toThrow('Coupon code already exists');
    });

    it('should throw error for invalid dates', async () => {
      const pastDate = new Date('2023-01-01');
      const futureDate = new Date('2024-12-31');

      await expect(
        CouponService.createCoupon({
          code: 'TEST',
          type: CouponType.PERCENTAGE,
          value: 10,
          valid_from: pastDate,
          valid_until: futureDate,
        })
      ).rejects.toThrow('Valid from date must be in the future');
    });

    it('should throw error for percentage > 100', async () => {
      await expect(
        CouponService.createCoupon({
          code: 'TEST',
          type: CouponType.PERCENTAGE,
          value: 150,
          valid_from: new Date('2024-06-01'),
          valid_until: new Date('2024-12-31'),
        })
      ).rejects.toThrow('Percentage discount cannot exceed 100%');
    });
  });

  describe('incrementUsage', () => {
    it('should increment coupon usage count', async () => {
      (CouponModel.incrementUsage as jest.Mock).mockResolvedValue(undefined);

      await CouponService.incrementUsage('TESTCODE', 'user-123');

      expect(CouponModel.incrementUsage).toHaveBeenCalledWith('TESTCODE');
    });
  });

  describe('getAllCoupons', () => {
    it('should return all active coupons', async () => {
      const mockCoupons = [
        { id: '1', code: 'CODE1', is_active: true },
        { id: '2', code: 'CODE2', is_active: true },
      ];

      (CouponModel.getAll as jest.Mock).mockResolvedValue({
        coupons: mockCoupons,
        total: 2,
      });

      const result = await CouponService.getAllCoupons(true);

      expect(result.coupons).toHaveLength(2);
      expect(result.total).toBe(2);
    });
  });

  describe('toggleCouponStatus', () => {
    it('should toggle coupon active status', async () => {
      const mockCoupon = {
        id: '1',
        code: 'TEST',
        is_active: false,
      };

      (CouponModel.toggleActive as jest.Mock).mockResolvedValue(mockCoupon);

      const result = await CouponService.toggleCouponStatus('1');

      expect(result.is_active).toBe(false);
    });
  });
});
