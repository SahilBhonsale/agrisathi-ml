import React, { useState, useEffect } from 'react';
import { FiCompass, FiMapPin, FiRefreshCw, FiSearch } from 'react-icons/fi';
import '../styles/Weather.css';

function Weather() {
  const [weatherData, setWeatherData] = useState(null);
  const [forecast, setForecast] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [locationName, setLocationName] = useState('');
  const [manualLocation, setManualLocation] = useState('');
  const [showManualInput, setShowManualInput] = useState(false);

  // List of major Indian cities as fallback
  const indianCities = [
    { name: 'Mumbai, Maharashtra', lat: 19.0760, lon: 72.8777 },
    { name: 'Delhi, India', lat: 28.6139, lon: 77.2090 },
    { name: 'Bangalore, Karnataka', lat: 12.9716, lon: 77.5946 },
    { name: 'Hyderabad, Telangana', lat: 17.3850, lon: 78.4867 },
    { name: 'Ahmedabad, Gujarat', lat: 23.0225, lon: 72.5714 },
    { name: 'Chennai, Tamil Nadu', lat: 13.0827, lon: 80.2707 },
    { name: 'Kolkata, West Bengal', lat: 22.5726, lon: 88.3639 },
    { name: 'Pune, Maharashtra', lat: 18.5204, lon: 73.8567 },
    { name: 'Jaipur, Rajasthan', lat: 26.9124, lon: 75.7873 },
    { name: 'Lucknow, Uttar Pradesh', lat: 26.8467, lon: 80.9462 },
    { name: 'Nadiad, Gujarat', lat: 22.6916, lon: 72.8634 },
    { name: 'Vadodara, Gujarat', lat: 22.3072, lon: 73.1812 },
    { name: 'CHARUSAT, Changa, Gujarat', lat: 22.5995, lon: 72.8204 }

  ];

  // Location discovery runs once when the weather workspace opens.
  useEffect(() => {
    getCurrentLocation();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const getCurrentLocation = () => {
    setLoading(true);
    setError(null);

    // First try to get user's location
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        async (position) => {
          const { latitude, longitude } = position.coords;
          console.log('✅ Location found:', latitude, longitude);
          
          await getLocationName(latitude, longitude);
          await fetchWeatherData(latitude, longitude);
        },
        async (error) => {
          console.error('❌ Geolocation error:', error);
          
          // Fallback to IP-based location
          console.log('🔄 Trying IP-based location...');
          await getLocationFromIP();
        },
        {
          enableHighAccuracy: false, // Changed to false for faster response
          timeout: 3500,
          maximumAge: 600000 // 10 minutes cache
        }
      );
    } else {
      console.log('🔄 Geolocation not supported, trying IP-based location...');
      getLocationFromIP();
    }
  };

  const getLocationFromIP = async () => {
    const defaultCity = indianCities.find(city => city.name.startsWith('Ahmedabad')) || indianCities[0];
    setLocationName(`${defaultCity.name} · Demo location`);
    await fetchWeatherData(defaultCity.lat, defaultCity.lon);
  };

  const getLocationName = async (lat, lon) => {
    try {
      // Try multiple reverse geocoding services
      const geocodingServices = [
        `https://api.bigdatacloud.net/data/reverse-geocode-client?latitude=${lat}&longitude=${lon}&localityLanguage=en`,
        `https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lon}&zoom=10&addressdetails=1`
      ];

      for (const serviceUrl of geocodingServices) {
        try {
          const response = await fetch(serviceUrl);
          if (response.ok) {
            const data = await response.json();
            
            let name;
            if (serviceUrl.includes('bigdatacloud')) {
              name = `${data.city || data.locality || 'Unknown'}, ${data.principalSubdivision || ''} ${data.countryName || ''}`.trim();
            } else {
              // OpenStreetMap Nominatim
              const addr = data.address || {};
              name = `${addr.city || addr.town || addr.village || 'Unknown'}, ${addr.state || ''} ${addr.country || ''}`.trim();
            }
            
            setLocationName(name);
            return;
          }
        } catch {
          console.log(`Geocoding service failed: ${serviceUrl}`);
        }
      }
      
      // If all services fail, use coordinates
      setLocationName(`${lat.toFixed(2)}, ${lon.toFixed(2)}`);
      
    } catch (error) {
      console.error('Error getting location name:', error);
      setLocationName(`${lat.toFixed(2)}, ${lon.toFixed(2)}`);
    }
  };

  const handleManualLocationSubmit = async () => {
    if (!manualLocation.trim()) return;
    
    setLoading(true);
    try {
      // Use Nominatim to geocode the location name
      const response = await fetch(
        `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(manualLocation)}&countrycodes=in&limit=1`
      );
      
      if (response.ok) {
        const data = await response.json();
        if (data.length > 0) {
          const result = data[0];
          const lat = parseFloat(result.lat);
          const lon = parseFloat(result.lon);
          
          setLocationName(result.display_name + ' (Manual)');
          setShowManualInput(false);
          await fetchWeatherData(lat, lon);
        } else {
          setError('Location not found. Please try a different location.');
          setLoading(false);
        }
      } else {
        throw new Error('Geocoding service failed');
      }
    } catch (error) {
      console.error('Manual location error:', error);
      setError('Failed to find location. Please try again.');
      setLoading(false);
    }
  };

  const selectCityFromList = async (city) => {
    setLocationName(city.name + ' (Selected)');
    setShowManualInput(false);
    await fetchWeatherData(city.lat, city.lon);
  };

  const fetchWeatherData = async (lat, lon) => {
    try {
      // Using Open-Meteo API (completely free, no API key required)
      const currentWeatherUrl = `https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lon}&current=temperature_2m,relative_humidity_2m,apparent_temperature,precipitation,weather_code,surface_pressure,wind_speed_10m,wind_direction_10m&hourly=temperature_2m,precipitation_probability,weather_code&daily=weather_code,temperature_2m_max,temperature_2m_min,precipitation_sum,precipitation_probability_max&timezone=auto&forecast_days=7`;

      const response = await fetch(currentWeatherUrl);
      
      if (!response.ok) {
        throw new Error('Failed to fetch weather data');
      }

      const data = await response.json();
      console.log('✅ Weather data received:', data);

      setWeatherData({
        current: data.current,
        hourly: data.hourly,
        daily: data.daily,
        timezone: data.timezone
      });

      // Process forecast data (next 5 days)
      const dailyForecast = data.daily.time.slice(1, 6).map((date, index) => ({
        date: date,
        weatherCode: data.daily.weather_code[index + 1],
        tempMax: data.daily.temperature_2m_max[index + 1],
        tempMin: data.daily.temperature_2m_min[index + 1],
        precipitation: data.daily.precipitation_sum[index + 1],
        precipitationProb: data.daily.precipitation_probability_max[index + 1]
      }));

      setForecast(dailyForecast);
      setError(null);

    } catch (error) {
      console.error('❌ Weather fetch error:', error);
      setError('Failed to fetch weather data: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  const getWeatherIcon = (weatherCode) => {
    // WMO Weather interpretation codes to emojis
    const weatherIcons = {
      0: '☀️', // Clear sky
      1: '🌤️', // Mainly clear
      2: '⛅', // Partly cloudy
      3: '☁️', // Overcast
      45: '🌫️', // Fog
      48: '🌫️', // Depositing rime fog
      51: '🌦️', // Light drizzle
      53: '🌦️', // Moderate drizzle
      55: '🌦️', // Dense drizzle
      56: '🌦️', // Light freezing drizzle
      57: '🌦️', // Dense freezing drizzle
      61: '🌧️', // Slight rain
      63: '🌧️', // Moderate rain
      65: '🌧️', // Heavy rain
      66: '🌧️', // Light freezing rain
      67: '🌧️', // Heavy freezing rain
      71: '🌨️', // Slight snow fall
      73: '🌨️', // Moderate snow fall
      75: '🌨️', // Heavy snow fall
      77: '🌨️', // Snow grains
      80: '🌦️', // Slight rain showers
      81: '🌧️', // Moderate rain showers
      82: '🌧️', // Violent rain showers
      85: '🌨️', // Slight snow showers
      86: '🌨️', // Heavy snow showers
      95: '⛈️', // Thunderstorm
      96: '⛈️', // Thunderstorm with slight hail
      99: '⛈️', // Thunderstorm with heavy hail
    };
    
    return weatherIcons[weatherCode] || '🌤️';
  };

  const getWeatherDescription = (weatherCode) => {
    const descriptions = {
      0: 'Clear sky',
      1: 'Mainly clear',
      2: 'Partly cloudy',
      3: 'Overcast',
      45: 'Fog',
      48: 'Depositing rime fog',
      51: 'Light drizzle',
      53: 'Moderate drizzle',
      55: 'Dense drizzle',
      61: 'Slight rain',
      63: 'Moderate rain',
      65: 'Heavy rain',
      71: 'Slight snow',
      73: 'Moderate snow',
      75: 'Heavy snow',
      80: 'Rain showers',
      81: 'Moderate rain showers',
      82: 'Heavy rain showers',
      95: 'Thunderstorm',
      96: 'Thunderstorm with hail',
      99: 'Severe thunderstorm'
    };
    
    return descriptions[weatherCode] || 'Unknown';
  };

  const getAgriculturalAdvice = (current) => {
    if (!current) return ["🌱 Loading agricultural recommendations..."];
    
    const temp = current.temperature_2m;
    const humidity = current.relative_humidity_2m;
    const windSpeed = current.wind_speed_10m;
    const precipitation = current.precipitation;
    const weatherCode = current.weather_code;
    
    let advice = [];
    
    if (temp > 35) {
      advice.push("🌡️ High temperature alert: Increase irrigation frequency and provide shade for sensitive crops");
    }
    
    if (temp < 5) {
      advice.push("❄️ Frost warning: Protect crops with covers or move potted plants indoors");
    }
    
    if (humidity > 85) {
      advice.push("💧 High humidity: Monitor for fungal diseases, ensure proper ventilation");
    }
    
    if (humidity < 30) {
      advice.push("🏜️ Low humidity: Increase watering frequency, consider mulching");
    }
    
    if (windSpeed > 15) {
      advice.push("💨 Strong winds: Secure tall plants, check for wind damage");
    }
    
    if (precipitation > 10) {
      advice.push("🌧️ Heavy rain expected: Ensure proper drainage, delay outdoor farming activities");
    }
    
    if (weatherCode >= 95) {
      advice.push("⛈️ Thunderstorm warning: Avoid outdoor activities, secure equipment");
    }
    
    if (temp >= 20 && temp <= 30 && humidity >= 40 && humidity <= 70) {
      advice.push("✅ Ideal conditions for most farming activities");
    }
    
    return advice.length > 0 ? advice : ["🌱 Moderate conditions for farming activities"];
  };

  if (loading) {
    return (
      <div className="weather-container page-shell">
        <div className="loading">
          <div className="spinner" />
          <h3>Preparing your field forecast</h3>
          <p>Detecting location and checking local growing conditions…</p>
        </div>
      </div>
    );
  }

  if (error && !weatherData) {
    return (
      <div className="weather-container page-shell">
        <div className="error">
          <h3>❌ Weather Service Error</h3>
          <p>{error}</p>
          <div className="error-actions">
            <button onClick={getCurrentLocation} className="retry-btn">
              🔄 Try Again
            </button>
            <button onClick={() => setShowManualInput(true)} className="manual-btn">
              📍 Choose Location
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="weather-container page-shell">
      <div className="weather-header">
        <div><span className="eyebrow">Field conditions</span><h1>Weather & farm advisory</h1><p>Plan irrigation, protection and field work around local conditions.</p></div>
        <div className="location-info">
          <span className="location-icon"><FiMapPin /></span>
          <span className="location-name">{locationName}</span>
          <div className="location-controls">
            <button onClick={getCurrentLocation} className="refresh-btn" title="Refresh location">
              <FiRefreshCw />
            </button>
            <button onClick={() => setShowManualInput(true)} className="change-location-btn" title="Change location">
              <FiCompass /> Change
            </button>
          </div>
        </div>
      </div>

      {/* Manual Location Input */}
      {showManualInput && (
        <div className="manual-location">
          <h4>Choose your location</h4>
          
          <div className="manual-input-section">
            <input
              type="text"
              value={manualLocation}
              onChange={(e) => setManualLocation(e.target.value)}
              placeholder="Enter city name (e.g., Mumbai, Delhi, Bangalore)"
              className="location-input"
              onKeyPress={(e) => e.key === 'Enter' && handleManualLocationSubmit()}
            />
            <button onClick={handleManualLocationSubmit} className="search-btn">
              <FiSearch /> Search
            </button>
          </div>

          <div className="city-options">
            <h5>Or select a nearby city</h5>
            <div className="city-grid">
              {indianCities.map((city, index) => (
                <button
                  key={index}
                  onClick={() => selectCityFromList(city)}
                  className="city-option"
                >
                  {city.name}
                </button>
              ))}
            </div>
          </div>

          <button onClick={() => setShowManualInput(false)} className="close-manual">
            Close
          </button>
        </div>
      )}

      {weatherData && (
        <>
          {/* Current Weather */}
          <div className="current-weather">
            <div className="weather-main">
              <div className="weather-info">
                <div className="current-temp">
                  <span className="temperature">
                    {Math.round(weatherData.current.temperature_2m)}°C
                  </span>
                  <span className="weather-icon">
                    {getWeatherIcon(weatherData.current.weather_code)}
                  </span>
                </div>
                <p className="weather-desc">
                  {getWeatherDescription(weatherData.current.weather_code)}
                </p>
                <p className="feels-like">
                  Feels like {Math.round(weatherData.current.apparent_temperature)}°C
                </p>
              </div>
              
              <div className="weather-details">
                <div className="detail-item">
                  <span>💧 Humidity</span>
                  <span>{weatherData.current.relative_humidity_2m}%</span>
                </div>
                <div className="detail-item">
                  <span>💨 Wind Speed</span>
                  <span>{weatherData.current.wind_speed_10m} km/h</span>
                </div>
                <div className="detail-item">
                  <span>🌧️ Precipitation</span>
                  <span>{weatherData.current.precipitation} mm</span>
                </div>
                <div className="detail-item">
                  <span>🧭 Pressure</span>
                  <span>{weatherData.current.surface_pressure} hPa</span>
                </div>
              </div>
            </div>
          </div>

          {/* Agricultural Advice */}
          <div className="agricultural-advice">
            <span className="eyebrow">Today’s action plan</span><h4>Agricultural recommendations</h4>
            <ul>
              {getAgriculturalAdvice(weatherData.current).map((advice, index) => (
                <li key={index}>{advice}</li>
              ))}
            </ul>
          </div>

          {/* 5-Day Forecast */}
          <div className="forecast">
            <span className="eyebrow">Looking ahead</span><h4>5-day forecast</h4>
            <div className="forecast-grid">
              {forecast.map((item, index) => (
                <div key={index} className="forecast-item">
                  <div className="forecast-date">
                    {new Date(item.date).toLocaleDateString('en-US', {
                      weekday: 'short',
                      month: 'short',
                      day: 'numeric'
                    })}
                  </div>
                  <div className="forecast-icon">
                    {getWeatherIcon(item.weatherCode)}
                  </div>
                  <div className="forecast-temps">
                    <span className="temp-max">{Math.round(item.tempMax)}°</span>
                    <span className="temp-min">{Math.round(item.tempMin)}°</span>
                  </div>
                  <div className="forecast-desc">
                    {getWeatherDescription(item.weatherCode)}
                  </div>
                  <div className="forecast-rain">
                    💧 {item.precipitationProb || 0}%
                  </div>
                </div>
              ))}
            </div>
          </div>
        </>
      )}
    </div>
  );
}

export default Weather;
