import { useCallback, useEffect, useState } from 'react';

// Runs an async function and tracks { data, loading, error }.
// Re-runs when `deps` change or `retry()` is called. Ignores stale responses.
export function useAsync(asyncFn, deps, enabled = true) {
  const [state, setState] = useState({ data: null, loading: enabled, error: null });
  const [attempt, setAttempt] = useState(0);

  useEffect(() => {
    if (!enabled) {
      setState({ data: null, loading: false, error: null });
      return undefined;
    }

    let active = true;
    setState((previous) => ({ ...previous, loading: true, error: null }));

    asyncFn()
      .then((data) => active && setState({ data, loading: false, error: null }))
      .catch((error) => active && setState({ data: null, loading: false, error }));

    return () => {
      active = false;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [...deps, attempt, enabled]);

  const retry = useCallback(() => setAttempt((count) => count + 1), []);
  return { ...state, retry };
}
