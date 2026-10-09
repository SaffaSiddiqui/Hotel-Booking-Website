import { Component } from 'react';

// Catches unexpected render errors so the whole app never goes blank.
// (Error boundaries can only be written as classes.)
export default class ErrorBoundary extends Component {
  state = { hasError: false };

  static getDerivedStateFromError() {
    return { hasError: true };
  }

  componentDidCatch(error) {
    if (import.meta.env.DEV) console.error(error);
  }

  render() {
    if (!this.state.hasError) return this.props.children;
    return (
      <div className="container page">
        <div className="message message--error" role="alert">
          <h1 className="message-title">Something went wrong</h1>
          <p>An unexpected error occurred. Reload the page to continue.</p>
          <button type="button" className="button button--primary" onClick={() => window.location.assign('/')}>
            Back to home
          </button>
        </div>
      </div>
    );
  }
}
