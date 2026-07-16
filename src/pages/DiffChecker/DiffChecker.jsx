import { useState, useCallback, useMemo, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import MonacoEditor from '@monaco-editor/react';
import { diffLines, diffWordsWithSpace } from 'diff';
import { useTheme, useToolTheme } from '../../hooks/useTheme';
import SEO from '../../components/SEO/SEO';
import { storage } from '../../utils/storage';
import './DiffChecker.css';
import Logo3D from '../../components/Logo3D/Logo3D';
function ImageDiff() {
  const [leftImg, setLeftImg] = useState(null);
  const [rightImg, setRightImg] = useState(null);
  const [sliderPos, setSliderPos] = useState(50);
  const [viewMode, setViewMode] = useState('slider');
  const [diffImg, setDiffImg] = useState(null);
  const containerRef = useRef(null);
  const isDragging = useRef(false);

  const handleDrop = useCallback((side) => (e) => {
    e.preventDefault();
    const file = e.dataTransfer?.files?.[0] || e.target?.files?.[0];
    if (!file || !file.type.startsWith('image/')) return;
    const url = URL.createObjectURL(file);
    if (side === 'left') setLeftImg(url);
    else setRightImg(url);
  }, []);

  const handleFile = useCallback((side) => (e) => {
    const file = e.target.files?.[0];
    if (!file || !file.type.startsWith('image/')) return;
    const url = URL.createObjectURL(file);
    if (side === 'left') setLeftImg(url);
    else setRightImg(url);
    e.target.value = '';
  }, []);

  const handleMouseDown = () => { isDragging.current = true; };
  const handleMouseUp = () => { isDragging.current = false; };
  const handleMouseMove = useCallback((e) => {
    if (!isDragging.current || !containerRef.current) return;
    const rect = containerRef.current.getBoundingClientRect();
    const x = ((e.clientX - rect.left) / rect.width) * 100;
    setSliderPos(Math.max(0, Math.min(100, x)));
  }, []);

  // Generate pixel diff
  useEffect(() => {
    if (!leftImg || !rightImg || viewMode !== 'diff') { setDiffImg(null); return; }
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    const imgL = new Image(); imgL.crossOrigin = 'anonymous';
    const imgR = new Image(); imgR.crossOrigin = 'anonymous';
    let loaded = 0;
    const onLoad = () => {
      loaded++;
      if (loaded < 2) return;
      const w = Math.max(imgL.width, imgR.width);
      const h = Math.max(imgL.height, imgR.height);
      canvas.width = w; canvas.height = h;
      ctx.drawImage(imgL, 0, 0, w, h);
      const dataL = ctx.getImageData(0, 0, w, h);
      ctx.clearRect(0, 0, w, h);
      ctx.drawImage(imgR, 0, 0, w, h);
      const dataR = ctx.getImageData(0, 0, w, h);
      const out = ctx.createImageData(w, h);
      for (let i = 0; i < dataL.data.length; i += 4) {
        const dr = Math.abs(dataL.data[i] - dataR.data[i]);
        const dg = Math.abs(dataL.data[i+1] - dataR.data[i+1]);
        const db = Math.abs(dataL.data[i+2] - dataR.data[i+2]);
        const diff = dr + dg + db;
        if (diff > 30) { out.data[i] = 255; out.data[i+1] = 60; out.data[i+2] = 80; out.data[i+3] = 255; }
        else { out.data[i] = 30; out.data[i+1] = 30; out.data[i+2] = 30; out.data[i+3] = 255; }
      }
      ctx.putImageData(out, 0, 0);
      setDiffImg(canvas.toDataURL());
    };
    imgL.onload = onLoad; imgR.onload = onLoad;
    imgL.src = leftImg; imgR.src = rightImg;
  }, [leftImg, rightImg, viewMode]);

  return (
    <div className="dc__image-diff">
      <div className="dc__image-toolbar">
        <button className={`dc__toolbar-btn ${viewMode === 'slider' ? 'dc__toolbar-btn--active' : ''}`} onClick={() => setViewMode('slider')}>Slider</button>
        <button className={`dc__toolbar-btn ${viewMode === 'side' ? 'dc__toolbar-btn--active' : ''}`} onClick={() => setViewMode('side')}>Side by Side</button>
        <button className={`dc__toolbar-btn ${viewMode === 'diff' ? 'dc__toolbar-btn--active' : ''}`} onClick={() => setViewMode('diff')} disabled={!leftImg || !rightImg}>Difference</button>
      </div>

      {(!leftImg || !rightImg) && (
        <div className="dc__image-upload-row">
          <div className="dc__image-dropzone" onDragOver={e => e.preventDefault()} onDrop={handleDrop('left')}>
            {leftImg ? <img src={leftImg} alt="Left" className="dc__image-preview" /> : (
              <>
                <span className="dc__image-dropzone-icon">🖼️</span>
                <span>Drop original image here</span>
                <label className="dc__image-upload-btn">Browse<input type="file" accept="image/*" onChange={handleFile('left')} hidden /></label>
              </>
            )}
          </div>
          <div className="dc__image-dropzone" onDragOver={e => e.preventDefault()} onDrop={handleDrop('right')}>
            {rightImg ? <img src={rightImg} alt="Right" className="dc__image-preview" /> : (
              <>
                <span className="dc__image-dropzone-icon">🖼️</span>
                <span>Drop modified image here</span>
                <label className="dc__image-upload-btn">Browse<input type="file" accept="image/*" onChange={handleFile('right')} hidden /></label>
              </>
            )}
          </div>
        </div>
      )}

      {leftImg && rightImg && viewMode === 'slider' && (
        <div
          className="dc__image-slider"
          ref={containerRef}
          onMouseMove={handleMouseMove}
          onMouseUp={handleMouseUp}
          onMouseLeave={handleMouseUp}
        >
          <img src={rightImg} alt="Modified" className="dc__image-slider-img" />
          <div className="dc__image-slider-clip" style={{ width: `${sliderPos}%` }}>
            <img src={leftImg} alt="Original" className="dc__image-slider-img" />
          </div>
          <div className="dc__image-slider-handle" style={{ left: `${sliderPos}%` }} onMouseDown={handleMouseDown}>
            <div className="dc__image-slider-line" />
            <div className="dc__image-slider-grip">⟺</div>
          </div>
          <span className="dc__image-label dc__image-label--left">Original</span>
          <span className="dc__image-label dc__image-label--right">Modified</span>
        </div>
      )}

      {leftImg && rightImg && viewMode === 'side' && (
        <div className="dc__image-side">
          <div className="dc__image-side-panel">
            <span className="dc__image-side-label">Original</span>
            <img src={leftImg} alt="Original" />
          </div>
          <div className="dc__image-side-panel">
            <span className="dc__image-side-label">Modified</span>
            <img src={rightImg} alt="Modified" />
          </div>
        </div>
      )}

      {leftImg && rightImg && viewMode === 'diff' && (
        <div className="dc__image-diff-result">
          {diffImg ? <img src={diffImg} alt="Difference" /> : <span>Generating diff...</span>}
          <span className="dc__image-diff-legend">Red = pixels that differ</span>
        </div>
      )}

      {(leftImg || rightImg) && (
        <div className="dc__image-actions">
          <button className="dc__toolbar-btn" onClick={() => { setLeftImg(null); setRightImg(null); setDiffImg(null); }}>✕ Clear</button>
          {leftImg && !rightImg && <label className="dc__toolbar-btn">Upload Modified<input type="file" accept="image/*" onChange={handleFile('right')} hidden /></label>}
          {!leftImg && rightImg && <label className="dc__toolbar-btn">Upload Original<input type="file" accept="image/*" onChange={handleFile('left')} hidden /></label>}
        </div>
      )}
    </div>
  );
}


const SAMPLE_LEFT = `function greet(name) {
  console.log("Hello, " + name);
  return true;
}

const items = [1, 2, 3];
items.forEach(item => {
  console.log(item);
});`;

const SAMPLE_RIGHT = `function greet(name, greeting) {
  console.log(greeting + ", " + name);
  return greeting !== undefined;
}

const items = [1, 2, 3, 4, 5];
items.map(item => {
  return item * 2;
});`;

let tabIdCounter = 1;

function createTab(name) {
  return {
    id: tabIdCounter++,
    name,
    left: SAMPLE_LEFT,
    right: SAMPLE_RIGHT,
    viewMode: 'split',
    ignoreCase: false,
    ignoreWhitespace: false,
    ignoreEmptyLines: false,
  };
}

function DiffTab({ tab, updateTab, monacoTheme }) {
  const [currentChange, setCurrentChange] = useState(0);
  const [resultCollapsed, setResultCollapsed] = useState(false);
  const [fullscreenEditor, setFullscreenEditor] = useState(null);
  const [resultFullscreen, setResultFullscreen] = useState(false);
  const leftEditorRef = useRef(null);
  const rightEditorRef = useRef(null);
  const leftDecorationsRef = useRef([]);
  const rightDecorationsRef = useRef([]);
  const monacoRef = useRef(null);

  const { left, right, viewMode, ignoreCase, ignoreWhitespace, ignoreEmptyLines } = tab;

  const setLeft = (v) => updateTab({ left: v });
  const setRight = (v) => updateTab({ right: v });
  const setViewMode = (v) => updateTab({ viewMode: v });
  const setIgnoreCase = (v) => updateTab({ ignoreCase: v });
  const setIgnoreWhitespace = (v) => updateTab({ ignoreWhitespace: v });
  const setIgnoreEmptyLines = (v) => updateTab({ ignoreEmptyLines: v });

  const prettifyJSON = useCallback((text) => {
    try { return JSON.stringify(JSON.parse(text), null, 2); } catch { return text; }
  }, []);

  const handlePrettify = useCallback(() => {
    updateTab({ left: prettifyJSON(left), right: prettifyJSON(right) });
  }, [left, right, prettifyJSON, updateTab]);

  const preprocess = useCallback((text) => {
    let t = text;
    if (ignoreCase) t = t.toLowerCase();
    if (ignoreEmptyLines) t = t.split('\n').filter(l => l.trim() !== '').join('\n');
    if (ignoreWhitespace) t = t.split('\n').map(l => l.trim().replace(/\s+/g, ' ')).join('\n');
    return t;
  }, [ignoreCase, ignoreWhitespace, ignoreEmptyLines]);

  const diffResult = useMemo(() => diffLines(preprocess(left), preprocess(right)), [left, right, preprocess]);

  const stats = useMemo(() => {
    let added = 0, removed = 0, modified = 0;
    for (let i = 0; i < diffResult.length; i++) {
      const part = diffResult[i];
      if (part.added) {
        if (i > 0 && diffResult[i - 1].removed) { modified++; removed--; }
        else added += part.count;
      } else if (part.removed) { removed += part.count; }
    }
    return { added, removed, modified };
  }, [diffResult]);

  const changes = useMemo(() => diffResult.filter(p => p.added || p.removed), [diffResult]);

  const navigateChange = useCallback((dir) => {
    if (changes.length === 0) return;
    setCurrentChange(prev => {
      const next = prev + dir;
      if (next < 0) return changes.length - 1;
      if (next >= changes.length) return 0;
      return next;
    });
  }, [changes.length]);

  const handleCopy = useCallback(() => {
    const text = diffResult.map(p => {
      const prefix = p.added ? '+ ' : p.removed ? '- ' : '  ';
      return p.value.split('\n').filter(l => l !== '').map(l => prefix + l).join('\n');
    }).join('\n');
    navigator.clipboard.writeText(text);
  }, [diffResult]);

  const handleDownload = useCallback(() => {
    const text = diffResult.map(p => {
      const prefix = p.added ? '+ ' : p.removed ? '- ' : '  ';
      return p.value.split('\n').filter(l => l !== '').map(l => prefix + l).join('\n');
    }).join('\n');
    const blob = new Blob([text], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'diff-result.txt';
    a.click();
    URL.revokeObjectURL(url);
  }, [diffResult]);

  const handleSwap = useCallback(() => updateTab({ left: right, right: left }), [left, right, updateTab]);
  const handleClear = useCallback(() => updateTab({ left: '', right: '' }), [updateTab]);

  const { leftDecorations, rightDecorations } = useMemo(() => {
    const leftDecs = [], rightDecs = [];
    let leftLine = 1, rightLine = 1;
    for (const part of diffResult) {
      const lineCount = part.count || part.value.split('\n').filter((l, i, a) => !(i === a.length - 1 && l === '')).length;
      if (part.removed) { for (let i = 0; i < lineCount; i++) leftDecs.push(leftLine + i); leftLine += lineCount; }
      else if (part.added) { for (let i = 0; i < lineCount; i++) rightDecs.push(rightLine + i); rightLine += lineCount; }
      else { leftLine += lineCount; rightLine += lineCount; }
    }
    return { leftDecorations: leftDecs, rightDecorations: rightDecs };
  }, [diffResult]);

  useEffect(() => {
    const editor = leftEditorRef.current;
    if (!editor || !monacoRef.current) return;
    const monaco = monacoRef.current;
    const decorations = leftDecorations.map(line => ({
      range: new monaco.Range(line, 1, line, 1),
      options: { isWholeLine: true, className: 'dc-line-removed', glyphMarginClassName: 'dc-glyph-removed' },
    }));
    leftDecorationsRef.current = editor.deltaDecorations(leftDecorationsRef.current, decorations);
  }, [leftDecorations, left]);

  useEffect(() => {
    const editor = rightEditorRef.current;
    if (!editor || !monacoRef.current) return;
    const monaco = monacoRef.current;
    const decorations = rightDecorations.map(line => ({
      range: new monaco.Range(line, 1, line, 1),
      options: { isWholeLine: true, className: 'dc-line-added', glyphMarginClassName: 'dc-glyph-added' },
    }));
    rightDecorationsRef.current = editor.deltaDecorations(rightDecorationsRef.current, decorations);
  }, [rightDecorations, right]);

  const handleLeftEditorMount = (editor, monaco) => { leftEditorRef.current = editor; monacoRef.current = monaco; };
  const handleRightEditorMount = (editor, monaco) => { rightEditorRef.current = editor; monacoRef.current = monaco; };

  const renderWordDiff = (oldText, newText) => {
    const wordDiff = diffWordsWithSpace(oldText, newText);
    return wordDiff.map((part, i) => {
      if (part.added) return <span key={i} className="dc__word dc__word--added">{part.value}</span>;
      if (part.removed) return <span key={i} className="dc__word dc__word--removed">{part.value}</span>;
      return <span key={i}>{part.value}</span>;
    });
  };

  const renderLeftWordDiff = (oldText, newText) => {
    const wordDiff = diffWordsWithSpace(oldText, newText);
    return wordDiff.map((part, i) => {
      if (part.added) return null;
      if (part.removed) return <span key={i} className="dc__word dc__word--removed">{part.value}</span>;
      return <span key={i}>{part.value}</span>;
    });
  };

  const renderRightWordDiff = (oldText, newText) => {
    const wordDiff = diffWordsWithSpace(oldText, newText);
    return wordDiff.map((part, i) => {
      if (part.removed) return null;
      if (part.added) return <span key={i} className="dc__word dc__word--added">{part.value}</span>;
      return <span key={i}>{part.value}</span>;
    });
  };

  const diffBlocks = useMemo(() => {
    const blocks = [];
    let lineNum = 0;
    for (let i = 0; i < diffResult.length; i++) {
      const part = diffResult[i];
      const lines = part.value.split('\n').filter((l, idx, arr) => !(idx === arr.length - 1 && l === ''));
      if (!part.added && !part.removed) { lineNum += lines.length; }
      else {
        if (part.removed && i + 1 < diffResult.length && diffResult[i + 1].added) {
          blocks.push({ type: 'modified', old: part.value, new: diffResult[i + 1].value, line: lineNum + 1 });
          lineNum += lines.length;
          i++;
        } else if (part.removed) { blocks.push({ type: 'removed', text: part.value, line: lineNum + 1 }); lineNum += lines.length; }
        else if (part.added) { blocks.push({ type: 'added', text: part.value, line: lineNum + 1 }); }
      }
    }
    return blocks;
  }, [diffResult]);

  const renderInlineDiff = () => (
    <div className="dc__inline-diff">
      {diffBlocks.length === 0 && <div className="dc__no-diff">✓ No differences found</div>}
      {diffBlocks.map((block, i) => (
        <div key={i} className="dc__diff-block">
          <div className="dc__block-header">Line {block.line}</div>
          {block.type === 'modified' && (
            <div className="dc__block-body">
              <div className="dc__inline-line dc__inline-line--removed">
                <span className="dc__inline-prefix">−</span>
                <span className="dc__inline-text">{renderWordDiff(block.old.trimEnd(), block.new.trimEnd())}</span>
              </div>
            </div>
          )}
          {block.type === 'removed' && (
            <div className="dc__block-body">
              {block.text.split('\n').filter(l => l !== '').map((line, j) => (
                <div key={j} className="dc__inline-line dc__inline-line--removed">
                  <span className="dc__inline-prefix">−</span>
                  <span className="dc__inline-text">{line}</span>
                </div>
              ))}
            </div>
          )}
          {block.type === 'added' && (
            <div className="dc__block-body">
              {block.text.split('\n').filter(l => l !== '').map((line, j) => (
                <div key={j} className="dc__inline-line dc__inline-line--added">
                  <span className="dc__inline-prefix">+</span>
                  <span className="dc__inline-text">{line}</span>
                </div>
              ))}
            </div>
          )}
        </div>
      ))}
    </div>
  );

  const renderSplitDiff = () => (
    <div className="dc__split-diff">
      <div className="dc__split-panel">
        <div className="dc__split-header">Original</div>
        <div className="dc__split-lines">
          {diffBlocks.length === 0 && <div className="dc__no-diff">✓ No differences</div>}
          {diffBlocks.map((block, i) => (
            <div key={i} className="dc__diff-block-split">
              <div className="dc__block-header">Line {block.line}</div>
              {block.type === 'modified' && (
                <div className="dc__split-line dc__split-line--removed">
                  <span className="dc__split-text">{renderLeftWordDiff(block.old.trimEnd(), block.new.trimEnd())}</span>
                </div>
              )}
              {block.type === 'removed' && (
                block.text.split('\n').filter(l => l !== '').map((line, j) => (
                  <div key={j} className="dc__split-line dc__split-line--removed">
                    <span className="dc__split-text"><span className="dc__word dc__word--removed">{line}</span></span>
                  </div>
                ))
              )}
              {block.type === 'added' && (
                <div className="dc__split-line dc__split-line--empty"><span className="dc__split-text">—</span></div>
              )}
            </div>
          ))}
        </div>
      </div>
      <div className="dc__split-panel">
        <div className="dc__split-header">Modified</div>
        <div className="dc__split-lines">
          {diffBlocks.length === 0 && <div className="dc__no-diff">✓ No differences</div>}
          {diffBlocks.map((block, i) => (
            <div key={i} className="dc__diff-block-split">
              <div className="dc__block-header">Line {block.line}</div>
              {block.type === 'modified' && (
                <div className="dc__split-line dc__split-line--added">
                  <span className="dc__split-text">{renderRightWordDiff(block.old.trimEnd(), block.new.trimEnd())}</span>
                </div>
              )}
              {block.type === 'added' && (
                block.text.split('\n').filter(l => l !== '').map((line, j) => (
                  <div key={j} className="dc__split-line dc__split-line--added">
                    <span className="dc__split-text"><span className="dc__word dc__word--added">{line}</span></span>
                  </div>
                ))
              )}
              {block.type === 'removed' && (
                <div className="dc__split-line dc__split-line--empty"><span className="dc__split-text">—</span></div>
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  );

  const editorOptions = {
    fontSize: 13,
    fontFamily: 'JetBrains Mono, SF Mono, Fira Code, monospace',
    lineNumbers: 'on',
    scrollBeyondLastLine: false,
    wordWrap: 'on',
    padding: { top: 12 },
    overviewRulerBorder: false,
    glyphMargin: true,
    scrollbar: { verticalScrollbarSize: 6 },
  };

  return (
    <div className="dc__tab-content">
      {/* Toolbar */}
      <div className="dc__toolbar">
        <div className="dc__toolbar-group">
          <button className={`dc__toolbar-btn ${viewMode === 'split' ? 'dc__toolbar-btn--active' : ''}`} onClick={() => setViewMode('split')}>Split</button>
          <button className={`dc__toolbar-btn ${viewMode === 'inline' ? 'dc__toolbar-btn--active' : ''}`} onClick={() => setViewMode('inline')}>Inline</button>
        </div>
        <div className="dc__toolbar-group">
          <label className="dc__check"><input type="checkbox" checked={ignoreCase} onChange={e => setIgnoreCase(e.target.checked)} /> Ignore Case</label>
          <label className="dc__check"><input type="checkbox" checked={ignoreWhitespace} onChange={e => setIgnoreWhitespace(e.target.checked)} /> Ignore Whitespace</label>
          <label className="dc__check"><input type="checkbox" checked={ignoreEmptyLines} onChange={e => setIgnoreEmptyLines(e.target.checked)} /> Ignore Empty Lines</label>
        </div>
        <div className="dc__toolbar-group">
          <button className="dc__toolbar-btn dc__toolbar-btn--primary" onClick={handlePrettify}>✦ Prettify JSON</button>
          <button className="dc__toolbar-btn" onClick={handleSwap}>⇄ Swap</button>
          <button className="dc__toolbar-btn" onClick={handleCopy}>⧉ Copy</button>
          <button className="dc__toolbar-btn" onClick={handleDownload}>↓ Download</button>
          <button className="dc__toolbar-btn" onClick={handleClear}>✕ Clear</button>
        </div>
      </div>

      {/* Stats */}
      <div className="dc__stats">
        <span className="dc__stat dc__stat--added">+{stats.added} Added</span>
        <span className="dc__stat dc__stat--removed">−{stats.removed} Removed</span>
        <span className="dc__stat dc__stat--modified">~{stats.modified} Modified</span>
        <div className="dc__nav">
          <button className="dc__nav-btn" onClick={() => navigateChange(-1)} disabled={changes.length === 0}>▲</button>
          <span className="dc__nav-info">{changes.length > 0 ? `${currentChange + 1}/${changes.length}` : '0/0'}</span>
          <button className="dc__nav-btn" onClick={() => navigateChange(1)} disabled={changes.length === 0}>▼</button>
        </div>
      </div>

      {/* Editors */}
      <div className={`dc__editors ${fullscreenEditor ? 'dc__editors--fullscreen' : ''}`}>
        <div className={`dc__editor-panel ${fullscreenEditor === 'left' ? 'dc__editor-panel--full' : ''} ${fullscreenEditor === 'right' ? 'dc__editor-panel--hidden' : ''}`}>
          <div className="dc__editor-header">
            <span>Original</span>
            <button className="dc__expand-btn" onClick={() => setFullscreenEditor(fullscreenEditor === 'left' ? null : 'left')}>
              {fullscreenEditor === 'left' ? '⊟' : '⊞'}
            </button>
          </div>
          <div className="dc__editor">
            <MonacoEditor
              height="100%"
              language="plaintext"
              theme={monacoTheme}
              value={left}
              onChange={v => setLeft(v || '')}
              onMount={handleLeftEditorMount}
              options={{ ...editorOptions, minimap: { enabled: fullscreenEditor === 'left' } }}
            />
          </div>
        </div>
        <div className={`dc__editor-panel ${fullscreenEditor === 'right' ? 'dc__editor-panel--full' : ''} ${fullscreenEditor === 'left' ? 'dc__editor-panel--hidden' : ''}`}>
          <div className="dc__editor-header">
            <span>Modified</span>
            <button className="dc__expand-btn" onClick={() => setFullscreenEditor(fullscreenEditor === 'right' ? null : 'right')}>
              {fullscreenEditor === 'right' ? '⊟' : '⊞'}
            </button>
          </div>
          <div className="dc__editor">
            <MonacoEditor
              height="100%"
              language="plaintext"
              theme={monacoTheme}
              value={right}
              onChange={v => setRight(v || '')}
              onMount={handleRightEditorMount}
              options={{ ...editorOptions, minimap: { enabled: fullscreenEditor === 'right' } }}
            />
          </div>
        </div>
      </div>

      {/* Diff Result */}
      <div className={`dc__result ${resultFullscreen ? 'dc__result--fullscreen' : ''}`}>
        <div className="dc__result-header">
          <h3>Diff Result</h3>
          <div className="dc__result-actions">
            <div className="dc__result-legend">
              <span className="dc__legend dc__legend--added">Added</span>
              <span className="dc__legend dc__legend--removed">Removed</span>
              <span className="dc__legend dc__legend--modified">Changed</span>
            </div>
            <button className="dc__expand-btn" onClick={() => setResultFullscreen(!resultFullscreen)}>
              {resultFullscreen ? '⊟' : '⊞'}
            </button>
            <button className="dc__collapse-btn" onClick={() => setResultCollapsed(!resultCollapsed)}>
              {resultCollapsed ? '▼ Expand' : '▲ Collapse'}
            </button>
          </div>
        </div>
        {!resultCollapsed && (
          <div className="dc__result-content">
            {viewMode === 'inline' ? renderInlineDiff() : renderSplitDiff()}
          </div>
        )}
      </div>
    </div>
  );
}

function DiffChecker() {
  const navigate = useNavigate();
  const { theme, toggleTheme } = useTheme();
  useToolTheme();
  const [diffMode, setDiffMode] = useState('text');
  const [tabs, setTabs] = useState(() => {
    const saved = storage.get('dc_tabs');
    if (saved) { tabIdCounter = Math.max(...saved.map(t => t.id)) + 1; return saved; }
    return [createTab('Diff 1')];
  });
  const [activeTabId, setActiveTabId] = useState(() => storage.get('dc_activeTab') || tabs[0]?.id);
  const [editingTabId, setEditingTabId] = useState(null);

  const activeTab = tabs.find(t => t.id === activeTabId) || tabs[0];
  const monacoTheme = theme === 'dark' ? 'vs-dark' : 'vs';

  const addTab = () => {
    const newTab = createTab(`Diff ${tabs.length + 1}`);
    const next = [...tabs, newTab];
    setTabs(next);
    setActiveTabId(newTab.id);
    storage.set('dc_tabs', next);
    storage.set('dc_activeTab', newTab.id);
  };

  const closeTab = (id) => {
    if (tabs.length === 1) return;
    const newTabs = tabs.filter(t => t.id !== id);
    setTabs(newTabs);
    storage.set('dc_tabs', newTabs);
    if (activeTabId === id) {
      const newActive = newTabs[newTabs.length - 1].id;
      setActiveTabId(newActive);
      storage.set('dc_activeTab', newActive);
    }
  };

  const updateTab = useCallback((updates) => {
    setTabs(prev => {
      const next = prev.map(t => t.id === activeTabId ? { ...t, ...updates } : t);
      storage.set('dc_tabs', next);
      return next;
    });
  }, [activeTabId]);

  const renameTab = (id, name) => {
    setTabs(prev => {
      const next = prev.map(t => t.id === id ? { ...t, name } : t);
      storage.set('dc_tabs', next);
      return next;
    });
    setEditingTabId(null);
  };

  return (
    <div className="dc">
      <SEO title="Diff Checker Online | Compare Text & Code Side by Side - DevToolsDeck" description="Free online diff checker to compare text, code, or files side by side. Highlights additions, deletions, and modifications instantly." />
      <header className="dc__header">
        <div className="dc__header-left">
          <a href="/" className="navbar__logo">
            <Logo3D size={32} />
            <span className="navbar__logo-text">Dev<span className="navbar__logo-highlight">Tools</span><span className="navbar__logo-deck">Deck</span></span>
          </a>
          <button className="dc__back" onClick={() => navigate('/')}>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M19 12H5M12 19l-7-7 7-7" />
            </svg>
            Back
          </button>
          <h1 className="dc__title">Diff Checker</h1>
          <div className="dc__mode-selector">
            <button className={`dc__mode-btn ${diffMode === 'text' ? 'dc__mode-btn--active' : ''}`} onClick={() => setDiffMode('text')}>Text</button>
            <button className={`dc__mode-btn ${diffMode === 'image' ? 'dc__mode-btn--active' : ''}`} onClick={() => setDiffMode('image')}>Image</button>
          </div>
        </div>
        <div className="dc__header-right">
          <button className="dc__icon-btn" onClick={toggleTheme} title="Toggle theme">
            {theme === 'dark' ? (
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <circle cx="12" cy="12" r="5" /><path d="M12 1v2M12 21v2M4.22 4.22l1.42 1.42M18.36 18.36l1.42 1.42M1 12h2M21 12h2M4.22 19.78l1.42-1.42M18.36 5.64l1.42-1.42" />
              </svg>
            ) : (
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z" />
              </svg>
            )}
          </button>
        </div>
      </header>

      {/* Tab Bar */}
      <div className="dc__tabs">
        <div className="dc__tabs-list">
          {tabs.map(tab => (
            <div
              key={tab.id}
              className={`dc__tab ${tab.id === activeTabId ? 'dc__tab--active' : ''}`}
              onClick={() => setActiveTabId(tab.id)}
            >
              {editingTabId === tab.id ? (
                <input
                  className="dc__tab-input"
                  defaultValue={tab.name}
                  autoFocus
                  onBlur={e => renameTab(tab.id, e.target.value || tab.name)}
                  onKeyDown={e => { if (e.key === 'Enter') renameTab(tab.id, e.target.value || tab.name); }}
                  onClick={e => e.stopPropagation()}
                />
              ) : (
                <span className="dc__tab-name" onDoubleClick={() => setEditingTabId(tab.id)}>{tab.name}</span>
              )}
              {tabs.length > 1 && (
                <button className="dc__tab-close" onClick={e => { e.stopPropagation(); closeTab(tab.id); }}>×</button>
              )}
            </div>
          ))}
          <button className="dc__tab-add" onClick={addTab} title="New tab">+</button>
        </div>
      </div>

      {/* Active Tab Content */}
      {diffMode === 'text' && <DiffTab key={activeTab.id} tab={activeTab} updateTab={updateTab} monacoTheme={monacoTheme} />}
      {diffMode === 'image' && <ImageDiff />}
    </div>
  );
}

export default DiffChecker;
