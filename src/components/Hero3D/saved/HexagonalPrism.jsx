import { useRef, useMemo } from 'react';
import { useFrame } from '@react-three/fiber';
import { Text, Edges } from '@react-three/drei';
import * as THREE from 'three';

function HexFace({ position, rotation, icon, label, accent }) {
  return (
    <group position={position} rotation={rotation}>
      {/* Dark background */}
      <mesh position={[0, 0, 0.01]}>
        <planeGeometry args={[0.95, 1.8]} />
        <meshBasicMaterial color="#010409" transparent opacity={0.88} />
      </mesh>

      {/* Top accent bar */}
      <mesh position={[0, 0.85, 0.02]}>
        <planeGeometry args={[0.85, 0.008]} />
        <meshBasicMaterial color={accent} />
      </mesh>

      {/* Large icon */}
      <Text
        position={[0, 0.15, 0.02]}
        fontSize={0.5}
        color={accent}
        anchorX="center"
        anchorY="middle"
        outlineWidth={0.012}
        outlineColor={accent}
        outlineOpacity={0.35}
      >
        {icon}
      </Text>

      {/* Label */}
      <Text
        position={[0, -0.4, 0.02]}
        fontSize={0.12}
        color="#E6EDF3"
        anchorX="center"
        anchorY="middle"
        letterSpacing={0.06}
      >
        {label}
      </Text>

      {/* Bottom accent dot */}
      <mesh position={[0, -0.7, 0.02]}>
        <circleGeometry args={[0.03, 12]} />
        <meshBasicMaterial color={accent} transparent opacity={0.6} />
      </mesh>
    </group>
  );
}

function JsonCube() {
  const groupRef = useRef();

  const hexGeometry = useMemo(() => {
    return new THREE.CylinderGeometry(1.0, 1.0, 2.0, 6, 1);
  }, []);

  useFrame((state) => {
    const t = state.clock.getElapsedTime();
    groupRef.current.rotation.y = t * 0.1;
    groupRef.current.rotation.x = Math.sin(t * 0.2) * 0.03;
    groupRef.current.position.y = Math.sin(t * 0.35) * 0.12;
  });

  const faces = [
    { icon: '{ }', label: 'JSON', accent: '#5B8CFF' },
    { icon: '⚡', label: 'API', accent: '#22C55E' },
    { icon: '◈', label: 'SQL', accent: '#00D9FF' },
    { icon: '< />', label: 'XML', accent: '#F59E0B' },
    { icon: '±', label: 'DIFF', accent: '#EF4444' },
    { icon: '⬡', label: 'YAML', accent: '#A855F7' },
  ];

  const faceRadius = 1.01;

  return (
    <group ref={groupRef}>
      {/* Glass hexagonal prism */}
      <mesh geometry={hexGeometry}>
        <meshPhysicalMaterial
          color="#0a0f1a"
          transparent
          opacity={0.07}
          roughness={0.0}
          metalness={0.02}
          transmission={0.96}
          thickness={2.0}
          clearcoat={1}
          clearcoatRoughness={0.01}
          envMapIntensity={2.5}
          ior={2.0}
          reflectivity={1}
        />
      </mesh>

      {/* Edges */}
      <mesh geometry={hexGeometry}>
        <meshBasicMaterial visible={false} />
        <Edges threshold={1} color="#5B8CFF" lineWidth={2} transparent opacity={0.5} />
      </mesh>

      {/* Face content - positioned on each of the 6 sides */}
      {faces.map((face, i) => {
        const angle = (i * Math.PI * 2) / 6 + Math.PI / 6;
        const x = Math.sin(angle) * faceRadius;
        const z = Math.cos(angle) * faceRadius;
        return (
          <HexFace
            key={i}
            position={[x, 0, z]}
            rotation={[0, angle, 0]}
            icon={face.icon}
            label={face.label}
            accent={face.accent}
          />
        );
      })}

      {/* Top cap glow */}
      <mesh position={[0, 1.01, 0]} rotation={[-Math.PI / 2, 0, 0]}>
        <circleGeometry args={[0.95, 6]} />
        <meshBasicMaterial color="#5B8CFF" transparent opacity={0.04} />
      </mesh>
      <mesh position={[0, 1.02, 0]} rotation={[-Math.PI / 2, 0, Math.PI / 6]}>
        <ringGeometry args={[0.5, 0.52, 6]} />
        <meshBasicMaterial color="#00D9FF" transparent opacity={0.2} />
      </mesh>

      {/* Bottom cap glow */}
      <mesh position={[0, -1.01, 0]} rotation={[Math.PI / 2, 0, 0]}>
        <circleGeometry args={[0.95, 6]} />
        <meshBasicMaterial color="#00D9FF" transparent opacity={0.04} />
      </mesh>
      <mesh position={[0, -1.02, 0]} rotation={[Math.PI / 2, 0, Math.PI / 6]}>
        <ringGeometry args={[0.5, 0.52, 6]} />
        <meshBasicMaterial color="#5B8CFF" transparent opacity={0.2} />
      </mesh>

      {/* Holographic rings around prism */}
      <mesh rotation={[Math.PI / 2, 0, 0]} position={[0, 0.6, 0]}>
        <torusGeometry args={[1.15, 0.006, 8, 6]} />
        <meshBasicMaterial color="#5B8CFF" transparent opacity={0.3} />
      </mesh>
      <mesh rotation={[Math.PI / 2, 0, 0]} position={[0, 0, 0]}>
        <torusGeometry args={[1.2, 0.008, 8, 6]} />
        <meshBasicMaterial color="#00D9FF" transparent opacity={0.25} />
      </mesh>
      <mesh rotation={[Math.PI / 2, 0, 0]} position={[0, -0.6, 0]}>
        <torusGeometry args={[1.15, 0.006, 8, 6]} />
        <meshBasicMaterial color="#A855F7" transparent opacity={0.2} />
      </mesh>

      {/* Platform base */}
      <mesh position={[0, -1.3, 0]} rotation={[-Math.PI / 2, 0, 0]}>
        <ringGeometry args={[1.0, 1.5, 6]} />
        <meshBasicMaterial color="#5B8CFF" transparent opacity={0.05} />
      </mesh>
      <mesh position={[0, -1.3, 0]} rotation={[-Math.PI / 2, 0, Math.PI / 6]}>
        <ringGeometry args={[1.2, 1.25, 6]} />
        <meshBasicMaterial color="#00D9FF" transparent opacity={0.12} />
      </mesh>

      {/* Core lighting */}
      <pointLight position={[0, 0, 0]} color="#5B8CFF" intensity={0.8} distance={5} />
      <pointLight position={[0, 1.2, 0]} color="#00D9FF" intensity={0.3} distance={3} />
      <pointLight position={[0, -1.2, 0]} color="#A855F7" intensity={0.3} distance={3} />
    </group>
  );
}

export default JsonCube;
