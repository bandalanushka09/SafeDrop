import React, { useState, useEffect } from 'react';
import { riskService } from '../../services/riskService';
import { useToast } from '../../context/ToastContext';
import { Sliders, PlusCircle, Edit2, CheckCircle2, Shield, AlertTriangle } from 'lucide-react';
import Table from '../../components/common/Table';
import Badge from '../../components/common/Badge';
import Button from '../../components/common/Button';
import Modal from '../../components/common/Modal';
import Input from '../../components/common/Input';
import Select from '../../components/common/Select';
import Textarea from '../../components/common/Textarea';

export const RiskRulesPage = () => {
  const { showToast } = useToast();
  const [rules, setRules] = useState([]);
  const [loading, setLoading] = useState(true);

  // Modal create/edit
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingRule, setEditingRule] = useState(null);
  const [formData, setFormData] = useState({
    parameter: 'ph',
    parameterName: 'Low pH (Acidic)',
    comparisonOperator: '<',
    threshold: '6.5',
    unit: 'pH',
    severity: 'warning',
    recommendation: 'Inspect source for acidic runoff or metal leaching.',
    explanationTemplate: 'pH level is below the recommended minimum threshold of 6.5 pH.',
    reference: 'WHO Guidelines for Drinking-water Quality',
    active: true,
  });
  const [saving, setSaving] = useState(false);

  const fetchRules = async () => {
    try {
      setLoading(true);
      const res = await riskService.getRules();
      if (res.success) {
        setRules(res.data);
      }
    } catch (err) {
      console.error('Failed to load risk rules:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRules();
  }, []);

  const handleOpenCreate = () => {
    setEditingRule(null);
    setFormData({
      parameter: '',
      parameterName: '',
      comparisonOperator: '>',
      threshold: '',
      unit: '',
      severity: 'warning',
      recommendation: '',
      explanationTemplate: '',
      reference: 'WHO Guidelines for Drinking-water Quality',
      active: true,
    });
    setIsModalOpen(true);
  };

  const handleOpenEdit = (rule) => {
    setEditingRule(rule);
    setFormData({
      parameter: rule.parameter,
      parameterName: rule.parameterName,
      comparisonOperator: rule.comparisonOperator,
      threshold: String(rule.threshold),
      unit: rule.unit,
      severity: rule.severity,
      recommendation: rule.recommendation,
      explanationTemplate: rule.explanationTemplate || '',
      reference: rule.reference,
      active: rule.active,
    });
    setIsModalOpen(true);
  };

  const handleSaveRule = async (e) => {
    e.preventDefault();
    try {
      setSaving(true);
      const payload = {
        ...formData,
        threshold: Number(formData.threshold),
      };

      if (editingRule) {
        await riskService.updateRule(editingRule._id, payload);
        showToast(`Rule for ${formData.parameterName} updated.`);
      } else {
        await riskService.createRule(payload);
        showToast(`Rule for ${formData.parameterName} created.`);
      }
      setIsModalOpen(false);
      fetchRules();
    } catch (err) {
      showToast(err.message || 'Operation failed', 'error');
    } finally {
      setSaving(false);
    }
  };

  const columns = [
    {
      header: 'Parameter & Rule',
      accessor: 'parameterName',
      cell: (row) => (
        <div>
          <span className="font-semibold text-text-primary block">{row.parameterName}</span>
          <span className="text-[11px] text-text-secondary font-mono">
            Param code: {row.parameter}
          </span>
        </div>
      ),
    },
    {
      header: 'Trigger Condition',
      accessor: 'threshold',
      cell: (row) => (
        <span className="font-mono text-xs font-bold text-text-primary bg-slate-100 px-2 py-0.5 rounded">
          {row.comparisonOperator} {row.threshold} {row.unit}
        </span>
      ),
    },
    {
      header: 'Assigned Severity',
      accessor: 'severity',
      cell: (row) => <Badge status={row.severity} size="sm" />,
    },
    {
      header: 'Reference Standard',
      accessor: 'reference',
      cell: (row) => (
        <span className="text-[11px] text-text-secondary max-w-xs block truncate">
          {row.reference}
        </span>
      ),
    },
    {
      header: 'Engine Status',
      accessor: 'active',
      cell: (row) => (
        <Badge
          status={row.active ? 'active' : 'deactivated'}
          text={row.active ? 'Active Rule' : 'Inactive'}
          size="xs"
        />
      ),
    },
    {
      header: 'Action',
      accessor: '_id',
      align: 'right',
      cell: (row) => (
        <Button size="sm" variant="secondary" onClick={() => handleOpenEdit(row)} icon={Edit2}>
          Edit Rule
        </Button>
      ),
    },
  ];

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-text-primary">Water-Quality Risk Engine Rules</h1>
          <p className="text-xs text-text-secondary mt-1">
            Configure transparent, rule-based threshold criteria aligned with WHO and National Drinking Water Guidelines.
          </p>
        </div>

        <Button variant="primary" icon={PlusCircle} onClick={handleOpenCreate}>
          Add Evaluation Rule
        </Button>
      </div>

      <div className="bg-teal-50 border border-brand-200 rounded-lg p-4 text-xs text-text-primary flex items-start gap-2.5">
        <Shield className="w-4 h-4 text-brand-700 shrink-0 mt-0.5" />
        <p className="leading-relaxed">
          <strong>Transparent Rules:</strong> The SafeDrop engine evaluates newly submitted water test parameters against these documented rules. When a threshold condition is met, an audit-tracked Risk Flag is generated with the configured explanation and recommendation.
        </p>
      </div>

      <div>
        <Table
          columns={columns}
          data={rules}
          loading={loading}
          emptyMessage="No risk assessment rules configured."
        />
      </div>

      {/* Modal */}
      {isModalOpen && (
        <Modal
          isOpen={isModalOpen}
          onClose={() => setIsModalOpen(false)}
          title={editingRule ? `Edit Rule: ${editingRule.parameterName}` : 'Add Risk Assessment Rule'}
          maxWidth="max-w-xl"
        >
          <form onSubmit={handleSaveRule} className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <Input
                label="Parameter Code (e.g. ph, turbidity, ecoli)"
                value={formData.parameter}
                onChange={(e) => setFormData({ ...formData, parameter: e.target.value })}
                required
              />

              <Input
                label="Human-Readable Rule Name"
                value={formData.parameterName}
                onChange={(e) => setFormData({ ...formData, parameterName: e.target.value })}
                placeholder="e.g. High Turbidity"
                required
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <Select
                label="Comparison Operator"
                value={formData.comparisonOperator}
                onChange={(e) => setFormData({ ...formData, comparisonOperator: e.target.value })}
                placeholder=""
                options={[
                  { value: '<', label: '< (Less than)' },
                  { value: '<=', label: '<= (Less than or equal)' },
                  { value: '>', label: '> (Greater than)' },
                  { value: '>=', label: '>= (Greater than or equal)' },
                  { value: '==', label: '== (Equal to)' },
                  { value: '!=', label: '!= (Not equal)' },
                ]}
                required
              />

              <Input
                label="Threshold Value"
                type="number"
                step="any"
                value={formData.threshold}
                onChange={(e) => setFormData({ ...formData, threshold: e.target.value })}
                required
              />

              <Input
                label="Unit of Measure"
                value={formData.unit}
                onChange={(e) => setFormData({ ...formData, unit: e.target.value })}
                placeholder="e.g. NTU, mg/L, pH"
                required
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <Select
                label="Flag Severity Level"
                value={formData.severity}
                onChange={(e) => setFormData({ ...formData, severity: e.target.value })}
                placeholder=""
                options={[
                  { value: 'informational', label: 'Informational (Notice)' },
                  { value: 'warning', label: 'Warning (Secondary concern)' },
                  { value: 'high_priority', label: 'High Priority (Precautionary)' },
                  { value: 'critical_review', label: 'Critical Review (Pathogen / Contamination)' },
                ]}
                required
              />

              <Input
                label="Reference Citation / Standard"
                value={formData.reference}
                onChange={(e) => setFormData({ ...formData, reference: e.target.value })}
                placeholder="WHO Guidelines 4th Ed."
                required
              />
            </div>

            <Textarea
              label="Recommended Action for Field Workers"
              rows={2}
              value={formData.recommendation}
              onChange={(e) => setFormData({ ...formData, recommendation: e.target.value })}
              placeholder="e.g. Issue boil advisory; verify chlorination dosing; inspect parapet wall"
              required
            />

            <Textarea
              label="Explanation Template (Shown on Flagged Test Records)"
              rows={2}
              value={formData.explanationTemplate}
              onChange={(e) => setFormData({ ...formData, explanationTemplate: e.target.value })}
              placeholder="e.g. Turbidity exceeds acceptable standard of 5.0 NTU. Particulate matter impairs disinfection."
            />

            <div className="flex items-center gap-2 pt-2">
              <input
                type="checkbox"
                id="ruleActive"
                checked={formData.active}
                onChange={(e) => setFormData({ ...formData, active: e.target.checked })}
                className="w-4 h-4 text-brand-700 border-surface-border rounded"
              />
              <label htmlFor="ruleActive" className="text-xs font-semibold text-text-primary">
                Enable this rule in real-time test evaluation engine
              </label>
            </div>

            <div className="flex justify-end gap-2 pt-3 border-t border-surface-border">
              <Button variant="secondary" onClick={() => setIsModalOpen(false)}>
                Cancel
              </Button>
              <Button type="submit" variant="primary" loading={saving}>
                {editingRule ? 'Save Rule Changes' : 'Create Rule'}
              </Button>
            </div>
          </form>
        </Modal>
      )}
    </div>
  );
};

export default RiskRulesPage;

