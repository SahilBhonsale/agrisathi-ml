import React, { useCallback, useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { FiCloud, FiLogIn, FiLogOut, FiMapPin } from 'react-icons/fi';
import { useAuth } from '../context/AuthContext';
import logo from '../assets/agrisathi-mark.svg';
import '../styles/Navbar.css';

const weatherIcon = (code) => {
  if (code === 0) return '☀️';
  if ([1, 2].includes(code)) return '⛅';
  if ([3, 45, 48].includes(code)) return '☁️';
  if ([95, 96, 99].includes(code)) return '⛈️';
  if ([51, 53, 55, 61, 63, 65, 80, 81, 82].includes(code)) return '🌧️';
  return '🌤️';
};

function Navbar() {
  const navigate = useNavigate();
  const { user, logout } = useAuth();
  const [weather, setWeather] = useState({ temp: '--°', icon: '🌤️', location: 'Ahmedabad' });

  const loadWeather = useCallback(async (lat = 23.0225, lon = 72.5714) => {
    try {
      const [placeResponse, weatherResponse] = await Promise.all([
        fetch(`https://api.bigdatacloud.net/data/reverse-geocode-client?latitude=${lat}&longitude=${lon}&localityLanguage=en`),
        fetch(`https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lon}&current=temperature_2m,weather_code&timezone=auto`)
      ]);
      const place = await placeResponse.json();
      const forecast = await weatherResponse.json();
      setWeather({
        temp: `${Math.round(forecast.current.temperature_2m)}°`,
        icon: weatherIcon(forecast.current.weather_code),
        location: place.city || place.locality || 'Ahmedabad'
      });
    } catch {
      setWeather({ temp: '32°', icon: '🌤️', location: 'Ahmedabad' });
    }
  }, []);

  useEffect(() => {
    if (!navigator.geolocation) return void loadWeather();
    navigator.geolocation.getCurrentPosition(
      ({ coords }) => loadWeather(coords.latitude, coords.longitude),
      () => loadWeather(),
      { timeout: 4000, maximumAge: 300000 }
    );
  }, [loadWeather]);

  const handleLogout = async () => {
    await logout();
    navigate('/login');
  };

  return (
    <header className="navbar">
      <Link to="/" className="brand" aria-label="AgriSathi home">
        <img src={logo} alt="" className="brand-logo" />
        <span className="brand-copy"><strong>AgriSathi</strong><small>Agricultural intelligence</small></span>
      </Link>

      {user && <div className="system-status"><span /><strong>Field OS</strong><small>All systems growing</small></div>}

      <div className="navbar-actions">
        {user && (
          <button className="weather-chip" onClick={() => navigate('/weather')} title="Open weather advisory">
            <span className="weather-symbol">{weather.icon}</span>
            <span><strong>{weather.temp}</strong><small><FiMapPin /> {weather.location}</small></span>
          </button>
        )}

        <div className="user-summary">
          <span className="user-avatar">{user?.name?.charAt(0).toUpperCase() || <FiCloud />}</span>
          <span className="user-copy"><small>{user ? 'Welcome back' : 'Farmer support'}</small><strong>{user?.name || 'AgriSathi'}</strong></span>
        </div>

        {user ? (
          <button className="nav-action" onClick={handleLogout}><FiLogOut /><span>Logout</span></button>
        ) : (
          <button className="nav-action primary" onClick={() => navigate('/login')}><FiLogIn /><span>Login</span></button>
        )}
      </div>
    </header>
  );
}

export default Navbar;
