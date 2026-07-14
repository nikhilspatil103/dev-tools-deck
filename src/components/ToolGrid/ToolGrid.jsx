import { useState, useMemo } from 'react';
import { tools, categories } from '../../data/tools';
import ToolCard from '../ToolCard/ToolCard';
import './ToolGrid.css';

function ToolGrid() {
  const [activeCategory, setActiveCategory] = useState('All');
  const [search, setSearch] = useState('');

  const filtered = useMemo(() => {
    return tools.filter((tool) => {
      const matchCategory = activeCategory === 'All' || tool.category === activeCategory;
      const matchSearch = tool.name.toLowerCase().includes(search.toLowerCase());
      return matchCategory && matchSearch;
    });
  }, [activeCategory, search]);

  return (
    <section className="tools-section" id="tools">
      <div className="tools-section__container">
        <div className="tools-section__header" data-reveal="fade-up">
          <h2 className="tools-section__title">Popular Developer Tools</h2>
          <p className="tools-section__subtitle">
            Everything you need to format, validate, compare, convert and debug data.
          </p>
        </div>

        {/* Top Bar */}
        <div className="tools-section__topbar" data-reveal="fade-up">
          <div className="tools-section__search">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <circle cx="11" cy="11" r="8" />
              <path d="m21 21-4.35-4.35" />
            </svg>
            <input
              type="text"
              placeholder="Search tools..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="tools-section__search-input"
            />
          </div>
          <div className="tools-section__filters">
            {categories.map((cat) => (
              <button
                key={cat}
                className={`tools-section__filter ${activeCategory === cat ? 'tools-section__filter--active' : ''}`}
                onClick={() => setActiveCategory(cat)}
              >
                {cat}
              </button>
            ))}
          </div>
        </div>

        {/* Bento Grid */}
        <div className="tools-section__grid" data-reveal-stagger>
          {filtered.map((tool) => (
            <div key={tool.id} className={`tools-section__cell tools-section__cell--${tool.size}`}>
              <ToolCard tool={tool} />
            </div>
          ))}
        </div>

        {/* Bottom CTA */}
        <div className="tools-section__cta" data-reveal="fade-up">
          <button className="tools-section__cta-btn">
            View All 60+ Tools
            <span className="tools-section__cta-arrow">→</span>
          </button>
        </div>
      </div>
    </section>
  );
}

export default ToolGrid;
