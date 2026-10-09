// Turns raw Supabase/network errors into friendly errors.
// Technical details are logged in development only and never shown to the user.
export function toServiceError(error, fallbackMessage) {
  if (import.meta.env.DEV) console.error(error);

  const offline = typeof navigator !== 'undefined' && navigator.onLine === false;
  const networkFailure = /failed to fetch|networkerror|load failed/i.test(error?.message ?? '');
  const message =
    offline || networkFailure
      ? 'Could not reach the server. Check your internet connection and try again.'
      : fallbackMessage;

  const friendly = new Error(message);
  friendly.cause = error;
  return friendly;
}
