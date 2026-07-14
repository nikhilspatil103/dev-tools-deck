import { useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import { Text } from '@react-three/drei';

function ApiNode({ position = [2.5, 0.8, 0.3], floatOffset = 1 }) {
  const groupRef = useRef();
  const initialY = position[1];

  useFrame((state) => {
    const t = state.clock.getElapsedTime();
    groupRef.current.position.y = initialY + Math.sin(t * 0.7 + floatOffset) * 0.12;
    groupRef.current.rotation.y = t * 0.15;
  });

  return (
    <group ref={groupRef} position={position}>
      <mesh>
        <icosahedronGeometry args={[0.4, 0]} />
        <meshStandardMaterial color="#22C55E" transparent opacity={0.25} roughness={0.2} />
      </mesh>
      <mesh>
        <icosahedronGeometry args={[0.42, 0]} />
        <meshBasicMaterial color="#22C55E" transparent opacity={0.08} wireframe />
      </mesh>
      <Text position={[0, -0.6, 0]} fontSize={0.1} color="#22C55E" anchorX="center" anchorY="middle">
        API
      </Text>
    </group>
  );
}

export default ApiNode;
