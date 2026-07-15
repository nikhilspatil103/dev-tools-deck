import { Link } from 'react-router-dom';
import Hero3D from '../Hero3D/Hero3D';
import './Hero.css';

const LEFT_TOOLS = [
  { name: 'JSON', symbol: '{ }', path: '/tools/json-formatter', color: '#FACC15', tip: 'Format & validate JSON instantly' },
  { name: 'HTML', symbol: '</>', path: '/tools/html-formatter', color: '#F97316', tip: 'Beautify & minify HTML code' },
  { name: 'SQL', symbol: 'SQL', path: '/tools/sql-formatter', color: '#22C55E', tip: 'Format SQL queries with ease' },
  { name: 'Diff', symbol: '⇄', path: '/tools/diff-checker', color: '#EC4899', tip: 'Compare text & find differences' },
  { name: 'Excel', symbol: '⊞', path: '/tools/excel-compare', color: '#10B981', tip: 'Compare Excel & CSV files' },
];

const RIGHT_TOOLS = [
  { name: 'API', symbol: '⚡', path: '/tools/api-tester', color: '#8B5CF6', tip: 'Test REST APIs in seconds' },
  { name: 'Base64', symbol: 'B64', path: '/tools/base64', color: '#06B6D4', tip: 'Encode & decode Base64 strings' },
  { name: 'JWT', symbol: '🔑', path: '/tools/jwt-decoder', color: '#EF4444', tip: 'Decode & inspect JWT tokens' },
  { name: 'Color', symbol: '◆', path: '/tools/color-converter', color: '#00D9FF', tip: 'Convert colors between formats' },
];

function Hero() {
  return (
    <section className="hero">
      {/* Left tool rail */}
      <div className="hero__tool-rail hero__tool-rail--left">
        <div className="hero__tool-rail-line" />
        {LEFT_TOOLS.map((tool) => (
          <Link key={tool.name} to={tool.path} className="hero__tool-node" style={{ '--tool-color': tool.color }}>
            <span className="hero__tool-connector" />
            <span className="hero__tool-icon">{tool.symbol}</span>
            <span className="hero__tool-name">{tool.name}</span>
            <span className="hero__tool-tooltip">{tool.tip}</span>
          </Link>
        ))}
      </div>

      {/* Right tool rail */}
      <div className="hero__tool-rail hero__tool-rail--right">
        <div className="hero__tool-rail-line" />
        {RIGHT_TOOLS.map((tool) => (
          <Link key={tool.name} to={tool.path} className="hero__tool-node" style={{ '--tool-color': tool.color }}>
            <span className="hero__tool-connector" />
            <span className="hero__tool-icon">{tool.symbol}</span>
            <span className="hero__tool-name">{tool.name}</span>
            <span className="hero__tool-tooltip">{tool.tip}</span>
          </Link>
        ))}
      </div>

      <div className="hero__container">
        <p className="hero__tagline hero--animate" style={{ animationDelay: '0.1s' }}>
          Format. Validate. Compare. Convert. Debug. <span className="hero__tagline-highlight">Instantly.</span>
        </p>

        <div className="hero__visual hero--animate" style={{ animationDelay: '0.2s' }}>
          <div className="hero__3d-container">
            <div className="hero__3d-glow"></div>
            <Hero3D />
          </div>
        </div>

        <div className="hero__content">
          <div className="hero__badge hero--animate" style={{ animationDelay: '0.3s' }}>
            <span className="hero__badge-dot"></span>
            <span className="hero__badge-text">Developer Platform</span>
          </div>

          <h1 className="hero__heading hero--animate" style={{ animationDelay: '0.4s' }}>
            Every Developer Tool.
            <br />
            <span className="hero__heading-gradient">One Intelligent Workspace.</span>
          </h1>

          <p className="hero__subtitle hero--animate" style={{ animationDelay: '0.5s' }}>
            Format, validate, compare, convert and debug data instantly.
          </p>

          <div className="hero__actions hero--animate" style={{ animationDelay: '0.6s' }}>
            <a href="#tools" className="hero__btn hero__btn--primary">
              Start Free
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M5 12h14M12 5l7 7-7 7" />
              </svg>
            </a>
            <a href="#tools" className="hero__btn hero__btn--secondary">
              Explore Tools
            </a>
          </div>

          {/* <div className="hero__stats">
            <div className="hero__stat">
              <span className="hero__stat-value">60+</span>
              <span className="hero__stat-label">Tools</span>
            </div>
            <div className="hero__stat-divider"></div>
            <div className="hero__stat">
              <span className="hero__stat-value">5M+</span>
              <span className="hero__stat-label">Users</span>
            </div>
            <div className="hero__stat-divider"></div>
            <div className="hero__stat">
              <span className="hero__stat-value">99.9%</span>
              <span className="hero__stat-label">Uptime</span>
            </div>
          </div> */}
        </div>

      </div>
    </section>
  );
}

export default Hero;
