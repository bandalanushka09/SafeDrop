import React, { useEffect, useState } from 'react';
import { Building2, Pencil, Plus, Save, Trash2 } from 'lucide-react';
import Input from '../../components/common/Input';
import Select from '../../components/common/Select';
import Textarea from '../../components/common/Textarea';
import Button from '../../components/common/Button';
import Skeleton from '../../components/common/Skeleton';
import { useToast } from '../../context/ToastContext';
import { governmentService } from '../../services/governmentService';

const emptyDepartment = {
  departmentName: '',
  state: '',
  district: '',
  category: 'water_supply',
  officialApiEndpoint: '',
  contactInformation: '',
  notes: '',
  enabled: true,
};

const categoryOptions = [
  { value: 'water_supply', label: 'Water Supply' },
  { value: 'public_health', label: 'Public Health' },
  { value: 'municipal', label: 'Municipal Authority' },
  { value: 'sanitation', label: 'Sanitation' },
  { value: 'other', label: 'Other' },
];

export const GovernmentDepartmentsPage = () => {
  const { showToast } = useToast();
  const [departments, setDepartments] = useState([]);
  const [form, setForm] = useState(emptyDepartment);
  const [editingId, setEditingId] = useState('');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');

  const loadDepartments = async () => {
    try {
      setLoading(true);
      const response = await governmentService.getDepartments();
      if (response.success) setDepartments(response.data || []);
    } catch (error) {
      setErrorMessage(error.message || 'Government departments could not be loaded.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadDepartments();
  }, []);

  const updateForm = (event) => {
    const { name, value, type, checked } = event.target;
    setForm((current) => ({ ...current, [name]: type === 'checkbox' ? checked : value }));
  };

  const resetForm = () => {
    setEditingId('');
    setForm(emptyDepartment);
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    setErrorMessage('');
    setSaving(true);
    try {
      if (editingId) {
        await governmentService.updateDepartment(editingId, form);
        showToast('Department routing updated.');
      } else {
        await governmentService.createDepartment(form);
        showToast('Department routing added.');
      }
      resetForm();
      await loadDepartments();
    } catch (error) {
      setErrorMessage(error.message || 'Department routing could not be saved.');
    } finally {
      setSaving(false);
    }
  };

  const editDepartment = (department) => {
    setEditingId(department._id);
    setForm({
      departmentName: department.departmentName || '',
      state: department.state || '',
      district: department.district || '',
      category: department.category || 'other',
      officialApiEndpoint: department.officialApiEndpoint || '',
      contactInformation: department.contactInformation || '',
      notes: department.notes || '',
      enabled: Boolean(department.enabled),
    });
  };

  const toggleDepartment = async (department) => {
    try {
      await governmentService.updateDepartment(department._id, { enabled: !department.enabled });
      await loadDepartments();
    } catch (error) {
      showToast(error.message || 'Department status could not be updated.', 'error');
    }
  };

  const removeDepartment = async (department) => {
    if (!window.confirm(`Remove ${department.departmentName} from report routing?`)) return;
    try {
      await governmentService.deleteDepartment(department._id);
      showToast('Department routing removed.');
      await loadDepartments();
    } catch (error) {
      showToast(error.message || 'Department routing could not be removed.', 'error');
    }
  };

  return (
    <div className="mx-auto max-w-5xl space-y-6">
      <header className="flex items-start gap-3">
        <Building2 className="mt-1 h-6 w-6 text-brand-700" aria-hidden="true" />
        <div>
          <h1 className="text-2xl font-bold text-text-primary">Government Department Routing</h1>
          <p className="mt-1 text-sm text-text-secondary">Configure state, district, and concern-category routing. API credentials are managed only on the backend.</p>
        </div>
      </header>

      <section className="rounded-xl border border-surface-border bg-white p-5 shadow-sm sm:p-6">
        <h2 className="mb-4 text-lg font-semibold text-text-primary">{editingId ? 'Edit Department Routing' : 'Add Department Routing'}</h2>
        {errorMessage && <p className="mb-4 rounded border border-red-200 bg-red-50 p-3 text-sm text-red-800" role="alert">{errorMessage}</p>}
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid gap-4 sm:grid-cols-2">
            <Input label="Department Name" name="departmentName" value={form.departmentName} onChange={updateForm} required />
            <Select label="Concern Category" name="category" value={form.category} onChange={updateForm} options={categoryOptions} required />
            <Input label="State (leave blank for all states)" name="state" value={form.state} onChange={updateForm} />
            <Input label="District (leave blank for entire state)" name="district" value={form.district} onChange={updateForm} />
            <Input label="Official API Endpoint (optional)" name="officialApiEndpoint" type="url" value={form.officialApiEndpoint} onChange={updateForm} />
            <Input label="Department Contact Information" name="contactInformation" value={form.contactInformation} onChange={updateForm} />
          </div>
          <Textarea label="Internal Routing Notes (optional)" name="notes" rows={2} value={form.notes} onChange={updateForm} />
          <label className="flex items-center gap-2 text-sm text-text-primary">
            <input type="checkbox" name="enabled" checked={form.enabled} onChange={updateForm} className="h-4 w-4 accent-teal-700" />
            Enable this routing rule
          </label>
          <div className="flex flex-wrap gap-2">
            <Button type="submit" variant="primary" loading={saving} icon={editingId ? Save : Plus}>
              {editingId ? 'Save Routing' : 'Add Routing'}
            </Button>
            {editingId && <Button type="button" variant="secondary" onClick={resetForm}>Cancel Edit</Button>}
          </div>
        </form>
      </section>

      <section className="space-y-3">
        <h2 className="text-lg font-semibold text-text-primary">Configured Routing Rules</h2>
        {loading ? (
          <Skeleton className="h-40 w-full rounded-xl" />
        ) : departments.length ? (
          departments.map((department) => (
            <article key={department._id} className="flex flex-col justify-between gap-4 rounded-xl border border-surface-border bg-white p-4 shadow-sm sm:flex-row sm:items-center">
              <div>
                <h3 className="font-semibold text-text-primary">{department.departmentName}</h3>
                <p className="mt-1 text-xs capitalize text-text-secondary">
                  {[department.category?.replace(/_/g, ' '), department.district, department.state].filter(Boolean).join(' · ') || 'All India'}
                </p>
                {department.contactInformation && <p className="mt-1 text-xs text-text-secondary">{department.contactInformation}</p>}
                <span className={`mt-2 inline-flex rounded border px-2 py-0.5 text-xs font-semibold ${department.enabled ? 'border-green-200 bg-green-50 text-green-800' : 'border-surface-border bg-slate-50 text-text-secondary'}`}>
                  {department.enabled ? 'Enabled' : 'Disabled'}
                </span>
              </div>
              <div className="flex flex-wrap gap-2">
                <Button type="button" variant="secondary" size="sm" icon={Pencil} onClick={() => editDepartment(department)}>Edit</Button>
                <Button type="button" variant="secondary" size="sm" onClick={() => toggleDepartment(department)}>{department.enabled ? 'Disable' : 'Enable'}</Button>
                <Button type="button" variant="danger" size="sm" icon={Trash2} onClick={() => removeDepartment(department)}>Remove</Button>
              </div>
            </article>
          ))
        ) : (
          <p className="rounded border border-surface-border bg-white p-5 text-sm text-text-secondary">No routing rules have been configured yet.</p>
        )}
      </section>
    </div>
  );
};

export default GovernmentDepartmentsPage;
