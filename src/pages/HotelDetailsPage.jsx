import { Link, useParams, useSearchParams } from 'react-router-dom';
import EmptyState from '../components/EmptyState';
import ErrorMessage from '../components/ErrorMessage';
import HotelImage from '../components/HotelImage';
import Loader from '../components/Loader';
import StaySummary from '../components/StaySummary';
import { useAsync } from '../hooks/useAsync';
import { getHotel } from '../services/hotelService';
import { formatPrice, pluralize } from '../utils/format';
import { readCriteria, toQueryString } from '../utils/searchParams';
import { hasErrors, validateSearch, validateStay } from '../utils/validation';

export default function HotelDetailsPage() {
  const { hotelId } = useParams();
  const [searchParams] = useSearchParams();
  const criteria = readCriteria(searchParams);
  const query = toQueryString(criteria);

  const stayProblems = validateStay(criteria);
  const hasDates = !stayProblems.checkIn && !stayProblems.checkOut;
  const backTo = hasErrors(validateSearch(criteria)) ? '/' : `/hotels${query}`;

  const { data: hotel, loading, error, retry } = useAsync(
    () => getHotel(hotelId, hasDates ? criteria.checkIn : null, hasDates ? criteria.checkOut : null),
    [hotelId, query],
  );

  if (loading) return <div className="container page"><Loader label="Loading hotel…" /></div>;
  if (error) return <div className="container page"><ErrorMessage message={error.message} onRetry={retry} /></div>;
  if (!hotel) {
    return (
      <div className="container page">
        <EmptyState title="Hotel not found" message="This hotel does not exist or is no longer listed." actionLabel="Search hotels" actionTo="/" />
      </div>
    );
  }

  const soldOut = hasDates && hotel.rooms_left < 1;
  const tooManyGuests = !stayProblems.guests && Number(criteria.guests) > hotel.guest_capacity;
  const canBook = !soldOut && !tooManyGuests;

  return (
    <div className="container page">
      <Link to={backTo} className="back-link">
        ← Back to results
      </Link>

      <div className="details">
        <HotelImage src={hotel.image} alt={hotel.name} className="details-image" />

        <div className="details-main">
          <h1>{hotel.name}</h1>
          <p className="details-location">{hotel.location}</p>
          <p className="details-description">{hotel.description}</p>

          <ul className="facts">
            <li>
              <span>Price</span>
              <strong>{formatPrice(hotel.price)} per night</strong>
            </li>
            <li>
              <span>Guest capacity</span>
              <strong>Up to {pluralize(hotel.guest_capacity, 'guest')}</strong>
            </li>
            <li>
              <span>{hasDates ? 'Rooms left for your dates' : 'Available rooms'}</span>
              <strong>{hasDates ? Math.max(hotel.rooms_left, 0) : hotel.available_rooms}</strong>
            </li>
          </ul>
        </div>

        <aside className="details-booking" aria-label="Booking">
          <h2>Your stay</h2>
          {hasDates ? (
            <StaySummary checkIn={criteria.checkIn} checkOut={criteria.checkOut} guests={criteria.guests} pricePerNight={hotel.price} />
          ) : (
            <p>Pick your dates in the next step to see the total price.</p>
          )}

          {soldOut && <p className="form-error">This hotel is fully booked for your dates.</p>}
          {tooManyGuests && <p className="form-error">This hotel accepts up to {hotel.guest_capacity} guests per booking.</p>}

          {canBook ? (
            <Link to={`/booking/${hotel.id}${query}`} className="button button--primary button--block">
              Book this hotel
            </Link>
          ) : (
            <Link to={backTo} className="button button--secondary button--block">
              See other hotels
            </Link>
          )}
        </aside>
      </div>
    </div>
  );
}
