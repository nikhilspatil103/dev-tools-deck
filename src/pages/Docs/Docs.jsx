import { useNavigate } from 'react-router-dom';
import { useTheme } from '../../hooks/useTheme';
import './Docs.css';

const toolDocs = [
  {
    name: 'JSON Formatter',
    route: '/tools/json-formatter',
    description: 'Format, beautify, minify and validate JSON data with syntax highlighting.',
    features: ['Beautify & Minify', 'Syntax validation', 'Tree view', 'Multiple tabs', 'File upload/download'],
  },
  {
    name: 'API Tester',
    route: '/tools/api-tester',
    description: 'Test REST APIs with custom methods, headers, body and authentication.',
    features: ['GET/POST/PUT/DELETE', 'Custom headers', 'Request body editor', 'Response viewer', 'History'],
  },
  {
    name: 'Diff Checker',
    route: '/tools/diff-checker',
    description: 'Compare text, code or files side-by-side with inline diffs.',
    features: ['Side-by-side view', 'Inline diff', 'Syntax highlighting', 'File upload', 'Copy results'],
  },
  {
    name: 'JWT Decoder',
    route: '/tools/jwt-decoder',
    description: 'Decode and inspect JSON Web Tokens — header, payload and signature.',
    features: ['Header decoding', 'Payload inspection', 'Expiry check', 'Signature info', 'Copy sections'],
  },
  {
    name: 'SQL Formatter',
    route: '/tools/sql-formatter',
    description: 'Beautify, minify and transform SQL queries with keyword casing.',
    features: ['Beautify & Minify', 'Uppercase/Lowercase keywords', 'Multiple tabs', 'Statistics', 'File upload'],
  },
  {
    name: 'Base64 Encoder',
    route: '/tools/base64',
    description: 'Encode and decode Base64 strings with auto-detection.',
    features: ['Encode & Decode', 'Auto-detect mode', 'File upload', 'Download output', 'Size stats'],
  },
  {
    name: 'Color Converter',
    route: '/tools/color-converter',
    description: 'Convert colors between HEX, RGB, HSL, HSV and CMYK formats.',
    features: ['HEX/RGB/HSL/HSV/CMYK', 'Color picker', 'Gradient builder', 'Contrast checker', 'Tailwind shades'],
  },
  {
    name: 'Timestamp Converter',
    route: '/tools/timestamp-converter',
    description: 'Convert Unix timestamps to human-readable dates and vice versa.',
    features: ['Seconds & Milliseconds', 'Timezone selector', 'Date/Time picker', 'Relative time', 'Live clock'],
  },
  {
    name: 'HTML Formatter',
    route: '/tools/html-formatter',
    description: 'Beautify, minify and validate HTML with live preview.',
    features: ['Beautify & Minify', 'Validation', 'Live preview', 'Multiple tabs', 'File upload'],
  },
];

function Docs() {
  const navigate = useNavigate();
  const { theme, toggleTheme } = useTheme();

  return (
    <div className="docs">
      <header className="docs__header">
        <div className="docs__header-left">
          <button className="docs__back" onClick={() => navigate('/')}>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M19 12H5M12 19l-7-7 7-7" /></svg>
            Back
          </button>
          <h1 className="docs__title">Documentation</h1>
        </div>
        <div className="docs__header-right">
          <button className="docs__icon-btn" onClick={toggleTheme} title="Toggle theme">
            {theme === 'dark' ? (
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="5" /><path d="M12 1v2M12 21v2M4.22 4.22l1.42 1.42M18.36 18.36l1.42 1.42M1 12h2M21 12h2M4.22 19.78l1.42-1.42M18.36 5.64l1.42-1.42" /></svg>
            ) : (
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z" /></svg>
            )}
          </button>
        </div>
      </header>

      {/* About Section */}
      <section className="docs__section">
        <h2 className="docs__section-title">About DevToolsDeck</h2>
        <div className="docs__card">
          <p className="docs__text">
            DevToolsDeck is a modern, privacy-first developer tools platform. All tools run entirely in your browser — no data is ever sent to a server. Format, validate, compare, convert and debug data instantly.
          </p>
          <div className="docs__highlights">
            <div className="docs__highlight">
              <span className="docs__highlight-icon">⚡</span>
              <div>
                <strong>Lightning Fast</strong>
                <p>Everything runs client-side for instant results.</p>
              </div>
            </div>
            <div className="docs__highlight">
              <span className="docs__highlight-icon">🔒</span>
              <div>
                <strong>Privacy First</strong>
                <p>No data leaves your browser. Ever.</p>
              </div>
            </div>
            <div className="docs__highlight">
              <span className="docs__highlight-icon">🌍</span>
              <div>
                <strong>Works Everywhere</strong>
                <p>Desktop, tablet and mobile — fully responsive.</p>
              </div>
            </div>
            <div className="docs__highlight">
              <span className="docs__highlight-icon">🎨</span>
              <div>
                <strong>Dark & Light Theme</strong>
                <p>Toggle between themes for comfortable use.</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Tools Section */}
      <section className="docs__section">
        <h2 className="docs__section-title">Available Tools</h2>
        <div className="docs__tools-grid">
          {toolDocs.map(tool => (
            <div key={tool.name} className="docs__tool-card" onClick={() => navigate(tool.route)}>
              <h3 className="docs__tool-name">{tool.name}</h3>
              <p className="docs__tool-desc">{tool.description}</p>
              <ul className="docs__tool-features">
                {tool.features.map(f => (
                  <li key={f}>{f}</li>
                ))}
              </ul>
              <span className="docs__tool-link">Open Tool →</span>
            </div>
          ))}
        </div>
      </section>

      {/* Keyboard Shortcuts */}
      <section className="docs__section">
        <h2 className="docs__section-title">Keyboard Shortcuts</h2>
        <div className="docs__card">
          <div className="docs__shortcuts">
            <div className="docs__shortcut"><kbd>Ctrl</kbd> + <kbd>Enter</kbd><span>Beautify / Format</span></div>
            <div className="docs__shortcut"><kbd>Ctrl</kbd> + <kbd>Shift</kbd> + <kbd>M</kbd><span>Minify</span></div>
            <div className="docs__shortcut"><kbd>Ctrl</kbd> + <kbd>C</kbd><span>Copy to clipboard</span></div>
            <div className="docs__shortcut"><kbd>Ctrl</kbd> + <kbd>V</kbd><span>Paste from clipboard</span></div>
          </div>
        </div>
      </section>
    </div>
  );
}

export default Docs;
