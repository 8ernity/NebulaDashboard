import React, { useState, useEffect } from 'react';
import Universe from './components/Universe';
import { RecentDock } from './components/RecentDock';
import { SearchBar } from './components/SearchBar';
import { WidgetWrapper } from './components/WidgetWrapper';
import { SettingsPanel } from './components/SettingsPanel';
import { HelpModal } from './components/HelpModal';
import { X, ExternalLink, Clock, Globe, Settings, Search, HelpCircle } from 'lucide-react';
import './index.css';

function App() {
  const [selectedStar, setSelectedStar] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [webQuery, setWebQuery] = useState('');
  const [historyData, setHistoryData] = useState([]);
  const [showSettings, setShowSettings] = useState(false);
  const [showHelp, setShowHelp] = useState(false);
  const [currentTime, setCurrentTime] = useState(new Date());
  const [weatherData, setWeatherData] = useState(null);
  const [isIdle, setIsIdle] = useState(false);

  const [settings, setSettings] = useState(() => {
    const defaults = {
      widgets: {
        clock: true,
        searchbar: true,
        date: true,
        weather: true
      },
      controls: {
        blurAmount: 20,
        idleHide: true,
        idleTime: 5,
        textBrightness: 100,
        is12Hour: false
      }
    };
    const saved = localStorage.getItem('nebula_settings');
    if (!saved) return defaults;
    
    const parsed = JSON.parse(saved);
    return {
      widgets: { ...defaults.widgets, ...parsed.widgets },
      controls: { ...defaults.controls, ...parsed.controls }
    };
  });

  const getWeatherEmoji = (code) => {
    // WMO Weather interpretation codes (https://open-meteo.com/en/docs)
    if (code === 0) return '☀️';
    if (code <= 3) return '⛅';
    if (code === 45 || code === 48) return '🌫️';
    if (code >= 51 && code <= 67) return '🌧️';
    if (code >= 71 && code <= 77) return '❄️';
    if (code >= 80 && code <= 82) return '🌧️';
    if (code >= 85 && code <= 86) return '❄️';
    if (code >= 95) return '⛈️';
    return '✨';
  };

  const getWeatherDesc = (code) => {
    if (code === 0) return 'Clear Sky';
    if (code === 1) return 'Mainly Clear';
    if (code === 2) return 'Partly Cloudy';
    if (code === 3) return 'Overcast';
    if (code >= 51 && code <= 55) return 'Drizzle';
    if (code >= 61 && code <= 65) return 'Rain';
    if (code >= 80 && code <= 82) return 'Rain Showers';
    if (code >= 95) return 'Thunderstorm';
    return 'Unknown';
  };

  useEffect(() => {
    const fetchWeather = async (coords = null) => {
      try {
        let city = 'Detecting...';
        let lat, lon;

        if (coords) {
          lat = coords.latitude;
          lon = coords.longitude;
          try {
            // High-precision reverse geocoding via OpenStreetMap (Nominatim) - Forcing English
            const geoRes = await fetch(`https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lon}&addressdetails=1&accept-language=en`, {
              headers: { 'User-Agent': 'NebulaDashboard/1.0' }
            });
            const geoData = await geoRes.json();
            const addr = geoData.address || {};
            city = addr.city || addr.town || addr.village || addr.suburb || addr.neighbourhood || addr.state_district || 'Local Area';
          } catch (e) { 
            console.error('Geo error:', e);
            city = 'Detected Coords'; 
          }
        } else {
          // Fallback to IP-based location
          try {
            const ipRes = await fetch('https://ipapi.co/json/');
            const ipData = await ipRes.json();
            // Detect if service is giving a generic US fallback (like Santa Cruz)
            lat = ipData.latitude;
            lon = ipData.longitude;
            city = ipData.city || 'Detected Area';
          } catch (e) {
            lat = 40.7128; lon = -74.0060; city = 'New York'; // Standard neutral fallback
          }
        }

        // Fetch from Open-Meteo (Scientific grade, high accuracy)
        const weatherRes = await fetch(`https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lon}&current=temperature_2m,relative_humidity_2m,apparent_temperature,weather_code,wind_speed_10m,surface_pressure&wind_speed_unit=ms&timezone=auto`);
        const weatherData = await weatherRes.json();
        const current = weatherData.current;

        setWeatherData({
          temp: Math.round(current.temperature_2m),
          condition: getWeatherDesc(current.weather_code),
          city: city,
          humidity: current.relative_humidity_2m,
          wind: current.wind_speed_10m.toFixed(1),
          pressure: Math.round(current.surface_pressure),
          emoji: getWeatherEmoji(current.weather_code)
        });
      } catch (err) {
        console.error("Weather fetch failed:", err);
      }
    };

    const startFetching = () => {
      if ("geolocation" in navigator) {
        navigator.geolocation.getCurrentPosition(
          (pos) => fetchWeather(pos.coords),
          () => fetchWeather(),
          { enableHighAccuracy: true, timeout: 5000, maximumAge: 0 }
        );
      } else { fetchWeather(); }
    };

    startFetching();
    const weatherInterval = setInterval(startFetching, 1800000);
    return () => clearInterval(weatherInterval);
  }, []);



  useEffect(() => {
    localStorage.setItem('nebula_settings', JSON.stringify(settings));
  }, [settings]);

  const inferCategory = (url, title) => {
    const u = url.toLowerCase();
    const t = (title || '').toLowerCase();
    if (u.includes('github') || u.includes('stack') || u.includes('docs') || u.includes('npm') || u.includes('dev') || u.includes('localhost') || u.includes('vercel') || u.includes('gemini')) return 'Coding';
    if (u.includes('youtube') || u.includes('netflix') || u.includes('twitch') || u.includes('vimeo') || u.includes('video')) return 'Video';
    if (u.includes('google') || u.includes('gmail') || u.includes('twitter') || u.includes('x.com') || u.includes('facebook') || u.includes('linkedin') || u.includes('reddit') || u.includes('instagram') || u.includes('discord') || u.includes('whatsapp') || u.includes('telegram') || u.includes('messenger') || u.includes('medium')) return 'Social';
    return 'Other';
  };

  useEffect(() => {
    const fetchHistory = async () => {
      // 1. Try Native Chrome Extension API
      if (typeof chrome !== 'undefined' && chrome.history) {
        chrome.history.search({ text: '', maxResults: 300, startTime: 0 }, (data) => {
          const formatted = data.map(item => ({
            id: item.id,
            url: item.url,
            title: item.title || 'Untitled Node',
            visitCount: item.visitCount || 0,
            lastVisitTime: (item.lastVisitTime || Date.now()) / 1000,
            category: inferCategory(item.url, item.title || '')
          }));
          setHistoryData(formatted);
        });
        return;
      }

      // 2. Fallback to Local Server
      try {
        const res = await fetch('http://localhost:3001/api/history');
        if (res.ok) {
          const data = await res.json();
          const formatted = data.map(item => ({
            id: item.id || item.Id || Math.random(),
            url: item.url || item.Url || '',
            title: item.title || item.Title || 'Untitled Node',
            visitCount: item.visitCount || item.VisitCount || 0,
            lastVisitTime: (item.lastVisitTime || item.LastVisitTime || Date.now()) / 1000,
            category: item.category || item.Category || inferCategory(item.url || item.Url || '', item.title || item.Title || '')
          }));
          setHistoryData(formatted);
        }
      } catch (err) {
        console.warn("Standalone mode: Using synthetic galaxy generation.");
        const syntheticHistory = [];
        const cats = ['Coding', 'Social', 'Video', 'Other'];
        const siteSamples = {
          'Coding': ['GitHub', 'Stack Overflow', 'NPM', 'Vercel', 'Dev.to', 'Localhost'],
          'Social': ['Reddit', 'Twitter', 'LinkedIn', 'Instagram', 'Discord', 'Facebook'],
          'Video': ['YouTube', 'Netflix', 'Twitch', 'Vimeo', 'Hulu'],
          'Other': ['Google', 'Amazon', 'Wikipedia', 'Medium', 'BBC News']
        };

        for (let i = 0; i < 120; i++) {
          const cat = cats[Math.floor(Math.random() * cats.length)];
          const sites = siteSamples[cat] || ['Site'];
          const site = sites[Math.floor(Math.random() * sites.length)];
          
          syntheticHistory.push({
            id: `syn-${i}`,
            url: `https://${site.toLowerCase().replace(' ', '')}.com/${i}`,
            title: `[DEMO DATA] ${site} - ${cat} Node ${i}`,
            visitCount: Math.floor(Math.random() * 50),
            lastVisitTime: Date.now() / 1000,
            category: cat
          });
        }
        setHistoryData(syntheticHistory);
      }
    };
    fetchHistory();
    const interval = setInterval(fetchHistory, 300000);
    return () => clearInterval(interval);
  }, []);



  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  useEffect(() => {
    let timeout;
    const resetIdle = () => {
      setIsIdle(false);
      clearTimeout(timeout);
      if (settings.controls.idleHide) {
        timeout = setTimeout(() => setIsIdle(true), settings.controls.idleTime * 1000);
      }
    };

    window.addEventListener('mousemove', resetIdle);
    window.addEventListener('keydown', resetIdle);
    resetIdle();

    return () => {
      window.removeEventListener('mousemove', resetIdle);
      window.removeEventListener('keydown', resetIdle);
      clearTimeout(timeout);
    };
  }, [settings.controls.idleHide, settings.controls.idleTime]);

  return (
    <div className="app-container" style={{ width: '100vw', height: '100vh', position: 'relative', overflow: 'hidden' }}>
      <Universe 
        selectedStar={selectedStar} 
        setSelectedStar={setSelectedStar} 
        searchQuery={searchQuery} 
        historyData={historyData}
      />

        <div style={{ 
          position: 'absolute',
          top: 0,
          left: 0,
          width: '100%',
          height: '100%',
          pointerEvents: 'none', // Allow clicks to pass through to the Canvas
          opacity: isIdle ? 0 : 1,
          transition: 'opacity 1s cubic-bezier(0.4, 0, 0.2, 1), color 0.3s ease',
          zIndex: 100,
          color: `rgb(${settings.controls.textBrightness * 2.55}, ${settings.controls.textBrightness * 2.55}, ${settings.controls.textBrightness * 2.55})`
        }}>
        {/* We'll wrap individual components to re-enable pointer events */}
        <div style={{ pointerEvents: isIdle ? 'none' : 'auto' }}>
          <RecentDock history={historyData} />
        </div>

        {/* Widgets Section */}
        <WidgetWrapper 
          id="clock" 
          visible={settings.widgets.clock}
          defaultPos={{ x: 70, y: 70 }}
          defaultSize={{ width: 280, height: 160 }}
        >
          <div style={{ textAlign: 'center' }}>
            <div style={{ fontSize: '3.8rem', fontWeight: 800, letterSpacing: '-2px', lineHeight: 1 }}>
              {currentTime.toLocaleTimeString([], { 
                hour: '2-digit', 
                minute: '2-digit', 
                hour12: settings.controls.is12Hour 
              })}
              <span style={{ fontSize: '1.2rem', opacity: 0.5, marginLeft: '8px' }}>
                {currentTime.toLocaleTimeString([], { second: '2-digit' })}
              </span>
            </div>
            <div style={{ opacity: 0.5, fontSize: '0.85rem', marginTop: '8px', textTransform: 'uppercase', letterSpacing: '3px' }}>
              {currentTime.toLocaleDateString([], { weekday: 'long' })}
            </div>
          </div>
        </WidgetWrapper>

        <WidgetWrapper 
          id="date" 
          visible={settings.widgets.date}
          defaultPos={{ x: 70, y: 260 }}
          defaultSize={{ width: 200, height: 250 }}
        >
          <div style={{ textAlign: 'center' }}>
            <div style={{ fontSize: '0.9rem', opacity: 0.6, textTransform: 'uppercase', letterSpacing: '4px', marginBottom: '2px' }}>
              {currentTime.toLocaleDateString([], { month: 'short' })}
            </div>
            <div style={{ fontSize: '6rem', fontWeight: 900, lineHeight: 0.9 }}>
              {currentTime.getDate()}
            </div>
            <div style={{ fontSize: '1.1rem', fontWeight: 600, marginTop: '5px', opacity: 0.8 }}>
              {currentTime.getFullYear()}
            </div>
          </div>
        </WidgetWrapper>

        <WidgetWrapper 
          id="searchbar" 
          visible={settings.widgets.searchbar}
          defaultPos={{ x: window.innerWidth/2 - 300, y: 60 }}
          defaultSize={{ width: 600, height: 80 }}
          style={{ 
            overflow: 'visible', 
            background: 'none', 
            border: 'none', 
            boxShadow: 'none',
            backdropFilter: 'none'
          }}
        >
          <SearchBar 
            history={historyData} 
            query={webQuery}
            onSearchChange={setWebQuery} 
          />
        </WidgetWrapper>

        <WidgetWrapper 
          id="weather" 
          visible={settings.widgets.weather}
          defaultPos={{ x: window.innerWidth - 420, y: 40 }}
          defaultSize={{ width: 350, height: 180 }}
        >
          {weatherData ? (
            <div style={{ display: 'flex', gap: '1.5rem', alignItems: 'center' }}>
              <div style={{ fontSize: '3.5rem' }}>{weatherData.emoji}</div>
              <div>
                <div style={{ fontSize: '3.2rem', fontWeight: 800, lineHeight: 1 }}>{weatherData.temp}°</div>
                <div style={{ opacity: 0.6, fontSize: '0.9rem', fontWeight: 600 }}>{weatherData.condition} • {weatherData.city}</div>
                <div style={{ display: 'flex', gap: '15px', marginTop: '10px', fontSize: '0.7rem', opacity: 0.5, fontWeight: 700, whiteSpace: 'nowrap' }}>
                  <span>HUMIDITY {weatherData.humidity}%</span>
                  <span>WIND {weatherData.wind}m/s</span>
                  <span>PRESSURE {weatherData.pressure}hPa</span>
                </div>
              </div>
            </div>
          ) : (
            <div style={{ opacity: 0.5, fontSize: '0.9rem' }}>Aligning with cosmic atmosphere...</div>
          )}
        </WidgetWrapper>

        {/* Global Search (History) at Bottom */}
        <WidgetWrapper 
          id="history_search" 
          visible={true}
          defaultPos={{ x: window.innerWidth/2 - 170, y: window.innerHeight - 80 }}
          defaultSize={{ width: 340, height: 60 }}
          style={{ border: 'none', background: 'transparent', boxShadow: 'none' }}
        >
          <div className="glass-pill" style={{ 
            display: 'flex', 
            gap: '0.8rem', 
            alignItems: 'center', 
            padding: '0.6rem 1.2rem', 
            borderRadius: '16px', 
            width: '100%',
            border: 'none',
            background: 'rgba(255,255,255,0.05)'
          }}>
            <Globe size={18} style={{ opacity: 0.4 }} />
            <input 
              type="text" 
              placeholder="Search history galaxy..." 
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              style={{ 
                background: 'transparent', 
                border: 'none', 
                color: 'white', 
                width: '100%', 
                outline: 'none',
                fontSize: '0.9rem'
              }} 
            />
          </div>
        </WidgetWrapper>

        {/* Sidebar Overlay Details */}
        <WidgetWrapper 
          id="site_details" 
          visible={!!selectedStar}
          defaultPos={{ x: window.innerWidth - 380, y: 50 }}
          defaultSize={{ width: 340, height: 600 }}
        >
          <div style={{ 
            width: '100%', height: '100%', padding: '1.5rem',
            display: 'flex', flexDirection: 'column', gap: '1.5rem', borderRadius: '28px'
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start' }}>
              <div style={{ 
                padding: '6px 14px', borderRadius: '20px', fontSize: '0.75rem', fontWeight: 700, 
                background: 'rgba(255,255,255,0.1)', border: '1px solid rgba(255,255,255,0.2)'
              }}>
                HISTORICAL NODE
              </div>
              <button onClick={() => setSelectedStar(null)} style={{ background: 'transparent', border: 'none', color: 'white', cursor: 'pointer', opacity: 0.5 }}>
                <X size={20} />
              </button>
            </div>
            <h2 style={{ margin: 0, fontSize: '1.8rem', fontWeight: 800, lineHeight: 1.2 }}>{selectedStar?.title}</h2>
            <p style={{ margin: 0, opacity: 0.4, fontSize: '0.8rem', wordBreak: 'break-all' }}>{selectedStar?.url}</p>
            <a 
              href={selectedStar?.url} target="_blank" rel="noopener noreferrer"
              style={{ 
                marginTop: 'auto', display: 'flex', alignItems: 'center', justifyContent: 'center', 
                gap: '0.8rem', padding: '1.2rem', background: 'white', color: 'black', 
                borderRadius: '20px', textDecoration: 'none', fontWeight: 800, fontSize: '1rem'
              }}
            >
              <ExternalLink size={20} /> Teleport to Site
            </a>
          </div>
        </WidgetWrapper>

        {/* Settings Button Stack */}
        <div style={{ position: 'fixed', bottom: '1.5rem', right: '1.2rem', zIndex: 1000, pointerEvents: 'auto', display: 'flex', flexDirection: 'column', gap: '0.8rem', alignItems: 'center' }}>
          <button 
            onClick={() => setShowHelp(true)}
            className="glass-panel"
            style={{
              width: '44px',
              height: '44px',
              borderRadius: '50%',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              cursor: 'pointer',
              border: 'none',
              color: 'white',
              opacity: 0.7,
              transition: 'all 0.3s ease',
              background: 'rgba(255,255,255,0.03)'
            }}
            onMouseEnter={(e) => { e.currentTarget.style.transform = 'translateY(-2px)'; e.currentTarget.style.opacity = '1'; }}
            onMouseLeave={(e) => { e.currentTarget.style.transform = 'translateY(0)'; e.currentTarget.style.opacity = '0.7'; }}
          >
            <HelpCircle size={20} />
          </button>

          <button 
            onClick={() => setShowSettings(!showSettings)}
            className="glass-panel"
            style={{
              width: '44px',
              height: '44px',
              borderRadius: '50%',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              cursor: 'pointer',
              border: 'none',
              color: 'white',
              boxShadow: '0 8px 24px rgba(0,0,0,0.3)',
              transition: 'all 0.4s cubic-bezier(0.175, 0.885, 0.32, 1.275)'
            }}
            onMouseEnter={(e) => e.currentTarget.style.transform = 'scale(1.1) rotate(45deg)'}
            onMouseLeave={(e) => e.currentTarget.style.transform = 'scale(1) rotate(0deg)'}
          >
            <Settings size={20} />
          </button>
        </div>
      </div>

      {/* Overlays - Outside UI Layer */}
      {showSettings && (
        <SettingsPanel 
          settings={settings} 
          setSettings={setSettings} 
          onClose={() => setShowSettings(false)} 
        />
      )}

      {showHelp && (
        <HelpModal onClose={() => setShowHelp(false)} />
      )}

      <svg style={{ position: 'absolute', width: 0, height: 0 }}>
        <filter id="nebula-blur">
          <feGaussianBlur in="SourceGraphic" stdDeviation={settings.controls.blurAmount / 4} />
        </filter>
      </svg>
      <style>{`
        .glass-panel {
          backdrop-filter: blur(${settings.controls.blurAmount}px) saturate(150%) !important;
          -webkit-backdrop-filter: blur(${settings.controls.blurAmount}px) saturate(150%) !important;
        }
        @keyframes fadeIn {
          from { opacity: 0; }
          to { opacity: 1; }
        }
        @keyframes slideIn {
          from { transform: translateX(100%); opacity: 0; }
          to { transform: translateX(0); opacity: 1; }
        }
        @keyframes smoothFadeIn {
          from { opacity: 0; transform: translate(-50%, -48%) scale(0.98); }
          to { opacity: 1; transform: translate(-50%, -50%) scale(1); }
        }
        input::placeholder { color: rgba(255,255,255,0.3); }
      `}</style>
    </div>
  );
}

export default App;
