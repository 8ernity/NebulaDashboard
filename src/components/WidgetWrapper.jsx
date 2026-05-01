import React, { useState, useEffect, useRef } from 'react';
import { GripVertical } from 'lucide-react';

export function WidgetWrapper({ id, children, defaultPos, defaultSize, visible, onSave, style = {} }) {
  const [pos, setPos] = useState(() => {
    const saved = localStorage.getItem(`nebula_widget_pos_${id}`);
    return saved ? JSON.parse(saved) : defaultPos;
  });
  const [size, setSize] = useState(() => {
    const saved = localStorage.getItem(`nebula_widget_size_${id}`);
    return saved ? JSON.parse(saved) : defaultSize;
  });
  
  const [isDragging, setIsDragging] = useState(false);
  const [isResizing, setIsResizing] = useState(false);
  const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 });
  
  useEffect(() => {
    // Snap to boundaries on load or resize
    const snapToBoundaries = () => {
      const SAFE_MARGIN = 24;
      let nextX = Math.max(SAFE_MARGIN, Math.min(pos.x, window.innerWidth - size.width - SAFE_MARGIN));
      let nextY = Math.max(SAFE_MARGIN, Math.min(pos.y, window.innerHeight - size.height - SAFE_MARGIN));
      
      if (nextX !== pos.x || nextY !== pos.y) {
        setPos({ x: nextX, y: nextY });
      }
    };

    snapToBoundaries();
    window.addEventListener('resize', snapToBoundaries);
    return () => window.removeEventListener('resize', snapToBoundaries);
  }, [size, pos.x, pos.y, id]);

  useEffect(() => {
    localStorage.setItem(`nebula_widget_pos_${id}`, JSON.stringify(pos));
  }, [pos, id]);

  useEffect(() => {
    localStorage.setItem(`nebula_widget_size_${id}`, JSON.stringify(size));
  }, [size, id]);

  const onMouseDown = (e) => {
    if (e.target.closest('.widget-drag-handle')) {
      setIsDragging(true);
      setDragOffset({ x: e.clientX - pos.x, y: e.clientY - pos.y });
    } else if (e.target.closest('.widget-resize-handle')) {
      setIsResizing(true);
    }
  };

  const SAFE_MARGIN = 24;

  const onMouseMove = (e) => {
    if (isDragging) {
      let nextX = e.clientX - dragOffset.x;
      let nextY = e.clientY - dragOffset.y;

      // Bound to screen with margin
      nextX = Math.max(SAFE_MARGIN, Math.min(nextX, window.innerWidth - size.width - SAFE_MARGIN));
      nextY = Math.max(SAFE_MARGIN, Math.min(nextY, window.innerHeight - size.height - SAFE_MARGIN));

      setPos({ x: nextX, y: nextY });
    } else if (isResizing) {
      let nextWidth = Math.max(150, e.clientX - pos.x);
      let nextHeight = Math.max(80, e.clientY - pos.y);

      // Bound size to screen
      nextWidth = Math.min(nextWidth, window.innerWidth - pos.x - SAFE_MARGIN);
      nextHeight = Math.min(nextHeight, window.innerHeight - pos.y - SAFE_MARGIN);

      setSize({ width: nextWidth, height: nextHeight });
    }
  };

  const onMouseUp = () => {
    setIsDragging(false);
    setIsResizing(false);
  };

  useEffect(() => {
    if (isDragging || isResizing) {
      window.addEventListener('mousemove', onMouseMove);
      window.addEventListener('mouseup', onMouseUp);
    } else {
      window.removeEventListener('mousemove', onMouseMove);
      window.removeEventListener('mouseup', onMouseUp);
    }
    return () => {
      window.removeEventListener('mousemove', onMouseMove);
      window.removeEventListener('mouseup', onMouseUp);
    };
  }, [isDragging, isResizing]);

  if (!visible) return null;

  return (
    <div 
      className="glass-panel"
      style={{
        position: 'fixed',
        top: Math.max(SAFE_MARGIN, Math.min(pos.y, (window.innerHeight || 1080) - size.height - SAFE_MARGIN)),
        left: Math.max(SAFE_MARGIN, Math.min(pos.x, (window.innerWidth || 1920) - size.width - SAFE_MARGIN)),
        width: size.width,
        height: size.height,
        zIndex: 1000,
        display: 'flex',
        flexDirection: 'column',
        padding: '0.5rem',
        borderRadius: '20px',
        overflow: 'hidden',
        userSelect: 'none',
        boxShadow: isDragging ? '0 20px 40px rgba(0,0,0,0.4)' : '0 10px 20px rgba(0,0,0,0.2)',
        transition: isDragging ? 'none' : 'box-shadow 0.3s ease',
        cursor: isDragging ? 'grabbing' : 'default',
        pointerEvents: 'auto',
        ...style
      }}
      onMouseDown={onMouseDown}
    >
      <div className="widget-drag-handle" style={{
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        height: '24px',
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        cursor: 'grab',
        opacity: 0,
        background: 'rgba(255,255,255,0.05)',
        transition: 'opacity 0.2s ease'
      }}>
        <GripVertical size={14} />
      </div>
      
      <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', paddingTop: '10px' }}>
        {children}
      </div>

      <div className="widget-resize-handle" style={{
        position: 'absolute',
        bottom: '4px',
        right: '4px',
        width: '10px',
        height: '10px',
        cursor: 'nwse-resize',
        borderRight: '2px solid rgba(255,255,255,0.2)',
        borderBottom: '2px solid rgba(255,255,255,0.2)',
        borderRadius: '0 0 4px 0'
      }} />

      <style dangerouslySetInnerHTML={{ __html: `
        .glass-panel:hover .widget-drag-handle { opacity: 0.6 !important; }
      `}} />
    </div>
  );
}
