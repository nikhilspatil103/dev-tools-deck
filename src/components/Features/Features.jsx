import './Features.css';

const features = [
  { icon: '⚡', title: 'Lightning Fast', desc: 'Run everything instantly in your browser.' },
  { icon: '🔒', title: 'Privacy First', desc: 'No data leaves your device.' },
  { icon: '🌍', title: 'Works Everywhere', desc: 'Desktop, tablet and mobile.' },
  { icon: '📦', title: 'Export Anywhere', desc: 'Download, copy or share instantly.' },
  { icon: '🤖', title: 'AI Assisted', desc: 'Explain, debug and understand your data.' },
  { icon: '🚀', title: 'No Installation', desc: 'Works directly in the browser.' },
];

function Features() {
  return (
    <section className="features">
      <div className="features__container">
        <div className="features__header" data-reveal="fade-up">
          <h2 className="features__title">Built for Modern Developers</h2>
          <p className="features__subtitle">Fast, private and designed to improve everyday developer workflows.</p>
        </div>
        <div className="features__grid" data-reveal="fade-up" data-reveal-stagger="true">
          {features.map((f) => (
            <div key={f.title} className="features__card">
              <span className="features__card-icon">{f.icon}</span>
              <h3 className="features__card-title">{f.title}</h3>
              <p className="features__card-desc">{f.desc}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

export default Features;
