import React, { useMemo, useState, useRef, useEffect } from 'react';
import { Trash2 } from 'lucide-react';

export function RecentDock({ history }) {
  const [blockedDomains, setBlockedDomains] = useState(() => {
    const saved = localStorage.getItem('nebula_blocked_domains');
    return saved ? JSON.parse(saved) : [];
  });

  const [draggingItem, setDraggingItem] = useState(null);
  const [dragStartPos, setDragStartPos] = useState({ x: 0, y: 0 });
  const [mousePos, setMousePos] = useState({ x: 0, y: 0 });
  const [isOverTrash, setIsOverTrash] = useState(false);
  const trashRef = useRef(null);

  const removeDomain = (domain) => {
    const newBlocked = [...blockedDomains, domain];
    setBlockedDomains(newBlocked);
    localStorage.setItem('nebula_blocked_domains', JSON.stringify(newBlocked));
  };

  const frequent = useMemo(() => {
    const domainMap = new Map();
    history.forEach(item => {
      try {
        const domain = new URL(item.url).hostname;
        const baseDomain = domain.replace('www.', '');
        if (blockedDomains.includes(baseDomain)) return;
        if (!domainMap.has(baseDomain) || item.visitCount > domainMap.get(baseDomain).visitCount) {
          domainMap.set(baseDomain, item);
        }
      } catch (e) { /* ignore */ }
    });
    return Array.from(domainMap.values()).sort((a, b) => b.visitCount - a.visitCount).slice(0, 9);
  }, [history, blockedDomains]);

  const handleMouseMove = (e) => {
    if (draggingItem) {
      setMousePos({ x: e.clientX, y: e.clientY });
      
      if (trashRef.current) {
        const rect = trashRef.current.getBoundingClientRect();
        const dist = Math.hypot(e.clientX - (rect.left + rect.width/2), e.clientY - (rect.top + rect.height/2));
        setIsOverTrash(dist < 50);
      }
    }
  };

  const handleMouseUp = (e) => {
    if (draggingItem) {
      const distMoved = Math.hypot(e.clientX - dragStartPos.x, e.clientY - dragStartPos.y);
      
      if (isOverTrash) {
        const domain = new URL(draggingItem.url).hostname.replace('www.', '');
        removeDomain(domain);
      } else if (distMoved < 5) {
        // Just a click, not a drag
        window.open(draggingItem.url, '_blank');
      }
    }
    setDraggingItem(null);
    setIsOverTrash(false);
  };

  useEffect(() => {
    window.addEventListener('mousemove', handleMouseMove);
    window.addEventListener('mouseup', handleMouseUp);
    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleMouseUp);
    };
  }, [draggingItem, isOverTrash]);

  return (
    <>
      <div className="glass-panel ui-overlay" style={{
        top: '50%',
        left: '1.2rem',
        transform: 'translateY(-50%)',
        padding: '0.8rem 0.6rem',
        display: 'flex',
        flexDirection: 'column',
        gap: '0.8rem',
        borderRadius: '24px',
        zIndex: 500,
        userSelect: 'none'
      }}>
        {frequent.map((site, index) => {
          const domain = new URL(site.url).hostname;
          const faviconUrl = `https://www.google.com/s2/favicons?domain=${domain}&sz=64`;
          const isDraggingThis = draggingItem?.url === site.url;

          return (
            <div 
              key={site.id || index}
              className="dock-item"
              onMouseDown={(e) => {
                if (e.button !== 0) return;
                setDraggingItem(site);
                setDragStartPos({ x: e.clientX, y: e.clientY });
                setMousePos({ x: e.clientX, y: e.clientY });
              }}
              style={{
                width: '50px',
                height: '50px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                borderRadius: '14px',
                background: 'transparent',
                transition: 'all 0.3s cubic-bezier(0.175, 0.885, 0.32, 1.275)',
                cursor: 'grab',
                opacity: isDraggingThis ? 0 : 1,
                position: 'relative'
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.background = 'rgba(255, 255, 255, 0.1)';
                e.currentTarget.style.transform = 'scale(1.2) translateX(8px)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.background = 'transparent';
                e.currentTarget.style.transform = 'scale(1) translateX(0)';
              }}
            >
              <img 
                src={faviconUrl} 
                alt="" 
                style={{ width: '38px', height: '38px', objectFit: 'contain', borderRadius: '8px' }}
                draggable="false"
              />
            </div>
          );
        })}

        {/* Dustbin at the end */}
        <div 
          ref={trashRef}
          style={{
            width: '50px',
            height: '50px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            borderRadius: '14px',
            background: isOverTrash ? 'rgba(255, 68, 68, 0.3)' : 'transparent',
            transition: 'all 0.3s ease',
            marginTop: '0.4rem',
            border: isOverTrash ? '1px solid #ff4444' : 'none',
            color: isOverTrash ? '#ff4444' : 'rgba(255,255,255,0.2)',
            transform: isOverTrash ? 'scale(1.2)' : 'scale(1)'
          }}
        >
          <Trash2 size={24} />
        </div>
      </div>

      {/* Draggable Clone */}
      {draggingItem && (
        <div style={{
          position: 'fixed',
          top: mousePos.y - 27,
          left: mousePos.x - 27,
          width: '54px',
          height: '54px',
          borderRadius: '15px',
          background: 'rgba(255, 255, 255, 0.2)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          pointerEvents: 'none',
          zIndex: 9999,
          backdropFilter: 'blur(8px)',
          boxShadow: '0 8px 32px rgba(0,0,0,0.5)',
          transform: isOverTrash ? 'scale(0.5)' : 'scale(1.1)',
          transition: 'transform 0.1s ease',
          opacity: isOverTrash ? 0.5 : 1
        }}>
          <img 
            src={`https://www.google.com/s2/favicons?domain=${new URL(draggingItem.url).hostname}&sz=64`} 
            alt="" 
            style={{ width: '38px', height: '38px', objectFit: 'contain', borderRadius: '8px' }}
          />
        </div>
      )}
    </>
  );
}
