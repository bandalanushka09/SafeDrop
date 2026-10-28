import React, { useState, useEffect } from 'react';
import { adminService } from '../../services/adminService';
import { useToast } from '../../context/ToastContext';
import { Settings, Save, ShieldAlert, CheckCircle2 } from 'lucide-react';
import Input from '../../components/common/Input';
import Textarea from '../../components/common/Textarea';
import Button from '../../components/common/Button';
import Skeleton from '../../components/common/Skeleton';

export const SettingsPage = () => {
  const { showToast } = useToast();
  const [formData, setFormData] = useState({
    appName: 'SafeDrop',
    tagline: 'Safe Water. Healthy Villages.',
    contactEmail: 'contact@safedrop.org',
    supportPhone: '+91 98765 00000',
    allowPublicRegistration: true,
    requireVerificationForAlerts: true,
    alertRetentionDays: 90,
    systemNotice: '',
  });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    const fetchSettings = async () => {
      try {
        setLoading(true);
        const res = await adminService.getSettings();
        if (res.success && res.data) {
          setFormData((prev) => ({ ...prev, ...res.data }));
        }
      } catch (err) {
        console.error('Failed to load settings:', err);
      } finally {
        setLoading(false);
      }
    };
    fetchSettings();
  }, []);

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData({
      ...formData,
      [name]: type === 'checkbox' ? checked : value,
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      setSaving(true);
      await adminService.updateSettings(formData);
      showToast('System configuration settings saved successfully.');
    } catch (err) {
      showToast(err.message || 'Failed to save settings', 'error');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="max-w-2xl mx-auto space-y-4 py-6">
        <Skeleton className="h-8 w-40" />
        <Skeleton className="h-64 w-full rounded-xl" />
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-text-primary">System Settings & Configuration</h1>
        <p className="text-xs text-text-secondary mt-1">
          Configure platform branding, operational notices, and administrative compliance parameters.
        </p>
      </div>

      <div className="bg-white rounded-xl border border-surface-border p-6 shadow-sm">
        <form onSubmit={handleSubmit} className="space-y-5">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Input
              label="Application Name"
              name="appName"
              value={formData.appName}
              onChange={handleChange}
              required
            />
            <Input
              label="Application Tagline"
              name="tagline"
              value={formData.tagline}
              onChange={handleChange}
              required
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Input
              label="Administrative Contact Email"
              type="email"
              name="contactEmail"
              value={formData.contactEmail}
              onChange={handleChange}
              required
            />
            <Input
              label="Public Helpline Phone"
              name="supportPhone"
              value={formData.supportPhone}
              onChange={handleChange}
            />
          </div>

          <Input
            label="Alert Retention Window (Days)"
            type="number"
            name="alertRetentionDays"
            value={formData.alertRetentionDays}
            onChange={handleChange}
            helperText="Number of days closed advisories are retained in public query cache."
          />

          <Textarea
            label="Global System Notice Banner (Optional)"
            name="systemNotice"
            rows={2}
            placeholder="e.g. Scheduled monsoon water sampling drive active through November 5 across Rampur sector."
            value={formData.systemNotice}
            onChange={handleChange}
          />

          <div className="pt-2 border-t border-surface-border space-y-2">
            <div className="flex items-center gap-2">
              <input
                type="checkbox"
                id="allowPublicRegistration"
                name="allowPublicRegistration"
                checked={formData.allowPublicRegistration}
                onChange={handleChange}
                className="w-4 h-4 text-brand-700 border-surface-border rounded"
              />
              <label htmlFor="allowPublicRegistration" className="text-xs font-semibold text-text-primary">
                Allow open community resident registration
              </label>
            </div>

            <div className="flex items-center gap-2">
              <input
                type="checkbox"
                id="requireVerificationForAlerts"
                name="requireVerificationForAlerts"
                checked={formData.requireVerificationForAlerts}
                onChange={handleChange}
                className="w-4 h-4 text-brand-700 border-surface-border rounded"
              />
              <label htmlFor="requireVerificationForAlerts" className="text-xs font-semibold text-text-primary">
                Require administrative sign-off before publishing public advisories
              </label>
            </div>
          </div>

          <div className="pt-3">
            <Button type="submit" variant="primary" loading={saving} icon={Save}>
              Save System Configuration
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default SettingsPage;

