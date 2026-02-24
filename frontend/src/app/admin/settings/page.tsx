'use client';

import { useEffect, useState } from 'react';
import { useAuth } from '@/context/AuthContext';
import api from '@/lib/api';
import toast from 'react-hot-toast';

interface StorefrontSettings {
  allow_returns: boolean;
  allow_exchanges: boolean;
  cod_default_enabled: boolean;
  cod_enabled_pincodes: string[];
}

const DEFAULT_SETTINGS: StorefrontSettings = {
  allow_returns: true,
  allow_exchanges: true,
  cod_default_enabled: false,
  cod_enabled_pincodes: [],
};

export default function AdminSettingsPage() {
  const { isAdmin } = useAuth();
  const [settings, setSettings] = useState<StorefrontSettings>(DEFAULT_SETTINGS);
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
      };
      setSettings(normalized);
      setPincodeText((normalized.cod_enabled_pincodes || []).join(', '));
    } catch (error) {
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
        cod_enabled_pincodes,
      };

      await api.put('/admin/settings', payload);
      setSettings(payload);
      toast.success('Settings updated successfully');
    } catch (error) {
      toast.error('Failed to update settings');
    } finally {
      setSaving(false);
    }
  };

  if (!isAdmin) return null;
  if (loading) return <div className="p-4">Loading settings...</div>;

  return (
    <div className="container-fluid py-4">
      <h2 className="mb-4">Storefront Controls</h2>

      <div className="card mb-4">
        <div className="card-body">
          <h5 className="mb-3">Order Policy Controls</h5>

          <div className="form-check form-switch mb-3">
            <input
              className="form-check-input"
              type="checkbox"
              checked={settings.allow_returns}
              onChange={(e) => setSettings((prev) => ({ ...prev, allow_returns: e.target.checked }))}
              id="allowReturns"
            />
            <label className="form-check-label" htmlFor="allowReturns">
              Allow Returns
            </label>
          </div>

          <div className="form-check form-switch mb-3">
            <input
              className="form-check-input"
              type="checkbox"
              checked={settings.allow_exchanges}
              onChange={(e) => setSettings((prev) => ({ ...prev, allow_exchanges: e.target.checked }))}
              id="allowExchanges"
            />
            <label className="form-check-label" htmlFor="allowExchanges">
              Allow Exchanges
            </label>
          </div>
        </div>
      </div>

      <div className="card mb-4">
        <div className="card-body">
          <h5 className="mb-3">COD Controls</h5>

          <div className="form-check form-switch mb-3">
            <input
              className="form-check-input"
              type="checkbox"
              checked={settings.cod_default_enabled}
              onChange={(e) => setSettings((prev) => ({ ...prev, cod_default_enabled: e.target.checked }))}
              id="codDefault"
            />
            <label className="form-check-label" htmlFor="codDefault">
              Enable COD by default for all locations
            </label>
          </div>

          <label className="form-label">COD enabled pincodes (comma separated)</label>
          <input
            className="form-control"
            value={pincodeText}
            onChange={(e) => setPincodeText(e.target.value)}
            placeholder="560001, 400001"
          />
          <small className="text-muted">If default COD is off, only these pincodes can use COD.</small>
        </div>
      </div>

      <button className="btn btn-primary" onClick={save} disabled={saving}>
        {saving ? 'Saving...' : 'Save Settings'}
      </button>
    </div>
  );
}
