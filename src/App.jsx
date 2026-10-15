import {
  Component,
  Suspense,
  lazy,
  useEffect,
  useMemo,
  useState,
} from 'react';

import {
  BrowserRouter,
  Navigate,
  Route,
  Routes,
  useLocation,
} from 'react-router-dom';

import AppLayout from './layouts/AppLayout.jsx';

/* ==========================================================================
   LAZY PAGE SYSTEM
   ==========================================================================

   FinSight is becoming a large application.

   Loading every page immediately would make the initial bundle unnecessarily
   large. Each major workspace is therefore loaded only when the user visits it.

   This gives us:
   - smaller initial bundle
   - faster first paint
   - better navigation performance
   - cleaner production architecture
   ========================================================================== */

const Dashboard = lazy(() =>
  import('./pages/Dashboard.jsx')
);

const Transactions = lazy(() =>
  import('./pages/Transactions.jsx')
);

const Accounts = lazy(() =>
  import('./pages/Accounts.jsx')
);

const Categories = lazy(() =>
  import('./pages/Categories.jsx')
);

const Budgets = lazy(() =>
  import('./pages/Budgets.jsx')
);

const Savings = lazy(() =>
  import('./pages/Savings.jsx')
);

const Debts = lazy(() =>
  import('./pages/Debts.jsx')
);

const RecurringTransactions = lazy(() =>
  import('./pages/RecurringTransactions.jsx')
);

const Analytics = lazy(() =>
  import('./pages/Analytics.jsx')
);

const AuditLog = lazy(() =>
  import('./pages/AuditLog.jsx')
);

const Settings = lazy(() =>
  import('./pages/Settings.jsx')
);

/* ==========================================================================
   PAGE METADATA
   ========================================================================== */

const PAGE_META = {
  '/dashboard': {
    title: 'Financial Command Center',
    eyebrow: 'Overview',
    description:
      'Your complete financial operating picture.',
  },

  '/transactions': {
    title: 'Transactions',
    eyebrow: 'Money Flow',
    description:
      'Track, filter and understand every transaction.',
  },

  '/accounts': {
    title: 'Accounts',
    eyebrow: 'Financial Infrastructure',
    description:
      'Manage your accounts and balances.',
  },

  '/categories': {
    title: 'Categories',
    eyebrow: 'Classification',
    description:
      'Organize the structure behind your spending.',
  },

  '/budgets': {
    title: 'Budgets',
    eyebrow: 'Planning',
    description:
      'Control spending before it becomes a problem.',
  },

  '/savings': {
    title: 'Savings Goals',
    eyebrow: 'Future Capital',
    description:
      'Build measurable progress toward your goals.',
  },

  '/debts': {
    title: 'Debt Management',
    eyebrow: 'Liability Intelligence',
    description:
      'Understand and reduce your financial obligations.',
  },

  '/recurring': {
    title: 'Recurring Transactions',
    eyebrow: 'Automation',
    description:
      'Keep recurring financial commitments visible.',
  },

  '/analytics': {
    title: 'Financial Analytics',
    eyebrow: 'Intelligence',
    description:
      'Discover patterns inside your financial data.',
  },

  '/audit': {
    title: 'Audit Log',
    eyebrow: 'System Intelligence',
    description:
      'Review important financial system activity.',
  },

  '/settings': {
    title: 'Settings',
    eyebrow: 'Configuration',
    description:
      'Configure your FinSight workspace.',
  },
};

/* ==========================================================================
   ERROR BOUNDARY
   ========================================================================== */

class FinSightErrorBoundary extends Component {
  constructor(props) {
    super(props);

    this.state = {
      hasError: false,
      error: null,
    };
  }

  static getDerivedStateFromError(error) {
    return {
      hasError: true,
      error,
    };
  }

  componentDidCatch(error, errorInfo) {
    /*
     * Keep production logging intentionally lightweight.
     * The backend audit system can later receive structured client errors.
     */
    console.error(
      '[FinSight] UI rendering error:',
      error,
      errorInfo
    );
  }

  handleReload = () => {
    window.location.reload();
  };

  handleHome = () => {
    window.location.href = '/dashboard';
  };

  render() {
    if (!this.state.hasError) {
      return this.props.children;
    }

    return (
      <div className="fs-critical-error">
        <div
          className="fs-critical-error-orb"
          aria-hidden="true"
        />

        <div className="fs-critical-error-card">
          <div className="fs-critical-error-icon">
            !
          </div>

          <span className="fs-critical-error-eyebrow">
            FINESIGHT SYSTEM
          </span>

          <h1>
            Something interrupted
            <br />
            the financial workspace.
          </h1>

          <p>
            FinSight encountered an unexpected interface
            error. Your database is not modified by this
            screen. You can safely reload the workspace.
          </p>

          <div className="fs-critical-error-actions">
            <button
              type="button"
              onClick={this.handleReload}
              className="fs-critical-error-primary"
            >
              Reload workspace
            </button>

            <button
              type="button"
              onClick={this.handleHome}
              className="fs-critical-error-secondary"
            >
              Return to dashboard
            </button>
          </div>

          {import.meta.env.DEV &&
            this.state.error && (
              <details className="fs-critical-error-debug">
                <summary>
                  Development diagnostics
                </summary>

                <pre>
                  {this.state.error.stack ||
                    this.state.error.message}
                </pre>
              </details>
            )}
        </div>
      </div>
    );
  }
}

/* ==========================================================================
   PAGE LOADER
   ========================================================================== */

function PageLoader() {
  return (
    <div
      className="fs-page-loader"
      role="status"
      aria-live="polite"
      aria-label="Loading FinSight workspace"
    >
      <div className="fs-page-loader-core">
        <div className="fs-loader-ring fs-loader-ring-one" />
        <div className="fs-loader-ring fs-loader-ring-two" />
        <div className="fs-loader-ring fs-loader-ring-three" />

        <div className="fs-loader-logo">
          F
        </div>
      </div>

      <div className="fs-page-loader-copy">
        <strong>FINESIGHT</strong>
        <span>Synchronizing workspace</span>
      </div>

      <div className="fs-page-loader-progress">
        <span />
      </div>
    </div>
  );
}

/* ==========================================================================
   DOCUMENT / ROUTE INTELLIGENCE
   ========================================================================== */

function RouteIntelligence() {
  const location = useLocation();

  const meta = useMemo(() => {
    return (
      PAGE_META[location.pathname] || {
        title: 'Financial Intelligence',
        eyebrow: 'FinSight',
        description:
          'Personal financial intelligence workspace.',
      }
    );
  }, [location.pathname]);

  useEffect(() => {
    document.title = `${meta.title} — FinSight`;

    document.documentElement.dataset.route =
      location.pathname;

    document.documentElement.dataset.page =
      meta.eyebrow
        .toLowerCase()
        .replace(/\s+/g, '-');

    /*
     * Always return the viewport to the top when changing
     * between workspaces.
     */
    window.scrollTo({
      top: 0,
      left: 0,
      behavior: 'instant',
    });

    /*
     * Announce navigation to assistive technology.
     */
    const announcer =
      document.getElementById(
        'finsight-route-announcer'
      );

    if (announcer) {
      announcer.textContent =
        `${meta.title}. ${meta.description}`;
    }
  }, [location.pathname, meta]);

  return null;
}

/* ==========================================================================
   ROUTE TRANSITION
   ========================================================================== */

function RouteTransition({ children }) {
  const location = useLocation();

  return (
    <div
      key={location.pathname}
      className="fs-route-transition"
    >
      <div
        className="fs-route-scanline"
        aria-hidden="true"
      />

      {children}
    </div>
  );
}

/* ==========================================================================
   GLOBAL POINTER EXPERIENCE
   ========================================================================== */

function GlobalPointerExperience() {
  const [finePointer, setFinePointer] =
    useState(false);

  useEffect(() => {
    const media = window.matchMedia(
      '(pointer: fine)'
    );

    const update = () => {
      setFinePointer(media.matches);
    };

    update();

    media.addEventListener?.(
      'change',
      update
    );

    return () => {
      media.removeEventListener?.(
        'change',
        update
      );
    };
  }, []);

  useEffect(() => {
    if (!finePointer) return;

    let frame = null;

    const handlePointerMove = (event) => {
      if (frame) {
        cancelAnimationFrame(frame);
      }

      frame = requestAnimationFrame(() => {
        document.documentElement.style.setProperty(
          '--fs-pointer-x',
          `${event.clientX}px`
        );

        document.documentElement.style.setProperty(
          '--fs-pointer-y',
          `${event.clientY}px`
        );
      });
    };

    window.addEventListener(
      'pointermove',
      handlePointerMove,
      {
        passive: true,
      }
    );

    return () => {
      window.removeEventListener(
        'pointermove',
        handlePointerMove
      );

      if (frame) {
        cancelAnimationFrame(frame);
      }
    };
  }, [finePointer]);

  if (!finePointer) {
    return null;
  }

  return (
    <>
      <div
        className="fs-pointer-aura"
        aria-hidden="true"
      />

      <div
        className="fs-pointer-core"
        aria-hidden="true"
      />
    </>
  );
}

/* ==========================================================================
   AMBIENT PARTICLES
   ========================================================================== */

function AmbientParticles() {
  const particles = useMemo(
    () =>
      Array.from(
        { length: 18 },
        (_, index) => index
      ),
    []
  );

  return (
    <div
      className="fs-ambient-particles"
      aria-hidden="true"
    >
      {particles.map((particle) => (
        <span
          key={particle}
          style={{
            '--particle-index': particle,
          }}
        />
      ))}
    </div>
  );
}

/* ==========================================================================
   GLOBAL EXPERIENCE
   ========================================================================== */

function FinSightExperience() {
  useEffect(() => {
    document.documentElement.classList.add(
      'fs-application-ready'
    );

    return () => {
      document.documentElement.classList.remove(
        'fs-application-ready'
      );
    };
  }, []);

  return (
    <>
      <RouteIntelligence />
      <GlobalPointerExperience />
      <AmbientParticles />

      <div
        id="finsight-route-announcer"
        className="fs-sr-only"
        aria-live="polite"
        aria-atomic="true"
      />

      <div
        className="fs-global-top-glow"
        aria-hidden="true"
      />

      <div
        className="fs-global-noise"
        aria-hidden="true"
      />
    </>
  );
}

/* ==========================================================================
   ROUTE HELPER
   ========================================================================== */

function WorkspaceRoute({
  Component: PageComponent,
}) {
  return (
    <RouteTransition>
      <Suspense fallback={<PageLoader />}>
        <PageComponent />
      </Suspense>
    </RouteTransition>
  );
}

/* ==========================================================================
   APPLICATION ROUTER
   ========================================================================== */

function ApplicationRouter() {
  return (
    <BrowserRouter>
      <FinSightExperience />

      <Routes>
        <Route
          path="/"
          element={<AppLayout />}
        >
          {/* ============================================================
              PRIMARY COMMAND CENTER
              ============================================================ */}

          <Route
            index
            element={
              <Navigate
                to="/dashboard"
                replace
              />
            }
          />

          <Route
            path="dashboard"
            element={
              <WorkspaceRoute
                Component={Dashboard}
              />
            }
          />

          {/* ============================================================
              MONEY MANAGEMENT
              ============================================================ */}

          <Route
            path="transactions"
            element={
              <WorkspaceRoute
                Component={Transactions}
              />
            }
          />

          <Route
            path="accounts"
            element={
              <WorkspaceRoute
                Component={Accounts}
              />
            }
          />

          <Route
            path="categories"
            element={
              <WorkspaceRoute
                Component={Categories}
              />
            }
          />

          {/* ============================================================
              FINANCIAL PLANNING
              ============================================================ */}

          <Route
            path="budgets"
            element={
              <WorkspaceRoute
                Component={Budgets}
              />
            }
          />

          <Route
            path="savings"
            element={
              <WorkspaceRoute
                Component={Savings}
              />
            }
          />

          <Route
            path="debts"
            element={
              <WorkspaceRoute
                Component={Debts}
              />
            }
          />

          <Route
            path="recurring"
            element={
              <WorkspaceRoute
                Component={
                  RecurringTransactions
                }
              />
            }
          />

          {/* ============================================================
              INTELLIGENCE
              ============================================================ */}

          <Route
            path="analytics"
            element={
              <WorkspaceRoute
                Component={Analytics}
              />
            }
          />

          <Route
            path="audit"
            element={
              <WorkspaceRoute
                Component={AuditLog}
              />
            }
          />

          {/* ============================================================
              SYSTEM
              ============================================================ */}

          <Route
            path="settings"
            element={
              <WorkspaceRoute
                Component={Settings}
              />
            }
          />

          {/* ============================================================
              FALLBACK
              ============================================================ */}

          <Route
            path="*"
            element={
              <Navigate
                to="/dashboard"
                replace
              />
            }
          />
        </Route>
      </Routes>
    </BrowserRouter>
  );
}

/* ==========================================================================
   ROOT APPLICATION
   ========================================================================== */

export default function App() {
  return (
    <FinSightErrorBoundary>
      <ApplicationRouter />
    </FinSightErrorBoundary>
  );
}