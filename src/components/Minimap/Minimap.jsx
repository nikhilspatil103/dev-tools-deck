import React, { useState, useEffect, useRef } from 'react';
import './Minimap.css';

function Minimap({ containerRef }) {
  const [thumb, setThumb] = useState({ top: 0, height: 100 });
  const [lines, setLines] = useState([]);
  const trackRef = useRef(null);
  const dragging = useRef(false);

  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;
    const isTextarea = el.tagName === 'TEXTAREA';
    const update = () => {
      const { scrollTop, scrollHeight, clientHeight } = el;
      if (scrollHeight <= clientHeight) { setThumb({ top: 0, height: 100 }); return; }
      const ratio = clientHeight / scrollHeight;
      setThumb({ top: (scrollTop / scrollHeight) * 100, height: ratio * 100 });
    };
    const extractLines = () => {
      const text = isTextarea ? el.value : (el.innerText || '');
      const allLines = text.split('\n').slice(0, 200);
      setLines(allLines.map(l => Math.min(l.length, 60)));
    };
    update();
    extractLines();
    el.addEventListener('scroll', update);
    if (isTextarea) {
      el.addEventListener('input', extractLines);
      return () => { el.removeEventListener('scroll', update); el.removeEventListener('input', extractLines); };
    }
    const obs = new MutationObserver(extractLines);
    obs.observe(el, { childList: true, subtree: true, characterData: true });
    return () => { el.removeEventListener('scroll', update); obs.disconnect(); };
  }, [containerRef]);

  const handleMouseDown = (e) => {
    dragging.current = true;
    handleDrag(e);
    const onMove = (ev) => { if (dragging.current) handleDrag(ev); };
    const onUp = () => { dragging.current = false; window.removeEventListener('mousemove', onMove); window.removeEventListener('mouseup', onUp); };
    window.addEventListener('mousemove', onMove);
    window.addEventListener('mouseup', onUp);
  };

  const handleDrag = (e) => {
    const el = containerRef.current;
    const track = trackRef.current;
    if (!el || !track) return;
    const rect = track.getBoundingClientRect();
    const ratio = Math.max(0, Math.min(1, (e.clientY - rect.top) / rect.height));
    el.scrollTop = ratio * (el.scrollHeight - el.clientHeight);
  };

  if (thumb.height >= 100) return null;

  return (
    <div className="minimap" ref={trackRef} onMouseDown={handleMouseDown}>
      <div className="minimap__lines">
        {lines.map((len, i) => (
          <div key={i} className="minimap__line" style={{ width: `${(len / 60) * 100}%` }} />
        ))}
      </div>
      <div className="minimap__thumb" style={{ top: `${thumb.top}%`, height: `${thumb.height}%` }} />
    </div>
  );
}

export default Minimap;
