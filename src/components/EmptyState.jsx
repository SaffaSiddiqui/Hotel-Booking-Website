import { Link } from 'react-router-dom';

export default function EmptyState({ title, message, actionLabel, actionTo }) {
  return (
    <div className="message message--empty">
      <h2 className="message-title">{title}</h2>
      {message && <p>{message}</p>}
      {actionTo && (
        <Link to={actionTo} className="button button--primary">
          {actionLabel}
        </Link>
      )}
    </div>
  );
}
