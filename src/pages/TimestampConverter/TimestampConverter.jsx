import { useState, useCallback, useMemo, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTheme, useToolTheme } from '../../hooks/useTheme';
import './TimestampConverter.css';
import Logo3D from '../../components/Logo3D/Logo3D';

const TIMEZONES = Intl.supportedValuesOf?.('timeZone') || [
  'UTC', 'America/New_York', 'America/Chicago', 'America/Denver', 'America/Los_Angeles',
  'Europe/London', 'Europe/Paris', 'Europe/Berlin', 'Asia/Tokyo', 'Asia/Shanghai',
  'Asia/Kolkata', 'Asia/Dubai', 'Australia/Sydney', 'Pacific/Auckland',
];

function getRelativeTime(date) {
  const now = Date.now();
  const diff = now - date.getTime();
  const abs = Math.abs(diff);
  const future = diff < 0;
  const suffix = future ? 'from now' : 'ago';

  if (abs < 60000) return 'just now';
  if (abs < 3600000) return `${Math.floor(abs / 60000)} minute${Math.floor(abs / 60000) > 1 ? 's' : ''} ${suffix}`;
  if (abs < 86400000) return `${Math.floor(abs / 3600000)} hour${Math.floor(abs / 3600000) > 1 ? 's' : ''} ${suffix}`;
  if (abs < 2592000000) return `${Math.floor(abs / 86400000)} day${Math.floor(abs / 86400000) > 1 ? 's' : ''} ${suffix}`;
  if (abs < 31536000000) return `${Math.floor(abs / 2592000000)} month${Math.floor(abs / 2592000000) > 1 ? 's' : ''} ${suffix}`;
  return `${Math.floor(abs / 31536000000)} year${Math.floor(abs / 31536000000) > 1 ? 's' : ''} ${suffix}`;
}

function TimestampConverter() {
  const navigate = useNavigate();
  const { theme, toggleTheme } = useTheme();
  useToolTheme();

  const [input, setInput] = useState('');
  const [unit, setUnit] = useState('seconds');
  const [timezone, setTimezone] = useState(Intl.DateTimeFormat().resolvedOptions().timeZone);
  const [now, setNow] = useState(Date.now());
  const [copied, setCopied] = useState('');
  const [dateInput, setDateInput] = useState('');
  const [timeInput, setTimeInput] = useState('');

  useEffect(() => {
    const id = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(id);
  }, []);

  const parsed = useMemo(() => {
    if (!input.trim()) return null;
    const num = Number(input.trim());
    if (isNaN(num)) {
      const d = new Date(input.trim());
      return isNaN(d.getTime()) ? null : d;
    }
    const ms = unit === 'seconds' ? num * 1000 : num;
    const d = new Date(ms);
    return isNaN(d.getTime()) ? null : d;
  }, [input, unit]);

  const results = useMemo(() => {
    if (!parsed) return null;
    const ts = parsed.getTime();
    return {
      unix: Math.floor(ts / 1000),
      unixMs: ts,
      utc: parsed.toUTCString(),
      local: parsed.toLocaleString('en-US', { timeZone: timezone, dateStyle: 'full', timeStyle: 'long' }),
      iso: parsed.toISOString(),
      relative: getRelativeTime(parsed),
      timezone: parsed.toLocaleString('en-US', { timeZone: timezone, timeZoneName: 'longOffset' }),
    };
  }, [parsed, timezone]);

  const handleNow = () => {
    const ts = Math.floor(Date.now() / (unit === 'seconds' ? 1000 : 1));
    setInput(String(ts));
  };

  const handleClear = () => {
    setInput('');
    setDateInput('');
    setTimeInput('');
  };

  const handleSwap = () => {
    if (!results) return;
    setUnit(u => u === 'seconds' ? 'milliseconds' : 'seconds');
    setInput(String(unit === 'seconds' ? results.unixMs : results.unix));
  };

  const handleDateTimeConvert = () => {
    if (!dateInput) return;
    const dtStr = `${dateInput}T${timeInput || '00:00'}`;
    const d = new Date(dtStr);
    if (!isNaN(d.getTime())) {
      const ts = unit === 'seconds' ? Math.floor(d.getTime() / 1000) : d.getTime();
      setInput(String(ts));
    }
  };

  const copy = useCallback((val, label) => {
    navigator.clipboard.writeText(String(val));
    setCopied(label);
    setTimeout(() => setCopied(''), 1200);
  }, []);

  const nowDate = new Date(now);

  return (
    <div className="ts">
      <header className="ts__header">
        <div className="ts__header-left">
          <a href="/" className="navbar__logo">
            <Logo3D size={32} />
            <span className="navbar__logo-text">Dev<span className="navbar__logo-highlight">Tools</span><span className="navbar__logo-deck">Deck</span></span>
          </a>
          <button className="ts__back" onClick={() => navigate('/')}>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M19 12H5M12 19l-7-7 7-7" /></svg>
            Back
          </button>
          <h1 className="ts__title">Timestamp Converter</h1>
        </div>
        <div className="ts__header-right">
          <button className="ts__icon-btn" onClick={toggleTheme} title="Toggle theme">
            {theme === 'dark' ? (
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="5" /><path d="M12 1v2M12 21v2M4.22 4.22l1.42 1.42M18.36 18.36l1.42 1.42M1 12h2M21 12h2M4.22 19.78l1.42-1.42M18.36 5.64l1.42-1.42" /></svg>
            ) : (
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z" /></svg>
            )}
          </button>
        </div>
      </header>

      {/* Live Clock */}
      <div className="ts__clock">
        <div className="ts__clock-item">
          <span className="ts__clock-label">Current Unix</span>
          <span className="ts__clock-value">{Math.floor(now / 1000)}</span>
        </div>
        <div className="ts__clock-item">
          <span className="ts__clock-label">UTC</span>
          <span className="ts__clock-value">{nowDate.toUTCString()}</span>
        </div>
        <div className="ts__clock-item">
          <span className="ts__clock-label">Local</span>
          <span className="ts__clock-value">{nowDate.toLocaleString()}</span>
        </div>
      </div>

      {/* Input Section */}
      <div className="ts__input-section">
        <div className="ts__card">
          <div className="ts__card-title">Timestamp Input</div>
          <div className="ts__input-row">
            <input
              className="ts__input"
              value={input}
              onChange={e => setInput(e.target.value)}
              placeholder="Enter Unix timestamp or date string..."
              spellCheck={false}
            />
            <select className="ts__select" value={unit} onChange={e => setUnit(e.target.value)}>
              <option value="seconds">Seconds</option>
              <option value="milliseconds">Milliseconds</option>
            </select>
          </div>
          <div className="ts__input-row ts__input-row--pickers">
            <input type="date" className="ts__date-input" value={dateInput} onChange={e => setDateInput(e.target.value)} />
            <input type="time" className="ts__date-input" value={timeInput} onChange={e => setTimeInput(e.target.value)} step="1" />
            <button className="ts__btn ts__btn--primary" onClick={handleDateTimeConvert}>Convert</button>
          </div>
          <div className="ts__actions">
            <button className="ts__btn" onClick={handleNow}>⏱ Now</button>
            <button className="ts__btn" onClick={handleSwap} disabled={!results}>⇄ Swap</button>
            <button className="ts__btn" onClick={handleClear}>✕ Clear</button>
          </div>
        </div>
      </div>

      {/* Results */}
      {results && (
        <div className="ts__results">
          {[
            { label: 'Unix Timestamp (s)', value: results.unix, key: 'unix' },
            { label: 'Unix Timestamp (ms)', value: results.unixMs, key: 'unixMs' },
            { label: 'UTC Date', value: results.utc, key: 'utc' },
            { label: 'Local Date', value: results.local, key: 'local' },
            { label: 'ISO 8601', value: results.iso, key: 'iso' },
            { label: 'Relative Time', value: results.relative, key: 'relative' },
          ].map(({ label, value, key }) => (
            <div className="ts__card ts__result-card" key={key}>
              <div className="ts__result-label">{label}</div>
              <div className="ts__result-row">
                <span className="ts__result-value">{value}</span>
                <button className="ts__copy-btn" onClick={() => copy(value, key)}>
                  {copied === key ? '✓' : '⧉'}
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {!results && input.trim() && (
        <div className="ts__error">⚠ Invalid timestamp or date string</div>
      )}

      {/* Timezone */}
      <div className="ts__bottom">
        <div className="ts__card">
          <div className="ts__card-title">Timezone</div>
          <select className="ts__select ts__select--full" value={timezone} onChange={e => setTimezone(e.target.value)}>
            {TIMEZONES.map(tz => <option key={tz} value={tz}>{tz}</option>)}
          </select>
          {results && (
            <div className="ts__tz-preview">
              <span className="ts__tz-label">Selected timezone:</span>
              <span className="ts__tz-value">{results.timezone}</span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default TimestampConverter;
