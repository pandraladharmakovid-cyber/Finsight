import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react';

/* ==========================================================================
   useResource — data fetching with loading / error / refresh
   ========================================================================== */

export function useResource(loader, deps = [], { immediate = true } = {}) {
  const [state, setState] = useState({
    data: null,
    loading: immediate,
    error: null,
  });

  const loaderRef = useRef(loader);
  loaderRef.current = loader;

  const mounted = useRef(true);
  const requestId = useRef(0);

  useEffect(() => {
    mounted.current = true;
    return () => {
      mounted.current = false;
    };
  }, []);

  const run = useCallback(async (showSpinner = true) => {
    const id = ++requestId.current;

    if (showSpinner) {
      setState((prev) => ({ ...prev, loading: true, error: null }));
    }

    try {
      const data = await loaderRef.current();

      if (mounted.current && id === requestId.current) {
        setState({ data, loading: false, error: null });
      }

      return data;
    } catch (error) {
      if (mounted.current && id === requestId.current) {
        setState({ data: null, loading: false, error });
      }
      return null;
    }
  }, []);

  useEffect(() => {
    run(true);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, deps);

  return {
    ...state,
    refresh: () => run(false),
    reload: () => run(true),
    setData: (updater) =>
      setState((prev) => ({
        ...prev,
        data:
          typeof updater === 'function' ? updater(prev.data) : updater,
      })),
  };
}

/* ==========================================================================
   useCountUp — animated numeric transitions
   ========================================================================== */

export function useCountUp(target, duration = 900) {
  const [value, setValue] = useState(0);
  const frame = useRef(null);
  const currentValue = useRef(0);

  useEffect(() => {
    const end = Number(target) || 0;
    const start = currentValue.current;
    const delta = end - start;

    if (Math.abs(delta) < 0.01 || duration <= 0) {
      setValue(end);
      currentValue.current = end;
      return undefined;
    }

    // Use the first frame's clock as the baseline. A frame timestamp can be
    // earlier than performance.now(), so mixing them can briefly show wildly
    // incorrect financial totals.
    let startedAt = null;

    const tick = (now) => {
      if (startedAt === null) startedAt = now;
      const progress = Math.max(0, Math.min((now - startedAt) / duration, 1));
      // easeOutExpo for a decisive, springy settle
      const eased =
        progress === 1 ? 1 : 1 - Math.pow(2, -10 * progress);
      const next = start + delta * eased;

      currentValue.current = next;
      setValue(next);

      if (progress < 1) {
        frame.current = requestAnimationFrame(tick);
      } else {
        frame.current = null;
      }
    };

    frame.current = requestAnimationFrame(tick);

    return () => {
      if (frame.current !== null) cancelAnimationFrame(frame.current);
      frame.current = null;
    };
  }, [target, duration]);

  return value;
}

/* ==========================================================================
   useMediaQuery
   ========================================================================== */

export function useMediaQuery(query) {
  const [matches, setMatches] = useState(() =>
    typeof window !== 'undefined' ? window.matchMedia(query).matches : false,
  );

  useEffect(() => {
    const mql = window.matchMedia(query);
    const handler = (event) => setMatches(event.matches);
    setMatches(mql.matches);
    mql.addEventListener('change', handler);
    return () => mql.removeEventListener('change', handler);
  }, [query]);

  return matches;
}

/* ==========================================================================
   useLocalStorage — persisted preferences
   ========================================================================== */

export function useLocalStorage(key, initial) {
  const [value, setValue] = useState(() => {
    try {
      const stored = window.localStorage.getItem(key);
      return stored === null ? initial : JSON.parse(stored);
    } catch {
      return initial;
    }
  });

  useEffect(() => {
    try {
      window.localStorage.setItem(key, JSON.stringify(value));
    } catch {
      /* storage may be unavailable — preferences simply won't persist */
    }
  }, [key, value]);

  return [value, setValue];
}

/* ==========================================================================
   Toast system
   ========================================================================== */

const ToastContext = createContext(null);

let toastSeq = 0;

export function ToastProvider({ children }) {
  const [toasts, setToasts] = useState([]);

  const dismiss = useCallback((id) => {
    setToasts((list) => list.filter((t) => t.id !== id));
  }, []);

  const push = useCallback(
    (toast) => {
      const id = ++toastSeq;
      const entry = {
        id,
        tone: 'info',
        life: 4200,
        ...(typeof toast === 'string' ? { title: toast } : toast),
      };

      setToasts((list) => [...list.slice(-3), entry]);
      window.setTimeout(() => dismiss(id), entry.life);

      return id;
    },
    [dismiss],
  );

  const api = useMemo(
    () => ({
      push,
      dismiss,
      success: (title, message) => push({ title, message, tone: 'success' }),
      error: (title, message) =>
        push({ title, message, tone: 'error', life: 6000 }),
      info: (title, message) => push({ title, message, tone: 'info' }),
      warn: (title, message) => push({ title, message, tone: 'warn' }),
    }),
    [push, dismiss],
  );

  return (
    <ToastContext.Provider value={api}>
      {children}
      <ToastViewport toasts={toasts} onDismiss={dismiss} />
    </ToastContext.Provider>
  );
}

function ToastViewport({ toasts, onDismiss }) {
  return (
    <div className="fs-toasts" role="region" aria-label="Notifications">
      {toasts.map((toast) => (
        <div
          key={toast.id}
          className="fs-toast"
          style={{
            '--toast-accent':
              toast.tone === 'success'
                ? 'var(--mint)'
                : toast.tone === 'error'
                  ? 'var(--rose)'
                  : toast.tone === 'warn'
                    ? 'var(--amber)'
                    : 'var(--violet)',
            '--toast-life': `${toast.life}ms`,
          }}
          role="status"
        >
          <span className="fs-toast-icon">
            {toast.tone === 'success'
              ? '✓'
              : toast.tone === 'error'
                ? '!'
                : toast.tone === 'warn'
                  ? '⚠'
                  : 'i'}
          </span>

          <div style={{ flex: 1, minWidth: 0 }}>
            <div className="fs-toast-title">{toast.title}</div>
            {toast.message ? (
              <div className="fs-toast-msg">{toast.message}</div>
            ) : null}
          </div>

          <button
            type="button"
            className="fs-btn fs-btn-ghost fs-btn-sm"
            onClick={() => onDismiss(toast.id)}
            aria-label="Dismiss notification"
            style={{ height: 22, padding: '0 6px' }}
          >
            ✕
          </button>
        </div>
      ))}
    </div>
  );
}

export function useToast() {
  const ctx = useContext(ToastContext);
  if (!ctx) {
    throw new Error('useToast must be used inside <ToastProvider>');
  }
  return ctx;
}

/* ==========================================================================
   useHotkeys
   ========================================================================== */

export function useHotkeys(bindings) {
  useEffect(() => {
    const handler = (event) => {
      const target = event.target;
      const typing =
        target &&
        (target.tagName === 'INPUT' ||
          target.tagName === 'TEXTAREA' ||
          target.tagName === 'SELECT' ||
          target.isContentEditable);

      for (const [combo, callback] of Object.entries(bindings)) {
        const parts = combo.toLowerCase().split('+');
        const key = parts[parts.length - 1];
        const needsMeta = parts.includes('mod') || parts.includes('meta');
        const needsShift = parts.includes('shift');

        const pressedKey = event.key.toLowerCase();

        const metaOk = needsMeta
          ? event.metaKey || event.ctrlKey
          : !(event.metaKey || event.ctrlKey);

        const shiftOk = needsShift ? event.shiftKey : true;

        if (pressedKey === key && metaOk && shiftOk) {
          if (typing && key !== 'k' && key !== 'escape') continue;
          event.preventDefault();
          callback(event);
          return;
        }
      }
    };

    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [bindings]);
}
