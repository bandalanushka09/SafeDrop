import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../context/ToastContext';
import { Droplets, Mail, Lock, User, Phone, MapPin, Globe } from 'lucide-react';
import Input from '../../components/common/Input';
import Select from '../../components/common/Select';
import Button from '../../components/common/Button';
import AlertBox from '../../components/common/AlertBox';

export const RegisterPage = () => {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    confirmPassword: '',
    village: 'Rampur',
    phoneNumber: '',
    preferredLanguage: 'en',
  });
  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');

  const { register } = useAuth();
  const { showToast } = useToast();
  const navigate = useNavigate();

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setErrorMessage('');

    if (formData.password.length < 8) {
      setErrorMessage('Password must be at least 8 characters long.');
      return;
    }

    if (formData.password !== formData.confirmPassword) {
      setErrorMessage('Password confirmation does not match.');
      return;
    }

    try {
      setLoading(true);
      const res = await register({
        name: formData.name,
        email: formData.email,
        password: formData.password,
        village: formData.village,
        phoneNumber: formData.phoneNumber,
        preferredLanguage: formData.preferredLanguage,
      });

      showToast(`Account registered successfully! Welcome, ${res.user.name}.`);
      navigate('/dashboard');
    } catch (err) {
      setErrorMessage(err.message || 'Registration failed. Please check your information.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-[80vh] flex flex-col justify-center py-12 sm:px-6 lg:px-8">
      <div className="sm:mx-auto sm:w-full sm:max-w-md text-center space-y-2">
        <Link to="/" className="inline-flex items-center gap-2">
          <div className="w-10 h-10 rounded bg-brand-700 flex items-center justify-center text-white">
            <Droplets className="w-6 h-6" />
          </div>
          <span className="font-bold text-2xl text-brand-800 tracking-tight">SafeDrop</span>
        </Link>
        <h2 className="text-xl font-bold text-text-primary tracking-tight">
          Create Community Member Account
        </h2>
        <p className="text-xs text-text-secondary">
          Register to report water issues, view local source safety, and receive alerts.
        </p>
      </div>

      <div className="mt-6 sm:mx-auto sm:w-full sm:max-w-md">
        <div className="bg-white py-8 px-6 sm:px-10 rounded-xl border border-surface-border shadow-sm space-y-5">
          {errorMessage && (
            <AlertBox type="error" title="Registration Error">
              {errorMessage}
            </AlertBox>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <Input
              label="Full Name"
              name="name"
              placeholder="e.g. Anjali Sharma"
              icon={User}
              value={formData.name}
              onChange={handleChange}
              required
            />

            <Input
              label="Email Address"
              name="email"
              type="email"
              placeholder="anjali@example.com"
              icon={Mail}
              value={formData.email}
              onChange={handleChange}
              required
            />

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <Input
                label="Village / Locality"
                name="village"
                placeholder="Rampur"
                icon={MapPin}
                value={formData.village}
                onChange={handleChange}
                required
              />

              <Input
                label="Phone Number"
                name="phoneNumber"
                placeholder="+91 98765 00000"
                icon={Phone}
                value={formData.phoneNumber}
                onChange={handleChange}
              />
            </div>

            <Select
              label="Preferred Language"
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

            <Input
              label="Password (min 8 chars)"
              name="password"
              type="password"
              placeholder="••••••••"
              icon={Lock}
              value={formData.password}
              onChange={handleChange}
              required
            />

            <Input
              label="Confirm Password"
              name="confirmPassword"
              type="password"
              placeholder="••••••••"
              icon={Lock}
              value={formData.confirmPassword}
              onChange={handleChange}
              required
            />

            <div className="text-[11px] text-text-secondary">
              By registering, you agree that SafeDrop is an awareness and reporting platform and does not certify absolute water potability or provide medical care.
            </div>

            <Button
              type="submit"
              variant="primary"
              className="w-full py-2.5 font-semibold text-sm"
              loading={loading}
            >
              Complete Registration
            </Button>
          </form>

          <div className="text-center text-xs text-text-secondary pt-2">
            Already registered?{' '}
            <Link to="/login" className="font-semibold text-brand-700 hover:underline">
              Sign In
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
};

export default RegisterPage;

