import React, { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { MapContainer, TileLayer, CircleMarker } from 'react-leaflet';
import { reportService } from '../../services/reportService';
import { governmentService } from '../../services/governmentService';
import { useToast } from '../../context/ToastContext';
import {
  ArrowLeft,
  Calendar,
  MapPin,
  Clock,
  User,
  CheckCircle2,
  AlertTriangle,
  Plus,
  Send,
  Building2,
  Loader2,
} from 'lucide-react';
import Badge from '../../components/common/Badge';
import Button from '../../components/common/Button';
import Input from '../../components/common/Input';
import Select from '../../components/common/Select';
import Textarea from '../../components/common/Textarea';
import Skeleton from '../../components/common/Skeleton';
import AlertBox from '../../components/common/AlertBox';

export const ReportDetailPage = () => {
  const { id } = useParams();
  const { showToast } = useToast();
  const navigate = useNavigate();

  const [report, setReport] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  // Status update form
  const [status, setStatus] = useState('');
  const [publicResponse, setPublicResponse] = useState('');
  const [resolutionDetails, setResolutionDetails] = useState('');
  const [updatingStatus, setUpdatingStatus] = useState(false);

  // New internal note
  const [internalNote, setInternalNote] = useState('');
  const [addingNote, setAddingNote] = useState(false);
  const [governmentConfigured, setGovernmentConfigured] = useState(null);
  const [governmentError, setGovernmentError] = useState('');
  const [governmentMessage, setGovernmentMessage] = useState('');
  const [governmentPayload, setGovernmentPayload] = useState(null);
  const [submittingGovernment, setSubmittingGovernment] = useState(false);

  const fetchReport = async () => {
    try {
      setLoading(true);
      const res = await reportService.getById(id);
      if (res.success) {
        setReport(res.data);
        setStatus(res.data.status);
        setPublicResponse(res.data.publicResponse || '');
        setResolutionDetails(res.data.resolutionDetails || '');
      }
    } catch (err) {
      setError(err.message || 'Failed to load report');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchReport();
  }, [id]);

  useEffect(() => {
    let active = true;
    governmentService
      .getConfiguration()
      .then((response) => {
        if (active) setGovernmentConfigured(Boolean(response.data?.governmentApiConfigured));
      })
      .catch((err) => {
        if (active) setGovernmentError(err.message || 'Government integration status is unavailable.');
      });
    return () => {
      active = false;
    };
  }, []);

  const handleStatusSubmit = async (e) => {
    e.preventDefault();
    try {
      setUpdatingStatus(true);
      const res = await reportService.updateStatus(id, {
        status,
        publicResponse,
        resolutionDetails,
      });
      if (res.success) {
        showToast(`Report status updated to ${status}.`);
        setReport(res.data);
      }
    } catch (err) {
      showToast(err.message || 'Failed to update status', 'error');
    } finally {
      setUpdatingStatus(false);
    }
  };

  const handleAddNote = async (e) => {
    e.preventDefault();
    if (!internalNote.trim()) return;

    try {
      setAddingNote(true);
      const res = await reportService.addNote(id, internalNote);
      if (res.success) {
        showToast('Internal note recorded.');
        setInternalNote('');
        fetchReport();
      }
    } catch (err) {
      showToast(err.message || 'Failed to add note', 'error');
    } finally {
      setAddingNote(false);
    }
  };

  const handleGovernmentSubmit = async () => {
    setGovernmentError('');
    setGovernmentMessage('');
    setSubmittingGovernment(true);
    try {
      const response = await governmentService.submitReport(id);
      setGovernmentMessage(response.message || 'Official report processing completed.');
      setGovernmentPayload(response.data?.payload || null);
      setReport((current) => ({
        ...current,
        officialSubmissionStatus: response.data?.officialSubmissionStatus || current.officialSubmissionStatus,
        officialReferenceId: response.data?.officialReferenceId || current.officialReferenceId,
        officialSubmittedAt: response.data?.officialSubmittedAt || current.officialSubmittedAt,
      }));
    } catch (err) {
      setGovernmentError(err.message || 'Official report processing could not be completed.');
    } finally {
      setSubmittingGovernment(false);
    }
  };

  if (loading) {
    return (
      <div className="max-w-4xl mx-auto space-y-6 py-6">
        <Skeleton className="h-6 w-32" />
        <Skeleton className="h-48 w-full rounded-xl" />
        <Skeleton className="h-48 w-full rounded-xl" />
      </div>
    );
  }

  if (error || !report) {
    return (
      <div className="max-w-md mx-auto py-12 text-center space-y-4">
        <p className="text-sm text-status-danger">{error || 'Report not found'}</p>
        <Link to="/health-worker/reports">
          <Button variant="secondary" icon={ArrowLeft}>
            Back to Reports
          </Button>
        </Link>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div>
        <Link
          to="/health-worker/reports"
          className="inline-flex items-center gap-1.5 text-xs font-semibold text-brand-700 hover:underline"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Back to Report Review</span>
        </Link>
      </div>

      {/* Main Report Card */}
      <div className="bg-white rounded-xl border border-surface-border p-6 shadow-sm space-y-5">
        <div className="flex flex-wrap items-start justify-between gap-4 pb-4 border-b border-surface-border">
          <div className="space-y-1">
            <div className="flex items-center gap-2.5">
              <h1 className="text-sm font-bold text-brand-800">{report.referenceId || 'Report'}</h1>
              <span aria-hidden="true">·</span>
              <h1 className="text-xl font-bold text-text-primary capitalize">
                {report.category?.replace(/_/g, ' ')}
              </h1>
              <Badge status={report.status} size="sm" />
            </div>
            <div className="flex flex-wrap items-center gap-3 text-xs text-text-secondary">
              <span className="flex items-center gap-1">
                <User className="w-3.5 h-3.5" />
                Reporter: <strong>{report.reporterId?.name || 'Villager'}</strong> ({report.reporterId?.village})
              </span>
              <span>•</span>
              <span className="flex items-center gap-1">
                <MapPin className="w-3.5 h-3.5" />
                Locality: <strong>{report.village}</strong>
              </span>
              <span>•</span>
              <span className="flex items-center gap-1">
                <Clock className="w-3.5 h-3.5" />
                Submitted: {new Date(report.createdAt).toLocaleString()}
              </span>
            </div>
          </div>

          <div className="grid gap-4 border-b border-surface-border pb-4 text-sm sm:grid-cols-2">
            <div>
              <p className="text-xs font-semibold uppercase tracking-wide text-text-secondary">Reporter</p>
              <p className="mt-1 font-medium text-text-primary">{report.fullName || report.reporterId?.name || 'Community Member'}</p>
              {report.phone && <p className="text-xs text-text-secondary">{report.phone}</p>}
              {report.email && <p className="text-xs text-text-secondary">{report.email}</p>}
            </div>
            <div>
              <p className="text-xs font-semibold uppercase tracking-wide text-text-secondary">Official submission</p>
              <p className="mt-1 text-text-primary">{report.officialSubmissionStatus?.replace(/_/g, ' ') || 'Not prepared'}</p>
              {report.officialReferenceId && <p className="text-xs text-text-secondary">Official reference: {report.officialReferenceId}</p>}
              {report.assignedDepartment && <p className="text-xs text-text-secondary">Department: {report.assignedDepartment}</p>}
            </div>
          </div>

          {report.sourceId && (
            <Link
              to={`/sources/${report.sourceId._id}`}
              className="text-xs font-semibold text-brand-700 hover:underline px-3 py-1.5 bg-teal-50 rounded border border-brand-200"
            >
              Linked Source: {report.sourceId.name} →
            </Link>
          )}
        </div>

        {/* Observation Description */}
        <div className="space-y-1">
          <span className="text-xs font-bold text-text-secondary uppercase tracking-wider block">
            Observed Problem Description
          </span>
          <p className="text-sm text-text-primary bg-slate-50 p-4 rounded-lg border border-surface-border leading-relaxed whitespace-pre-line">
            {report.description}
          </p>
        </div>

        {/* Location Landmark / Coordinates */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs text-text-secondary pt-1">
          <div>
            <span className="font-semibold text-text-primary block">Location Landmark:</span>
            <p>{report.locationDescription || 'No landmarks noted.'}</p>
          </div>
          <div>
            <span className="font-semibold text-text-primary block">GPS Coordinates:</span>
            {report.coordinates?.latitude ? (
              <p className="font-mono text-text-primary">
                {report.coordinates.latitude}, {report.coordinates.longitude}
              </p>
            ) : (
              <p>Not specified</p>
            )}
          </div>
        </div>
        {(report.waterSourceName || report.waterSourceType || report.concerns?.length > 0) && (
          <div className="grid gap-4 border-t border-surface-border pt-3 sm:grid-cols-2">
            <div>
              <span className="block text-xs font-semibold uppercase tracking-wide text-text-secondary">Water source</span>
              <p className="mt-1 text-sm text-text-primary">{report.waterSourceName || report.sourceId?.name || 'Not specified'}</p>
              <p className="text-xs capitalize text-text-secondary">{report.waterSourceType?.replace(/_/g, ' ') || report.sourceId?.type?.replace(/_/g, ' ') || ''}</p>
              {report.sourceId?.riskLevel && <p className="mt-1 text-xs text-text-secondary">Current risk: {report.sourceId.riskLevel.replace(/_/g, ' ')}</p>}
            </div>
            <div>
              <span className="block text-xs font-semibold uppercase tracking-wide text-text-secondary">Concern types</span>
              <ul className="mt-1 flex flex-wrap gap-1.5">
                {(report.concerns || []).map((concern) => (
                  <li key={concern} className="rounded border border-amber-200 bg-amber-50 px-2 py-1 text-xs text-amber-900">
                    {concern.replace(/_/g, ' ')}
                  </li>
                ))}
              </ul>
            </div>
          </div>
        )}
        {report.coordinates?.latitude != null && report.coordinates?.longitude != null && (
          <div className="overflow-hidden rounded border border-surface-border">
            <MapContainer
              center={[Number(report.coordinates.latitude), Number(report.coordinates.longitude)]}
              zoom={14}
              scrollWheelZoom={false}
              style={{ height: '260px', width: '100%' }}
            >
              <TileLayer
                attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
                url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
              />
              <CircleMarker
                center={[Number(report.coordinates.latitude), Number(report.coordinates.longitude)]}
                radius={8}
                pathOptions={{ color: '#0f766e', fillColor: '#0f766e', fillOpacity: 0.9 }}
              />
            </MapContainer>
          </div>
        )}

        {/* Photo attachment if available */}
        {(report.imageUrls?.length || report.photoUrl) && (
          <div className="pt-2">
            <span className="mb-1.5 block text-xs font-semibold text-text-primary">
              Supporting Field Photographs:
            </span>
            <div className="flex flex-wrap gap-3">
              {(report.imageUrls?.length ? report.imageUrls : [report.photoUrl]).map((url, index) => (
                <a key={`${url}-${index}`} href={url} target="_blank" rel="noreferrer" className="rounded border border-surface-border p-1">
                  <img src={url} alt={`Community report evidence ${index + 1}`} className="h-32 w-40 rounded object-cover" />
                </a>
              ))}
            </div>
          </div>
        )}

        {report.statusHistory?.length > 0 && (
          <details className="border-t border-surface-border pt-3">
            <summary className="cursor-pointer text-xs font-semibold text-text-primary">Status and audit history ({report.statusHistory.length})</summary>
            <ol className="mt-3 space-y-3">
              {report.statusHistory.map((entry) => (
                <li key={entry._id} className="border-l-2 border-brand-200 pl-3 text-xs">
                  <p className="font-semibold text-text-primary">{entry.from || 'Created'} → {entry.to}</p>
                  <p className="text-text-secondary">{entry.actorName || 'System'} · {new Date(entry.createdAt).toLocaleString()}</p>
                  {entry.note && <p className="mt-1 text-text-secondary">{entry.note}</p>}
                </li>
              ))}
            </ol>
          </details>
        )}
      </div>

      <section className="space-y-3 rounded-xl border border-surface-border bg-white p-5 shadow-sm">
        <h2 className="flex items-center gap-2 text-sm font-bold text-text-primary"><Building2 className="h-4 w-4 text-brand-700" /> Official Government Reporting</h2>
        <p className="text-xs text-text-secondary">
          {governmentConfigured
            ? 'A government endpoint is configured on the backend. Submission will be attempted and the returned status will be recorded.'
            : 'No government API is configured. This action only prepares a structured payload; it does not submit the report to an authority.'}
        </p>
        {report.officialReferenceId && <p className="text-xs font-semibold text-text-primary">Official Reference: {report.officialReferenceId}</p>}
        {governmentError && <p className="rounded border border-red-200 bg-red-50 p-2 text-xs text-red-800" role="alert">{governmentError}</p>}
        {governmentMessage && <p className="rounded border border-teal-200 bg-teal-50 p-2 text-xs text-brand-800" role="status">{governmentMessage}</p>}
        {governmentConfigured !== null && (
          <Button
            type="button"
            variant="secondary"
            icon={submittingGovernment ? Loader2 : Send}
            loading={submittingGovernment}
            onClick={handleGovernmentSubmit}
          >
            {governmentConfigured ? 'Submit to Government' : 'Prepare Official Submission'}
          </Button>
        )}
        {governmentPayload && (
          <details className="rounded border border-surface-border bg-slate-50 p-3">
            <summary className="cursor-pointer text-xs font-semibold text-text-primary">View prepared official payload</summary>
            <pre className="mt-3 max-h-80 overflow-auto whitespace-pre-wrap break-words text-[11px] text-text-secondary">{JSON.stringify(governmentPayload, null, 2)}</pre>
          </details>
        )}
      </section>

      {/* Staff Status Workflow & Public Response Form */}
      <div className="bg-white rounded-xl border border-surface-border p-6 shadow-sm space-y-4">
        <h3 className="font-bold text-sm text-text-primary flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4 text-brand-700" />
          <span>Status Workflow & Public Communication</span>
        </h3>

        <form onSubmit={handleStatusSubmit} className="space-y-4">
          <div className="max-w-xs">
            <Select
              label="Update Workflow Status"
              value={status}
              onChange={(e) => setStatus(e.target.value)}
              placeholder=""
              options={[
                { value: 'submitted', label: 'Submitted (Initial Triage)' },
                { value: 'under_review', label: 'Under Review (Assigned / Investigating)' },
                { value: 'action_required', label: 'Action Required (Maintenance / Notice)' },
                { value: 'resolved', label: 'Resolved (Issue Mitigated)' },
                { value: 'rejected', label: 'Rejected (Invalid / Non-water issue)' },
              ]}
              required
            />
          </div>

          <Textarea
            label="Public Response to Reporter"
            rows={2}
            placeholder="This response will be visible to the community reporter on their dashboard..."
            value={publicResponse}
            onChange={(e) => setPublicResponse(e.target.value)}
            helperText="Clear, neutral, reassuring language explaining current inspection steps."
          />

          {(status === 'resolved' || status === 'rejected') && (
            <Textarea
              label="Resolution Documentation"
              rows={2}
              placeholder="Detail actions taken: e.g. repaired broken seal, flushed distribution line, chlorinated storage reservoir..."
              value={resolutionDetails}
              onChange={(e) => setResolutionDetails(e.target.value)}
              required
            />
          )}

          <Button type="submit" variant="primary" loading={updatingStatus}>
            Save Status & Notify Reporter
          </Button>
        </form>
      </div>

      {/* Internal Staff Notes (Authorized Staff Only) */}
      <div className="bg-white rounded-xl border border-surface-border p-6 shadow-sm space-y-4">
        <h3 className="font-bold text-sm text-text-primary">
          Internal Review Notes ({report.internalNotes?.length || 0})
        </h3>
        <p className="text-xs text-text-secondary">
          Restricted to authorized health workers and administrators. Not visible to regular community members.
        </p>

        {report.internalNotes && report.internalNotes.length > 0 && (
          <div className="space-y-2.5 divide-y divide-surface-border">
            {report.internalNotes.map((note) => (
              <div key={note._id} className="pt-2 text-xs space-y-1">
                <div className="flex items-center justify-between text-text-secondary text-[11px]">
                  <span className="font-semibold text-text-primary">{note.authorName || 'Staff'}</span>
                  <span>{new Date(note.createdAt).toLocaleString()}</span>
                </div>
                <p className="text-text-primary">{note.note}</p>
              </div>
            ))}
          </div>
        )}

        <form onSubmit={handleAddNote} className="pt-2 space-y-2">
          <Textarea
            placeholder="Add internal inspection findings, technician assignment, or lab requisition details..."
            rows={2}
            value={internalNote}
            onChange={(e) => setInternalNote(e.target.value)}
          />
          <Button type="submit" variant="secondary" size="sm" loading={addingNote}>
            Add Internal Note
          </Button>
        </form>
      </div>
    </div>
  );
};

export default ReportDetailPage;
