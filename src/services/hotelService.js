import { supabase } from '../lib/supabaseClient';
import { toServiceError } from '../lib/serviceError';

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export async function searchHotels({ destination, checkIn, checkOut, guests }) {
  const { data, error } = await supabase.rpc('search_hotels', {
    p_destination: destination.trim(),
    p_check_in: checkIn,
    p_check_out: checkOut,
    p_guests: Number(guests),
  });
  if (error) throw toServiceError(error, 'We could not load hotels right now. Please try again.');
  return data ?? [];
}

// Returns null when the hotel does not exist (or the id is malformed).
export async function getHotel(hotelId, checkIn, checkOut) {
  if (!UUID.test(hotelId)) return null;

  const { data, error } = await supabase.rpc('get_hotel', {
    p_hotel_id: hotelId,
    p_check_in: checkIn || null,
    p_check_out: checkOut || null,
  });
  if (error) throw toServiceError(error, 'We could not load this hotel. Please try again.');
  return data?.[0] ?? null;
}

// Distinct destinations that exist in the database (used for search suggestions).
export async function getDestinations() {
  const { data, error } = await supabase.from('hotels').select('location').order('location');
  if (error) throw toServiceError(error, 'We could not load destinations.');
  return [...new Set(data.map((row) => row.location))];
}
