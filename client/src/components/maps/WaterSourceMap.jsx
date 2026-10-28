import React, { useState, useMemo, useEffect } from 'react';
import { MapContainer, TileLayer, Marker, Popup, useMap } from 'react-leaflet';
import L from 'leaflet';
import { Link } from 'react-router-dom';
import { MapPin, Eye, List, Map as MapIcon, Search, X } from 'lucide-react';
import Badge from '../common/Badge';
import { locationService } from '../../services/locationService';

// Fix Leaflet standard marker icon paths in Vite
delete L.Icon.Default.prototype._getIconUrl;

const INDIA_CENTER = [22.5, 79];

const riskColors = {
  SAFE: '#15803D',
  WARNING: '#D97706',
  HIGH_RISK: '#B91C1C',
  UNKNOWN: '#64748B',
};

const createCustomIcon = (riskLevel, selected) => {
  const color = riskColors[riskLevel] || riskColors.UNKNOWN;
  const outline = selected ? '#0F172A' : '#FFFFFF';

  const svg = `
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="30" height="30">
      <path fill="${color}" stroke="${outline}" stroke-width="2" d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5c-1.38 0-2.5-1.12-2.5-2.5s1.12-2.5 2.5-2.5 2.5 1.12 2.5 2.5-1.12 2.5-2.5 2.5z"/>
    </svg>
  `;

  return L.divIcon({
    html: svg,
    className: 'custom-leaflet-marker',
    iconSize: [30, 30],
    iconAnchor: [15, 30],
    popupAnchor: [0, -30],
  });
};

const MapViewport = ({ target }) => {
  const map = useMap();
  useEffect(() => {
    if (target) map.flyTo(target.center, target.zoom, { duration: 0.8 });
  }, [map, target]);
  return null;
};

export const WaterSourceMap = ({ sources = [], height = '500px' }) => {
  const [selectedVillage, setSelectedVillage] = useState('');
  const [selectedState, setSelectedState] = useState('');
  const [selectedDistrict, setSelectedDistrict] = useState('');
  const [selectedRisk, setSelectedRisk] = useState('');
  const [selectedStatus, setSelectedStatus] = useState('');
  const [selectedTestingStatus, setSelectedTestingStatus] = useState('');
  const [selectedType, setSelectedType] = useState('');
  const [viewMode, setViewMode] = useState('map'); // 'map' | 'list'
  const [searchText, setSearchText] = useState('');
  const [searchResultSelected, setSearchResultSelected] = useState(false);
  const [locationResults, setLocationResults] = useState([]);
  const [searchError, setSearchError] = useState('');
  const [mapTarget, setMapTarget] = useState({ center: INDIA_CENTER, zoom: 5 });
  const [selectedSourceId, setSelectedSourceId] = useState('');

  const villages = useMemo(() => {
    return Array.from(new Set(sources.map((s) => s.village).filter(Boolean)));
  }, [sources]);

  const states = useMemo(
    () => Array.from(new Set(sources.map((source) => source.state).filter(Boolean))).sort(),
    [sources]
  );
  const districts = useMemo(
    () => Array.from(new Set(sources.map((source) => source.district).filter(Boolean))).sort(),
    [sources]
  );

  useEffect(() => {
    const query = searchText.trim();
    if (query.length < 2 || searchResultSelected) {
      setLocationResults([]);
      setSearchError('');
      return undefined;
    }
    let active = true;
    const timeout = window.setTimeout(async () => {
      try {
        const response = await locationService.search(query);
        if (active) {
          setLocationResults(response.data || []);
          setSearchError('');
        }
      } catch {
        if (active) {
          setLocationResults([]);
          setSearchError('Location suggestions are temporarily unavailable.');
        }
      }
    }, 350);
    return () => {
      active = false;
      window.clearTimeout(timeout);
    };
  }, [searchText, searchResultSelected]);

  const filteredSources = useMemo(() => {
    return sources.filter((s) => {
      if (selectedState && s.state !== selectedState) return false;
      if (selectedDistrict && s.district !== selectedDistrict) return false;
      if (selectedVillage && s.village !== selectedVillage) return false;
      if (selectedRisk && (s.riskLevel || 'UNKNOWN') !== selectedRisk) return false;
      if (selectedStatus && s.status !== selectedStatus) return false;
      if (selectedType && s.type !== selectedType) return false;
      if (selectedTestingStatus === 'tested' && !s.lastTestDate && !s.lastTestedAt) return false;
      if (selectedTestingStatus === 'not_tested' && (s.lastTestDate || s.lastTestedAt)) return false;
      return true;
    });
  }, [
    sources,
    selectedVillage,
    selectedState,
    selectedDistrict,
    selectedRisk,
    selectedStatus,
    selectedType,
    selectedTestingStatus,
  ]);

  const validMappedSources = useMemo(() => {
    return filteredSources.filter(
      (s) =>
        s.coordinates?.latitude !== undefined &&
        s.coordinates?.longitude !== undefined &&
        !isNaN(Number(s.coordinates.latitude)) &&
        !isNaN(Number(s.coordinates.longitude))
    );
  }, [filteredSources]);

  const sourceSuggestions = useMemo(() => {
    const query = searchText.trim().toLowerCase();
    if (query.length < 2) return [];
    return sources
      .filter((source) =>
        source.coordinates?.latitude != null &&
        source.coordinates?.longitude != null &&
        [source.name, source.village, source.district, source.taluka, source.state, source.address]
          .filter(Boolean)
          .some((value) => value.toLowerCase().includes(query))
      )
      .slice(0, 5);
  }, [searchText, sources]);

  const selectLocation = (place) => {
    const zoom = place.zoom || (place.type === 'state' ? 6 : 12);
    setMapTarget({ center: [Number(place.latitude), Number(place.longitude)], zoom });
    setSearchResultSelected(true);
    setSearchText(place.displayName || '');
    setLocationResults([]);
  };

  const selectSource = (source) => {
    setSelectedSourceId(source._id);
    setSearchResultSelected(true);
    setSearchText(source.name);
    setLocationResults([]);
    setMapTarget({
      center: [Number(source.coordinates.latitude), Number(source.coordinates.longitude)],
      zoom: 16,
    });
  };

  const clearFilters = () => {
    setSelectedVillage('');
    setSelectedState('');
    setSelectedDistrict('');
    setSelectedRisk('');
    setSelectedStatus('');
    setSelectedTestingStatus('');
    setSelectedType('');
  };

  const hasFilters =
    selectedVillage ||
    selectedState ||
    selectedDistrict ||
    selectedRisk ||
    selectedStatus ||
    selectedTestingStatus ||
    selectedType;

  return (
    <div className="bg-white rounded-lg border border-surface-border shadow-sm overflow-hidden flex flex-col">
      <div className="space-y-3 border-b border-surface-border bg-slate-50 p-4">
        <div className="relative">
          <label htmlFor="water-map-search" className="sr-only">Search places and water sources</label>
          <div className="relative">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-text-secondary" aria-hidden="true" />
            <input
              id="water-map-search"
              type="search"
              value={searchText}
              onChange={(event) => {
                setSelectedSourceId('');
                setSearchResultSelected(false);
                setSearchText(event.target.value);
              }}
              placeholder="Search village, city, district, state or water source..."
              autoComplete="off"
              className="w-full rounded border border-surface-border bg-white py-2.5 pl-9 pr-9 text-sm focus:border-brand-700 focus:outline-none focus:ring-1 focus:ring-brand-700"
            />
            {searchText && (
              <button type="button" onClick={() => { setSearchText(''); setLocationResults([]); }} aria-label="Clear search" className="absolute right-2 top-1/2 rounded p-1 text-text-secondary hover:bg-slate-100">
                <X className="h-4 w-4" />
              </button>
            )}
          </div>
          {!searchResultSelected && (locationResults.length > 0 || sourceSuggestions.length > 0) && (
            <div className="absolute z-[1100] mt-1 max-h-72 w-full overflow-y-auto rounded border border-surface-border bg-white shadow-lg">
              {sourceSuggestions.map((source) => (
                <button
                  type="button"
                  key={source._id}
                  onClick={() => selectSource(source)}
                  className="block w-full border-b border-surface-border px-3 py-2 text-left text-sm hover:bg-teal-50"
                >
                  <span className="block font-semibold text-text-primary">{source.name}</span>
                  <span className="text-xs text-text-secondary">{[source.village, source.district, source.state].filter(Boolean).join(', ')}</span>
                </button>
              ))}
              {locationResults.map((place, index) => (
                <button
                  type="button"
                  key={`${place.latitude}-${place.longitude}-${index}`}
                  onClick={() => selectLocation(place)}
                  className="block w-full border-b border-surface-border px-3 py-2 text-left text-sm last:border-0 hover:bg-teal-50"
                >
                  {place.displayName}
                </button>
              ))}
            </div>
          )}
          {searchError && <p className="mt-1 text-xs text-amber-800" role="status">{searchError} You can search registered source names below.</p>}
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <select aria-label="Filter by state" value={selectedState} onChange={(e) => setSelectedState(e.target.value)} className="min-h-9 rounded border border-surface-border bg-white px-2.5 py-1.5 text-xs focus:outline-none focus:ring-1 focus:ring-brand-700">
            <option value="">All States</option>
            {states.map((state) => <option key={state} value={state}>{state}</option>)}
          </select>
          <select aria-label="Filter by district" value={selectedDistrict} onChange={(e) => setSelectedDistrict(e.target.value)} className="min-h-9 rounded border border-surface-border bg-white px-2.5 py-1.5 text-xs focus:outline-none focus:ring-1 focus:ring-brand-700">
            <option value="">All Districts</option>
            {districts.map((district) => <option key={district} value={district}>{district}</option>)}
          </select>
          <select aria-label="Filter by village" value={selectedVillage} onChange={(e) => setSelectedVillage(e.target.value)} className="min-h-9 rounded border border-surface-border bg-white px-2.5 py-1.5 text-xs focus:outline-none focus:ring-1 focus:ring-brand-700">
            <option value="">All Villages ({villages.length})</option>
            {villages.map((v) => <option key={v} value={v}>{v}</option>)}
          </select>
          <select aria-label="Filter by water-source type" value={selectedType} onChange={(e) => setSelectedType(e.target.value)} className="min-h-9 rounded border border-surface-border bg-white px-2.5 py-1.5 text-xs focus:outline-none focus:ring-1 focus:ring-brand-700">
            <option value="">All Source Types</option>
            <option value="water_tank">Water Tank</option>
            <option value="borewell">Borewell</option>
            <option value="hand_pump">Hand Pump</option>
            <option value="open_well">Well</option>
            <option value="public_tap">Public Tap</option>
            <option value="reservoir">Reservoir</option>
            <option value="community_supply">Community Water Source</option>
            <option value="other">Other</option>
          </select>
          <select aria-label="Filter by risk" value={selectedRisk} onChange={(e) => setSelectedRisk(e.target.value)} className="min-h-9 rounded border border-surface-border bg-white px-2.5 py-1.5 text-xs focus:outline-none focus:ring-1 focus:ring-brand-700">
            <option value="">All Risk Levels</option>
            <option value="SAFE">Safe</option>
            <option value="WARNING">Warning</option>
            <option value="HIGH_RISK">High Risk</option>
            <option value="UNKNOWN">Not Tested / Unknown</option>
          </select>
          <select aria-label="Filter by operational status" value={selectedStatus} onChange={(e) => setSelectedStatus(e.target.value)} className="min-h-9 rounded border border-surface-border bg-white px-2.5 py-1.5 text-xs focus:outline-none focus:ring-1 focus:ring-brand-700">
            <option value="">All Water Statuses</option>
            <option value="active">Active</option>
            <option value="under_inspection">Under Inspection</option>
            <option value="temporarily_unavailable">Temporarily Unavailable</option>
            <option value="deactivated">Deactivated</option>
          </select>
          <select aria-label="Filter by testing status" value={selectedTestingStatus} onChange={(e) => setSelectedTestingStatus(e.target.value)} className="min-h-9 rounded border border-surface-border bg-white px-2.5 py-1.5 text-xs focus:outline-none focus:ring-1 focus:ring-brand-700">
            <option value="">Any Testing Status</option>
            <option value="tested">Tested</option>
            <option value="not_tested">Not Tested</option>
          </select>
          {hasFilters && (
            <button type="button" onClick={clearFilters} className="min-h-9 rounded px-2 text-xs font-semibold text-brand-800 underline">
              Clear Filters
            </button>
          )}
        </div>

        <div className="flex flex-wrap items-center justify-between gap-3">
          <p className="text-xs text-text-secondary">{validMappedSources.length} mapped of {filteredSources.length} matching water sources</p>
        <div className="flex items-center gap-1 bg-white border border-surface-border rounded p-0.5">
          <button
            type="button"
            onClick={() => setViewMode('map')}
            className={`inline-flex items-center gap-1 px-2.5 py-1 text-xs font-medium rounded transition-colors ${
              viewMode === 'map'
                ? 'bg-brand-700 text-white'
                : 'text-text-secondary hover:text-text-primary'
            }`}
          >
            <MapIcon className="w-3.5 h-3.5" />
            <span>Map View ({validMappedSources.length})</span>
          </button>
          <button
            type="button"
            onClick={() => setViewMode('list')}
            className={`inline-flex items-center gap-1 px-2.5 py-1 text-xs font-medium rounded transition-colors ${
              viewMode === 'list'
                ? 'bg-brand-700 text-white'
                : 'text-text-secondary hover:text-text-primary'
            }`}
          >
            <List className="w-3.5 h-3.5" />
            <span>List View ({filteredSources.length})</span>
          </button>
        </div>
        </div>
      </div>

      {/* Map or Accessible List Body */}
      {viewMode === 'map' ? (
        <div style={{ height }} className="relative w-full">
          <MapContainer
            center={INDIA_CENTER}
            zoom={5}
            scrollWheelZoom
            style={{ height: '100%', width: '100%' }}
          >
            <MapViewport target={mapTarget} />
            <TileLayer
              attribution='&copy; <a href="https://www.openstreetmap.org/copyright" target="_blank" rel="noopener noreferrer">OpenStreetMap</a> contributors'
              url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
            />
            {validMappedSources.map((source) => (
              <Marker
                key={source._id}
                position={[source.coordinates.latitude, source.coordinates.longitude]}
                icon={createCustomIcon(source.riskLevel || 'UNKNOWN', selectedSourceId === source._id)}
                eventHandlers={{ click: () => setSelectedSourceId(source._id) }}
              >
                <Popup>
                  <div className="min-w-[220px] p-1">
                    <div className="mb-1.5 flex items-center justify-between gap-2">
                      <span className="text-xs font-bold text-text-primary">{source.name}</span>
                      <Badge status={source.riskLevel || 'UNKNOWN'} size="xs" />
                    </div>
                    <p className="mb-1 text-[11px] text-text-secondary"><strong>Type:</strong> {source.type?.replace(/_/g, ' ')}</p>
                    <p className="mb-1 text-[11px] text-text-secondary"><strong>Village:</strong> {source.village || 'Not recorded'}</p>
                    <p className="mb-1 text-[11px] text-text-secondary"><strong>Taluka:</strong> {source.taluka || 'Not recorded'}</p>
                    <p className="mb-1 text-[11px] text-text-secondary"><strong>District:</strong> {source.district || 'Not recorded'}</p>
                    <p className="mb-1 text-[11px] text-text-secondary"><strong>State:</strong> {source.state || 'Not recorded'}</p>
                    <p className="mb-1 text-[11px] text-text-secondary"><strong>Status:</strong> {source.status?.replace(/_/g, ' ') || 'Unknown'}</p>
                    <p className="mb-1 text-[11px] text-text-secondary"><strong>Last water test:</strong> {source.lastTestDate || source.lastTestedAt ? new Date(source.lastTestDate || source.lastTestedAt).toLocaleDateString() : 'Not tested'}</p>
                    <p className="mb-2 text-[11px] text-text-secondary"><strong>Latest result:</strong> {source.lastTestResult || 'Not available'}</p>
                    {source.capacity && <p className="mb-2 text-[11px] text-text-secondary"><strong>Capacity:</strong> {source.capacity}</p>}
                    <p className="mb-2 text-[11px] text-text-secondary"><strong>Last updated:</strong> {source.updatedAt ? new Date(source.updatedAt).toLocaleDateString() : 'Not available'}</p>
                    <div className="flex flex-wrap gap-3 border-t border-surface-border pt-2">
                      <Link to={`/sources/${source._id}`} className="inline-flex items-center gap-1 text-[11px] font-semibold text-brand-700 hover:underline">
                        <Eye className="h-3.5 w-3.5" /> View Details
                      </Link>
                      <Link to={`/submit-report?sourceId=${encodeURIComponent(source._id)}`} className="text-[11px] font-semibold text-brand-700 hover:underline">
                        Report Concern
                      </Link>
                    </div>
                  </div>
                </Popup>
              </Marker>
            ))}
          </MapContainer>
          {validMappedSources.length === 0 && (
            <div className="pointer-events-none absolute left-1/2 top-4 z-[1000] -translate-x-1/2 rounded border border-surface-border bg-white px-3 py-2 text-center text-xs text-text-secondary shadow-sm">
              No geocoded sources match the selected filters.
            </div>
          )}

          {/* Map Legend */}
          <div className="absolute bottom-3 left-3 z-[1000] space-y-1 rounded border border-surface-border bg-white p-2 text-[11px] shadow-sm">
            <div className="mb-1 font-semibold text-text-primary">Water Quality Risk</div>
            {[
              ['SAFE', 'Safe'],
              ['WARNING', 'Warning'],
              ['HIGH_RISK', 'High Risk'],
              ['UNKNOWN', 'Not Tested / Unknown'],
            ].map(([risk, label]) => (
              <div key={risk} className="flex items-center gap-1.5">
                <span className="inline-block h-2.5 w-2.5 rounded-full" style={{ backgroundColor: riskColors[risk] }} />
                <span>{label}</span>
              </div>
            ))}
          </div>
        </div>
      ) : (
        /* Accessible List of Sources */
        <div className="divide-y divide-surface-border max-h-[500px] overflow-y-auto">
          {filteredSources.length === 0 ? (
            <div className="p-6 text-center text-xs text-text-secondary">
              No sources matched your filter.
            </div>
          ) : (
            filteredSources.map((source) => (
              <div key={source._id} className="p-4 flex items-center justify-between gap-4 hover:bg-slate-50">
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <span className="font-semibold text-sm text-text-primary">{source.name}</span>
                    <Badge status={source.riskLevel || 'UNKNOWN'} size="xs" />
                  </div>
                  <div className="text-xs text-text-secondary">
                    {source.village} · {source.type?.replace(/_/g, ' ')} · {source.address || 'No specific address'}
                  </div>
                  {source.coordinates?.latitude && (
                    <div className="text-[11px] text-text-secondary">
                      GPS: {source.coordinates.latitude.toFixed(4)}, {source.coordinates.longitude.toFixed(4)}
                    </div>
                  )}
                </div>
                <Link
                  to={`/sources/${source._id}`}
                  className="px-3 py-1.5 border border-surface-border rounded text-xs font-semibold text-brand-700 hover:bg-teal-50 transition-colors shrink-0"
                >
                  View Details
                </Link>
                <Link
                  to={`/submit-report?sourceId=${encodeURIComponent(source._id)}`}
                  className="px-3 py-1.5 border border-brand-200 rounded text-xs font-semibold text-brand-800 hover:bg-teal-50 transition-colors shrink-0"
                >
                  Report Concern
                </Link>
              </div>
            ))
          )}
        </div>
      )}
    </div>
  );
};

export default WaterSourceMap;
