import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react';
import { NavLink, useLocation, useNavigate } from 'react-router-dom';
import {
  ArrowRightLeft,
  Activity,
  BarChart3,
  Bell,
  Command,
  CreditCard,
  FolderTree,
  History,
  LayoutDashboard,
  Menu,
  PiggyBank,
  Plus,
  Repeat2,
  Search,
  Settings2,
  Sparkles,
  Target,
  Wallet,
  X,
} from 'lucide-react';

import { useHotkeys } from '../../lib/hooks.jsx';

/* ==========================================================================
   NAVIGATION MODEL
   ========================================================================== */

export const NAV_SECTIONS = [
  {
    label: 'Overview',
    items: [
      { to: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
      { to: '/analytics', label: 'Analytics', icon: BarChart3 },
    ],
  },
  {
    label: 'Money',
    items: [
      { to: '/transactions', label: 'Transactions', icon: ArrowRightLeft },
      { to: '/accounts', label: 'Accounts', icon: Wallet },
      { to: '/categories', label: 'Categories', icon: FolderTree },
    ],
  },
  {
    label: 'Planning',
    items: [
      { to: '/budgets', label: 'Budgets', icon: Target },
      { to: '/savings', label: 'Savings', icon: PiggyBank },
      { to: '/debts', label: 'Debts', icon: CreditCard },
      { to: '/recurring', label: 'Recurring', icon: Repeat2 },
    ],
  },
  {
    label: 'System',
    items: [
      { to: '/audit', label: 'Audit Log', icon: History },
      { to: '/settings', label: 'Settings', icon: Settings2 },
    ],
  },
];

export const PAGE_META = {
  '/dashboard': { eyebrow: 'Overview', title: 'Financial Command Center' },
  '/transactions': { eyebrow: 'Money Flow', title: 'Transactions' },
  '/accounts': { eyebrow: 'Infrastructure', title: 'Accounts' },
  '/categories': { eyebrow: 'Classification', title: 'Categories' },
  '/budgets': { eyebrow: 'Planning', title: 'Budgets' },
  '/savings': { eyebrow: 'Future Capital', title: 'Savings Goals' },
  '/debts': { eyebrow: 'Liabilities', title: 'Debt Management' },
  '/recurring': { eyebrow: 'Automation', title: 'Recurring Transactions' },
  '/analytics': { eyebrow: 'Intelligence', title: 'Analytics' },
  '/audit': { eyebrow: 'System', title: 'Audit Log' },
  '/settings': { eyebrow: 'Configuration', title: 'Settings' },
};

/* ==========================================================================
   AMBIENT BACKGROUND
   ========================================================================== */

function Ambient() {
  const orbs = useMemo(
    () =>
      Array.from({ length: 14 }, (_, index) => ({
        id: index,
        left: `${(index * 37) % 100}%`,
        delay: `${(index * 1.7) % 18}s`,
        duration: `${16 + ((index * 3) % 14)}s`,
        scale: 0.6 + ((index % 4) * 0.28),
        hue: index % 3,
      })),
    [],
  );

  return (
    <div className="fs-ambient" aria-hidden="true">
      <div className="fs-aurora fs-aurora-a" />
      <div className="fs-aurora fs-aurora-b" />
      <div className="fs-aurora fs-aurora-c" />
      <div className="fs-grid-lines" />

      {orbs.map((orb) => (
        <span
          key={orb.id}
          className="fs-orb"
          style={{
            left: orb.left,
            bottom: '-10px',
            animationDelay: orb.delay,
            animationDuration: orb.duration,
            transform: `scale(${orb.scale})`,
            background:
              orb.hue === 0
                ? 'var(--cyan-soft)'
                : orb.hue === 1
                  ? 'var(--violet-soft)'
                  : 'var(--mint-soft)',
            boxShadow: `0 0 12px 2px ${
              orb.hue === 0
                ? 'rgba(110,231,249,0.6)'
                : orb.hue === 1
                  ? 'rgba(165,141,255,0.6)'
                  : 'rgba(110,231,183,0.6)'
            }`,
          }}
        />
      ))}
    </div>
  );
}

/* ==========================================================================
   CURSOR GLOW
   ========================================================================== */

function CursorGlow() {
  const ref = useRef(null);
  const frame = useRef(null);

  useEffect(() => {
    const fine = window.matchMedia('(pointer: fine)').matches;
    if (!fine) return undefined;

    const onMove = (event) => {
      if (frame.current) cancelAnimationFrame(frame.current);

      frame.current = requestAnimationFrame(() => {
        const node = ref.current;
        if (!node) return;
        node.style.setProperty('--mx', `${event.clientX}px`);
        node.style.setProperty('--my', `${event.clientY}px`);
      });
    };

    window.addEventListener('pointermove', onMove, { passive: true });

    return () => {
      window.removeEventListener('pointermove', onMove);
      if (frame.current) cancelAnimationFrame(frame.current);
    };
  }, []);

  return <div ref={ref} className="fs-cursor-glow" aria-hidden="true" />;
}

/* ==========================================================================
   COMMAND PALETTE
   ========================================================================== */

function CommandPalette({ open, onClose }) {
  const navigate = useNavigate();
  const [query, setQuery] = useState('');
  const [active, setActive] = useState(0);
  const inputRef = useRef(null);

  const commands = useMemo(() => {
    const pages = NAV_SECTIONS.flatMap((section) =>
      section.items.map((item) => ({
        id: item.to,
        label: item.label,
        hint: section.label,
        icon: item.icon,
        run: () => navigate(item.to),
      })),
    );

    const actions = [
      {
        id: 'new-transaction',
        label: 'Add a transaction',
        hint: 'Action',
        icon: Plus,
        run: () => navigate('/transactions?new=1'),
      },
      {
        id: 'new-budget',
        label: 'Create a budget',
        hint: 'Action',
        icon: Target,
        run: () => navigate('/budgets?new=1'),
      },
      {
        id: 'new-goal',
        label: 'Create a savings goal',
        hint: 'Action',
        icon: PiggyBank,
        run: () => navigate('/savings?new=1'),
      },
      {
        id: 'new-debt',
        label: 'Track a new debt',
        hint: 'Action',
        icon: CreditCard,
        run: () => navigate('/debts?new=1'),
      },
    ];

    const all = [...actions, ...pages];

    if (!query.trim()) return all;

    const needle = query.toLowerCase();

    return all.filter(
      (command) =>
        command.label.toLowerCase().includes(needle) ||
        command.hint.toLowerCase().includes(needle),
    );
  }, [navigate, query]);

  useEffect(() => {
    if (!open) {
      setQuery('');
      setActive(0);
      return undefined;
    }

    const timer = window.setTimeout(() => inputRef.current?.focus(), 40);
    return () => window.clearTimeout(timer);
  }, [open]);

  useEffect(() => {
    setActive(0);
  }, [query]);

  const runCommand = useCallback(
    (command) => {
      command?.run();
      onClose();
    },
    [onClose],
  );

  const onKeyDown = (event) => {
    if (event.key === 'ArrowDown') {
      event.preventDefault();
      setActive((index) => (index + 1) % Math.max(commands.length, 1));
    } else if (event.key === 'ArrowUp') {
      event.preventDefault();
      setActive(
        (index) =>
          (index - 1 + commands.length) % Math.max(commands.length, 1),
      );
    } else if (event.key === 'Enter') {
      event.preventDefault();
      runCommand(commands[active]);
    } else if (event.key === 'Escape') {
      onClose();
    }
  };

  if (!open) return null;

  return (
    <div
      className="fs-palette-scrim"
      onMouseDown={(event) => {
        if (event.target === event.currentTarget) onClose();
      }}
    >
      <div className="fs-palette" role="dialog" aria-label="Command palette">
        <div className="fs-palette-input-row">
          <Search size={17} style={{ color: 'var(--text-3)' }} />
          <input
            ref={inputRef}
            className="fs-palette-input"
            placeholder="Search pages and actions…"
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            onKeyDown={onKeyDown}
            aria-label="Command search"
          />
          <span className="fs-kbd">ESC</span>
        </div>

        <div className="fs-palette-list">
          {commands.length === 0 && (
            <p className="fs-sm fs-dim" style={{ padding: '18px 12px' }}>
              No matches for “{query}”.
            </p>
          )}

          {commands.map((command, index) => (
            <button
              key={command.id}
              type="button"
              className={`fs-palette-item ${index === active ? 'is-active' : ''}`}
              onMouseEnter={() => setActive(index)}
              onClick={() => runCommand(command)}
            >
              <command.icon size={16} />
              <span>{command.label}</span>
              <span className="fs-palette-hint">{command.hint}</span>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}

/* ==========================================================================
   SIDEBAR
   ========================================================================== */

function Sidebar({ open, onNavigate, health }) {
  return (
    <aside className={`fs-sidebar ${open ? 'is-open' : ''}`}>
      <div className="fs-brand">
        <div className="fs-brand-mark">F</div>
        <div className="fs-brand-text">
          <strong>FINSIGHT</strong>
          <span>Financial OS</span>
        </div>
      </div>

      <nav className="fs-nav" aria-label="Primary">
        {NAV_SECTIONS.map((section) => (
          <div key={section.label}>
            <p className="fs-nav-label">{section.label}</p>

            {section.items.map((item) => (
              <NavLink
                key={item.to}
                to={item.to}
                className={({ isActive }) =>
                  `fs-nav-item ${isActive ? 'is-active' : ''}`
                }
                onClick={onNavigate}
              >
                <item.icon size={17} />
                <span>{item.label}</span>
              </NavLink>
            ))}
          </div>
        ))}
      </nav>

      <div className="fs-sidebar-foot">
        <div className="fs-sidebar-foot-row">
          <span
            className={`fs-live-dot ${health === 'down' ? 'is-down' : ''}`}
          />
          <span>
            {health === 'down'
              ? 'API unreachable'
              : health === 'checking'
                ? 'Connecting…'
                : 'Live database connected'}
          </span>
        </div>

        <div
          className="fs-sidebar-foot-row"
          style={{ marginTop: 6, opacity: 0.7 }}
        >
          <Sparkles size={11} />
          <span>FinSight v2.0 · Aurora</span>
        </div>
      </div>
    </aside>
  );
}

/* ==========================================================================
   SHELL
   ========================================================================== */

export default function Shell({ children }) {
  const location = useLocation();
  const navigate = useNavigate();

  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [paletteOpen, setPaletteOpen] = useState(false);
  const [health, setHealth] = useState('checking');

  const meta = PAGE_META[location.pathname] ?? {
    eyebrow: 'FinSight',
    title: 'Financial Intelligence',
  };

  /* Close the mobile drawer whenever the route changes */
  useEffect(() => {
    setSidebarOpen(false);
  }, [location.pathname]);

  /* Document title */
  useEffect(() => {
    document.title = `${meta.title} · FinSight`;
  }, [meta.title]);

  /* Scroll to top on navigation */
  useEffect(() => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }, [location.pathname]);

  /* Connection indicator */
  useEffect(() => {
    let alive = true;

    const check = async () => {
      try {
        const response = await fetch('/api/health', { cache: 'no-store' });
        const result = response.ok ? await response.json() : null;
        if (!alive) return;
        setHealth(response.ok && result?.database ? 'up' : 'down');
      } catch {
        if (alive) setHealth('down');
      }
    };

    check();
    const timer = window.setInterval(check, 30000);

    return () => {
      alive = false;
      window.clearInterval(timer);
    };
  }, []);

  useHotkeys({
    'mod+k': () => setPaletteOpen((open) => !open),
    mod_shift_n: () => navigate('/transactions?new=1'),
  });

  return (
    <>
      <Ambient />
      <CursorGlow />

      <div className="fs-app">
        <Sidebar
          open={sidebarOpen}
          health={health}
          onNavigate={() => setSidebarOpen(false)}
        />

        {sidebarOpen && (
          <div
            className="fs-scrim"
            onClick={() => setSidebarOpen(false)}
            aria-hidden="true"
          />
        )}

        <div className="fs-main">
          <header className="fs-topbar">
            <button
              type="button"
              className="fs-btn fs-btn-icon fs-btn-ghost fs-mobile-trigger"
              onClick={() => setSidebarOpen(true)}
              aria-label="Open navigation"
            >
              <Menu size={19} />
            </button>

            <div className="fs-topbar-titles">
              <div className="fs-eyebrow">{meta.eyebrow}</div>
              <h1>{meta.title}</h1>
            </div>

            <div className="fs-topbar-actions">
              <button
                type="button"
                className="fs-btn fs-btn-sm"
                onClick={() => setPaletteOpen(true)}
                aria-label="Open command palette"
              >
                <Search size={14} />
                <span className="fs-btn-label fs-dim">Search</span>
                <span className="fs-kbd" style={{ marginLeft: 4 }}>
                  <Command size={9} /> K
                </span>
              </button>

              <button
                type="button"
                className="fs-btn fs-btn-ghost fs-btn-icon"
                onClick={() => navigate('/audit')}
                aria-label="View audit log"
              >
                <Bell size={17} />
              </button>

              <button
                type="button"
                className="fs-btn fs-btn-primary fs-btn-sm"
                onClick={() => navigate('/transactions?new=1')}
              >
                <Plus size={15} />
                <span className="fs-btn-label">New transaction</span>
              </button>
            </div>
          </header>

          <main className="fs-page" key={location.pathname}>
            {children}
          </main>
        </div>
      </div>

      <CommandPalette
        open={paletteOpen}
        onClose={() => setPaletteOpen(false)}
      />
    </>
  );
}
