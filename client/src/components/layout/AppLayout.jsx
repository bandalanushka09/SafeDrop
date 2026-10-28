import React, { useState } from 'react';
import { Outlet, useLocation } from 'react-router-dom';
import Sidebar from './Sidebar';
import Navbar from './Navbar';
import Footer from './Footer';

export const AppLayout = () => {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const location = useLocation();

  // Determine a clean title based on current path
  const getPageTitle = (pathname) => {
    if (pathname.includes('/dashboard')) return 'Dashboard';
    if (pathname.includes('/sources/new')) return 'Register Water Source';
    if (pathname.includes('/sources')) return 'Water Sources Directory';
    if (pathname.includes('/map')) return 'Water Safety Map';
    if (pathname.includes('/tests/new')) return 'Record Water-Quality Test';
    if (pathname.includes('/tests')) return 'Water Testing Records';
    if (pathname.includes('/submit-report')) return 'Report Suspected Contamination';
    if (pathname.includes('/my-reports')) return 'My Water Reports';
    if (pathname.includes('/reports')) return 'Community Reports';
    if (pathname.includes('/alerts/new')) return 'Draft Safety Alert';
    if (pathname.includes('/alerts')) return 'Safety Alerts';
    if (pathname.includes('/education')) return 'Disease Awareness Centre';
    if (pathname.includes('/water-safety-guide')) return 'Water Safety Guide';
    if (pathname.includes('/notifications')) return 'Notifications';
    if (pathname.includes('/profile')) return 'Profile Settings';
    if (pathname.includes('/admin/users')) return 'User Management';
    if (pathname.includes('/admin/risk-rules')) return 'Risk Rules Configuration';
    if (pathname.includes('/admin/villages')) return 'Village Management';
    if (pathname.includes('/admin/analytics')) return 'System Analytics & Trends';
    if (pathname.includes('/admin/audit-logs')) return 'Audit Logs';
    if (pathname.includes('/admin/settings')) return 'System Settings';
    return 'SafeDrop';
  };

  return (
    <div className="min-h-screen flex flex-col bg-surface-bg text-text-primary">
      <Sidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />

      {/* Main content area shifted right on lg screens for sidebar */}
      <div className="lg:pl-64 flex flex-col flex-1 min-h-screen">
        <Navbar
          onToggleSidebar={() => setSidebarOpen(!sidebarOpen)}
          pageTitle={getPageTitle(location.pathname)}
        />
        <main className="flex-1 p-4 sm:p-6 lg:p-8 max-w-7xl w-full mx-auto">
          <Outlet />
        </main>
        <Footer />
      </div>
    </div>
  );
};

export default AppLayout;

