import { Component, type ErrorInfo, type ReactNode } from 'react';
import { ErrorScreen } from '@/components/ErrorScreen';

/**
 * Top-level error boundary. Catches render/lifecycle errors that occur OUTSIDE
 * the router (or in the router provider itself) and shows the recovery screen
 * instead of a blank white page. Route-render errors are handled separately by
 * the router's `errorElement` (see <RouteError>), because react-router
 * intercepts those before a React boundary can see them.
 */
interface Props {
  children: ReactNode;
}
interface State {
  hasError: boolean;
  error?: Error;
}

export class ErrorBoundary extends Component<Props, State> {
  state: State = { hasError: false };

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, info: ErrorInfo) {
    // Surface it for debugging; a real backend build would ship this to Sentry.
    console.error('[Crux8] Uncaught error:', error, info.componentStack);
  }

  render() {
    if (this.state.hasError) return <ErrorScreen error={this.state.error} />;
    return this.props.children;
  }
}
