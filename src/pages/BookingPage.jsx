import { useRef, useState } from 'react';
import { Link, useNavigate, useParams, useSearchParams } from 'react-router-dom';
import BookingForm from '../components/BookingForm';
import EmptyState from '../components/EmptyState';
import ErrorMessage from '../components/ErrorMessage';
import HotelImage from '../components/HotelImage';
import Loader from '../components/Loader';
import { useAsync } from '../hooks/useAsync';
import { createBooking } from '../services/bookingService';
import { getHotel } from '../services/hotelService';
import { readCriteria, toQueryString } from '../utils/searchParams';
import { validateStay } from '../utils/validation';

export default function BookingPage() {
  const { hotelId } = useParams();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const criteria = readCriteria(searchParams);
  const query = toQueryString(criteria);

  const stayProblems = validateStay(criteria);
  const hasDates = !stayProblems.checkIn && !stayProblems.checkOut;

  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState('');
  const submittingRef = useRef(false); // blocks double submits even before state updates

  const { data: hotel, loading, error, retry } = useAsync(() => getHotel(hotelId), [hotelId]);

  async function handleSubmit(values) {
    if (submittingRef.current) return;
    submittingRef.current = true;
    setSubmitting(true);
    setSubmitError('');

    try {
      const bookingId = await createBooking({ hotelId, ...values });
      navigate(`/confirmation/${bookingId}`, { replace: true });
    } catch (bookingError) {
      setSubmitError(bookingError.message); // form values stay filled so the user can retry
      setSubmitting(false);
      submittingRef.current = false;
    }
  }

  if (loading) return <div className="container page"><Loader label="Loading booking form…" /></div>;
  if (error) return <div className="container page"><ErrorMessage message={error.message} onRetry={retry} /></div>;
  if (!hotel) {
    return (
      <div className="container page">
        <EmptyState title="Hotel not found" message="This hotel does not exist or is no longer listed." actionLabel="Search hotels" actionTo="/" />
      </div>
    );
  }

  return (
    <div className="container page">
      <Link to={`/hotels/${hotel.id}${query}`} className="back-link">
        ← Back to hotel
      </Link>
      <h1>Complete your booking</h1>

      <div className="booking-layout">
        <BookingForm
          hotel={hotel}
          initialStay={{ checkIn: hasDates ? criteria.checkIn : '', checkOut: hasDates ? criteria.checkOut : '', guests: criteria.guests }}
          onSubmit={handleSubmit}
          submitting={submitting}
          submitError={submitError}
        />

        <aside className="booking-hotel">
          <HotelImage src={hotel.image} alt={hotel.name} className="booking-hotel-image" />
          <h2>{hotel.name}</h2>
          <p>{hotel.location}</p>
        </aside>
      </div>
    </div>
  );
}
