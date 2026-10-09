import EmptyState from '../components/EmptyState';

export default function NotFoundPage() {
  return (
    <div className="container page">
      <EmptyState title="Page not found" message="The page you are looking for does not exist." actionLabel="Back to home" actionTo="/" />
    </div>
  );
}
