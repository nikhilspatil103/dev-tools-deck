import { useRef, useMemo } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { RoundedBox, Edges, Text } from '@react-three/drei';
import * as THREE from 'three';
import './Logo3D.css';

function Particle({ position, color, speed, offset }) {
  const ref = useRef();

  useFrame((state) => {
    const t = state.clock.getElapsedTime() * speed + offset;
    ref.current.position.y = position[1] + Math.sin(t) * 0.6;
    ref.current.position.x = position[0] + Math.cos(t * 0.7) * 0.3;
    ref.current.material.opacity = 0.4 + Math.sin(t * 2) * 0.3;
  });

  return (
    <mesh ref={ref} position={position}>
      <sphereGeometry args={[0.03, 6, 6]} />
      <meshBasicMaterial color={color} transparent opacity={0.5} />
    </mesh>
  );
}

function LogoMesh() {
  const groupRef = useRef();
  const layer1 = useRef();
  const layer2 = useRef();
  const layer3 = useRef();
  const ringRef = useRef();

  const lineGeometry = useMemo(() => {
    const points = [
      new THREE.Vector3(0.55, 0.4, 0.4),
      new THREE.Vector3(0.65, 0, 0.45),
      new THREE.Vector3(0.55, -0.4, 0.4),
    ];
    return new THREE.BufferGeometry().setFromPoints(points);
  }, []);

  const lineGeometry2 = useMemo(() => {
    const points = [
      new THREE.Vector3(-0.55, 0.4, 0.4),
      new THREE.Vector3(-0.65, 0, 0.45),
      new THREE.Vector3(-0.55, -0.4, 0.4),
    ];
    return new THREE.BufferGeometry().setFromPoints(points);
  }, []);

  useFrame((state) => {
    const t = state.clock.getElapsedTime();

    // Main group rotation
    groupRef.current.rotation.y = t * 0.5;
    groupRef.current.rotation.x = Math.sin(t * 0.4) * 0.15;
    groupRef.current.rotation.z = Math.cos(t * 0.3) * 0.05;

    // Spread/collapse breathing - layers move apart and together
    const spread = Math.sin(t * 0.6) * 0.15;

    // Layer 1 - top: floats up, tilts, rotates independently
    layer1.current.position.y = 0.4 + spread + Math.sin(t * 1.2) * 0.06;
    layer1.current.position.x = 0.06 + Math.sin(t * 0.9) * 0.04;
    layer1.current.position.z = 0.06 + Math.cos(t * 0.7) * 0.03;
    layer1.current.rotation.z = Math.sin(t * 0.8) * 0.08;
    layer1.current.rotation.x = Math.cos(t * 0.6) * 0.05;

    // Layer 2 - middle: sways side to side
    layer2.current.position.y = Math.sin(t * 1.0 + 1) * 0.06;
    layer2.current.position.x = Math.sin(t * 0.7 + 0.5) * 0.06;
    layer2.current.position.z = Math.cos(t * 0.9) * 0.04;
    layer2.current.rotation.z = Math.sin(t * 0.7 + 1) * 0.06;
    layer2.current.rotation.x = Math.cos(t * 0.5 + 1) * 0.04;

    // Layer 3 - bottom: floats down, counter-tilts
    layer3.current.position.y = -0.4 - spread + Math.sin(t * 1.1 + 2) * 0.06;
    layer3.current.position.x = -0.06 + Math.cos(t * 0.8 + 1) * 0.05;
    layer3.current.position.z = -0.06 + Math.sin(t * 0.6 + 2) * 0.03;
    layer3.current.rotation.z = Math.sin(t * 0.9 + 2) * 0.08;
    layer3.current.rotation.x = Math.cos(t * 0.7 + 2) * 0.05;

    // Orbiting ring
    ringRef.current.rotation.z = t * 0.5;
    ringRef.current.rotation.x = Math.sin(t * 0.25) * 0.4;
  });

  return (
    <group ref={groupRef}>
      {/* Outer orbiting ring */}
      <group ref={ringRef}>
        <mesh>
          <torusGeometry args={[1.2, 0.01, 8, 64]} />
          <meshBasicMaterial color="#5B8CFF" transparent opacity={0.35} />
        </mesh>
        <mesh position={[1.2, 0, 0]}>
          <sphereGeometry args={[0.04, 8, 8]} />
          <meshBasicMaterial color="#00D9FF" />
        </mesh>
        <mesh position={[-1.2, 0, 0]}>
          <sphereGeometry args={[0.03, 8, 8]} />
          <meshBasicMaterial color="#5B8CFF" />
        </mesh>
      </group>

      {/* Top layer - Blue */}
      <group ref={layer1}>
        <RoundedBox args={[1.1, 0.16, 0.7]} radius={0.04} smoothness={3}>
          <meshStandardMaterial color="#5B8CFF" transparent opacity={0.7} roughness={0.2} metalness={0.6} />
        </RoundedBox>
        <RoundedBox args={[1.1, 0.16, 0.7]} radius={0.04} smoothness={3}>
          <meshBasicMaterial visible={false} />
          <Edges threshold={1} color="#5B8CFF" transparent opacity={0.9} />
        </RoundedBox>
        <Text position={[0, 0, 0.36]} fontSize={0.08} color="#ffffff" anchorX="center" anchorY="middle" opacity={0.7}>
          {'{ }'}
        </Text>
        <mesh position={[0.5, 0, 0.32]}>
          <sphereGeometry args={[0.025, 6, 6]} />
          <meshBasicMaterial color="#ffffff" transparent opacity={0.8} />
        </mesh>
        <mesh position={[-0.5, 0, 0.32]}>
          <sphereGeometry args={[0.025, 6, 6]} />
          <meshBasicMaterial color="#ffffff" transparent opacity={0.8} />
        </mesh>
      </group>

      {/* Middle layer - Cyan */}
      <group ref={layer2}>
        <RoundedBox args={[1.1, 0.16, 0.7]} radius={0.04} smoothness={3}>
          <meshStandardMaterial color="#00D9FF" transparent opacity={0.6} roughness={0.2} metalness={0.6} />
        </RoundedBox>
        <RoundedBox args={[1.1, 0.16, 0.7]} radius={0.04} smoothness={3}>
          <meshBasicMaterial visible={false} />
          <Edges threshold={1} color="#00D9FF" transparent opacity={0.9} />
        </RoundedBox>
        <Text position={[0, 0, 0.36]} fontSize={0.08} color="#ffffff" anchorX="center" anchorY="middle" opacity={0.7}>
          {'</>'}
        </Text>
        <mesh position={[0.5, 0, 0.32]}>
          <sphereGeometry args={[0.025, 6, 6]} />
          <meshBasicMaterial color="#ffffff" transparent opacity={0.8} />
        </mesh>
        <mesh position={[-0.5, 0, 0.32]}>
          <sphereGeometry args={[0.025, 6, 6]} />
          <meshBasicMaterial color="#ffffff" transparent opacity={0.8} />
        </mesh>
      </group>

      {/* Bottom layer - Green */}
      <group ref={layer3}>
        <RoundedBox args={[1.1, 0.16, 0.7]} radius={0.04} smoothness={3}>
          <meshStandardMaterial color="#22C55E" transparent opacity={0.5} roughness={0.2} metalness={0.6} />
        </RoundedBox>
        <RoundedBox args={[1.1, 0.16, 0.7]} radius={0.04} smoothness={3}>
          <meshBasicMaterial visible={false} />
          <Edges threshold={1} color="#22C55E" transparent opacity={0.9} />
        </RoundedBox>
        <Text position={[0, 0, 0.36]} fontSize={0.08} color="#ffffff" anchorX="center" anchorY="middle" opacity={0.7}>
          SQL
        </Text>
        <mesh position={[0.5, 0, 0.32]}>
          <sphereGeometry args={[0.025, 6, 6]} />
          <meshBasicMaterial color="#ffffff" transparent opacity={0.8} />
        </mesh>
        <mesh position={[-0.5, 0, 0.32]}>
          <sphereGeometry args={[0.025, 6, 6]} />
          <meshBasicMaterial color="#ffffff" transparent opacity={0.8} />
        </mesh>
      </group>

      {/* Connection lines */}
      <line geometry={lineGeometry}>
        <lineBasicMaterial color="#5B8CFF" transparent opacity={0.3} />
      </line>
      <line geometry={lineGeometry2}>
        <lineBasicMaterial color="#00D9FF" transparent opacity={0.3} />
      </line>

      {/* Floating particles */}
      <Particle position={[0.8, 0.2, 0.5]} color="#5B8CFF" speed={0.6} offset={0} />
      <Particle position={[-0.7, -0.1, 0.6]} color="#00D9FF" speed={0.8} offset={1.5} />
      <Particle position={[0.6, -0.3, -0.5]} color="#22C55E" speed={0.7} offset={3} />
      <Particle position={[-0.9, 0.4, -0.3]} color="#5B8CFF" speed={0.5} offset={4.5} />
      <Particle position={[0.3, 0.5, 0.7]} color="#00D9FF" speed={0.9} offset={2} />

      {/* Center glow */}
      <mesh>
        <sphereGeometry args={[0.15, 10, 10]} />
        <meshBasicMaterial color="#00D9FF" transparent opacity={0.2} />
      </mesh>
    </group>
  );
}

function Logo3D({ size = 36 }) {
  return (
    <div className="logo3d" style={{ width: size, height: size }}>
      <Canvas
        camera={{ position: [0, 0, 3.2], fov: 50 }}
        gl={{ alpha: true, antialias: true, powerPreference: 'low-power' }}
        dpr={[1, 2]}
        style={{ background: 'transparent' }}
      >
        <ambientLight intensity={0.5} />
        <pointLight position={[2, 2, 2]} intensity={1} color="#5B8CFF" />
        <pointLight position={[-2, -1, 1]} intensity={0.5} color="#00D9FF" />
        <pointLight position={[0, -2, 1]} intensity={0.3} color="#22C55E" />
        <LogoMesh />
      </Canvas>
    </div>
  );
}

export default Logo3D;
