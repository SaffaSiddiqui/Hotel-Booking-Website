import { useNavigate } from 'react-router-dom';
import SearchForm from '../components/SearchForm';
import { useAsync } from '../hooks/useAsync';
import { getDestinations } from '../services/hotelService';
import { toQueryString } from '../utils/searchParams';

export default function HomePage() {
  const navigate = useNavigate();
  // Suggestions are a nice-to-have: if they fail to load, the form still works.
  const { data: destinations } = useAsync(getDestinations, []);

  return (
    <>
      <section className="hero">
        <div className="container">
          <h1 className="hero-title">Find a room that fits your trip</h1>
          <p className="hero-subtitle">Compare hotels, check live availability and book in a few clicks.</p>
        </div>
      </section>
      <section className="container hero-search" aria-label="Search hotels">
        <SearchForm destinations={destinations ?? []} onSearch={(values) => navigate(`/hotels${toQueryString(values)}`)} />
      </section>
      {destinations?.length > 0 && (
        <section className="container page" aria-labelledby="destinations-heading">
          <h2 id="destinations-heading">Where can you stay?</h2>
          <ul className="destination-list">
            {destinations.map((destination) => (
              <li key={destination} className="tag">
                {destination}
              </li>
            ))}
          </ul>
        </section>
      )}
    </>
  );
}
