import { useState, useCallback, useMemo, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTheme, useToolTheme } from '../../hooks/useTheme';
import { storage } from '../../utils/storage';
import Minimap from '../../components/Minimap/Minimap';
import './Base64.css';
import Logo3D from '../../components/Logo3D/Logo3D';

const MODES = ['encode', 'decode', 'auto'];

function isBase64(str) {
  if (!str.trim()) return false;
  try {
    return btoa(atob(str)) === str || /^[A-Za-z0-9+/]*={0,2}$/.test(str.trim());
  } catch {
    return false;
  }
}

function Base64() {
  const navigate = useNavigate();
  const { theme, toggleTheme } = useTheme();
  useToolTheme();
  const [input, setInput] = useState(() => storage.get('b64_input', ''));
  const [mode, setMode] = useState(() => storage.get('b64_mode', 'encode'));
  const [copied, setCopied] = useState(false);
  const [error, setError] = useState('');
  const fileRef = useRef(null);
  const inputRef = useRef(null);
  const outputRef = useRef(null);

  const output = useMemo(() => {
    setError('');
    if (!input.trim()) return '';
    const activeMode = mode === 'auto' ? (isBase64(input.trim()) ? 'decode' : 'encode') : mode;
    try {
      if (activeMode === 'encode') {
        return btoa(unescape(encodeURIComponent(input)));
      } else {
        return decodeURIComponent(escape(atob(input.trim())));
      }
    } catch {
      setError(activeMode === 'decode' ? 'Invalid Base64 string' : 'Encoding failed');
      return '';
    }
  }, [input, mode]);

  const detectedMode = useMemo(() => {
    if (mode !== 'auto') return mode;
    return isBase64(input.trim()) ? 'decode' : 'encode';
  }, [input, mode]);

  const stats = useMemo(() => ({
    inputChars: input.length,
    inputLines: input ? input.split('\n').length : 0,
    outputChars: output.length,
    ratio: input.length ? ((output.length / input.length) * 100).toFixed(0) : 0,
  }), [input, output]);

  const handleCopy = useCallback(() => {
    if (!output) return;
    navigator.clipboard.writeText(output);
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  }, [output]);

  const handleDownload = useCallback(() => {
    if (!output) return;
    const blob = new Blob([output], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `base64-${detectedMode}d.txt`;
    a.click();
    URL.revokeObjectURL(url);
  }, [output, detectedMode]);

  const handleFileUpload = useCallback((e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    if (mode === 'encode' || mode === 'auto') {
      reader.onload = () => {
        const base64 = reader.result.split(',')[1];
        setInput(reader.result.includes(',') ? base64 : reader.result);
        setMode('decode');
      };
      reader.readAsDataURL(file);
    } else {
      reader.onload = () => setInput(reader.result);
      reader.readAsText(file);
    }
    e.target.value = '';
  }, [mode]);

  return (
    <div className="b64">
      <header className="b64__header">
        <div className="b64__header-left">
          <a href="/" className="navbar__logo">
            <Logo3D size={32} />
            <span className="navbar__logo-text">Dev<span className="navbar__logo-highlight">Tools</span><span className="navbar__logo-deck">Deck</span></span>
          </a>
          <button className="b64__back" onClick={() => navigate('/')}>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M19 12H5M12 19l-7-7 7-7" />
            </svg>
            Back
          </button>
          <h1 className="b64__title">Base64 Encoder / Decoder</h1>
        </div>
        <div className="b64__header-right">
          <button className="b64__icon-btn" onClick={toggleTheme} title="Toggle theme">
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

      {/* Mode Selector */}
      <div className="b64__modes">
        {MODES.map(m => (
          <button
            key={m}
            className={`b64__mode-btn ${mode === m ? 'b64__mode-btn--active' : ''}`}
            onClick={() => { setMode(m); storage.set('b64_mode', m); }}
          >
            {m === 'auto' ? 'Auto Detect' : m.charAt(0).toUpperCase() + m.slice(1)}
          </button>
        ))}
        {mode === 'auto' && input.trim() && (
          <span className="b64__detected">Detected: {detectedMode}</span>
        )}
      </div>

      {/* Main Content */}
      <div className="b64__grid">
        {/* Input */}
        <div className="b64__panel">
          <div className="b64__panel-header b64__panel-header--input">
            <span>Input</span>
            <div className="b64__panel-actions">
              <button className="b64__btn" onClick={() => fileRef.current?.click()}>📁 Upload</button>
              <button className="b64__btn" onClick={async () => { try { setInput(await navigator.clipboard.readText()); } catch {} }}>📋 Paste</button>
              <button className="b64__btn" onClick={() => setInput('')}>✕ Clear</button>
            </div>
          </div>
          <div className="b64__textarea-wrap">
            <textarea
              className="b64__textarea"
              ref={inputRef}
              value={input}
              onChange={e => { setInput(e.target.value); storage.set('b64_input', e.target.value); }}
              placeholder="Enter text to encode/decode..."
              spellCheck={false}
            />
            <Minimap containerRef={inputRef} />
          </div>
          <div className="b64__counter">{stats.inputChars} chars · {stats.inputLines} lines</div>
          <input ref={fileRef} type="file" hidden onChange={handleFileUpload} />
        </div>

        {/* Output */}
        <div className="b64__panel">
          <div className="b64__panel-header b64__panel-header--output">
            <span>Output</span>
            <div className="b64__panel-actions">
              <button className="b64__btn" onClick={handleCopy} disabled={!output}>
                {copied ? '✓ Copied' : '⧉ Copy'}
              </button>
              <button className="b64__btn" onClick={handleDownload} disabled={!output}>⬇ Download</button>
            </div>
          </div>
          <div className="b64__textarea-wrap">
            <textarea
              className="b64__textarea"
              ref={outputRef}
              value={error || output}
              readOnly
              placeholder="Result will appear here..."
            />
            <Minimap containerRef={outputRef} />
          </div>
          <div className="b64__counter">{stats.outputChars} chars</div>
        </div>
      </div>

      {/* Error */}
      {error && (
        <div className="b64__error">⚠ {error}</div>
      )}

      {/* Stats */}
      {output && (
        <div className="b64__stats">
          <div className="b64__stat">
            <span className="b64__stat-label">Mode</span>
            <span className="b64__stat-value">{detectedMode}</span>
          </div>
          <div className="b64__stat">
            <span className="b64__stat-label">Input Size</span>
            <span className="b64__stat-value">{stats.inputChars} chars</span>
          </div>
          <div className="b64__stat">
            <span className="b64__stat-label">Output Size</span>
            <span className="b64__stat-value">{stats.outputChars} chars</span>
          </div>
          <div className="b64__stat">
            <span className="b64__stat-label">Size Ratio</span>
            <span className="b64__stat-value">{stats.ratio}%</span>
          </div>
        </div>
      )}
    </div>
  );
}

export default Base64;
