import EmptyState from './EmptyState';
import HotelCard from './HotelCard';

export default function HotelList({ hotels, nights, query }) {
  if (hotels.length === 0) {
    return (
      <EmptyState
        title="No hotels match your search"
        message="Try a different destination, change your dates, or reduce the number of guests."
      />
    );
  }

  return (
    <div className="hotel-list">
      {hotels.map((hotel) => (
        <HotelCard key={hotel.id} hotel={hotel} nights={nights} query={query} />
      ))}
    </div>
  );
}
