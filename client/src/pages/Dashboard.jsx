import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import api from '../api/axios';
import { useAuth } from '../context/AuthContext';
import { Spinner } from 'react-bootstrap';
import RecentPestAlerts from '../components/RecentPestAlerts';
import Navbar from '../components/Navbar.jsx';

export default function Dashboard() {
  const { user } = useAuth();
  const { t } = useTranslation();
  
  const [farms, setFarms] = useState([]);
  const [selectedFarm, setSelectedFarm] = useState(null);
  const [weather, setWeather] = useState(null);
  const [weatherLoading, setWeatherLoading] = useState(false);
  const [weatherError, setWeatherError] = useState('');

  // 1. Fetch Farms on load
  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        const farmRes = await api.get('/farms');
        const userFarms = farmRes.data.farms || farmRes.data;
        setFarms(userFarms);
        
        // Automatically select the first farm to show weather
        if (userFarms.length > 0) {
          setSelectedFarm(userFarms[0]);
        }
      } catch (err) {
        console.error("Failed to load dashboard data", err);
      }
    };
    fetchDashboardData();
  }, []);

  // 2. Fetch Weather whenever the selected farm changes
  useEffect(() => {
    if (!selectedFarm) return;

    const fetchWeather = async () => {
      setWeatherLoading(true);
      setWeatherError('');
      
      try {
        const loc = selectedFarm.location?.village || selectedFarm.location?.state || 'Indore';
        const weatherRes = await api.get(`/weather?location=${loc}`);
        setWeather(weatherRes.data);
      } catch (err) {
        setWeatherError('Weather unavailable for this location');
      } finally {
        setWeatherLoading(false);
      }
    };

    fetchWeather();
  }, [selectedFarm]);

  return (
    <div className="bg-light min-vh-100">
      <Navbar />
      <div className="container py-4">
        {/* Welcome Banner */}
        <div className="p-5 mb-4 bg-white rounded-3 shadow-sm border">
          <h1 className="display-5 fw-bold text-success">
            {user?.role === 'admin' ? 'Admin Dashboard' : t('Farmer Dashboard')}
          </h1>
          <p className="fs-4">
            {t('Welcome back')}, {user?.name}! Manage your farms, monitor crop growth, and stay updated with seasonal advisories.
          </p>
          
          <Link to="/farms" className="btn btn-success btn-lg">
            🌱 {t('Manage My Farms')}
          </Link>

          {user?.role === 'admin' && (
            <Link to="/admin-dashboard" className="btn btn-dark btn-lg ms-3">
              🛡️ Admin Control Panel
            </Link>
          )}
        </div>

        {/* Pest Alerts added here */}
        <RecentPestAlerts limit={3} />

        {/* Cards Row */}
        <div className="row g-4">
          {/* Card 1: Farms */}
          <div className="col-md-4">
            <div className="card h-100 shadow-sm border-0">
              <div className="card-body">
                <h5 className="card-title fw-bold">🚜 {t('My Farms')}</h5>
                <p className="card-text text-muted">
                  View your registered agricultural plots, check soil health, and track acreage.
                </p>
                <h3 className="text-success">{farms.length} Registered</h3>
              </div>
            </div>
          </div>

          {/* Card 2: Crops */}
          <div className="col-md-4">
            <div className="card h-100 shadow-sm border-0">
              <div className="card-body">
                <h5 className="card-title fw-bold">🌾 {t('Crops & Harvest')}</h5>
                <p className="card-text text-muted">
                  Track planting cycles, upcoming harvest dates, and historical crop yields.
                </p>
                <Link to="/farms" className="btn btn-outline-success btn-sm mt-2">
                  Explore Crops →
                </Link>
              </div>
            </div>
          </div>

          {/* Card 3: Weather (Now with Dropdown) */}
          <div className="col-md-4">
            <div className="card h-100 shadow-sm border-0">
              <div className="card-body">
                <h5 className="card-title fw-bold">🌦️ {t('Weather Advisory')}</h5>
              
              {farms.length === 0 ? (
                <p className="card-text text-muted">Add a farm to see weather.</p>
              ) : (
                <>
                  {/* Dropdown to select farm */}
                  <select 
                    className="form-select form-select-sm mb-3" 
                    value={selectedFarm?._id || selectedFarm?.id || ''} 
                    onChange={(e) => {
                      const farm = farms.find(f => (f._id || f.id) === e.target.value);
                      setSelectedFarm(farm);
                    }}
                  >
                    {farms.map(f => (
                      <option key={f._id || f.id} value={f._id || f.id}>
                        {f.name} ({f.location?.village})
                      </option>
                    ))}
                  </select>

                  {weatherLoading ? (
                    <div className="text-center mt-3">
                      <Spinner animation="border" size="sm" variant="success" />
                    </div>
                  ) : weatherError ? (
                    <p className="text-danger small">{weatherError}</p>
                  ) : weather ? (
                    <div>
                      <h3 className="text-success">{Math.round(weather.temperature)}°C</h3>
                      <p className="text-capitalize mb-1">{weather.description}</p>
                      <small className="text-muted">Humidity: {weather.humidity}%</small>
                    </div>
                  ) : null}
                </>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
  );
}