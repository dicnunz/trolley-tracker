import { Component } from 'react';

export default class ErrorBoundary extends Component {
  constructor(props) {
    super(props);
    this.state = { error: null };
  }

  static getDerivedStateFromError(error) {
    return { error };
  }

  componentDidCatch(error, info) {
    console.error('Error captured by ErrorBoundary', error, info);
  }

  handleReset = () => {
    this.setState({ error: null });
  };

  render() {
    const { error } = this.state;
    const { fallback, children } = this.props;
    if (error) {
      if (fallback) return fallback({ error, reset: this.handleReset });
      return (
        <div className="rounded-lg border border-rose-200 bg-rose-50 p-4 text-sm text-rose-800" role="alert">
          <p className="font-semibold">Something went wrong rendering this section.</p>
          <p className="mt-1 break-words">{error.message}</p>
          <button
            type="button"
            onClick={this.handleReset}
            className="mt-3 inline-flex h-12 items-center justify-center rounded-md bg-rose-600 px-4 font-medium text-white shadow-sm focus:outline-none focus-visible:ring focus-visible:ring-rose-500/60"
          >
            Try again
          </button>
        </div>
      );
    }
    return children;
  }
}
