import { Link, useParams } from 'react-router-dom';
import EmptyState from '../components/EmptyState';
import ErrorMessage from '../components/ErrorMessage';
import HotelImage from '../components/HotelImage';
import Loader from '../components/Loader';
import StaySummary from '../components/StaySummary';
import { useAsync } from '../hooks/useAsync';
import { getBooking } from '../services/bookingService';
import { formatReference } from '../utils/format';

const STATUS_TITLES = {
  confirmed: 'Your booking is confirmed',
  pending: 'Your booking is pending',
  cancelled: 'This booking was cancelled',
};

export default function ConfirmationPage() {
  const { bookingId } = useParams();
  const { data: booking, loading, error, retry } = useAsync(() => getBooking(bookingId), [bookingId]);

  if (loading) return <div className="container page"><Loader label="Loading your booking…" /></div>;
  if (error) return <div className="container page"><ErrorMessage message={error.message} onRetry={retry} /></div>;
  if (!booking) {
    return (
      <div className="container page">
        <EmptyState title="Booking not found" message="We could not find a booking with this reference." actionLabel="Search hotels" actionTo="/" />
      </div>
    );
  }

  return (
    <div className="container page confirmation">
      <div className={`confirmation-banner confirmation-banner--${booking.status}`}>
        <h1>{STATUS_TITLES[booking.status] ?? 'Booking details'}</h1>
        <p>
          Booking reference: <strong>{formatReference(booking.id)}</strong>
        </p>
      </div>

      <div className="confirmation-body">
        <HotelImage src={booking.hotel_image} alt={booking.hotel_name} className="confirmation-image" />
        <div>
          <h2>{booking.hotel_name}</h2>
          <p className="details-location">{booking.hotel_location}</p>
          <StaySummary checkIn={booking.check_in} checkOut={booking.check_out} guests={booking.guests} pricePerNight={booking.hotel_price} />
          <h3>Guest</h3>
          <p>
            {booking.guest_name}
            <br />
            {booking.guest_email}
          </p>
        </div>
      </div>

      <Link to="/" className="button button--primary">
        Book another stay
      </Link>
    </div>
  );
}
