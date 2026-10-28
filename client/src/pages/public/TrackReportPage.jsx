import React, { useEffect, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { ClipboardCheck, LoaderCircle, Search } from 'lucide-react';
import Input from '../../components/common/Input';
import { reportService } from '../../services/reportService';

const statusLabels = {
  NEW: 'Received',
  UNDER_REVIEW: 'Under review',
  ASSIGNED: 'Assigned',
  IN_PROGRESS: 'In progress',
  RESOLVED: 'Resolved',
  REJECTED: 'Closed',
  submitted: 'Received',
  under_review: 'Under review',
  action_required: 'In progress',
  resolved: 'Resolved',
  rejected: 'Closed',
};

const officialStatusLabels = {
  READY_FOR_OFFICIAL_SUBMISSION: 'Ready for official submission',
  PREPARED: 'Prepared for official submission',
  SUBMITTED: 'Submitted to configured service',
  CONFIRMED: 'Confirmed by configured service',
  FAILED: 'Submission to configured service failed',
  NOT_CONFIGURED: 'No official service configured',
};

export const TrackReportPage = () => {
  const [searchParams] = useSearchParams();
  const [referenceId, setReferenceId] = useState(searchParams.get('ref') || '');
  const [phone, setPhone] = useState('');
  const [report, setReport] = useState(null);
  const [errorMessage, setErrorMessage] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const ref = searchParams.get('ref');
    if (ref) setReferenceId(ref);
  }, [searchParams]);

  const handleSubmit = async (event) => {
    event.preventDefault();
    setErrorMessage('');
    setReport(null);
    setLoading(true);
    try {
      const response = await reportService.track(referenceId.trim(), phone.trim());
      setReport(response.data);
    } catch (error) {
      setErrorMessage(error.message || 'We could not find a report with those details.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="mx-auto max-w-2xl space-y-6 px-4 py-10 sm:px-6">
      <header>
        <div className="flex items-center gap-2 text-brand-800">
          <ClipboardCheck className="h-5 w-5" aria-hidden="true" />
          <span className="text-xs font-semibold uppercase tracking-wide">Community report status</span>
        </div>
        <h1 className="mt-2 text-2xl font-bold text-text-primary">Track a Water Concern</h1>
        <p className="mt-2 text-sm text-text-secondary">
          Enter your SafeDrop reference number. Adding the phone number used in the report provides an extra lookup check.
        </p>
      </header>

      <form onSubmit={handleSubmit} className="space-y-4 rounded-xl border border-surface-border bg-white p-5 shadow-sm sm:p-6">
        <Input
          label="Report Reference Number"
          name="referenceId"
          placeholder="SD-2026-001245"
          value={referenceId}
          onChange={(event) => setReferenceId(event.target.value.toUpperCase())}
          required
        />
        <Input
          label="Phone Number (Optional)"
          name="phone"
          type="tel"
          autoComplete="tel"
          value={phone}
          onChange={(event) => setPhone(event.target.value)}
        />
        {errorMessage && (
          <p className="rounded border border-red-200 bg-red-50 p-3 text-sm text-red-800" role="alert">
            {errorMessage}
          </p>
        )}
        <button
          type="submit"
          disabled={loading}
          className="inline-flex min-h-11 w-full items-center justify-center gap-2 rounded bg-brand-700 px-4 py-2.5 text-sm font-semibold text-white hover:bg-brand-800 disabled:opacity-60"
        >
          {loading ? <LoaderCircle className="h-4 w-4 animate-spin" /> : <Search className="h-4 w-4" />}
          {loading ? 'Checking...' : 'Track Report'}
        </button>
      </form>

      {report && (
        <section className="space-y-4 rounded-xl border border-surface-border bg-white p-5 shadow-sm sm:p-6" aria-live="polite">
          <div className="flex flex-col justify-between gap-2 border-b border-surface-border pb-4 sm:flex-row sm:items-start">
            <div>
              <p className="text-xs font-semibold uppercase tracking-wide text-text-secondary">Reference Number</p>
              <h2 className="mt-1 font-mono text-lg font-bold text-brand-800">{report.referenceId}</h2>
            </div>
            <span className="inline-flex w-fit rounded-full border border-brand-200 bg-teal-50 px-3 py-1 text-sm font-semibold text-brand-800">
              {statusLabels[report.status] || report.status}
            </span>
          </div>
          <dl className="grid gap-4 text-sm sm:grid-cols-2">
            <div><dt className="text-xs font-semibold uppercase text-text-secondary">Location</dt><dd className="mt-1 text-text-primary">{[report.village, report.taluka, report.district, report.state].filter(Boolean).join(', ') || 'Not provided'}</dd></div>
            <div><dt className="text-xs font-semibold uppercase text-text-secondary">Water Source</dt><dd className="mt-1 text-text-primary">{report.waterSourceName || 'Not specified'}</dd></div>
            <div className="sm:col-span-2"><dt className="text-xs font-semibold uppercase text-text-secondary">Concerns</dt><dd className="mt-1 text-text-primary">{report.concernLabels?.join(', ') || 'Not specified'}</dd></div>
            <div><dt className="text-xs font-semibold uppercase text-text-secondary">Reported</dt><dd className="mt-1 text-text-primary">{report.reportedAt ? new Date(report.reportedAt).toLocaleString() : 'Not available'}</dd></div>
            <div><dt className="text-xs font-semibold uppercase text-text-secondary">Assigned Department</dt><dd className="mt-1 text-text-primary">{report.assignedDepartment || 'Pending assignment'}</dd></div>
          </dl>
          <div className="rounded border border-surface-border bg-slate-50 p-3">
            <p className="text-xs font-semibold uppercase tracking-wide text-text-secondary">Government submission</p>
            <p className="mt-1 text-sm font-medium text-text-primary">{officialStatusLabels[report.officialSubmissionStatus] || report.officialSubmissionStatus}</p>
            {report.officialReferenceId && <p className="mt-1 text-xs text-text-secondary">Official reference: {report.officialReferenceId}</p>}
            <p className="mt-2 text-xs text-text-secondary">{report.submissionNote}</p>
          </div>
          {report.publicResponse && (
            <div className="rounded border border-teal-200 bg-teal-50 p-3">
              <p className="text-xs font-semibold uppercase tracking-wide text-brand-800">Public update</p>
              <p className="mt-1 text-sm text-text-primary">{report.publicResponse}</p>
            </div>
          )}
        </section>
      )}

      <p className="text-center text-sm text-text-secondary">
        Need to report another issue? <Link to="/submit-report" className="font-semibold text-brand-800 underline">Report a water concern</Link>
      </p>
    </div>
  );
};

export default TrackReportPage;
