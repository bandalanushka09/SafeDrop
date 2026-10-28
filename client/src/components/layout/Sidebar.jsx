import React from 'react';
import { NavLink } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import {
  Droplets,
  LayoutDashboard,
  MapPin,
  ClipboardList,
  AlertTriangle,
  BookOpen,
  Bell,
  User,
  PlusCircle,
  FlaskConical,
  CheckSquare,
  Users,
  Sliders,
  FileText,
  Building,
  BarChart2,
  History,
  Settings,
  X,
} from 'lucide-react';

export const Sidebar = ({ isOpen, onClose }) => {
  const { user } = useAuth();
  const role = user?.role || 'villager';

  const linkClass = ({ isActive }) =>
    `flex items-center gap-3 px-3 py-2.5 rounded text-xs font-medium transition-colors ${
      isActive
        ? 'bg-brand-700 text-white shadow-xs'
        : 'text-text-secondary hover:text-text-primary hover:bg-slate-100'
    }`;

  return (
    <>
      {/* Mobile overlay */}
      {isOpen && (
        <div
          className="fixed inset-0 z-40 bg-slate-900/40 lg:hidden"
          onClick={onClose}
        />
      )}

      <aside
        className={`fixed top-0 bottom-0 left-0 z-40 w-64 bg-white border-r border-surface-border flex flex-col transition-transform duration-200 ease-in-out lg:translate-x-0 ${
          isOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        {/* Brand header */}
        <div className="h-16 flex items-center justify-between px-5 border-b border-surface-border">
          <NavLink to="/" className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded bg-brand-700 flex items-center justify-center text-white shrink-0">
              <Droplets className="w-5 h-5" />
            </div>
            <div>
              <span className="font-bold text-brand-800 text-lg tracking-tight block leading-none">
                SafeDrop
              </span>
              <span className="text-[10px] text-text-secondary tracking-wide uppercase font-semibold">
                Water Safety
              </span>
            </div>
          </NavLink>
          <button
            type="button"
            onClick={onClose}
            className="lg:hidden p-1 rounded text-text-secondary hover:text-text-primary"
            aria-label="Close sidebar"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Scrollable navigation menu */}
        <div className="flex-1 overflow-y-auto p-4 space-y-6">
          {/* Main Navigation */}
          <div>
            <p className="px-3 text-[10px] font-bold text-text-secondary uppercase tracking-wider mb-2">
              Main Menu
            </p>
            <nav className="space-y-1">
              <NavLink to="/dashboard" className={linkClass} onClick={onClose}>
                <LayoutDashboard className="w-4 h-4 shrink-0" />
                <span>Dashboard</span>
              </NavLink>
              <NavLink to="/sources" className={linkClass} onClick={onClose}>
                <MapPin className="w-4 h-4 shrink-0" />
                <span>Water Sources</span>
              </NavLink>
              <NavLink to="/map" className={linkClass} onClick={onClose}>
                <MapPin className="w-4 h-4 shrink-0" />
                <span>Water Map</span>
              </NavLink>
              <NavLink to="/alerts" className={linkClass} onClick={onClose}>
                <AlertTriangle className="w-4 h-4 shrink-0" />
                <span>Safety Alerts</span>
              </NavLink>
            </nav>
          </div>

          {/* Villager specific */}
          {role === 'villager' && (
            <div>
              <p className="px-3 text-[10px] font-bold text-text-secondary uppercase tracking-wider mb-2">
                Community
              </p>
              <nav className="space-y-1">
                <NavLink to="/submit-report" className={linkClass} onClick={onClose}>
                  <PlusCircle className="w-4 h-4 shrink-0" />
                  <span>Report Water Issue</span>
                </NavLink>
                <NavLink to="/my-reports" className={linkClass} onClick={onClose}>
                  <ClipboardList className="w-4 h-4 shrink-0" />
                  <span>My Reports</span>
                </NavLink>
              </nav>
            </div>
          )}

          {/* Health Worker specific */}
          {role === 'health_worker' && (
            <div>
              <p className="px-3 text-[10px] font-bold text-text-secondary uppercase tracking-wider mb-2">
                Health Operations
              </p>
              <nav className="space-y-1">
                <NavLink to="/health-worker/tests/new" className={linkClass} onClick={onClose}>
                  <FlaskConical className="w-4 h-4 shrink-0" />
                  <span>Record Water Test</span>
                </NavLink>
                <NavLink to="/health-worker/tests" className={linkClass} onClick={onClose}>
                  <CheckSquare className="w-4 h-4 shrink-0" />
                  <span>Test History</span>
                </NavLink>
                <NavLink to="/health-worker/reports" className={linkClass} onClick={onClose}>
                  <ClipboardList className="w-4 h-4 shrink-0" />
                  <span>Review Reports</span>
                </NavLink>
                <NavLink to="/health-worker/sources/new" className={linkClass} onClick={onClose}>
                  <PlusCircle className="w-4 h-4 shrink-0" />
                  <span>Register Source</span>
                </NavLink>
                <NavLink to="/health-worker/alerts/new" className={linkClass} onClick={onClose}>
                  <AlertTriangle className="w-4 h-4 shrink-0" />
                  <span>Draft Safety Alert</span>
                </NavLink>
              </nav>
            </div>
          )}

          {/* Administrator specific */}
          {role === 'admin' && (
            <div>
              <p className="px-3 text-[10px] font-bold text-text-secondary uppercase tracking-wider mb-2">
                Administration
              </p>
              <nav className="space-y-1">
                <NavLink to="/admin/users" className={linkClass} onClick={onClose}>
                  <Users className="w-4 h-4 shrink-0" />
                  <span>User Management</span>
                </NavLink>
                <NavLink to="/admin/sources" className={linkClass} onClick={onClose}>
                  <MapPin className="w-4 h-4 shrink-0" />
                  <span>Water Sources</span>
                </NavLink>
                <NavLink to="/admin/tests" className={linkClass} onClick={onClose}>
                  <FlaskConical className="w-4 h-4 shrink-0" />
                  <span>Water Tests</span>
                </NavLink>
                <NavLink to="/admin/reports" className={linkClass} onClick={onClose}>
                  <ClipboardList className="w-4 h-4 shrink-0" />
                  <span>Community Reports</span>
                </NavLink>
                <NavLink to="/admin/alerts" className={linkClass} onClick={onClose}>
                  <AlertTriangle className="w-4 h-4 shrink-0" />
                  <span>Safety Alerts</span>
                </NavLink>
                <NavLink to="/admin/risk-rules" className={linkClass} onClick={onClose}>
                  <Sliders className="w-4 h-4 shrink-0" />
                  <span>Risk Rules</span>
                </NavLink>
                <NavLink to="/admin/articles" className={linkClass} onClick={onClose}>
                  <FileText className="w-4 h-4 shrink-0" />
                  <span>Education Content</span>
                </NavLink>
                <NavLink to="/admin/villages" className={linkClass} onClick={onClose}>
                  <Building className="w-4 h-4 shrink-0" />
                  <span>Villages & Localities</span>
                </NavLink>
                <NavLink to="/admin/analytics" className={linkClass} onClick={onClose}>
                  <BarChart2 className="w-4 h-4 shrink-0" />
                  <span>Analytics & Trends</span>
                </NavLink>
                <NavLink to="/admin/audit-logs" className={linkClass} onClick={onClose}>
                  <History className="w-4 h-4 shrink-0" />
                  <span>Audit Logs</span>
                </NavLink>
                <NavLink to="/admin/settings" className={linkClass} onClick={onClose}>
                  <Settings className="w-4 h-4 shrink-0" />
                  <span>System Settings</span>
                </NavLink>
              </nav>
            </div>
          )}

          {/* Education & Personal */}
          <div>
            <p className="px-3 text-[10px] font-bold text-text-secondary uppercase tracking-wider mb-2">
              Public Health
            </p>
            <nav className="space-y-1">
              <NavLink to="/education" className={linkClass} onClick={onClose}>
                <BookOpen className="w-4 h-4 shrink-0" />
                <span>Disease Education</span>
              </NavLink>
              <NavLink to="/water-safety-guide" className={linkClass} onClick={onClose}>
                <Droplets className="w-4 h-4 shrink-0" />
                <span>Water Safety Guide</span>
              </NavLink>
              <NavLink to="/notifications" className={linkClass} onClick={onClose}>
                <Bell className="w-4 h-4 shrink-0" />
                <span>Notifications</span>
              </NavLink>
              <NavLink to="/profile" className={linkClass} onClick={onClose}>
                <User className="w-4 h-4 shrink-0" />
                <span>Profile Settings</span>
              </NavLink>
            </nav>
          </div>
        </div>

        {/* Footer info in sidebar */}
        <div className="p-4 border-t border-surface-border text-[11px] text-text-secondary bg-slate-50/50">
          <div className="font-semibold text-text-primary">SafeDrop v1.0</div>
          <div>Safe Water. Healthy Villages.</div>
        </div>
      </aside>
    </>
  );
};

export default Sidebar;

