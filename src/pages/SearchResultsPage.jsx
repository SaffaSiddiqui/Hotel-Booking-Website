import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import ErrorMessage from '../components/ErrorMessage';
import HotelList from '../components/HotelList';
import Loader from '../components/Loader';
import SearchForm from '../components/SearchForm';
import { useAsync } from '../hooks/useAsync';
import { searchHotels } from '../services/hotelService';
import { nightsBetween, pluralize } from '../utils/format';
import { readCriteria, toQueryString } from '../utils/searchParams';
import { hasErrors, validateSearch } from '../utils/validation';

export default function SearchResultsPage() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const criteria = readCriteria(searchParams);
  const query = toQueryString(criteria);
  const problems = validateSearch(criteria);
  const isValid = !hasErrors(problems);

  const { data: hotels, loading, error, retry } = useAsync(() => searchHotels(criteria), [query], isValid);
  const nights = nightsBetween(criteria.checkIn, criteria.checkOut);

  return (
    <div className="container page">
      <div className="results-search">
        <SearchForm key={query} initialValues={criteria} onSearch={(values) => navigate(`/hotels${toQueryString(values)}`)} />
      </div>

      {!isValid && (
        <ErrorMessage title="Complete your search to see hotels">
          <ul className="message-list">
            {Object.values(problems).map((problem) => (
              <li key={problem}>{problem}</li>
            ))}
          </ul>
          <Link to="/" className="button button--secondary">
            Back to home
          </Link>
        </ErrorMessage>
      )}

      {isValid && loading && <Loader label="Finding available hotels…" />}
      {isValid && error && <ErrorMessage message={error.message} onRetry={retry} />}

      {isValid && hotels && (
        <>
          <h1 className="results-title">
            {pluralize(hotels.length, 'hotel')} in {criteria.destination}
          </h1>
          <p className="results-meta">
            {pluralize(nights, 'night')} · {pluralize(Number(criteria.guests), 'guest')}
          </p>
          <HotelList hotels={hotels} nights={nights} query={query} />
        </>
      )}
    </div>
  );
}
