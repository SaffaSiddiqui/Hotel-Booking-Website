import { useState } from 'react';
import FormField from './FormField';
import StaySummary from './StaySummary';
import { addDaysISO, todayISO } from '../utils/format';
import { MAX_GUESTS, hasErrors, validateBooking } from '../utils/validation';

export default function BookingForm({ hotel, initialStay, onSubmit, submitting, submitError }) {
  const maxGuests = Math.min(MAX_GUESTS, hotel.guest_capacity);
  const guestOptions = Array.from({ length: maxGuests }, (_, index) => index + 1);

  const [values, setValues] = useState({
    name: '',
    email: '',
    checkIn: initialStay.checkIn,
    checkOut: initialStay.checkOut,
    guests: String(Math.min(Number(initialStay.guests) || 2, maxGuests)),
  });
  const [errors, setErrors] = useState({});
  const today = todayISO();

  function handleChange(event) {
    const { name, value } = event.target;
    setValues((current) => {
      const next = { ...current, [name]: value };
      if (name === 'checkIn' && value && (!current.checkOut || current.checkOut <= value)) {
        next.checkOut = addDaysISO(value, 1);
      }
      return next;
    });
    setErrors((current) => ({ ...current, [name]: undefined, ...(name === 'checkIn' && { checkOut: undefined }) }));
  }

  function handleSubmit(event) {
    event.preventDefault();
    if (submitting) return;
    const found = validateBooking(values, hotel);
    setErrors(found);
    if (!hasErrors(found)) onSubmit(values);
  }

  const describe = (name) => (errors[name] ? { 'aria-invalid': true, 'aria-describedby': `${name}-error` } : {});

  return (
    <form className="booking-form" onSubmit={handleSubmit} noValidate>
      <fieldset disabled={submitting}>
        <legend>Your details</legend>
        <FormField id="name" label="Full name" error={errors.name}>
          <input id="name" name="name" type="text" autoComplete="name" value={values.name} onChange={handleChange} {...describe('name')} />
        </FormField>
        <FormField id="email" label="Email address" error={errors.email} hint="We use this to identify your booking.">
          <input id="email" name="email" type="email" autoComplete="email" value={values.email} onChange={handleChange} {...describe('email')} />
        </FormField>
      </fieldset>

      <fieldset disabled={submitting}>
        <legend>Your stay</legend>
        <div className="booking-form-row">
          <FormField id="checkIn" label="Check-in" error={errors.checkIn}>
            <input id="checkIn" name="checkIn" type="date" min={today} value={values.checkIn} onChange={handleChange} {...describe('checkIn')} />
          </FormField>
          <FormField id="checkOut" label="Check-out" error={errors.checkOut}>
            <input
              id="checkOut"
              name="checkOut"
              type="date"
              min={addDaysISO(values.checkIn || today, 1)}
              value={values.checkOut}
              onChange={handleChange}
              {...describe('checkOut')}
            />
          </FormField>
        </div>
        <FormField id="guests" label="Guests" error={errors.guests} hint={`Up to ${hotel.guest_capacity} guests at this hotel.`}>
          <select id="guests" name="guests" value={values.guests} onChange={handleChange} {...describe('guests')}>
            {guestOptions.map((count) => (
              <option key={count} value={count}>
                {count} {count === 1 ? 'guest' : 'guests'}
              </option>
            ))}
          </select>
        </FormField>
      </fieldset>

      <StaySummary checkIn={values.checkIn} checkOut={values.checkOut} guests={values.guests} pricePerNight={hotel.price} />

      {submitError && (
        <p className="form-error" role="alert">
          {submitError}
        </p>
      )}

      <button type="submit" className="button button--primary button--block" disabled={submitting}>
        {submitting ? 'Confirming your booking…' : 'Confirm booking'}
      </button>
    </form>
  );
}
