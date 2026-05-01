import { useRef, useMemo, useState, useEffect } from 'react';
import { useFrame } from '@react-three/fiber';
import { Float } from '@react-three/drei';
import * as THREE from 'three';

const CATEGORIES = [
  { name: 'Coding', color: '#0066ff', emissive: '#0066ff' }, // Deep Electric Blue
  { name: 'Social', color: '#ff0000', emissive: '#ff0000' }, // Vibrant Pure Red
  { name: 'Video', color: '#ffff00', emissive: '#ffff00' },
  { name: 'Other', color: '#00ff44', emissive: '#00ff44' },
];

// Generate a high-resolution, ultra-smooth radial glow texture
const glowTexture = (() => {
  const canvas = document.createElement('canvas');
  canvas.width = 128;
  canvas.height = 128;
  const ctx = canvas.getContext('2d');
  const gradient = ctx.createRadialGradient(64, 64, 0, 64, 64, 64);

  // Sharper gradient for "harder" glows
  gradient.addColorStop(0, 'rgba(255, 255, 255, 1.0)');
  gradient.addColorStop(0.2, 'rgba(255, 255, 255, 0.6)');
  gradient.addColorStop(0.4, 'rgba(255, 255, 255, 0.1)');
  gradient.addColorStop(0.6, 'rgba(255, 255, 255, 0)');

  ctx.fillStyle = gradient;
  ctx.fillRect(0, 0, 128, 128);
  const tex = new THREE.CanvasTexture(canvas);
  return tex;
})();

export function Stars({ selectedStar, setSelectedStar, searchQuery, historyData = [] }) {

  const stars = useMemo(() => {
    const temp = [];
    const clusters = {
      'Coding': new THREE.Vector3(-50, 30, -25),
      'Social': new THREE.Vector3(50, -20, -50),
      'Video': new THREE.Vector3(0, -50, 40),
      'Other': new THREE.Vector3(25, 25, 50),
    };

    historyData.forEach((item, i) => {
      const category = CATEGORIES.find(c => c.name === item.category) || CATEGORIES[3];
      const clusterCenter = clusters[item.category] || clusters['Other'];

      const position = new THREE.Vector3(
        clusterCenter.x + (Math.random() - 0.5) * 110,
        clusterCenter.y + (Math.random() - 0.5) * 110,
        clusterCenter.z + (Math.random() - 0.5) * 110
      );

      temp.push({
        ...item,
        position,
        color: category.color,
        emissive: category.emissive,
        size: 1.8 + Math.random() * 1.2, // Significantly larger hero nodes
        speed: 0.5 + Math.random() * 0.5,
      });
    });
    return temp;
  }, [historyData]);

  return (
    <group>
      {stars.map((star) => (
        <StarItem
          key={star.id}
          {...star}
          isSelected={selectedStar?.id === star.id}
          isMatch={
            searchQuery.trim() === '' ||
            (star.title && star.title.toLowerCase().includes(searchQuery.trim().toLowerCase())) ||
            (star.url && star.url.toLowerCase().includes(searchQuery.trim().toLowerCase())) ||
            (star.category && star.category.toLowerCase().includes(searchQuery.trim().toLowerCase()))
          }
          searchQuery={searchQuery}
          onSelect={() => setSelectedStar(star)}
        />
      ))}
    </group>
  );
}

function StarItem({ position, color, emissive, size, category, speed, title, url, isSelected, isMatch, onSelect, searchQuery }) {
  const mesh = useRef();
  const pingMesh = useRef();
  const materialRef = useRef();
  const innerGlowRef = useRef();
  const auraGlowRef = useRef();
  const nebulaGlowRef = useRef();

  const baseCol = useMemo(() => {
    const safeColor = color || '#ffffff';
    const c = new THREE.Color(safeColor);
    const hsl = { h: 0, s: 0, l: 0 };
    c.getHSL(hsl);
    return new THREE.Color().setHSL(hsl.h, 1.0, hsl.l);
  }, [color]);

  const darkCol = useMemo(() => {
    const safeColor = color || '#ffffff';
    const c = new THREE.Color(safeColor);
    const hsl = { h: 0, s: 0, l: 0 };
    c.getHSL(hsl);
    return new THREE.Color().setHSL(hsl.h, Math.max(0, hsl.s - 0.9), 0.1);
  }, [color]);

  useFrame((state) => {
    if (!mesh.current || !materialRef.current) return;

    const time = state.clock.elapsedTime;

    if (isSelected) {
      const s = 1 + Math.sin(time * 4) * 0.15;
      mesh.current.scale.lerp(new THREE.Vector3(s, s, s), 0.1);
    } else {
      mesh.current.scale.lerp(new THREE.Vector3(1, 1, 1), 0.1);
    }

    const isSearching = searchQuery.trim() !== '';
    const isIrrelevant = isSearching && !isMatch;

    const isBrightColor = category.name === 'Video' || category.name === 'Other';
    const intensityMultiplier = isBrightColor ? 1.5 : 3.5; // Boost for deeper Blue/Red auras

    const targetOpacity = isIrrelevant ? 0.1 : 1.0;
    const targetColor = isIrrelevant ? darkCol : baseCol;
    const targetEmissive = isSearching && isMatch ? 8.0 : intensityMultiplier;

    materialRef.current.opacity = THREE.MathUtils.lerp(materialRef.current.opacity, targetOpacity, 0.1);
    materialRef.current.color.lerp(targetColor, 0.1);
    materialRef.current.emissive.lerp(targetColor, 0.1);
    materialRef.current.emissiveIntensity = THREE.MathUtils.lerp(materialRef.current.emissiveIntensity, targetEmissive, 0.1);

    // Stable animations for a natural feel
    const idleBlink = (0.8 + Math.sin(time * 1.5 + position.x) * 0.2);

    const glows = [
      { ref: innerGlowRef, baseScale: 1.15, baseOpacity: isBrightColor ? 0.8 : 1.0 }, 
      { ref: auraGlowRef, baseScale: 1.6, baseOpacity: isBrightColor ? 0.2 : 0.4 },  
    ];

    glows.forEach(glow => {
      if (glow.ref.current) {
        const sprite = glow.ref.current;
        const mat = sprite.material;

        // Use consistent idleBlink for all stars, but keep matches brighter
        const finalOpacity = isIrrelevant ? 0.0 : (glow.baseOpacity * idleBlink * (isSearching ? 1.2 : 1.0));
        mat.opacity = THREE.MathUtils.lerp(mat.opacity, finalOpacity, 0.08);
        mat.color.lerp(targetColor, 0.1);

        const s = glow.baseScale * size; // Removed searchPulse for stability
        sprite.scale.set(s, s, 1);
      }
    });

    if (pingMesh.current) {
      pingMesh.current.material.opacity = 0; // Disable ping animation
    }
  });

  return (
    <Float speed={speed} rotationIntensity={0.5} floatIntensity={0.5}>
      <group position={position}>
        <mesh
          onClick={(e) => { e.stopPropagation(); onSelect(); }}
          onPointerOver={() => { document.body.style.cursor = 'pointer'; }}
          onPointerOut={() => { document.body.style.cursor = 'auto'; }}
        >
          <sphereGeometry args={[size * 4, 12, 12]} />
          <meshBasicMaterial transparent opacity={0} depthWrite={false} />
        </mesh>

        <mesh ref={mesh}>
          <sphereGeometry args={[size, 32, 32]} />
          <meshPhysicalMaterial
            ref={materialRef}
            color={color}
            emissive={color}
            emissiveIntensity={1.5}
            transparent
            opacity={1.0}
            roughness={0.4}
            metalness={0}
          />

          <sprite ref={innerGlowRef}>
            <spriteMaterial map={glowTexture} color={color} transparent blending={THREE.AdditiveBlending} depthWrite={false} />
          </sprite>

          <sprite ref={auraGlowRef}>
            <spriteMaterial map={glowTexture} color={color} transparent blending={THREE.AdditiveBlending} depthWrite={false} />
          </sprite>
        </mesh>

        {searchQuery !== '' && isMatch && (
          <mesh ref={pingMesh}>
            <sphereGeometry args={[size, 32, 32]} />
            <meshBasicMaterial color={color} transparent opacity={0} />
          </mesh>
        )}
      </group>
    </Float>
  );
}
