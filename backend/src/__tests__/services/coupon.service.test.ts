import { CouponService } from '../../services/coupon.service';
import CouponModel, { CouponType } from '../../models/Coupon.model';

jest.mock('../../models/Coupon.model');

const futureRange = () => {
  const validFrom = new Date(Date.now() + 24 * 60 * 60 * 1000);
  const validUntil = new Date(Date.now() + 14 * 24 * 60 * 60 * 1000);
  return { validFrom, validUntil };
};

describe('CouponService', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('validateCoupon', () => {
    it('should validate and apply percentage coupon', async () => {
      const mockCoupon = { id: '1', code: 'SAVE20', type: CouponType.PERCENTAGE, value: 20 } as any;

      (CouponModel.validateCoupon as jest.Mock).mockResolvedValue({ valid: true, coupon: mockCoupon });
      (CouponModel.calculateDiscount as jest.Mock).mockReturnValue(400);

      const result = await CouponService.validateCoupon('SAVE20', 2000);

      expect(result.discount).toBe(400);
      expect(result.coupon.code).toBe('SAVE20');
      expect(result.finalAmount).toBe(1600);
    });

    it('should validate and apply fixed amount coupon', async () => {
      const mockCoupon = { id: '1', code: 'FLAT500', type: CouponType.FIXED, value: 500 } as any;

      (CouponModel.validateCoupon as jest.Mock).mockResolvedValue({ valid: true, coupon: mockCoupon });
      (CouponModel.calculateDiscount as jest.Mock).mockReturnValue(500);

      const result = await CouponService.validateCoupon('FLAT500', 2000);

      expect(result.discount).toBe(500);
      expect(result.finalAmount).toBe(1500);
    });

    it('should apply free shipping coupon', async () => {
      const mockCoupon = { id: '1', code: 'FREESHIP', type: CouponType.FREE_SHIPPING, value: 0 } as any;

      (CouponModel.validateCoupon as jest.Mock).mockResolvedValue({ valid: true, coupon: mockCoupon });
      (CouponModel.calculateDiscount as jest.Mock).mockReturnValue(0);

      const result = await CouponService.validateCoupon('FREESHIP', 1000);

      expect(result.freeShipping).toBe(true);
      expect(result.discount).toBe(0);
    });

    it('should throw error for invalid coupon', async () => {
      (CouponModel.validateCoupon as jest.Mock).mockResolvedValue({ valid: false, reason: 'Coupon expired' });

      await expect(CouponService.validateCoupon('EXPIRED', 1000)).rejects.toThrow('Coupon expired');
    });
  });

  describe('createCoupon', () => {
    it('should create a new coupon', async () => {
      const { validFrom, validUntil } = futureRange();
      const couponData = {
        code: 'NEWCODE',
        type: CouponType.PERCENTAGE,
        value: 15,
        min_order_value: 1000,
        valid_from: validFrom,
        valid_until: validUntil,
      };

      (CouponModel.findByCode as jest.Mock).mockResolvedValue(null);
      (CouponModel.create as jest.Mock).mockResolvedValue({ id: '1', ...couponData });

      const result = await CouponService.createCoupon(couponData);

      expect(result.code).toBe('NEWCODE');
      expect(CouponModel.create).toHaveBeenCalledWith(couponData);
    });

    it('should throw error for duplicate code', async () => {
      const { validFrom, validUntil } = futureRange();
      (CouponModel.findByCode as jest.Mock).mockResolvedValue({ id: '1', code: 'EXISTS' });

      await expect(
        CouponService.createCoupon({
          code: 'EXISTS',
          type: CouponType.PERCENTAGE,
          value: 10,
          valid_from: validFrom,
          valid_until: validUntil,
        })
      ).rejects.toThrow('Coupon code already exists');
    });

    it('should throw error for invalid dates', async () => {
      const pastDate = new Date(Date.now() - 24 * 60 * 60 * 1000);
      const futureDate = new Date(Date.now() + 24 * 60 * 60 * 1000);

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
      const { validFrom, validUntil } = futureRange();
      await expect(
        CouponService.createCoupon({
          code: 'TEST',
          type: CouponType.PERCENTAGE,
          value: 150,
          valid_from: validFrom,
          valid_until: validUntil,
        })
      ).rejects.toThrow('Percentage discount cannot exceed 100%');
    });
  });

  it('should increment usage count', async () => {
    (CouponModel.incrementUsage as jest.Mock).mockResolvedValue(undefined);

    await CouponService.incrementUsage('TESTCODE', 'user-123');

    expect(CouponModel.incrementUsage).toHaveBeenCalledWith('TESTCODE');
  });
});
