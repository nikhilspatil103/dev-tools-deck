import './History.css';

const mockHistory = [
  { id: 1, filename: 'config.json', size: '2.4 KB', time: '2 min ago' },
  { id: 2, filename: 'package.json', size: '1.8 KB', time: '5 min ago' },
  { id: 3, filename: 'response.json', size: '4.1 KB', time: '12 min ago' },
  { id: 4, filename: 'schema.json', size: '890 B', time: '1 hr ago' },
];

function History() {
  return (
    <div className="history">
      <div className="history__list">
        {mockHistory.map((item) => (
          <div key={item.id} className="history__item">
            <div className="history__icon">📄</div>
            <div className="history__info">
              <span className="history__filename">{item.filename}</span>
              <span className="history__meta">{item.size} · {item.time}</span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

export default History;
