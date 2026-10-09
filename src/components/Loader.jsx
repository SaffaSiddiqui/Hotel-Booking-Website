export default function Loader({ label = 'Loading…' }) {
  return (
    <div className="loader" role="status">
      <span className="loader-spinner" aria-hidden="true" />
      <span>{label}</span>
    </div>
  );
}
