import { useState } from 'react';

// Shows the hotel photo, or a neutral placeholder if the URL is missing or fails to load.
export default function HotelImage({ src, alt, className = '' }) {
  const [failedSrc, setFailedSrc] = useState(null);

  if (!src || failedSrc === src) {
    return (
      <div className={`hotel-image hotel-image--fallback ${className}`} role="img" aria-label={`${alt} (photo unavailable)`}>
        <span>Photo unavailable</span>
      </div>
    );
  }

  return (
    <img
      className={`hotel-image ${className}`}
      src={src}
      alt={alt}
      loading="lazy"
      onError={() => setFailedSrc(src)}
    />
  );
}
