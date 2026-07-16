import { useState, useCallback, useMemo, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTheme, useToolTheme } from '../../hooks/useTheme';
import { storage } from '../../utils/storage';
import SEO from '../../components/SEO/SEO';
import * as XLSX from 'xlsx';
import './ExcelCompare.css';
import Logo3D from '../../components/Logo3D/Logo3D';

let tabIdCounter = 1;
function createTab(name) {
  return { id: tabIdCounter++, name, leftData: null, rightData: null, leftName: '', rightName: '' };
}

function ExcelDiff({ tabId }) {
  const [leftData, setLeftData] = useState(() => storage.get(`ec_tab_${tabId}`)?.leftData || null);
  const [rightData, setRightData] = useState(() => storage.get(`ec_tab_${tabId}`)?.rightData || null);
  const [leftName, setLeftName] = useState(() => storage.get(`ec_tab_${tabId}`)?.leftName || '');
  const [rightName, setRightName] = useState(() => storage.get(`ec_tab_${tabId}`)?.rightName || '');
  const [showOnlyDiffs, setShowOnlyDiffs] = useState(false);
  const [zoom, setZoom] = useState(70);
  const [fullscreen, setFullscreen] = useState(false);
  const [stats, setStats] = useState({ added: 0, removed: 0, modified: 0, unchanged: 0 });
  const leftScrollRef = useRef(null);
  const rightScrollRef = useRef(null);
  const syncingRef = useRef(false);

  const zoomIn = () => setZoom(z => Math.min(z + 10, 200));
  const zoomOut = () => setZoom(z => Math.max(z - 10, 50));
  const zoomReset = () => setZoom(100);

  // Persist data on change
  useEffect(() => {
    try {
      storage.set(`ec_tab_${tabId}`, { leftData, rightData, leftName, rightName });
    } catch (e) {
      // localStorage might be full for large spreadsheets
    }
  }, [tabId, leftData, rightData, leftName, rightName]);

  const parseCSV = (text) => {
    return text.trim().split('\n').map(row => {
      const cells = [];
      let current = '', inQuotes = false;
      for (let i = 0; i < row.length; i++) {
        const ch = row[i];
        if (ch === '"') { inQuotes = !inQuotes; }
        else if (ch === ',' && !inQuotes) { cells.push(current.trim()); current = ''; }
        else { current += ch; }
      }
      cells.push(current.trim());
      return cells;
    });
  };

  const parsePasted = (text) => {
    return text.trim().split('\n').map(line => line.split('\t'));
  };

  const handleTablePaste = useCallback((side) => (e) => {
    e.preventDefault();
    const text = e.clipboardData.getData('text');
    if (!text.trim()) return;
    const data = text.includes('\t') ? parsePasted(text) : parseCSV(text);
    if (side === 'left') { setLeftData(data); setLeftName('Pasted data'); }
    else { setRightData(data); setRightName('Pasted data'); }
  }, []);

  const handleFile = useCallback((side) => (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const isExcel = file.name.endsWith('.xlsx') || file.name.endsWith('.xls');
    if (isExcel) {
      const reader = new FileReader();
      reader.onload = (ev) => {
        const wb = XLSX.read(ev.target.result, { type: 'array' });
        const sheet = wb.Sheets[wb.SheetNames[0]];
        const range = XLSX.utils.decode_range(sheet['!ref'] || 'A1');
        const data = XLSX.utils.sheet_to_json(sheet, { header: 1, defval: '', range: 0 });
        const colCount = range.e.c + 1;
        const normalized = data.map(row => {
          const r = Array.isArray(row) ? row : [];
          while (r.length < colCount) r.push('');
          return r;
        });
        if (side === 'left') { setLeftData(normalized); setLeftName(file.name); }
        else { setRightData(normalized); setRightName(file.name); }
      };
      reader.readAsArrayBuffer(file);
    } else {
      const reader = new FileReader();
      reader.onload = (ev) => {
        const data = parseCSV(ev.target.result);
        if (side === 'left') { setLeftData(data); setLeftName(file.name); }
        else { setRightData(data); setRightName(file.name); }
      };
      reader.readAsText(file);
    }
    e.target.value = '';
  }, []);

  const handleScroll = useCallback((source) => (e) => {
    if (syncingRef.current) return;
    syncingRef.current = true;
    const target = source === 'left' ? rightScrollRef.current : leftScrollRef.current;
    if (target) {
      target.scrollTop = e.target.scrollTop;
      target.scrollLeft = e.target.scrollLeft;
    }
    setTimeout(() => { syncingRef.current = false; }, 10);
  }, []);

  const maxRows = Math.max(leftData?.length || 0, rightData?.length || 0);
  const maxCols = useMemo(() => {
    let max = 0;
    if (leftData) leftData.forEach(r => { if (r && r.length > max) max = r.length; });
    if (rightData) rightData.forEach(r => { if (r && r.length > max) max = r.length; });
    return max;
  }, [leftData, rightData]);

  const diffMap = useMemo(() => {
    if (!leftData || !rightData) return {};
    const map = {};
    let added = 0, removed = 0, modified = 0, unchanged = 0;
    for (let row = 0; row < maxRows; row++) {
      const leftRow = leftData[row];
      const rightRow = rightData[row];
      if (!leftRow && rightRow) { map[row] = { type: 'row-added' }; added++; continue; }
      if (leftRow && !rightRow) { map[row] = { type: 'row-removed' }; removed++; continue; }
      let rowHasDiff = false;
      const cells = {};
      for (let col = 0; col < maxCols; col++) {
        const lVal = String(leftRow?.[col] ?? '');
        const rVal = String(rightRow?.[col] ?? '');
        if (lVal !== rVal) { cells[col] = { left: lVal, right: rVal }; rowHasDiff = true; }
      }
      if (rowHasDiff) { map[row] = { type: 'modified', cells }; modified++; }
      else { unchanged++; }
    }
    setStats({ added, removed, modified, unchanged });
    return map;
  }, [leftData, rightData, maxRows, maxCols]);

  const getRowClass = (row) => {
    const d = diffMap[row];
    if (!d) return '';
    if (d.type === 'row-added') return 'dc__xrow--added';
    if (d.type === 'row-removed') return 'dc__xrow--removed';
    if (d.type === 'modified') return 'dc__xrow--modified';
    return '';
  };

  const getCellDiff = (row, col) => {
    const d = diffMap[row];
    if (!d || d.type !== 'modified') return null;
    return d.cells?.[col] || null;
  };

  const visibleRows = useMemo(() => {
    if (!showOnlyDiffs) return Array.from({ length: maxRows }, (_, i) => i);
    return Array.from({ length: maxRows }, (_, i) => i).filter(i => diffMap[i]);
  }, [maxRows, showOnlyDiffs, diffMap]);

  const colHeader = (i) => {
    let s = '';
    let n = i;
    while (n >= 0) { s = String.fromCharCode(65 + (n % 26)) + s; n = Math.floor(n / 26) - 1; }
    return s;
  };

  const loadSample = () => {
    setLeftData([
      ['ID', 'Name', 'Department', 'City', 'Salary', 'Status'],
      ['001', 'Alice Johnson', 'Engineering', 'Mumbai', '120000', 'Active'],
      ['002', 'Bob Smith', 'Design', 'Delhi', '95000', 'Active'],
      ['003', 'Charlie Brown', 'Management', 'Bangalore', '150000', 'Active'],
      ['004', 'Diana Prince', 'Analytics', 'Pune', '85000', 'Active'],
      ['005', 'Eve Wilson', 'Engineering', 'Chennai', '110000', 'Active'],
      ['006', 'Frank Miller', 'Sales', 'Hyderabad', '78000', 'Active'],
      ['007', 'Grace Lee', 'Marketing', 'Mumbai', '92000', 'Active'],
    ]);
    setRightData([
      ['ID', 'Name', 'Department', 'City', 'Salary', 'Status'],
      ['001', 'Alice Johnson', 'Engineering', 'Mumbai', '145000', 'Active'],
      ['002', 'Bob Smith', 'Design', 'Hyderabad', '95000', 'Active'],
      ['003', 'Charlie Brown', 'Director', 'Bangalore', '180000', 'Active'],
      ['004', 'Diana Prince', 'Analytics', 'Pune', '92000', 'Promoted'],
      ['005', 'Eve Wilson', 'Engineering', 'Chennai', '110000', 'Active'],
      ['006', 'Frank Miller', 'Sales', 'Hyderabad', '85000', 'Active'],
      ['007', 'Grace Lee', 'Marketing', 'Mumbai', '92000', 'Inactive'],
      ['008', 'Hank Patel', 'Engineering', 'Pune', '105000', 'Active'],
    ]);
    setLeftName('employees-q1.xlsx');
    setRightName('employees-q2.xlsx');
  };

  const renderTable = (data, side, scrollRef, scrollHandler) => (
    <div className="dc__excel-scroll" ref={scrollRef} onScroll={scrollHandler}>
      <table className="dc__excel-table">
        <thead>
          <tr>
            <th className="dc__excel-rownum">#</th>
            {Array.from({ length: maxCols }, (_, i) => (
              <th key={i} className="dc__excel-colhead">{colHeader(i)}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {visibleRows.map(row => {
            const otherData = side === 'left' ? rightData : leftData;
            return (
              <tr key={row} className={otherData ? getRowClass(row) : ''}>
                <td className="dc__excel-rownum">{row + 1}</td>
                {Array.from({ length: maxCols }, (_, col) => {
                  const val = String(data[row]?.[col] ?? '');
                  const cellDiff = otherData ? getCellDiff(row, col) : null;
                  return (
                    <td key={col} className={`dc__excel-cell ${cellDiff ? 'dc__xcell--changed' : ''}`} title={cellDiff && side === 'right' ? `Was: "${cellDiff.left}"` : ''}>
                      {val}
                    </td>
                  );
                })}
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );

  return (
    <div className="dc__excel-diff">
      <div className="dc__excel-toolbar">
        <label className="dc__toolbar-btn">↑ Original<input type="file" accept=".csv,.tsv,.txt,.xlsx,.xls" onChange={handleFile('left')} hidden /></label>
        <label className="dc__toolbar-btn">↑ Modified<input type="file" accept=".csv,.tsv,.txt,.xlsx,.xls" onChange={handleFile('right')} hidden /></label>
        <button className="dc__toolbar-btn" onClick={loadSample}>▶ Sample</button>
        {leftData && rightData && (
          <label className="dc__check"><input type="checkbox" checked={showOnlyDiffs} onChange={e => setShowOnlyDiffs(e.target.checked)} /> Show only differences</label>
        )}
        {(leftData || rightData) && <button className="dc__toolbar-btn" onClick={() => { setLeftData(null); setRightData(null); setLeftName(''); setRightName(''); }}>✕ Clear</button>}
      </div>

      {leftData && rightData && (
        <div className="dc__excel-stats">
          <span className="dc__stat dc__stat--added">+{stats.added} Added</span>
          <span className="dc__stat dc__stat--removed">−{stats.removed} Removed</span>
          <span className="dc__stat dc__stat--modified">~{stats.modified} Modified</span>
          <span className="dc__excel-stat-unchanged">{stats.unchanged} Unchanged</span>
          <div className="dc__zoom-controls">
            <button className="dc__zoom-btn" onClick={zoomOut} title="Zoom out">−</button>
            <button className="dc__zoom-label" onClick={zoomReset} title="Reset zoom">{zoom}%</button>
            <button className="dc__zoom-btn" onClick={zoomIn} title="Zoom in">+</button>
          </div>
          <button className="ec__panel-fullscreen" onClick={() => setFullscreen(true)} title="Fullscreen">
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M15 3h6v6M9 21H3v-6M21 3l-7 7M3 21l7-7" /></svg>
          </button>
          <span className="dc__excel-files">{leftName} → {rightName}</span>
        </div>
      )}

      {/* Side-by-side panels - always visible */}
      <div className="dc__excel-compare" style={{ fontSize: `${zoom}%` }}>
        <div className="dc__excel-panel">
          <div className="dc__excel-panel-header">
            <span className="dc__excel-panel-title">Original</span>
            <span className="dc__excel-panel-file">{leftName || 'Paste or upload'}</span>
          </div>
          {leftData ? (
            renderTable(leftData, 'left', leftScrollRef, handleScroll('left'))
          ) : (
            <div className="dc__excel-paste-area" tabIndex={0} onPaste={handleTablePaste('left')}>
              <div className="dc__excel-paste-hint">
                <span className="dc__excel-paste-icon">⎘</span>
                <span>Click here & press <kbd>Ctrl+V</kbd> to paste</span>
                <span className="dc__excel-paste-sub">Supports Excel, Google Sheets, CSV</span>
                <label className="dc__toolbar-btn dc__toolbar-btn--sm">or Upload file<input type="file" accept=".csv,.tsv,.txt,.xlsx,.xls" onChange={handleFile('left')} hidden /></label>
              </div>
            </div>
          )}
        </div>

        <div className="dc__excel-panel">
          <div className="dc__excel-panel-header">
            <span className="dc__excel-panel-title">Modified</span>
            <span className="dc__excel-panel-file">{rightName || 'Paste or upload'}</span>
          </div>
          {rightData ? (
            renderTable(rightData, 'right', rightScrollRef, handleScroll('right'))
          ) : (
            <div className="dc__excel-paste-area" tabIndex={0} onPaste={handleTablePaste('right')}>
              <div className="dc__excel-paste-hint">
                <span className="dc__excel-paste-icon">⎘</span>
                <span>Click here & press <kbd>Ctrl+V</kbd> to paste</span>
                <span className="dc__excel-paste-sub">Supports Excel, Google Sheets, CSV</span>
                <label className="dc__toolbar-btn dc__toolbar-btn--sm">or Upload file<input type="file" accept=".csv,.tsv,.txt,.xlsx,.xls" onChange={handleFile('right')} hidden /></label>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Fullscreen overlay - side by side */}
      {fullscreen && (
        <div className="ec__fullscreen-overlay">
          <div className="ec__fullscreen-header">
            <span className="ec__fullscreen-title">{leftName} ↔ {rightName}</span>
            <div className="dc__zoom-controls">
              <button className="dc__zoom-btn" onClick={zoomOut} title="Zoom out">−</button>
              <button className="dc__zoom-label" onClick={zoomReset} title="Reset zoom">{zoom}%</button>
              <button className="dc__zoom-btn" onClick={zoomIn} title="Zoom in">+</button>
            </div>
            <button className="ec__fullscreen-close" onClick={() => setFullscreen(false)} title="Exit fullscreen">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M8 3v3a2 2 0 0 1-2 2H3m18 0h-3a2 2 0 0 1-2-2V3m0 18v-3a2 2 0 0 1 2-2h3M3 16h3a2 2 0 0 1 2 2v3" /></svg>
            </button>
          </div>
          <div className="ec__fullscreen-body" style={{ fontSize: `${zoom}%` }}>
            <div className="ec__fullscreen-panel">
              <div className="dc__excel-panel-header"><span className="dc__excel-panel-title">Original</span><span className="dc__excel-panel-file">{leftName}</span></div>
              {renderTable(leftData, 'left', leftScrollRef, handleScroll('left'))}
            </div>
            <div className="ec__fullscreen-panel">
              <div className="dc__excel-panel-header"><span className="dc__excel-panel-title">Modified</span><span className="dc__excel-panel-file">{rightName}</span></div>
              {renderTable(rightData, 'right', rightScrollRef, handleScroll('right'))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function ExcelCompare() {
  const navigate = useNavigate();
  const { theme, toggleTheme } = useTheme();
  useToolTheme();
  const [tabs, setTabs] = useState(() => {
    const saved = storage.get('ec_tabs');
    if (saved) { tabIdCounter = Math.max(...saved.map(t => t.id)) + 1; return saved; }
    return [createTab('Compare 1')];
  });
  const [activeTabId, setActiveTabId] = useState(() => storage.get('ec_activeTab') || tabs[0]?.id);
  const [editingTabId, setEditingTabId] = useState(null);

  const activeTab = tabs.find(t => t.id === activeTabId) || tabs[0];

  const addTab = () => {
    const newTab = createTab(`Compare ${tabs.length + 1}`);
    const next = [...tabs, newTab];
    setTabs(next);
    setActiveTabId(newTab.id);
    storage.set('ec_tabs', next);
    storage.set('ec_activeTab', newTab.id);
  };

  const closeTab = (id) => {
    if (tabs.length === 1) return;
    const next = tabs.filter(t => t.id !== id);
    setTabs(next);
    storage.set('ec_tabs', next);
    storage.remove(`ec_tab_${id}`);
    if (activeTabId === id) {
      const newActive = next[next.length - 1].id;
      setActiveTabId(newActive);
      storage.set('ec_activeTab', newActive);
    }
  };

  const renameTab = (id, name) => {
    setTabs(prev => {
      const next = prev.map(t => t.id === id ? { ...t, name } : t);
      storage.set('ec_tabs', next);
      return next;
    });
    setEditingTabId(null);
  };

  return (
    <div className="ec">
      <SEO title="Excel Compare Online | Diff Two Spreadsheets Side by Side - DevToolsDeck" description="Free online Excel compare tool. Compare two spreadsheets or CSV files side by side with highlighted differences. No data uploaded." />
      <header className="ec__header">
        <div className="ec__header-left">
          <a href="/" className="navbar__logo">
            <Logo3D size={32} />
            <span className="navbar__logo-text">Dev<span className="navbar__logo-highlight">Tools</span><span className="navbar__logo-deck">Deck</span></span>
          </a>
          <button className="ec__back" onClick={() => navigate('/')}>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M19 12H5M12 19l-7-7 7-7" />
            </svg>
            Back
          </button>
          <h1 className="ec__title">Excel Compare</h1>
        </div>
        <div className="ec__header-right">
          <button className="ec__icon-btn" onClick={toggleTheme} title="Toggle theme">
            {theme === 'dark' ? (
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="5" /><path d="M12 1v2M12 21v2M4.22 4.22l1.42 1.42M18.36 18.36l1.42 1.42M1 12h2M21 12h2M4.22 19.78l1.42-1.42M18.36 5.64l1.42-1.42" /></svg>
            ) : (
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z" /></svg>
            )}
          </button>
        </div>
      </header>

      {/* Chrome-style Tab Bar */}
      <div className="ec__chrome-tabs">
        <div className="ec__chrome-tabs-row">
          <div className="ec__chrome-tabs-list">
            {tabs.map(tab => (
              <div
                key={tab.id}
                className={`ec__chrome-tab ${tab.id === activeTabId ? 'ec__chrome-tab--active' : ''}`}
                onClick={() => { setActiveTabId(tab.id); storage.set('ec_activeTab', tab.id); }}
              >
                {editingTabId === tab.id ? (
                  <input
                    className="ec__chrome-tab-input"
                    defaultValue={tab.name}
                    autoFocus
                    onBlur={e => renameTab(tab.id, e.target.value || tab.name)}
                    onKeyDown={e => { if (e.key === 'Enter') renameTab(tab.id, e.target.value || tab.name); }}
                    onClick={e => e.stopPropagation()}
                  />
                ) : (
                  <span className="ec__chrome-tab-name">{tab.name}</span>
                )}
                <button className="ec__chrome-tab-edit" onClick={e => { e.stopPropagation(); setEditingTabId(tab.id); }} title="Rename tab">
                  <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
                    <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" />
                  </svg>
                </button>
                {tabs.length > 1 && (
                  <button className="ec__chrome-tab-close" onClick={e => { e.stopPropagation(); closeTab(tab.id); }}>×</button>
                )}
              </div>
            ))}
            <button className="ec__chrome-tab-add" onClick={addTab} title="New tab">+</button>
          </div>
        </div>
      </div>

      <ExcelDiff key={activeTab.id} tabId={activeTab.id} />
    </div>
  );
}

export default ExcelCompare;
