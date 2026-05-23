import React, { useState } from 'react';
import axios from 'axios';

const API_BASE = 'https://weather-app-iuet.onrender.com';

export default function App() {
  const [location, setLocation] = useState('');
  const [weather, setWeather] = useState(null);
  const [forecast, setForecast] = useState(null);
  const [hourly, setHourly] = useState(null);
  const [searches, setSearches] = useState([]);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [loading, setLoading] = useState(false);
  const [activeTab, setActiveTab] = useState('weather');
  const [editingSearch, setEditingSearch] = useState(null);
  const [editLocation, setEditLocation] = useState('');
  const [videos, setVideos] = useState([]);
  const [recommendation, setRecommendation] = useState('');
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');

  const getWeatherEmoji = (description) => {
    const desc = description?.toLowerCase() || '';
    if (desc.includes('clear') || desc.includes('sunny')) return '☀️';
    if (desc.includes('few clouds')) return '🌤️';
    if (desc.includes('scattered clouds')) return '⛅';
    if (desc.includes('broken clouds') || desc.includes('overcast')) return '☁️';
    if (desc.includes('shower') || desc.includes('drizzle')) return '🌦️';
    if (desc.includes('rain')) return '🌧️';
    if (desc.includes('thunderstorm')) return '⛈️';
    if (desc.includes('snow')) return '❄️';
    if (desc.includes('mist') || desc.includes('fog') || desc.includes('haze')) return '🌫️';
    return '🌡️';
  };

  const fetchYouTubeVideos = async (locationName) => {
    try {
      const res = await axios.get(`${API_BASE}/weather/youtube`, {
        params: { location: locationName }
      });
      setVideos(res.data.videos);
    } catch (err) {
      console.log('Could not fetch videos');
    }
  };

  const fetchRecommendation = async (locationName) => {
    try {
      const res = await axios.get(`${API_BASE}/weather/recommend`, {
        params: { location: locationName }
      });
      setRecommendation(res.data.recommendation);
    } catch (err) {
      console.log('Could not fetch recommendation. Please Try Again!');
    }
  };

  const showSuccess = (message) => {
    setSuccess(message);
    setTimeout(() => setSuccess(''), 3000);
  };

  const showError = (message) => {
    setError(message);
    setTimeout(() => setError(''), 3000);
  };

  const searchWeather = async () => {
    if (!location.trim()) {
      showError('Please enter a location');
      return;
    }
    // Clear stale data immediately
    setWeather(null);
    setForecast(null);
    setHourly(null);
    setRecommendation('');
    setVideos([]);
    setActiveTab('weather');
    setLoading(true);
    setError('');
    try {
      const weatherRes = await axios.get(`${API_BASE}/weather/current`, {
        params: { location }
      });
      const forecastRes = await axios.get(`${API_BASE}/weather/forecast`, {
        params: { location }
      });
      setWeather(weatherRes.data);
      setForecast(forecastRes.data.daily);
      setHourly(forecastRes.data.hourly);
      fetchYouTubeVideos(weatherRes.data.location);
      fetchRecommendation(weatherRes.data.location);
    } catch (err) {
      showError('City not found. Please check the spelling and try again.');
    }
    setLoading(false);
  };

  const getCurrentLocation = () => {
    if (!navigator.geolocation) {
      showError('Geolocation is not supported by your browser!');
      return;
    }
    // Clear stale data immediately
    setWeather(null);
    setForecast(null);
    setHourly(null);
    setRecommendation('');
    setVideos([]);
    setActiveTab('weather');
    setLoading(true);
    navigator.geolocation.getCurrentPosition(async (position) => {
      const { latitude, longitude } = position.coords;
      try {
        const res = await axios.get(`${API_BASE}/weather/coords`, {
          params: { lat: latitude, lon: longitude }
        });
        setWeather(res.data.current);
        setForecast(res.data.daily);
        setHourly(res.data.hourly);
        setLocation(res.data.current.location);
        fetchYouTubeVideos(res.data.current.location);
        fetchRecommendation(res.data.current.location);
      } catch (err) {
        showError('Could not get weather for your location. Please Try Again!');
      }
      setLoading(false);
    });
  };

  const saveSearch = async () => {
    if (!weather) return;

    if (!dateFrom || !dateTo) {
      showError('Please select both Date From and Date To');
      return;
    }

    if (dateFrom > dateTo) {
      showError('Date From must be before Date To');
      return;
    }

    try {
      await axios.post(`${API_BASE}/searches`, {
        location: weather.location,
        date_from: dateFrom,
        date_to: dateTo
      });
      fetchSearches();
      showSuccess('✅ Search saved successfully!');
      setDateFrom('');
      setDateTo('');
    } catch (err) {
      showError('Could not save search');
    }
  };

  const fetchSearches = async () => {
    try {
      const res = await axios.get(`${API_BASE}/searches`);
      setSearches(res.data);
    } catch (err) {
      showError('Could not fetch searches. Please Try Again!');
    }
  };

  const deleteSearch = async (id) => {
    try {
      await axios.delete(`${API_BASE}/searches/${id}`);
      fetchSearches();
      showSuccess('🗑️ Search deleted successfully!');
    } catch (err) {
      showError('Could not delete search. Please Try Again!');
    }
  };

  const startEdit = (search) => {
    setEditingSearch(search);
    setEditLocation(search.location);
  };

  const updateSearch = async () => {
    if (!editingSearch) return;
    try {
      await axios.put(`${API_BASE}/searches/${editingSearch.id}`, {
        location: editLocation
      });
      setEditingSearch(null);
      setEditLocation('');
      fetchSearches();
      showSuccess('✏️ Search updated successfully!');
    } catch (err) {
      showError('Could not update search. Please Try Again!');
    }
  };

  const exportData = async (format) => {
    try {
      const res = await axios.get(`${API_BASE}/searches/export/${format}`);
      const blob = new Blob(
        [format === 'json' ? JSON.stringify(res.data, null, 2) : res.data.csv],
        { type: format === 'json' ? 'application/json' : 'text/csv' }
      );
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `weather-searches.${format}`;
      a.click();
      showSuccess(`📥 Data exported as ${format.toUpperCase()} successfully!`);
    } catch (err) {
      showError('Could not export data. Please Try Again!');
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-900 to-blue-600 p-4">
      <div className="max-w-4xl mx-auto">

        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-white mb-2">
            🌤️ WeatherApp
          </h1>
          <p className="text-blue-100 text-lg font-light mb-1">
            Real-time weather with AI-powered recommendations
          </p>
          <p className="text-blue-200 text-sm">
            Built by Zarin Tasnim | PM Accelerator
          </p>
          <p className="text-blue-300 text-xs mt-1">
            PM Accelerator is a US-based AI learning and development hub featuring
            award-winning AI products and mentors from Google, Meta, Apple, and Nvidia.
          </p>
        </div>

        {/* Search Bar */}
        <div className="bg-white rounded-2xl p-4 mb-6 shadow-lg">
          <div className="flex flex-col md:flex-row gap-2">
            <input
              type="text"
              value={location}
              onChange={(e) => setLocation(e.target.value)}
              onKeyPress={(e) => e.key === 'Enter' && searchWeather()}
              placeholder="Enter city, zip code, or landmark..."
              className="flex-1 border border-gray-300 rounded-lg px-4 py-2 focus:outline-none focus:border-blue-500"
            />
            <button
              onClick={searchWeather}
              className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 transition"
            >
              Search
            </button>
            <button
              onClick={getCurrentLocation}
              className="bg-green-600 text-white px-6 py-2 rounded-lg hover:bg-green-700 transition"
            >
              📍 My Location
            </button>
          </div>
        </div>

        {/* Error Message */}
        {error && (
          <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded-lg mb-4">
            ❌ {error}
          </div>
        )}

        {/* Success Message */}
        {success && (
          <div className="bg-green-100 border border-green-400 text-green-700 px-4 py-3 rounded-lg mb-4">
            {success}
          </div>
        )}

        {/* Loading */}
        {loading && (
          <div className="text-center text-white text-xl mb-4">
            ⏳ Loading...
          </div>
        )}

        {/* Tabs — show even without weather so Searches tab is always accessible */}
        <div className="flex gap-2 mb-4">
          {['weather', 'searches', 'map', 'videos'].map(tab => (
            <button
              key={tab}
              onClick={() => {
                setActiveTab(tab);
                if (tab === 'searches') fetchSearches();
              }}
              className={`px-4 py-2 rounded-lg capitalize font-medium transition ${
                activeTab === tab
                  ? 'bg-white text-blue-600'
                  : 'bg-blue-700 text-white hover:bg-blue-800'
              }`}
            >
              {tab}
            </button>
          ))}
        </div>

        {/* Weather Tab */}
        {activeTab === 'weather' && weather && (
          <div className="space-y-4">
            {/* Current Weather Card */}
            <div className="bg-white rounded-2xl p-6 shadow-lg">
              <div className="flex justify-between items-start">
                <div>
                  <h2 className="text-3xl font-bold text-gray-800">
                    {weather.location}, {weather.country}
                  </h2>
                  <p className="text-gray-500 capitalize">{weather.description}</p>
                  <p className="text-6xl font-bold text-blue-600 mt-2">
                    {Math.round(weather.temperature)}°C
                  </p>
                </div>
                <span className="text-7xl">
                  {getWeatherEmoji(weather.description)}
                </span>
              </div>

              {/* Stats */}
              <div className="grid grid-cols-3 gap-4 mt-4 pt-4 border-t border-gray-100">
                <div className="text-center">
                  <p className="text-gray-500 text-sm">Feels Like</p>
                  <p className="font-bold text-gray-800">{Math.round(weather.feels_like)}°C</p>
                </div>
                <div className="text-center">
                  <p className="text-gray-500 text-sm">Humidity</p>
                  <p className="font-bold text-gray-800">{weather.humidity}%</p>
                </div>
                <div className="text-center">
                  <p className="text-gray-500 text-sm">Wind</p>
                  <p className="font-bold text-gray-800">{weather.wind_speed} m/s</p>
                </div>
              </div>

              {/* Date Range + Save */}
              <div className="mt-4 border-t border-gray-100 pt-4">
                <p className="text-sm font-medium text-gray-600 mb-2">
                  💾 Save this search with a date range:
                </p>
                <div className="flex flex-col md:flex-row gap-2 mb-2">
                  <div className="flex-1">
                    <label className="text-xs text-gray-500">Date From</label>
                    <input
                      type="date"
                      value={dateFrom}
                      onChange={(e) => setDateFrom(e.target.value)}
                      className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-blue-500"
                    />
                  </div>
                  <div className="flex-1">
                    <label className="text-xs text-gray-500">Date To</label>
                    <input
                      type="date"
                      value={dateTo}
                      onChange={(e) => setDateTo(e.target.value)}
                      className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-blue-500"
                    />
                  </div>
                </div>
                <button
                  onClick={saveSearch}
                  className="w-full bg-blue-600 text-white py-2 rounded-lg hover:bg-blue-700 transition"
                >
                  💾 Save This Search
                </button>
              </div>
            </div>

            {/* AI Recommendation */}
            {recommendation && (
              <div className="bg-gradient-to-r from-purple-500 to-blue-500 rounded-2xl p-6 shadow-lg text-white">
                <h3 className="text-xl font-bold mb-2">🤖 AI Recommendation</h3>
                <p className="text-white text-sm leading-relaxed">{recommendation}</p>
              </div>
            )}

            {/* Hourly Forecast */}
            {hourly && (
              <div className="bg-white rounded-2xl p-6 shadow-lg">
                <h3 className="text-xl font-bold text-gray-800 mb-4">Next 24 Hours</h3>
                <div className="flex overflow-x-auto gap-4 pb-2">
                  {hourly.map((item, index) => (
                    <div key={index} className="flex-shrink-0 text-center bg-blue-50 rounded-xl p-3 min-w-[80px]">
                      <p className="text-xs text-gray-500">
                        {item.time.split(' ')[1].slice(0, 5)}
                      </p>
                      <span className="text-3xl">
                        {getWeatherEmoji(item.description)}
                      </span>
                      <p className="font-bold text-gray-800">
                        {Math.round(item.temperature)}°C
                      </p>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* 5-Day Forecast */}
            {forecast && (
              <div className="bg-white rounded-2xl p-6 shadow-lg">
                <h3 className="text-xl font-bold text-gray-800 mb-4">5-Day Forecast</h3>
                <div className="grid grid-cols-5 gap-2">
                  {forecast.map((day, index) => (
                    <div key={index} className="text-center bg-blue-50 rounded-xl p-3">
                      <p className="text-xs text-gray-500">
                        {new Date(day.date).toLocaleDateString('en', { weekday: 'short' })}
                      </p>
                      <span className="text-3xl">
                        {getWeatherEmoji(day.description)}
                      </span>
                      <p className="font-bold text-gray-800">
                        {Math.round(day.temperature)}°C
                      </p>
                      <p className="text-xs text-gray-500 capitalize">
                        {day.description}
                      </p>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        {/* Weather Tab — no result yet */}
        {activeTab === 'weather' && !weather && !loading && (
          <div className="text-center text-blue-100 py-16 text-lg">
            🔍 Search for a city to see the weather
          </div>
        )}

        {/* Searches Tab */}
        {activeTab === 'searches' && (
          <div className="bg-white rounded-2xl p-6 shadow-lg">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-xl font-bold text-gray-800">Saved Searches</h3>
              <div className="flex gap-2">
                <button
                  onClick={() => exportData('json')}
                  className="bg-green-600 text-white px-3 py-1 rounded-lg text-sm hover:bg-green-700"
                >
                  Export JSON
                </button>
                <button
                  onClick={() => exportData('csv')}
                  className="bg-yellow-600 text-white px-3 py-1 rounded-lg text-sm hover:bg-yellow-700"
                >
                  Export CSV
                </button>
                <button
                  onClick={fetchSearches}
                  className="bg-blue-600 text-white px-3 py-1 rounded-lg text-sm hover:bg-blue-700"
                >
                  Refresh
                </button>
              </div>
            </div>

            {searches.length === 0 ? (
              <p className="text-gray-500 text-center py-8">
                No saved searches yet. Search for a city and save it with a date range.
              </p>
            ) : (
              <div className="space-y-3">
                {searches.map(search => (
                  <div key={search.id} className="border border-gray-100 rounded-xl p-4 bg-blue-50">
                    <div className="flex justify-between items-start">
                      <div>
                        <p className="font-bold text-gray-800 text-lg">
                          {search.location}{search.country ? `, ${search.country}` : ''}
                        </p>
                        <p className="text-blue-600 font-bold text-2xl">
                          {search.temperature ? `${Math.round(search.temperature)}°C` : '—'}
                        </p>
                        <div className="flex gap-4 mt-1 text-sm text-gray-500">
                          {search.feels_like && <span>Feels like {Math.round(search.feels_like)}°C</span>}
                          {search.humidity && <span>💧 {search.humidity}%</span>}
                          {search.wind_speed && <span>💨 {search.wind_speed} m/s</span>}
                        </div>
                        <p className="text-xs text-gray-400 mt-1 capitalize">{search.description}</p>
                        <p className="text-xs text-gray-400 mt-1">
                          📅 {search.date_from} → {search.date_to}
                        </p>
                      </div>
                      <div className="flex gap-1 flex-col">
                        <button
                          onClick={() => startEdit(search)}
                          className="bg-blue-500 text-white px-3 py-1 rounded text-xs hover:bg-blue-600"
                        >
                          ✏️ Edit
                        </button>
                        <button
                          onClick={() => deleteSearch(search.id)}
                          className="bg-red-500 text-white px-3 py-1 rounded text-xs hover:bg-red-600"
                        >
                          🗑️ Delete
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {/* Edit Modal */}
            {editingSearch && (
              <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
                <div className="bg-white rounded-2xl p-6 w-96 shadow-xl">
                  <h3 className="text-xl font-bold text-gray-800 mb-4">
                    ✏️ Edit Search
                  </h3>
                  <p className="text-gray-500 text-sm mb-2">
                    Current location: <strong>{editingSearch.location}</strong>
                  </p>
                  <input
                    type="text"
                    value={editLocation}
                    onChange={(e) => setEditLocation(e.target.value)}
                    placeholder="Enter new location..."
                    className="w-full border border-gray-300 rounded-lg px-4 py-2 mb-4 focus:outline-none focus:border-blue-500"
                  />
                  <div className="flex gap-2">
                    <button
                      onClick={updateSearch}
                      className="flex-1 bg-blue-600 text-white py-2 rounded-lg hover:bg-blue-700"
                    >
                      Update
                    </button>
                    <button
                      onClick={() => setEditingSearch(null)}
                      className="flex-1 bg-gray-300 text-gray-700 py-2 rounded-lg hover:bg-gray-400"
                    >
                      Cancel
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Map Tab */}
        {activeTab === 'map' && weather && (
          <div className="bg-white rounded-2xl p-6 shadow-lg">
            <h3 className="text-xl font-bold text-gray-800 mb-4">
              📍 {weather.location} on the Map
            </h3>
            <iframe
              title="location-map"
              src={`https://maps.google.com/maps?q=${weather.location}&output=embed`}
              width="100%"
              height="400"
              className="rounded-lg border-0"
              allowFullScreen
            />
          </div>
        )}

        {activeTab === 'map' && !weather && (
          <div className="text-center text-blue-100 py-16 text-lg">
            🗺️ Search for a location first to see the map
          </div>
        )}

        {/* Videos Tab */}
        {activeTab === 'videos' && weather && (
          <div className="bg-white rounded-2xl p-6 shadow-lg">
            <h3 className="text-xl font-bold text-gray-800 mb-4">
              📺 Videos about {weather.location}
            </h3>
            {videos.length === 0 ? (
              <p className="text-gray-500 text-center py-8">
                No videos found for this location.
              </p>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {videos.map((video, index) => (
                  <a
                    key={index}
                    href={video.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="block rounded-xl overflow-hidden shadow hover:shadow-lg transition"
                  >
                    <img
                      src={video.thumbnail}
                      alt={video.title}
                      className="w-full"
                    />
                    <div className="p-3 bg-gray-50">
                      <p className="text-sm font-medium text-gray-800 line-clamp-2">
                        {video.title}
                      </p>
                      <p className="text-xs text-blue-600 mt-1">
                        ▶ Watch on YouTube
                      </p>
                    </div>
                  </a>
                ))}
              </div>
            )}
          </div>
        )}

        {activeTab === 'videos' && !weather && (
          <div className="text-center text-blue-100 py-16 text-lg">
            📺 Search for a location first to see videos
          </div>
        )}

      </div>
    </div>
  );
}