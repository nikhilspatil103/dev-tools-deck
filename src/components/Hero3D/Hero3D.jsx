import { Suspense, useState, useEffect } from 'react';
import { Canvas } from '@react-three/fiber';
import { OrbitControls, Environment } from '@react-three/drei';
import Workspace from './components/Workspace';
import './Hero3D.css';

function Hero3D() {
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const check = () => setIsMobile(window.innerWidth < 768);
    check();
    window.addEventListener('resize', check);
    return () => window.removeEventListener('resize', check);
  }, []);

  return (
    <div className="hero3d">
      <Canvas
        camera={{ position: [0, 0.5, 8.5], fov: 50 }}
        gl={{
          alpha: true,
          antialias: false,
          powerPreference: 'high-performance',
          stencil: false,
          depth: true,
        }}
        dpr={[1, 1.5]}
        style={{ background: 'transparent' }}
        performance={{ min: 0.5 }}
      >
        <Suspense fallback={null}>
          <Workspace />
          <Environment preset="night" environmentIntensity={0.4} />
        </Suspense>
        <OrbitControls
          enableZoom={false}
          enablePan={false}
          enableRotate={!isMobile}
          maxPolarAngle={Math.PI / 1.8}
          minPolarAngle={Math.PI / 2.2}
          rotateSpeed={0.2}
        />
      </Canvas>
    </div>
  );
}

export default Hero3D;
