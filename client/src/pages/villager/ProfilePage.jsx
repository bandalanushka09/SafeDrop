import React, { useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../context/ToastContext';
import { authService } from '../../services/authService';
import { User, Phone, MapPin, Globe, Lock, Shield, CheckCircle2 } from 'lucide-react';
import Input from '../../components/common/Input';
import Select from '../../components/common/Select';
import Button from '../../components/common/Button';
import Badge from '../../components/common/Badge';
import AlertBox from '../../components/common/AlertBox';

export const ProfilePage = () => {
  const { user, updateUser } = useAuth();
  const { showToast } = useToast();

  const [formData, setFormData] = useState({
    name: user?.name || '',
    village: user?.village || '',
    phoneNumber: user?.phoneNumber || '',
    preferredLanguage: user?.preferredLanguage || 'en',
    currentPassword: '',
    newPassword: '',
    confirmNewPassword: '',
  });

  const [saving, setSaving] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleProfileSubmit = async (e) => {
    e.preventDefault();
    setErrorMessage('');

    if (formData.newPassword) {
      if (formData.newPassword.length < 8) {
        setErrorMessage('New password must be at least 8 characters long.');
        return;
      }
      if (formData.newPassword !== formData.confirmNewPassword) {
        setErrorMessage('New password confirmation does not match.');
        return;
      }
      if (!formData.currentPassword) {
        setErrorMessage('Current password is required to change your password.');
        return;
      }
    }

    try {
      setSaving(true);
      const res = await authService.updateProfile({
        name: formData.name,
        village: formData.village,
        phoneNumber: formData.phoneNumber,
        preferredLanguage: formData.preferredLanguage,
        currentPassword: formData.currentPassword || undefined,
        newPassword: formData.newPassword || undefined,
      });

      if (res.success) {
        updateUser(res.user);
        showToast('Profile updated successfully.');
        setFormData((prev) => ({
          ...prev,
          currentPassword: '',
          newPassword: '',
          confirmNewPassword: '',
        }));
      }
    } catch (err) {
      setErrorMessage(err.message || 'Failed to update profile.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-text-primary">Profile Settings</h1>
        <p className="text-xs text-text-secondary mt-1">
          Manage your account credentials, contact information, and local village assignment.
        </p>
      </div>

      <div className="bg-white rounded-xl border border-surface-border p-6 shadow-sm space-y-6">
        {/* Account Info Header */}
        <div className="flex items-center justify-between pb-4 border-b border-surface-border">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-full bg-brand-700 text-white flex items-center justify-center font-bold text-base">
              {user?.name ? user.name.charAt(0).toUpperCase() : 'U'}
            </div>
            <div>
              <h3 className="font-bold text-base text-text-primary">{user?.name}</h3>
              <p className="text-xs text-text-secondary">{user?.email}</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Badge status={user?.role} size="sm" />
            <Badge status={user?.accountStatus} size="sm" />
          </div>
        </div>

        {errorMessage && (
          <AlertBox type="error" title="Update Error">
            {errorMessage}
          </AlertBox>
        )}

        <form onSubmit={handleProfileSubmit} className="space-y-4">
          <Input
            label="Full Name"
            name="name"
            value={formData.name}
            onChange={handleChange}
            icon={User}
            required
          />

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <Input
              label="Assigned Village / Locality"
              name="village"
              value={formData.village}
              onChange={handleChange}
              icon={MapPin}
              required
            />

            <Input
              label="Contact Phone"
              name="phoneNumber"
              value={formData.phoneNumber}
              onChange={handleChange}
              icon={Phone}
            />
          </div>

          <Select
            label="Preferred Interface Language"
            name="preferredLanguage"
            value={formData.preferredLanguage}
            onChange={handleChange}
            placeholder=""
            options={[
              { value: 'en', label: 'English' },
              { value: 'hi', label: 'Hindi (हिन्दी)' },
              { value: 'mr', label: 'Marathi (मराठी)' },
              { value: 'es', label: 'Spanish (Español)' },
            ]}
          />

          {/* Change Password Section */}
          <div className="pt-4 border-t border-surface-border space-y-3">
            <h4 className="font-semibold text-xs text-text-primary uppercase tracking-wider">
              Change Password (Leave blank to keep unchanged)
            </h4>

            <Input
              label="Current Password"
              type="password"
              name="currentPassword"
              placeholder="••••••••"
              value={formData.currentPassword}
              onChange={handleChange}
              icon={Lock}
            />

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <Input
                label="New Password"
                type="password"
                name="newPassword"
                placeholder="••••••••"
                value={formData.newPassword}
                onChange={handleChange}
                icon={Lock}
              />

              <Input
                label="Confirm New Password"
                type="password"
                name="confirmNewPassword"
                placeholder="••••••••"
                value={formData.confirmNewPassword}
                onChange={handleChange}
                icon={Lock}
              />
            </div>
          </div>

          <div className="pt-2">
            <Button
              type="submit"
              variant="primary"
              className="w-full py-2.5 font-semibold text-sm"
              loading={saving}
            >
              Save Profile Changes
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default ProfilePage;

