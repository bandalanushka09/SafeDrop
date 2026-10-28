import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { Loader2, ShieldAlert } from 'lucide-react';
import Button from '../components/common/Button';

export const ProtectedRoute = ({ children, allowedRoles }) => {
  const { user, isAuthenticated, loading } = useAuth();
  const location = useLocation();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-surface-bg">
        <div className="flex flex-col items-center gap-3">
          <Loader2 className="w-8 h-8 animate-spin text-brand-700" />
          <span className="text-xs font-medium text-text-secondary">Verifying credentials...</span>
        </div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  if (allowedRoles && !allowedRoles.includes(user?.role)) {
    return (
      <div className="max-w-md mx-auto py-16 text-center space-y-4">
        <div className="w-12 h-12 rounded-full bg-red-50 text-status-danger flex items-center justify-center mx-auto border border-red-200">
          <ShieldAlert className="w-6 h-6" />
        </div>
        <h2 className="text-xl font-bold text-text-primary">Access Restricted</h2>
        <p className="text-xs text-text-secondary leading-relaxed">
          Your current account role (<strong>{user?.role?.replace('_', ' ')}</strong>) does not have authorization to view this management module.
        </p>
        <Navigate to="/dashboard" replace />
      </div>
    );
  }

  return children;
};

export default ProtectedRoute;

