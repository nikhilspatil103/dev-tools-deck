import './Categories.css';

const categories = [
  { icon: '{ }', name: 'JSON Tools', count: 12, desc: 'Format, validate, minify and transform JSON data.' },
  { icon: '< />', name: 'XML Tools', count: 6, desc: 'Parse, format and validate XML documents.' },
  { icon: '⚡', name: 'API Tools', count: 8, desc: 'Test, debug and monitor REST APIs.' },
  { icon: '◈', name: 'Database Tools', count: 5, desc: 'Format SQL, generate queries and schemas.' },
  { icon: '🔐', name: 'Encoding Tools', count: 7, desc: 'Base64, URL, HTML encoding and decoding.' },
  { icon: '🛡️', name: 'Security Tools', count: 6, desc: 'JWT decode, hash generation and encryption.' },
  { icon: '📝', name: 'Text Tools', count: 9, desc: 'Diff, regex, markdown and text manipulation.' },
  { icon: '🕐', name: 'Date & Time', count: 4, desc: 'Timestamps, timezone conversion and formatting.' },
  { icon: '🔧', name: 'Developer Utilities', count: 8, desc: 'UUID, color converter, lorem ipsum and more.' },
  { icon: '✓', name: 'Validation Tools', count: 6, desc: 'Validate JSON, XML, YAML and schemas.' },
];

function Categories() {
  return (
    <section className="categories">
      <div className="categories__container">
        <div className="categories__header" data-reveal="fade-up">
          <h2 className="categories__title">Browse by Category</h2>
        </div>
        <div className="categories__grid" data-reveal-stagger>
          {categories.map((cat) => (
            <div key={cat.name} className="categories__card">
              <span className="categories__card-icon">{cat.icon}</span>
              <div className="categories__card-body">
                <h3 className="categories__card-name">{cat.name}</h3>
                <span className="categories__card-count">{cat.count} tools</span>
                <p className="categories__card-desc">{cat.desc}</p>
              </div>
              <span className="categories__card-arrow">→</span>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

export default Categories;
