import './FinalCTA.css';

function FinalCTA() {
  return (
    <section className="final-cta">
      <div className="final-cta__container">
        <div className="final-cta__card" data-reveal="scale-in">
          <div className="final-cta__glow" />
          <h2 className="final-cta__title">Ready to Boost Your Developer Workflow?</h2>
          <div className="final-cta__actions">
            <a href="#tools" className="final-cta__btn final-cta__btn--primary">Explore All Tools</a>
            <a href="#tools" className="final-cta__btn final-cta__btn--secondary">Start Free</a>
          </div>
        </div>
      </div>
    </section>
  );
}

export default FinalCTA;
