import { useState, useEffect, useRef } from 'react';
import './Statistics.css';

const stats = [
  { value: 60, suffix: '+', label: 'Developer Tools' },
  { value: 5, suffix: 'M+', label: 'Monthly Users' },
  { value: 120, suffix: 'M+', label: 'Files Processed' },
  { value: 99.99, suffix: '%', label: 'Uptime' },
  { value: 100, suffix: '%', label: 'Client-side Processing' },
];

function Counter({ target, suffix, active }) {
  const [count, setCount] = useState(0);

  useEffect(() => {
    if (!active) return;
    let start = 0;
    const duration = 1500;
    const step = target / (duration / 16);
    const timer = setInterval(() => {
      start += step;
      if (start >= target) {
        setCount(target);
        clearInterval(timer);
      } else {
        setCount(Math.floor(start * 100) / 100);
      }
    }, 16);
    return () => clearInterval(timer);
  }, [active, target]);

  const display = Number.isInteger(target) ? Math.floor(count) : count.toFixed(2);

  return <span>{display}{suffix}</span>;
}

function Statistics() {
  const [visible, setVisible] = useState(false);
  const ref = useRef(null);

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => { if (entry.isIntersecting) setVisible(true); },
      { threshold: 0.3 }
    );
    if (ref.current) observer.observe(ref.current);
    return () => observer.disconnect();
  }, []);

  return (
    <section className="statistics" ref={ref}>
      <div className="statistics__container">
        <div className="statistics__grid">
          {stats.map((s) => (
            <div key={s.label} className="statistics__item">
              <span className="statistics__value">
                <Counter target={s.value} suffix={s.suffix} active={visible} />
              </span>
              <span className="statistics__label">{s.label}</span>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

export default Statistics;
