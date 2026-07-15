import { useState, useCallback, useRef, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import MonacoEditor from '@monaco-editor/react';
import { useTheme, useToolTheme } from '../../hooks/useTheme';
import { storage } from '../../utils/storage';
import './JsonFormatter.css';
import Logo3D from '../../components/Logo3D/Logo3D';

const SAMPLE_JSON = `{
  "name": "DevToolsDeck Pro",
  "version": "2.0.0",
  "description": "Premium developer tools platform",
  "author": {
    "name": "DevToolsDeck Team",
    "email": "team@devtools.io"
  },
  "features": ["JSON Formatter", "API Tester", "Diff Checker"],
  "config": {
    "theme": "dark",
    "autoFormat": true,
    "tabSize": 2
  },
  "stats": {
    "users": 24500,
    "tools": 60,
    "uptime": 99.99
  }
}`;

let tabIdCounter = 1;

function createTab(name) {
  return {
    id: tabIdCounter++,
    name,
    description: '',
    input: SAMPLE_JSON,
    output: '',
  };
}

function JfTreeNode({ keyName, value, depth = 0 }) {
  const [expanded, setExpanded] = useState(depth < 2);
  const isObject = value !== null && typeof value === 'object';
  const isArray = Array.isArray(value);

  if (!isObject) {
    const cls = typeof value === 'string' ? 'jf__tv-string'
      : typeof value === 'number' ? 'jf__tv-number'
      : typeof value === 'boolean' ? 'jf__tv-bool'
      : 'jf__tv-null';
    const display = value === null ? 'null' : JSON.stringify(value);
    return (
      <div className="jf__tv-row" style={{ paddingLeft: depth * 18 }}>
        {keyName !== null && <span className="jf__tv-key">{String(keyName)}: </span>}
        <span className={cls}>{display}</span>
      </div>
    );
  }

  const entries = isArray ? value.map((v, i) => [i, v]) : Object.entries(value);
  const bracket = isArray ? ['[', ']'] : ['{', '}'];

  return (
    <div className="jf__tv-node">
      <div className="jf__tv-row jf__tv-row--parent" style={{ paddingLeft: depth * 18 }} onClick={() => setExpanded(!expanded)}>
        <span className={`jf__tv-arrow ${expanded ? 'jf__tv-arrow--open' : ''}`}>▶</span>
        {keyName !== null && <span className="jf__tv-key">{String(keyName)}: </span>}
        <span className="jf__tv-bracket">{bracket[0]}</span>
        {!expanded && <span className="jf__tv-collapsed"> {entries.length} items {bracket[1]}</span>}
      </div>
      {expanded && (
        <>
          {entries.map(([k, v]) => <JfTreeNode key={k} keyName={k} value={v} depth={depth + 1} />)}
          <div className="jf__tv-row" style={{ paddingLeft: depth * 18 }}>
            <span className="jf__tv-bracket">{bracket[1]}</span>
          </div>
        </>
      )}
    </div>
  );
}

function JsonTab({ tab, updateTab, monacoTheme, wordWrap, autoFormat, showSidebar, setShowSidebar }) {
  const { input, output } = tab;
  const [isValid, setIsValid] = useState(true);
  const [error, setError] = useState(null);
  const [processTime, setProcessTime] = useState(0);
  const [activeTab, setActiveTab] = useState('tree');
  const [copiedPanel, setCopiedPanel] = useState(null);
  const [outputView, setOutputView] = useState('code');
  const [editorFullscreen, setEditorFullscreen] = useState(false);
  const inputEditorRef = useRef(null);
  const fileInputRef = useRef(null);

  const setInput = (v) => updateTab({ input: v });
  const setOutput = (v) => updateTab({ output: v });

  const validate = useCallback((text) => {
    if (!text.trim()) { setIsValid(true); setError(null); return true; }
    try {
      JSON.parse(text);
      setIsValid(true); setError(null); return true;
    } catch (e) {
      setIsValid(false);
      const match = e.message.match(/position (\d+)/);
      const position = match ? parseInt(match[1]) : null;
      let line = null, col = null;
      if (position !== null) {
        const before = text.substring(0, position);
        line = before.split('\n').length;
        col = position - before.lastIndexOf('\n');
      }
      setError({ message: e.message, line, col, position });
      return false;
    }
  }, []);

  const parsedData = useMemo(() => {
    try { return JSON.parse(input); } catch { return null; }
  }, [input]);

  const stats = useMemo(() => {
    const chars = input.length;
    const lines = input ? input.split('\n').length : 0;
    const size = new Blob([input]).size;
    let objects = 0, arrays = 0, keys = 0, depth = 0;
    const calcDepth = (val, d) => {
      if (d > depth) depth = d;
      if (val && typeof val === 'object') {
        if (Array.isArray(val)) { arrays++; val.forEach(v => calcDepth(v, d + 1)); }
        else { objects++; const k = Object.keys(val); keys += k.length; k.forEach(key => calcDepth(val[key], d + 1)); }
      }
    };
    if (parsedData) calcDepth(parsedData, 0);
    return { chars, lines, objects, arrays, keys, depth, size };
  }, [input, parsedData]);

  const handleFormat = useCallback(() => {
    const start = performance.now();
    try { const parsed = JSON.parse(input); setOutput(JSON.stringify(parsed, null, 2)); setIsValid(true); setError(null); }
    catch (e) { validate(input); }
    setProcessTime(performance.now() - start);
  }, [input, validate, setOutput]);

  const handleMinify = useCallback(() => {
    const start = performance.now();
    try { const parsed = JSON.parse(input); setOutput(JSON.stringify(parsed)); setIsValid(true); setError(null); }
    catch (e) { validate(input); }
    setProcessTime(performance.now() - start);
  }, [input, validate, setOutput]);

  const handleCopy = useCallback(() => { navigator.clipboard.writeText(output || input); }, [input, output]);
  const handleClear = useCallback(() => { setInput(''); setOutput(''); setIsValid(true); setError(null); setProcessTime(0); }, [setInput, setOutput]);

  const handleDownload = useCallback(() => {
    const text = output || input;
    const blob = new Blob([text], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a'); a.href = url; a.download = 'formatted.json'; a.click();
    URL.revokeObjectURL(url);
  }, [input, output]);

  const handleUpload = useCallback(() => { fileInputRef.current?.click(); }, []);

  const handleFileChange = useCallback((e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => { const text = ev.target.result; setInput(text); validate(text); };
    reader.readAsText(file); e.target.value = '';
  }, [validate, setInput]);

  const handleSwap = useCallback(() => { if (output) { setInput(output); setOutput(''); } }, [output, setInput, setOutput]);

  const handlePaste = useCallback(async () => {
    try { const text = await navigator.clipboard.readText(); setInput(text); validate(text); } catch {}
  }, [validate, setInput]);

  const handleConvert = useCallback(() => {
    const start = performance.now();
    try { const parsed = JSON.parse(input); setOutput(JSON.stringify(parsed, null, 4)); setIsValid(true); setError(null); }
    catch (e) { validate(input); }
    setProcessTime(performance.now() - start);
  }, [input, validate, setOutput]);

  useEffect(() => {
    if (!parsedData) { updateTab({ description: '' }); return; }
    let desc = '';
    if (Array.isArray(parsedData)) {
      desc = `Array [${parsedData.length} items]`;
    } else if (typeof parsedData === 'object') {
      const keys = Object.keys(parsedData);
      desc = keys.slice(0, 5).join(', ') + (keys.length > 5 ? ` +${keys.length - 5} more` : '');
    }
    updateTab({ description: desc });
  }, [parsedData]); // eslint-disable-line react-hooks/exhaustive-deps

  const handleInputChange = useCallback((value) => {
    const v = value || '';
    setInput(v);
    validate(v);
    if (autoFormat && v.trim()) {
      try { const parsed = JSON.parse(v); setOutput(JSON.stringify(parsed, null, 2)); } catch {}
    }
  }, [validate, autoFormat, setInput, setOutput]);

  useEffect(() => {
    const handler = (e) => {
      if (e.ctrlKey || e.metaKey) {
        if (e.key === 'Enter') { e.preventDefault(); handleFormat(); }
        if (e.shiftKey && e.key === 'M') { e.preventDefault(); handleMinify(); }
      }
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [handleFormat, handleMinify]);

  const renderTree = (data, key = 'root', depth = 0) => {
    if (data === null) return <span className="jf-tree__value jf-tree__value--null">null</span>;
    if (typeof data === 'boolean') return <span className="jf-tree__value jf-tree__value--bool">{String(data)}</span>;
    if (typeof data === 'number') return <span className="jf-tree__value jf-tree__value--number">{data}</span>;
    if (typeof data === 'string') return <span className="jf-tree__value jf-tree__value--string">"{data}"</span>;
    if (Array.isArray(data)) {
      return (
        <details className="jf-tree__node" open={depth < 2}>
          <summary className="jf-tree__key">{key} <span className="jf-tree__bracket">[{data.length}]</span></summary>
          <div className="jf-tree__children">
            {data.map((item, i) => (<div key={i} className="jf-tree__item"><span className="jf-tree__index">{i}: </span>{renderTree(item, i, depth + 1)}</div>))}
          </div>
        </details>
      );
    }
    if (typeof data === 'object') {
      const keys = Object.keys(data);
      return (
        <details className="jf-tree__node" open={depth < 2}>
          <summary className="jf-tree__key">{key} <span className="jf-tree__bracket">{`{${keys.length}}`}</span></summary>
          <div className="jf-tree__children">
            {keys.map((k) => (<div key={k} className="jf-tree__item"><span className="jf-tree__prop">{k}: </span>{renderTree(data[k], k, depth + 1)}</div>))}
          </div>
        </details>
      );
    }
    return null;
  };

  return (
    <div className="jf__tab-content-inner">

      {/* Toolbar */}
      <div className="jf__toolbar">
        <button className="jf__toolbar-btn jf__toolbar-btn--primary" onClick={handleFormat}>
          <span>⚡</span> Format <kbd>Ctrl+Enter</kbd>
        </button>
        <button className="jf__toolbar-btn" onClick={() => validate(input)}><span>✓</span> Validate</button>
        <button className="jf__toolbar-btn" onClick={handleMinify}><span>▬</span> Minify <kbd>Ctrl+Shift+M</kbd></button>
        <button className="jf__toolbar-btn" onClick={handleFormat}><span>✦</span> Prettify</button>
        <div className="jf__toolbar-divider" />
        <button className="jf__toolbar-btn" onClick={handleClear}><span>✕</span> Clear</button>
        <button className="jf__toolbar-btn" onClick={handleDownload}><span>↓</span> Download</button>
        <button className="jf__toolbar-btn" onClick={handleUpload}><span>↑</span> Upload</button>
        <button className="jf__toolbar-btn" onClick={handleSwap} disabled={!output}><span>⇄</span> Swap</button>
        <button className="jf__toolbar-btn" onClick={handleConvert}><span>⟳</span> Convert</button>
        <button className="jf__toolbar-btn" onClick={handleFormat}><span>◆</span> Beautify</button>
        <div className="jf__toolbar-divider" />
        <button className={`jf__toolbar-btn ${showSidebar ? 'jf__toolbar-btn--active' : ''}`} onClick={() => setShowSidebar(!showSidebar)}><span>▐</span> Panel</button>
      </div>

      {/* Main Content */}
      <div className={`jf__main ${!showSidebar ? 'jf__main--no-sidebar' : ''}`}>
        <div className="jf__editors">
          <div className="jf__panel">
            <div className="jf__panel-header">
              <div className="jf__panel-dots">
                <span className="jf__dot jf__dot--red" />
                <span className="jf__dot jf__dot--yellow" />
                <span className="jf__dot jf__dot--green" />
              </div>
              <span className="jf__panel-title">Input</span>
              <div className="jf__panel-actions">
                <button className="jf__panel-btn" onClick={handlePaste}>Paste</button>
                <button className={`jf__panel-btn ${copiedPanel === 'input' ? 'jf__panel-btn--copied' : ''}`} onClick={() => { navigator.clipboard.writeText(input); setCopiedPanel('input'); setTimeout(() => setCopiedPanel(null), 3000); }}>{copiedPanel === 'input' ? '✓ Copied' : 'Copy'}</button>
                <button className="jf__panel-btn" onClick={() => { if (input) setInput(JSON.stringify(input)); }} disabled={!input}>Escape</button>
                <button className="jf__panel-btn" onClick={() => { try { const result = JSON.parse(input); setInput(typeof result === 'string' ? result : input); } catch {} }} disabled={!input}>Unescape</button>
              </div>
              <span className="jf__panel-info">{stats.lines} lines · {stats.chars} chars</span>
            </div>
            <div className="jf__editor">
              <MonacoEditor
                height="100%"
                language="json"
                theme={monacoTheme}
                value={input}
                onChange={handleInputChange}
                onMount={(editor) => { inputEditorRef.current = editor; }}
                options={{
                  minimap: { enabled: true, scale: 1, showSlider: 'always' }, fontSize: 13,
                  fontFamily: 'JetBrains Mono, SF Mono, Fira Code, monospace',
                  lineNumbers: 'on', scrollBeyondLastLine: false,
                  wordWrap: wordWrap ? 'on' : 'off', padding: { top: 12 },
                  renderLineHighlight: 'line', overviewRulerBorder: false,
                  scrollbar: { verticalScrollbarSize: 6, horizontalScrollbarSize: 6 },
                  find: { addExtraSpaceOnTop: false },
                }}
              />
            </div>
          </div>
          <div className="jf__panel">
            <div className="jf__panel-header">
              <div className="jf__panel-dots">
                <span className="jf__dot jf__dot--red" />
                <span className="jf__dot jf__dot--yellow" />
                <span className="jf__dot jf__dot--green" />
              </div>
              <span className="jf__panel-title">Output</span>
              <div className="jf__panel-actions">
                <button className={`jf__panel-btn ${outputView === 'code' ? 'jf__panel-btn--active' : ''}`} onClick={() => setOutputView('code')}>Code</button>
                <button className={`jf__panel-btn ${outputView === 'tree' ? 'jf__panel-btn--active' : ''}`} onClick={() => setOutputView('tree')}>Tree</button>
                <button className={`jf__panel-btn ${copiedPanel === 'output' ? 'jf__panel-btn--copied' : ''}`} onClick={() => { navigator.clipboard.writeText(output); setCopiedPanel('output'); setTimeout(() => setCopiedPanel(null), 3000); }} disabled={!output}>{copiedPanel === 'output' ? '✓ Copied' : 'Copy'}</button>
                <button className="jf__panel-btn" onClick={() => { const src = output || input; if (src) setOutput(JSON.stringify(src)); }} disabled={!output && !input}>Escape</button>
                <button className="jf__panel-btn" onClick={() => { try { const src = output || input; const result = JSON.parse(src); setOutput(typeof result === 'string' ? result : src); } catch {} }} disabled={!output && !input}>Unescape</button>
                <button className="jf__panel-fullscreen" onClick={() => setEditorFullscreen(true)} title="Fullscreen">
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M15 3h6v6M9 21H3v-6M21 3l-7 7M3 21l7-7" /></svg>
                </button>
              </div>
              {processTime > 0 && <span className="jf__panel-info">{processTime.toFixed(1)}ms</span>}
            </div>
            {!isValid && error && (
              <div className="jf__panel-error">
                <span className="jf__panel-error-msg">{error.message}</span>
                {error.line && <span className="jf__panel-error-loc">Ln {error.line}, Col {error.col}</span>}
              </div>
            )}
            {outputView === 'code' ? (
              <div className="jf__editor">
                <MonacoEditor
                  height="100%"
                  language="json"
                  theme={monacoTheme}
                  value={output}
                  options={{
                    readOnly: true, minimap: { enabled: true, scale: 1, showSlider: 'always' }, fontSize: 13,
                    fontFamily: 'JetBrains Mono, SF Mono, Fira Code, monospace',
                    lineNumbers: 'on', scrollBeyondLastLine: false,
                    wordWrap: wordWrap ? 'on' : 'off', padding: { top: 12 },
                    renderLineHighlight: 'none', overviewRulerBorder: false,
                    scrollbar: { verticalScrollbarSize: 6, horizontalScrollbarSize: 6 },
                  }}
                />
              </div>
            ) : (
              <div className="jf__output-tree">
                {parsedData ? <JfTreeNode keyName={null} value={parsedData} depth={0} /> : <span className="jf__output-tree-empty">No valid JSON</span>}
              </div>
            )}
          </div>
        </div>

        {editorFullscreen && (
          <div className="jf__panel--fullscreen">
            <div className="jf__panel-header">
              <div className="jf__panel-dots">
                <span className="jf__dot jf__dot--red" />
                <span className="jf__dot jf__dot--yellow" />
                <span className="jf__dot jf__dot--green" />
              </div>
              <span className="jf__panel-title">Output</span>
              <div className="jf__panel-actions">
                <button className={`jf__panel-btn ${outputView === 'code' ? 'jf__panel-btn--active' : ''}`} onClick={() => setOutputView('code')}>Code</button>
                <button className={`jf__panel-btn ${outputView === 'tree' ? 'jf__panel-btn--active' : ''}`} onClick={() => setOutputView('tree')}>Tree</button>
                <button className={`jf__panel-btn ${copiedPanel === 'output' ? 'jf__panel-btn--copied' : ''}`} onClick={() => { navigator.clipboard.writeText(output); setCopiedPanel('output'); setTimeout(() => setCopiedPanel(null), 3000); }} disabled={!output}>{copiedPanel === 'output' ? '✓ Copied' : 'Copy'}</button>
                <button className="jf__panel-btn" onClick={() => { const src = output || input; if (src) setOutput(JSON.stringify(src)); }} disabled={!output && !input}>Escape</button>
                <button className="jf__panel-btn" onClick={() => { try { const src = output || input; const result = JSON.parse(src); setOutput(typeof result === 'string' ? result : src); } catch {} }} disabled={!output && !input}>Unescape</button>
                <button className="jf__panel-fullscreen" onClick={() => setEditorFullscreen(false)} title="Exit fullscreen">
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M8 3v3a2 2 0 0 1-2 2H3m18 0h-3a2 2 0 0 1-2-2V3m0 18v-3a2 2 0 0 1 2-2h3M3 16h3a2 2 0 0 1 2 2v3" /></svg>
                </button>
              </div>
              {processTime > 0 && <span className="jf__panel-info">{processTime.toFixed(1)}ms</span>}
            </div>
            {!isValid && error && (
              <div className="jf__panel-error">
                <span className="jf__panel-error-msg">{error.message}</span>
                {error.line && <span className="jf__panel-error-loc">Ln {error.line}, Col {error.col}</span>}
              </div>
            )}
            {outputView === 'code' ? (
              <div className="jf__editor">
                <MonacoEditor
                  height="100%"
                  language="json"
                  theme={monacoTheme}
                  value={output}
                  options={{
                    readOnly: true, minimap: { enabled: true, scale: 1, showSlider: 'always' }, fontSize: 13,
                    fontFamily: 'JetBrains Mono, SF Mono, Fira Code, monospace',
                    lineNumbers: 'on', scrollBeyondLastLine: false,
                    wordWrap: wordWrap ? 'on' : 'off', padding: { top: 12 },
                    renderLineHighlight: 'none', overviewRulerBorder: false,
                    scrollbar: { verticalScrollbarSize: 6, horizontalScrollbarSize: 6 },
                  }}
                />
              </div>
            ) : (
              <div className="jf__output-tree">
                {parsedData ? <JfTreeNode keyName={null} value={parsedData} depth={0} /> : <span className="jf__output-tree-empty">No valid JSON</span>}
              </div>
            )}
          </div>
        )}

        {showSidebar && <aside className="jf__sidebar">
          <div className="jf__stats-card">
            <h3 className="jf__stats-title">Statistics</h3>
            <div className="jf__stats-grid">
              <div className="jf__stat"><span className="jf__stat-value">{stats.chars.toLocaleString()}</span><span className="jf__stat-label">Characters</span></div>
              <div className="jf__stat"><span className="jf__stat-value">{stats.lines}</span><span className="jf__stat-label">Lines</span></div>
              <div className="jf__stat"><span className="jf__stat-value">{stats.objects}</span><span className="jf__stat-label">Objects</span></div>
              <div className="jf__stat"><span className="jf__stat-value">{stats.arrays}</span><span className="jf__stat-label">Arrays</span></div>
              <div className="jf__stat"><span className="jf__stat-value">{stats.keys}</span><span className="jf__stat-label">Keys</span></div>
              <div className="jf__stat"><span className="jf__stat-value">{stats.depth}</span><span className="jf__stat-label">Depth</span></div>
              <div className="jf__stat"><span className="jf__stat-value">{stats.size > 1024 ? `${(stats.size / 1024).toFixed(1)}KB` : `${stats.size}B`}</span><span className="jf__stat-label">File Size</span></div>
              <div className="jf__stat"><span className="jf__stat-value">{processTime > 0 ? `${processTime.toFixed(1)}ms` : '—'}</span><span className="jf__stat-label">Time</span></div>
            </div>
          </div>

          {!isValid && error && (
            <div className="jf__error-card">
              <h3 className="jf__error-title">⚠ Error</h3>
              <p className="jf__error-msg">{error.message}</p>
              {error.line && <span className="jf__error-loc">Line {error.line}, Col {error.col}</span>}
            </div>
          )}

          <div className="jf__tab-card">
            <div className="jf__tab-header">
              <button className={`jf__tab ${activeTab === 'tree' ? 'jf__tab--active' : ''}`} onClick={() => setActiveTab('tree')}>Tree View</button>
              <button className={`jf__tab ${activeTab === 'shortcuts' ? 'jf__tab--active' : ''}`} onClick={() => setActiveTab('shortcuts')}>Shortcuts</button>
            </div>
            <div className="jf__tab-content">
              {activeTab === 'tree' && (
                <div className="jf-tree">
                  {parsedData ? renderTree(parsedData) : <span className="jf-tree__empty">No valid JSON to display</span>}
                </div>
              )}
              {activeTab === 'shortcuts' && (
                <div className="jf__shortcuts">
                  <div className="jf__shortcut"><kbd>Ctrl+Enter</kbd><span>Format</span></div>
                  <div className="jf__shortcut"><kbd>Ctrl+Shift+M</kbd><span>Minify</span></div>
                  <div className="jf__shortcut"><kbd>Ctrl+F</kbd><span>Search</span></div>
                  <div className="jf__shortcut"><kbd>Ctrl+H</kbd><span>Replace</span></div>
                  <div className="jf__shortcut"><kbd>Ctrl+Z</kbd><span>Undo</span></div>
                  <div className="jf__shortcut"><kbd>Ctrl+Shift+Z</kbd><span>Redo</span></div>
                  <div className="jf__shortcut"><kbd>F11</kbd><span>Fullscreen</span></div>
                </div>
              )}
            </div>
          </div>
        </aside>}
      </div>

      <input ref={fileInputRef} type="file" accept=".json,.txt" onChange={handleFileChange} style={{ display: 'none' }} />
    </div>
  );
}

function JsonFormatter() {
  const navigate = useNavigate();
  const { theme, toggleTheme } = useTheme();
  useToolTheme();
  const [tabs, setTabs] = useState(() => {
    const saved = storage.get('jf_tabs');
    if (saved) { tabIdCounter = Math.max(...saved.map(t => t.id)) + 1; return saved; }
    return [createTab('JSON 1')];
  });
  const [activeTabId, setActiveTabId] = useState(() => storage.get('jf_activeTab') || tabs[0]?.id);
  const [editingTabId, setEditingTabId] = useState(null);
  const [editingDescId, setEditingDescId] = useState(null);
  const [autoFormat, setAutoFormat] = useState(false);
  const [wordWrap, setWordWrap] = useState(true);
  const [showSidebar, setShowSidebar] = useState(false);
  const containerRef = useRef(null);

  const activeTab = tabs.find(t => t.id === activeTabId) || tabs[0];
  const monacoTheme = theme === 'dark' ? 'vs-dark' : 'vs';

  const addTab = () => {
    const newTab = createTab(`JSON ${tabs.length + 1}`);
    const next = [...tabs, newTab];
    setTabs(next); setActiveTabId(newTab.id);
    storage.set('jf_tabs', next); storage.set('jf_activeTab', newTab.id);
  };

  const closeTab = (id) => {
    if (tabs.length === 1) return;
    const newTabs = tabs.filter(t => t.id !== id);
    setTabs(newTabs); storage.set('jf_tabs', newTabs);
    if (activeTabId === id) {
      const newActive = newTabs[newTabs.length - 1].id;
      setActiveTabId(newActive); storage.set('jf_activeTab', newActive);
    }
  };

  const updateTab = useCallback((updates) => {
    setTabs(prev => {
      const next = prev.map(t => t.id === activeTabId ? { ...t, ...updates } : t);
      storage.set('jf_tabs', next);
      return next;
    });
  }, [activeTabId]);

  const renameTab = (id, name) => {
    setTabs(prev => { const next = prev.map(t => t.id === id ? { ...t, name } : t); storage.set('jf_tabs', next); return next; });
    setEditingTabId(null);
  };

  const updateDescription = (id, description) => {
    setTabs(prev => { const next = prev.map(t => t.id === id ? { ...t, description } : t); storage.set('jf_tabs', next); return next; });
    setEditingDescId(null);
  };

  const [isDragging, setIsDragging] = useState(false);

  const handleDragOver = useCallback((e) => { e.preventDefault(); setIsDragging(true); }, []);
  const handleDragLeave = useCallback(() => { setIsDragging(false); }, []);
  const handleDrop = useCallback((e) => {
    e.preventDefault(); setIsDragging(false);
    const file = e.dataTransfer.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (ev) => { updateTab({ input: ev.target.result }); };
      reader.readAsText(file);
    }
  }, [updateTab]);

  return (
    <div
      className="jf"
      ref={containerRef}
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
    >
      {isDragging && (
        <div className="jf__drop-overlay">
          <div className="jf__drop-content">
            <span className="jf__drop-icon">📄</span>
            <span>Drop JSON file here</span>
          </div>
        </div>
      )}

      {/* Header */}
      <header className="jf__header">
        <div className="jf__header-left">
          <a href="/" className="navbar__logo">
            <Logo3D size={32} />
            <span className="navbar__logo-text">Dev<span className="navbar__logo-highlight">Tools</span><span className="navbar__logo-deck">Deck</span></span>
          </a>
          <button className="jf__back" onClick={() => navigate('/')}>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M19 12H5M12 19l-7-7 7-7" />
            </svg>
            Back
          </button>
          <div className="jf__title-group">
            <h1 className="jf__title">JSON Formatter</h1>
          </div>
        </div>
        <div className="jf__header-right">
          <label className="jf__toggle">
            <input type="checkbox" checked={autoFormat} onChange={(e) => setAutoFormat(e.target.checked)} />
            <span className="jf__toggle-slider" />
            <span className="jf__toggle-label">Auto Format</span>
          </label>
          <label className="jf__toggle">
            <input type="checkbox" checked={wordWrap} onChange={(e) => setWordWrap(e.target.checked)} />
            <span className="jf__toggle-slider" />
            <span className="jf__toggle-label">Word Wrap</span>
          </label>
          <button className="jf__theme-btn" onClick={toggleTheme} title="Toggle theme">
            {theme === 'dark' ? (
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="5" /><path d="M12 1v2M12 21v2M4.22 4.22l1.42 1.42M18.36 18.36l1.42 1.42M1 12h2M21 12h2M4.22 19.78l1.42-1.42M18.36 5.64l1.42-1.42" /></svg>
            ) : (
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z" /></svg>
            )}
          </button>
        </div>
      </header>

      {/* Chrome-style Tab Bar */}
      <div className="jf__chrome-tabs">
        <div className="jf__chrome-tabs-list">
          {tabs.map(tab => (
            <div
              key={tab.id}
              className={`jf__chrome-tab ${tab.id === activeTabId ? 'jf__chrome-tab--active' : ''}`}
              onClick={() => { setActiveTabId(tab.id); storage.set('jf_activeTab', tab.id); }}
            >
              {editingTabId === tab.id ? (
                <input
                  className="jf__chrome-tab-input"
                  defaultValue={tab.name}
                  autoFocus
                  onBlur={e => renameTab(tab.id, e.target.value || tab.name)}
                  onKeyDown={e => { if (e.key === 'Enter') renameTab(tab.id, e.target.value || tab.name); }}
                  onClick={e => e.stopPropagation()}
                />
              ) : (
                <span className="jf__chrome-tab-name">
                  {tab.name}
                </span>
              )}
              <button className="jf__chrome-tab-edit" onClick={e => { e.stopPropagation(); setEditingTabId(tab.id); }} title="Rename tab">
                <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
                  <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" />
                </svg>
              </button>

              {tabs.length > 1 && (
                <button className="jf__chrome-tab-close" onClick={e => { e.stopPropagation(); closeTab(tab.id); }}>×</button>
              )}
            </div>
          ))}
          <button className="jf__chrome-tab-add" onClick={addTab} title="New tab">+</button>
        </div>

      </div>

      {/* Tab Description */}
      {activeTab.description && (
        <div className="jf__tab-description">
          <span className="jf__tab-description-icon">📝</span>
          <span>{activeTab.description}</span>
        </div>
      )}

      {/* Active Tab Content */}
      <JsonTab key={activeTab.id} tab={activeTab} updateTab={updateTab} monacoTheme={monacoTheme} wordWrap={wordWrap} autoFormat={autoFormat} showSidebar={showSidebar} setShowSidebar={setShowSidebar} />
    </div>
  );
}

export default JsonFormatter;
