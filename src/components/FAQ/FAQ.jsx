import { useState } from 'react';
import './FAQ.css';

const faqs = [
  { q: 'Is my data uploaded?', a: 'No. All processing happens entirely in your browser. Your data never leaves your device — we have zero server-side processing.' },
  { q: 'Which browsers are supported?', a: 'All modern browsers including Chrome, Firefox, Safari and Edge. We recommend the latest version for the best experience.' },
  { q: 'Can I use the tools offline?', a: 'Yes. Once loaded, most tools work completely offline. We use service workers to cache the application for offline use.' },
  { q: 'Is there an API?', a: 'Yes. We offer a REST API for programmatic access to our formatting, validation and conversion tools. Check our docs for details.' },
  { q: 'Are the tools free?', a: 'Core tools are completely free with no limits. Premium features like AI assistance and team collaboration are available on paid plans.' },
];

function FAQ() {
  const [open, setOpen] = useState(null);

  return (
    <section className="faq">
      <div className="faq__container">
        <div className="faq__header" data-reveal="fade-up">
          <h2 className="faq__title">Frequently Asked Questions</h2>
        </div>
        <div className="faq__list" data-reveal-stagger>
          {faqs.map((item, i) => (
            <div key={i} className={`faq__item ${open === i ? 'faq__item--open' : ''}`}>
              <button className="faq__question" onClick={() => setOpen(open === i ? null : i)}>
                <span>{item.q}</span>
                <span className="faq__icon">{open === i ? '−' : '+'}</span>
              </button>
              <div className="faq__answer">
                <p>{item.a}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

export default FAQ;
