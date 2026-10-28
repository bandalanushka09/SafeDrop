import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { useAuth } from './context/AuthContext';
import ProtectedRoute from './routes/ProtectedRoute';

// Layouts
import PublicLayout from './components/layout/PublicLayout';
import AppLayout from './components/layout/AppLayout';

// Public Pages
import LandingPage from './pages/public/LandingPage';
import PublicSourcesPage from './pages/public/PublicSourcesPage';
import PublicAlertsPage from './pages/public/PublicAlertsPage';
import EducationPage from './pages/public/EducationPage';
import ArticleDetailPage from './pages/public/ArticleDetailPage';
import WaterSafetyGuidePage from './pages/public/WaterSafetyGuidePage';
import PublicReportPage from './pages/public/PublicReportPage';
import TrackReportPage from './pages/public/TrackReportPage';
import NotFoundPage from './pages/public/NotFoundPage';

// Auth Pages
import LoginPage from './pages/auth/LoginPage';
import RegisterPage from './pages/auth/RegisterPage';

// Villager Pages
import VillagerDashboard from './pages/villager/VillagerDashboard';
import MyReportsPage from './pages/villager/MyReportsPage';
import SourceDetailPage from './pages/villager/SourceDetailPage';
import WaterSafetyMapPage from './pages/villager/WaterSafetyMapPage';
import NotificationsPage from './pages/villager/NotificationsPage';
import ProfilePage from './pages/villager/ProfilePage';

// Health Worker Pages
import HealthWorkerDashboard from './pages/health-worker/HealthWorkerDashboard';
import RecordTestPage from './pages/health-worker/RecordTestPage';
import TestHistoryPage from './pages/health-worker/TestHistoryPage';
import ReviewReportsPage from './pages/health-worker/ReviewReportsPage';
import ReportDetailPage from './pages/health-worker/ReportDetailPage';
import DraftAlertPage from './pages/health-worker/DraftAlertPage';

// Admin Pages
import AdminDashboard from './pages/admin/AdminDashboard';
import UserManagementPage from './pages/admin/UserManagementPage';
import SourceManagementPage from './pages/admin/SourceManagementPage';
import RiskRulesPage from './pages/admin/RiskRulesPage';
import ArticleManagementPage from './pages/admin/ArticleManagementPage';
import VillageManagementPage from './pages/admin/VillageManagementPage';
import AnalyticsPage from './pages/admin/AnalyticsPage';
import AuditLogsPage from './pages/admin/AuditLogsPage';
import SettingsPage from './pages/admin/SettingsPage';
import GovernmentDepartmentsPage from './pages/admin/GovernmentDepartmentsPage';

// Role Dashboard Switcher Component
const DashboardSwitcher = () => {
  const { user } = useAuth();
  if (user?.role === 'admin') return <AdminDashboard />;
  if (user?.role === 'health_worker') return <HealthWorkerDashboard />;
  return <VillagerDashboard />;
};

export const App = () => {
  return (
    <Routes>
      {/* Public Pages with PublicLayout */}
      <Route element={<PublicLayout />}>
        <Route path="/" element={<LandingPage />} />
        <Route path="/sources" element={<PublicSourcesPage />} />
        <Route path="/sources/:id" element={<SourceDetailPage />} />
        <Route path="/map" element={<WaterSafetyMapPage />} />
        <Route path="/submit-report" element={<PublicReportPage />} />
        <Route path="/track-report" element={<TrackReportPage />} />
        <Route path="/alerts" element={<PublicAlertsPage />} />
        <Route path="/education" element={<EducationPage />} />
        <Route path="/education/:slug" element={<ArticleDetailPage />} />
        <Route path="/water-safety-guide" element={<WaterSafetyGuidePage />} />
        <Route path="/login" element={<LoginPage />} />
        <Route path="/register" element={<RegisterPage />} />
      </Route>

      {/* Authenticated Portal Pages with AppLayout */}
      <Route
        element={
          <ProtectedRoute>
            <AppLayout />
          </ProtectedRoute>
        }
      >
        {/* Core Authenticated Routes */}
        <Route path="/dashboard" element={<DashboardSwitcher />} />
        <Route path="/profile" element={<ProfilePage />} />
        <Route path="/notifications" element={<NotificationsPage />} />

        {/* Villager Specific */}
        <Route path="/my-reports" element={<MyReportsPage />} />

        {/* Health Worker & Admin Shared Operations */}
        <Route
          path="/health-worker/dashboard"
          element={
            <ProtectedRoute allowedRoles={['health_worker', 'admin']}>
              <HealthWorkerDashboard />
            </ProtectedRoute>
          }
        />
        <Route
          path="/health-worker/tests/new"
          element={
            <ProtectedRoute allowedRoles={['health_worker', 'admin']}>
              <RecordTestPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/health-worker/tests"
          element={
            <ProtectedRoute allowedRoles={['health_worker', 'admin']}>
              <TestHistoryPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/health-worker/reports"
          element={
            <ProtectedRoute allowedRoles={['health_worker', 'admin']}>
              <ReviewReportsPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/health-worker/reports/:id"
          element={
            <ProtectedRoute allowedRoles={['health_worker', 'admin']}>
              <ReportDetailPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/health-worker/sources/new"
          element={
            <ProtectedRoute allowedRoles={['health_worker', 'admin']}>
              <SourceManagementPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/health-worker/alerts/new"
          element={
            <ProtectedRoute allowedRoles={['health_worker', 'admin']}>
              <DraftAlertPage />
            </ProtectedRoute>
          }
        />

        {/* Admin Only Operations */}
        <Route
          path="/admin/dashboard"
          element={
            <ProtectedRoute allowedRoles={['admin']}>
              <AdminDashboard />
            </ProtectedRoute>
          }
        />
        <Route
          path="/admin/users"
          element={
            <ProtectedRoute allowedRoles={['admin']}>
              <UserManagementPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/admin/sources"
          element={
            <ProtectedRoute allowedRoles={['admin']}>
              <SourceManagementPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/admin/sources/new"
          element={
            <ProtectedRoute allowedRoles={['admin']}>
              <SourceManagementPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/admin/tests"
          element={
            <ProtectedRoute allowedRoles={['admin']}>
              <TestHistoryPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/admin/reports"
          element={
            <ProtectedRoute allowedRoles={['admin']}>
              <ReviewReportsPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/admin/alerts"
          element={
            <ProtectedRoute allowedRoles={['admin']}>
              <PublicAlertsPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/admin/alerts/new"
          element={
            <ProtectedRoute allowedRoles={['admin']}>
              <DraftAlertPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/admin/risk-rules"
          element={
            <ProtectedRoute allowedRoles={['admin']}>
              <RiskRulesPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/admin/articles"
          element={
            <ProtectedRoute allowedRoles={['admin']}>
              <ArticleManagementPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/admin/villages"
          element={
            <ProtectedRoute allowedRoles={['admin']}>
              <VillageManagementPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/admin/analytics"
          element={
            <ProtectedRoute allowedRoles={['admin']}>
              <AnalyticsPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/admin/audit-logs"
          element={
            <ProtectedRoute allowedRoles={['admin']}>
              <AuditLogsPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/admin/settings"
          element={
            <ProtectedRoute allowedRoles={['admin']}>
              <SettingsPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/admin/government-departments"
          element={
            <ProtectedRoute allowedRoles={['admin']}>
              <GovernmentDepartmentsPage />
            </ProtectedRoute>
          }
        />
      </Route>

      {/* 404 Catch All */}
      <Route path="*" element={<NotFoundPage />} />
    </Routes>
  );
};

export default App;
