import { useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import { Text } from '@react-three/drei';

function CodeBrackets() {
  const groupRef = useRef();

  useFrame((state) => {
    const t = state.clock.getElapsedTime();
    groupRef.current.rotation.y = t * 0.1;
    groupRef.current.position.y = Math.sin(t * 0.4 + 1) * 0.08;
  });

  return (
    <group ref={groupRef}>
      <Text
        position={[-0.25, 0, 0.72]}
        fontSize={0.8}
        color="#5B8CFF"
        anchorX="center"
        anchorY="middle"
        fontWeight="bold"
        outlineWidth={0.02}
        outlineColor="#5B8CFF"
        outlineOpacity={0.4}
      >
        {'{'}
      </Text>
      <Text
        position={[0.25, 0, 0.72]}
        fontSize={0.8}
        color="#00D9FF"
        anchorX="center"
        anchorY="middle"
        fontWeight="bold"
        outlineWidth={0.02}
        outlineColor="#00D9FF"
        outlineOpacity={0.4}
      >
        {'}'}
      </Text>
    </group>
  );
}

export default CodeBrackets;
