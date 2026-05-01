import { useRef, useMemo } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';

const vertexShader = `
  uniform float uTime;
  uniform float uSearchDim;
  uniform vec2 uMouse;
  attribute float size;
  attribute vec3 color;
  varying float vOpacity;
  varying vec3 vColor;
  
  void main() {
    vec3 pos = position;
    vec2 mouse = uMouse * 250.0; 
    float dist = distance(pos.xy, mouse);
    float radius = 50.0;
    float force = smoothstep(radius, 0.0, dist);
    vec3 dir = normalize(pos - vec3(mouse, pos.z));
    pos.xy += dir.xy * force * 30.0;
    
    vec4 mvPosition = modelViewMatrix * vec4(pos, 1.0);
    gl_PointSize = size * (300.0 / -mvPosition.z);
    gl_Position = projectionMatrix * mvPosition;
    
    // Maximum brightness for visibility
    float baseOpacity = (0.9 + force * 0.1) * (0.95 + sin(uTime * 3.0 + pos.x) * 0.05);
    vOpacity = baseOpacity * uSearchDim;
    vColor = color;
  }
`;

const fragmentShader = `
  varying float vOpacity;
  varying vec3 vColor;
  void main() {
    float r = distance(gl_PointCoord, vec2(0.5));
    if (r > 0.5) discard;
    // Sharp points for distant stars
    float alpha = vOpacity * (1.0 - smoothstep(0.4, 0.5, r)); 
    gl_FragColor = vec4(vColor, alpha);
  }
`;

export function Starfield({ count = 8000, isSearching = false }) {
  const mesh = useRef();

  const uniforms = useMemo(() => ({
    uTime: { value: 0 },
    uSearchDim: { value: 1.0 },
    uMouse: { value: new THREE.Vector2(0, 0) }
  }), []);

  const [positions, sizes, colors] = useMemo(() => {
    const positions = new Float32Array(count * 3);
    const sizes = new Float32Array(count);
    const colors = new Float32Array(count * 3);

    const palette = [
      new THREE.Color('#ffffff'), // White
      new THREE.Color('#88ccff'), // Light Blue
      new THREE.Color('#cc99ff'), // Light Purple
      new THREE.Color('#ffffff'), // White
    ];

    for (let i = 0; i < count; i++) {
      // Create asymmetric distribution with huge spread for 150k stars
      const bias = Math.random() > 0.35 ? 1.0 : -1.0;
      const spreadX = bias > 0 ? 3500 : 1200;

      positions[i * 3] = (Math.random() * bias) * spreadX;
      positions[i * 3 + 1] = (Math.random() - 0.5) * 4000;
      positions[i * 3 + 2] = (Math.random() - 0.5) * 4000;
      sizes[i] = 1.0 + Math.random() * 3.5;

      const col = palette[Math.floor(Math.random() * palette.length)];
      colors[i * 3] = col.r;
      colors[i * 3 + 1] = col.g;
      colors[i * 3 + 2] = col.b;
    }
    return [positions, sizes, colors];
  }, [count]);

  useFrame((state) => {
    if (!mesh.current) return;
    uniforms.uTime.value = state.clock.elapsedTime;
    uniforms.uMouse.value.lerp(state.mouse, 0.1);

    // High visibility even during search
    const targetDim = isSearching ? 0.9 : 1.0;
    uniforms.uSearchDim.value = THREE.MathUtils.lerp(uniforms.uSearchDim.value, targetDim, 0.05);

    mesh.current.rotation.y = state.clock.elapsedTime * 0.005; // Slower rotation
    mesh.current.rotation.x = state.clock.elapsedTime * 0.002;
  });

  return (
    <points ref={mesh}>
      <bufferGeometry>
        <bufferAttribute
          attach="attributes-position"
          count={count}
          array={positions}
          itemSize={3}
        />
        <bufferAttribute
          attach="attributes-size"
          count={count}
          array={sizes}
          itemSize={1}
        />
        <bufferAttribute
          attach="attributes-color"
          count={count}
          array={colors}
          itemSize={3}
        />
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
