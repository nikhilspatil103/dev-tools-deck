import { useState, useEffect } from 'react';
import { useTheme } from '../../hooks/useTheme';
import Logo3D from '../Logo3D/Logo3D';
import './Navbar.css';

function Navbar() {
  const [scrolled, setScrolled] = useState(false);
  const { theme, toggleTheme } = useTheme();

  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 20);
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  return (
    <nav className={`navbar ${scrolled ? 'navbar--scrolled' : ''}`}>
      <div className="navbar__inner">
        <div className="navbar__left">
          <a href="/" className="navbar__logo">
            <Logo3D size={48} />
            <span className="navbar__logo-text">Dev<span className="navbar__logo-highlight">Tools</span>Deck</span>
          </a>
        </div>

        <div className="navbar__center">
          <button className="navbar__search">
            <svg className="navbar__search-icon" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <circle cx="11" cy="11" r="8" />
              <path d="m21 21-4.35-4.35" />
            </svg>
            <span className="navbar__search-text">Search tools...</span>
            <span className="navbar__search-shortcut">⌘K</span>
          </button>
          <a href="#tools" className="navbar__link">Tools</a>
          <a href="/docs" className="navbar__link">Docs</a>
          <a href="#tools" className="navbar__link">API</a>
        </div>

        <div className="navbar__right">
          <button className="navbar__theme-toggle" onClick={toggleTheme} aria-label="Toggle theme">
            {theme === 'dark' ? (
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <circle cx="12" cy="12" r="5" />
                <path d="M12 1v2M12 21v2M4.22 4.22l1.42 1.42M18.36 18.36l1.42 1.42M1 12h2M21 12h2M4.22 19.78l1.42-1.42M18.36 5.64l1.42-1.42" />
              </svg>
            ) : (
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z" />
              </svg>
            )}
          </button>
          {/* <a href="#signin" className="navbar__signin">Sign In</a> */}
          <a href="#tools" className="navbar__cta">Get Started</a>
        </div>
      </div>
    </nav>
  );
}

export default Navbar;
