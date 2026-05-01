import { useRef, useMemo } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';

const vertexShader = `
  uniform float uSearchDim;
  varying float vOpacity;
  varying vec3 vColor;
  attribute float size;
  attribute vec3 color;
  attribute float opacity;
  
  void main() {
    vColor = color;
    vOpacity = opacity * uSearchDim;
    vec4 mvPosition = modelViewMatrix * vec4(position, 1.0);
    gl_PointSize = size * (300.0 / -mvPosition.z);
    gl_Position = projectionMatrix * mvPosition;
  }
`;

const fragmentShader = `
  varying float vOpacity;
  varying vec3 vColor;
  void main() {
    float r = distance(gl_PointCoord, vec2(0.5));
    if (r > 0.5) discard;
    float alpha = vOpacity * pow(1.0 - r * 2.0, 2.0);
    gl_FragColor = vec4(vColor, alpha);
  }
`;

export function MilkyWay({ isSearching = false }) {
  const mesh = useRef();
  const count = 30000;

  const uniforms = useMemo(() => ({
    uSearchDim: { value: 1.0 }
  }), []);

  const [positions, sizes, colors, opacities] = useMemo(() => {
    const pos = new Float32Array(count * 3);
    const s = new Float32Array(count);
    const c = new Float32Array(count * 3);
    const o = new Float32Array(count);

    const colorPalette = [
      new THREE.Color('#ffd27d'), // Warm star
      new THREE.Color('#ffffff'), // White
      new THREE.Color('#9bb2ff'), // Blue star
      new THREE.Color('#ffccff'), // Pinkish dust
    ];

    for (let i = 0; i < count; i++) {
      // Create a much larger "band" shape
      const angle = (Math.random() - 0.5) * Math.PI * 0.3;
      const radius = (Math.random() - 0.5) * 3000; // Much wider spread
      const thickness = (Math.random() - 0.5) * 400 * (1.0 - Math.abs(radius) / 2500);
      
      const x = radius * Math.cos(angle);
      const y = radius * Math.sin(angle) + thickness;
      const z = (Math.random() - 0.5) * 200 + radius * 0.1;

      pos[i * 3] = x;
      pos[i * 3 + 1] = y;
      pos[i * 3 + 2] = z - 600; // Push it way back

      s[i] = 0.5 + Math.random() * 2.5; 
      
      const col = colorPalette[Math.floor(Math.random() * colorPalette.length)];
      c[i * 3] = col.r;
      c[i * 3 + 1] = col.g;
      c[i * 3 + 2] = col.b;

      // More opacity in the center of the band
      o[i] = (0.3 + Math.random() * 0.6) * (1.1 - Math.abs(thickness) / 400);
    }

    return [pos, s, c, o];
  }, [count]);

  useFrame((state) => {
    if (mesh.current) {
      mesh.current.rotation.z = state.clock.elapsedTime * 0.001;
      
      const targetDim = isSearching ? 0.8 : 1.0;
      uniforms.uSearchDim.value = THREE.MathUtils.lerp(uniforms.uSearchDim.value, targetDim, 0.05);
    }
  });

  return (
    <points ref={mesh} rotation={[0.5, 0.5, 0.5]}>
      <bufferGeometry>
        <bufferAttribute attach="attributes-position" count={count} array={positions} itemSize={3} />
        <bufferAttribute attach="attributes-size" count={count} array={sizes} itemSize={1} />
        <bufferAttribute attach="attributes-color" count={count} array={colors} itemSize={3} />
        <bufferAttribute attach="attributes-opacity" count={count} array={opacities} itemSize={1} />
      </bufferGeometry>
      <shaderMaterial
        vertexShader={vertexShader}
        fragmentShader={fragmentShader}
        uniforms={uniforms}
        transparent
        depthWrite={false}
        blending={THREE.AdditiveBlending}
      />
    </points>
  );
}
