import React from 'react';
import { Outlet, Link, NavLink } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { Droplets, LogIn, UserPlus, LayoutDashboard, FileWarning } from 'lucide-react';
import Footer from './Footer';

export const PublicLayout = () => {
  const { isAuthenticated, user } = useAuth();

  const navLinkClass = ({ isActive }) =>
    `text-xs font-medium px-3 py-1.5 rounded transition-colors ${
      isActive
        ? 'text-brand-700 bg-teal-50 font-semibold'
        : 'text-text-secondary hover:text-text-primary hover:bg-slate-100'
    }`;

  return (
    <div className="min-h-screen flex flex-col bg-surface-bg text-text-primary">
      {/* Top Header */}
      <header className="sticky top-0 z-30 h-16 bg-white border-b border-surface-border px-4 lg:px-8 flex items-center justify-between shadow-xs">
        <Link to="/" className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded bg-brand-700 flex items-center justify-center text-white shrink-0">
            <Droplets className="w-5 h-5" />
          </div>
          <div>
            <span className="font-bold text-brand-800 text-lg tracking-tight block leading-none">
              SafeDrop
            </span>
            <span className="text-[10px] text-text-secondary tracking-wide uppercase font-semibold">
              Safe Water. Healthy Villages.
            </span>
          </div>
        </Link>

        {/* Public nav links */}
        <nav className="hidden md:flex items-center gap-1">
          <NavLink to="/" end className={navLinkClass}>
            Home
          </NavLink>
          <NavLink to="/sources" className={navLinkClass}>
            Water Sources
          </NavLink>
          <NavLink to="/submit-report" className={navLinkClass}>
            Report Concern
          </NavLink>
          <NavLink to="/map" className={navLinkClass}>
            Safety Map
          </NavLink>
          <NavLink to="/alerts" className={navLinkClass}>
            Alerts
          </NavLink>
          <NavLink to="/education" className={navLinkClass}>
            Disease Awareness
          </NavLink>
          <NavLink to="/water-safety-guide" className={navLinkClass}>
            Treatment Guide
          </NavLink>
        </nav>

        {/* Auth CTA */}
        <div className="flex items-center gap-2.5">
          <Link
            to="/submit-report"
            aria-label="Report a water concern"
            className="inline-flex items-center gap-1.5 rounded bg-brand-700 px-2 py-1.5 text-xs font-semibold text-white transition-colors hover:bg-brand-800 sm:px-3"
          >
            <FileWarning className="w-4 h-4" />
            <span className="hidden sm:inline">Report Concern</span>
          </Link>
          {isAuthenticated ? (
            <Link
              to="/dashboard"
              className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded text-xs font-semibold bg-brand-700 hover:bg-brand-800 text-white transition-colors"
            >
              <LayoutDashboard className="w-4 h-4" />
              <span>Go to Dashboard</span>
            </Link>
          ) : (
            <>
              <Link
                to="/login"
                className="inline-flex items-center gap-1 px-3 py-1.5 rounded text-xs font-semibold text-text-primary hover:bg-slate-100 transition-colors"
              >
                <LogIn className="w-4 h-4" />
                <span>Sign In</span>
              </Link>
              <Link
                to="/register"
                className="inline-flex items-center gap-1 px-3.5 py-1.5 rounded text-xs font-semibold bg-brand-700 hover:bg-brand-800 text-white transition-colors"
              >
                <UserPlus className="w-4 h-4" />
                <span>Register</span>
              </Link>
            </>
          )}
        </div>
      </header>

      {/* Main content */}
      <main className="flex-1">
        <Outlet />
      </main>

      <Footer />
    </div>
  );
};

export default PublicLayout;
