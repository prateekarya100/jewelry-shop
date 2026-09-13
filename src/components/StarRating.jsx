import React from 'react';

export default function StarRating({ value = 0, count, size = 15, interactive = false, onChange }) {
  const stars = [1, 2, 3, 4, 5];
  return (
    <span className="star-rating" style={{ fontSize: size }} role={interactive ? 'radiogroup' : undefined} aria-label={`${value.toFixed ? value.toFixed(1) : value} out of 5 stars`}>
      {stars.map((s) => {
        const filled = s <= Math.round(value);
        return (
          <button
            key={s}
            type="button"
            className={`star ${filled ? 'star--filled' : ''} ${interactive ? 'star--interactive' : ''}`}
            onClick={interactive ? () => onChange(s) : undefined}
            tabIndex={interactive ? 0 : -1}
            aria-hidden={!interactive}
            style={{ pointerEvents: interactive ? 'auto' : 'none' }}
          >
            &#9733;
          </button>
        );
      })}
      {typeof count === 'number' && (
        <span className="star-rating__count">({count})</span>
      )}
    </span>
  );
}
