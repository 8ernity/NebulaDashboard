import { Canvas, useFrame, useThree } from '@react-three/fiber';
import { OrbitControls, PerspectiveCamera } from '@react-three/drei';
import { EffectComposer, Bloom, Noise, Vignette } from '@react-three/postprocessing';
import { Starfield } from './Starfield';
import { MilkyWay } from './MilkyWay';
import { Stars } from './Stars';
import { Suspense, useRef, useEffect } from 'react';
import * as THREE from 'three';

function CameraManager({ selectedStar, setSelectedStar }) {
  const initialPos = new THREE.Vector3(0, 0, 80);
  const initialLookAt = new THREE.Vector3(0, 0, 0);
  const isResetting = useRef(false);
  const isFocusing = useRef(false);
  const lastSelectedStar = useRef(null);
  const { camera, controls } = useThree();

  // Listen for user interaction to stop auto-focus/reset
  useEffect(() => {
    if (!controls) return;
    const stopAuto = () => {
      isFocusing.current = false;
      isResetting.current = false;
    };
    controls.addEventListener('start', stopAuto);
    return () => controls.removeEventListener('start', stopAuto);
  }, [controls]);

  useFrame(() => {
    if (!controls) return;

    if (selectedStar !== lastSelectedStar.current) {
      if (selectedStar) {
        isFocusing.current = true;
        isResetting.current = false;
      } else {
        isFocusing.current = false;
        isResetting.current = true;
      }
      lastSelectedStar.current = selectedStar;
    }

    if (selectedStar && isFocusing.current) {
      const targetPos = new THREE.Vector3(selectedStar.position.x, selectedStar.position.y, selectedStar.position.z);
      const camTargetPos = new THREE.Vector3(selectedStar.position.x, selectedStar.position.y, selectedStar.position.z + 18);

      camera.position.lerp(camTargetPos, 0.1);
      controls.target.lerp(targetPos, 0.1);

      if (camera.position.distanceTo(camTargetPos) < 0.5) {
        isFocusing.current = false;
      }
    } else if (isResetting.current) {
      camera.position.lerp(initialPos, 0.08);
      controls.target.lerp(initialLookAt, 0.08);

      if (camera.position.distanceTo(initialPos) < 0.5) {
        isResetting.current = false;
      }
    }
  });

  return null;
}

export default function Universe({ selectedStar, setSelectedStar, searchQuery, historyData }) {
  return (
    <div style={{ 
      width: '100%', 
      height: '100vh', 
      position: 'relative', 
      background: '#050505'
    }}>
      <Canvas
        shadows
        camera={{ position: [0, 0, 80], fov: 60 }}
        gl={{ 
          antialias: true, 
          stencil: false, 
          depth: true,
          powerPreference: "high-performance"
        }}
        dpr={[1, 2]}
      >
        <color attach="background" args={['#050505']} />
        
        <ambientLight intensity={0.5} />
        <pointLight position={[10, 10, 10]} intensity={1.2} color="#ffffff" />
        
        <Starfield count={30000} isSearching={searchQuery !== ''} />
        <MilkyWay isSearching={searchQuery !== ''} />
        <Stars 
          selectedStar={selectedStar} 
          setSelectedStar={setSelectedStar} 
          searchQuery={searchQuery}
          historyData={historyData}
        />
        
        {/* Click background to deselect */}
        <mesh 
          position={[0,0,0]} 
          onPointerDown={(e) => {
            e.stopPropagation();
            if (selectedStar) setSelectedStar(null);
          }}
        >
          <sphereGeometry args={[500, 16, 16]} />
          <meshBasicMaterial transparent opacity={0} side={THREE.BackSide} />
        </mesh>
        
        <OrbitControls 
          makeDefault
          enableDamping 
          dampingFactor={0.05}
          rotateSpeed={0.5}
          zoomSpeed={0.8}
          minDistance={5}
          maxDistance={400}
        />

        <Suspense fallback={null}>
          <EffectComposer disableNormalPass multisampling={8}>
            <Bloom 
              intensity={0.6} 
              luminanceThreshold={0.35} 
              luminanceSmoothing={0.2} 
              mipmapBlur
            />
            <Vignette eskil={false} offset={0.05} darkness={1.2} />
          </EffectComposer>
        </Suspense>

        <CameraManager selectedStar={selectedStar} setSelectedStar={setSelectedStar} />
      </Canvas>




      {/* UI removed in favor of Dashboard */}
    </div>
  );
}
