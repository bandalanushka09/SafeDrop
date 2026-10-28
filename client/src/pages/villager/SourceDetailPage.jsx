import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { MapContainer, TileLayer, CircleMarker } from 'react-leaflet';
import { sourceService } from '../../services/sourceService';
import { useAuth } from '../../context/AuthContext';
import {
  MapPin,
  Calendar,
  Activity,
  AlertTriangle,
  PlusCircle,
  FlaskConical,
  Edit,
  ArrowLeft,
  CheckCircle2,
  Users,
  ShieldAlert,
} from 'lucide-react';
import Badge from '../../components/common/Badge';
import Button from '../../components/common/Button';
import Skeleton from '../../components/common/Skeleton';
import EmptyState from '../../components/common/EmptyState';

export const SourceDetailPage = () => {
  const { id } = useParams();
  const { isRole } = useAuth();
  const [source, setSource] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const fetchSourceDetails = async () => {
      try {
        setLoading(true);
        const res = await sourceService.getById(id);
        if (res.success) {
          setSource(res.data);
        }
      } catch (err) {
        setError(err.message || 'Water source not found');
      } finally {
        setLoading(false);
      }
    };
    fetchSourceDetails();
  }, [id]);

  if (loading) {
    return (
      <div className="space-y-6 max-w-4xl mx-auto py-6">
        <Skeleton className="h-8 w-48" />
        <Skeleton className="h-40 w-full rounded-xl" />
        <Skeleton className="h-64 w-full rounded-xl" />
      </div>
    );
  }

  if (error || !source) {
    return (
      <div className="max-w-md mx-auto py-12 text-center space-y-4">
        <p className="text-sm text-status-danger">{error || 'Water source not found.'}</p>
        <Link to="/sources">
          <Button variant="secondary" icon={ArrowLeft}>
            Back to Sources
          </Button>
        </Link>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Top back navigation */}
      <div>
        <Link
          to="/sources"
          className="inline-flex items-center gap-1.5 text-xs font-semibold text-brand-700 hover:underline"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Back to Sources Directory</span>
        </Link>
      </div>

      {/* Source Information Card */}
      <div className="bg-white rounded-xl border border-surface-border p-6 shadow-sm space-y-5">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div className="space-y-1">
            <div className="flex items-center gap-2.5">
              <h1 className="text-2xl font-bold text-text-primary">{source.name}</h1>
              <Badge status={source.status} size="sm" />
            </div>
            <div className="flex flex-wrap items-center gap-3 text-xs text-text-secondary">
              <span className="capitalize font-medium text-text-primary">
                Type: {source.type?.replace(/_/g, ' ')}
              </span>
              <span>•</span>
              <span className="flex items-center gap-1">
                <MapPin className="w-3.5 h-3.5" />
                {source.village}
              </span>
              {source.servingPopulation > 0 && (
                <>
                  <span>•</span>
                  <span className="flex items-center gap-1">
                    <Users className="w-3.5 h-3.5" />
                    Est. {source.servingPopulation} residents served
                  </span>
                </>
              )}
            </div>
          </div>

          <div className="flex items-center gap-2">
            <Link to={`/submit-report?sourceId=${source._id}`}>
              <Button size="sm" variant="outline" icon={PlusCircle}>
                Report Issue
              </Button>
            </Link>

            {isRole(['health_worker', 'admin']) && (
              <Link to={`/health-worker/tests/new?sourceId=${source._id}`}>
                <Button size="sm" variant="primary" icon={FlaskConical}>
                  Record Test
                </Button>
              </Link>
            )}
          </div>
        </div>

        {source.coordinates?.latitude != null && source.coordinates?.longitude != null && (
          <div className="overflow-hidden rounded-lg border border-surface-border">
            <MapContainer
              center={[Number(source.coordinates.latitude), Number(source.coordinates.longitude)]}
              zoom={14}
              scrollWheelZoom={false}
              style={{ height: '280px', width: '100%' }}
            >
              <TileLayer
                attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
                url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
              />
              <CircleMarker
                center={[Number(source.coordinates.latitude), Number(source.coordinates.longitude)]}
                radius={8}
                pathOptions={{ color: '#0f766e', fillColor: '#0f766e', fillOpacity: 0.9 }}
              />
            </MapContainer>
          </div>
        )}

        {/* Location & Coordinates */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-3 border-t border-surface-border text-xs text-text-secondary">
          <div>
            <span className="font-semibold text-text-primary block mb-0.5">Physical Address / Description:</span>
            <p>{source.address || 'No specific street address provided.'}</p>
            {source.description && <p className="mt-1 text-slate-500">{source.description}</p>}
          </div>
          <div>
            <span className="font-semibold text-text-primary block mb-0.5">GPS Coordinates:</span>
            {source.coordinates?.latitude ? (
              <p className="font-mono text-text-primary">
                Latitude: {source.coordinates.latitude.toFixed(6)}, Longitude: {source.coordinates.longitude.toFixed(6)}
              </p>
            ) : (
              <p className="text-slate-500">Coordinates not registered for this water point.</p>
            )}
          </div>
        </div>
      </div>

      {/* Active Safety Alerts for this source */}
      {source.activeAlerts && source.activeAlerts.length > 0 && (
        <div className="space-y-3">
          <h3 className="font-bold text-sm text-text-primary flex items-center gap-2">
            <ShieldAlert className="w-4 h-4 text-status-warning" />
            <span>Active Safety Advisories</span>
          </h3>
          <div className="space-y-2">
            {source.activeAlerts.map((alert) => (
              <div
                key={alert._id}
                className="bg-amber-50/70 border border-amber-200 rounded-lg p-4 space-y-1 text-xs"
              >
                <div className="flex items-center justify-between gap-2">
                  <span className="font-bold text-text-primary">{alert.title}</span>
                  <Badge status={alert.severity} size="xs" />
                </div>
                <p className="text-text-secondary">{alert.message}</p>
                <div className="font-medium text-brand-800 pt-1">
                  Recommended: {alert.recommendedAction}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Active Risk Flags */}
      {source.activeFlags && source.activeFlags.length > 0 && (
        <div className="space-y-3">
          <h3 className="font-bold text-sm text-text-primary flex items-center gap-2">
            <AlertTriangle className="w-4 h-4 text-status-warning" />
            <span>Water Quality Risk Flags</span>
          </h3>
          <div className="space-y-2">
            {source.activeFlags.map((flag) => (
              <div
                key={flag._id}
                className="bg-red-50/50 border border-red-200 rounded-lg p-4 space-y-1.5 text-xs"
              >
                <div className="flex items-center justify-between gap-2">
                  <span className="font-bold text-red-900">
                    Flagged: {flag.parameterName || flag.parameter} ({flag.measuredValue} {flag.unit})
                  </span>
                  <Badge status={flag.severity} size="xs" />
                </div>
                <p className="text-text-primary leading-relaxed">{flag.explanation}</p>
                <p className="text-red-800 font-medium">Recommendation: {flag.recommendation}</p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Recent Testing History */}
      <div className="bg-white rounded-xl border border-surface-border p-6 shadow-sm space-y-4">
        <div className="flex items-center justify-between pb-3 border-b border-surface-border">
          <div className="flex items-center gap-2">
            <Activity className="w-4 h-4 text-brand-700" />
            <h3 className="font-bold text-sm text-text-primary">Water Quality Testing Records</h3>
          </div>
          <span className="text-xs text-text-secondary font-medium">
            {source.recentTests?.length || 0} Test Records
          </span>
        </div>

        {!source.recentTests || source.recentTests.length === 0 ? (
          <EmptyState
            icon={FlaskConical}
            title="No Water Tests Recorded"
            message="No laboratory or field test measurements have been uploaded for this source yet."
          />
        ) : (
          <div className="space-y-4">
            {source.recentTests.map((test) => (
              <div
                key={test._id}
                className="p-4 rounded-lg border border-surface-border bg-slate-50/50 space-y-3"
              >
                <div className="flex flex-wrap items-center justify-between gap-2 text-xs">
                  <div className="flex items-center gap-2">
                    <span className="font-semibold text-text-primary">
                      Test Date: {new Date(test.testedAt).toLocaleDateString()}
                    </span>
                    <Badge status={test.verificationStatus} size="xs" />
                  </div>
                  <span className="text-text-secondary">
                    Method: {test.testingMethod?.replace('_', ' ')}
                    {test.laboratory ? ` • Lab: ${test.laboratory}` : ''}
                  </span>
                </div>

                {/* Parameters table */}
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 pt-1">
                  {test.parameters?.map((param, idx) => (
                    <div
                      key={idx}
                      className="bg-white p-2.5 rounded border border-surface-border text-center"
                    >
                      <span className="text-[10px] uppercase font-bold text-text-secondary block">
                        {param.name || param.parameter}
                      </span>
                      <span className="text-base font-bold text-text-primary mt-0.5 block">
                        {param.value}{' '}
                        <span className="text-[10px] font-normal text-text-secondary">
                          {param.unit}
                        </span>
                      </span>
                    </div>
                  ))}
                </div>

                {test.notes && (
                  <p className="text-[11px] text-text-secondary italic">
                    Inspector Notes: &ldquo;{test.notes}&rdquo;
                  </p>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default SourceDetailPage;
