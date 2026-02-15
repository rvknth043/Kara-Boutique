import { Router } from 'express';
import { authenticate } from '../middleware/auth.middleware';
import { asyncHandler } from '../middleware/errorHandler';
import { query } from '../config/database';

const router = Router();

/**
 * @route   GET /api/v1/users/profile
 * @desc    Get user profile
 * @access  Private
 */
router.get('/profile', authenticate, asyncHandler(async (req, res) => {
  const userId = req.user!.userId;
  
  const result = await query(
    'SELECT id, email, full_name, phone, is_verified, created_at FROM users WHERE id = $1',
    [userId]
  );
  
  if (result.rows.length === 0) {
    return res.status(404).json({
      success: false,
      error: {
        code: 'USER_NOT_FOUND',
        message: 'User not found',
      },
    });
  }
  
  res.status(200).json({
    success: true,
    data: result.rows[0],
  });
}));

/**
 * @route   PUT /api/v1/users/profile
 * @desc    Update user profile
 * @access  Private
 */
router.put('/profile', authenticate, asyncHandler(async (req, res) => {
  const userId = req.user!.userId;
  const { full_name, phone } = req.body;
  
  const updates: string[] = [];
  const values: any[] = [];
  let paramCount = 1;
  
  if (full_name !== undefined) {
    updates.push(`full_name = $${paramCount++}`);
    values.push(full_name);
  }
  
  if (phone !== undefined) {
    updates.push(`phone = $${paramCount++}`);
    values.push(phone);
  }
  
  if (updates.length === 0) {
    return res.status(400).json({
      success: false,
      error: {
        code: 'NO_UPDATES',
        message: 'No updates provided',
      },
    });
  }
  
  values.push(userId);
  
  const sql = `
    UPDATE users 
    SET ${updates.join(', ')}, updated_at = CURRENT_TIMESTAMP
    WHERE id = $${paramCount}
    RETURNING id, email, full_name, phone, is_verified, created_at
  `;
  
  const result = await query(sql, values);
  
  res.status(200).json({
    success: true,
    message: 'Profile updated successfully',
    data: result.rows[0],
  });
}));

export default router;
