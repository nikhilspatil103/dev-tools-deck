import Hero3D from '../Hero3D/Hero3D';
import './Hero.css';

function Hero() {
  return (
    <section className="hero">
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
