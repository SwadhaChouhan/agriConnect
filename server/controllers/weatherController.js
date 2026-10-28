import axios from 'axios';

/**
 * GET /api/weather?location=<city or village name>
 * Fetches real-time weather from OpenWeatherMap API using metric units (°C).
 */
export const getWeather = async (req, res) => {
  try {
    const { location } = req.query;

    if (!location || !location.trim()) {
      return res.status(400).json({
        message: 'weather.location_required',
        detail: 'Please provide a location query parameter (e.g. ?location=Indore)',
      });
    }

    const apiKey = process.env.WEATHER_API_KEY;

    if (!apiKey) {
      console.warn('[Weather] WEATHER_API_KEY is not set in .env');
      return res.status(500).json({
        message: 'weather.api_key_missing',
        detail: 'OpenWeatherMap API key is not configured in .env. Please set WEATHER_API_KEY.',
      });
    }

    const cleanLocation = location.trim();

    // Call OpenWeatherMap Current Weather Data endpoint
    const response = await axios.get(
      'https://api.openweathermap.org/data/2.5/weather',
      {
        params: {
          q: cleanLocation,
          units: 'metric', // returns Celsius temperature and meter/sec wind
          appid: apiKey,
        },
        timeout: 8000,
      }
    );

    const data = response.data;

    return res.status(200).json({
      location: data.name,
      country: data.sys?.country || '',
      temperature: Math.round(data.main?.temp),
      feelsLike: Math.round(data.main?.feels_like),
      description: data.weather?.[0]?.description || 'Clear',
      icon: data.weather?.[0]?.icon || '01d',
      humidity: data.main?.humidity ?? 0,
      windSpeed: data.wind?.speed ?? 0,
    });
  } catch (err) {
    console.error('[Weather Controller Error]', err.response?.data || err.message);

    if (err.response?.status === 404) {
      return res.status(404).json({
        message: 'weather.city_not_found',
        detail: `No weather data found for location "${req.query.location}".`,
      });
    }

    if (err.response?.status === 401) {
      return res.status(500).json({
        message: 'weather.invalid_api_key',
        detail: 'Invalid OpenWeatherMap API key or key is not activated yet (new keys take ~15-30 mins to activate).',
      });
    }

    return res.status(500).json({
      message: 'weather.fetch_error',
      detail: err.message || 'Failed to fetch weather data from external provider.',
    });
  }
};
