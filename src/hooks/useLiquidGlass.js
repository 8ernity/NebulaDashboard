import { useEffect, useRef } from 'react';

export function useLiquidGlass(enabled = true) {
  const ref = useRef(null);

  useEffect(() => {
    if (enabled && window.liquidGlass && ref.current) {
      const glass = window.liquidGlass(ref.current, {
        scale: -150,    // Stronger refraction
        chroma: 10,     // More color splitting (chromatic aberration)
        mapBlur: 24,    // Smoother glass surface
        blur: 0,        // 0 frosted blur for perfect clarity
        saturate: 1.8,  // Boost colors behind it
      });
      return () => {
        if (glass && glass.destroy) glass.destroy();
      };
    }
  }, [enabled]);

  return ref;
}
