import { useEffect, useRef } from 'react';
import './MouseGlow.css';

function MouseGlow() {
  const ref = useRef(null);

  useEffect(() => {
    const isMobile = window.matchMedia('(max-width: 768px)').matches;
    if (isMobile) return;

    const el = ref.current;
    const onMove = (e) => {
      el.style.transform = `translate(${e.clientX - 200}px, ${e.clientY - 200}px)`;
    };
    window.addEventListener('mousemove', onMove, { passive: true });
    return () => window.removeEventListener('mousemove', onMove);
  }, []);

  return <div ref={ref} className="mouse-glow" aria-hidden="true" />;
}

export default MouseGlow;
