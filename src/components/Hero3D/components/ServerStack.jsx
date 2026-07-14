import { useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import { Text, RoundedBox } from '@react-three/drei';

function ServerStack({ position = [2.4, -1.0, -0.5], floatOffset = 2 }) {
  const groupRef = useRef();
  const initialY = position[1];

  useFrame((state) => {
    const t = state.clock.getElapsedTime();
    groupRef.current.position.y = initialY + Math.sin(t * 0.6 + floatOffset) * 0.1;
  });

  const ledColors = ['#22C55E', '#5B8CFF', '#F59E0B'];

  return (
    <group ref={groupRef} position={position}>
      {[0.28, 0, -0.28].map((y, i) => (
        <group key={i} position={[0, y, 0]}>
          <RoundedBox args={[0.7, 0.2, 0.45]} radius={0.03} smoothness={2}>
            <meshStandardMaterial color="#0d1117" transparent opacity={0.8} roughness={0.3} />
          </RoundedBox>
          <mesh position={[0.28, 0, 0.23]}>
            <circleGeometry args={[0.02, 8]} />
            <meshBasicMaterial color={ledColors[i]} />
          </mesh>
        </group>
      ))}
      <Text position={[0, -0.55, 0]} fontSize={0.09} color="#00D9FF" anchorX="center" anchorY="middle">
        Server
      </Text>
    </group>
  );
}

export default ServerStack;
