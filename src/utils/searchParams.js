// Search criteria travel through the URL so every page survives a refresh.
const KEYS = ['destination', 'checkIn', 'checkOut', 'guests'];

export function readCriteria(searchParams) {
  return {
    destination: searchParams.get('destination') ?? '',
    checkIn: searchParams.get('checkIn') ?? '',
    checkOut: searchParams.get('checkOut') ?? '',
    guests: searchParams.get('guests') ?? '',
  };
}

export function toQueryString(criteria) {
  const params = new URLSearchParams();
  KEYS.forEach((key) => {
    if (criteria[key]) params.set(key, String(criteria[key]).trim());
  });
  const query = params.toString();
  return query ? `?${query}` : '';
}
