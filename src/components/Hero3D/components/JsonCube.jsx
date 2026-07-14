import { useRef, useMemo } from 'react';
import { useFrame } from '@react-three/fiber';
import { Text, Edges } from '@react-three/drei';
import * as THREE from 'three';

const lightColors = ['#1355ef', '#1aec67', '#00D9FF', '#7f07ef', '#F59E0B', '#ed0808', '#de197f'];

function RandomLights({ count = 12 }) {
  const ref = useRef();
  const lights = useMemo(() => {
    return Array.from({ length: count }, (_, i) => ({
      color: lightColors[i % lightColors.length],
      speed: 0.3 + Math.random() * 0.5,
      radius: 1.8 + Math.random() * 1.2,
      yOffset: (Math.random() - 0.5) * 2.5,
      phase: (i / count) * Math.PI * 2,
    }));
  }, [count]);

  useFrame((state) => {
    const t = state.clock.getElapsedTime();
    ref.current.children.forEach((child, i) => {
      const l = lights[i];
      const angle = t * l.speed + l.phase;
      child.position.x = Math.sin(angle) * l.radius;
      child.position.z = Math.cos(angle) * l.radius;
      child.position.y = l.yOffset + Math.sin(t * 0.8 + l.phase) * 0.3;
      child.material.opacity = 0.5 + Math.sin(t * 1.5 + l.phase) * 0.3;
    });
  });

  return (
    <group ref={ref}>
      {lights.map((l, i) => (
        <mesh key={i}>
          <sphereGeometry args={[0.04, 8, 8]} />
          <meshBasicMaterial color={l.color} transparent opacity={0.7} />
        </mesh>
      ))}
    </group>
  );
}

function HexFace({ position, rotation, icon, label, accent }) {
  return (
    <group position={position} rotation={rotation}>
      <mesh position={[0, 0, 0.01]}>
        <planeGeometry args={[0.95, 1.8]} />
        <meshBasicMaterial color="#010409" transparent opacity={0.88} />
      </mesh>
      <mesh position={[0, 0.85, 0.02]}>
        <planeGeometry args={[0.85, 0.008]} />
        <meshBasicMaterial color={accent} />
      </mesh>
      <Text
        position={[0, 0.15, 0.02]}
        fontSize={0.5}
        color={accent}
        anchorX="center"
        anchorY="middle"
      >
        {icon}
      </Text>
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
    </group>
  );
}

function JsonCube() {
  const groupRef = useRef();

  const hexGeometry = useMemo(() => {
    return new THREE.CylinderGeometry(1.2, 1.2, 2.0, 8, 1);
  }, []);

  useFrame((state) => {
    const t = state.clock.getElapsedTime();
    groupRef.current.rotation.y = t * 0.15;
    groupRef.current.position.y = Math.sin(t * 0.45) * 0.1;
  });

  const faces = [
    { icon: '{ }', label: 'JSON', accent: '#5B8CFF' },
    { icon: '⚡', label: 'API', accent: '#22C55E' },
    { icon: '◈', label: 'SQL', accent: '#00D9FF' },
    { icon: '< />', label: 'XML', accent: '#F59E0B' },
    { icon: '±', label: 'DIFF', accent: '#EF4444' },
    { icon: '⬡', label: 'YAML', accent: '#A855F7' },
    { icon: 'B64', label: 'Base64', accent: '#F472B6' },
    { icon: '.*', label: 'Regex', accent: '#34D399' },
  ];

  const faceRadius = 1.21;

  return (
    <group ref={groupRef}>
      {/* Glass prism */}
      <mesh geometry={hexGeometry}>
        <meshStandardMaterial
          color="#1a2035"
          transparent
          opacity={0.15}
          roughness={0.1}
          metalness={0.1}
        />
      </mesh>

      {/* Edges */}
      <mesh geometry={hexGeometry}>
        <meshBasicMaterial visible={false} />
        <Edges threshold={1} color="#5B8CFF" transparent opacity={0.4} />
      </mesh>

      {/* Faces */}
      {faces.map((face, i) => {
        const angle = (i * Math.PI * 2) / 8 + Math.PI / 8;
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

      {/* Top ring */}
      <mesh position={[0, 1.02, 0]} rotation={[-Math.PI / 2, 0, 0]}>
        <ringGeometry args={[0.6, 0.62, 8]} />
        <meshBasicMaterial color="#00D9FF" transparent opacity={0.2} />
      </mesh>

      {/* Bottom ring */}
      <mesh position={[0, -1.02, 0]} rotation={[Math.PI / 2, 0, 0]}>
        <ringGeometry args={[0.6, 0.62, 8]} />
        <meshBasicMaterial color="#5B8CFF" transparent opacity={0.2} />
      </mesh>

      {/* Middle ring */}
      <mesh rotation={[Math.PI / 2, 0, 0]}>
        <torusGeometry args={[1.35, 0.006, 6, 8]} />
        <meshBasicMaterial color="#00D9FF" transparent opacity={0.25} />
      </mesh>

      {/* Random floating lights */}
      <RandomLights />
    </group>
  );
}

export default JsonCube;
