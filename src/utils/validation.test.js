import { describe, expect, it } from 'vitest';
import { hasErrors, validateBooking, validateContact, validateSearch } from './validation';

const today = '2030-06-10';
const valid = { destination: 'Paris', checkIn: '2030-06-12', checkOut: '2030-06-15', guests: '2' };

describe('validateSearch', () => {
  it('accepts valid input', () => {
    expect(hasErrors(validateSearch(valid, today))).toBe(false);
  });

  it('requires every field', () => {
    const errors = validateSearch({ destination: ' ', checkIn: '', checkOut: '', guests: '' }, today);
    expect(Object.keys(errors).sort()).toEqual(['checkIn', 'checkOut', 'destination', 'guests']);
  });

  it('rejects past check-in dates', () => {
    expect(validateSearch({ ...valid, checkIn: '2030-06-01' }, today).checkIn).toMatch(/past/);
  });

  it('rejects check-out on or before check-in', () => {
    expect(validateSearch({ ...valid, checkOut: '2030-06-12' }, today).checkOut).toMatch(/after/);
    expect(validateSearch({ ...valid, checkOut: '2030-06-11' }, today).checkOut).toMatch(/after/);
  });

  it('rejects stays longer than 30 nights', () => {
    expect(validateSearch({ ...valid, checkOut: '2030-08-20' }, today).checkOut).toMatch(/nights/);
  });

  it('rejects invalid guest counts', () => {
    expect(validateSearch({ ...valid, guests: '0' }, today).guests).toBeDefined();
    expect(validateSearch({ ...valid, guests: '2.5' }, today).guests).toBeDefined();
    expect(validateSearch({ ...valid, guests: '99' }, today).guests).toBeDefined();
  });
});

describe('validateBooking', () => {
  const stay = { checkIn: valid.checkIn, checkOut: valid.checkOut, guests: '2' };
  const hotel = { guest_capacity: 3 };

  it('accepts a complete booking', () => {
    expect(hasErrors(validateBooking({ name: 'Ada Lovelace', email: 'ada@example.com', ...stay }, hotel, today))).toBe(false);
  });

  it('requires name and a valid email', () => {
    const errors = validateBooking({ name: '', email: 'not-an-email', ...stay }, hotel, today);
    expect(errors.name).toBeDefined();
    expect(errors.email).toMatch(/valid/);
  });

  it('rejects more guests than the hotel capacity', () => {
    const errors = validateBooking({ name: 'Ada', email: 'ada@example.com', ...stay, guests: '4' }, hotel, today);
    expect(errors.guests).toMatch(/up to 3/);
  });
});

describe('validateContact', () => {
  it('requires a name and a valid email address', () => {
    expect(validateContact({ name: ' ', email: '' })).toEqual({
      name: 'Enter your full name.',
      email: 'Enter your email address.',
    });
    expect(validateContact({ name: 'Ada Lovelace', email: 'not-an-email' }).email).toMatch(/valid/);
  });
});
