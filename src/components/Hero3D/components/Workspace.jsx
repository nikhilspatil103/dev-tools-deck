import { useRef } from 'react';
import { useFrame, useThree } from '@react-three/fiber';
import JsonCube from './JsonCube';
import CodeBrackets from './CodeBrackets';
import DatabaseNode from './DatabaseNode';
import ApiNode from './ApiNode';
import ServerStack from './ServerStack';
import FloatingPanel from './FloatingPanel';
import ConnectionLines from './ConnectionLines';
import Lights from './Lights';

const panels = [
  {
    position: [-3.4, 1.0, 0.8],
    title: 'json-formatter.ts',
    color: '#5B8CFF',
    floatOffset: 0,
    status: { text: '200 OK', color: '#22C55E', bg: '#0d2818' },
    lines: [
      { text: 'const format = (input) => {', color: '#C9D1D9' },
      { text: '  const parsed = JSON.parse(input);', color: '#79C0FF' },
      { text: '  return JSON.stringify(', color: '#C9D1D9' },
      { text: '    parsed, null, 2', color: '#56D364' },
      { text: '  );', color: '#C9D1D9' },
      { text: '};', color: '#C9D1D9' },
    ],
  },
  {
    position: [3.4, 1.0, 0.6],
    title: 'api-tester.js',
    color: '#22C55E',
    floatOffset: 1.5,
    status: { text: 'PASS', color: '#22C55E', bg: '#0d2818' },
    lines: [
      { text: 'await fetch("/api/users", {', color: '#C9D1D9' },
      { text: '  method: "GET",', color: '#79C0FF' },
      { text: '  headers: {', color: '#C9D1D9' },
      { text: '    "Auth": "Bearer ..."', color: '#56D364' },
      { text: '  }', color: '#C9D1D9' },
      { text: '}) // 200 OK - 42ms', color: '#484F58' },
    ],
  },
  {
    position: [-3.2, -1.4, -0.3],
    title: 'changes.diff',
    color: '#EF4444',
    floatOffset: 3,
    status: { text: '+3 -2', color: '#F59E0B', bg: '#2d1b00' },
    lines: [
      { text: '- const legacy = true;', color: '#F85149' },
      { text: '+ const modern = true;', color: '#56D364' },
      { text: '  // core logic', color: '#484F58' },
      { text: '- function old() {}', color: '#F85149' },
      { text: '+ function new() {}', color: '#56D364' },
      { text: '+ export default new;', color: '#56D364' },
    ],
  },
  {
    position: [3.4, -1.8, 0.4],
    title: 'query.sql',
    color: '#00D9FF',
    floatOffset: 4.5,
    status: { text: '50 rows', color: '#00D9FF', bg: '#0a1929' },
    lines: [
      { text: 'SELECT u.name, u.email', color: '#00D9FF' },
      { text: 'FROM users u', color: '#C9D1D9' },
      { text: 'JOIN teams t ON t.id =', color: '#00D9FF' },
      { text: '  u.team_id', color: '#C9D1D9' },
      { text: 'WHERE u.active = true', color: '#00D9FF' },
      { text: 'ORDER BY u.created_at;', color: '#A1A1AA' },
    ],
  },
];

const connectionTargets = [
  { position: [-3.4, 1.0, 0.8], color: '#5B8CFF' },
  { position: [3.4, 1.0, 0.6], color: '#22C55E' },
  { position: [-3.2, -1.4, -0.3], color: '#EF4444' },
  { position: [3.4, -1.8, 0.4], color: '#00D9FF' },
  { position: [-2.8, 3.0, -1.0], color: '#5B8CFF' },
  { position: [2.8, 3.2, -0.6], color: '#22C55E' },
  { position: [0.5, -2.5, 0.6], color: '#00D9FF' },
];

function Workspace() {
  const groupRef = useRef();
  const { viewport } = useThree();

  useFrame((state) => {
    const t = state.clock.getElapsedTime();
    const { pointer } = state;
    groupRef.current.rotation.y = t * 0.15 + pointer.x * 0.1;
    groupRef.current.rotation.x = Math.sin(t * 0.1) * 0.03 + pointer.y * 0.05;
  });

  const scale = Math.min(viewport.width / 12, 0.85);

  return (
    <group ref={groupRef} scale={scale}>
      <Lights />
      <JsonCube />
      <CodeBrackets />
      <DatabaseNode position={[-2.8, 3.0, -1.0]} floatOffset={3} />
      <ApiNode position={[2.8, 3.2, -0.6]} floatOffset={1} />
      <ServerStack position={[0.5, -2.5, 0.6]} floatOffset={2.5} />
      <ConnectionLines targets={connectionTargets} />
      {panels.map((panel, i) => (
        <FloatingPanel
          key={i}
          position={panel.position}
          title={panel.title}
          lines={panel.lines}
          color={panel.color}
          floatOffset={panel.floatOffset}
          status={panel.status}
        />
      ))}
    </group>
  );
}

export default Workspace;
