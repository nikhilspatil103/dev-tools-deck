import { useState, useCallback, useMemo, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTheme, useToolTheme } from '../../hooks/useTheme';
import { storage } from '../../utils/storage';
import Minimap from '../../components/Minimap/Minimap';
import './JwtDecoder.css';
import Logo3D from '../../components/Logo3D/Logo3D';

const SAMPLE_JWT = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiIxMjM0NTY3ODkwIiwibmFtZSI6IkpvaG4gRG9lIiwiaWF0IjoxNTE2MjM5MDIyLCJleHAiOjE3MTYyMzkwMjIsIm5iZiI6MTUxNjIzOTAyMn0.SflKxwRJSMeKKF2QT4fwpMeJf36POk6yJV_adQssw5c';

function base64UrlDecode(str) {
  let base64 = str.replace(/-/g, '+').replace(/_/g, '/');
  const pad = base64.length % 4;
  if (pad) base64 += '='.repeat(4 - pad);
  try {
    return JSON.parse(atob(base64));
  } catch {
    return null;
  }
}

function formatTime(ts) {
  if (!ts) return '—';
  const d = new Date(ts * 1000);
  return d.toLocaleString();
}

function JwtDecoder() {
  const navigate = useNavigate();
  const { theme, toggleTheme } = useTheme();
  useToolTheme();
  const [token, setToken] = useState(() => storage.get('jwt_token', SAMPLE_JWT));
  const [copied, setCopied] = useState(null);
  const headerRef = useRef(null);
  const payloadRef = useRef(null);

  const decoded = useMemo(() => {
    const parts = token.trim().split('.');
    if (parts.length !== 3) return null;
    const header = base64UrlDecode(parts[0]);
    const payload = base64UrlDecode(parts[1]);
    if (!header || !payload) return null;
    return { header, payload, signature: parts[2] };
  }, [token]);

  const isExpired = useMemo(() => {
    if (!decoded?.payload?.exp) return null;
    return Date.now() / 1000 > decoded.payload.exp;
  }, [decoded]);

  const validationStatus = useMemo(() => {
    if (!token.trim()) return { status: 'empty', message: 'Enter a JWT token' };
    if (!decoded) return { status: 'invalid', message: 'Invalid JWT format' };
    if (isExpired === true) return { status: 'expired', message: 'Token is expired' };
    if (isExpired === false) return { status: 'valid', message: 'Token is valid (not expired)' };
    return { status: 'valid', message: 'Token decoded successfully' };
  }, [token, decoded, isExpired]);

  const handleCopy = useCallback((text, label) => {
    navigator.clipboard.writeText(text);
    setCopied(label);
    setTimeout(() => setCopied(null), 1500);
  }, []);

  const handlePaste = useCallback(async () => {
    try {
      const text = await navigator.clipboard.readText();
      setToken(text);
    } catch {}
  }, []);

  return (
    <div className="jwt">
      <header className="jwt__header">
        <div className="jwt__header-left">
          <a href="/" className="navbar__logo">
            <Logo3D size={32} />
            <span className="navbar__logo-text">Dev<span className="navbar__logo-highlight">Tools</span><span className="navbar__logo-deck">Deck</span></span>
          </a>
          <button className="jwt__back" onClick={() => navigate('/')}>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M19 12H5M12 19l-7-7 7-7" />
            </svg>
            Back
          </button>
          <h1 className="jwt__title">JWT Decoder</h1>
          <span className={`jwt__badge jwt__badge--${validationStatus.status}`}>
            {validationStatus.message}
          </span>
        </div>
        <div className="jwt__header-right">
          <button className="jwt__icon-btn" onClick={toggleTheme} title="Toggle theme">
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

      {/* Input */}
      <div className="jwt__input-section">
        <div className="jwt__input-header">
          <span>Encoded Token</span>
          <div className="jwt__input-actions">
            <button className="jwt__btn" onClick={handlePaste}>📋 Paste</button>
            <button className="jwt__btn" onClick={() => setToken('')}>✕ Clear</button>
          </div>
        </div>
        <textarea
          className="jwt__textarea"
          value={token}
          onChange={e => { setToken(e.target.value); storage.set('jwt_token', e.target.value); }}
          placeholder="Paste your JWT token here..."
          spellCheck={false}
        />
      </div>

      {/* Decoded Output */}
      {decoded && (
        <div className="jwt__output">
          {/* Header */}
          <div className="jwt__card">
            <div className="jwt__card-header jwt__card-header--header">
              <h3 className="jwt__card-title jwt__card-title--header">Header</h3>
              <button
                className="jwt__copy-btn"
                onClick={() => handleCopy(JSON.stringify(decoded.header, null, 2), 'header')}
              >
                {copied === 'header' ? '✓ Copied' : '⧉ Copy'}
              </button>
            </div>
            <div className="jwt__code-wrap">
              <pre className="jwt__code" ref={headerRef}>{JSON.stringify(decoded.header, null, 2)}</pre>
              <Minimap containerRef={headerRef} />
            </div>
            <div className="jwt__meta">
              <span className="jwt__meta-item">
                <span className="jwt__meta-label">Algorithm</span>
                <span className="jwt__meta-value">{decoded.header.alg || '—'}</span>
              </span>
              <span className="jwt__meta-item">
                <span className="jwt__meta-label">Type</span>
                <span className="jwt__meta-value">{decoded.header.typ || '—'}</span>
              </span>
            </div>
          </div>

          {/* Payload */}
          <div className="jwt__card">
            <div className="jwt__card-header jwt__card-header--payload">
              <h3 className="jwt__card-title jwt__card-title--payload">Payload</h3>
              <button
                className="jwt__copy-btn"
                onClick={() => handleCopy(JSON.stringify(decoded.payload, null, 2), 'payload')}
              >
                {copied === 'payload' ? '✓ Copied' : '⧉ Copy'}
              </button>
            </div>
            <div className="jwt__code-wrap">
              <pre className="jwt__code" ref={payloadRef}>{JSON.stringify(decoded.payload, null, 2)}</pre>
              <Minimap containerRef={payloadRef} />
            </div>
            <div className="jwt__meta">
              {decoded.payload.exp && (
                <span className="jwt__meta-item">
                  <span className="jwt__meta-label">Expiration</span>
                  <span className={`jwt__meta-value ${isExpired ? 'jwt__meta-value--expired' : 'jwt__meta-value--valid'}`}>
                    {formatTime(decoded.payload.exp)}
                  </span>
                </span>
              )}
              {decoded.payload.iat && (
                <span className="jwt__meta-item">
                  <span className="jwt__meta-label">Issued At</span>
                  <span className="jwt__meta-value">{formatTime(decoded.payload.iat)}</span>
                </span>
              )}
              {decoded.payload.nbf && (
                <span className="jwt__meta-item">
                  <span className="jwt__meta-label">Not Before</span>
                  <span className="jwt__meta-value">{formatTime(decoded.payload.nbf)}</span>
                </span>
              )}
              {decoded.payload.sub && (
                <span className="jwt__meta-item">
                  <span className="jwt__meta-label">Subject</span>
                  <span className="jwt__meta-value">{decoded.payload.sub}</span>
                </span>
              )}
            </div>
          </div>

          {/* Signature */}
          <div className="jwt__card">
            <div className="jwt__card-header jwt__card-header--signature">
              <h3 className="jwt__card-title jwt__card-title--signature">Signature</h3>
            </div>
            <pre className="jwt__code jwt__code--sig">{decoded.signature}</pre>
            <p className="jwt__sig-note">
              Signature verification requires a secret key. Paste your token — decoding does not verify the signature.
            </p>
          </div>
        </div>
      )}

      {/* Invalid state */}
      {!decoded && token.trim() && (
        <div className="jwt__error">
          <span>⚠</span> Invalid JWT token. A valid JWT has 3 base64url-encoded parts separated by dots.
        </div>
      )}
    </div>
  );
}

export default JwtDecoder;
