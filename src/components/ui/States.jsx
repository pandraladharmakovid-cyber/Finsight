import { AlertCircle, Inbox, Loader2, RefreshCw } from 'lucide-react';
import Button from './Button.jsx';

export function Skeleton({ height = 16, width = '100%', radius = 8, style }) {
  return (
    <div
      className="fs-skeleton"
      style={{ height, width, borderRadius: radius, ...style }}
    />
  );
}

export function CardSkeleton({ rows = 3 }) {
  return (
    <div className="fs-card fs-card-pad">
      <Skeleton height={12} width="42%" />
      <div className="fs-mt-16 fs-col fs-gap-10">
        {Array.from({ length: rows }).map((_, index) => (
          <Skeleton key={index} height={10} width={`${88 - index * 12}%`} />
        ))}
      </div>
    </div>
  );
}

export function PageLoader({ label = 'Loading workspace' }) {
  return (
    <div
      className="fs-col fs-center"
      style={{ alignItems: 'center', justifyContent: 'center', padding: '90px 0', gap: 14 }}
    >
      <Loader2 size={26} className="fs-spin" style={{ color: 'var(--violet-soft)' }} />
      <p className="fs-sm fs-dim">{label}…</p>
    </div>
  );
}

export function EmptyState({ icon: Icon = Inbox, title, message, action }) {
  return (
    <div className="fs-empty">
      <span className="fs-empty-icon">
        <Icon size={26} />
      </span>
      <h3>{title}</h3>
      {message && <p>{message}</p>}
      {action && <div className="fs-mt-8">{action}</div>}
    </div>
  );
}

export function ErrorState({ error, onRetry, title = 'Could not load this data' }) {
  return (
    <div className="fs-error-box">
      <AlertCircle size={18} style={{ flex: '0 0 18px', marginTop: 1 }} />
      <div style={{ flex: 1 }}>
        <strong style={{ display: 'block', fontSize: 13.5 }}>{title}</strong>
        <span className="fs-sm" style={{ opacity: 0.85 }}>
          {error?.message || 'An unexpected error occurred.'}
        </span>
        {onRetry && (
          <div className="fs-mt-12">
            <Button size="sm" icon={RefreshCw} onClick={onRetry}>
              Try again
            </Button>
          </div>
        )}
      </div>
    </div>
  );
}

/** Wraps a useResource result with loading / error handling. */
export function Resource({
  state,
  children,
  loadingFallback,
  emptyCheck,
  emptyState,
}) {
  if (state.loading) {
    return loadingFallback ?? <PageLoader />;
  }

  if (state.error) {
    return <ErrorState error={state.error} onRetry={state.reload} />;
  }

  const data = state.data;

  if (emptyCheck && emptyCheck(data)) {
    return emptyState ?? null;
  }

  return children(data);
}
