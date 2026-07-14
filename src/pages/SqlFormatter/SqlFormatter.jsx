import { useState, useCallback, useRef, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import MonacoEditor from '@monaco-editor/react';
import { useTheme, useToolTheme } from '../../hooks/useTheme';
import { storage } from '../../utils/storage';
import './SqlFormatter.css';
import Logo3D from '../../components/Logo3D/Logo3D';


const SQL_KEYWORDS = [
  'SELECT','FROM','WHERE','INSERT','INTO','VALUES','UPDATE','SET','DELETE',
  'CREATE','TABLE','ALTER','DROP','INDEX','JOIN','INNER','LEFT','RIGHT',
  'OUTER','FULL','CROSS','ON','AND','OR','NOT','IN','EXISTS','BETWEEN',
  'LIKE','IS','NULL','AS','ORDER','BY','GROUP','HAVING','LIMIT','OFFSET',
  'UNION','ALL','DISTINCT','CASE','WHEN','THEN','ELSE','END','BEGIN',
  'COMMIT','ROLLBACK','GRANT','REVOKE','PRIMARY','KEY','FOREIGN','REFERENCES',
  'CONSTRAINT','DEFAULT','CHECK','UNIQUE','AUTO_INCREMENT','CASCADE','ASC','DESC',
  'COUNT','SUM','AVG','MIN','MAX','COALESCE','IF','IFNULL','WITH','RECURSIVE',
  'OVER','PARTITION','ROW_NUMBER','RANK','DENSE_RANK','TRIGGER','PROCEDURE',
  'FUNCTION','RETURN','RETURNS','DECLARE','FETCH','CURSOR','OPEN','CLOSE',
  'TRUNCATE','REPLACE','EXPLAIN','ANALYZE','VIEW','TEMPORARY','TEMP','DATABASE',
  'SCHEMA','USE','SHOW','DESCRIBE','VARCHAR','INT','INTEGER','BIGINT','FLOAT',
  'DOUBLE','DECIMAL','BOOLEAN','DATE','DATETIME','TIMESTAMP','TEXT','BLOB','CHAR'
];

const SAMPLE_SQL = `SELECT u.id, u.name, u.email, o.order_id, o.total_amount
FROM users u
INNER JOIN orders o ON u.id = o.user_id
LEFT JOIN payments p ON o.order_id = p.order_id
WHERE u.status = 'active'
  AND o.created_at >= '2024-01-01'
  AND o.total_amount > 100.00
GROUP BY u.id, u.name, u.email
HAVING COUNT(o.order_id) > 3
ORDER BY o.total_amount DESC
LIMIT 50 OFFSET 0;`;

let tabIdCounter = 1;

function createTab(name) {
  return { id: tabIdCounter++, name, description: '', input: SAMPLE_SQL, output: '' };
}

function formatSQL(sql, indent = 2) {
  if (!sql.trim()) return '';
  const indentStr = ' '.repeat(indent);
  const breakBefore = ['SELECT','FROM','WHERE','JOIN','INNER JOIN','LEFT JOIN','RIGHT JOIN',
    'FULL JOIN','CROSS JOIN','ORDER BY','GROUP BY','HAVING','LIMIT','OFFSET',
    'UNION','UNION ALL','INSERT INTO','VALUES','UPDATE','SET','DELETE FROM',
    'CREATE TABLE','ALTER TABLE','DROP TABLE','ON','AND','OR'];

  let formatted = sql.replace(/\s+/g, ' ').trim();

  breakBefore.forEach(kw => {
    const regex = new RegExp(`\\b(${kw})\\b`, 'gi');
    formatted = formatted.replace(regex, `\n${kw.toUpperCase()}`);
  });

  // Indent sub-clauses
  const lines = formatted.split('\n').filter(l => l.trim());
  const result = lines.map((line, i) => {
    const trimmed = line.trim();
    if (/^(AND|OR)\b/i.test(trimmed)) return indentStr + trimmed;
    if (/^(ON)\b/i.test(trimmed)) return indentStr + trimmed;
    return trimmed;
  });

  return result.join('\n');
}

function minifySQL(sql) {
  return sql.replace(/--.*$/gm, '').replace(/\/\*[\s\S]*?\*\//g, '').replace(/\s+/g, ' ').trim();
}

function transformKeywords(sql, transform) {
  let result = sql;
  SQL_KEYWORDS.forEach(kw => {
    const regex = new RegExp(`\\b${kw}\\b`, 'gi');
    result = result.replace(regex, transform === 'upper' ? kw.toUpperCase() : kw.toLowerCase());
  });
  return result;
}

function SqlTab({ tab, updateTab, monacoTheme, wordWrap, indentSize }) {
  const { input, output } = tab;
  const [processTime, setProcessTime] = useState(0);
  const [showReplace, setShowReplace] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [replaceTerm, setReplaceTerm] = useState('');
  const [searchCount, setSearchCount] = useState(0);
  const inputEditorRef = useRef(null);
  const fileInputRef = useRef(null);

  const setInput = (v) => updateTab({ input: v });
  const setOutput = (v) => updateTab({ output: v });

  const stats = useMemo(() => {
    const chars = input.length;
    const lines = input ? input.split('\n').length : 0;
    const size = new Blob([input]).size;
    const words = input.trim() ? input.trim().split(/\s+/).length : 0;
    let keywords = 0;
    SQL_KEYWORDS.forEach(kw => {
      const regex = new RegExp(`\\b${kw}\\b`, 'gi');
      const matches = input.match(regex);
      if (matches) keywords += matches.length;
    });
    const statements = (input.match(/;/g) || []).length;
    return { chars, lines, size, words, keywords, statements };
  }, [input]);

  const handleBeautify = useCallback(() => {
    const start = performance.now();
    setOutput(formatSQL(input, indentSize));
    setProcessTime(performance.now() - start);
  }, [input, indentSize, setOutput]);

  const handleMinify = useCallback(() => {
    const start = performance.now();
    setOutput(minifySQL(input));
    setProcessTime(performance.now() - start);
  }, [input, setOutput]);

  const handleUppercase = useCallback(() => {
    const start = performance.now();
    setOutput(transformKeywords(input, 'upper'));
    setProcessTime(performance.now() - start);
  }, [input, setOutput]);

  const handleLowercase = useCallback(() => {
    const start = performance.now();
    setOutput(transformKeywords(input, 'lower'));
    setProcessTime(performance.now() - start);
  }, [input, setOutput]);

  const handleCopy = useCallback(() => { navigator.clipboard.writeText(output || input); }, [input, output]);

  const handleDownload = useCallback(() => {
    const text = output || input;
    const blob = new Blob([text], { type: 'text/sql' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a'); a.href = url; a.download = 'query.sql'; a.click();
    URL.revokeObjectURL(url);
  }, [input, output]);

  const handleUpload = useCallback(() => { fileInputRef.current?.click(); }, []);

  const handleFileChange = useCallback((e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => { setInput(ev.target.result); };
    reader.readAsText(file); e.target.value = '';
  }, [setInput]);

  const handleSearch = useCallback(() => {
    if (!searchTerm) { setSearchCount(0); return; }
    const regex = new RegExp(searchTerm.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'gi');
    const matches = input.match(regex);
    setSearchCount(matches ? matches.length : 0);
    // Trigger Monaco find
    if (inputEditorRef.current) {
      inputEditorRef.current.getAction('actions.find')?.run();
    }
  }, [searchTerm, input]);

  const handleReplace = useCallback(() => {
    if (!searchTerm) return;
    const regex = new RegExp(searchTerm.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'gi');
    setInput(input.replace(regex, replaceTerm));
    setSearchCount(0);
  }, [searchTerm, replaceTerm, input, setInput]);

  const handleClear = useCallback(() => { setInput(''); setOutput(''); setProcessTime(0); }, [setInput, setOutput]);

  const handleInputChange = useCallback((value) => { setInput(value || ''); }, [setInput]);

  useEffect(() => {
    const handler = (e) => {
      if ((e.ctrlKey || e.metaKey) && e.key === 'Enter') { e.preventDefault(); handleBeautify(); }
      if ((e.ctrlKey || e.metaKey) && e.shiftKey && e.key === 'M') { e.preventDefault(); handleMinify(); }
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [handleBeautify, handleMinify]);

  return (
    <div className="sf__tab-content-inner">
      {/* Search/Replace Bar */}
      <div className="sf__search-bar">
        <div className="sf__search-group">
          <input
            className="sf__search-input"
            placeholder="Search..."
            value={searchTerm}
            onChange={e => setSearchTerm(e.target.value)}
            onKeyDown={e => { if (e.key === 'Enter') handleSearch(); }}
          />
          {searchCount > 0 && <span className="sf__search-count">{searchCount} found</span>}
          <button className="sf__search-btn" onClick={handleSearch}>Find</button>
          <button className="sf__search-btn" onClick={() => setShowReplace(!showReplace)}>
            {showReplace ? 'Hide' : 'Replace'}
          </button>
        </div>
        {showReplace && (
          <div className="sf__search-group">
            <input
              className="sf__search-input"
              placeholder="Replace with..."
              value={replaceTerm}
              onChange={e => setReplaceTerm(e.target.value)}
            />
            <button className="sf__search-btn" onClick={handleReplace}>Replace All</button>
          </div>
        )}
      </div>

      {/* Toolbar */}
      <div className="sf__toolbar">
        <button className="sf__toolbar-btn sf__toolbar-btn--primary" onClick={handleBeautify}>
          <span>⚡</span> Beautify <kbd>Ctrl+Enter</kbd>
        </button>
        <button className="sf__toolbar-btn" onClick={handleMinify}><span>▬</span> Minify</button>
        <button className="sf__toolbar-btn" onClick={handleUppercase}><span>A</span> Uppercase</button>
        <button className="sf__toolbar-btn" onClick={handleLowercase}><span>a</span> Lowercase</button>
        <div className="sf__toolbar-divider" />
        <button className="sf__toolbar-btn" onClick={handleCopy}><span>⧉</span> Copy</button>
        <button className="sf__toolbar-btn" onClick={handleDownload}><span>↓</span> Download</button>
        <button className="sf__toolbar-btn" onClick={handleUpload}><span>↑</span> Upload</button>
        <button className="sf__toolbar-btn" onClick={handleClear}><span>✕</span> Clear</button>
      </div>

      {/* Main Content */}
      <div className="sf__main">
        <div className="sf__editors">
          <div className="sf__panel">
            <div className="sf__panel-header">
              <div className="sf__panel-dots">
                <span className="sf__dot sf__dot--red" />
                <span className="sf__dot sf__dot--yellow" />
                <span className="sf__dot sf__dot--green" />
              </div>
              <span className="sf__panel-title">Input</span>
              <span className="sf__panel-info">{stats.lines} lines · {stats.chars} chars</span>
            </div>
            <div className="sf__editor">
              <MonacoEditor
                height="100%"
                language="sql"
                theme={monacoTheme}
                value={input}
                onChange={handleInputChange}
                onMount={(editor) => { inputEditorRef.current = editor; }}
                options={{
                  minimap: { enabled: false }, fontSize: 13,
                  fontFamily: 'JetBrains Mono, SF Mono, Fira Code, monospace',
                  lineNumbers: 'on', scrollBeyondLastLine: false,
                  wordWrap: wordWrap ? 'on' : 'off', padding: { top: 12 },
                  renderLineHighlight: 'line', overviewRulerBorder: false,
                  scrollbar: { verticalScrollbarSize: 6, horizontalScrollbarSize: 6 },
                }}
              />
            </div>
          </div>
          <div className="sf__panel">
            <div className="sf__panel-header">
              <div className="sf__panel-dots">
                <span className="sf__dot sf__dot--red" />
                <span className="sf__dot sf__dot--yellow" />
                <span className="sf__dot sf__dot--green" />
              </div>
              <span className="sf__panel-title">Output</span>
              {processTime > 0 && <span className="sf__panel-info">{processTime.toFixed(1)}ms</span>}
            </div>
            <div className="sf__editor">
              <MonacoEditor
                height="100%"
                language="sql"
                theme={monacoTheme}
                value={output}
                options={{
                  readOnly: true, minimap: { enabled: false }, fontSize: 13,
                  fontFamily: 'JetBrains Mono, SF Mono, Fira Code, monospace',
                  lineNumbers: 'on', scrollBeyondLastLine: false,
                  wordWrap: wordWrap ? 'on' : 'off', padding: { top: 12 },
                  renderLineHighlight: 'none', overviewRulerBorder: false,
                  scrollbar: { verticalScrollbarSize: 6, horizontalScrollbarSize: 6 },
                }}
              />
            </div>
          </div>
        </div>

        <aside className="sf__sidebar">
          <div className="sf__stats-card">
            <h3 className="sf__stats-title">Statistics</h3>
            <div className="sf__stats-grid">
              <div className="sf__stat"><span className="sf__stat-value">{stats.chars.toLocaleString()}</span><span className="sf__stat-label">Characters</span></div>
              <div className="sf__stat"><span className="sf__stat-value">{stats.lines}</span><span className="sf__stat-label">Lines</span></div>
              <div className="sf__stat"><span className="sf__stat-value">{stats.words}</span><span className="sf__stat-label">Words</span></div>
              <div className="sf__stat"><span className="sf__stat-value">{stats.keywords}</span><span className="sf__stat-label">Keywords</span></div>
              <div className="sf__stat"><span className="sf__stat-value">{stats.statements}</span><span className="sf__stat-label">Statements</span></div>
              <div className="sf__stat"><span className="sf__stat-value">{stats.size > 1024 ? `${(stats.size / 1024).toFixed(1)}KB` : `${stats.size}B`}</span><span className="sf__stat-label">Size</span></div>
              <div className="sf__stat"><span className="sf__stat-value">{processTime > 0 ? `${processTime.toFixed(1)}ms` : '—'}</span><span className="sf__stat-label">Time</span></div>
            </div>
          </div>
        </aside>
      </div>

      <input ref={fileInputRef} type="file" accept=".sql,.txt" onChange={handleFileChange} style={{ display: 'none' }} />
    </div>
  );
}

function SqlFormatter() {
  const navigate = useNavigate();
  const { theme, toggleTheme } = useTheme();
  useToolTheme();
  const [tabs, setTabs] = useState(() => {
    const saved = storage.get('sf_tabs');
    if (saved) { tabIdCounter = Math.max(...saved.map(t => t.id)) + 1; return saved; }
    return [createTab('SQL 1')];
  });
  const [activeTabId, setActiveTabId] = useState(() => storage.get('sf_activeTab') || tabs[0]?.id);
  const [editingTabId, setEditingTabId] = useState(null);
  const [editingDescId, setEditingDescId] = useState(null);
  const [wordWrap, setWordWrap] = useState(true);
  const [indentSize, setIndentSize] = useState(2);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const containerRef = useRef(null);

  const activeTab = tabs.find(t => t.id === activeTabId) || tabs[0];
  const monacoTheme = theme === 'dark' ? 'vs-dark' : 'vs';

  const addTab = () => {
    const newTab = createTab(`SQL ${tabs.length + 1}`);
    const next = [...tabs, newTab];
    setTabs(next); setActiveTabId(newTab.id);
    storage.set('sf_tabs', next); storage.set('sf_activeTab', newTab.id);
  };

  const closeTab = (id) => {
    if (tabs.length === 1) return;
    const newTabs = tabs.filter(t => t.id !== id);
    setTabs(newTabs); storage.set('sf_tabs', newTabs);
    if (activeTabId === id) {
      const newActive = newTabs[newTabs.length - 1].id;
      setActiveTabId(newActive); storage.set('sf_activeTab', newActive);
    }
  };

  const updateTab = useCallback((updates) => {
    setTabs(prev => {
      const next = prev.map(t => t.id === activeTabId ? { ...t, ...updates } : t);
      storage.set('sf_tabs', next);
      return next;
    });
  }, [activeTabId]);

  const renameTab = (id, name) => {
    setTabs(prev => { const next = prev.map(t => t.id === id ? { ...t, name } : t); storage.set('sf_tabs', next); return next; });
    setEditingTabId(null);
  };

  const updateDescription = (id, description) => {
    setTabs(prev => { const next = prev.map(t => t.id === id ? { ...t, description } : t); storage.set('sf_tabs', next); return next; });
    setEditingDescId(null);
  };

  const toggleFullscreen = useCallback(() => {
    if (!isFullscreen) containerRef.current?.requestFullscreen?.();
    else document.exitFullscreen?.();
    setIsFullscreen(!isFullscreen);
  }, [isFullscreen]);

  useEffect(() => {
    const handler = () => setIsFullscreen(!!document.fullscreenElement);
    document.addEventListener('fullscreenchange', handler);
    return () => document.removeEventListener('fullscreenchange', handler);
  }, []);

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
      className={`sf ${isFullscreen ? 'sf--fullscreen' : ''}`}
      ref={containerRef}
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
    >
      {isDragging && (
        <div className="sf__drop-overlay">
          <div className="sf__drop-content">
            <span className="sf__drop-icon">📄</span>
            <span>Drop SQL file here</span>
          </div>
        </div>
      )}

      {/* Header */}
      <header className="sf__header">
        <div className="sf__header-left">
          <a href="/" className="navbar__logo">
            <Logo3D size={32} />
            <span className="navbar__logo-text">Dev<span className="navbar__logo-highlight">Tools</span><span className="navbar__logo-deck">Deck</span></span>
          </a>
          <button className="sf__back" onClick={() => navigate('/')}>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M19 12H5M12 19l-7-7 7-7" />
            </svg>
            Back
          </button>
          <h1 className="sf__title">SQL Formatter</h1>
        </div>
        <div className="sf__header-right">
          <label className="sf__toggle">
            <input type="checkbox" checked={wordWrap} onChange={(e) => setWordWrap(e.target.checked)} />
            <span className="sf__toggle-slider" />
            <span className="sf__toggle-label">Word Wrap</span>
          </label>
          <label className="sf__indent-label">
            Indent:
            <select className="sf__indent-select" value={indentSize} onChange={e => setIndentSize(Number(e.target.value))}>
              <option value={2}>2</option>
              <option value={4}>4</option>
              <option value={8}>8</option>
            </select>
          </label>
          <button className="sf__icon-btn" onClick={toggleFullscreen} title="Fullscreen">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              {isFullscreen ? (
                <path d="M8 3v3a2 2 0 0 1-2 2H3m18 0h-3a2 2 0 0 1-2-2V3m0 18v-3a2 2 0 0 1 2-2h3M3 16h3a2 2 0 0 1 2 2v3" />
              ) : (
                <path d="M8 3H5a2 2 0 0 0-2 2v3m18 0V5a2 2 0 0 0-2-2h-3m0 18h3a2 2 0 0 0 2-2v-3M3 16v3a2 2 0 0 0 2 2h3" />
              )}
            </svg>
          </button>
          <button className="sf__icon-btn" onClick={toggleTheme} title="Toggle theme">
            {theme === 'dark' ? (
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <circle cx="12" cy="12" r="5" /><path d="M12 1v2M12 21v2M4.22 4.22l1.42 1.42M18.36 18.36l1.42 1.42M1 12h2M21 12h2M4.22 19.78l1.42-1.42M18.36 5.64l1.42-1.42" />
              </svg>
            ) : (
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z" />
              </svg>
            )}
          </button>
        </div>
      </header>

      {/* Tab Bar */}
      <div className="sf__chrome-tabs">
        <div className="sf__chrome-tabs-list">
          {tabs.map(tab => (
            <div
              key={tab.id}
              className={`sf__chrome-tab ${tab.id === activeTabId ? 'sf__chrome-tab--active' : ''}`}
              onClick={() => { setActiveTabId(tab.id); storage.set('sf_activeTab', tab.id); }}
            >
              {editingTabId === tab.id ? (
                <input
                  className="sf__chrome-tab-input"
                  defaultValue={tab.name}
                  autoFocus
                  onBlur={e => renameTab(tab.id, e.target.value || tab.name)}
                  onKeyDown={e => { if (e.key === 'Enter') renameTab(tab.id, e.target.value || tab.name); }}
                  onClick={e => e.stopPropagation()}
                />
              ) : (
                <span className="sf__chrome-tab-name" onDoubleClick={() => setEditingTabId(tab.id)}>
                  {tab.name}
                </span>
              )}
              {tab.description && <span className="sf__chrome-tab-desc" title={tab.description}>• {tab.description}</span>}
              {tabs.length > 1 && (
                <button className="sf__chrome-tab-close" onClick={e => { e.stopPropagation(); closeTab(tab.id); }}>×</button>
              )}
            </div>
          ))}
          <button className="sf__chrome-tab-add" onClick={addTab} title="New tab">+</button>
        </div>
        <div className="sf__chrome-tab-desc-bar">
          {editingDescId === activeTabId ? (
            <input
              className="sf__chrome-tab-desc-input"
              defaultValue={activeTab.description}
              autoFocus
              placeholder="Add a description..."
              onBlur={e => updateDescription(activeTabId, e.target.value)}
              onKeyDown={e => { if (e.key === 'Enter') updateDescription(activeTabId, e.target.value); }}
            />
          ) : (
            <span className="sf__chrome-tab-desc-text" onClick={() => setEditingDescId(activeTabId)}>
              {activeTab.description || 'Click to add description...'}
            </span>
          )}
        </div>
      </div>

      {/* Active Tab Content */}
      <SqlTab key={activeTab.id} tab={activeTab} updateTab={updateTab} monacoTheme={monacoTheme} wordWrap={wordWrap} indentSize={indentSize} />
    </div>
  );
}

export default SqlFormatter;
