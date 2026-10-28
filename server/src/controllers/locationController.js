const { searchLocations, reverseGeocode, friendlyLocationError } = require('../services/geocodingService');
const { INDIA_STATES } = require('../utils/indiaStates');

const search = async (req, res) => {
  try {
    const q = String(req.query.q || req.query.query || '').trim();
    if (q.length < 2) {
      return res.json({ success: true, data: [] });
    }

    const localStates = INDIA_STATES.filter((state) =>
      state.name.toLowerCase().includes(q.toLowerCase())
    ).map((state) => ({
      displayName: `${state.name}, India`,
      latitude: state.lat,
      longitude: state.lng,
      type: 'state',
      village: '',
      taluka: '',
      district: '',
      state: state.name,
      address: state.name,
      zoom: state.zoom,
      source: 'states',
    }));

    let remote = [];
    try {
      remote = await searchLocations(q);
    } catch (err) {
      if (!localStates.length) {
        return res.status(503).json({
          success: false,
          message: friendlyLocationError,
        });
      }
    }

    const merged = [...localStates, ...remote].slice(0, 10);
    res.json({ success: true, data: merged });
  } catch (err) {
    res.status(503).json({
      success: false,
      message: friendlyLocationError,
    });
  }
};

const reverse = async (req, res) => {
  try {
    const { lat, lon, latitude, longitude } = req.query;
    const result = await reverseGeocode(lat || latitude, lon || longitude);
    res.json({ success: true, data: result });
  } catch (err) {
    res.status(err.statusCode || 503).json({
      success: false,
      message: err.statusCode === 400 ? err.message : friendlyLocationError,
    });
  }
};

const states = (req, res) => {
  res.json({ success: true, data: INDIA_STATES });
};

module.exports = { search, reverse, states };
