import React, { useState, useRef, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { useNotifications } from '../../context/NotificationContext';
import {
  Droplets,
  Bell,
  User,
  LogOut,
  Menu,
  ChevronDown,
  Shield,
  Activity,
  UserCheck,
} from 'lucide-react';

export const Navbar = ({ onToggleSidebar, pageTitle = 'Dashboard' }) => {
  const { user, logout } = useAuth();
  const { unreadCount, notifications } = useNotifications();
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [notifDropdownOpen, setNotifDropdownOpen] = useState(false);
  const dropdownRef = useRef(null);
  const notifRef = useRef(null);
  const navigate = useNavigate();

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target)) {
        setDropdownOpen(false);
      }
      if (notifRef.current && !notifRef.current.contains(e.target)) {
        setNotifDropdownOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleLogout = async () => {
    await logout();
    navigate('/login');
  };

  const getRoleIcon = (role) => {
    switch (role) {
      case 'admin':
        return <Shield className="w-3.5 h-3.5 text-brand-700 inline mr-1" />;
      case 'health_worker':
        return <Activity className="w-3.5 h-3.5 text-indigo-600 inline mr-1" />;
      default:
        return <UserCheck className="w-3.5 h-3.5 text-slate-600 inline mr-1" />;
    }
  };

  return (
    <header className="sticky top-0 z-30 h-16 bg-white border-b border-surface-border px-4 lg:px-6 flex items-center justify-between shadow-xs">
      {/* Left section: mobile hamburger & page title */}
      <div className="flex items-center gap-3">
        <button
          type="button"
          onClick={onToggleSidebar}
          className="lg:hidden p-1.5 rounded text-text-secondary hover:text-text-primary hover:bg-slate-100 focus:outline-none"
          aria-label="Toggle navigation"
        >
          <Menu className="w-5 h-5" />
        </button>
        <div className="flex items-center gap-2">
          <Link to="/" className="flex items-center gap-2 lg:hidden">
            <div className="w-8 h-8 rounded bg-brand-700 flex items-center justify-center text-white">
              <Droplets className="w-4 h-4" />
            </div>
            <span className="font-bold text-brand-800 text-lg tracking-tight">SafeDrop</span>
          </Link>
          <span className="hidden lg:inline-block text-lg font-semibold text-text-primary">
            {pageTitle}
          </span>
        </div>
      </div>

      {/* Right section: notifications, profile */}
      <div className="flex items-center gap-3">
        {/* Notifications toggle */}
        <div className="relative" ref={notifRef}>
          <button
            type="button"
            onClick={() => {
              setNotifDropdownOpen(!notifDropdownOpen);
              setDropdownOpen(false);
            }}
            className="relative p-2 rounded-full text-text-secondary hover:text-text-primary hover:bg-slate-100 transition-colors focus:outline-none"
            aria-label="View notifications"
          >
            <Bell className="w-5 h-5" />
            {unreadCount > 0 && (
              <span className="absolute top-1 right-1 w-4 h-4 bg-status-danger text-white text-[10px] font-bold rounded-full flex items-center justify-center">
                {unreadCount > 9 ? '9+' : unreadCount}
              </span>
            )}
          </button>

          {/* Notifications preview dropdown */}
          {notifDropdownOpen && (
            <div className="absolute right-0 mt-2 w-80 bg-white rounded-lg border border-surface-border shadow-lg py-2 z-40">
              <div className="px-4 py-2 border-b border-surface-border flex items-center justify-between">
                <span className="font-semibold text-xs text-text-primary uppercase tracking-wider">
                  Notifications ({unreadCount} unread)
                </span>
                <Link
                  to="/notifications"
                  onClick={() => setNotifDropdownOpen(false)}
                  className="text-xs text-brand-700 hover:underline"
                >
                  View all
                </Link>
              </div>
              <div className="max-h-64 overflow-y-auto divide-y divide-surface-border">
                {notifications.length === 0 ? (
                  <div className="p-4 text-center text-xs text-text-secondary">
                    No notifications yet.
                  </div>
                ) : (
                  notifications.slice(0, 5).map((n) => (
                    <div
                      key={n._id}
                      className={`px-4 py-2.5 text-xs hover:bg-slate-50 transition-colors ${
                        !n.readAt ? 'bg-teal-50/50' : ''
                      }`}
                    >
                      <div className="font-medium text-text-primary">{n.title}</div>
                      <div className="text-text-secondary mt-0.5 line-clamp-2">{n.message}</div>
                    </div>
                  ))
                )}
              </div>
            </div>
          )}
        </div>

        {/* User profile dropdown */}
        <div className="relative" ref={dropdownRef}>
          <button
            type="button"
            onClick={() => {
              setDropdownOpen(!dropdownOpen);
              setNotifDropdownOpen(false);
            }}
            className="flex items-center gap-2 p-1.5 rounded-lg hover:bg-slate-100 text-left transition-colors focus:outline-none"
          >
            <div className="w-8 h-8 rounded-full bg-brand-700 text-white flex items-center justify-center font-semibold text-xs shrink-0">
              {user?.name ? user.name.charAt(0).toUpperCase() : 'U'}
            </div>
            <div className="hidden md:block text-left">
              <div className="text-xs font-semibold text-text-primary leading-tight">
                {user?.name || 'User'}
              </div>
              <div className="text-[11px] text-text-secondary leading-tight capitalize">
                {getRoleIcon(user?.role)}
                {user?.role?.replace('_', ' ')}
              </div>
            </div>
            <ChevronDown className="w-4 h-4 text-text-secondary hidden md:block" />
          </button>

          {dropdownOpen && (
            <div className="absolute right-0 mt-2 w-52 bg-white rounded-lg border border-surface-border shadow-lg py-1.5 z-40">
              <div className="px-4 py-2 border-b border-surface-border">
                <p className="text-xs font-semibold text-text-primary">{user?.name}</p>
                <p className="text-[11px] text-text-secondary truncate">{user?.email}</p>
                <div className="mt-1 text-[11px] text-brand-700 font-medium">
                  {user?.village || 'General'}
                </div>
              </div>

              <Link
                to="/profile"
                onClick={() => setDropdownOpen(false)}
                className="flex items-center gap-2.5 px-4 py-2 text-xs text-text-primary hover:bg-slate-50 transition-colors"
              >
                <User className="w-4 h-4 text-text-secondary" />
                <span>Profile Settings</span>
              </Link>

              <button
                type="button"
                onClick={handleLogout}
                className="w-full flex items-center gap-2.5 px-4 py-2 text-xs text-status-danger hover:bg-red-50 transition-colors border-t border-surface-border"
              >
                <LogOut className="w-4 h-4" />
                <span>Sign Out</span>
              </button>
            </div>
          )}
        </div>
      </div>
    </header>
  );
};

export default Navbar;

