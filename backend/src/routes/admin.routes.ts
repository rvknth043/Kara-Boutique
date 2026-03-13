import { Router } from 'express';
import { authenticate, isAdmin } from '../middleware/auth.middleware';
import { asyncHandler } from '../middleware/errorHandler';
import StorefrontSettingsService from '../services/storefrontSettings.service';

const router = Router();

router.get('/', authenticate, isAdmin, asyncHandler(async (_req, res) => {
  res.json({ message: 'Admin routes' });
}));

router.get('/settings', authenticate, isAdmin, asyncHandler(async (_req, res) => {
  const settings = await StorefrontSettingsService.getSettings();
  res.status(200).json({ success: true, data: settings });
}));

router.get('/settings/public', asyncHandler(async (_req, res) => {
  const settings = await StorefrontSettingsService.getSettings();
  res.status(200).json({ success: true, data: settings });
}));

router.put('/settings', authenticate, isAdmin, asyncHandler(async (req, res) => {
  const settings = await StorefrontSettingsService.updateSettings(req.body || {});
  res.status(200).json({ success: true, message: 'Settings updated', data: settings });
}));

export default router;
