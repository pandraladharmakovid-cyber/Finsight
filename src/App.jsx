import { Component, Suspense, lazy } from 'react';
import {
  BrowserRouter,
  Navigate,
  Route,
  Routes,
} from 'react-router-dom';

import Shell from './components/layout/Shell.jsx';
import AuthGate from './components/AuthGate.jsx';
import { PageLoader } from './components/ui/States.jsx';

/* Pages are code-split so the first paint stays fast. */
const Dashboard = lazy(() => import('./pages/Dashboard.jsx'));
const Transactions = lazy(() => import('./pages/Transactions.jsx'));
const Accounts = lazy(() => import('./pages/Accounts.jsx'));
const Categories = lazy(() => import('./pages/Categories.jsx'));
const Budgets = lazy(() => import('./pages/Budgets.jsx'));
const Savings = lazy(() => import('./pages/Savings.jsx'));
const Debts = lazy(() => import('./pages/Debts.jsx'));
const Recurring = lazy(() => import('./pages/Recurring.jsx'));
const Analytics = lazy(() => import('./pages/Analytics.jsx'));
const AuditLog = lazy(() => import('./pages/AuditLog.jsx'));
const Settings = lazy(() => import('./pages/Settings.jsx'));

/* --------------------------------------------------------------------------
   Error boundary
   -------------------------------------------------------------------------- */

class ErrorBoundary extends Component {
  constructor(props) {
    super(props);
    this.state = { error: null };
  }

  static getDerivedStateFromError(error) {
    return { error };
  }

  componentDidCatch(error, info) {
    console.error('[FinSight] render error:', error, info);
  }

  render() {
    if (!this.state.error) return this.props.children;

    return (
      <div
        style={{
          minHeight: '100vh',
          display: 'grid',
          placeContent: 'center',
          padding: 24,
          textAlign: 'center',
          gap: 16,
        }}
      >
        <div className="fs-card fs-card-pad" style={{ maxWidth: 520 }}>
          <h1 style={{ fontSize: 20, marginBottom: 8 }}>
            Something interrupted the workspace
          </h1>
          <p className="fs-sm fs-dim" style={{ marginBottom: 18 }}>
            {this.state.error?.message || 'An unexpected rendering error occurred.'}
          </p>
          <button
            type="button"
            className="fs-btn fs-btn-primary"
            onClick={() => window.location.reload()}
          >
            Reload FinSight
          </button>
        </div>
      </div>
    );
  }
}

/* --------------------------------------------------------------------------
   Router
   -------------------------------------------------------------------------- */

export default function App() {
  return (
    <ErrorBoundary>
      <AuthGate>
        {({ onLogout }) => (
          <BrowserRouter>
            <Shell onLogout={onLogout}>
              <Suspense fallback={<PageLoader />}>
                <Routes>
              <Route path="/" element={<Navigate to="/dashboard" replace />} />
              <Route path="/dashboard" element={<Dashboard />} />
              <Route path="/transactions" element={<Transactions />} />
              <Route path="/accounts" element={<Accounts />} />
              <Route path="/categories" element={<Categories />} />
              <Route path="/budgets" element={<Budgets />} />
              <Route path="/savings" element={<Savings />} />
              <Route path="/debts" element={<Debts />} />
              <Route path="/recurring" element={<Recurring />} />
              <Route path="/analytics" element={<Analytics />} />
              <Route path="/audit" element={<AuditLog />} />
              <Route path="/settings" element={<Settings />} />
              <Route path="*" element={<Navigate to="/dashboard" replace />} />
                </Routes>
              </Suspense>
            </Shell>
          </BrowserRouter>
        )}
      </AuthGate>
    </ErrorBoundary>
  );
}
