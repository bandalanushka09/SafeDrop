import React, { useEffect, useMemo, useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { MapContainer, Marker, TileLayer, useMap, useMapEvents } from 'react-leaflet';
import L from 'leaflet';
import {
  AlertTriangle,
  CheckCircle2,
  FileWarning,
  LoaderCircle,
  MapPin,
  Navigation,
  Search,
  Upload,
  X,
} from 'lucide-react';
import Input from '../../components/common/Input';
import Textarea from '../../components/common/Textarea';
import { useAuth } from '../../context/AuthContext';
import { locationService } from '../../services/locationService';
import { reportService } from '../../services/reportService';
import { sourceService } from '../../services/sourceService';
import api from '../../services/api';

const INDIA_CENTER = [22.5, 79];
const MAX_IMAGE_SIZE = 5 * 1024 * 1024;
const MAX_IMAGES = 6;

const pinIcon = L.divIcon({
  className: 'report-location-pin',
  html: '<span style="display:block;width:18px;height:18px;border:3px solid white;border-radius:50%;background:#0f766e;box-shadow:0 1px 5px #334155"></span>',
  iconSize: [18, 18],
  iconAnchor: [9, 9],
});

const concernOptions = [
  ['dirty_or_muddy_water', 'Dirty or muddy water'],
  ['bad_smell', 'Bad smell'],
  ['unusual_taste', 'Unusual taste'],
  ['water_discoloration', 'Water discoloration'],
  ['suspected_contamination', 'Suspected contamination'],
  ['water_tank_dirty', 'Water tank is dirty'],
  ['water_tank_damaged', 'Water tank damaged'],
  ['sewage_near_water_source', 'Sewage near water source'],
  ['dead_animal_near_water_source', 'Dead animal near water source'],
  ['water_source_not_functioning', 'Water source not functioning'],
  ['possible_disease_outbreak', 'Possible disease outbreak'],
  ['unsafe_drinking_water', 'Unsafe drinking water'],
  ['other', 'Other'],
];

const sourceTypes = [
  ['water_tank', 'Water Tank'],
  ['borewell', 'Borewell'],
  ['hand_pump', 'Hand Pump'],
  ['open_well', 'Well'],
  ['public_tap', 'Public Tap'],
  ['reservoir', 'Reservoir'],
  ['community_supply', 'Community Water Source'],
  ['other', 'Other'],
  ['unknown', 'Unknown'],
];

const MapClickHandler = ({ onChoose }) => {
  useMapEvents({
    click(event) {
      onChoose(event.latlng.lat, event.latlng.lng);
    },
  });
  return null;
};

const ReportMapViewport = ({ coordinates }) => {
  const map = useMap();
  useEffect(() => {
    if (coordinates.latitude && coordinates.longitude) {
      map.flyTo([Number(coordinates.latitude), Number(coordinates.longitude)], 13, { duration: 0.6 });
    }
  }, [coordinates.latitude, coordinates.longitude, map]);
  return null;
};

const ReportMap = ({ coordinates, onChoose }) => (
  <div className="h-64 overflow-hidden rounded border border-surface-border sm:h-72">
    <MapContainer
      center={
        coordinates.latitude && coordinates.longitude
          ? [Number(coordinates.latitude), Number(coordinates.longitude)]
          : INDIA_CENTER
      }
      zoom={coordinates.latitude && coordinates.longitude ? 13 : 4}
      scrollWheelZoom
      className="h-full w-full"
    >
      <TileLayer
        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
      />
      <ReportMapViewport coordinates={coordinates} />
      <MapClickHandler onChoose={onChoose} />
      {coordinates.latitude && coordinates.longitude && (
        <Marker
          position={[Number(coordinates.latitude), Number(coordinates.longitude)]}
          icon={pinIcon}
          draggable
          eventHandlers={{
            dragend(event) {
              const { lat, lng } = event.target.getLatLng();
              onChoose(lat, lng);
            },
          }}
        />
      )}
    </MapContainer>
  </div>
);

export const PublicReportPage = () => {
  const { user } = useAuth();
  const { search } = useLocation();
  const selectedSourceId = new URLSearchParams(search).get('sourceId') || '';
  const [sources, setSources] = useState([]);
  const [states, setStates] = useState([]);
  const [form, setForm] = useState({
    fullName: user?.name || '',
    phone: user?.phoneNumber || '',
    email: user?.email || '',
    state: '',
    district: '',
    taluka: '',
    village: user?.village || '',
    address: '',
    latitude: '',
    longitude: '',
    waterSourceId: selectedSourceId,
    waterSourceType: 'unknown',
    waterSourceName: '',
    concerns: [],
    description: '',
  });
  const [locationQuery, setLocationQuery] = useState('');
  const [locationResultSelected, setLocationResultSelected] = useState(false);
  const [locationResults, setLocationResults] = useState([]);
  const [locationError, setLocationError] = useState('');
  const [sourcesError, setSourcesError] = useState('');
  const [images, setImages] = useState([]);
  const [uploading, setUploading] = useState(false);
  const [locating, setLocating] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [success, setSuccess] = useState(null);

  useEffect(() => {
    let active = true;
    Promise.all([sourceService.getAll({ forMap: 'true', limit: 2000 }), locationService.getStates()])
      .then(([sourceRes, stateRes]) => {
        if (!active) return;
        if (sourceRes.success) setSources(sourceRes.data || []);
        if (stateRes.success) setStates(stateRes.data || []);
      })
      .catch(() => {
        if (active) setSourcesError('Registered water sources could not be loaded. You can still submit a general report.');
      });
    return () => {
      active = false;
    };
  }, []);

  useEffect(() => {
    const selected = sources.find((source) => source._id === selectedSourceId);
    if (!selected) return;
    setForm((current) => ({
      ...current,
      waterSourceId: selected._id,
      waterSourceName: selected.name || '',
      waterSourceType: selected.type || 'unknown',
      village: selected.village || current.village,
      taluka: selected.taluka || current.taluka,
      district: selected.district || current.district,
      state: selected.state || current.state,
      address: selected.address || current.address,
      latitude: selected.coordinates?.latitude ?? current.latitude,
      longitude: selected.coordinates?.longitude ?? current.longitude,
    }));
  }, [selectedSourceId, sources]);

  useEffect(() => {
    const query = locationQuery.trim();
    if (query.length < 2 || locationResultSelected) {
      setLocationResults([]);
      setLocationError('');
      return undefined;
    }

    let active = true;
    const timeout = window.setTimeout(async () => {
      try {
        const response = await locationService.search(query);
        if (active) {
          setLocationResults(response.data || []);
          setLocationError('');
        }
      } catch {
        if (active) {
          setLocationResults([]);
          setLocationError('Location suggestions are unavailable. Enter the location manually.');
        }
      }
    }, 350);
    return () => {
      active = false;
      window.clearTimeout(timeout);
    };
  }, [locationQuery, locationResultSelected]);

  const selectedSource = useMemo(
    () => sources.find((source) => source._id === form.waterSourceId),
    [sources, form.waterSourceId]
  );

  const updateForm = (event) => {
    const { name, value } = event.target;
    setForm((current) => ({ ...current, [name]: value }));
  };

  const selectLocation = (place) => {
    setForm((current) => ({
      ...current,
      latitude: Number(place.latitude).toFixed(6),
      longitude: Number(place.longitude).toFixed(6),
      state: place.state || current.state,
      district: place.district || current.district,
      taluka: place.taluka || current.taluka,
      village: place.village || current.village,
      address: place.address || place.displayName || current.address,
    }));
    setLocationQuery(place.displayName || '');
    setLocationResultSelected(true);
    setLocationResults([]);
  };

  const chooseCoordinates = async (latitude, longitude) => {
    setLocationError('');
    setForm((current) => ({
      ...current,
      latitude: Number(latitude).toFixed(6),
      longitude: Number(longitude).toFixed(6),
    }));
    try {
      const response = await locationService.reverse(latitude, longitude);
      if (response.success) {
        selectLocation({ ...response.data, latitude, longitude });
      } else {
        setLocationError('Coordinates saved. Address lookup is unavailable, so please enter the location details manually.');
      }
    } catch {
      setLocationError('Coordinates saved. Address lookup is unavailable, so please enter the location details manually.');
    }
  };

  const useMyLocation = () => {
    setLocationError('');
    if (!navigator.geolocation) {
      setLocationError('Location access is not supported by this browser.');
      return;
    }
    setLocating(true);
    navigator.geolocation.getCurrentPosition(
      ({ coords }) => {
        chooseCoordinates(coords.latitude, coords.longitude).finally(() => setLocating(false));
      },
      () => {
        setLocationError('We could not access your location. Allow location access in your browser settings, or select a point on the map.');
        setLocating(false);
      },
      { enableHighAccuracy: true, timeout: 10000, maximumAge: 0 }
    );
  };

  const handleSourceChange = (event) => {
    const sourceId = event.target.value;
    const source = sources.find((item) => item._id === sourceId);
    setForm((current) => ({
      ...current,
      waterSourceId: sourceId,
      waterSourceName: source?.name || '',
      waterSourceType: source?.type || 'unknown',
      village: source?.village || current.village,
      taluka: source?.taluka || current.taluka,
      district: source?.district || current.district,
      state: source?.state || current.state,
      address: source?.address || current.address,
      latitude: source?.coordinates?.latitude ?? current.latitude,
      longitude: source?.coordinates?.longitude ?? current.longitude,
    }));
  };

  const handleImageUpload = async (event) => {
    const files = Array.from(event.target.files || []);
    event.target.value = '';
    if (!files.length) return;
    if (images.length + files.length > MAX_IMAGES) {
      setErrorMessage(`You can attach up to ${MAX_IMAGES} photos.`);
      return;
    }
    const invalid = files.find(
      (file) =>
        !['image/jpeg', 'image/png', 'image/webp'].includes(file.type) ||
        file.size > MAX_IMAGE_SIZE
    );
    if (invalid) {
      setErrorMessage('Choose JPEG, PNG, or WebP photos smaller than 5 MB each.');
      return;
    }
    setErrorMessage('');
    setUploading(true);
    try {
      const uploaded = await Promise.all(
        files.map(async (file) => {
          const data = new FormData();
          data.append('photo', file);
          const response = await api.post('/upload/public', data, {
            headers: { 'Content-Type': 'multipart/form-data' },
          });
          return response.url;
        })
      );
      setImages((current) => [...current, ...uploaded].slice(0, MAX_IMAGES));
    } catch (error) {
      setErrorMessage(error.message || 'A photo could not be uploaded. Please try again.');
    } finally {
      setUploading(false);
    }
  };

  const toggleConcern = (value) => {
    setForm((current) => ({
      ...current,
      concerns: current.concerns.includes(value)
        ? current.concerns.filter((concern) => concern !== value)
        : [...current.concerns, value],
    }));
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    setErrorMessage('');
    if (form.concerns.length === 0) {
      setErrorMessage('Select at least one concern type.');
      return;
    }
    if (form.description.trim().length < 10) {
      setErrorMessage('Describe the problem in at least 10 characters.');
      return;
    }
    if (uploading) {
      setErrorMessage('Wait for your photos to finish uploading before submitting.');
      return;
    }

    setSubmitting(true);
    try {
      const response = await reportService.createPublic({
        ...form,
        latitude: form.latitude || undefined,
        longitude: form.longitude || undefined,
        imageUrls: images,
      });
      setSuccess({
        ...response.data,
        duplicateWarning: response.duplicateWarning,
        duplicateMessage: response.duplicateMessage,
      });
    } catch (error) {
      setErrorMessage(error.message || 'We could not submit your report. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleAnotherReport = () => {
    setSuccess(null);
    setImages([]);
    setForm((current) => ({
      fullName: current.fullName,
      phone: current.phone,
      email: current.email,
      state: '',
      district: '',
      taluka: '',
      village: '',
      address: '',
      latitude: '',
      longitude: '',
      waterSourceId: '',
      waterSourceType: 'unknown',
      waterSourceName: '',
      concerns: [],
      description: '',
    }));
    setLocationQuery('');
    setLocationResultSelected(false);
    setLocationResults([]);
  };

  if (success) {
    return (
      <section className="mx-auto max-w-2xl px-4 py-10 sm:px-6">
        <div className="rounded-xl border border-surface-border bg-white p-6 text-center shadow-sm sm:p-9">
          <CheckCircle2 className="mx-auto h-12 w-12 text-brand-700" aria-hidden="true" />
          <h1 className="mt-4 text-2xl font-bold text-text-primary">Report Received</h1>
          <p className="mt-2 text-sm text-text-secondary">
            Your report has been recorded by SafeDrop and is ready for official submission.
          </p>
          <div className="mt-6 rounded-lg border border-surface-border bg-slate-50 p-4 text-left">
            <p className="text-xs font-semibold uppercase tracking-wide text-text-secondary">SafeDrop Reference Number</p>
            <p className="mt-1 break-all font-mono text-xl font-bold text-brand-800">{success.referenceId}</p>
            <p className="mt-3 text-sm text-text-primary">
              {[success.village, success.district, success.state].filter(Boolean).join(', ')}
            </p>
            <p className="mt-2 text-xs text-text-secondary">
              This confirms receipt by SafeDrop. It does not confirm submission to a government department.
            </p>
            {success.duplicateWarning && (
              <p className="mt-3 flex items-start gap-2 text-sm text-amber-800" role="status">
                <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" />
                {success.duplicateMessage || 'A similar report was recently submitted. Your report was still recorded because the issue may be ongoing.'}
              </p>
            )}
          </div>
          <div className="mt-6 flex flex-col justify-center gap-3 sm:flex-row">
            <Link
              to={`/track-report?ref=${encodeURIComponent(success.referenceId)}`}
              className="rounded bg-brand-700 px-5 py-2.5 text-sm font-semibold text-white hover:bg-brand-800"
            >
              Track Report
            </Link>
            <button
              type="button"
              onClick={handleAnotherReport}
              className="rounded border border-surface-border px-5 py-2.5 text-sm font-semibold text-text-primary hover:bg-slate-50"
            >
              Report Another Concern
            </button>
          </div>
        </div>
      </section>
    );
  }

  return (
    <div className="mx-auto max-w-4xl space-y-6 px-4 py-8 sm:px-6">
      <header>
        <div className="flex items-center gap-2 text-brand-800">
          <FileWarning className="h-5 w-5" aria-hidden="true" />
          <span className="text-xs font-semibold uppercase tracking-wide">Community water safety</span>
        </div>
        <h1 className="mt-2 text-2xl font-bold text-text-primary sm:text-3xl">Report a Water Concern</h1>
        <p className="mt-2 max-w-2xl text-sm text-text-secondary">
          Submit a concern without creating an account. Required fields are marked with an asterisk.
        </p>
      </header>

      <form onSubmit={handleSubmit} className="space-y-6">
        {errorMessage && (
          <div className="rounded border border-red-200 bg-red-50 p-3 text-sm text-red-800" role="alert">
            {errorMessage}
          </div>
        )}
        {sourcesError && (
          <div className="rounded border border-amber-200 bg-amber-50 p-3 text-sm text-amber-900" role="status">
            {sourcesError}
          </div>
        )}

        <section className="space-y-4 rounded-xl border border-surface-border bg-white p-5 shadow-sm sm:p-6">
          <h2 className="text-lg font-semibold text-text-primary">Your contact information</h2>
          <div className="grid gap-4 sm:grid-cols-2">
            <Input label="Full Name" name="fullName" autoComplete="name" value={form.fullName} onChange={updateForm} required />
            <Input
              label="Phone Number"
              name="phone"
              type="tel"
              autoComplete="tel"
              inputMode="tel"
              placeholder="+91 98765 43210"
              pattern="(\+91[\s\-]?)?[6-9][0-9\s\-]{9,13}"
              value={form.phone}
              onChange={updateForm}
              required
            />
            <Input label="Email Address" name="email" type="email" autoComplete="email" value={form.email} onChange={updateForm} required />
          </div>
        </section>

        <section className="space-y-4 rounded-xl border border-surface-border bg-white p-5 shadow-sm sm:p-6">
          <div>
            <h2 className="text-lg font-semibold text-text-primary">Concern location</h2>
            <p className="mt-1 text-xs text-text-secondary">Search for a place, use your location, or select a point on the map. You can also enter the address manually.</p>
          </div>
          <div className="relative">
            <label htmlFor="report-location-search" className="mb-1.5 block text-xs font-semibold uppercase tracking-wide text-text-primary">Search location</label>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-text-secondary" aria-hidden="true" />
              <input
                id="report-location-search"
                value={locationQuery}
                onChange={(event) => {
                  setLocationResultSelected(false);
                  setLocationQuery(event.target.value);
                }}
                placeholder="Search village, city, district or state"
                autoComplete="off"
                className="w-full rounded border border-surface-border py-2 pl-9 pr-3 text-sm focus:border-brand-700 focus:outline-none focus:ring-1 focus:ring-brand-700"
              />
            </div>
            {locationResults.length > 0 && (
              <ul className="absolute z-20 mt-1 max-h-56 w-full overflow-y-auto rounded border border-surface-border bg-white shadow-lg" role="listbox">
                {locationResults.map((place, index) => (
                  <li key={`${place.latitude}-${place.longitude}-${index}`}>
                    <button
                      type="button"
                      role="option"
                      aria-selected="false"
                      onClick={() => selectLocation(place)}
                      className="w-full px-3 py-2 text-left text-sm hover:bg-teal-50 focus:bg-teal-50 focus:outline-none"
                    >
                      {place.displayName}
                    </button>
                  </li>
                ))}
              </ul>
            )}
            {locationError && <p className="mt-1 text-xs text-amber-800" role="status">{locationError}</p>}
          </div>
          <button
            type="button"
            onClick={useMyLocation}
            disabled={locating}
            className="inline-flex min-h-10 items-center gap-2 rounded border border-brand-700 px-3 py-2 text-sm font-semibold text-brand-800 hover:bg-teal-50 disabled:opacity-60"
          >
            {locating ? <LoaderCircle className="h-4 w-4 animate-spin" /> : <Navigation className="h-4 w-4" />}
            {locating ? 'Finding location...' : 'Use My Location'}
          </button>
          <ReportMap
            coordinates={form}
            onChoose={(latitude, longitude) => chooseCoordinates(latitude, longitude)}
          />
          <div className="grid gap-4 sm:grid-cols-2">
            <Input label="State" name="state" list="india-states" value={form.state} onChange={updateForm} required />
            <datalist id="india-states">
              {states.map((state) => <option key={state.name} value={state.name} />)}
            </datalist>
            <Input label="District" name="district" value={form.district} onChange={updateForm} required />
            <Input label="Taluka / Tehsil" name="taluka" value={form.taluka} onChange={updateForm} />
            <Input label="Village / City" name="village" value={form.village} onChange={updateForm} required />
            <Input label="Full Address" name="address" autoComplete="street-address" value={form.address} onChange={updateForm} required />
            <Input label="Latitude" name="latitude" type="number" step="any" min="-90" max="90" inputMode="decimal" value={form.latitude} onChange={updateForm} />
            <Input label="Longitude" name="longitude" type="number" step="any" min="-180" max="180" inputMode="decimal" value={form.longitude} onChange={updateForm} />
          </div>
        </section>

        <section className="space-y-4 rounded-xl border border-surface-border bg-white p-5 shadow-sm sm:p-6">
          <h2 className="text-lg font-semibold text-text-primary">Water source</h2>
          <label htmlFor="water-source" className="mb-1.5 block text-xs font-semibold uppercase tracking-wide text-text-primary">
            Registered Water Source
          </label>
          <select
            id="water-source"
            name="waterSourceId"
            value={form.waterSourceId}
            onChange={handleSourceChange}
            className="w-full rounded border border-surface-border bg-white px-3 py-2 text-sm focus:border-brand-700 focus:outline-none focus:ring-1 focus:ring-brand-700"
          >
            <option value="">Not listed / general location</option>
            {sources.map((source) => (
              <option key={source._id} value={source._id}>{source.name} — {source.village}</option>
            ))}
          </select>
          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label htmlFor="source-type" className="mb-1.5 block text-xs font-semibold uppercase tracking-wide text-text-primary">Source Type</label>
              <select id="source-type" name="waterSourceType" value={form.waterSourceType} onChange={updateForm} className="w-full rounded border border-surface-border bg-white px-3 py-2 text-sm">
                {sourceTypes.map(([value, label]) => <option key={value} value={value}>{label}</option>)}
              </select>
            </div>
            <Input label="Water Source Name" name="waterSourceName" value={form.waterSourceName} onChange={updateForm} />
          </div>
          {selectedSource && <p className="flex items-center gap-1.5 text-xs text-brand-800"><MapPin className="h-3.5 w-3.5" /> Location fields have been filled from this registered source; you can edit them.</p>}
        </section>

        <section className="space-y-4 rounded-xl border border-surface-border bg-white p-5 shadow-sm sm:p-6">
          <fieldset>
            <legend className="text-lg font-semibold text-text-primary">What is your concern? <span className="text-red-700">*</span></legend>
            <p className="mt-1 text-xs text-text-secondary">Select all that apply.</p>
            <div className="mt-3 grid gap-2 sm:grid-cols-2">
              {concernOptions.map(([value, label]) => (
                <label key={value} className="flex min-h-10 items-start gap-2 rounded border border-surface-border p-2.5 text-sm text-text-primary hover:bg-slate-50">
                  <input type="checkbox" checked={form.concerns.includes(value)} onChange={() => toggleConcern(value)} className="mt-0.5 h-4 w-4 accent-teal-700" />
                  <span>{label}</span>
                </label>
              ))}
            </div>
          </fieldset>
          <Textarea
            label="Describe the problem"
            name="description"
            rows={5}
            minLength={10}
            maxLength={4000}
            placeholder="Describe what you observed, when you noticed it, and any information that may help authorities."
            value={form.description}
            onChange={updateForm}
            required
          />
          <div>
            <label htmlFor="report-photos" className="mb-1.5 block text-xs font-semibold uppercase tracking-wide text-text-primary">Supporting Photos (Optional)</label>
            <p className="mb-2 text-xs text-text-secondary">JPEG, PNG or WebP, up to 5 MB each. Maximum {MAX_IMAGES} photos.</p>
            <label className="inline-flex min-h-10 cursor-pointer items-center gap-2 rounded border border-surface-border px-3 py-2 text-sm font-semibold text-text-primary hover:bg-slate-50">
              {uploading ? <LoaderCircle className="h-4 w-4 animate-spin" /> : <Upload className="h-4 w-4" />}
              {uploading ? 'Uploading photos...' : 'Choose Photos'}
              <input
                id="report-photos"
                type="file"
                accept="image/jpeg,image/png,image/webp"
                multiple
                disabled={uploading || images.length >= MAX_IMAGES}
                onChange={handleImageUpload}
                className="sr-only"
              />
            </label>
            {images.length > 0 && (
              <ul className="mt-3 space-y-2">
                {images.map((image, index) => (
                  <li key={image} className="flex items-center justify-between rounded bg-slate-50 px-3 py-2 text-xs">
                    <span className="truncate">Photo {index + 1} attached</span>
                    <button type="button" onClick={() => setImages((current) => current.filter((url) => url !== image))} aria-label={`Remove photo ${index + 1}`} className="rounded p-1 text-text-secondary hover:bg-white hover:text-red-700"><X className="h-4 w-4" /></button>
                  </li>
                ))}
              </ul>
            )}
          </div>
          <p className="text-xs text-text-secondary">Report date and time are recorded automatically when submitted.</p>
        </section>

        <button
          type="submit"
          disabled={submitting || uploading}
          className="inline-flex min-h-12 w-full items-center justify-center gap-2 rounded bg-brand-700 px-5 py-3 text-sm font-semibold text-white hover:bg-brand-800 disabled:cursor-not-allowed disabled:opacity-60"
        >
          {submitting ? <LoaderCircle className="h-4 w-4 animate-spin" /> : <FileWarning className="h-4 w-4" />}
          {submitting ? 'Submitting Report...' : 'Submit Water Concern'}
        </button>
      </form>
      <p className="text-center text-xs text-text-secondary">
        Already submitted a report? <Link to="/track-report" className="font-semibold text-brand-800 underline">Track its status</Link>
      </p>
    </div>
  );
};

export default PublicReportPage;
