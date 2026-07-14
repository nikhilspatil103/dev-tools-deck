import { useNavigate } from 'react-router-dom';
import './ToolCard.css';

const toolRoutes = {
  'json-formatter': '/tools/json-formatter',
  'diff-checker': '/tools/diff-checker',
  'jwt-decoder': '/tools/jwt-decoder',
  'base64-encoder': '/tools/base64',
  'api-tester': '/tools/api-tester',
  'sql-formatter': '/tools/sql-formatter',
  'color-converter': '/tools/color-converter',
  'timestamp-converter': '/tools/timestamp-converter',
  'html-formatter': '/tools/html-formatter',
};

function ToolCard({ tool }) {
  const navigate = useNavigate();
  const Icon = tool.icon;

  const handleClick = () => {
    const route = toolRoutes[tool.id];
    if (route) navigate(route);
  };

  return (
    <article
      className={`tool-card tool-card--${tool.size} ${toolRoutes[tool.id] ? 'tool-card--clickable' : ''}`}
      style={{ '--card-accent': tool.accent }}
      onClick={handleClick}
    >
      <div className="tool-card__glow" />
      <div className="tool-card__inner">
        <div className="tool-card__header">
          <div className="tool-card__icon-wrap">
            <Icon className="tool-card__icon" />
          </div>
          <span className="tool-card__badge">{tool.category}</span>
        </div>
        <div className="tool-card__body">
          <h3 className="tool-card__name">{tool.name}</h3>
          <p className="tool-card__desc">{tool.description}</p>
        </div>
        <div className="tool-card__footer">
          <span className="tool-card__usage">{tool.usage} uses</span>
          <button className="tool-card__btn">
            Open Tool <span className="tool-card__btn-arrow">→</span>
          </button>
        </div>
      </div>
    </article>
  );
}

export default ToolCard;
