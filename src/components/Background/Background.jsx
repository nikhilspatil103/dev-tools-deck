import './Background.css';

function Background() {
  return (
    <div className="background" aria-hidden="true">
      <div className="background__aurora"></div>
      <div className="background__glow background__glow--primary"></div>
      <div className="background__glow background__glow--accent"></div>
      <div className="background__glow background__glow--secondary"></div>
      <div className="background__grid"></div>
      
      <div className="background__noise"></div>
      <div className="background__circle background__circle--1"></div>
      <div className="background__circle background__circle--2"></div>
      <div className="background__circle background__circle--3"></div>
    </div>
  );
}

export default Background;
