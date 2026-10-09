import { useEffect, useRef, useState } from 'react';
import { Link, Outlet, useLocation } from 'react-router-dom';
import BookingCheckModal from './BookingCheckModal';

export default function Layout() {
  const { pathname } = useLocation();
  const [bookingCheckOpen, setBookingCheckOpen] = useState(false);
  const bookingCheckButtonRef = useRef(null);

  useEffect(() => {
    window.scrollTo(0, 0);
  }, [pathname]);

  return (
    <>
      <a className="skip-link" href="#main">
        Skip to content
      </a>
      <header className="site-header">
        <div className="container site-header-inner">
          <Link to="/" className="brand">
            Staywise
          </Link>
          <p className="site-header-tagline">Hotels for every trip</p>
          <button
            ref={bookingCheckButtonRef}
            type="button"
            className="button button--secondary booking-check-trigger"
            aria-haspopup="dialog"
            aria-expanded={bookingCheckOpen}
            onClick={() => setBookingCheckOpen(true)}
          >
            Booking Check
          </button>
        </div>
      </header>
      {bookingCheckOpen && (
        <BookingCheckModal
          onClose={() => setBookingCheckOpen(false)}
          returnFocusRef={bookingCheckButtonRef}
        />
      )}
      <main id="main">
        <Outlet />
      </main>
      <footer className="site-footer">
        <div className="container">
          <p>© {new Date().getFullYear()} Staywise. Demo hotel booking app.</p>
        </div>
      </footer>
    </>
  );
}
