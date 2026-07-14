import './ValidationBadge.css';

function ValidationBadge({ isValid, error }) {
  return (
    <div className={`validation-badge ${isValid ? 'validation-badge--valid' : 'validation-badge--invalid'}`}>
      <span className="validation-badge__dot" />
      <span className="validation-badge__text">
        {isValid ? 'Valid JSON' : 'Invalid JSON'}
      </span>
      {!isValid && error && (
        <span className="validation-badge__error">{error}</span>
      )}
    </div>
  );
}

export default ValidationBadge;
