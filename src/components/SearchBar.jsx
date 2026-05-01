import React, { useState, useEffect } from 'react';
import { Search, Clock, Globe, Zap, ArrowUpRight } from 'lucide-react';

export function SearchBar({ history = [], query, onSearchChange }) {
  const [suggestions, setSuggestions] = useState([]);

  const googleQuery = query || '';
  const setGoogleQuery = onSearchChange;

  const handleGoogleSearch = (e) => {
    if (e.key === 'Enter' && googleQuery.trim()) {
      window.open(`https://www.google.com/search?q=${encodeURIComponent(googleQuery)}`, '_blank');
      setSuggestions([]);
    }
  };

  useEffect(() => {
    const fetchSuggestions = async () => {
      const trimmedQuery = googleQuery.trim();
      if (trimmedQuery.length === 0) {
        setSuggestions([]);
        return;
      }

      // Initial verbatim suggestion to keep UI responsive
      const initialSuggestions = [
        { type: 'search', text: trimmedQuery, sub: 'Google Search', icon: Search }
      ];
      setSuggestions(initialSuggestions);

      // 1. Get History Matches (Local)
      const historyMatches = history
        .filter(item => 
          item.title.toLowerCase().includes(trimmedQuery.toLowerCase()) || 
          item.url.toLowerCase().includes(trimmedQuery.toLowerCase())
        )
        .slice(0, 3)
        .map(item => ({
          type: 'history',
          text: item.title,
          sub: new URL(item.url).hostname,
          url: item.url,
          icon: Clock
        }));

      // 2. Get Live Google Suggestions
      try {
        let liveSuggestions = [];
        const googleUrl = `https://suggestqueries.google.com/complete/search?client=firefox&q=${encodeURIComponent(trimmedQuery)}`;

        // If in extension mode, we can try direct fetch (needs host permission in manifest)
        if (typeof chrome !== 'undefined' && chrome.history) {
          try {
            const res = await fetch(googleUrl);
            const liveData = await res.json();
            liveSuggestions = (liveData[1] || []).map(text => ({
              type: 'search',
              text: text,
              sub: 'Google Search',
              icon: Search
            }));
          } catch (e) {
            // Fallback to proxy if direct fetch fails (CSP/Permissions)
            const res = await fetch(`http://localhost:3001/api/suggestions?q=${encodeURIComponent(trimmedQuery)}`);
            const liveData = await res.json();
            liveSuggestions = liveData.map(s => ({ ...s, icon: s.type === 'search' ? Search : Globe }));
          }
        } else {
          // Standard web mode: Use Backend Proxy
          const res = await fetch(`http://localhost:3001/api/suggestions?q=${encodeURIComponent(trimmedQuery)}`);
          const liveData = await res.json();
          liveSuggestions = liveData.map(s => ({ ...s, icon: s.type === 'search' ? Search : Globe }));
        }
        
        // Remove duplicates and verbatim from live results
        const finalLive = liveSuggestions.filter(s => s.text.toLowerCase() !== trimmedQuery.toLowerCase());

        // Merge results: Verbatim + History + Live
        setSuggestions([initialSuggestions[0], ...historyMatches, ...finalLive].slice(0, 10));
      } catch (err) {
        setSuggestions([...initialSuggestions, ...historyMatches]);
      }
    };

    const timeoutId = setTimeout(fetchSuggestions, 150);
    return () => clearTimeout(timeoutId);
  }, [googleQuery, history]);

  return (
    <div style={{ width: '100%', display: 'flex', flexDirection: 'column', gap: '0.3rem' }}>
      <div className="glass-pill" style={{ display: 'flex', gap: '0.6rem', alignItems: 'center', background: 'rgba(255,255,255,0.05)', flex: 1, padding: '10px 18px', borderRadius: '16px' }}>
        <Search size={18} style={{ opacity: 0.4 }} />
        <input 
          type="text" 
          placeholder="Search or type URL..." 
          value={googleQuery}
          onChange={(e) => setGoogleQuery(e.target.value)}
          onKeyDown={handleGoogleSearch}
          style={{ 
            background: 'transparent', 
            border: 'none', 
            color: 'inherit', 
            width: '100%', 
            outline: 'none',
            fontSize: '1rem',
            fontWeight: 500
          }} 
        />
      </div>

      {suggestions.length > 0 && (
        <div className="glass-panel" style={{ 
          padding: '0.6rem', 
          display: 'flex', 
          flexDirection: 'column', 
          gap: '2px', 
          borderRadius: '20px', 
          marginTop: '6px',
          boxShadow: '0 20px 40px rgba(0,0,0,0.4)',
          border: '1px solid rgba(255,255,255,0.1)'
        }}>
          {suggestions.map((s, i) => (
            <div 
              key={i} 
              className="suggestion-item"
              style={{ 
                display: 'flex',
                alignItems: 'center',
                gap: '1rem',
                padding: '10px 14px',
                borderRadius: '12px',
                cursor: 'pointer',
                transition: 'all 0.2s ease',
                position: 'relative'
              }}
              onClick={() => {
                if (s.type === 'history') {
                  window.open(s.url, '_blank');
                } else {
                  window.open(`https://www.google.com/search?q=${encodeURIComponent(s.text)}`, '_blank');
                }
                setSuggestions([]);
              }}
            >
              <div style={{ 
                width: '32px', 
                height: '32px', 
                borderRadius: '8px', 
                background: 'rgba(255,255,255,0.05)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                opacity: 0.6
              }}>
                <s.icon size={16} />
              </div>
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: '0.95rem', fontWeight: 500, color: 'inherit' }}>{s.text}</div>
                <div style={{ fontSize: '0.75rem', opacity: 0.4, marginTop: '1px', color: 'inherit' }}>{s.sub}</div>
              </div>
              <style dangerouslySetInnerHTML={{ __html: `
                .suggestion-item:hover { background: rgba(255,255,255,0.08); }
              `}} />
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
