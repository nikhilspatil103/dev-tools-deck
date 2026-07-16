import { useState, useCallback, useMemo, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import MonacoEditor from '@monaco-editor/react';
import { useTheme, useToolTheme } from '../../hooks/useTheme';
import { storage } from '../../utils/storage';
import SEO from '../../components/SEO/SEO';
import './HtmlFormatter.css';
import Logo3D from '../../components/Logo3D/Logo3D';

const SAMPLE_HTML = `<!DOCTYPE html>\n<html lang="en"><head><meta charset="UTF-8"><meta name="viewport" content="width=device-width, initial-scale=1.0"><title>Sample Page</title><style>body{margin:0;font-family:sans-serif}.container{max-width:1200px;margin:0 auto;padding:20px}</style></head><body><div class="container"><header><h1>Hello World</h1><nav><ul><li><a href="/">Home</a></li><li><a href="/about">About</a></li></ul></nav></header><main><section><p>This is a sample HTML document for formatting.</p><img src="image.png" alt="Sample"/></section></main><footer><p>&copy; 2024</p></footer></div><script>console.log("hello");</script></body></html>`;

let tabIdCounter = 1;

function createTab(name) {
  return { id: tabIdCounter++, name, description: '', input: SAMPLE_HTML, output: '' };
}

// --- HTML Formatter Utils ---
function beautifyHTML(html, indentSize = 2) {
  if (!html.trim()) return '';
  const indent = ' '.repeat(indentSize);
  const voidElements = new Set(['area','base','br','col','embed','hr','img','input','link','meta','param','source','track','wbr']);
  const rawElements = new Set(['script','style','pre','code','textarea']);

  let result = '';
  let level = 0;
  let i = 0;
  const len = html.length;

  while (i < len) {
    // Comment
    if (html.startsWith('<!--', i)) {
      const end = html.indexOf('-->', i);
      const comment = end === -1 ? html.slice(i) : html.slice(i, end + 3);
      result += indent.repeat(level) + comment.trim() + '\n';
      i += comment.length;
      continue;
    }
    // Doctype
    if (html.startsWith('<!', i)) {
      const end = html.indexOf('>', i);
      const doctype = end === -1 ? html.slice(i) : html.slice(i, end + 1);
      result += indent.repeat(level) + doctype.trim() + '\n';
      i += doctype.length;
      continue;
    }
    // Closing tag
    if (html.startsWith('</', i)) {
      const end = html.indexOf('>', i);
      const tag = end === -1 ? html.slice(i) : html.slice(i, end + 1);
      level = Math.max(0, level - 1);
      result += indent.repeat(level) + tag.trim() + '\n';
      i += tag.length;
      continue;
    }
    // Opening tag
    if (html[i] === '<') {
      const end = html.indexOf('>', i);
      const tag = end === -1 ? html.slice(i) : html.slice(i, end + 1);
      const tagNameMatch = tag.match(/^<([a-zA-Z][a-zA-Z0-9-]*)/);
      const tagName = tagNameMatch ? tagNameMatch[1].toLowerCase() : '';
      const selfClosing = tag.endsWith('/>') || voidElements.has(tagName);

      result += indent.repeat(level) + tag.trim() + '\n';
      i += tag.length;

      // Raw elements: grab content until closing tag
      if (rawElements.has(tagName) && !selfClosing) {
        const closeTag = `</${tagName}>`;
        const closeIdx = html.toLowerCase().indexOf(closeTag, i);
        if (closeIdx !== -1) {
          const content = html.slice(i, closeIdx).trim();
          if (content) {
            content.split('\n').forEach(line => {
              result += indent.repeat(level + 1) + line.trim() + '\n';
            });
          }
          level = Math.max(0, level);
          result += indent.repeat(level) + closeTag + '\n';
          i = closeIdx + closeTag.length;
        }
        continue;
      }

      if (!selfClosing) level++;
      continue;
    }
    // Text content
    let textEnd = html.indexOf('<', i);
    if (textEnd === -1) textEnd = len;
    const text = html.slice(i, textEnd).trim();
    if (text) {
      result += indent.repeat(level) + text + '\n';
    }
    i = textEnd;
  }

  return result.trimEnd();
}

function minifyHTML(html) {
  return html
    .replace(/<!--[\s\S]*?-->/g, '')
    .replace(/\s+/g, ' ')
    .replace(/>\s+</g, '><')
    .replace(/\s*\/>/g, '/>')
    .trim();
}

function validateHTML(html) {
  const issues = [];
  const stack = [];
  const voidElements = new Set(['area','base','br','col','embed','hr','img','input','link','meta','param','source','track','wbr']);
  const tagRegex = /<\/?([a-zA-Z][a-zA-Z0-9-]*)[^>]*\/?>/g;
  let match;

  while ((match = tagRegex.exec(html)) !== null) {
    const full = match[0];
    const tagName = match[1].toLowerCase();
    if (full.startsWith('</')) {
      if (stack.length === 0 || stack[stack.length - 1] !== tagName) {
        issues.push(`Unexpected closing tag </${tagName}> at position ${match.index}`);
      } else {
        stack.pop();
      }
    } else if (!voidElements.has(tagName) && !full.endsWith('/>')) {
      stack.push(tagName);
    }
  }

  stack.forEach(tag => issues.push(`Unclosed tag <${tag}>`));
  return issues;
}

function HtmlTab({ tab, updateTab, monacoTheme, wordWrap, indentSize }) {
  const { input, output } = tab;
  const [processTime, setProcessTime] = useState(0);
  const [showPreview, setShowPreview] = useState(false);
  const [showReplace, setShowReplace] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [replaceTerm, setReplaceTerm] = useState('');
  const [searchCount, setSearchCount] = useState(0);
  const [validationIssues, setValidationIssues] = useState([]);
  const inputEditorRef = useRef(null);
  const fileInputRef = useRef(null);

  const setInput = (v) => updateTab({ input: v });
  const setOutput = (v) => updateTab({ output: v });

  const stats = useMemo(() => {
    const chars = input.length;
    const lines = input ? input.split('\n').length : 0;
    const size = new Blob([input]).size;
    const tags = (input.match(/<[a-zA-Z][^>]*>/g) || []).length;
    const elements = (input.match(/<[a-zA-Z][a-zA-Z0-9-]*/g) || []).length;
    return { chars, lines, size, tags, elements };
  }, [input]);

  const handleBeautify = useCallback(() => {
    const start = performance.now();
    setOutput(beautifyHTML(input, indentSize));
    setProcessTime(performance.now() - start);
    setValidationIssues([]);
  }, [input, indentSize, setOutput]);

  const handleMinify = useCallback(() => {
    const start = performance.now();
    setOutput(minifyHTML(input));
    setProcessTime(performance.now() - start);
    setValidationIssues([]);
  }, [input, setOutput]);

  const handleValidate = useCallback(() => {
    const issues = validateHTML(input);
    setValidationIssues(issues);
  }, [input]);

  const handleCopy = useCallback(() => { navigator.clipboard.writeText(output || input); }, [input, output]);

  const handleDownload = useCallback(() => {
    const text = output || input;
    const blob = new Blob([text], { type: 'text/html' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a'); a.href = url; a.download = 'formatted.html'; a.click();
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
  }, [searchTerm, input]);

  const handleReplace = useCallback(() => {
    if (!searchTerm) return;
    const regex = new RegExp(searchTerm.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'gi');
    setInput(input.replace(regex, replaceTerm));
    setSearchCount(0);
  }, [searchTerm, replaceTerm, input, setInput]);

  const handleClear = useCallback(() => { setInput(''); setOutput(''); setProcessTime(0); setValidationIssues([]); }, [setInput, setOutput]);

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
    <div className="hf__tab-content-inner">
      {/* Search/Replace */}
      <div className="hf__search-bar">
        <div className="hf__search-group">
          <input
            className="hf__search-input"
            placeholder="Search..."
            value={searchTerm}
            onChange={e => setSearchTerm(e.target.value)}
            onKeyDown={e => { if (e.key === 'Enter') handleSearch(); }}
          />
          {searchCount > 0 && <span className="hf__search-count">{searchCount} found</span>}
          <button className="hf__search-btn" onClick={handleSearch}>Find</button>
          <button className="hf__search-btn" onClick={() => setShowReplace(!showReplace)}>
            {showReplace ? 'Hide' : 'Replace'}
          </button>
        </div>
        {showReplace && (
          <div className="hf__search-group">
            <input
              className="hf__search-input"
              placeholder="Replace with..."
              value={replaceTerm}
              onChange={e => setReplaceTerm(e.target.value)}
            />
            <button className="hf__search-btn" onClick={handleReplace}>Replace All</button>
          </div>
        )}
      </div>

      {/* Toolbar */}
      <div className="hf__toolbar">
        <button className="hf__toolbar-btn hf__toolbar-btn--primary" onClick={handleBeautify}>
          <span>⚡</span> Beautify <kbd>Ctrl+Enter</kbd>
        </button>
        <button className="hf__toolbar-btn" onClick={handleMinify}><span>▬</span> Minify</button>
        <button className="hf__toolbar-btn" onClick={handleValidate}><span>✓</span> Validate</button>
        <div className="hf__toolbar-divider" />
        <button className="hf__toolbar-btn" onClick={() => setShowPreview(!showPreview)}>
          <span>👁</span> {showPreview ? 'Editor' : 'Preview'}
        </button>
        <button className="hf__toolbar-btn" onClick={handleCopy}><span>⧉</span> Copy</button>
        <button className="hf__toolbar-btn" onClick={handleDownload}><span>↓</span> Download</button>
        <button className="hf__toolbar-btn" onClick={handleUpload}><span>↑</span> Upload</button>
        <button className="hf__toolbar-btn" onClick={handleClear}><span>✕</span> Clear</button>
      </div>

      {/* Validation Issues */}
      {validationIssues.length > 0 && (
        <div className="hf__validation">
          <span className="hf__validation-title">⚠ {validationIssues.length} issue{validationIssues.length > 1 ? 's' : ''} found</span>
          {validationIssues.slice(0, 5).map((issue, i) => (
            <span key={i} className="hf__validation-item">{issue}</span>
          ))}
          {validationIssues.length > 5 && <span className="hf__validation-item">...and {validationIssues.length - 5} more</span>}
        </div>
      )}
      {validationIssues.length === 0 && validationIssues !== undefined && input.trim() && processTime === 0 && (
        null
      )}

      {/* Main Content */}
      <div className="hf__main">
        <div className="hf__editors">
          <div className="hf__panel">
            <div className="hf__panel-header">
              <div className="hf__panel-dots">
                <span className="hf__dot hf__dot--red" />
                <span className="hf__dot hf__dot--yellow" />
                <span className="hf__dot hf__dot--green" />
              </div>
              <span className="hf__panel-title">Input</span>
              <span className="hf__panel-info">{stats.lines} lines · {stats.chars} chars</span>
            </div>
            <div className="hf__editor">
              <MonacoEditor
                height="100%"
                language="html"
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
                }}
              />
            </div>
          </div>
          <div className="hf__panel">
            <div className="hf__panel-header">
              <div className="hf__panel-dots">
                <span className="hf__dot hf__dot--red" />
                <span className="hf__dot hf__dot--yellow" />
                <span className="hf__dot hf__dot--green" />
              </div>
              <span className="hf__panel-title">{showPreview ? 'Preview' : 'Output'}</span>
              {processTime > 0 && <span className="hf__panel-info">{processTime.toFixed(1)}ms</span>}
            </div>
            <div className="hf__editor">
              {showPreview ? (
                <iframe
                  className="hf__preview-frame"
                  srcDoc={output || input}
                  title="HTML Preview"
                  sandbox="allow-scripts"
                />
              ) : (
                <MonacoEditor
                  height="100%"
                  language="html"
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
              )}
            </div>
          </div>
        </div>

        <aside className="hf__sidebar">
          <div className="hf__stats-card">
            <h3 className="hf__stats-title">Statistics</h3>
            <div className="hf__stats-grid">
              <div className="hf__stat"><span className="hf__stat-value">{stats.chars.toLocaleString()}</span><span className="hf__stat-label">Characters</span></div>
              <div className="hf__stat"><span className="hf__stat-value">{stats.lines}</span><span className="hf__stat-label">Lines</span></div>
              <div className="hf__stat"><span className="hf__stat-value">{stats.tags}</span><span className="hf__stat-label">Tags</span></div>
              <div className="hf__stat"><span className="hf__stat-value">{stats.elements}</span><span className="hf__stat-label">Elements</span></div>
              <div className="hf__stat"><span className="hf__stat-value">{stats.size > 1024 ? `${(stats.size / 1024).toFixed(1)}KB` : `${stats.size}B`}</span><span className="hf__stat-label">Size</span></div>
              <div className="hf__stat"><span className="hf__stat-value">{processTime > 0 ? `${processTime.toFixed(1)}ms` : '—'}</span><span className="hf__stat-label">Time</span></div>
            </div>
          </div>
        </aside>
      </div>

      <input ref={fileInputRef} type="file" accept=".html,.htm,.txt" onChange={handleFileChange} style={{ display: 'none' }} />
    </div>
  );
}

function HtmlFormatter() {
  const navigate = useNavigate();
  const { theme, toggleTheme } = useTheme();
  useToolTheme();
  const [tabs, setTabs] = useState(() => {
    const saved = storage.get('hf_tabs');
    if (saved) { tabIdCounter = Math.max(...saved.map(t => t.id)) + 1; return saved; }
    return [createTab('HTML 1')];
  });
  const [activeTabId, setActiveTabId] = useState(() => storage.get('hf_activeTab') || tabs[0]?.id);
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
    const newTab = createTab(`HTML ${tabs.length + 1}`);
    const next = [...tabs, newTab];
    setTabs(next); setActiveTabId(newTab.id);
    storage.set('hf_tabs', next); storage.set('hf_activeTab', newTab.id);
  };

  const closeTab = (id) => {
    if (tabs.length === 1) return;
    const newTabs = tabs.filter(t => t.id !== id);
    setTabs(newTabs); storage.set('hf_tabs', newTabs);
    if (activeTabId === id) {
      const newActive = newTabs[newTabs.length - 1].id;
      setActiveTabId(newActive); storage.set('hf_activeTab', newActive);
    }
  };

  const updateTab = useCallback((updates) => {
    setTabs(prev => {
      const next = prev.map(t => t.id === activeTabId ? { ...t, ...updates } : t);
      storage.set('hf_tabs', next);
      return next;
    });
  }, [activeTabId]);

  const renameTab = (id, name) => {
    setTabs(prev => { const next = prev.map(t => t.id === id ? { ...t, name } : t); storage.set('hf_tabs', next); return next; });
    setEditingTabId(null);
  };

  const updateDescription = (id, description) => {
    setTabs(prev => { const next = prev.map(t => t.id === id ? { ...t, description } : t); storage.set('hf_tabs', next); return next; });
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
      className={`hf ${isFullscreen ? 'hf--fullscreen' : ''}`}
      ref={containerRef}
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
    >
      <SEO title="HTML Formatter & Beautifier Online | Free HTML Pretty Print - DevToolsDeck" description="Free online HTML formatter and beautifier. Format, indent, and clean up HTML code instantly. 100% client-side processing." />
      {isDragging && (
        <div className="hf__drop-overlay">
          <div className="hf__drop-content">
            <span className="hf__drop-icon">📄</span>
            <span>Drop HTML file here</span>
          </div>
        </div>
      )}

      {/* Header */}
      <header className="hf__header">
        <div className="hf__header-left">
          <a href="/" className="navbar__logo">
            <Logo3D size={32} />
            <span className="navbar__logo-text">Dev<span className="navbar__logo-highlight">Tools</span><span className="navbar__logo-deck">Deck</span></span>
          </a>
          <button className="hf__back" onClick={() => navigate('/')}>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M19 12H5M12 19l-7-7 7-7" />
            </svg>
            Back
          </button>
          <h1 className="hf__title">HTML Formatter</h1>
        </div>
        <div className="hf__header-right">
          <label className="hf__toggle">
            <input type="checkbox" checked={wordWrap} onChange={(e) => setWordWrap(e.target.checked)} />
            <span className="hf__toggle-slider" />
            <span className="hf__toggle-label">Word Wrap</span>
          </label>
          <label className="hf__indent-label">
            Indent:
            <select className="hf__indent-select" value={indentSize} onChange={e => setIndentSize(Number(e.target.value))}>
              <option value={2}>2</option>
              <option value={4}>4</option>
              <option value={8}>8</option>
            </select>
          </label>
          <button className="hf__icon-btn" onClick={toggleFullscreen} title="Fullscreen">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              {isFullscreen ? (
                <path d="M8 3v3a2 2 0 0 1-2 2H3m18 0h-3a2 2 0 0 1-2-2V3m0 18v-3a2 2 0 0 1 2-2h3M3 16h3a2 2 0 0 1 2 2v3" />
              ) : (
                <path d="M8 3H5a2 2 0 0 0-2 2v3m18 0V5a2 2 0 0 0-2-2h-3m0 18h3a2 2 0 0 0 2-2v-3M3 16v3a2 2 0 0 0 2 2h3" />
              )}
            </svg>
          </button>
          <button className="hf__icon-btn" onClick={toggleTheme} title="Toggle theme">
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

      {/* Chrome Tabs */}
      <div className="hf__chrome-tabs">
        <div className="hf__chrome-tabs-list">
          {tabs.map(tab => (
            <div
              key={tab.id}
              className={`hf__chrome-tab ${tab.id === activeTabId ? 'hf__chrome-tab--active' : ''}`}
              onClick={() => { setActiveTabId(tab.id); storage.set('hf_activeTab', tab.id); }}
            >
              {editingTabId === tab.id ? (
                <input
                  className="hf__chrome-tab-input"
                  defaultValue={tab.name}
                  autoFocus
                  onBlur={e => renameTab(tab.id, e.target.value || tab.name)}
                  onKeyDown={e => { if (e.key === 'Enter') renameTab(tab.id, e.target.value || tab.name); }}
                  onClick={e => e.stopPropagation()}
                />
              ) : (
                <span className="hf__chrome-tab-name" onDoubleClick={() => setEditingTabId(tab.id)}>
                  {tab.name}
                </span>
              )}
              {tab.description && <span className="hf__chrome-tab-desc" title={tab.description}>• {tab.description}</span>}
              {tabs.length > 1 && (
                <button className="hf__chrome-tab-close" onClick={e => { e.stopPropagation(); closeTab(tab.id); }}>×</button>
              )}
            </div>
          ))}
          <button className="hf__chrome-tab-add" onClick={addTab} title="New tab">+</button>
        </div>
        <div className="hf__chrome-tab-desc-bar">
          {editingDescId === activeTabId ? (
            <input
              className="hf__chrome-tab-desc-input"
              defaultValue={activeTab.description}
              autoFocus
              placeholder="Add a description..."
              onBlur={e => updateDescription(activeTabId, e.target.value)}
              onKeyDown={e => { if (e.key === 'Enter') updateDescription(activeTabId, e.target.value); }}
            />
          ) : (
            <span className="hf__chrome-tab-desc-text" onClick={() => setEditingDescId(activeTabId)}>
              {activeTab.description || 'Click to add description...'}
            </span>
          )}
        </div>
      </div>

      {/* Active Tab Content */}
      <HtmlTab key={activeTab.id} tab={activeTab} updateTab={updateTab} monacoTheme={monacoTheme} wordWrap={wordWrap} indentSize={indentSize} />
    </div>
  );
}

export default HtmlFormatter;
