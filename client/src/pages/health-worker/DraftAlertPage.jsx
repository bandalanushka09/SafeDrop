import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { alertService } from '../../services/alertService';
import { sourceService } from '../../services/sourceService';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../context/ToastContext';
import { AlertTriangle, ShieldCheck, MapPin } from 'lucide-react';
import Input from '../../components/common/Input';
import Select from '../../components/common/Select';
import Textarea from '../../components/common/Textarea';
import Button from '../../components/common/Button';
import AlertBox from '../../components/common/AlertBox';

export const DraftAlertPage = () => {
  const { user, isRole } = useAuth();
  const { showToast } = useToast();
  const navigate = useNavigate();

  const [sources, setSources] = useState([]);
  const [formData, setFormData] = useState({
    title: '',
    message: '',
    severity: 'medium',
    affectedVillage: user?.village || 'Rampur',
    affectedSourceIds: [],
    recommendedAction: 'Boil water for 1 minute before drinking or food preparation.',
    supportingReference: '',
    publishImmediately: isRole('admin'),
  });

  const [submitting, setSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');

  useEffect(() => {
    const fetchSources = async () => {
      try {
        const res = await sourceService.getAll({ limit: 100 });
        if (res.success) setSources(res.data);
      } catch (err) {
        console.error('Error fetching sources:', err);
      }
    };
    fetchSources();
  }, []);

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData({
      ...formData,
      [name]: type === 'checkbox' ? checked : value,
    });
  };

  const handleSourceSelect = (e) => {
    const selectedOptions = Array.from(e.target.selectedOptions, (option) => option.value);
    setFormData({ ...formData, affectedSourceIds: selectedOptions });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setErrorMessage('');

    try {
      setSubmitting(true);
      const res = await alertService.create(formData);
      if (res.success) {
        showToast(
          formData.publishImmediately
            ? 'Safety advisory published officially!'
            : 'Safety advisory draft created for administrative review.'
        );
        navigate(isRole('admin') ? '/admin/alerts' : '/alerts');
      }
    } catch (err) {
      setErrorMessage(err.message || 'Failed to create safety advisory.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-text-primary">
          {isRole('admin') ? 'Create & Publish Safety Advisory' : 'Draft Safety Advisory'}
        </h1>
        <p className="text-xs text-text-secondary mt-1">
          Issue actionable precautionary alerts regarding water quality concerns, pipe maintenance, or boiling advisories.
        </p>
      </div>

      <div className="bg-white rounded-xl border border-surface-border p-6 shadow-sm space-y-5">
        {errorMessage && (
          <AlertBox type="error" title="Submission Error">
            {errorMessage}
          </AlertBox>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <Input
            label="Advisory Headline / Title"
            name="title"
            placeholder="e.g. Boil Water Advisory - West Ward Sources"
            value={formData.title}
            onChange={handleChange}
            required
          />

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <Select
              label="Severity Level"
              name="severity"
              value={formData.severity}
              onChange={handleChange}
              options={[
                { value: 'low', label: 'Low (Scheduled Maintenance / Flushing)' },
                { value: 'medium', label: 'Medium (Precautionary Advisory)' },
                { value: 'high', label: 'High Priority (Tested Contamination / Heavy Runoff)' },
                { value: 'critical', label: 'Critical (Severe Pathogen / E. coli Notice)' },
              ]}
              placeholder=""
              required
            />

            <Input
              label="Affected Locality / Village"
              name="affectedVillage"
              value={formData.affectedVillage}
              onChange={handleChange}
              required
            />
          </div>

          <Textarea
            label="Advisory Statement"
            name="message"
            rows={3}
            placeholder="Explain the situation in clear, neutral language: e.g. Recent sampling indicated elevated turbidity following flood waters. Routine pipe maintenance in progress."
            value={formData.message}
            onChange={handleChange}
            required
          />

          <Textarea
            label="Recommended Public Action"
            name="recommendedAction"
            rows={2}
            placeholder="What should residents do? (e.g. Bring water to a rolling boil for 1 minute; use chlorine tablets; store water from alternative tap)"
            value={formData.recommendedAction}
            onChange={handleChange}
            required
          />

          <Input
            label="Supporting Evidence / Laboratory Reference (Optional)"
            name="supportingReference"
            placeholder="e.g. District Lab Batch #DL-448, Gram Panchayat notice"
            value={formData.supportingReference}
            onChange={handleChange}
          />

          {/* Multiple Source Selector */}
          <div>
            <label className="block text-xs font-semibold text-text-primary uppercase tracking-wider mb-1.5">
              Specific Affected Water Sources (Optional)
            </label>
            <select
              multiple
              value={formData.affectedSourceIds}
              onChange={handleSourceSelect}
              className="w-full text-xs border border-surface-border rounded p-2 bg-white h-28 focus:outline-none focus:ring-1 focus:ring-brand-700"
            >
              {sources.map((s) => (
                <option key={s._id} value={s._id}>
                  {s.name} ({s.village})
                </option>
              ))}
            </select>
            <p className="text-[11px] text-text-secondary mt-1">
              Hold Ctrl (or Cmd) to select multiple sources.
            </p>
          </div>

          {/* Admin Immediate Publication Checkbox */}
          {isRole('admin') && (
            <div className="flex items-center gap-2 pt-2">
              <input
                type="checkbox"
                id="publishImmediately"
                name="publishImmediately"
                checked={formData.publishImmediately}
                onChange={handleChange}
                className="w-4 h-4 text-brand-700 border-surface-border rounded"
              />
              <label htmlFor="publishImmediately" className="text-xs font-medium text-text-primary">
                Publish immediately to public community feed & notify residents
              </label>
            </div>
          )}

          <div className="pt-2">
            <Button
              type="submit"
              variant="primary"
              className="w-full py-2.5 font-semibold text-sm"
              loading={submitting}
              icon={AlertTriangle}
            >
              {isRole('admin') && formData.publishImmediately
                ? 'Publish Official Advisory'
                : 'Save Advisory Draft'}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default DraftAlertPage;

