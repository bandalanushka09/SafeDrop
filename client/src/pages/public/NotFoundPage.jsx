import React from 'react';
import { Link } from 'react-router-dom';
import { Droplets, Home, ArrowLeft } from 'lucide-react';
import Button from '../../components/common/Button';

export const NotFoundPage = () => {
  return (
    <div className="min-h-[70vh] flex flex-col items-center justify-center p-4 text-center">
      <div className="w-16 h-16 rounded-full bg-teal-50 border border-brand-200 text-brand-700 flex items-center justify-center mb-4">
        <Droplets className="w-8 h-8" />
      </div>
      <h1 className="text-4xl font-extrabold text-text-primary tracking-tight">404</h1>
      <h2 className="text-lg font-semibold text-text-primary mt-1">Page Not Found</h2>
      <p className="text-xs text-text-secondary max-w-sm mt-2 mb-6">
        The requested water monitoring page or record does not exist or may have been moved.
      </p>
      <Link to="/">
        <Button variant="primary" icon={Home}>
          Return to SafeDrop Homepage
        </Button>
      </Link>
    </div>
  );
};

export default NotFoundPage;

