import { useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import { Text } from '@react-three/drei';

function DatabaseNode({ position = [-2.2, 1.2, -0.8], floatOffset = 0 }) {
  const groupRef = useRef();
  const initialY = position[1];

  useFrame((state) => {
    const t = state.clock.getElapsedTime();
    groupRef.current.position.y = initialY + Math.sin(t * 0.7 + floatOffset) * 0.12;
    groupRef.current.rotation.y = t * 0.12 + floatOffset;
  });

  return (
    <group ref={groupRef} position={position}>
      {[0.2, 0, -0.2].map((y, i) => (
        <mesh key={i} position={[0, y, 0]}>
          <cylinderGeometry args={[0.4, 0.4, 0.1, 16]} />
          <meshStandardMaterial color="#5B8CFF" transparent opacity={0.3 - i * 0.05} roughness={0.2} />
        </mesh>
      ))}
      <Text position={[0, -0.45, 0]} fontSize={0.1} color="#5B8CFF" anchorX="center" anchorY="middle">
        PostgreSQL
      </Text>
    </group>
  );
}

export default DatabaseNode;
