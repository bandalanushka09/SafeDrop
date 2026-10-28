import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { testService } from '../../services/testService';
import { sourceService } from '../../services/sourceService';
import { useToast } from '../../context/ToastContext';
import {
  FlaskConical,
  Plus,
  Trash2,
  AlertTriangle,
  CheckCircle2,
  Calendar,
  Building,
} from 'lucide-react';
import Input from '../../components/common/Input';
import Select from '../../components/common/Select';
import Textarea from '../../components/common/Textarea';
import Button from '../../components/common/Button';
import AlertBox from '../../components/common/AlertBox';

export const RecordTestPage = () => {
  const { showToast } = useToast();
  const navigate = useNavigate();
  const location = useLocation();

  const preSourceId = new URLSearchParams(location.search).get('sourceId') || '';

  const [sources, setSources] = useState([]);
  const [formData, setFormData] = useState({
    sourceId: preSourceId,
    testedAt: new Date().toISOString().split('T')[0],
    testingMethod: 'field_kit',
    laboratory: '',
    verificationStatus: 'reviewed',
    notes: '',
  });

  const [parameters, setParameters] = useState([
    { parameter: 'ph', name: 'pH Value', value: '7.2', unit: 'pH' },
    { parameter: 'turbidity', name: 'Turbidity', value: '1.5', unit: 'NTU' },
    { parameter: 'tds', name: 'Total Dissolved Solids', value: '320', unit: 'mg/L' },
    { parameter: 'chlorine', name: 'Free Residual Chlorine', value: '0.4', unit: 'mg/L' },
    { parameter: 'ecoli', name: 'E. coli Indicator', value: '0', unit: 'CFU/100mL' },
  ]);

  const [submitting, setSubmitting] = useState(false);
  const [evaluationResult, setEvaluationResult] = useState(null);
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

  const handleFormChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleParamChange = (index, field, val) => {
    const updated = [...parameters];
    updated[index][field] = val;
    setParameters(updated);
  };

  const handleAddParam = () => {
    setParameters([
      ...parameters,
      { parameter: 'nitrate', name: 'Nitrate', value: '10', unit: 'mg/L' },
    ]);
  };

  const handleRemoveParam = (index) => {
    if (parameters.length <= 1) return;
    setParameters(parameters.filter((_, idx) => idx !== index));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setErrorMessage('');
    setEvaluationResult(null);

    if (!formData.sourceId) {
      setErrorMessage('Please select a water source to test.');
      return;
    }

    const formattedParams = parameters.map((p) => ({
      parameter: p.parameter.toLowerCase().trim(),
      name: p.name.trim(),
      value: Number(p.value),
      unit: p.unit.trim(),
    }));

    try {
      setSubmitting(true);
      const res = await testService.create({
        ...formData,
        parameters: formattedParams,
      });

      if (res.success) {
        showToast('Water-quality test recorded successfully.');
        setEvaluationResult(res.evaluation);

        if (!res.evaluation?.flagsGenerated) {
          navigate('/health-worker/tests');
        }
      }
    } catch (err) {
      setErrorMessage(err.message || 'Failed to record water test.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-text-primary">Record Water-Quality Test</h1>
        <p className="text-xs text-text-secondary mt-1">
          Log verified field measurements or laboratory analysis. Configured WHO risk rules evaluate measurements upon submission.
        </p>
      </div>

      {evaluationResult?.flagsGenerated > 0 && (
        <div className="bg-red-50 border border-red-200 rounded-xl p-5 space-y-3">
          <div className="flex items-center gap-2 text-status-danger font-bold text-sm">
            <AlertTriangle className="w-5 h-5 shrink-0" />
            <span>Risk Assessment Engine Alert: {evaluationResult.flagsGenerated} Concern Flag(s) Generated</span>
          </div>
          <div className="space-y-2 text-xs">
            {evaluationResult.flags.map((flag, idx) => (
              <div key={idx} className="bg-white p-3 rounded border border-red-100 space-y-1">
                <span className="font-bold text-red-900 block">
                  {flag.parameterName || flag.parameter}: {flag.measuredValue} {flag.unit} ({flag.severity?.toUpperCase()})
                </span>
                <p className="text-text-primary">{flag.explanation}</p>
                <p className="text-red-700 font-medium">Recommended Follow-up: {flag.recommendation}</p>
              </div>
            ))}
          </div>
          <Button size="sm" variant="primary" onClick={() => navigate('/health-worker/tests')}>
            Continue to Testing Records →
          </Button>
        </div>
      )}

      <div className="bg-white rounded-xl border border-surface-border p-6 shadow-sm space-y-5">
        {errorMessage && (
          <AlertBox type="error" title="Submission Error">
            {errorMessage}
          </AlertBox>
        )}

        <form onSubmit={handleSubmit} className="space-y-5">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Select
              label="Water Source"
              name="sourceId"
              value={formData.sourceId}
              onChange={handleFormChange}
              required
              options={sources.map((s) => ({
                value: s._id,
                label: `${s.name} (${s.village}) - ${s.type?.replace(/_/g, ' ')}`,
              }))}
            />

            <Input
              label="Inspection Date"
              type="date"
              name="testedAt"
              value={formData.testedAt}
              onChange={handleFormChange}
              required
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <Select
              label="Testing Method"
              name="testingMethod"
              value={formData.testingMethod}
              onChange={handleFormChange}
              options={[
                { value: 'field_kit', label: 'Field Rapid Testing Kit' },
                { value: 'laboratory', label: 'Certified Lab Testing' },
                { value: 'digital_probe', label: 'Calibrated Digital Probe' },
                { value: 'colorimetric', label: 'Colorimetric Comparator' },
                { value: 'other', label: 'Other Standard Method' },
              ]}
              placeholder=""
            />

            <Input
              label="Laboratory / Testing Unit"
              name="laboratory"
              placeholder="e.g. Zilla Parishad Lab"
              value={formData.laboratory}
              onChange={handleFormChange}
            />

            <Select
              label="Initial Verification Status"
              name="verificationStatus"
              value={formData.verificationStatus}
              onChange={handleFormChange}
              options={[
                { value: 'reviewed', label: 'Reviewed (Field Verified)' },
                { value: 'pending', label: 'Pending Senior Sign-off' },
              ]}
              placeholder=""
            />
          </div>

          {/* Dynamic Parameters Table */}
          <div className="pt-3 border-t border-surface-border space-y-3">
            <div className="flex items-center justify-between">
              <span className="font-semibold text-xs text-text-primary uppercase tracking-wider">
                Parameter Measurements
              </span>
              <button
                type="button"
                onClick={handleAddParam}
                className="inline-flex items-center gap-1 text-xs font-semibold text-brand-700 hover:underline"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Add Extra Parameter</span>
              </button>
            </div>

            <div className="space-y-2.5">
              {parameters.map((param, index) => (
                <div
                  key={index}
                  className="grid grid-cols-12 gap-2 p-3 bg-slate-50/70 border border-surface-border rounded-lg items-center"
                >
                  <div className="col-span-4">
                    <input
                      type="text"
                      placeholder="Parameter Name"
                      value={param.name}
                      onChange={(e) => handleParamChange(index, 'name', e.target.value)}
                      className="w-full text-xs border border-surface-border rounded px-2.5 py-1.5 bg-white font-medium"
                      required
                    />
                  </div>

                  <div className="col-span-4">
                    <input
                      type="number"
                      step="any"
                      placeholder="Reading"
                      value={param.value}
                      onChange={(e) => handleParamChange(index, 'value', e.target.value)}
                      className="w-full text-xs border border-surface-border rounded px-2.5 py-1.5 bg-white font-bold"
                      required
                    />
                  </div>

                  <div className="col-span-3">
                    <input
                      type="text"
                      placeholder="Unit"
                      value={param.unit}
                      onChange={(e) => handleParamChange(index, 'unit', e.target.value)}
                      className="w-full text-xs border border-surface-border rounded px-2.5 py-1.5 bg-white text-text-secondary"
                      required
                    />
                  </div>

                  <div className="col-span-1 text-center">
                    <button
                      type="button"
                      onClick={() => handleRemoveParam(index)}
                      disabled={parameters.length <= 1}
                      className="text-text-secondary hover:text-status-danger disabled:opacity-30 p-1"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <Textarea
            label="Field Notes & Observations"
            name="notes"
            rows={3}
            placeholder="Document weather conditions, turbidity observations, odor, or chemical reagents utilized..."
            value={formData.notes}
            onChange={handleFormChange}
          />

          <div className="pt-2">
            <Button
              type="submit"
              variant="primary"
              className="w-full py-2.5 font-semibold text-sm"
              loading={submitting}
              icon={FlaskConical}
            >
              Submit & Run Risk Evaluation Engine
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default RecordTestPage;

