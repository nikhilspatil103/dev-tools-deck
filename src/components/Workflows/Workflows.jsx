import './Workflows.css';

const workflows = [
  {
    title: 'API Response Pipeline',
    steps: ['API Response', 'JSON Formatter', 'JSON Validator', 'Tree Viewer', 'Copy Result'],
  },
  {
    title: 'JWT Inspection',
    steps: ['JWT', 'Decode', 'Inspect', 'Verify'],
  },
  {
    title: 'SQL Beautification',
    steps: ['SQL', 'Format', 'Beautify', 'Export'],
  },
];

function Workflows() {
  return (
    <section className="workflows">
      <div className="workflows__container">
        <div className="workflows__header" data-reveal="fade-up">
          <h2 className="workflows__title">Common Developer Workflows</h2>
        </div>
        <div className="workflows__grid" data-reveal-stagger>
          {workflows.map((wf) => (
            <div key={wf.title} className="workflows__card">
              <h3 className="workflows__card-title">{wf.title}</h3>
              <div className="workflows__steps">
                {wf.steps.map((step, i) => (
                  <div key={i} className="workflows__step-group">
                    <div className="workflows__step">{step}</div>
                    {i < wf.steps.length - 1 && (
                      <div className="workflows__arrow">↓</div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

export default Workflows;
