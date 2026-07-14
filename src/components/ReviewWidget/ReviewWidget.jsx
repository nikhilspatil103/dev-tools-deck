import { useState } from 'react';
import './ReviewWidget.css';

function ReviewWidget() {
  const [isOpen, setIsOpen] = useState(false);
  const [rating, setRating] = useState(0);
  const [hoverRating, setHoverRating] = useState(0);
  const [comment, setComment] = useState('');
  const [name, setName] = useState('');
  const [submitted, setSubmitted] = useState(false);
  const [sending, setSending] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!rating) return;
    setSending(true);

    const formData = new FormData();
    formData.append('access_key', process.env.REACT_APP_WEB3FORMS_KEY);
    formData.append('subject', `DevToolsDeck Review - ${rating}⭐ from ${name.trim() || 'Anonymous'}`);
    formData.append('name', name.trim() || 'Anonymous');
    formData.append('rating', `${rating}/5 stars`);
    formData.append('message', comment.trim() || 'No comment');

    try {
      const response = await fetch('https://api.web3forms.com/submit', {
        method: 'POST',
        body: formData,
      });
      const data = await response.json();
      if (data.success) {
        setSubmitted(true);
        setRating(0);
        setComment('');
        setName('');
        setTimeout(() => setSubmitted(false), 3500);
      }
    } catch {}
    setSending(false);
  };

  return (
    <>
      <div className="rw__trigger-wrap">
        <span className="rw__tooltip">Share your feedback!</span>
        <button className="rw__trigger" onClick={() => setIsOpen(!isOpen)} aria-label="Leave a review">
          <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
            <path d="M8 10h.01M12 10h.01M16 10h.01" />
          </svg>
        </button>
      </div>

      {isOpen && (
        <div className="rw__panel">
          <div className="rw__panel-header">
            <h3 className="rw__panel-title">Rate Your Experience</h3>
            <button className="rw__panel-close" onClick={() => setIsOpen(false)}>×</button>
          </div>

          {submitted ? (
            <div className="rw__success">
              <div className="rw__success-icon">🎉</div>
              <h4 className="rw__success-title">Thank you!</h4>
              <p className="rw__success-text">Your feedback helps us improve.</p>
            </div>
          ) : (
            <form className="rw__form" onSubmit={handleSubmit}>
              <div className="rw__rating-row">
                {[1, 2, 3, 4, 5].map(s => (
                  <button
                    key={s}
                    type="button"
                    className={`rw__star-btn ${s <= (hoverRating || rating) ? 'rw__star-btn--active' : ''}`}
                    onClick={() => setRating(s)}
                    onMouseEnter={() => setHoverRating(s)}
                    onMouseLeave={() => setHoverRating(0)}
                  >
                    ★
                  </button>
                ))}
                {rating > 0 && <span className="rw__rating-text">{rating}/5</span>}
              </div>
              <input
                className="rw__input"
                placeholder="Your name (optional)"
                value={name}
                onChange={e => setName(e.target.value)}
                name="name"
              />
              <textarea
                className="rw__textarea"
                placeholder="What did you like or dislike?"
                value={comment}
                onChange={e => setComment(e.target.value)}
                rows={3}
                name="message"
              />
              <button className="rw__submit" type="submit" disabled={!rating || sending}>
                {sending ? 'Sending...' : '📨 Submit Review'}
              </button>
            </form>
          )}
        </div>
      )}
    </>
  );
}

export default ReviewWidget;
