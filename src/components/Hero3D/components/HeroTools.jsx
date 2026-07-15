import { useRef, useState } from 'react';
import { useFrame } from '@react-three/fiber';
import { Text, RoundedBox } from '@react-three/drei';
import { useNavigate } from 'react-router-dom';

const TOOLS = [
  // Left side
  { name: 'JSON', symbol: '{ }', path: '/tools/json-formatter', color: '#FACC15', position: [-4.8, 1.2, 0] },
  { name: 'HTML', symbol: '</>', path: '/tools/html-formatter', color: '#F97316', position: [-5.2, -0.8, 0] },
  { name: 'SQL', symbol: 'SQL', path: '/tools/sql-formatter', color: '#22C55E', position: [-4.5, -2.8, 0] },
  { name: 'Diff', symbol: '⇄', path: '/tools/diff-checker', color: '#EC4899', position: [-5.0, 3.2, 0] },
  // Right side
  { name: 'API', symbol: '⚡', path: '/tools/api-tester', color: '#8B5CF6', position: [4.8, 1.2, 0] },
  { name: 'Base64', symbol: 'B64', path: '/tools/base64', color: '#06B6D4', position: [5.2, -0.8, 0] },
  { name: 'JWT', symbol: '🔑', path: '/tools/jwt-decoder', color: '#EF4444', position: [4.5, -2.8, 0] },
  { name: 'Color', symbol: '◆', path: '/tools/color-converter', color: '#00D9FF', position: [5.0, 3.2, 0] },
];

function ToolIcon({ name, symbol, color, position, path, navigate }) {
  const groupRef = useRef();
  const [hovered, setHovered] = useState(false);
  const offset = useRef(Math.random() * Math.PI * 2);

  useFrame(({ clock }) => {
    if (!groupRef.current) return;
    const t = clock.getElapsedTime();
    groupRef.current.position.y = position[1] + Math.sin(t * 0.8 + offset.current) * 0.15;
    groupRef.current.rotation.y = Math.sin(t * 0.5 + offset.current) * 0.1;
    const scale = hovered ? 1.15 : 1;
    groupRef.current.scale.lerp({ x: scale, y: scale, z: scale }, 0.1);
  });

  return (
    <group
      ref={groupRef}
      position={position}
      onPointerOver={(e) => { e.stopPropagation(); setHovered(true); document.body.style.cursor = 'pointer'; }}
      onPointerOut={() => { setHovered(false); document.body.style.cursor = 'default'; }}
      onClick={(e) => { e.stopPropagation(); navigate(path); }}
    >
      {/* Card background */}
      <RoundedBox args={[1.6, 1.8, 0.15]} radius={0.12} smoothness={4}>
        <meshStandardMaterial
          color={hovered ? color : '#1a1f2e'}
          transparent
          opacity={hovered ? 0.25 : 0.6}
          roughness={0.3}
          metalness={0.4}
        />
      </RoundedBox>

      {/* Border glow */}
      <RoundedBox args={[1.65, 1.85, 0.12]} radius={0.12} smoothness={4}>
        <meshBasicMaterial color={color} transparent opacity={hovered ? 0.4 : 0.15} />
      </RoundedBox>

      {/* Symbol */}
      <Text
        position={[0, 0.15, 0.1]}
        fontSize={0.45}
        color={color}
        anchorX="center"
        anchorY="middle"
        font={undefined}
      >
        {symbol}
      </Text>

      {/* Tool name */}
      <Text
        position={[0, -0.55, 0.1]}
        fontSize={0.2}
        color={hovered ? '#ffffff' : '#8b949e'}
        anchorX="center"
        anchorY="middle"
        font={undefined}
      >
        {name}
      </Text>

      {/* Glow light on hover */}
      {hovered && <pointLight position={[0, 0, 0.5]} intensity={0.8} color={color} distance={2} />}
    </group>
  );
}

function HeroTools({ navigate }) {
  return (
    <group>
      {TOOLS.map((tool) => (
        <ToolIcon key={tool.name} {...tool} navigate={navigate} />
      ))}
    </group>
  );
}

export default HeroTools;
