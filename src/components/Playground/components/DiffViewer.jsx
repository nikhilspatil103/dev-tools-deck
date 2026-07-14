import './DiffViewer.css';

function DiffViewer() {
  return (
    <div className="diff-viewer">
      <div className="diff-viewer__panel">
        <div className="diff-viewer__header">Original</div>
        <div className="diff-viewer__content">
          <span className="diff-viewer__placeholder">Paste original content here</span>
        </div>
      </div>
      <div className="diff-viewer__divider" />
      <div className="diff-viewer__panel">
        <div className="diff-viewer__header">Modified</div>
        <div className="diff-viewer__content">
          <span className="diff-viewer__placeholder">Paste modified content here</span>
        </div>
      </div>
    </div>
  );
}

export default DiffViewer;
