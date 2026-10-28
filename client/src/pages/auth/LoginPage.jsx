import React, { useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../context/ToastContext';
import { Droplets, Mail, Lock, Shield, Activity, User, ArrowRight } from 'lucide-react';
import Input from '../../components/common/Input';
import Button from '../../components/common/Button';
import AlertBox from '../../components/common/AlertBox';

export const LoginPage = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');

  const { login } = useAuth();
  const { showToast } = useToast();
  const navigate = useNavigate();
  const location = useLocation();

  const isExpired = new URLSearchParams(location.search).get('expired');

  const handleSubmit = async (e) => {
    e.preventDefault();
    setErrorMessage('');

    if (!email || !password) {
      setErrorMessage('Please enter both email and password.');
      return;
    }

    try {
      setLoading(true);
      const res = await login(email, password);
      showToast(`Welcome back, ${res.user.name}!`);
      navigate('/dashboard');
    } catch (err) {
      setErrorMessage(err.message || 'Invalid email or password credentials.');
    } finally {
      setLoading(false);
    }
  };

  const handleDemoFill = (demoEmail, demoPassword) => {
    setEmail(demoEmail);
    setPassword(demoPassword);
    setErrorMessage('');
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
          Sign In to Your Account
        </h2>
        <p className="text-xs text-text-secondary">
          Access water-source monitoring, community reports, and safety advisories.
        </p>
      </div>

      <div className="mt-6 sm:mx-auto sm:w-full sm:max-w-md">
        <div className="bg-white py-8 px-6 sm:px-10 rounded-xl border border-surface-border shadow-sm space-y-5">
          {isExpired && (
            <AlertBox type="warning" title="Session Expired">
              Your authentication session has expired. Please sign in again.
            </AlertBox>
          )}

          {errorMessage && (
            <AlertBox type="error" title="Authentication Error">
              {errorMessage}
            </AlertBox>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <Input
              label="Email Address"
              type="email"
              placeholder="name@example.com"
              icon={Mail}
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              autoComplete="email"
            />

            <Input
              label="Password"
              type="password"
              placeholder="••••••••"
              icon={Lock}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              autoComplete="current-password"
            />

            <Button
              type="submit"
              variant="primary"
              className="w-full py-2.5 font-semibold text-sm"
              loading={loading}
            >
              Sign In
            </Button>
          </form>

          {/* Quick Demo Logins for Hackathon Evaluators */}
          <div className="pt-4 border-t border-surface-border space-y-2">
            <p className="text-[11px] font-semibold text-text-secondary uppercase tracking-wider text-center">
              Quick Hackathon Demo Accounts
            </p>
            <div className="grid grid-cols-3 gap-2">
              <button
                type="button"
                onClick={() => handleDemoFill('admin@safedrop.org', 'AdminSecurePass123!')}
                className="p-2 border border-surface-border rounded bg-slate-50 hover:bg-slate-100 text-center transition-colors text-xs"
              >
                <Shield className="w-3.5 h-3.5 mx-auto text-brand-700 mb-1" />
                <span className="font-semibold block text-[11px] text-text-primary">Admin</span>
              </button>
              <button
                type="button"
                onClick={() => handleDemoFill('worker@safedrop.org', 'WorkerSecurePass123!')}
                className="p-2 border border-surface-border rounded bg-slate-50 hover:bg-slate-100 text-center transition-colors text-xs"
              >
                <Activity className="w-3.5 h-3.5 mx-auto text-indigo-600 mb-1" />
                <span className="font-semibold block text-[11px] text-text-primary">Worker</span>
              </button>
              <button
                type="button"
                onClick={() => handleDemoFill('villager@safedrop.org', 'VillagerSecurePass123!')}
                className="p-2 border border-surface-border rounded bg-slate-50 hover:bg-slate-100 text-center transition-colors text-xs"
              >
                <User className="w-3.5 h-3.5 mx-auto text-slate-600 mb-1" />
                <span className="font-semibold block text-[11px] text-text-primary">Villager</span>
              </button>
            </div>
          </div>

          <div className="text-center text-xs text-text-secondary pt-2">
            Don&apos;t have an account?{' '}
            <Link to="/register" className="font-semibold text-brand-700 hover:underline">
              Register as Villager
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
};

export default LoginPage;

