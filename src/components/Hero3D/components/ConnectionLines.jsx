import { useRef, useMemo } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';

function ConnectionLines({ targets }) {
  const orbsRef = useRef([]);
  const center = useMemo(() => new THREE.Vector3(0, 0, 0), []);

  const curves = useMemo(() => {
    return targets.map((target) => {
      const end = new THREE.Vector3(...target.position);
      const mid = new THREE.Vector3().lerpVectors(center, end, 0.5);
      mid.y += 0.4;
      return new THREE.QuadraticBezierCurve3(center, mid, end);
    });
  }, [targets, center]);

  useFrame((state) => {
    const t = state.clock.getElapsedTime();
    orbsRef.current.forEach((mesh, i) => {
      if (!mesh) return;
      const progress = ((t * 0.2 + i * 0.12) % 1);
      const point = curves[i].getPoint(progress);
      mesh.position.copy(point);
    });
  });

  return (
    <group>
      {targets.map((target, i) => (
        <mesh
          key={i}
          ref={(el) => { orbsRef.current[i] = el; }}
        >
          <sphereGeometry args={[0.04, 8, 8]} />
          <meshBasicMaterial color={target.color} transparent opacity={0.8} />
        </mesh>
      ))}
    </group>
  );
}

export default ConnectionLines;
