import { Component, type ErrorInfo, type ReactNode } from 'react';
import { AlertTriangle } from 'lucide-react';

interface Props {
  children: ReactNode;
  /** Shown above the error details — say what part of the app this is. */
  label?: string;
}

interface State {
  error: Error | null;
}

/** Catches render errors in whatever it wraps and shows the real error
 * message on-screen instead of leaving a silent blank page — this is what
 * would have shown "X is not defined" immediately instead of an empty div. */
export class ErrorBoundary extends Component<Props, State> {
  state: State = { error: null };

  static getDerivedStateFromError(error: Error): State {
    return { error };
  }

  componentDidCatch(error: Error, info: ErrorInfo) {
    console.error(`[ErrorBoundary${this.props.label ? ` — ${this.props.label}` : ''}]`, error, info.componentStack);
  }

  render() {
    if (this.state.error) {
      return (
        <div className="mx-auto my-10 max-w-lg rounded-2xl border border-red-500/30 bg-red-500/10 p-6 text-center">
          <AlertTriangle size={28} className="mx-auto text-red-400" />
          <h2 className="mt-3 text-lg font-bold text-white">Something broke{this.props.label ? ` in ${this.props.label}` : ''}</h2>
          <p className="mt-2 break-words text-sm text-red-300">{this.state.error.message}</p>
          <button
            type="button"
            onClick={() => this.setState({ error: null })}
            className="mt-4 rounded-full border border-white/20 px-4 py-2 text-sm font-semibold text-white hover:bg-white/10"
          >
            Try again
          </button>
        </div>
      );
    }
    return this.props.children;
  }
}