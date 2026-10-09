// Label + control + inline error. The control is passed as children and should set
// aria-invalid / aria-describedby={`${id}-error`} when `error` is present.
export default function FormField({ id, label, error, hint, children }) {
  return (
    <div className={`field${error ? ' field--error' : ''}`}>
      <label htmlFor={id}>{label}</label>
      {children}
      {hint && !error && <p className="field-hint">{hint}</p>}
      {error && (
        <p className="field-error" id={`${id}-error`} role="alert">
          {error}
        </p>
      )}
    </div>
  );
}
