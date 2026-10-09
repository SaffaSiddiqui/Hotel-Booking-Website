export default function ErrorMessage({ title = 'Something went wrong', message, onRetry, children }) {
  return (
    <div className="message message--error" role="alert">
      <h2 className="message-title">{title}</h2>
      {message && <p>{message}</p>}
      {children}
      {onRetry && (
        <button type="button" className="button button--secondary" onClick={onRetry}>
          Try again
        </button>
      )}
    </div>
  );
}
