import { useEffect, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import { getBookingsByUser } from '../services/bookingService';
import { formatDate, formatPrice, formatReference, nightsBetween } from '../utils/format';
import { validateContact } from '../utils/validation';
import ErrorMessage from './ErrorMessage';
import FormField from './FormField';
import Loader from './Loader';

function ReferenceId({ id, copied, onCopy, onClose }) {
  return (
    <p className="booking-check-reference">
      <span>Booking reference: </span>
      <strong>{formatReference(id)}</strong>
      <button
        type="button"
        className="button button--secondary booking-check-copy"
        onClick={() => onCopy(id)}
      >
        {copied ? 'Copied' : 'Copy'}
      </button>
      <Link to={`/confirmation/${id}`} onClick={onClose}>
        View booking
      </Link>
    </p>
  );
}

export default function BookingCheckModal({ onClose, returnFocusRef }) {
  const [values, setValues] = useState({ name: '', email: '' });
  const [errors, setErrors] = useState({});
  const [bookings, setBookings] = useState(null);
  const [checking, setChecking] = useState(false);
  const [requestError, setRequestError] = useState('');
  const [copiedId, setCopiedId] = useState('');
  const [copyError, setCopyError] = useState('');
  const firstInputRef = useRef(null);

  useEffect(() => {
    const returnFocusElement = returnFocusRef.current;
    firstInputRef.current?.focus();
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';

    return () => {
      document.body.style.overflow = previousOverflow;
      returnFocusElement?.focus();
    };
  }, [returnFocusRef]);

  function handleChange(event) {
    const { name, value } = event.target;
    setValues((current) => ({ ...current, [name]: value }));
    setErrors((current) => ({ ...current, [name]: undefined }));
    setBookings(null);
    setRequestError('');
    setCopiedId('');
    setCopyError('');
  }

  async function checkBookings(credentials) {
    setChecking(true);
    setRequestError('');
    setBookings(null);

    try {
      const results = await getBookingsByUser(credentials);
      setBookings(results);
    } catch (error) {
      setRequestError(error.message);
    } finally {
      setChecking(false);
    }
  }

  function handleSubmit(event) {
    event.preventDefault();
    if (checking) return;

    const foundErrors = validateContact(values);
    setErrors(foundErrors);
    if (Object.keys(foundErrors).length === 0) {
      checkBookings(values);
    }
  }

  function handleKeyDown(event) {
    if (event.key === 'Escape') {
      onClose();
      return;
    }
    if (event.key !== 'Tab') return;

    const focusable = event.currentTarget.querySelectorAll(
      'button:not(:disabled), input:not(:disabled), a[href], [tabindex]:not([tabindex="-1"])',
    );
    const first = focusable[0];
    const last = focusable[focusable.length - 1];

    if (event.shiftKey && (document.activeElement === first || document.activeElement === firstInputRef.current)) {
      event.preventDefault();
      last?.focus();
    } else if (!event.shiftKey && document.activeElement === last) {
      event.preventDefault();
      first?.focus();
    }
  }

  async function copyReference(id) {
    try {
      await navigator.clipboard.writeText(formatReference(id));
      setCopiedId(id);
    } catch {
      setCopyError('We could not copy the booking reference. Please select and copy it instead.');
    }
  }

  return (
    <div
      className="booking-check-backdrop"
      onMouseDown={(event) => {
        if (event.target === event.currentTarget) onClose();
      }}
    >
      <section
        className="booking-check-dialog"
        role="dialog"
        aria-modal="true"
        aria-labelledby="booking-check-title"
        onKeyDown={handleKeyDown}
      >
        <div className="booking-check-heading">
          <h2 id="booking-check-title">Booking Check</h2>
          <button
            type="button"
            className="booking-check-close"
            aria-label="Close booking check"
            onClick={onClose}
          >
            ×
          </button>
        </div>

        <form className="booking-check-form" onSubmit={handleSubmit} noValidate>
          <FormField id="booking-check-name" label="Full name" error={errors.name}>
            <input
              ref={firstInputRef}
              id="booking-check-name"
              name="name"
              type="text"
              autoComplete="name"
              value={values.name}
              onChange={handleChange}
              disabled={checking}
              aria-invalid={Boolean(errors.name)}
              aria-describedby={errors.name ? 'booking-check-name-error' : undefined}
            />
          </FormField>
          <FormField id="booking-check-email" label="Email address" error={errors.email}>
            <input
              id="booking-check-email"
              name="email"
              type="email"
              autoComplete="email"
              value={values.email}
              onChange={handleChange}
              disabled={checking}
              aria-invalid={Boolean(errors.email)}
              aria-describedby={errors.email ? 'booking-check-email-error' : undefined}
            />
          </FormField>
          <button type="submit" className="button button--primary button--block" disabled={checking}>
            Check
          </button>
        </form>

        {checking && <Loader label="Checking your bookings…" />}
        {requestError && (
          <ErrorMessage message={requestError} onRetry={() => checkBookings(values)} />
        )}
        {bookings && bookings.length === 0 && (
          <p className="booking-check-empty" role="status">
            No bookings found for this name and email.
          </p>
        )}
        {bookings && bookings.length > 0 && (
          <div className="booking-check-results" aria-live="polite">
            <h3>Your bookings</h3>
            {copyError && <p className="field-error" role="status">{copyError}</p>}
            <ul className="booking-check-list">
              {bookings.map((booking) => {
                const total = nightsBetween(booking.check_in, booking.check_out) * Number(booking.hotel_price);
                return (
                  <li className="booking-check-item" key={booking.id}>
                    <ReferenceId
                      id={booking.id}
                      copied={copiedId === booking.id}
                      onCopy={copyReference}
                      onClose={onClose}
                    />
                    <h4>{booking.hotel_name}</h4>
                    <p>{booking.hotel_location}</p>
                    <dl className="booking-check-details">
                      <div><dt>Check-in</dt><dd>{formatDate(booking.check_in)}</dd></div>
                      <div><dt>Check-out</dt><dd>{formatDate(booking.check_out)}</dd></div>
                      <div><dt>Guests</dt><dd>{booking.guests}</dd></div>
                      <div><dt>Status</dt><dd>{booking.status}</dd></div>
                      <div><dt>Total price</dt><dd>{formatPrice(total)}</dd></div>
                    </dl>
                  </li>
                );
              })}
            </ul>
          </div>
        )}
      </section>
    </div>
  );
}
