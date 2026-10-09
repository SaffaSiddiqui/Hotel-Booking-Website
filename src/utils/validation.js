import { nightsBetween, todayISO } from './format';

export const MAX_GUESTS = 10;
export const MAX_NIGHTS = 30;

const ISO_DATE = /^\d{4}-\d{2}-\d{2}$/;
const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

// Shared by the search form, the results page and the booking form.
// `today` is injectable so the function is easy to test.
export function validateStay({ checkIn, checkOut, guests }, today = todayISO()) {
  const errors = {};

  if (!checkIn) errors.checkIn = 'Choose a check-in date.';
  else if (!ISO_DATE.test(checkIn)) errors.checkIn = 'Check-in date is not valid.';
  else if (checkIn < today) errors.checkIn = 'Check-in date cannot be in the past.';

  if (!checkOut) errors.checkOut = 'Choose a check-out date.';
  else if (!ISO_DATE.test(checkOut)) errors.checkOut = 'Check-out date is not valid.';
  else if (!errors.checkIn && checkOut <= checkIn) {
    errors.checkOut = 'Check-out must be after check-in.';
  } else if (!errors.checkIn && nightsBetween(checkIn, checkOut) > MAX_NIGHTS) {
    errors.checkOut = `You can book up to ${MAX_NIGHTS} nights at a time.`;
  }

  const guestCount = Number(guests);
  if (!guests) errors.guests = 'Select the number of guests.';
  else if (!Number.isInteger(guestCount) || guestCount < 1 || guestCount > MAX_GUESTS) {
    errors.guests = `Guests must be between 1 and ${MAX_GUESTS}.`;
  }

  return errors;
}

export function validateSearch(values, today) {
  const errors = validateStay(values, today);
  if (!values.destination?.trim()) errors.destination = 'Enter a destination.';
  return errors;
}

export function validateContact({ name, email }) {
  const errors = {};
  if (!name?.trim()) errors.name = 'Enter your full name.';
  else if (name.trim().length > 100) errors.name = 'Name must be 100 characters or fewer.';

  if (!email?.trim()) errors.email = 'Enter your email address.';
  else if (!EMAIL.test(email.trim())) errors.email = 'Enter a valid email address.';

  return errors;
}

export function validateBooking({ name, email, ...stay }, hotel, today) {
  const errors = { ...validateStay(stay, today), ...validateContact({ name, email }) };

  if (!errors.guests && hotel && Number(stay.guests) > hotel.guest_capacity) {
    errors.guests = `This hotel accepts up to ${hotel.guest_capacity} guests per booking.`;
  }

  return errors;
}

export const hasErrors = (errors) => Object.keys(errors).length > 0;
