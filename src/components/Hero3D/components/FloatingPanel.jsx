import { useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import { Text, RoundedBox } from '@react-three/drei';

function FloatingPanel({ position, title, lines, color = '#5B8CFF', floatOffset = 0, status }) {
  const groupRef = useRef();
  const initialY = position[1];

  useFrame((state) => {
    const t = state.clock.getElapsedTime();
    groupRef.current.position.y = initialY + Math.sin(t * 0.6 + floatOffset) * 0.1;
  });

  return (
    <group ref={groupRef} position={position}>
      <RoundedBox args={[2.4, 1.6, 0.04]} radius={0.08} smoothness={4}>
        <meshStandardMaterial color="#0d1117" transparent opacity={0.92} roughness={0.2} />
      </RoundedBox>

      {/* Code area bg */}
      <mesh position={[0, -0.1, 0.021]}>
        <planeGeometry args={[2.25, 1.15]} />
        <meshBasicMaterial color="#010409" />
      </mesh>

      {/* Title bar */}
      <mesh position={[0, 0.62, 0.021]}>
        <planeGeometry args={[2.4, 0.32]} />
        <meshBasicMaterial color="#161b22" />
      </mesh>

      {/* Accent line */}
      <mesh position={[0, 0.78, 0.022]}>
        <planeGeometry args={[2.3, 0.012]} />
        <meshBasicMaterial color={color} />
      </mesh>

      {/* Window dots */}
      <mesh position={[-0.95, 0.62, 0.025]}>
        <circleGeometry args={[0.03, 8]} />
        <meshBasicMaterial color="#EF4444" />
      </mesh>
      <mesh position={[-0.85, 0.62, 0.025]}>
        <circleGeometry args={[0.03, 8]} />
        <meshBasicMaterial color="#F59E0B" />
      </mesh>
      <mesh position={[-0.75, 0.62, 0.025]}>
        <circleGeometry args={[0.03, 8]} />
        <meshBasicMaterial color="#22C55E" />
      </mesh>

      {/* Title */}
      <Text
        position={[0, 0.62, 0.026]}
        fontSize={0.1}
        color="#E6EDF3"
        anchorX="center"
        anchorY="middle"
      >
        {title}
      </Text>

      {/* Status */}
      {status && (
        <Text
          position={[0.85, 0.62, 0.026]}
          fontSize={0.065}
          color={status.color || '#22C55E'}
          anchorX="center"
          anchorY="middle"
        >
          {status.text}
        </Text>
      )}

      {/* Code lines */}
      {lines.map((line, i) => (
        <Text
          key={i}
          position={[-0.95, 0.3 - i * 0.19, 0.025]}
          fontSize={0.085}
          color={line.color || '#E6EDF3'}
          anchorX="left"
          anchorY="middle"
        >
          {line.text}
        </Text>
      ))}

      {/* Bottom bar */}
      <mesh position={[0, -0.72, 0.021]}>
        <planeGeometry args={[2.4, 0.14]} />
        <meshBasicMaterial color="#161b22" />
      </mesh>
    </group>
  );
}

export default FloatingPanel;
