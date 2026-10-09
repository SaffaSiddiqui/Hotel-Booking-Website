import { formatDate, formatPrice, nightsBetween, pluralize } from '../utils/format';

function Row({ label, value, strong = false }) {
  return (
    <div className={`summary-row${strong ? ' summary-row--total' : ''}`}>
      <dt>{label}</dt>
      <dd>{value}</dd>
    </div>
  );
}

// Dates, guests and price for a stay. Rows appear as soon as their data is available.
export default function StaySummary({ checkIn, checkOut, guests, pricePerNight }) {
  const nights = nightsBetween(checkIn, checkOut);
  const hasPrice = pricePerNight !== undefined && pricePerNight !== null;

  return (
    <dl className="stay-summary">
      {checkIn && <Row label="Check-in" value={formatDate(checkIn)} />}
      {checkOut && <Row label="Check-out" value={formatDate(checkOut)} />}
      {guests ? <Row label="Guests" value={guests} /> : null}
      {hasPrice && <Row label="Price per night" value={formatPrice(pricePerNight)} />}
      {nights > 0 && <Row label="Length of stay" value={pluralize(nights, 'night')} />}
      {nights > 0 && hasPrice && (
        <Row label="Total" value={formatPrice(nights * pricePerNight)} strong />
      )}
    </dl>
  );
}
