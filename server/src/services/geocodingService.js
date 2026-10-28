const NOMINATIM_URL = process.env.GEOCODING_API_URL || 'https://nominatim.openstreetmap.org';
const USER_AGENT = process.env.GEOCODING_USER_AGENT || 'SafeDrop/1.0 (rural-water-safety; contact@safedrop.org)';

const friendlyLocationError = 'We could not load location suggestions right now. You can enter the location manually.';

const parseAddress = (address = {}) => ({
  village: address.village || address.town || address.city || address.hamlet || address.suburb || '',
  taluka: address.county || address.municipality || address.taluka || '',
  district: address.state_district || address.county || address.district || '',
  state: address.state || '',
  address: [
    address.road,
    address.neighbourhood,
    address.suburb,
    address.village || address.town || address.city,
  ]
    .filter(Boolean)
    .join(', '),
});

const searchLocations = async (query) => {
  if (!query || String(query).trim().length < 2) {
    return [];
  }

  const url = new URL(`${NOMINATIM_URL.replace(/\/$/, '')}/search`);
  url.searchParams.set('q', String(query).trim());
  url.searchParams.set('format', 'json');
  url.searchParams.set('addressdetails', '1');
  url.searchParams.set('limit', '8');
  url.searchParams.set('countrycodes', 'in');

  const res = await fetch(url, {
    headers: {
      'User-Agent': USER_AGENT,
      Accept: 'application/json',
    },
  });

  if (!res.ok) {
    const error = new Error(friendlyLocationError);
    error.statusCode = 503;
    throw error;
  }

  const data = await res.json();
  return (data || []).map((item) => {
    const parsed = parseAddress(item.address || {});
    return {
      displayName: item.display_name,
      latitude: Number(item.lat),
      longitude: Number(item.lon),
      type: item.type,
      class: item.class,
      ...parsed,
    };
  });
};

const reverseGeocode = async (latitude, longitude) => {
  const lat = Number(latitude);
  const lng = Number(longitude);
  if (Number.isNaN(lat) || Number.isNaN(lng)) {
    const error = new Error('Valid latitude and longitude are required.');
    error.statusCode = 400;
    throw error;
  }

  const url = new URL(`${NOMINATIM_URL.replace(/\/$/, '')}/reverse`);
  url.searchParams.set('lat', String(lat));
  url.searchParams.set('lon', String(lng));
  url.searchParams.set('format', 'json');
  url.searchParams.set('addressdetails', '1');
  url.searchParams.set('zoom', '14');

  const res = await fetch(url, {
    headers: {
      'User-Agent': USER_AGENT,
      Accept: 'application/json',
    },
  });

  if (!res.ok) {
    const error = new Error(friendlyLocationError);
    error.statusCode = 503;
    throw error;
  }

  const item = await res.json();
  const parsed = parseAddress(item.address || {});
  return {
    displayName: item.display_name || '',
    latitude: lat,
    longitude: lng,
    ...parsed,
  };
};

module.exports = { searchLocations, reverseGeocode, friendlyLocationError };
