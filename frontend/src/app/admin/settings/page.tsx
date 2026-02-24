'use client';

import { useEffect, useState } from 'react';
import { useAuth } from '@/context/AuthContext';
import api from '@/lib/api';
import toast from 'react-hot-toast';

const DEFAULT_SETTINGS = {
  general: {
    store_name: 'Kara Boutique',
    store_email: 'support@karaboutique.com',
    support_contact_number: '+91 9876543210',
    store_address: 'India',
    default_currency: 'INR',
    time_zone: 'Asia/Kolkata',
    default_language: 'en',
    date_time_format: 'DD/MM/YYYY HH:mm',
  },
  user: {
    guest_checkout_enabled: true,
    email_verification_required: false,
    account_lockout_enabled: true,
  },
  product: {
    sku_auto_generation: true,
    inventory_tracking_enabled: true,
    low_stock_alert_threshold: 10,
    allow_backorders: false,
    review_moderation_mode: 'manual',
  },
  order: {
    return_window_days: 7,
    auto_cancel_unpaid_minutes: 30,
    invoice_auto_generation: true,
    allow_returns: true,
    allow_exchanges: true,
    order_editing_after_placement: false,
  },
  payment: {
    enable_card: true,
    enable_upi: true,
    enable_netbanking: true,
    enable_wallet: true,
    cod_default_enabled: false,
    cod_enabled_pincodes: [],
    minimum_order_value: 0,
    payment_timeout_minutes: 15,
  },
  shipping: {
    flat_rate_shipping: 49,
    free_shipping_threshold: 1499,
    estimated_delivery_days: 5,
  },
  notification: {
    email_enabled: true,
    sms_enabled: false,
    whatsapp_enabled: false,
    admin_order_alerts: true,
    low_stock_alerts: true,
  },
  system: {
    maintenance_mode: false,
    feature_flags_enabled: true,
  },
};

export default function AdminSettingsPage() {
  const { isAdmin } = useAuth();
  const [settings, setSettings] = useState<any>(DEFAULT_SETTINGS);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [pincodeText, setPincodeText] = useState('');

  useEffect(() => {
    if (isAdmin) fetchSettings();
  }, [isAdmin]);

  const fetchSettings = async () => {
    try {
      const response = await api.get('/admin/settings');
      const payload = response.data?.data || DEFAULT_SETTINGS;
      const normalized = {
        ...DEFAULT_SETTINGS,
        ...payload,
        general: { ...DEFAULT_SETTINGS.general, ...(payload.general || {}) },
        user: { ...DEFAULT_SETTINGS.user, ...(payload.user || {}) },
        product: { ...DEFAULT_SETTINGS.product, ...(payload.product || {}) },
        order: { ...DEFAULT_SETTINGS.order, ...(payload.order || {}) },
        payment: { ...DEFAULT_SETTINGS.payment, ...(payload.payment || {}) },
        shipping: { ...DEFAULT_SETTINGS.shipping, ...(payload.shipping || {}) },
        notification: { ...DEFAULT_SETTINGS.notification, ...(payload.notification || {}) },
        system: { ...DEFAULT_SETTINGS.system, ...(payload.system || {}) },
      };
      setSettings(normalized);
      setPincodeText((normalized.payment.cod_enabled_pincodes || []).join(', '));
    } catch {
      toast.error('Failed to load settings');
    } finally {
      setLoading(false);
    }
  };

  const save = async () => {
    setSaving(true);
    try {
      const cod_enabled_pincodes = pincodeText
        .split(',')
        .map((p) => p.trim())
        .filter((p) => /^\d{6}$/.test(p));

      const payload = {
        ...settings,
        payment: {
          ...settings.payment,
          cod_enabled_pincodes,
        },
      };

      await api.put('/admin/settings', payload);
      setSettings(payload);
      toast.success('Settings updated successfully');
    } catch {
      toast.error('Failed to update settings');
    } finally {
      setSaving(false);
    }
  };

  const updateSection = (section: string, key: string, value: any) => {
    setSettings((prev: any) => ({
      ...prev,
      [section]: {
        ...prev[section],
        [key]: value,
      },
    }));
  };

  if (!isAdmin) return null;
  if (loading) return <div className="p-4">Loading settings...</div>;

  return (
    <div className="container-fluid py-4">
      <h2 className="mb-4">Admin Settings</h2>

      <div className="row g-4">
        <div className="col-lg-6">
          <div className="card"><div className="card-body">
            <h5>General Settings</h5>
            <input className="form-control mb-2" value={settings.general.store_name} onChange={(e) => updateSection('general', 'store_name', e.target.value)} placeholder="Store Name" />
            <input className="form-control mb-2" value={settings.general.store_email} onChange={(e) => updateSection('general', 'store_email', e.target.value)} placeholder="Store Email" />
            <input className="form-control mb-2" value={settings.general.support_contact_number} onChange={(e) => updateSection('general', 'support_contact_number', e.target.value)} placeholder="Support Contact" />
            <input className="form-control" value={settings.general.default_currency} onChange={(e) => updateSection('general', 'default_currency', e.target.value)} placeholder="Currency" />
          </div></div>
        </div>

        <div className="col-lg-6">
          <div className="card"><div className="card-body">
            <h5>User & Role Controls</h5>
            <div className="form-check form-switch"><input className="form-check-input" type="checkbox" checked={settings.user.guest_checkout_enabled} onChange={(e) => updateSection('user', 'guest_checkout_enabled', e.target.checked)} /><label className="form-check-label">Guest Checkout</label></div>
            <div className="form-check form-switch"><input className="form-check-input" type="checkbox" checked={settings.user.email_verification_required} onChange={(e) => updateSection('user', 'email_verification_required', e.target.checked)} /><label className="form-check-label">Email Verification Required</label></div>
            <div className="form-check form-switch"><input className="form-check-input" type="checkbox" checked={settings.user.account_lockout_enabled} onChange={(e) => updateSection('user', 'account_lockout_enabled', e.target.checked)} /><label className="form-check-label">Account Lockout Policy</label></div>
          </div></div>
        </div>

        <div className="col-lg-6">
          <div className="card"><div className="card-body">
            <h5>Product Settings</h5>
            <div className="form-check form-switch"><input className="form-check-input" type="checkbox" checked={settings.product.sku_auto_generation} onChange={(e) => updateSection('product', 'sku_auto_generation', e.target.checked)} /><label className="form-check-label">SKU Auto Generation</label></div>
            <div className="form-check form-switch"><input className="form-check-input" type="checkbox" checked={settings.product.inventory_tracking_enabled} onChange={(e) => updateSection('product', 'inventory_tracking_enabled', e.target.checked)} /><label className="form-check-label">Inventory Tracking</label></div>
            <div className="form-check form-switch mb-2"><input className="form-check-input" type="checkbox" checked={settings.product.allow_backorders} onChange={(e) => updateSection('product', 'allow_backorders', e.target.checked)} /><label className="form-check-label">Allow Backorders</label></div>
            <label className="form-label">Low Stock Alert Threshold</label>
            <input className="form-control" type="number" value={settings.product.low_stock_alert_threshold} onChange={(e) => updateSection('product', 'low_stock_alert_threshold', Number(e.target.value || 0))} />
          </div></div>
        </div>

        <div className="col-lg-6">
          <div className="card"><div className="card-body">
            <h5>Order Settings</h5>
            <div className="form-check form-switch"><input className="form-check-input" type="checkbox" checked={settings.order.allow_returns} onChange={(e) => updateSection('order', 'allow_returns', e.target.checked)} /><label className="form-check-label">Allow Returns</label></div>
            <div className="form-check form-switch"><input className="form-check-input" type="checkbox" checked={settings.order.allow_exchanges} onChange={(e) => updateSection('order', 'allow_exchanges', e.target.checked)} /><label className="form-check-label">Allow Exchanges</label></div>
            <div className="form-check form-switch mb-2"><input className="form-check-input" type="checkbox" checked={settings.order.invoice_auto_generation} onChange={(e) => updateSection('order', 'invoice_auto_generation', e.target.checked)} /><label className="form-check-label">Invoice Auto Generation</label></div>
            <label className="form-label">Return Window (Days)</label>
            <input className="form-control mb-2" type="number" value={settings.order.return_window_days} onChange={(e) => updateSection('order', 'return_window_days', Number(e.target.value || 0))} />
            <label className="form-label">Auto Cancel Unpaid Orders (Minutes)</label>
            <input className="form-control" type="number" value={settings.order.auto_cancel_unpaid_minutes} onChange={(e) => updateSection('order', 'auto_cancel_unpaid_minutes', Number(e.target.value || 0))} />
          </div></div>
        </div>

        <div className="col-lg-6">
          <div className="card"><div className="card-body">
            <h5>Payment Settings</h5>
            <div className="form-check form-switch"><input className="form-check-input" type="checkbox" checked={settings.payment.enable_card} onChange={(e) => updateSection('payment', 'enable_card', e.target.checked)} /><label className="form-check-label">Card</label></div>
            <div className="form-check form-switch"><input className="form-check-input" type="checkbox" checked={settings.payment.enable_upi} onChange={(e) => updateSection('payment', 'enable_upi', e.target.checked)} /><label className="form-check-label">UPI</label></div>
            <div className="form-check form-switch"><input className="form-check-input" type="checkbox" checked={settings.payment.enable_netbanking} onChange={(e) => updateSection('payment', 'enable_netbanking', e.target.checked)} /><label className="form-check-label">Net Banking</label></div>
            <div className="form-check form-switch"><input className="form-check-input" type="checkbox" checked={settings.payment.enable_wallet} onChange={(e) => updateSection('payment', 'enable_wallet', e.target.checked)} /><label className="form-check-label">Wallet</label></div>
            <div className="form-check form-switch mb-2"><input className="form-check-input" type="checkbox" checked={settings.payment.cod_default_enabled} onChange={(e) => updateSection('payment', 'cod_default_enabled', e.target.checked)} /><label className="form-check-label">COD by default</label></div>
            <label className="form-label">COD enabled pincodes (comma separated)</label>
            <input className="form-control mb-2" value={pincodeText} onChange={(e) => setPincodeText(e.target.value)} placeholder="560001, 400001" />
            <label className="form-label">Minimum Order Value</label>
            <input className="form-control" type="number" value={settings.payment.minimum_order_value} onChange={(e) => updateSection('payment', 'minimum_order_value', Number(e.target.value || 0))} />
          </div></div>
        </div>

        <div className="col-lg-6">
          <div className="card"><div className="card-body">
            <h5>Shipping / Notification / System</h5>
            <label className="form-label">Flat Shipping Rate</label>
            <input className="form-control mb-2" type="number" value={settings.shipping.flat_rate_shipping} onChange={(e) => updateSection('shipping', 'flat_rate_shipping', Number(e.target.value || 0))} />
            <label className="form-label">Free Shipping Threshold</label>
            <input className="form-control mb-3" type="number" value={settings.shipping.free_shipping_threshold} onChange={(e) => updateSection('shipping', 'free_shipping_threshold', Number(e.target.value || 0))} />

            <div className="form-check form-switch"><input className="form-check-input" type="checkbox" checked={settings.notification.email_enabled} onChange={(e) => updateSection('notification', 'email_enabled', e.target.checked)} /><label className="form-check-label">Email Notifications</label></div>
            <div className="form-check form-switch"><input className="form-check-input" type="checkbox" checked={settings.notification.sms_enabled} onChange={(e) => updateSection('notification', 'sms_enabled', e.target.checked)} /><label className="form-check-label">SMS Notifications</label></div>
            <div className="form-check form-switch"><input className="form-check-input" type="checkbox" checked={settings.notification.whatsapp_enabled} onChange={(e) => updateSection('notification', 'whatsapp_enabled', e.target.checked)} /><label className="form-check-label">WhatsApp Notifications</label></div>
            <div className="form-check form-switch"><input className="form-check-input" type="checkbox" checked={settings.system.maintenance_mode} onChange={(e) => updateSection('system', 'maintenance_mode', e.target.checked)} /><label className="form-check-label">Maintenance Mode</label></div>
          </div></div>
        </div>
      </div>

      <button className="btn btn-primary mt-4" onClick={save} disabled={saving}>
        {saving ? 'Saving...' : 'Save Settings'}
      </button>
    </div>
  );
}
