import { useState } from 'react';
import './TreeView.css';

function TreeNode({ keyName, value, depth = 0 }) {
  const [expanded, setExpanded] = useState(depth < 2);
  const isObject = value !== null && typeof value === 'object';
  const isArray = Array.isArray(value);
  const entries = isObject ? Object.entries(value) : [];

  if (!isObject) {
    const valueClass = typeof value === 'string' ? 'tree-node__val--string'
      : typeof value === 'number' ? 'tree-node__val--number'
      : typeof value === 'boolean' ? 'tree-node__val--boolean'
      : 'tree-node__val--null';

    return (
      <div className="tree-node tree-node--leaf" style={{ paddingLeft: depth * 16 }}>
        <span className="tree-node__key">{keyName}</span>
        <span className="tree-node__colon">:</span>
        <span className={`tree-node__val ${valueClass}`}>
          {typeof value === 'string' ? `"${value}"` : String(value)}
        </span>
      </div>
    );
  }

  return (
    <div className="tree-node" style={{ paddingLeft: depth * 16 }}>
      <button className="tree-node__toggle" onClick={() => setExpanded(!expanded)}>
        <span className={`tree-node__arrow ${expanded ? 'tree-node__arrow--open' : ''}`}>▶</span>
        <span className="tree-node__key">{keyName}</span>
        <span className="tree-node__type">{isArray ? `[${entries.length}]` : `{${entries.length}}`}</span>
      </button>
      {expanded && (
        <div className="tree-node__children">
          {entries.map(([k, v]) => (
            <TreeNode key={k} keyName={k} value={v} depth={depth + 1} />
          ))}
        </div>
      )}
    </div>
  );
}

function TreeView({ data }) {
  if (!data) {
    return <div className="tree-view__empty">Parse valid JSON to see tree view</div>;
  }

  return (
    <div className="tree-view">
      <TreeNode keyName="root" value={data} depth={0} />
    </div>
  );
}

export default TreeView;
