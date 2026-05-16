import { Component } from "react";

export default class ErrorBoundary extends Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, info) {
    console.error("UI error:", error, info);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="mx-auto max-w-lg px-4 py-20 text-center">
          <h1 className="font-display text-2xl font-bold text-brand-green">Something went wrong</h1>
          <p className="mt-2 text-slate-600 dark:text-slate-300">Please refresh the page or try again later.</p>
          {import.meta.env.DEV && this.state.error && (
            <pre className="mt-6 max-h-48 overflow-auto rounded-lg bg-slate-100 p-3 text-left text-xs text-red-800 dark:bg-slate-900 dark:text-red-200">
              {String(this.state.error)}
            </pre>
          )}
        </div>
      );
    }
    return this.props.children;
  }
}
