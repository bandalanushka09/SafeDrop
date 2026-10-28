import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { analyticsService } from '../../services/analyticsService';
import { alertService } from '../../services/alertService';
import { sourceService } from '../../services/sourceService';
import WaterSourceMap from '../../components/maps/WaterSourceMap';
import {
  Droplets,
  ShieldCheck,
  Activity,
  AlertTriangle,
  ArrowRight,
  BookOpen,
  MapPin,
  FileCheck,
  CheckCircle2,
} from 'lucide-react';
import Badge from '../../components/common/Badge';
import Skeleton from '../../components/common/Skeleton';

export const LandingPage = () => {
  const [summary, setSummary] = useState(null);
  const [alerts, setAlerts] = useState([]);
  const [mapSources, setMapSources] = useState([]);
  const [mapLoading, setMapLoading] = useState(true);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [sumRes, alertRes] = await Promise.all([
          analyticsService.getSummary(),
          alertService.getAll({ limit: 3, isPublic: 'true' }),
        ]);
        if (sumRes.success) setSummary(sumRes.data);
        if (alertRes.success) setAlerts(alertRes.data);
      } catch (err) {
        console.warn('Failed to load landing metrics:', err.message);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  useEffect(() => {
    sourceService
      .getAll({ forMap: 'true', limit: 500 })
      .then((response) => {
        if (response.success) setMapSources(response.data || []);
      })
      .catch((err) => console.warn('Failed to load water map preview:', err.message))
      .finally(() => setMapLoading(false));
  }, []);

  return (
    <div className="space-y-16 py-8 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto">
      {/* Hero Section */}
      <section className="bg-white rounded-xl border border-surface-border p-8 lg:p-12 shadow-sm text-center md:text-left flex flex-col md:flex-row items-center justify-between gap-8">
        <div className="max-w-2xl space-y-4">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded bg-teal-50 border border-brand-200 text-brand-800 text-xs font-semibold uppercase tracking-wider">
            <Droplets className="w-3.5 h-3.5" />
            <span>Community Water Safety Platform</span>
          </div>

          <h1 className="text-3xl sm:text-4xl lg:text-5xl font-extrabold text-text-primary tracking-tight leading-tight">
            Safe Water. <br className="hidden sm:inline" />
            <span className="text-brand-700">Healthy Villages.</span>
          </h1>

          <p className="text-base sm:text-lg text-text-secondary leading-relaxed">
            SafeDrop connects residents, community health workers, and administrators to track
            drinking-water sources, record certified quality tests, report suspected contamination,
            and monitor potential health risks in real time.
          </p>

          <div className="flex flex-wrap items-center justify-center md:justify-start gap-3 pt-2">
            <Link
              to="/sources"
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded bg-brand-700 hover:bg-brand-800 text-white font-medium text-sm transition-colors shadow-sm"
            >
              <span>Explore Water Sources</span>
              <ArrowRight className="w-4 h-4" />
            </Link>
            <Link
              to="/submit-report"
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded bg-white hover:bg-slate-50 text-text-primary border border-surface-border font-medium text-sm transition-colors shadow-xs"
            >
              <span>Report Water Concern</span>
            </Link>
            <Link
              to="/education"
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded bg-slate-100 hover:bg-slate-200 text-text-primary font-medium text-sm transition-colors"
            >
              <BookOpen className="w-4 h-4 text-text-secondary" />
              <span>Disease Awareness</span>
            </Link>
          </div>
        </div>

        {/* Hero Feature Box */}
        <div className="w-full md:w-80 bg-slate-50 rounded-lg border border-surface-border p-5 space-y-3.5 text-left shrink-0">
          <div className="font-semibold text-xs text-text-primary uppercase tracking-wider">
            Core Principles
          </div>
          <div className="flex items-start gap-2.5 text-xs text-text-secondary">
            <CheckCircle2 className="w-4 h-4 text-brand-700 shrink-0 mt-0.5" />
            <span>Objective rule-based water quality risk evaluation</span>
          </div>
          <div className="flex items-start gap-2.5 text-xs text-text-secondary">
            <CheckCircle2 className="w-4 h-4 text-brand-700 shrink-0 mt-0.5" />
            <span>Multi-role access for villagers, health workers, and administrators</span>
          </div>
          <div className="flex items-start gap-2.5 text-xs text-text-secondary">
            <CheckCircle2 className="w-4 h-4 text-brand-700 shrink-0 mt-0.5" />
            <span>Clear distinction between unverified and reviewed tests</span>
          </div>
          <div className="flex items-start gap-2.5 text-xs text-text-secondary">
            <CheckCircle2 className="w-4 h-4 text-brand-700 shrink-0 mt-0.5" />
            <span>Evidence-based WHO waterborne disease prevention guidelines</span>
          </div>
        </div>
      </section>

      {/* Real Statistics Section */}
      <section className="space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-xl font-bold text-text-primary">Community Water Monitor</h2>
            <p className="text-xs text-text-secondary mt-0.5">
              Live operational metrics backed by recorded database entries.
            </p>
          </div>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="bg-white rounded-lg border border-surface-border p-5 shadow-xs">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-semibold text-text-secondary uppercase">Water Sources</span>
              <MapPin className="w-4 h-4 text-brand-700" />
            </div>
            {loading ? (
              <Skeleton className="h-8 w-16" />
            ) : (
              <div className="text-2xl font-bold text-text-primary">
                {summary?.sources?.total || 0}
              </div>
            )}
            <p className="text-[11px] text-text-secondary mt-1">
              {summary?.sources?.active || 0} active sources monitored
            </p>
          </div>

          <div className="bg-white rounded-lg border border-surface-border p-5 shadow-xs">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-semibold text-text-secondary uppercase">Quality Tests</span>
              <Activity className="w-4 h-4 text-brand-700" />
            </div>
            {loading ? (
              <Skeleton className="h-8 w-16" />
            ) : (
              <div className="text-2xl font-bold text-text-primary">
                {summary?.tests?.total || 0}
              </div>
            )}
            <p className="text-[11px] text-text-secondary mt-1">
              {summary?.tests?.verified || 0} verified laboratory tests
            </p>
          </div>

          <div className="bg-white rounded-lg border border-surface-border p-5 shadow-xs">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-semibold text-text-secondary uppercase">Citizen Reports</span>
              <FileCheck className="w-4 h-4 text-brand-700" />
            </div>
            {loading ? (
              <Skeleton className="h-8 w-16" />
            ) : (
              <div className="text-2xl font-bold text-text-primary">
                {summary?.reports?.total || 0}
              </div>
            )}
            <p className="text-[11px] text-text-secondary mt-1">
              {summary?.reports?.resolved || 0} issues investigated & resolved
            </p>
          </div>

          <div className="bg-white rounded-lg border border-surface-border p-5 shadow-xs">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-semibold text-text-secondary uppercase">Public Advisories</span>
              <AlertTriangle className="w-4 h-4 text-status-warning" />
            </div>
            {loading ? (
              <Skeleton className="h-8 w-16" />
            ) : (
              <div className="text-2xl font-bold text-text-primary">
                {summary?.alerts?.active || 0}
              </div>
            )}
            <p className="text-[11px] text-text-secondary mt-1">Active community safety alerts</p>
          </div>
        </div>
      </section>

      {/* Active Advisories Section */}
      {alerts.length > 0 && (
        <section className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <AlertTriangle className="w-5 h-5 text-status-warning" />
              <h2 className="text-xl font-bold text-text-primary">Recent Water Safety Advisories</h2>
            </div>
            <Link to="/alerts" className="text-xs font-semibold text-brand-700 hover:underline">
              View All Alerts →
            </Link>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {alerts.map((alert) => (
              <div
                key={alert._id}
                className="bg-white rounded-lg border border-amber-200 p-5 shadow-xs space-y-2 border-l-4 border-l-status-warning"
              >
                <div className="flex items-center justify-between gap-2">
                  <h4 className="font-semibold text-sm text-text-primary">{alert.title}</h4>
                  <Badge status={alert.severity} size="xs" />
                </div>
                <p className="text-xs text-text-secondary leading-relaxed line-clamp-2">
                  {alert.message}
                </p>
                <div className="pt-2 border-t border-surface-border flex items-center justify-between text-[11px] text-text-secondary">
                  <span>Affected: {alert.affectedVillage}</span>
                  <span className="font-medium text-brand-700">{alert.recommendedAction}</span>
                </div>
              </div>
            ))}
          </div>
        </section>
      )}

      <section className="space-y-4">
        <div className="flex flex-col justify-between gap-3 sm:flex-row sm:items-end">
          <div>
            <h2 className="text-xl font-bold text-text-primary">Water Sources Across India</h2>
            <p className="mt-1 text-xs text-text-secondary">Explore mapped sources and their latest recorded water-quality risk.</p>
            <div className="mt-3 flex flex-wrap gap-2 text-xs">
              {[
                ['Total', mapSources.length, 'text-text-primary'],
                ['Safe', mapSources.filter((source) => source.riskLevel === 'SAFE').length, 'text-green-800'],
                ['Warning', mapSources.filter((source) => source.riskLevel === 'WARNING').length, 'text-amber-800'],
                ['High Risk', mapSources.filter((source) => source.riskLevel === 'HIGH_RISK').length, 'text-red-800'],
                ['Not Tested', mapSources.filter((source) => !source.riskLevel || source.riskLevel === 'UNKNOWN').length, 'text-slate-700'],
              ].map(([label, count, color]) => (
                <span key={label} className={`rounded border border-surface-border bg-white px-2.5 py-1 font-semibold ${color}`}>
                  {mapLoading ? '…' : count} {label}
                </span>
              ))}
            </div>
          </div>
          <Link to="/map" className="inline-flex min-h-10 items-center justify-center rounded bg-brand-700 px-4 py-2 text-sm font-semibold text-white hover:bg-brand-800">
            Explore Full Map
          </Link>
        </div>
        {mapLoading ? (
          <Skeleton className="h-[400px] w-full rounded-xl" />
        ) : (
          <WaterSourceMap sources={mapSources} height="400px" />
        )}
      </section>

      <section className="flex flex-col justify-between gap-5 rounded-xl border border-brand-200 bg-white p-6 shadow-sm sm:flex-row sm:items-center sm:p-8">
        <div className="max-w-2xl">
          <h2 className="text-xl font-bold text-text-primary">Report a Water Concern</h2>
          <p className="mt-2 text-sm leading-relaxed text-text-secondary">
            Found dirty, unsafe, damaged, or contaminated drinking water? Report it to help your community take action. You can submit a report without signing in.
          </p>
        </div>
        <div className="flex shrink-0 flex-col gap-2 sm:flex-row">
          <Link to="/submit-report" className="inline-flex min-h-10 items-center justify-center gap-2 rounded bg-brand-700 px-4 py-2 text-sm font-semibold text-white hover:bg-brand-800">
            <FileCheck className="h-4 w-4" /> Report Water Concern
          </Link>
          <Link to="/map" className="inline-flex min-h-10 items-center justify-center rounded border border-surface-border px-4 py-2 text-sm font-semibold text-text-primary hover:bg-slate-50">
            Explore Water Map
          </Link>
        </div>
      </section>

      {/* How SafeDrop Works Section */}
      <section className="space-y-6">
        <div className="text-center max-w-xl mx-auto">
          <h2 className="text-2xl font-bold text-text-primary">How SafeDrop Works</h2>
          <p className="text-xs text-text-secondary mt-1">
            A transparent four-step cycle for drinking-water monitoring and community protection.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          <div className="bg-white rounded-lg border border-surface-border p-5 text-center space-y-3">
            <div className="w-10 h-10 rounded-full bg-teal-50 text-brand-700 flex items-center justify-center font-bold text-sm mx-auto border border-brand-200">
              1
            </div>
            <h4 className="font-semibold text-sm text-text-primary">Water Source Directory</h4>
            <p className="text-xs text-text-secondary leading-relaxed">
              Villagers view registered hand pumps, borewells, and taps with geographical coordinates and past testing history.
            </p>
          </div>

          <div className="bg-white rounded-lg border border-surface-border p-5 text-center space-y-3">
            <div className="w-10 h-10 rounded-full bg-teal-50 text-brand-700 flex items-center justify-center font-bold text-sm mx-auto border border-brand-200">
              2
            </div>
            <h4 className="font-semibold text-sm text-text-primary">Citizen Reporting</h4>
            <p className="text-xs text-text-secondary leading-relaxed">
              Residents flag suspected contamination, unusual water odor or color, and damaged water infrastructure instantly.
            </p>
          </div>

          <div className="bg-white rounded-lg border border-surface-border p-5 text-center space-y-3">
            <div className="w-10 h-10 rounded-full bg-teal-50 text-brand-700 flex items-center justify-center font-bold text-sm mx-auto border border-brand-200">
              3
            </div>
            <h4 className="font-semibold text-sm text-text-primary">Testing & Risk Engine</h4>
            <p className="text-xs text-text-secondary leading-relaxed">
              Certified health workers log water tests. Configured WHO threshold rules evaluate parameters and trigger risk flags.
            </p>
          </div>

          <div className="bg-white rounded-lg border border-surface-border p-5 text-center space-y-3">
            <div className="w-10 h-10 rounded-full bg-teal-50 text-brand-700 flex items-center justify-center font-bold text-sm mx-auto border border-brand-200">
              4
            </div>
            <h4 className="font-semibold text-sm text-text-primary">Action & Education</h4>
            <p className="text-xs text-text-secondary leading-relaxed">
              Authorized administrators publish village advisories while residents access practical household water treatment guides.
            </p>
          </div>
        </div>
      </section>

      {/* Disease Education Callout */}
      <section className="bg-slate-50 rounded-xl border border-surface-border p-6 sm:p-8 flex flex-col md:flex-row items-center justify-between gap-6">
        <div className="space-y-2 max-w-xl">
          <div className="flex items-center gap-2 text-brand-800 text-xs font-semibold uppercase tracking-wider">
            <ShieldCheck className="w-4 h-4" />
            <span>Evidence-Based Guidance</span>
          </div>
          <h3 className="text-xl font-bold text-text-primary">
            Preventing Waterborne Illnesses in Your Home
          </h3>
          <p className="text-xs text-text-secondary leading-relaxed">
            Read medical guidelines and public-health manuals on cholera, typhoid fever, diarrheal diseases,
            and effective household water purification techniques like boiling and chlorination.
          </p>
        </div>
        <Link
          to="/education"
          className="px-5 py-2.5 rounded bg-brand-700 hover:bg-brand-800 text-white font-medium text-xs transition-colors shrink-0"
        >
          Explore Disease Education Centre →
        </Link>
      </section>
    </div>
  );
};

export default LandingPage;
