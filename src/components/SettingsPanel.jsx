import React from 'react';
import { X, Sliders, Layout, Monitor, Ghost, Clock } from 'lucide-react';

export function SettingsPanel({ settings, setSettings, onClose }) {
  const toggleWidget = (key) => {
    setSettings({
      ...settings,
      widgets: {
        ...settings.widgets,
        [key]: !settings.widgets[key]
      }
    });
  };

  const updateControl = (key, value) => {
    setSettings({
      ...settings,
      controls: {
        ...settings.controls,
        [key]: value
      }
    });
  };

  return (
    <div style={{
      position: 'fixed',
      top: 0,
      left: 0,
      width: '100vw',
      height: '100vh',
      background: 'rgba(2, 6, 23, 0.4)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      zIndex: 2000,
      animation: 'fadeIn 0.5s ease'
    }} onClick={onClose}>
      <div className="glass-panel" 
        onClick={(e) => e.stopPropagation()}
        style={{
          width: '400px',
          padding: '2rem',
          borderRadius: '28px',
          boxShadow: '0 30px 60px rgba(0,0,0,0.5)',
          animation: 'smoothFadeIn 0.4s cubic-bezier(0.16, 1, 0.3, 1)',
          border: '1px solid rgba(255,255,255,0.1)',
          position: 'relative'
        }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
        <div style={{ display: 'flex', gap: '0.6rem', alignItems: 'center' }}>
          <Sliders size={20} />
          <h2 style={{ fontSize: '1.2rem', fontWeight: 700, margin: 0 }}>Dashboard Settings</h2>
        </div>
        <button onClick={onClose} style={{ background: 'transparent', border: 'none', color: 'white', cursor: 'pointer', opacity: 0.6 }}>
          <X size={20} />
        </button>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
        {/* Widgets Section */}
        <section>
          <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center', opacity: 0.5, marginBottom: '0.8rem', fontSize: '0.8rem', textTransform: 'uppercase', letterSpacing: '1px' }}>
            <Layout size={14} />
            <span>Active Widgets</span>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.8rem' }}>
            {Object.keys(settings.widgets).map(key => (
              <div key={key} onClick={() => toggleWidget(key)} className="settings-toggle" style={{
                padding: '0.6rem 1rem',
                borderRadius: '14px',
                background: settings.widgets[key] ? 'rgba(255,255,255,0.15)' : 'rgba(255,255,255,0.05)',
                cursor: 'pointer',
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                transition: 'all 0.2s ease',
                border: settings.widgets[key] ? '1px solid rgba(255,255,255,0.2)' : '1px solid transparent'
              }}>
                <span style={{ fontSize: '0.9rem', textTransform: 'capitalize' }}>{key}</span>
                <div style={{
                  width: '32px',
                  height: '18px',
                  borderRadius: '10px',
                  background: settings.widgets[key] ? '#00ccff' : 'rgba(255,255,255,0.1)',
                  position: 'relative',
                  transition: 'all 0.3s ease'
                }}>
                  <div style={{
                    position: 'absolute',
                    top: '2px',
                    left: settings.widgets[key] ? '16px' : '2px',
                    width: '14px',
                    height: '14px',
                    borderRadius: '50%',
                    background: 'white',
                    transition: 'all 0.3s cubic-bezier(0.175, 0.885, 0.32, 1.275)'
                  }} />
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* Controls Section */}
        <section>
          <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center', opacity: 0.5, marginBottom: '0.8rem', fontSize: '0.8rem', textTransform: 'uppercase', letterSpacing: '1px' }}>
            <Monitor size={14} />
            <span>Global Controls</span>
          </div>
          
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            {/* Blur Slider */}
            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.85rem', marginBottom: '0.5rem' }}>
                <span>Glass Blur</span>
                <span style={{ opacity: 0.5 }}>{settings.controls.blurAmount}px</span>
              </div>
              <input 
                type="range" 
                min="0" 
                max="64" 
                value={settings.controls.blurAmount}
                onChange={(e) => updateControl('blurAmount', parseInt(e.target.value))}
                style={{ width: '100%', accentColor: '#00ccff' }}
              />
            </div>

            {/* Dark Mode Slider */}
            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.85rem', marginBottom: '0.5rem' }}>
                <span>Dark Mode Intensity</span>
                <span style={{ opacity: 0.5 }}>{settings.controls.textBrightness}%</span>
              </div>
              <input 
                type="range" 
                min="0" 
                max="100" 
                value={settings.controls.textBrightness}
                onChange={(e) => updateControl('textBrightness', parseInt(e.target.value))}
                style={{ width: '100%', accentColor: '#00ccff' }}
              />
            </div>

            {/* 12-Hour Clock Toggle */}
            <div onClick={() => updateControl('is12Hour', !settings.controls.is12Hour)} className="settings-toggle" style={{
              padding: '0.6rem 1rem',
              borderRadius: '14px',
              background: 'rgba(255,255,255,0.05)',
              cursor: 'pointer',
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center'
            }}>
              <div style={{ display: 'flex', gap: '0.6rem', alignItems: 'center' }}>
                <Clock size={16} opacity={0.6} />
                <span style={{ fontSize: '0.9rem' }}>12-Hour Format</span>
              </div>
              <div style={{
                width: '32px',
                height: '18px',
                borderRadius: '10px',
                background: settings.controls.is12Hour ? '#00ccff' : 'rgba(255,255,255,0.1)',
                position: 'relative'
              }}>
                <div style={{
                  position: 'absolute',
                  top: '2px',
                  left: settings.controls.is12Hour ? '16px' : '2px',
                  width: '14px',
                  height: '14px',
                  borderRadius: '50%',
                  background: 'white',
                  transition: 'all 0.3s cubic-bezier(0.175, 0.885, 0.32, 1.275)'
                }} />
              </div>
            </div>

            {/* Idle Hide Toggle */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.8rem' }}>
              <div onClick={() => updateControl('idleHide', !settings.controls.idleHide)} className="settings-toggle" style={{
                padding: '0.6rem 1rem',
                borderRadius: '14px',
                background: 'rgba(255,255,255,0.05)',
                cursor: 'pointer',
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center'
              }}>
                <div style={{ display: 'flex', gap: '0.6rem', alignItems: 'center' }}>
                  <Ghost size={16} opacity={0.6} />
                  <span style={{ fontSize: '0.9rem' }}>Idle Hide UI</span>
                </div>
                <div style={{
                  width: '32px',
                  height: '18px',
                  borderRadius: '10px',
                  background: settings.controls.idleHide ? '#00ccff' : 'rgba(255,255,255,0.1)',
                  position: 'relative'
                }}>
                  <div style={{
                    position: 'absolute',
                    top: '2px',
                    left: settings.controls.idleHide ? '16px' : '2px',
                    width: '14px',
                    height: '14px',
                    borderRadius: '50%',
                    background: 'white',
                    transition: 'all 0.3s cubic-bezier(0.175, 0.885, 0.32, 1.275)'
                  }} />
                </div>
              </div>

              {settings.controls.idleHide && (
                <div style={{ padding: '0 0.5rem' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.85rem', marginBottom: '0.5rem' }}>
                    <span style={{ opacity: 0.7 }}>Hide Delay</span>
                    <span style={{ color: '#00ccff', fontWeight: 600 }}>{settings.controls.idleTime}s</span>
                  </div>
                  <input 
                    type="range" 
                    min="2" 
                    max="30" 
                    value={settings.controls.idleTime}
                    onChange={(e) => updateControl('idleTime', parseInt(e.target.value))}
                    style={{ width: '100%', accentColor: '#00ccff' }}
                  />
                </div>
              )}
            </div>
          </div>
        </section>
      </div>
      </div>
    </div>
  );
}
