import { useState, useCallback, useRef, useMemo } from 'react';
import MonacoEditor from '@monaco-editor/react';
import ValidationBadge from './components/ValidationBadge';
import TreeView from './components/TreeView';
import PlaygroundStats from './components/PlaygroundStats';
import Schema from './components/Schema';
import DiffViewer from './components/DiffViewer';
import History from './components/History';
import AIExplain from './components/AIExplain';
import './Playground.css';

const SAMPLE_JSON = `{
  "name": "DevToolsDeck Pro",
  "version": "2.0.0",
  "description": "Premium developer tools platform",
  "author": {
    "name": "DevToolsDeck Team",
    "email": "team@devtools.io",
    "url": "https://devtools.io"
  },
  "features": [
    "JSON Formatter",
    "API Tester",
    "Diff Checker",
    "SQL Formatter",
    "Regex Tester"
  ],
  "config": {
    "theme": "dark",
    "autoFormat": true,
    "tabSize": 2,
    "maxFileSize": 10485760
  },
  "stats": {
    "users": 24500,
    "tools": 60,
    "uptime": 99.99
  }
}`;

const toolbarActions = [
  { id: 'format', icon: '⚡', label: 'Format' },
  { id: 'validate', icon: '✓', label: 'Validate' },
  { id: 'minify', icon: '▬', label: 'Minify' },
  { id: 'prettify', icon: '✦', label: 'Prettify' },
  { id: 'copy', icon: '⧉', label: 'Copy' },
  { id: 'paste', icon: '📋', label: 'Paste' },
  { id: 'clear', icon: '✕', label: 'Clear' },
  { id: 'download', icon: '↓', label: 'Download' },
  { id: 'upload', icon: '↑', label: 'Upload' },
  { id: 'swap', icon: '⇄', label: 'Swap' },
  { id: 'convert', icon: '⟳', label: 'Convert' },
  { id: 'beautify', icon: '◆', label: 'Beautify' },
];

const dockTabs = [
  { id: 'tree', label: 'Tree View' },
  { id: 'stats', label: 'Statistics' },
  { id: 'schema', label: 'JSON Schema' },
  { id: 'errors', label: 'Errors' },
  { id: 'diff', label: 'Diff' },
  { id: 'history', label: 'History' },
  { id: 'ai', label: 'AI Explain' },
];

function Playground() {
  const [input, setInput] = useState(SAMPLE_JSON);
  const [output, setOutput] = useState('');
  const [isValid, setIsValid] = useState(true);
  const [error, setError] = useState('');
  const [processTime, setProcessTime] = useState(0);
  const [activeTab, setActiveTab] = useState('tree');
  const fileInputRef = useRef(null);

  const parsedData = useMemo(() => {
    try {
      return JSON.parse(input);
    } catch {
      return null;
    }
  }, [input]);

  const validate = useCallback((text) => {
    try {
      JSON.parse(text);
      setIsValid(true);
      setError('');
      return true;
    } catch (e) {
      setIsValid(false);
      setError(e.message);
      return false;
    }
  }, []);

  const handleFormat = useCallback(() => {
    const start = performance.now();
    try {
      const parsed = JSON.parse(input);
      const formatted = JSON.stringify(parsed, null, 2);
      setOutput(formatted);
      setIsValid(true);
      setError('');
    } catch (e) {
      setOutput('');
      setIsValid(false);
      setError(e.message);
    }
    setProcessTime(performance.now() - start);
  }, [input]);

  const handleMinify = useCallback(() => {
    const start = performance.now();
    try {
      const parsed = JSON.parse(input);
      const minified = JSON.stringify(parsed);
      setOutput(minified);
      setIsValid(true);
      setError('');
    } catch (e) {
      setOutput('');
      setIsValid(false);
      setError(e.message);
    }
    setProcessTime(performance.now() - start);
  }, [input]);

  const handleCopy = useCallback(() => {
    const text = output || input;
    navigator.clipboard.writeText(text);
  }, [input, output]);

  const handlePaste = useCallback(async () => {
    try {
      const text = await navigator.clipboard.readText();
      setInput(text);
      validate(text);
    } catch { /* clipboard access denied */ }
  }, [validate]);

  const handleClear = useCallback(() => {
    setInput('');
    setOutput('');
    setIsValid(true);
    setError('');
    setProcessTime(0);
  }, []);

  const handleDownload = useCallback(() => {
    const text = output || input;
    const blob = new Blob([text], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'formatted.json';
    a.click();
    URL.revokeObjectURL(url);
  }, [input, output]);

  const handleUpload = useCallback(() => {
    fileInputRef.current?.click();
  }, []);

  const handleFileChange = useCallback((e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => {
      const text = ev.target.result;
      setInput(text);
      validate(text);
    };
    reader.readAsText(file);
    e.target.value = '';
  }, [validate]);

  const handleSwap = useCallback(() => {
    if (output) {
      setInput(output);
      setOutput('');
    }
  }, [output]);

  const handleAction = useCallback((id) => {
    switch (id) {
      case 'format': case 'prettify': case 'beautify': handleFormat(); break;
      case 'validate': validate(input); break;
      case 'minify': handleMinify(); break;
      case 'copy': handleCopy(); break;
      case 'paste': handlePaste(); break;
      case 'clear': handleClear(); break;
      case 'download': handleDownload(); break;
      case 'upload': handleUpload(); break;
      case 'swap': handleSwap(); break;
      case 'convert': handleFormat(); break;
      default: break;
    }
  }, [handleFormat, handleMinify, handleCopy, handlePaste, handleClear, handleDownload, handleUpload, handleSwap, validate, input]);

  const handleInputChange = useCallback((value) => {
    setInput(value || '');
    validate(value || '');
  }, [validate]);

  const inputLines = input ? input.split('\n').length : 0;
  const inputChars = input ? input.length : 0;
  const inputSize = input ? new Blob([input]).size : 0;
  const outputSize = output ? new Blob([output]).size : 0;

  const renderDockContent = () => {
    switch (activeTab) {
      case 'tree': return <TreeView data={parsedData} />;
      case 'stats': return <PlaygroundStats data={parsedData} input={input} />;
      case 'schema': return <Schema data={parsedData} />;
      case 'errors': return (
        <div className="playground__dock-errors">
          {isValid ? (
            <div className="playground__dock-empty">No errors found ✓</div>
          ) : (
            <div className="playground__dock-error-msg">
              <span className="playground__dock-error-icon">✕</span>
              {error}
            </div>
          )}
        </div>
      );
      case 'diff': return <DiffViewer />;
      case 'history': return <History />;
      case 'ai': return <AIExplain />;
      default: return null;
    }
  };

  return (
    <section className="playground">
      <div className="playground__container">
        <div className="playground__header" data-reveal="fade-up">
          <h2 className="playground__title">Interactive Playground</h2>
          <p className="playground__subtitle">
            Try our developer tools instantly without leaving the page.
          </p>
        </div>

        {/* Editor Area */}
        <div className="playground__workspace">
          {/* Left Panel */}
          <div className="playground__panel playground__panel--input">
            <div className="playground__panel-header">
              <div className="playground__panel-dots">
                <span className="playground__dot playground__dot--red" />
                <span className="playground__dot playground__dot--yellow" />
                <span className="playground__dot playground__dot--green" />
              </div>
              <span className="playground__panel-title">JSON Input</span>
              <ValidationBadge isValid={isValid} error={error} />
            </div>
            <div className="playground__editor">
              <MonacoEditor
                height="100%"
                language="json"
                theme="vs-dark"
                value={input}
                onChange={handleInputChange}
                options={{
                  minimap: { enabled: false },
                  fontSize: 13,
                  lineNumbers: 'on',
                  scrollBeyondLastLine: false,
                  wordWrap: 'on',
                  padding: { top: 12 },
                  renderLineHighlight: 'none',
                  overviewRulerBorder: false,
                  hideCursorInOverviewRuler: true,
                  scrollbar: { verticalScrollbarSize: 6, horizontalScrollbarSize: 6 },
                }}
              />
            </div>
            <div className="playground__panel-footer">
              <span>{inputChars} chars</span>
              <span>{inputLines} lines</span>
              <span>{inputSize > 1024 ? `${(inputSize / 1024).toFixed(1)} KB` : `${inputSize} B`}</span>
              <span>UTF-8</span>
            </div>
          </div>

          {/* Floating Toolbar */}
          <div className="playground__toolbar">
            {toolbarActions.map((action) => (
              <button
                key={action.id}
                className="playground__toolbar-btn"
                onClick={() => handleAction(action.id)}
                title={action.label}
              >
                <span className="playground__toolbar-icon">{action.icon}</span>
                <span className="playground__toolbar-label">{action.label}</span>
              </button>
            ))}
          </div>

          {/* Right Panel */}
          <div className="playground__panel playground__panel--output">
            <div className="playground__panel-header">
              <div className="playground__panel-dots">
                <span className="playground__dot playground__dot--red" />
                <span className="playground__dot playground__dot--yellow" />
                <span className="playground__dot playground__dot--green" />
              </div>
              <span className="playground__panel-title">Formatted Output</span>
            </div>
            <div className="playground__editor">
              <MonacoEditor
                height="100%"
                language="json"
                theme="vs-dark"
                value={output}
                options={{
                  readOnly: true,
                  minimap: { enabled: false },
                  fontSize: 13,
                  lineNumbers: 'on',
                  scrollBeyondLastLine: false,
                  wordWrap: 'on',
                  padding: { top: 12 },
                  renderLineHighlight: 'none',
                  overviewRulerBorder: false,
                  hideCursorInOverviewRuler: true,
                  scrollbar: { verticalScrollbarSize: 6, horizontalScrollbarSize: 6 },
                }}
              />
            </div>
            <div className="playground__panel-footer">
              <span>{processTime > 0 ? `${processTime.toFixed(1)}ms` : '—'}</span>
              <span>{outputSize > 1024 ? `${(outputSize / 1024).toFixed(1)} KB` : `${outputSize} B`}</span>
              <ValidationBadge isValid={isValid} error={error} />
            </div>
          </div>
        </div>

        {/* Bottom Dock */}
        <div className="playground__dock">
          <div className="playground__dock-tabs">
            {dockTabs.map((tab) => (
              <button
                key={tab.id}
                className={`playground__dock-tab ${activeTab === tab.id ? 'playground__dock-tab--active' : ''}`}
                onClick={() => setActiveTab(tab.id)}
              >
                {tab.label}
              </button>
            ))}
          </div>
          <div className="playground__dock-content">
            {renderDockContent()}
          </div>
        </div>
      </div>

      {/* Hidden file input */}
      <input
        ref={fileInputRef}
        type="file"
        accept=".json,.txt"
        onChange={handleFileChange}
        style={{ display: 'none' }}
      />
    </section>
  );
}

export default Playground;
