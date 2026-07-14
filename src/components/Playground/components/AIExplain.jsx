import './AIExplain.css';

function AIExplain() {
  const actions = [
    { icon: '💡', label: 'Explain JSON Structure' },
    { icon: '📋', label: 'Generate Schema' },
    { icon: '✨', label: 'Suggest Improvements' },
  ];

  return (
    <div className="ai-explain">
      <div className="ai-explain__header">
        <span className="ai-explain__badge">AI Assistant</span>
      </div>
      <div className="ai-explain__actions">
        {actions.map((action) => (
          <button key={action.label} className="ai-explain__action">
            <span className="ai-explain__action-icon">{action.icon}</span>
            <span className="ai-explain__action-label">{action.label}</span>
          </button>
        ))}
      </div>
      <div className="ai-explain__chat">
        <div className="ai-explain__placeholder">
          Ask AI to analyze your JSON...
        </div>
      </div>
    </div>
  );
}

export default AIExplain;
