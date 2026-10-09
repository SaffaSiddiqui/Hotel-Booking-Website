import { Link } from 'react-router-dom';
import HotelImage from './HotelImage';
import { formatPrice, pluralize } from '../utils/format';

export default function HotelCard({ hotel, nights, query }) {
  const roomsLeft = hotel.rooms_left ?? hotel.available_rooms;

  return (
    <article className="hotel-card">
      <HotelImage src={hotel.image} alt={hotel.name} className="hotel-card-image" />

      <div className="hotel-card-body">
        <h2 className="hotel-card-name">
          <Link to={`/hotels/${hotel.id}${query}`}>{hotel.name}</Link>
        </h2>
        <p className="hotel-card-location">{hotel.location}</p>
        <p className="hotel-card-description">{hotel.description}</p>
        <ul className="tag-list">
          <li className="tag">Up to {pluralize(hotel.guest_capacity, 'guest')}</li>
          {roomsLeft <= 3 && <li className="tag tag--alert">Only {pluralize(roomsLeft, 'room')} left</li>}
        </ul>
      </div>

      <div className="hotel-card-price">
        <p className="price">
          {formatPrice(hotel.price)} <span>per night</span>
        </p>
        {nights > 0 && (
          <p className="price-total">
            {formatPrice(hotel.price * nights)} for {pluralize(nights, 'night')}
          </p>
        )}
        <Link to={`/hotels/${hotel.id}${query}`} className="button button--primary">
          View details
        </Link>
      </div>
    </article>
  );
}
