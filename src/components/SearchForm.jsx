import { useState } from 'react';
import FormField from './FormField';
import { addDaysISO, todayISO } from '../utils/format';
import { MAX_GUESTS, hasErrors, validateSearch } from '../utils/validation';

const GUEST_OPTIONS = Array.from({ length: MAX_GUESTS }, (_, index) => index + 1);

export default function SearchForm({ initialValues, destinations = [], onSearch }) {
  const [values, setValues] = useState({
    destination: initialValues?.destination ?? '',
    checkIn: initialValues?.checkIn ?? '',
    checkOut: initialValues?.checkOut ?? '',
    guests: initialValues?.guests || '2',
  });
  const [errors, setErrors] = useState({});
  const today = todayISO();

  function handleChange(event) {
    const { name, value } = event.target;
    setValues((current) => {
      const next = { ...current, [name]: value };
      // Keep check-out after check-in so the user never has to fix it by hand.
      if (name === 'checkIn' && value && (!current.checkOut || current.checkOut <= value)) {
        next.checkOut = addDaysISO(value, 1);
      }
      return next;
    });
    setErrors((current) => ({ ...current, [name]: undefined, ...(name === 'checkIn' && { checkOut: undefined }) }));
  }

  function handleSubmit(event) {
    event.preventDefault();
    const found = validateSearch(values);
    setErrors(found);
    if (!hasErrors(found)) onSearch({ ...values, destination: values.destination.trim() });
  }

  const describe = (name) => (errors[name] ? { 'aria-invalid': true, 'aria-describedby': `${name}-error` } : {});

  return (
    <form className="search-form" onSubmit={handleSubmit} noValidate>
      <FormField id="destination" label="Where are you going?" error={errors.destination}>
        <input
          id="destination"
          name="destination"
          type="text"
          list="destination-options"
          placeholder="City or country"
          autoComplete="off"
          value={values.destination}
          onChange={handleChange}
          {...describe('destination')}
        />
        <datalist id="destination-options">
          {destinations.map((destination) => (
            <option key={destination} value={destination} />
          ))}
        </datalist>
      </FormField>

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

      <FormField id="guests" label="Guests" error={errors.guests}>
        <select id="guests" name="guests" value={values.guests} onChange={handleChange} {...describe('guests')}>
          {GUEST_OPTIONS.map((count) => (
            <option key={count} value={count}>
              {count} {count === 1 ? 'guest' : 'guests'}
            </option>
          ))}
        </select>
      </FormField>

      <button type="submit" className="button button--primary search-form-submit">
        Search hotels
      </button>
    </form>
  );
}
