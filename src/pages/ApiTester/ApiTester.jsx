import { useState, useCallback, useMemo, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTheme, useToolTheme } from '../../hooks/useTheme';
import { storage } from '../../utils/storage';
import Minimap from '../../components/Minimap/Minimap';
import './ApiTester.css';
import Logo3D from '../../components/Logo3D/Logo3D';


const METHODS = ['GET', 'POST', 'PUT', 'PATCH', 'DELETE'];
const METHOD_COLORS = { GET: '#22c55e', POST: '#f59e0b', PUT: '#3b82f6', PATCH: '#a855f7', DELETE: '#ef4444' };
const TABS = ['Params', 'Headers', 'Body', 'Auth'];

// cURL parser
function parseCurl(curl) {
  const result = { method: 'GET', url: '', headers: [], body: '', authType: 'none', authToken: '' };
  const str = curl.replace(/\\\n/g, ' ').trim();
  const urlMatch = str.match(/curl\s+(?:['"])?([^\s'"]+)(?:['"])?/) || str.match(/curl\s+(?:-\w+\s+(?:['"][^'"]*['"]|\S+)\s+)*(?:['"])?([^\s'"]+)/);
  
  // Extract URL
  const parts = str.split(/\s+/);
  for (let i = 0; i < parts.length; i++) {
    if (parts[i] === 'curl') continue;
    if (parts[i].startsWith('-')) { if (['-X','-H','-d','--data','--data-raw','-u'].includes(parts[i])) i++; continue; }
    const cleaned = parts[i].replace(/^['"]|['"]$/g, '');
    if (cleaned.startsWith('http')) { result.url = cleaned; break; }
  }

  // Method
  const methodMatch = str.match(/-X\s+([A-Z]+)/);
  if (methodMatch) result.method = methodMatch[1];
  else if (str.match(/--data|\s-d\s/)) result.method = 'POST';

  // Headers
  const headerRegex = /-H\s+['"]([^'"]+)['"]/g;
  let hm;
  while ((hm = headerRegex.exec(str)) !== null) {
    const [key, ...vals] = hm[1].split(':');
    if (key) result.headers.push({ key: key.trim(), value: vals.join(':').trim() });
  }

  // Body
  const bodyMatch = str.match(/(?:--data-raw|--data|-d)\s+['"]([\s\S]*?)['"]/);
  if (bodyMatch) result.body = bodyMatch[1];

  // Basic auth
  const authMatch = str.match(/-u\s+['"]([^'"]+)['"]/);
  if (authMatch) { result.authType = 'basic'; result.authToken = authMatch[1]; }

  // Bearer from headers
  const authHeader = result.headers.find(h => h.key.toLowerCase() === 'authorization');
  if (authHeader) {
    if (authHeader.value.startsWith('Bearer ')) { result.authType = 'bearer'; result.authToken = authHeader.value.slice(7); }
    result.headers = result.headers.filter(h => h.key.toLowerCase() !== 'authorization');
  }

  return result;
}

// cURL generator
function generateCurl(request, interpolate) {
  let curl = `curl -X ${request.method}`;
  const url = interpolate(request.url);
  const params = request.params.filter(p => p.enabled && p.key);
  let fullUrl = url;
  if (params.length) {
    const qs = params.map(p => `${encodeURIComponent(interpolate(p.key))}=${encodeURIComponent(interpolate(p.value))}`).join('&');
    fullUrl += (fullUrl.includes('?') ? '&' : '?') + qs;
  }
  curl += ` '${fullUrl}'`;
  request.headers.filter(h => h.enabled && h.key).forEach(h => {
    curl += ` \\
  -H '${interpolate(h.key)}: ${interpolate(h.value)}'`;
  });
  if (request.authType === 'bearer' && request.authToken) {
    curl += ` \\
  -H 'Authorization: Bearer ${interpolate(request.authToken)}'`;
  } else if (request.authType === 'basic' && request.authToken) {
    curl += ` \\
  -u '${interpolate(request.authToken)}'`;
  }
  if (['POST', 'PUT', 'PATCH'].includes(request.method) && request.body.trim()) {
    curl += ` \\
  -d '${interpolate(request.body)}'`;
  }
  return curl;
}

function createKV(key = '', value = '', enabled = true) {
  return { id: Date.now() + Math.random(), key, value, enabled };
}

function createRequest() {
  return {
    id: Date.now() + Math.random(),
    name: 'New Request',
    method: 'GET',
    url: '',
    params: [createKV()],
    headers: [createKV('Content-Type', 'application/json')],
    body: '{\n  \n}',
    bodyType: 'json',
    formData: [createKV()],
    authType: 'none',
    authToken: '',
  };
}

function HighlightText({ text, search }) {
  if (!search || !search.trim()) return <>{text}</>;
  const parts = text.split(new RegExp(`(${search.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')})`, 'gi'));
  return <>{parts.map((part, i) => part.toLowerCase() === search.toLowerCase() ? <mark key={i} className="at__highlight">{part}</mark> : part)}</>;
}

function JsonTreeNode({ keyName, value, depth = 0, search }) {
  const [expanded, setExpanded] = useState(true);
  const isObject = value !== null && typeof value === 'object';
  const isArray = Array.isArray(value);

  if (!isObject) {
    const valueClass = typeof value === 'string' ? 'at__tree-string'
      : typeof value === 'number' ? 'at__tree-number'
      : typeof value === 'boolean' ? 'at__tree-bool'
      : 'at__tree-null';
    const display = value === null ? 'null' : JSON.stringify(value);
    return (
      <div className="at__tree-row" style={{ paddingLeft: depth * 16 }}>
        {keyName !== null && <span className="at__tree-key"><HighlightText text={String(keyName)} search={search} />: </span>}
        <span className={valueClass}><HighlightText text={display} search={search} /></span>
      </div>
    );
  }

  const entries = isArray ? value.map((v, i) => [i, v]) : Object.entries(value);
  const bracket = isArray ? ['[', ']'] : ['{', '}'];

  return (
    <div className="at__tree-node">
      <div className="at__tree-row at__tree-row--parent" style={{ paddingLeft: depth * 16 }} onClick={() => setExpanded(!expanded)}>
        <span className={`at__tree-arrow ${expanded ? 'at__tree-arrow--open' : ''}`}>▶</span>
        {keyName !== null && <span className="at__tree-key"><HighlightText text={String(keyName)} search={search} />: </span>}
        <span className="at__tree-bracket">{bracket[0]}</span>
        {!expanded && <span className="at__tree-collapsed"> {entries.length} items {bracket[1]}</span>}
      </div>
      {expanded && (
        <>
          {entries.map(([k, v]) => <JsonTreeNode key={k} keyName={isArray ? k : k} value={v} depth={depth + 1} search={search} />)}
          <div className="at__tree-row" style={{ paddingLeft: depth * 16 }}>
            <span className="at__tree-bracket">{bracket[1]}</span>
          </div>
        </>
      )}
    </div>
  );
}

function JsonTree({ data, search }) {
  return (
    <div className="at__tree">
      <JsonTreeNode keyName={null} value={data} depth={0} search={search} />
    </div>
  );
}

function ApiTester() {
  const navigate = useNavigate();
  const { theme, toggleTheme } = useTheme();
  useToolTheme();

  // State
  const [request, setRequest] = useState(() => storage.get('api_request', createRequest()));
  const [response, setResponse] = useState(null);
  const [loading, setLoading] = useState(false);
  const [activeTab, setActiveTab] = useState('Params');
  const [responseTab, setResponseTab] = useState('pretty');
  const [history, setHistory] = useState(() => storage.get('api_history', []));
  const [collections, setCollections] = useState(() => storage.get('api_collections', []));
  const [envVars, setEnvVars] = useState(() => storage.get('api_env', [createKV('BASE_URL', 'https://jsonplaceholder.typicode.com')]));
  const [sidePanel, setSidePanel] = useState('history');
  const [showSide, setShowSide] = useState(true);
  const [newCollName, setNewCollName] = useState('');
  const abortRef = useRef(null);
  const [showCurlModal, setShowCurlModal] = useState(false);
  const [curlInput, setCurlInput] = useState('');
  const [timeout, setTimeout_] = useState(() => storage.get('api_timeout', 30000));
  const [showCodeGen, setShowCodeGen] = useState(false);
  const [codeGenLang, setCodeGenLang] = useState('fetch');
  const [responseSearch, setResponseSearch] = useState('');
  const [resFullscreen, setResFullscreen] = useState(false);
  const resBodyRef = useRef(null);

  // Persist
  useEffect(() => { storage.set('api_request', request); }, [request]);
  useEffect(() => { storage.set('api_history', history); }, [history]);
  useEffect(() => { storage.set('api_collections', collections); }, [collections]);
  useEffect(() => { storage.set('api_env', envVars); }, [envVars]);
  useEffect(() => { storage.set('api_timeout', timeout); }, [timeout]);

  // Env variable interpolation
  const interpolate = useCallback((str) => {
    if (!str) return str;
    return str.replace(/\{\{(\w+)\}\}/g, (_, name) => {
      const v = envVars.find(e => e.key === name && e.enabled);
      return v ? v.value : `{{${name}}}`;
    });
  }, [envVars]);

  // Build URL with params
  const buildUrl = useCallback(() => {
    let url = interpolate(request.url);
    const params = request.params.filter(p => p.enabled && p.key);
    if (params.length) {
      const qs = params.map(p => `${encodeURIComponent(interpolate(p.key))}=${encodeURIComponent(interpolate(p.value))}`).join('&');
      url += (url.includes('?') ? '&' : '?') + qs;
    }
    return url;
  }, [request, interpolate]);

  // Send request
  const handleSend = useCallback(async () => {
    const url = buildUrl();
    if (!url) return;

    setLoading(true);
    setResponse(null);
    abortRef.current = new AbortController();
    const timeoutId = timeout > 0 ? window.setTimeout(() => abortRef.current?.abort(), timeout) : null;

    const headers = {};
    request.headers.filter(h => h.enabled && h.key).forEach(h => {
      headers[interpolate(h.key)] = interpolate(h.value);
    });

    if (request.authType === 'bearer' && request.authToken) {
      headers['Authorization'] = `Bearer ${interpolate(request.authToken)}`;
    } else if (request.authType === 'basic' && request.authToken) {
      headers['Authorization'] = `Basic ${btoa(interpolate(request.authToken))}`;
    }

    const opts = { method: request.method, headers, signal: abortRef.current.signal };
    if (['POST', 'PUT', 'PATCH'].includes(request.method)) {
      if (request.bodyType === 'form-data') {
        const formData = new FormData();
        request.formData.filter(f => f.enabled && f.key).forEach(f => formData.append(interpolate(f.key), interpolate(f.value)));
        delete headers['Content-Type'];
        opts.body = formData;
      } else if (request.bodyType === 'x-www-form-urlencoded') {
        const params = new URLSearchParams();
        request.formData.filter(f => f.enabled && f.key).forEach(f => params.append(interpolate(f.key), interpolate(f.value)));
        headers['Content-Type'] = 'application/x-www-form-urlencoded';
        opts.body = params.toString();
      } else if (request.body.trim()) {
        opts.body = interpolate(request.body);
      }
    }

    const start = performance.now();
    try {
      const res = await fetch(url, opts);
      const time = performance.now() - start;
      const contentType = res.headers.get('content-type') || '';
      const text = await res.text();
      let json = null;
      try { json = JSON.parse(text); } catch {}

      const resHeaders = {};
      res.headers.forEach((v, k) => { resHeaders[k] = v; });

      if (timeoutId) clearTimeout(timeoutId);
      const result = { status: res.status, statusText: res.statusText, time, size: text.length, headers: resHeaders, body: text, json, contentType };
      setResponse(result);

      // Add to history
      const entry = { id: Date.now(), method: request.method, url: request.url, status: res.status, time, timestamp: Date.now() };
      setHistory(prev => [entry, ...prev].slice(0, 50));
    } catch (err) {
      if (timeoutId) clearTimeout(timeoutId);
      if (err.name === 'AbortError') {
        setResponse({ status: 0, statusText: 'Timeout', time: performance.now() - start, body: `Request timed out after ${timeout / 1000}s`, json: null, headers: {}, size: 0, contentType: '' });
      } else {
        setResponse({ status: 0, statusText: 'Error', time: performance.now() - start, body: err.message, json: null, headers: {}, size: 0, contentType: '' });
      }
    }
    setLoading(false);
  }, [request, buildUrl, interpolate]);

  const handleCancel = () => { abortRef.current?.abort(); setLoading(false); };

  // Request updates
  const updateReq = (updates) => setRequest(prev => ({ ...prev, ...updates }));
  const updateKVList = (field, id, key, value) => {
    setRequest(prev => ({
      ...prev,
      [field]: prev[field].map(item => item.id === id ? { ...item, [key]: value } : item),
    }));
  };
  const addKV = (field) => setRequest(prev => ({ ...prev, [field]: [...prev[field], createKV()] }));
  const removeKV = (field, id) => setRequest(prev => ({ ...prev, [field]: prev[field].filter(item => item.id !== id) }));

  // Collections
  const saveToCollection = (collName) => {
    setCollections(prev => {
      const existing = prev.find(c => c.name === collName);
      const entry = { ...request, id: Date.now() + Math.random(), savedAt: Date.now() };
      if (existing) {
        return prev.map(c => c.name === collName ? { ...c, requests: [...c.requests, entry] } : c);
      }
      return [...prev, { name: collName, requests: [entry] }];
    });
  };

  const createCollection = () => {
    if (!newCollName.trim()) return;
    saveToCollection(newCollName.trim());
    setNewCollName('');
  };

  const loadRequest = (req) => {
    setRequest({ ...req, id: Date.now() });
    setShowSide(false);
  };

  const loadFromHistory = (entry) => {
    updateReq({ method: entry.method, url: entry.url });
    setShowSide(false);
  };

  // cURL import
  const importCurl = () => {
    if (!curlInput.trim()) return;
    const parsed = parseCurl(curlInput);
    const headers = parsed.headers.map(h => createKV(h.key, h.value));
    if (!headers.length) headers.push(createKV());
    setRequest(prev => ({ ...prev, method: parsed.method, url: parsed.url, headers, body: parsed.body || prev.body, authType: parsed.authType, authToken: parsed.authToken }));
    setShowCurlModal(false);
    setCurlInput('');
  };

  // cURL export
  const exportCurl = () => {
    const curl = generateCurl(request, interpolate);
    navigator.clipboard.writeText(curl);
  };

  // Code generation
  const generateCode = () => {
    const url = buildUrl();
    const headers = {};
    request.headers.filter(h => h.enabled && h.key).forEach(h => { headers[interpolate(h.key)] = interpolate(h.value); });
    if (request.authType === 'bearer' && request.authToken) headers['Authorization'] = `Bearer ${interpolate(request.authToken)}`;
    const hasBody = ['POST', 'PUT', 'PATCH'].includes(request.method) && request.body.trim();

    if (codeGenLang === 'fetch') {
      let code = `fetch('${url}'`;
      const opts = [];
      opts.push(`  method: '${request.method}'`);
      if (Object.keys(headers).length) opts.push(`  headers: ${JSON.stringify(headers, null, 4).replace(/\n/g, '\n  ')}`);
      if (hasBody) opts.push(`  body: JSON.stringify(${request.body.trim()})`);
      code += `, {\n${opts.join(',\n')}\n}`;
      code += `)\n  .then(res => res.json())\n  .then(data => console.log(data))\n  .catch(err => console.error(err));`;
      return code;
    }
    if (codeGenLang === 'axios') {
      let code = `axios({\n  method: '${request.method.toLowerCase()}',\n  url: '${url}'`;
      if (Object.keys(headers).length) code += `,\n  headers: ${JSON.stringify(headers, null, 4).replace(/\n/g, '\n  ')}`;
      if (hasBody) code += `,\n  data: ${request.body.trim()}`;
      code += `\n})\n  .then(res => console.log(res.data))\n  .catch(err => console.error(err));`;
      return code;
    }
    if (codeGenLang === 'python') {
      let code = `import requests\n\nresponse = requests.${request.method.toLowerCase()}(\n    '${url}'`;
      if (Object.keys(headers).length) code += `,\n    headers=${JSON.stringify(headers).replace(/"/g, "'")}`;
      if (hasBody) code += `,\n    json=${request.body.trim()}`;
      code += `\n)\nprint(response.json())`;
      return code;
    }
    return generateCurl(request, interpolate);
  };

  // Status color
  const statusColor = (code) => {
    if (code >= 200 && code < 300) return '#22c55e';
    if (code >= 300 && code < 400) return '#f59e0b';
    if (code >= 400 && code < 500) return '#ef4444';
    if (code >= 500) return '#dc2626';
    return '#a1a1aa';
  };

  const formatSize = (bytes) => bytes > 1024 ? `${(bytes / 1024).toFixed(1)} KB` : `${bytes} B`;

  // Highlight search in response
  const getResponseText = (text) => {
    if (!responseSearch.trim()) return text;
    return text;
  };

  const searchMatchCount = useMemo(() => {
    if (!response || !responseSearch.trim()) return 0;
    const body = response.json ? JSON.stringify(response.json, null, 2) : response.body;
    const regex = new RegExp(responseSearch.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'gi');
    return (body.match(regex) || []).length;
  }, [response, responseSearch]);

  // Env var updates
  const updateEnv = (id, key, value) => setEnvVars(prev => prev.map(e => e.id === id ? { ...e, [key]: value } : e));
  const addEnv = () => setEnvVars(prev => [...prev, createKV()]);
  const removeEnv = (id) => setEnvVars(prev => prev.filter(e => e.id !== id));

  return (
    <div className="at">
      {/* Header */}
      <header className="at__header">
        <div className="at__header-left">
          <a href="/" className="navbar__logo">
            <Logo3D size={32} />
            <span className="navbar__logo-text">Dev<span className="navbar__logo-highlight">Tools</span><span className="navbar__logo-deck">Deck</span></span>
          </a>
          <button className="at__back" onClick={() => navigate('/')}>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M19 12H5M12 19l-7-7 7-7" /></svg>
            Back
          </button>
          <h1 className="at__title">API Tester</h1>
        </div>
        <div className="at__header-right">
          <button className={`at__side-toggle ${showSide ? 'at__side-toggle--active' : ''}`} onClick={() => setShowSide(!showSide)}>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M3 3h18v18H3zM9 3v18" /></svg>
          </button>
          <button className="at__icon-btn" onClick={toggleTheme} title="Toggle theme">
            {theme === 'dark' ? (
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="5" /><path d="M12 1v2M12 21v2M4.22 4.22l1.42 1.42M18.36 18.36l1.42 1.42M1 12h2M21 12h2M4.22 19.78l1.42-1.42M18.36 5.64l1.42-1.42" /></svg>
            ) : (
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z" /></svg>
            )}
          </button>
        </div>
      </header>

      <div className="at__layout">
        {/* Side Panel */}
        {showSide && (
          <aside className="at__side">
            <div className="at__side-tabs">
              <button className={`at__side-tab ${sidePanel === 'history' ? 'at__side-tab--active' : ''}`} onClick={() => setSidePanel('history')}>History</button>
              <button className={`at__side-tab ${sidePanel === 'collections' ? 'at__side-tab--active' : ''}`} onClick={() => setSidePanel('collections')}>Collections</button>
              <button className={`at__side-tab ${sidePanel === 'env' ? 'at__side-tab--active' : ''}`} onClick={() => setSidePanel('env')}>Env</button>
            </div>

            <div className="at__side-content">
              {sidePanel === 'history' && (
                <div className="at__history">
                  {history.length === 0 && <p className="at__empty">No history yet</p>}
                  {history.map(h => (
                    <div key={h.id} className="at__history-item" onClick={() => loadFromHistory(h)}>
                      <span className="at__history-method" style={{ color: METHOD_COLORS[h.method] }}>{h.method}</span>
                      <span className="at__history-url">{h.url}</span>
                      <span className="at__history-status" style={{ color: statusColor(h.status) }}>{h.status}</span>
                    </div>
                  ))}
                  {history.length > 0 && <button className="at__clear-btn" onClick={() => setHistory([])}>Clear History</button>}
                </div>
              )}

              {sidePanel === 'collections' && (
                <div className="at__collections">
                  <div className="at__coll-add">
                    <input className="at__coll-input" value={newCollName} onChange={e => setNewCollName(e.target.value)} placeholder="Collection name" onKeyDown={e => e.key === 'Enter' && createCollection()} />
                    <button className="at__coll-btn" onClick={createCollection}>+</button>
                  </div>
                  <div className="at__coll-actions">
                    <button className="at__coll-action-btn" onClick={() => {
                      const json = JSON.stringify(collections, null, 2);
                      const blob = new Blob([json], { type: 'application/json' });
                      const url = URL.createObjectURL(blob);
                      const a = document.createElement('a'); a.href = url; a.download = 'api-collections.json'; a.click();
                      URL.revokeObjectURL(url);
                    }}>Export</button>
                    <button className="at__coll-action-btn" onClick={() => {
                      const input = document.createElement('input'); input.type = 'file'; input.accept = '.json';
                      input.onchange = (e) => {
                        const file = e.target.files[0]; if (!file) return;
                        const reader = new FileReader();
                        reader.onload = (ev) => { try { const data = JSON.parse(ev.target.result); setCollections(data); } catch {} };
                        reader.readAsText(file);
                      };
                      input.click();
                    }}>Import</button>
                  </div>
                  {collections.length === 0 && <p className="at__empty">No collections</p>}
                  {collections.map(coll => (
                    <details key={coll.name} className="at__coll-group">
                      <summary className="at__coll-name">
                        {coll.name} <span className="at__coll-count">({coll.requests.length})</span>
                        <button className="at__coll-del" onClick={(e) => { e.preventDefault(); setCollections(prev => prev.filter(c => c.name !== coll.name)); }}>×</button>
                      </summary>
                      {coll.requests.map(req => (
                        <div key={req.id} className="at__coll-item" onClick={() => loadRequest(req)}>
                          <span style={{ color: METHOD_COLORS[req.method] }}>{req.method}</span>
                          <span className="at__coll-url">{req.name || req.url}</span>
                        </div>
                      ))}
                    </details>
                  ))}
                </div>
              )}

              {sidePanel === 'env' && (
                <div className="at__env">
                  {envVars.map(env => (
                    <div key={env.id} className="at__env-row">
                      <input type="checkbox" checked={env.enabled} onChange={e => updateEnv(env.id, 'enabled', e.target.checked)} />
                      <input className="at__env-input" value={env.key} onChange={e => updateEnv(env.id, 'key', e.target.value)} placeholder="Key" />
                      <input className="at__env-input" value={env.value} onChange={e => updateEnv(env.id, 'value', e.target.value)} placeholder="Value" />
                      <button className="at__env-del" onClick={() => removeEnv(env.id)}>×</button>
                    </div>
                  ))}
                  <button className="at__add-btn" onClick={addEnv}>+ Add Variable</button>
                  <p className="at__env-hint">Use {'{{VAR_NAME}}'} in URLs, headers, or body</p>
                </div>
              )}
            </div>
          </aside>
        )}

        {/* Main */}
        <main className="at__main">
          {/* URL Bar */}
          <div className="at__url-bar">
            <select className="at__method" style={{ color: METHOD_COLORS[request.method] }} value={request.method} onChange={e => updateReq({ method: e.target.value })}>
              {METHODS.map(m => <option key={m} value={m}>{m}</option>)}
            </select>
            <input
              className="at__url-input"
              value={request.url}
              onChange={e => updateReq({ url: e.target.value })}
              placeholder="Enter URL or paste cURL... (use {{VAR}} for env variables)"
              onKeyDown={e => e.key === 'Enter' && handleSend()}
            />
            <select className="at__timeout-select" value={timeout} onChange={e => setTimeout_(Number(e.target.value))} title="Request timeout">
              <option value={5000}>5s</option>
              <option value={10000}>10s</option>
              <option value={30000}>30s</option>
              <option value={60000}>60s</option>
              <option value={120000}>2m</option>
              <option value={0}>No limit</option>
            </select>
            {loading ? (
              <button className="at__send-btn at__send-btn--cancel" onClick={handleCancel}>Cancel</button>
            ) : (
              <button className="at__send-btn" onClick={handleSend}>Send</button>
            )}
            <button className="at__save-btn" onClick={() => { if (collections.length) saveToCollection(collections[0].name); else { setShowSide(true); setSidePanel('collections'); } }} title="Save Request">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v11a2 2 0 0 1-2 2z" /><polyline points="17,21 17,13 7,13 7,21" /><polyline points="7,3 7,8 15,8" /></svg>
            </button>
            <button className="at__curl-btn" onClick={() => setShowCurlModal(true)} title="Import cURL">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M4 17l6-6-6-6M12 19h8" /></svg>
            </button>
            <button className="at__curl-btn" onClick={exportCurl} title="Copy as cURL">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="9" y="9" width="13" height="13" rx="2" /><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1" /></svg>
            </button>
            <button className="at__curl-btn" onClick={() => setShowCodeGen(true)} title="Generate Code">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="16 18 22 12 16 6" /><polyline points="8 6 2 12 8 18" /></svg>
            </button>
          </div>

          {/* Request Tabs */}
          <div className="at__req-tabs">
            {TABS.map(tab => (
              <button key={tab} className={`at__req-tab ${activeTab === tab ? 'at__req-tab--active' : ''}`} onClick={() => setActiveTab(tab)}>
                {tab}
                {tab === 'Params' && request.params.filter(p => p.key).length > 0 && <span className="at__tab-badge">{request.params.filter(p => p.key).length}</span>}
                {tab === 'Headers' && request.headers.filter(h => h.key).length > 0 && <span className="at__tab-badge">{request.headers.filter(h => h.key).length}</span>}
              </button>
            ))}
          </div>

          {/* Tab Content */}
          <div className="at__req-content">
            {(activeTab === 'Params' || activeTab === 'Headers') && (
              <div className="at__kv-list">
                {request[activeTab.toLowerCase()].map(item => (
                  <div key={item.id} className="at__kv-row">
                    <input type="checkbox" checked={item.enabled} onChange={e => updateKVList(activeTab.toLowerCase(), item.id, 'enabled', e.target.checked)} />
                    <input className="at__kv-input" value={item.key} onChange={e => updateKVList(activeTab.toLowerCase(), item.id, 'key', e.target.value)} placeholder="Key" />
                    <input className="at__kv-input" value={item.value} onChange={e => updateKVList(activeTab.toLowerCase(), item.id, 'value', e.target.value)} placeholder="Value" />
                    <button className="at__kv-del" onClick={() => removeKV(activeTab.toLowerCase(), item.id)}>×</button>
                  </div>
                ))}
                <button className="at__add-btn" onClick={() => addKV(activeTab.toLowerCase())}>+ Add {activeTab === 'Params' ? 'Parameter' : 'Header'}</button>
              </div>
            )}

            {activeTab === 'Body' && (
              <div className="at__body-editor">
                <div className="at__body-type-bar">
                  {['json', 'text', 'form-data', 'x-www-form-urlencoded', 'graphql'].map(t => (
                    <button key={t} className={`at__body-type-btn ${request.bodyType === t ? 'at__body-type-btn--active' : ''}`} onClick={() => updateReq({ bodyType: t })}>{t}</button>
                  ))}
                </div>
                {(request.bodyType === 'json' || request.bodyType === 'text' || request.bodyType === 'graphql') && (
                  <textarea
                    className="at__body-textarea"
                    value={request.body}
                    onChange={e => updateReq({ body: e.target.value })}
                    placeholder={request.bodyType === 'graphql' ? '{ query { ... } }' : '{"key": "value"}'}
                    spellCheck={false}
                  />
                )}
                {(request.bodyType === 'form-data' || request.bodyType === 'x-www-form-urlencoded') && (
                  <div className="at__kv-list">
                    {request.formData.map(item => (
                      <div key={item.id} className="at__kv-row">
                        <input type="checkbox" checked={item.enabled} onChange={e => setRequest(prev => ({ ...prev, formData: prev.formData.map(f => f.id === item.id ? { ...f, enabled: e.target.checked } : f) }))} />
                        <input className="at__kv-input" value={item.key} onChange={e => setRequest(prev => ({ ...prev, formData: prev.formData.map(f => f.id === item.id ? { ...f, key: e.target.value } : f) }))} placeholder="Key" />
                        <input className="at__kv-input" value={item.value} onChange={e => setRequest(prev => ({ ...prev, formData: prev.formData.map(f => f.id === item.id ? { ...f, value: e.target.value } : f) }))} placeholder="Value" />
                        <button className="at__kv-del" onClick={() => setRequest(prev => ({ ...prev, formData: prev.formData.filter(f => f.id !== item.id) }))}>×</button>
                      </div>
                    ))}
                    <button className="at__add-btn" onClick={() => setRequest(prev => ({ ...prev, formData: [...prev.formData, createKV()] }))}>+ Add Field</button>
                  </div>
                )}
              </div>
            )}

            {activeTab === 'Auth' && (
              <div className="at__auth">
                <div className="at__auth-type">
                  <label className="at__auth-label">Type</label>
                  <select className="at__auth-select" value={request.authType} onChange={e => updateReq({ authType: e.target.value })}>
                    <option value="none">No Auth</option>
                    <option value="bearer">Bearer Token</option>
                    <option value="basic">Basic Auth</option>
                  </select>
                </div>
                {request.authType !== 'none' && (
                  <div className="at__auth-field">
                    <label className="at__auth-label">{request.authType === 'bearer' ? 'Token' : 'username:password'}</label>
                    <input
                      className="at__auth-input"
                      type="password"
                      value={request.authToken}
                      onChange={e => updateReq({ authToken: e.target.value })}
                      placeholder={request.authType === 'bearer' ? 'Enter token...' : 'username:password'}
                    />
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Response */}
          {(response || loading) && (
            <div className={`at__response ${resFullscreen ? 'at__response--fullscreen' : ''}`}>
              <div className="at__res-header">
                <h3 className="at__res-title">Response</h3>
                {response && (
                  <div className="at__res-meta">
                    <span className="at__res-status" style={{ color: statusColor(response.status) }}>
                      {response.status} {response.statusText}
                    </span>
                    <span className="at__res-time">
                      <span className="at__res-time-bar" style={{ width: `${Math.min(response.time / 20, 100)}%`, background: response.time < 300 ? '#22c55e' : response.time < 1000 ? '#f59e0b' : '#ef4444' }} />
                      {response.time.toFixed(0)} ms
                    </span>
                    <span className="at__res-size">{formatSize(response.size)}</span>
                    <input className="at__res-search" value={responseSearch} onChange={e => setResponseSearch(e.target.value)} placeholder="Search..." />
                    {responseSearch && <span className="at__res-match-count">{searchMatchCount} matches</span>}
                    <button className="at__res-copy" onClick={() => navigator.clipboard.writeText(response.body)}>⧉ Copy</button>
                    <button className="at__res-fullscreen" onClick={() => setResFullscreen(!resFullscreen)} title={resFullscreen ? 'Exit fullscreen' : 'Fullscreen'}>
                      {resFullscreen ? (
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                          <path d="M8 3v3a2 2 0 0 1-2 2H3m18 0h-3a2 2 0 0 1-2-2V3m0 18v-3a2 2 0 0 1 2-2h3M3 16h3a2 2 0 0 1 2 2v3" />
                        </svg>
                      ) : (
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                          <path d="M15 3h6v6M9 21H3v-6M21 3l-7 7M3 21l7-7" />
                        </svg>
                      )}
                    </button>
                  </div>
                )}
              </div>

              {loading && (
                <div className="at__loading">
                  <div className="at__spinner" />
                  <span>Sending request...</span>
                </div>
              )}

              {response && !loading && (
                <>
                  <div className="at__res-tabs">
                    <button className={`at__res-tab ${responseTab === 'pretty' ? 'at__res-tab--active' : ''}`} onClick={() => setResponseTab('pretty')}>Pretty</button>
                    <button className={`at__res-tab ${responseTab === 'tree' ? 'at__res-tab--active' : ''}`} onClick={() => setResponseTab('tree')}>Tree</button>
                    <button className={`at__res-tab ${responseTab === 'raw' ? 'at__res-tab--active' : ''}`} onClick={() => setResponseTab('raw')}>Raw</button>
                    <button className={`at__res-tab ${responseTab === 'headers' ? 'at__res-tab--active' : ''}`} onClick={() => setResponseTab('headers')}>Headers</button>
                  </div>
                  <div className="at__res-body-wrap">
                    <div className="at__res-body" ref={resBodyRef}>
                      {responseTab === 'pretty' && (
                        <pre className="at__res-pre" dangerouslySetInnerHTML={{ __html: (() => {
                          const text = response.json ? JSON.stringify(response.json, null, 2) : response.body;
                          if (!responseSearch.trim()) return text.replace(/</g, '&lt;');
                          const escaped = text.replace(/</g, '&lt;');
                          return escaped.replace(new RegExp(`(${responseSearch.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')})`, 'gi'), '<mark class="at__highlight">$1</mark>');
                        })() }} />
                      )}
                      {responseTab === 'tree' && (
                        <div className="at__res-tree">
                          {response.json ? <JsonTree data={response.json} search={responseSearch} /> : <span className="at__res-tree-empty">Response is not valid JSON</span>}
                        </div>
                      )}
                      {responseTab === 'raw' && (
                        <pre className="at__res-pre at__res-pre--raw" dangerouslySetInnerHTML={{ __html: (() => {
                          const text = response.body;
                          if (!responseSearch.trim()) return text.replace(/</g, '&lt;');
                          const escaped = text.replace(/</g, '&lt;');
                          return escaped.replace(new RegExp(`(${responseSearch.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')})`, 'gi'), '<mark class="at__highlight">$1</mark>');
                        })() }} />
                      )}
                      {responseTab === 'headers' && (
                        <div className="at__res-headers">
                          {Object.entries(response.headers).map(([k, v]) => (
                            <div key={k} className="at__res-header-row">
                              <span className="at__res-hkey">{k}</span>
                              <span className="at__res-hval">{v}</span>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                    <Minimap containerRef={resBodyRef} />
                  </div>
                </>
              )}
            </div>
          )}
        </main>
      </div>

      {/* cURL Import Modal */}
      {showCurlModal && (
        <div className="at__modal-overlay" onClick={() => setShowCurlModal(false)}>
          <div className="at__modal" onClick={e => e.stopPropagation()}>
            <h3 className="at__modal-title">Import cURL</h3>
            <textarea
              className="at__modal-textarea"
              value={curlInput}
              onChange={e => setCurlInput(e.target.value)}
              placeholder="Paste cURL command here..."
              rows={8}
              autoFocus
            />
            <div className="at__modal-actions">
              <button className="at__modal-btn at__modal-btn--cancel" onClick={() => setShowCurlModal(false)}>Cancel</button>
              <button className="at__modal-btn at__modal-btn--import" onClick={importCurl}>Import</button>
            </div>
          </div>
        </div>
      )}

      {/* Code Generation Modal */}
      {showCodeGen && (
        <div className="at__modal-overlay" onClick={() => setShowCodeGen(false)}>
          <div className="at__modal at__modal--wide" onClick={e => e.stopPropagation()}>
            <div className="at__modal-header">
              <h3 className="at__modal-title">Generate Code</h3>
              <div className="at__codegen-tabs">
                {['fetch', 'axios', 'python', 'curl'].map(lang => (
                  <button key={lang} className={`at__codegen-tab ${codeGenLang === lang ? 'at__codegen-tab--active' : ''}`} onClick={() => setCodeGenLang(lang)}>{lang}</button>
                ))}
              </div>
            </div>
            <pre className="at__codegen-pre">{generateCode()}</pre>
            <div className="at__modal-actions">
              <button className="at__modal-btn at__modal-btn--cancel" onClick={() => setShowCodeGen(false)}>Close</button>
              <button className="at__modal-btn at__modal-btn--import" onClick={() => navigator.clipboard.writeText(generateCode())}>Copy</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default ApiTester;
