import React from 'react';
import { X, Info, MousePointer2, Search, ZoomIn, Sparkles } from 'lucide-react';

export function HelpModal({ onClose }) {
  return (
    <div style={{
      position: 'fixed',
      top: 0,
      left: 0,
      width: '100vw',
      height: '100vh',
      background: 'rgba(2, 6, 23, 0.6)',
      backdropFilter: 'blur(12px)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      zIndex: 2000,
      animation: 'fadeIn 0.5s ease'
    }} onClick={onClose}>
      <div 
        className="glass-panel"
        style={{
          width: '500px',
          maxHeight: '80vh',
          padding: '2.5rem',
          position: 'relative',
          overflowY: 'auto',
          display: 'flex',
          flexDirection: 'column',
          gap: '1.5rem',
          border: '1px solid rgba(255,255,255,0.1)',
          boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.5)'
        }}
        onClick={(e) => e.stopPropagation()}
      >
        <button 
          onClick={onClose}
          style={{
            position: 'absolute',
            top: '1.5rem',
            right: '1.5rem',
            background: 'transparent',
            border: 'none',
            color: 'white',
            cursor: 'pointer',
            opacity: 0.5
          }}
        >
          <X size={20} />
        </button>

        <div style={{ textAlign: 'center', marginBottom: '1rem' }}>
          <Sparkles size={32} style={{ color: '#00ccff', marginBottom: '1rem' }} />
          <h2 style={{ margin: 0, fontSize: '1.8rem', fontWeight: 800, letterSpacing: '-1px' }}>Guide to the Galaxy</h2>
          <p style={{ opacity: 0.5, fontSize: '0.9rem', marginTop: '0.5rem', fontStyle: 'italic' }}>
            A dreamer's manual for navigating your digital universe
          </p>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.2rem' }}>
          <section>
            <h3 style={{ fontSize: '1rem', fontWeight: 700, marginBottom: '0.8rem', display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
              <Sparkles size={16} style={{ color: '#00ccff' }} />
              Celestial Colors
            </h3>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.8rem', fontSize: '0.85rem' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <div style={{ width: '10px', height: '10px', borderRadius: '50%', background: '#00ccff', boxShadow: '0 0 10px #00ccff' }} />
                <span>Coding & Tech</span>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <div style={{ width: '10px', height: '10px', borderRadius: '50%', background: '#ff0000', boxShadow: '0 0 10px #ff0000' }} />
                <span>Social & People</span>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <div style={{ width: '10px', height: '10px', borderRadius: '50%', background: '#ffcc00', boxShadow: '0 0 10px #ffcc00' }} />
                <span>Videos & Leisure</span>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <div style={{ width: '10px', height: '10px', borderRadius: '50%', background: '#00ff88', boxShadow: '0 0 10px #00ff88' }} />
                <span>Other Mysteries</span>
              </div>
            </div>
          </section>

          <section style={{ opacity: 0.85, fontSize: '0.9rem', lineHeight: 1.6 }}>
            <div style={{ display: 'flex', gap: '1rem', marginBottom: '1rem' }}>
              <MousePointer2 size={20} style={{ flexShrink: 0, color: '#00ccff' }} />
              <div>
                <strong style={{ display: 'block', color: 'white' }}>Touch the Stars</strong>
                Click any celestial body to reveal its story. A portal will open, allowing you to teleport back to that moment in time.
              </div>
            </div>

            <div style={{ display: 'flex', gap: '1rem', marginBottom: '1rem' }}>
              <Search size={20} style={{ flexShrink: 0, color: '#00ccff' }} />
              <div>
                <strong style={{ display: 'block', color: 'white' }}>Cosmic Filtering</strong>
                Whisper a name into the history search bar. The galaxy will dim, leaving only the stars you seek shining bright in the void.
              </div>
            </div>

            <div style={{ display: 'flex', gap: '1rem' }}>
              <ZoomIn size={20} style={{ flexShrink: 0, color: '#00ccff' }} />
              <div>
                <strong style={{ display: 'block', color: 'white' }}>Perspective</strong>
                Use your scroll wheel to drift closer to the nebula or pull back to see the entire constellation of your digital life.
              </div>
            </div>
          </section>
        </div>

        <div style={{ 
          marginTop: '1rem',
          padding: '1rem',
          borderRadius: '16px',
          background: 'rgba(0, 204, 255, 0.05)',
          border: '1px solid rgba(0, 204, 255, 0.1)',
          fontSize: '0.8rem',
          textAlign: 'center',
          opacity: 0.7
        }}>
          "Your history is not just data; it's a map of where you've been and a light for where you're going."
        </div>
      </div>

      <style dangerouslySetInnerHTML={{ __html: `
        @keyframes fadeIn {
          from { opacity: 0; }
          to { opacity: 1; }
        }
      `}} />
    </div>
  );
}
