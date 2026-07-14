import { useState, useCallback, useMemo, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTheme, useToolTheme } from '../../hooks/useTheme';
import { storage } from '../../utils/storage';
import './ColorConverter.css';
import Logo3D from '../../components/Logo3D/Logo3D';

// --- Color Conversion Utils ---
const clamp = (v, min, max) => Math.min(Math.max(v, min), max);

function hexToRgb(hex) {
  const h = hex.replace('#', '');
  const full = h.length === 3 ? h.split('').map(c => c + c).join('') : h;
  const n = parseInt(full, 16);
  return { r: (n >> 16) & 255, g: (n >> 8) & 255, b: n & 255 };
}

function rgbToHex({ r, g, b }) {
  return '#' + [r, g, b].map(v => clamp(v, 0, 255).toString(16).padStart(2, '0')).join('');
}

function rgbToHsl({ r, g, b }) {
  const rn = r / 255, gn = g / 255, bn = b / 255;
  const max = Math.max(rn, gn, bn), min = Math.min(rn, gn, bn);
  const l = (max + min) / 2;
  if (max === min) return { h: 0, s: 0, l: Math.round(l * 100) };
  const d = max - min;
  const s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
  let h = 0;
  if (max === rn) h = ((gn - bn) / d + (gn < bn ? 6 : 0)) / 6;
  else if (max === gn) h = ((bn - rn) / d + 2) / 6;
  else h = ((rn - gn) / d + 4) / 6;
  return { h: Math.round(h * 360), s: Math.round(s * 100), l: Math.round(l * 100) };
}

function hslToRgb({ h, s, l }) {
  const sn = s / 100, ln = l / 100;
  const c = (1 - Math.abs(2 * ln - 1)) * sn;
  const x = c * (1 - Math.abs(((h / 60) % 2) - 1));
  const m = ln - c / 2;
  let rn, gn, bn;
  if (h < 60) [rn, gn, bn] = [c, x, 0];
  else if (h < 120) [rn, gn, bn] = [x, c, 0];
  else if (h < 180) [rn, gn, bn] = [0, c, x];
  else if (h < 240) [rn, gn, bn] = [0, x, c];
  else if (h < 300) [rn, gn, bn] = [x, 0, c];
  else [rn, gn, bn] = [c, 0, x];
  return { r: Math.round((rn + m) * 255), g: Math.round((gn + m) * 255), b: Math.round((bn + m) * 255) };
}

function rgbToHsv({ r, g, b }) {
  const rn = r / 255, gn = g / 255, bn = b / 255;
  const max = Math.max(rn, gn, bn), min = Math.min(rn, gn, bn);
  const d = max - min;
  const v = Math.round(max * 100);
  const s = max === 0 ? 0 : Math.round((d / max) * 100);
  let h = 0;
  if (d !== 0) {
    if (max === rn) h = ((gn - bn) / d + (gn < bn ? 6 : 0)) / 6;
    else if (max === gn) h = ((bn - rn) / d + 2) / 6;
    else h = ((rn - gn) / d + 4) / 6;
  }
  return { h: Math.round(h * 360), s, v };
}

function hsvToRgb({ h, s, v }) {
  const sn = s / 100, vn = v / 100;
  const c = vn * sn;
  const x = c * (1 - Math.abs(((h / 60) % 2) - 1));
  const m = vn - c;
  let rn, gn, bn;
  if (h < 60) [rn, gn, bn] = [c, x, 0];
  else if (h < 120) [rn, gn, bn] = [x, c, 0];
  else if (h < 180) [rn, gn, bn] = [0, c, x];
  else if (h < 240) [rn, gn, bn] = [0, x, c];
  else if (h < 300) [rn, gn, bn] = [x, 0, c];
  else [rn, gn, bn] = [c, 0, x];
  return { r: Math.round((rn + m) * 255), g: Math.round((gn + m) * 255), b: Math.round((bn + m) * 255) };
}

function rgbToCmyk({ r, g, b }) {
  if (r === 0 && g === 0 && b === 0) return { c: 0, m: 0, y: 0, k: 100 };
  const rn = r / 255, gn = g / 255, bn = b / 255;
  const k = 1 - Math.max(rn, gn, bn);
  return {
    c: Math.round(((1 - rn - k) / (1 - k)) * 100),
    m: Math.round(((1 - gn - k) / (1 - k)) * 100),
    y: Math.round(((1 - bn - k) / (1 - k)) * 100),
    k: Math.round(k * 100),
  };
}

function cmykToRgb({ c, m, y, k }) {
  const kn = k / 100;
  return {
    r: Math.round(255 * (1 - c / 100) * (1 - kn)),
    g: Math.round(255 * (1 - m / 100) * (1 - kn)),
    b: Math.round(255 * (1 - y / 100) * (1 - kn)),
  };
}

function getContrastRatio(rgb1, rgb2) {
  const lum = ({ r, g, b }) => {
    const [rs, gs, bs] = [r, g, b].map(v => {
      v /= 255;
      return v <= 0.03928 ? v / 12.92 : Math.pow((v + 0.055) / 1.055, 2.4);
    });
    return 0.2126 * rs + 0.7152 * gs + 0.0722 * bs;
  };
  const l1 = lum(rgb1), l2 = lum(rgb2);
  const lighter = Math.max(l1, l2), darker = Math.min(l1, l2);
  return ((lighter + 0.05) / (darker + 0.05)).toFixed(2);
}

function randomHex() {
  return '#' + Math.floor(Math.random() * 16777215).toString(16).padStart(6, '0');
}

function parseAnyColor(str) {
  const s = str.trim().toLowerCase();
  // HEX
  if (/^#?[0-9a-f]{3}$/.test(s)) {
    const h = s.replace('#', '').split('').map(c => c + c).join('');
    return '#' + h;
  }
  if (/^#?[0-9a-f]{6}$/.test(s)) {
    return '#' + s.replace('#', '');
  }
  // rgb(a)
  const rgbMatch = s.match(/^rgba?\s*\(\s*(\d{1,3})\s*[,\s]\s*(\d{1,3})\s*[,\s]\s*(\d{1,3})/)
  if (rgbMatch) {
    return rgbToHex({ r: +rgbMatch[1], g: +rgbMatch[2], b: +rgbMatch[3] });
  }
  // hsl(a)
  const hslMatch = s.match(/^hsla?\s*\(\s*(\d{1,3})\s*[,\s]\s*(\d{1,3})%?\s*[,\s]\s*(\d{1,3})%?/);
  if (hslMatch) {
    return rgbToHex(hslToRgb({ h: +hslMatch[1], s: +hslMatch[2], l: +hslMatch[3] }));
  }
  // hsv
  const hsvMatch = s.match(/^hsv\s*\(\s*(\d{1,3})\s*[,\s]\s*(\d{1,3})%?\s*[,\s]\s*(\d{1,3})%?/);
  if (hsvMatch) {
    return rgbToHex(hsvToRgb({ h: +hsvMatch[1], s: +hsvMatch[2], v: +hsvMatch[3] }));
  }
  // cmyk
  const cmykMatch = s.match(/^cmyk\s*\(\s*(\d{1,3})%?\s*[,\s]\s*(\d{1,3})%?\s*[,\s]\s*(\d{1,3})%?\s*[,\s]\s*(\d{1,3})%?/);
  if (cmykMatch) {
    return rgbToHex(cmykToRgb({ c: +cmykMatch[1], m: +cmykMatch[2], y: +cmykMatch[3], k: +cmykMatch[4] }));
  }
  // plain numbers like "255, 100, 50" or "255 100 50"
  const plainRgb = s.match(/^(\d{1,3})\s*[,\s]\s*(\d{1,3})\s*[,\s]\s*(\d{1,3})$/);
  if (plainRgb) {
    return rgbToHex({ r: +plainRgb[1], g: +plainRgb[2], b: +plainRgb[3] });
  }
  return null;
}

// --- Tailwind palette approximation ---
const TAILWIND_SHADES = [50, 100, 200, 300, 400, 500, 600, 700, 800, 900, 950];
function generateShades(hex) {
  const rgb = hexToRgb(hex);
  const hsl = rgbToHsl(rgb);
  return TAILWIND_SHADES.map(shade => {
    const l = clamp(100 - (shade / 950) * 90, 5, 97);
    return { shade, hex: rgbToHex(hslToRgb({ h: hsl.h, s: hsl.s, l })) };
  });
}

const TABS = [
  { id: 'converter', label: 'Converter' },
  { id: 'palette', label: 'Palette & Shades' },
  { id: 'gradient', label: 'Gradient' },
  { id: 'accessibility', label: 'Accessibility' },
];

function ColorConverter() {
  const navigate = useNavigate();
  const { theme, toggleTheme } = useTheme();
  useToolTheme();
  const pickerRef = useRef(null);

  const [activeTab, setActiveTab] = useState('converter');
  const [hex, setHex] = useState(() => storage.get('cc_hex', '#5B8CFF'));
  const [opacity, setOpacity] = useState(100);
  const [favorites, setFavorites] = useState(() => storage.get('cc_favs', []));
  const [recents, setRecents] = useState(() => storage.get('cc_recents', []));
  const [copied, setCopied] = useState('');
  const [gradientEnd, setGradientEnd] = useState(() => storage.get('cc_grad_end', '#00D9FF'));

  const rgb = useMemo(() => hexToRgb(hex), [hex]);
  const hsl = useMemo(() => rgbToHsl(rgb), [rgb]);
  const hsv = useMemo(() => rgbToHsv(rgb), [rgb]);
  const cmyk = useMemo(() => rgbToCmyk(rgb), [rgb]);
  const rgba = useMemo(() => `rgba(${rgb.r}, ${rgb.g}, ${rgb.b}, ${(opacity / 100).toFixed(2)})`, [rgb, opacity]);

  const contrastWhite = useMemo(() => getContrastRatio(rgb, { r: 255, g: 255, b: 255 }), [rgb]);
  const contrastBlack = useMemo(() => getContrastRatio(rgb, { r: 0, g: 0, b: 0 }), [rgb]);
  const shades = useMemo(() => generateShades(hex), [hex]);

  useEffect(() => { storage.set('cc_hex', hex); }, [hex]);
  useEffect(() => { storage.set('cc_favs', favorites); }, [favorites]);
  useEffect(() => { storage.set('cc_recents', recents); }, [recents]);
  useEffect(() => { storage.set('cc_grad_end', gradientEnd); }, [gradientEnd]);

  const addRecent = useCallback((color) => {
    setRecents(prev => {
      const next = [color, ...prev.filter(c => c !== color)].slice(0, 16);
      return next;
    });
  }, []);

  const updateFromAnyColor = useCallback((val) => {
    const parsed = parseAnyColor(val);
    if (parsed) {
      setHex(parsed);
      addRecent(parsed);
    }
  }, [addRecent]);

  const handlePickerChange = (e) => {
    const val = e.target.value;
    setHex(val);
    addRecent(val);
  };

  const handleEyedropper = async () => {
    if (!window.EyeDropper) return;
    try {
      const dropper = new window.EyeDropper();
      const result = await dropper.open();
      setHex(result.sRGBHex.toLowerCase());
      addRecent(result.sRGBHex.toLowerCase());
    } catch {}
  };

  const handleRandom = () => {
    const c = randomHex();
    setHex(c);
    addRecent(c);
  };

  const handleReset = () => {
    setHex('#5b8cff');
    setOpacity(100);
  };

  const toggleFavorite = () => {
    setFavorites(prev =>
      prev.includes(hex) ? prev.filter(c => c !== hex) : [...prev, hex].slice(0, 24)
    );
  };

  const copyValue = useCallback((val, label) => {
    navigator.clipboard.writeText(val);
    setCopied(label);
    setTimeout(() => setCopied(''), 1200);
  }, []);

  const handlePaste = async () => {
    try {
      const text = (await navigator.clipboard.readText()).trim();
      updateFromAnyColor(text);
    } catch {}
  };

  const formatValues = useMemo(() => ({
    hex: hex.toUpperCase(),
    rgb: `rgb(${rgb.r}, ${rgb.g}, ${rgb.b})`,
    rgba,
    hsl: `hsl(${hsl.h}, ${hsl.s}%, ${hsl.l}%)`,
    hsv: `hsv(${hsv.h}, ${hsv.s}%, ${hsv.v}%)`,
    cmyk: `cmyk(${cmyk.c}%, ${cmyk.m}%, ${cmyk.y}%, ${cmyk.k}%)`,
    css: `--color-custom: ${hex};`,
    tailwind: `bg-[${hex}]`,
  }), [hex, rgb, rgba, hsl, hsv, cmyk]);

  return (
    <div className="cc">
      <header className="cc__header">
        <div className="cc__header-left">
          <a href="/" className="navbar__logo">
            <Logo3D size={32} />
            <span className="navbar__logo-text">Dev<span className="navbar__logo-highlight">Tools</span><span className="navbar__logo-deck">Deck</span></span>
          </a>
          <button className="cc__back" onClick={() => navigate('/')}>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M19 12H5M12 19l-7-7 7-7" /></svg>
            Back
          </button>
          <h1 className="cc__title">Color Converter</h1>
        </div>
        <div className="cc__header-right">
          <button className="cc__icon-btn" onClick={toggleTheme} title="Toggle theme">
            {theme === 'dark' ? (
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="5" /><path d="M12 1v2M12 21v2M4.22 4.22l1.42 1.42M18.36 18.36l1.42 1.42M1 12h2M21 12h2M4.22 19.78l1.42-1.42M18.36 5.64l1.42-1.42" /></svg>
            ) : (
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z" /></svg>
            )}
          </button>
        </div>
      </header>

      {/* Chrome Tabs */}
      <div className="cc__tabs">
        {TABS.map(tab => (
          <button
            key={tab.id}
            className={`cc__tab ${activeTab === tab.id ? 'cc__tab--active' : ''}`}
            onClick={() => setActiveTab(tab.id)}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Actions */}
      <div className="cc__actions">
        <button className="cc__action-btn" onClick={handleRandom}>🎲 Random</button>
        <button className="cc__action-btn" onClick={handlePaste}>📋 Paste</button>
        <button className="cc__action-btn" onClick={handleReset}>↺ Reset</button>
        <button className="cc__action-btn" onClick={toggleFavorite}>
          {favorites.includes(hex) ? '★' : '☆'} Save
        </button>
        {window.EyeDropper && (
          <button className="cc__action-btn" onClick={handleEyedropper}>💧 Eyedropper</button>
        )}
      </div>

      {activeTab === 'converter' && <div className="cc__layout">
        {/* Left: Picker + Preview */}
        <div className="cc__left">
          <div className="cc__card">
            <div className="cc__card-title">Color Picker</div>
            <input
              ref={pickerRef}
              type="color"
              className="cc__picker"
              value={hex}
              onChange={handlePickerChange}
            />
            <div className="cc__picker-input-wrap">
              <input
                className="cc__picker-input"
                placeholder="#hex, rgb(), hsl(), hsv(), cmyk()"
                id="picker-input"
                spellCheck={false}
              />
              <button className="cc__picker-search-btn" onClick={() => { const el = document.getElementById('picker-input'); updateFromAnyColor(el.value); }}>
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="11" cy="11" r="8"/><path d="M21 21l-4.35-4.35"/></svg>
              </button>
            </div>
            <div className="cc__preview" style={{ background: rgba }}>
              <span className="cc__preview-label">{hex.toUpperCase()}</span>
            </div>
            <div className="cc__opacity">
              <label className="cc__opacity-label">Opacity: {opacity}%</label>
              <input
                type="range"
                min="0"
                max="100"
                value={opacity}
                onChange={e => setOpacity(Number(e.target.value))}
                className="cc__slider"
              />
            </div>
          </div>
        </div>

        {/* Center: Conversion Fields */}
        <div className="cc__center">
          <div className="cc__card">
            <div className="cc__card-title">Color Values</div>
            {Object.entries(formatValues).slice(0, 6).map(([key, val]) => (
              <div className="cc__field" key={key}>
                <label className="cc__field-label">{key.toUpperCase()}</label>
                <div className="cc__field-row">
                  <input
                    className="cc__field-input"
                    value={val}
                    readOnly
                  />
                  <button
                    className="cc__copy-btn"
                    onClick={() => copyValue(val, key)}
                  >
                    {copied === key ? '✓' : '⧉'}
                  </button>
                </div>
              </div>
            ))}
            {/* Editable color input */}
            <div className="cc__field">
              <label className="cc__field-label">PASTE / EDIT (any format)</label>
              <div className="cc__field-row">
                <input
                  className="cc__field-input cc__field-input--editable"
                  defaultValue={hex}
                  onBlur={e => updateFromAnyColor(e.target.value)}
                  onKeyDown={e => e.key === 'Enter' && updateFromAnyColor(e.target.value)}
                  placeholder="#hex, rgb(), hsl(), hsv(), cmyk()"
                />
              </div>
            </div>
          </div>
        </div>

        {/* Right: Palette + Recents + Favorites */}
        <div className="cc__right">
          <div className="cc__card">
            <div className="cc__card-title">Favorites</div>
            <div className="cc__swatch-grid">
              {favorites.length === 0 && <span className="cc__empty">No favorites yet</span>}
              {favorites.map(c => (
                <button
                  key={c}
                  className="cc__swatch"
                  style={{ background: c }}
                  title={c}
                  onClick={() => { setHex(c); addRecent(c); }}
                />
              ))}
            </div>
          </div>
          <div className="cc__card">
            <div className="cc__card-title">Recent Colors</div>
            <div className="cc__swatch-grid">
              {recents.length === 0 && <span className="cc__empty">No recent colors</span>}
              {recents.map(c => (
                <button
                  key={c}
                  className="cc__swatch"
                  style={{ background: c }}
                  title={c}
                  onClick={() => { setHex(c); }}
                />
              ))}
            </div>
          </div>
        </div>
      </div>}

      {activeTab === 'palette' && <div className="cc__bottom">
        {/* Favorites & Recents */}
        <div className="cc__card cc__card--wide">
          <div className="cc__card-title">Favorites</div>
          <div className="cc__swatch-grid">
            {favorites.length === 0 && <span className="cc__empty">No favorites yet</span>}
            {favorites.map(c => (
              <button key={c} className="cc__swatch" style={{ background: c }} title={c} onClick={() => { setHex(c); addRecent(c); }} />
            ))}
          </div>
        </div>
        <div className="cc__card cc__card--wide">
          <div className="cc__card-title">Recent Colors</div>
          <div className="cc__swatch-grid">
            {recents.length === 0 && <span className="cc__empty">No recent colors</span>}
            {recents.map(c => (
              <button key={c} className="cc__swatch" style={{ background: c }} title={c} onClick={() => { setHex(c); }} />
            ))}
          </div>
        </div>
        {/* Tailwind Shades */}
        <div className="cc__card cc__card--wide">
          <div className="cc__card-title">Tailwind Color Shades</div>
          <div className="cc__shades">
            {shades.map(({ shade, hex: shadeHex }) => (
              <button
                key={shade}
                className="cc__shade"
                style={{ background: shadeHex }}
                title={`${shade}: ${shadeHex}`}
                onClick={() => copyValue(shadeHex, `shade-${shade}`)}
              >
                <span className="cc__shade-label">{shade}</span>
              </button>
            ))}
          </div>
        </div>
        {/* CSS Variables */}
        <div className="cc__card cc__card--wide">
          <div className="cc__card-title">CSS / Tailwind</div>
          <div className="cc__field">
            <div className="cc__field-row">
              <input className="cc__field-input" value={formatValues.css} readOnly />
              <button className="cc__copy-btn" onClick={() => copyValue(formatValues.css, 'css')}>{copied === 'css' ? '✓' : '⧉'}</button>
            </div>
          </div>
          <div className="cc__field">
            <div className="cc__field-row">
              <input className="cc__field-input" value={formatValues.tailwind} readOnly />
              <button className="cc__copy-btn" onClick={() => copyValue(formatValues.tailwind, 'tw')}>{copied === 'tw' ? '✓' : '⧉'}</button>
            </div>
          </div>
        </div>
      </div>}

      {activeTab === 'gradient' && <div className="cc__bottom">
        <div className="cc__card cc__card--wide">
          <div className="cc__card-title">Gradient Preview</div>
          <div className="cc__gradient-controls">
            <div className="cc__grad-group">
              <input type="color" value={hex} onChange={handlePickerChange} className="cc__grad-picker" />
              <div className="cc__picker-input-wrap cc__picker-input-wrap--sm">
                <input
                  className="cc__picker-input cc__picker-input--sm"
                  placeholder="Start color"
                  id="grad-start-input"
                  spellCheck={false}
                />
                <button className="cc__picker-search-btn cc__picker-search-btn--sm" onClick={() => { const el = document.getElementById('grad-start-input'); updateFromAnyColor(el.value); }}>
                  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="11" cy="11" r="8"/><path d="M21 21l-4.35-4.35"/></svg>
                </button>
              </div>
            </div>
            <span className="cc__grad-arrow">→</span>
            <div className="cc__grad-group">
              <input type="color" value={gradientEnd} onChange={e => setGradientEnd(e.target.value)} className="cc__grad-picker" />
              <div className="cc__picker-input-wrap cc__picker-input-wrap--sm">
                <input
                  className="cc__picker-input cc__picker-input--sm"
                  placeholder="End color"
                  id="grad-end-input"
                  spellCheck={false}
                />
                <button className="cc__picker-search-btn cc__picker-search-btn--sm" onClick={() => { const el = document.getElementById('grad-end-input'); const c = parseAnyColor(el.value); if (c) setGradientEnd(c); }}>
                  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="11" cy="11" r="8"/><path d="M21 21l-4.35-4.35"/></svg>
                </button>
              </div>
            </div>
            <button className="cc__copy-btn" onClick={() => copyValue(`linear-gradient(135deg, ${hex}, ${gradientEnd})`, 'gradient')}>
              {copied === 'gradient' ? '✓ Copied' : '⧉ Copy CSS'}
            </button>
          </div>
          <div className="cc__gradient-bar" style={{ background: `linear-gradient(135deg, ${hex}, ${gradientEnd})` }} />
        </div>
      </div>}

      {activeTab === 'accessibility' && <div className="cc__bottom">
        <div className="cc__card cc__card--wide">
          <div className="cc__card-title">Accessibility Contrast</div>
          <div className="cc__contrast-row">
            <div className="cc__contrast-item">
              <div className="cc__contrast-preview" style={{ background: hex, color: '#fff' }}>White Text</div>
              <span className="cc__contrast-ratio">{contrastWhite}:1 {contrastWhite >= 4.5 ? '✓ AA' : contrastWhite >= 3 ? '~ AA Large' : '✗ Fail'}</span>
            </div>
            <div className="cc__contrast-item">
              <div className="cc__contrast-preview" style={{ background: hex, color: '#000' }}>Black Text</div>
              <span className="cc__contrast-ratio">{contrastBlack}:1 {contrastBlack >= 4.5 ? '✓ AA' : contrastBlack >= 3 ? '~ AA Large' : '✗ Fail'}</span>
            </div>
          </div>
        </div>
      </div>}
    </div>
  );
}

export default ColorConverter;
