import './Testimonials.css';

const testimonials = [
  {
    name: 'Sarah Chen',
    company: 'Frontend Lead at Stackline',
    text: 'This replaced five different tools in my workflow. The JSON formatter alone saves me 30 minutes daily.',
  },
  {
    name: 'Marcus Rivera',
    company: 'Backend Engineer at Dataflow',
    text: 'Privacy-first approach is exactly what our team needed. Everything runs client-side — no compliance headaches.',
  },
  {
    name: 'Priya Sharma',
    company: 'Full-stack Dev at Buildkit',
    text: 'The playground is incredible. I can format, validate and inspect API responses without switching tabs.',
  },
];

function Testimonials() {
  return (
    <section className="testimonials">
      <div className="testimonials__container">
        <div className="testimonials__header" data-reveal="fade-up">
          <h2 className="testimonials__title">Loved by Developers</h2>
        </div>
        <div className="testimonials__grid" data-reveal-stagger>
          {testimonials.map((t) => (
            <div key={t.name} className="testimonials__card">
              <div className="testimonials__stars">★★★★★</div>
              <p className="testimonials__text">"{t.text}"</p>
              <div className="testimonials__author">
                <div className="testimonials__avatar">{t.name[0]}</div>
                <div className="testimonials__info">
                  <span className="testimonials__name">{t.name}</span>
                  <span className="testimonials__company">{t.company}</span>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

export default Testimonials;
