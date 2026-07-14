import './PlaygroundStats.css';

function countNodes(obj, stats = { objects: 0, arrays: 0, keys: 0, values: 0, depth: 0 }) {
  if (obj === null || typeof obj !== 'object') {
    stats.values++;
    return stats;
  }
  if (Array.isArray(obj)) {
    stats.arrays++;
    obj.forEach((item) => countNodes(item, stats));
  } else {
    stats.objects++;
    const entries = Object.entries(obj);
    stats.keys += entries.length;
    entries.forEach(([, v]) => countNodes(v, stats));
  }
  return stats;
}

function getDepth(obj) {
  if (obj === null || typeof obj !== 'object') return 0;
  const children = Array.isArray(obj) ? obj : Object.values(obj);
  if (children.length === 0) return 1;
  return 1 + Math.max(...children.map(getDepth));
}

function PlaygroundStats({ data, input }) {
  const stats = data ? countNodes(data) : null;
  const depth = data ? getDepth(data) : 0;
  const chars = input ? input.length : 0;
  const lines = input ? input.split('\n').length : 0;
  const size = input ? new Blob([input]).size : 0;

  const items = [
    { label: 'Objects', value: stats ? stats.objects : 0, accent: '#5B8CFF' },
    { label: 'Arrays', value: stats ? stats.arrays : 0, accent: '#22C55E' },
    { label: 'Keys', value: stats ? stats.keys : 0, accent: '#00D9FF' },
    { label: 'Values', value: stats ? stats.values : 0, accent: '#F59E0B' },
    { label: 'Characters', value: chars, accent: '#A855F7' },
    { label: 'Lines', value: lines, accent: '#EF4444' },
    { label: 'Depth', value: depth, accent: '#34D399' },
    { label: 'File Size', value: size > 1024 ? `${(size / 1024).toFixed(1)}KB` : `${size}B`, accent: '#F472B6' },
  ];

  return (
    <div className="playground-stats">
      {items.map((item) => (
        <div key={item.label} className="playground-stats__card" style={{ '--stat-accent': item.accent }}>
          <span className="playground-stats__value">{item.value}</span>
          <span className="playground-stats__label">{item.label}</span>
        </div>
      ))}
    </div>
  );
}

export default PlaygroundStats;
