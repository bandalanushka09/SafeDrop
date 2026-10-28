import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { reportService } from '../../services/reportService';
import { sourceService } from '../../services/sourceService';
import api from '../../services/api';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../context/ToastContext';
import {
  PlusCircle,
  MapPin,
  Camera,
  Calendar,
  AlertTriangle,
  Upload,
  CheckCircle2,
  Navigation,
} from 'lucide-react';
import Input from '../../components/common/Input';
import Select from '../../components/common/Select';
import Textarea from '../../components/common/Textarea';
import Button from '../../components/common/Button';
import AlertBox from '../../components/common/AlertBox';

export const SubmitReportPage = () => {
  const { user } = useAuth();
  const { showToast } = useToast();
  const navigate = useNavigate();
  const location = useLocation();

  // Pre-selected source query param (e.g. from SourceDetailPage)
  const preSelectedSourceId = new URLSearchParams(location.search).get('sourceId') || '';

  const [sources, setSources] = useState([]);
  const [formData, setFormData] = useState({
    sourceId: preSelectedSourceId,
    village: user?.village || 'Rampur',
    locationDescription: '',
    latitude: '',
    longitude: '',
    category: 'unusual_color',
    description: '',
    observedAt: new Date().toISOString().split('T')[0],
    photoUrl: '',
  });

  const [uploadingPhoto, setUploadingPhoto] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');

  useEffect(() => {
    const fetchSources = async () => {
      try {
        const res = await sourceService.getAll({ limit: 100 });
        if (res.success) {
          setSources(res.data);
        }
      } catch (err) {
        console.error('Error loading sources for report dropdown:', err);
      }
    };
    fetchSources();
  }, []);

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSourceChange = (e) => {
    const sId = e.target.value;
    const selected = sources.find((s) => s._id === sId);
    setFormData({
      ...formData,
      sourceId: sId,
      village: selected ? selected.village : formData.village,
    });
  };

  const handleGetCurrentLocation = () => {
    if ('geolocation' in navigator) {
      navigator.geolocation.getCurrentPosition(
        (pos) => {
          setFormData((prev) => ({
            ...prev,
            latitude: pos.coords.latitude.toFixed(6),
            longitude: pos.coords.longitude.toFixed(6),
          }));
          showToast('GPS coordinates acquired successfully.');
        },
        (err) => {
          showToast(`Could not acquire location: ${err.message}`, 'warning');
        }
      );
    } else {
      showToast('Geolocation is not supported by your browser.', 'warning');
    }
  };

  const handlePhotoUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    const data = new FormData();
    data.append('photo', file);

    try {
      setUploadingPhoto(true);
      const res = await api.post('/upload', data, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      if (res.success) {
        setFormData((prev) => ({ ...prev, photoUrl: res.url }));
        showToast('Supporting photo uploaded.');
      }
    } catch (err) {
      showToast(err.message || 'Photo upload failed', 'error');
    } finally {
      setUploadingPhoto(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setErrorMessage('');

    if (formData.description.trim().length < 10) {
      setErrorMessage('Please provide a detailed description (at least 10 characters).');
      return;
    }

    try {
      setSubmitting(true);
      const payload = {
        category: formData.category,
        description: formData.description,
        village: formData.village,
        sourceId: formData.sourceId || undefined,
        locationDescription: formData.locationDescription,
        latitude: formData.latitude,
        longitude: formData.longitude,
        observedAt: formData.observedAt,
        photoUrl: formData.photoUrl,
      };

      const res = await reportService.create(payload);
      if (res.success) {
        showToast('Your water problem report has been submitted to village health personnel.');
        navigate('/my-reports');
      }
    } catch (err) {
      setErrorMessage(err.message || 'Failed to submit report. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  const categoryOptions = [
    { value: 'unusual_color', label: 'Unusual Color (Cloudy, Brown, Yellow)' },
    { value: 'unusual_odor', label: 'Unusual Odor (Muddy, Chlorine, Rotten Egg, Chemical)' },
    { value: 'visible_debris', label: 'Visible Debris / Rust / Suspended Particles' },
    { value: 'suspected_contamination', label: 'Suspected Contamination (Agricultural or Chemical)' },
    { value: 'damaged_infrastructure', label: 'Damaged Pump / Broken Tap / Leaking Valve' },
    { value: 'sewage_leakage', label: 'Sewage / Pit-Latrine Drainage Leak Near Source' },
    { value: 'supply_interruption', label: 'Water Supply Outage / Dry Aquifer' },
    { value: 'illness_cluster', label: 'Suspected Cluster of Diarrhea / Fever in Vicinity' },
    { value: 'other', label: 'Other Water Problem' },
  ];

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-text-primary">Report Suspected Contamination</h1>
        <p className="text-xs text-text-secondary mt-1">
          Submit observed changes in water color, odor, infrastructure damage, or environmental risks.
        </p>
      </div>

      <div className="bg-white rounded-xl border border-surface-border p-6 shadow-sm space-y-5">
        {errorMessage && (
          <AlertBox type="error" title="Submission Error">
            {errorMessage}
          </AlertBox>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <Select
            label="Problem Category"
            name="category"
            value={formData.category}
            onChange={handleChange}
            options={categoryOptions}
            required
            placeholder=""
          />

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <Select
              label="Associated Water Source (Optional)"
              name="sourceId"
              value={formData.sourceId}
              onChange={handleSourceChange}
              placeholder="Unlisted / General Location"
              options={sources.map((s) => ({
                value: s._id,
                label: `${s.name} (${s.village})`,
              }))}
            />

            <Input
              label="Village / Locality"
              name="village"
              value={formData.village}
              onChange={handleChange}
              required
            />
          </div>

          <Input
            label="Location Description / Landmarks"
            name="locationDescription"
            placeholder="e.g., 50 meters north of temple, near primary school tap"
            value={formData.locationDescription}
            onChange={handleChange}
            helperText="Provide recognizable nearby landmarks to help field technicians locate the issue."
          />

          {/* GPS Coordinates with One-Click Locate */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="relative">
              <Input
                label="Latitude"
                name="latitude"
                placeholder="e.g. 19.0760"
                value={formData.latitude}
                onChange={handleChange}
              />
            </div>
            <div className="flex items-end gap-2">
              <div className="flex-1">
                <Input
                  label="Longitude"
                  name="longitude"
                  placeholder="e.g. 73.0230"
                  value={formData.longitude}
                  onChange={handleChange}
                />
              </div>
              <Button
                type="button"
                variant="secondary"
                size="md"
                onClick={handleGetCurrentLocation}
                className="shrink-0 mb-0.5"
                icon={Navigation}
              >
                Locate
              </Button>
            </div>
          </div>

          <Input
            label="Observation Date"
            type="date"
            name="observedAt"
            value={formData.observedAt}
            onChange={handleChange}
            required
          />

          <Textarea
            label="Detailed Description"
            name="description"
            rows={4}
            placeholder="Describe what you observed: When did the issue start? Does the water taste metallic, look cloudy, or smell foul? Is wastewater overflowing nearby?"
            value={formData.description}
            onChange={handleChange}
            required
            helperText="Minimum 10 characters."
          />

          {/* Photo Upload */}
          <div className="space-y-1.5">
            <label className="block text-xs font-semibold text-text-primary uppercase tracking-wider">
              Optional Supporting Photograph
            </label>
            <div className="flex items-center gap-3">
              <label className="cursor-pointer inline-flex items-center gap-2 px-3 py-2 border border-surface-border rounded bg-slate-50 hover:bg-slate-100 text-xs font-semibold text-text-primary transition-colors">
                <Camera className="w-4 h-4 text-brand-700" />
                <span>{uploadingPhoto ? 'Uploading...' : 'Choose Photo (Max 5MB)'}</span>
                <input
                  type="file"
                  accept="image/jpeg,image/png,image/webp"
                  onChange={handlePhotoUpload}
                  disabled={uploadingPhoto}
                  className="hidden"
                />
              </label>
              {formData.photoUrl && (
                <span className="text-xs text-status-success font-medium flex items-center gap-1">
                  <CheckCircle2 className="w-4 h-4" />
                  Photo attached
                </span>
              )}
            </div>
          </div>

          <div className="pt-2">
            <Button
              type="submit"
              variant="primary"
              className="w-full py-2.5 font-semibold text-sm"
              loading={submitting}
              icon={PlusCircle}
            >
              Submit Report to Health Workers
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default SubmitReportPage;

