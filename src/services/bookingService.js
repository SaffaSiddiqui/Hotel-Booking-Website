import { supabase } from '../lib/supabaseClient';
import { toServiceError } from '../lib/serviceError';

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

// Messages for the error codes raised by the create_booking SQL function.
const BOOKING_ERRORS = {
  HOTEL_UNAVAILABLE: 'Sorry, this hotel just sold out for your dates. Try different dates or another hotel.',
  CAPACITY_EXCEEDED: 'This hotel cannot host that many guests in one booking.',
  HOTEL_NOT_FOUND: 'This hotel is no longer available.',
  INVALID_DATES: 'Your dates are not valid. Check-in must be today or later, and check-out must be after check-in.',
  INVALID_GUESTS: 'Enter a valid number of guests.',
  INVALID_NAME: 'Enter a valid name.',
  INVALID_EMAIL: 'Enter a valid email address.',
};

// Saves the booking in Supabase and returns the new booking id.
// The database re-checks availability and inserts atomically.
export async function createBooking({ hotelId, name, email, checkIn, checkOut, guests }) {
  const { data, error } = await supabase.rpc('create_booking', {
    p_name: name.trim(),
    p_email: email.trim(),
    p_hotel_id: hotelId,
    p_check_in: checkIn,
    p_check_out: checkOut,
    p_guests: Number(guests),
  });

  if (error) {
    const known = Object.keys(BOOKING_ERRORS).find((code) => error.message?.includes(code));
    if (known) {
      const bookingError = new Error(BOOKING_ERRORS[known]);
      bookingError.code = known;
      throw bookingError;
    }
    throw toServiceError(error, 'We could not complete your booking. Please try again.');
  }
  return data;
}

// Returns null when the booking does not exist (or the id is malformed).
export async function getBooking(bookingId) {
  if (!UUID.test(bookingId)) return null;

  const { data, error } = await supabase.rpc('get_booking', { p_booking_id: bookingId });
  if (error) throw toServiceError(error, 'We could not load your booking. Please try again.');
  return data?.[0] ?? null;
}

// Looks up a user's bookings without granting direct table access.
export async function getBookingsByUser({ name, email }) {
  const { data, error } = await supabase.rpc('get_bookings_by_user', {
    p_name: name.trim(),
    p_email: email.trim(),
  });

  if (error) {
    throw toServiceError(error, 'We could not check your bookings. Please try again.');
  }
  return data ?? [];
}
