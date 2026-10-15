import {
  Bell,
  CalendarDays,
  ChevronDown,
  Command,
  Download,
  Filter,
  HelpCircle,
  Menu,
  Plus,
  Search,
  Settings,
  Sparkles,
  TrendingDown,
  TrendingUp,
  Wallet,
  X,
  Zap,
} from 'lucide-react';

import {
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react';

import {
  Link,
  useLocation,
} from 'react-router-dom';

const PAGE_META = {
  '/dashboard': {
    eyebrow: 'OVERVIEW',
    title: 'Financial Command Center',
    description:
      'A live view of your financial position, cash flow, and priorities.',
  },

  '/transactions': {
    eyebrow: 'MONEY MANAGEMENT',
    title: 'Transactions',
    description:
      'Review and understand every movement across your accounts.',
  },

  '/accounts': {
    eyebrow: 'MONEY MANAGEMENT',
    title: 'Accounts',
    description:
      'Monitor balances and manage your connected financial accounts.',
  },

  '/budgets': {
    eyebrow: 'MONEY MANAGEMENT',
    title: 'Budgets',
    description:
      'Control spending with intelligent budget tracking.',
  },

  '/savings': {
    eyebrow: 'MONEY MANAGEMENT',
    title: 'Savings',
    description:
      'Track your goals and build your financial reserves.',
  },

  '/debts': {
    eyebrow: 'MONEY MANAGEMENT',
    title: 'Debt Management',
    description:
      'Monitor liabilities and accelerate your repayment strategy.',
  },

  '/recurring': {
    eyebrow: 'MONEY MANAGEMENT',
    title: 'Recurring Transactions',
    description:
      'Keep subscriptions, bills, and recurring income under control.',
  },

  '/analytics': {
    eyebrow: 'INTELLIGENCE',
    title: 'Financial Analytics',
    description:
      'Discover patterns and turn financial data into decisions.',
  },

  '/categories': {
    eyebrow: 'MANAGEMENT',
    title: 'Categories',
    description:
      'Organize your financial activity with precision.',
  },

  '/audit': {
    eyebrow: 'MANAGEMENT',
    title: 'Audit Log',
    description:
      'Review the history of important financial activity.',
  },

  '/settings': {
    eyebrow: 'SYSTEM',
    title: 'Settings',
    description:
      'Configure your FinSight workspace and preferences.',
  },
};

const SEARCH_ITEMS = [
  {
    id: 'dashboard',
    label: 'Dashboard',
    description: 'Financial overview',
    path: '/dashboard',
    keywords: ['home', 'overview', 'money', 'balance'],
  },
  {
    id: 'transactions',
    label: 'Transactions',
    description: 'Income and expenses',
    path: '/transactions',
    keywords: ['income', 'expense', 'payments', 'money'],
  },
  {
    id: 'accounts',
    label: 'Accounts',
    description: 'Bank and financial accounts',
    path: '/accounts',
    keywords: ['bank', 'cash', 'wallet', 'balance'],
  },
  {
    id: 'budgets',
    label: 'Budgets',
    description: 'Spending limits and planning',
    path: '/budgets',
    keywords: ['budget', 'limit', 'spending'],
  },
  {
    id: 'savings',
    label: 'Savings',
    description: 'Savings goals',
    path: '/savings',
    keywords: ['save', 'goal', 'fund'],
  },
  {
    id: 'debts',
    label: 'Debt Management',
    description: 'Loans and liabilities',
    path: '/debts',
    keywords: ['loan', 'debt', 'liability', 'emi'],
  },
  {
    id: 'recurring',
    label: 'Recurring Transactions',
    description: 'Subscriptions and bills',
    path: '/recurring',
    keywords: ['subscription', 'bill', 'recurring'],
  },
  {
    id: 'analytics',
    label: 'Financial Analytics',
    description: 'Trends and insights',
    path: '/analytics',
    keywords: ['analytics', 'chart', 'trend', 'insight', 'ai'],
  },
  {
    id: 'categories',
    label: 'Categories',
    description: 'Financial classification',
    path: '/categories',
    keywords: ['category', 'classification'],
  },
  {
    id: 'audit',
    label: 'Audit Log',
    description: 'Financial activity history',
    path: '/audit',
    keywords: ['audit', 'history', 'activity', 'security'],
  },
  {
    id: 'settings',
    label: 'Settings',
    description: 'Workspace configuration',
    path: '/settings',
    keywords: ['settings', 'configuration', 'preferences'],
  },
];

const NOTIFICATIONS = [
  {
    id: 1,
    type: 'positive',
    icon: TrendingUp,
    title: 'Savings progress is up',
    message:
      'Your monthly savings rate improved compared with last month.',
    time: '12 min ago',
  },
  {
    id: 2,
    type: 'warning',
    icon: CalendarDays,
    title: 'Recurring payment approaching',
    message:
      'A scheduled recurring transaction is coming up soon.',
    time: '1 hr ago',
  },
  {
    id: 3,
    type: 'neutral',
    icon: Wallet,
    title: 'Account activity detected',
    message:
      'New financial activity is available in your workspace.',
    time: '3 hrs ago',
  },
];

export default function Topbar({
  onMenuClick,
  onCommandOpen,
}) {
  const location = useLocation();

  const [searchOpen, setSearchOpen] =
    useState(false);

  const [notificationOpen, setNotificationOpen] =
    useState(false);

  const [profileOpen, setProfileOpen] =
    useState(false);

  const [searchQuery, setSearchQuery] =
    useState('');

  const searchInputRef =
    useRef(null);

  const notificationRef =
    useRef(null);

  const profileRef =
    useRef(null);

  const meta =
    PAGE_META[location.pathname] ??
    PAGE_META['/dashboard'];

  const filteredSearchItems =
    useMemo(() => {
      const query =
        searchQuery
          .trim()
          .toLowerCase();

      if (!query) {
        return SEARCH_ITEMS;
      }

      return SEARCH_ITEMS.filter(
        (item) => {
          const searchable = [
            item.label,
            item.description,
            ...item.keywords,
          ]
            .join(' ')
            .toLowerCase();

          return searchable.includes(
            query,
          );
        },
      );
    }, [searchQuery]);

  useEffect(() => {
    if (searchOpen) {
      requestAnimationFrame(() => {
        searchInputRef.current?.focus();
      });
    }
  }, [searchOpen]);

  useEffect(() => {
    const handlePointerDown = (
      event,
    ) => {
      if (
        notificationRef.current &&
        !notificationRef.current.contains(
          event.target,
        )
      ) {
        setNotificationOpen(false);
      }

      if (
        profileRef.current &&
        !profileRef.current.contains(
          event.target,
        )
      ) {
        setProfileOpen(false);
      }
    };

    document.addEventListener(
      'mousedown',
      handlePointerDown,
    );

    return () => {
      document.removeEventListener(
        'mousedown',
        handlePointerDown,
      );
    };
  }, []);

  useEffect(() => {
    const handleKeyDown = (
      event,
    ) => {
      if (
        (event.ctrlKey ||
          event.metaKey) &&
        event.key.toLowerCase() ===
          'k'
      ) {
        event.preventDefault();

        onCommandOpen?.();

        setSearchOpen(true);
      }

      if (
        event.key === 'Escape'
      ) {
        setSearchOpen(false);
        setNotificationOpen(
          false,
        );
        setProfileOpen(false);
      }
    };

    window.addEventListener(
      'keydown',
      handleKeyDown,
    );

    return () => {
      window.removeEventListener(
        'keydown',
        handleKeyDown,
      );
    };
  }, [onCommandOpen]);

  const closeSearch = () => {
    setSearchOpen(false);
    setSearchQuery('');
  };

  return (
    <>
      <header className="fs-topbar">
        <div className="fs-topbar-left">
          <button
            type="button"
            className="fs-mobile-menu-button"
            onClick={onMenuClick}
            aria-label="Open navigation"
          >
            <Menu size={20} />
          </button>

          <div className="fs-page-context">
            <div className="fs-page-context-eyebrow">
              {meta.eyebrow}
            </div>

            <div className="fs-page-context-title">
              {meta.title}
            </div>

            <div className="fs-page-context-description">
              {meta.description}
            </div>
          </div>
        </div>

        <div className="fs-topbar-actions">
          <button
            type="button"
            className="fs-topbar-action fs-topbar-search-button"
            onClick={() => {
              setSearchOpen(true);
              onCommandOpen?.();
            }}
          >
            <Search size={17} />

            <span>
              Search
            </span>

            <kbd>
              <Command size={11} />
              K
            </kbd>
          </button>

          <button
            type="button"
            className="fs-topbar-action"
            title="Financial filters"
          >
            <Filter size={17} />
          </button>

          <button
            type="button"
            className="fs-topbar-action"
            title="Quick add"
          >
            <Plus size={18} />
          </button>

          <div
            className="fs-topbar-dropdown-wrapper"
            ref={notificationRef}
          >
            <button
              type="button"
              className={`fs-topbar-action fs-notification-button ${
                notificationOpen
                  ? 'fs-topbar-action-active'
                  : ''
              }`}
              onClick={() => {
                setNotificationOpen(
                  (current) =>
                    !current,
                );
                setProfileOpen(
                  false,
                );
              }}
              aria-label="Notifications"
            >
              <Bell size={18} />

              <span className="fs-notification-dot" />
            </button>

            {notificationOpen && (
              <div className="fs-notification-panel">
                <div className="fs-dropdown-header">
                  <div>
                    <strong>
                      Notifications
                    </strong>

                    <span>
                      Financial workspace activity
                    </span>
                  </div>

                  <button
                    type="button"
                    onClick={() =>
                      setNotificationOpen(
                        false,
                      )
                    }
                  >
                    <X size={15} />
                  </button>
                </div>

                <div className="fs-notification-list">
                  {NOTIFICATIONS.map(
                    (notification) => {
                      const Icon =
                        notification.icon;

                      return (
                        <div
                          key={
                            notification.id
                          }
                          className="fs-notification-item"
                        >
                          <div
                            className={`fs-notification-icon fs-notification-${notification.type}`}
                          >
                            <Icon
                              size={16}
                            />
                          </div>

                          <div className="fs-notification-content">
                            <strong>
                              {
                                notification.title
                              }
                            </strong>

                            <p>
                              {
                                notification.message
                              }
                            </p>

                            <span>
                              {
                                notification.time
                              }
                            </span>
                          </div>
                        </div>
                      );
                    },
                  )}
                </div>

                <Link
                  to="/audit"
                  className="fs-notification-footer"
                  onClick={() =>
                    setNotificationOpen(
                      false,
                    )
                  }
                >
                  View activity history
                  <TrendingUp
                    size={14}
                  />
                </Link>
              </div>
            )}
          </div>

          <div
            className="fs-topbar-dropdown-wrapper"
            ref={profileRef}
          >
            <button
              type="button"
              className={`fs-profile-trigger ${
                profileOpen
                  ? 'fs-profile-trigger-active'
                  : ''
              }`}
              onClick={() => {
                setProfileOpen(
                  (current) =>
                    !current,
                );
                setNotificationOpen(
                  false,
                );
              }}
            >
              <span className="fs-profile-avatar">
                DK
              </span>

              <span className="fs-profile-copy">
                <strong>
                  Personal
                </strong>

                <small>
                  Workspace
                </small>
              </span>

              <ChevronDown
                size={14}
              />
            </button>

            {profileOpen && (
              <div className="fs-profile-menu">
                <div className="fs-profile-menu-header">
                  <div className="fs-profile-large-avatar">
                    DK
                  </div>

                  <div>
                    <strong>
                      Personal Finance
                    </strong>

                    <span>
                      Active workspace
                    </span>
                  </div>
                </div>

                <div className="fs-profile-menu-divider" />

                <Link
                  to="/settings"
                  onClick={() =>
                    setProfileOpen(
                      false,
                    )
                  }
                >
                  <Settings
                    size={16}
                  />
                  Settings
                </Link>

                <Link
                  to="/analytics"
                  onClick={() =>
                    setProfileOpen(
                      false,
                    )
                  }
                >
                  <Sparkles
                    size={16}
                  />
                  Intelligence
                </Link>

                <button
                  type="button"
                  onClick={() =>
                    setProfileOpen(
                      false,
                    )
                  }
                >
                  <HelpCircle
                    size={16}
                  />
                  Help & support
                </button>
              </div>
            )}
          </div>
        </div>
      </header>

      {searchOpen && (
        <div className="fs-search-overlay">
          <button
            type="button"
            className="fs-search-overlay-backdrop"
            onClick={closeSearch}
            aria-label="Close search"
          />

          <div className="fs-command-search">
            <div className="fs-command-search-header">
              <Search size={19} />

              <input
                ref={searchInputRef}
                value={searchQuery}
                onChange={(event) =>
                  setSearchQuery(
                    event.target.value,
                  )
                }
                placeholder="Search FinSight..."
              />

              <kbd>
                ESC
              </kbd>

              <button
                type="button"
                onClick={
                  closeSearch
                }
                aria-label="Close search"
              >
                <X size={18} />
              </button>
            </div>

            <div className="fs-command-search-body">
              <div className="fs-command-section-label">
                {searchQuery
                  ? 'SEARCH RESULTS'
                  : 'QUICK NAVIGATION'}
              </div>

              {filteredSearchItems.length ? (
                <div className="fs-command-results">
                  {filteredSearchItems.map(
                    (item) => (
                      <Link
                        key={
                          item.id
                        }
                        to={
                          item.path
                        }
                        onClick={
                          closeSearch
                        }
                        className="fs-command-result"
                      >
                        <div className="fs-command-result-icon">
                          <Zap
                            size={16}
                          />
                        </div>

                        <div className="fs-command-result-copy">
                          <strong>
                            {
                              item.label
                            }
                          </strong>

                          <span>
                            {
                              item.description
                            }
                          </span>
                        </div>

                        <span className="fs-command-result-path">
                          {
                            item.path
                          }
                        </span>
                      </Link>
                    ),
                  )}
                </div>
              ) : (
                <div className="fs-command-empty">
                  <Search
                    size={25}
                  />

                  <strong>
                    No results found
                  </strong>

                  <span>
                    Try a different search term.
                  </span>
                </div>
              )}
            </div>

            <div className="fs-command-search-footer">
              <span>
                <kbd>↑</kbd>
                <kbd>↓</kbd>
                Navigate
              </span>

              <span>
                <kbd>↵</kbd>
                Open
              </span>

              <span>
                <kbd>ESC</kbd>
                Close
              </span>
            </div>
          </div>
        </div>
      )}

      <style>{`
        .fs-topbar {
          position: relative;
          height: var(--fs-topbar-height, 78px);
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 20px;
          padding: 0 28px;
          box-sizing: border-box;
          border-bottom: 1px solid rgba(117, 140, 190, 0.09);
          background: rgba(7, 11, 20, 0.72);
          backdrop-filter: blur(24px);
          -webkit-backdrop-filter: blur(24px);
        }

        .fs-topbar-left {
          min-width: 0;
          display: flex;
          align-items: center;
          gap: 16px;
        }

        .fs-mobile-menu-button {
          display: none;
          width: 40px;
          height: 40px;
          place-items: center;
          border: 1px solid rgba(115, 140, 191, 0.14);
          border-radius: 11px;
          background: rgba(255, 255, 255, 0.03);
          color: #b9c4d7;
          cursor: pointer;
        }

        .fs-page-context {
          min-width: 0;
        }

        .fs-page-context-eyebrow {
          color: #6684e9;
          font-size: 9px;
          font-weight: 850;
          letter-spacing: 0.17em;
        }

        .fs-page-context-title {
          margin-top: 2px;
          overflow: hidden;
          color: #edf2fa;
          font-size: 17px;
          font-weight: 780;
          letter-spacing: -0.025em;
          text-overflow: ellipsis;
          white-space: nowrap;
        }

        .fs-page-context-description {
          margin-top: 2px;
          overflow: hidden;
          color: #5f6c81;
          font-size: 10px;
          text-overflow: ellipsis;
          white-space: nowrap;
        }

        .fs-topbar-actions {
          display: flex;
          align-items: center;
          gap: 7px;
          flex-shrink: 0;
        }

        .fs-topbar-action {
          position: relative;
          height: 39px;
          min-width: 39px;
          display: inline-flex;
          align-items: center;
          justify-content: center;
          gap: 8px;
          border: 1px solid transparent;
          border-radius: 10px;
          background: transparent;
          color: #7e8aa0;
          cursor: pointer;
          transition: 160ms ease;
        }

        .fs-topbar-action:hover,
        .fs-topbar-action-active {
          border-color: rgba(113, 141, 207, 0.13);
          background: rgba(255, 255, 255, 0.035);
          color: #c8d4e8;
        }

        .fs-topbar-search-button {
          min-width: 190px;
          justify-content: flex-start;
          padding: 0 10px;
          border-color: rgba(111, 135, 185, 0.11);
          background: rgba(255, 255, 255, 0.022);
        }

        .fs-topbar-search-button span {
          color: #667389;
          font-size: 11px;
        }

        .fs-topbar-action kbd {
          margin-left: auto;
          display: inline-flex;
          align-items: center;
          gap: 2px;
          padding: 3px 5px;
          border: 1px solid rgba(114, 135, 175, 0.12);
          border-radius: 5px;
          color: #59667b;
          background: rgba(255, 255, 255, 0.025);
          font-size: 9px;
        }

        .fs-notification-button {
          overflow: visible;
        }

        .fs-notification-dot {
          position: absolute;
          top: 8px;
          right: 8px;
          width: 5px;
          height: 5px;
          border-radius: 50%;
          background: #6d8dff;
          box-shadow: 0 0 9px rgba(109, 141, 255, 0.8);
        }

        .fs-topbar-dropdown-wrapper {
          position: relative;
        }

        .fs-profile-trigger {
          height: 43px;
          display: flex;
          align-items: center;
          gap: 8px;
          padding: 3px 9px 3px 4px;
          border: 1px solid transparent;
          border-radius: 12px;
          background: transparent;
          color: #8995aa;
          cursor: pointer;
        }

        .fs-profile-trigger:hover,
        .fs-profile-trigger-active {
          border-color: rgba(111, 135, 185, 0.13);
          background: rgba(255, 255, 255, 0.03);
        }

        .fs-profile-avatar,
        .fs-profile-large-avatar {
          display: grid;
          place-items: center;
          border-radius: 10px;
          background:
            linear-gradient(135deg, #566eff, #9b65ff);
          color: #fff;
          font-weight: 850;
          box-shadow: 0 5px 20px rgba(88, 103, 255, 0.22);
        }

        .fs-profile-avatar {
          width: 35px;
          height: 35px;
          font-size: 10px;
        }

        .fs-profile-copy {
          display: flex;
          flex-direction: column;
          align-items: flex-start;
          line-height: 1.2;
        }

        .fs-profile-copy strong {
          color: #c7cfdd;
          font-size: 10px;
        }

        .fs-profile-copy small {
          margin-top: 2px;
          color: #58657a;
          font-size: 8px;
        }

        .fs-notification-panel,
        .fs-profile-menu {
          position: absolute;
          z-index: 200;
          top: calc(100% + 10px);
          right: 0;
          overflow: hidden;
          border: 1px solid rgba(112, 139, 198, 0.17);
          border-radius: 16px;
          background:
            linear-gradient(145deg, rgba(20, 28, 44, 0.98), rgba(10, 15, 25, 0.99));
          box-shadow: 0 25px 70px rgba(0, 0, 0, 0.4);
          backdrop-filter: blur(24px);
        }

        .fs-notification-panel {
          width: 365px;
        }

        .fs-profile-menu {
          width: 250px;
          padding: 8px;
        }

        .fs-dropdown-header {
          display: flex;
          align-items: flex-start;
          justify-content: space-between;
          padding: 16px;
          border-bottom: 1px solid rgba(112, 132, 172, 0.08);
        }

        .fs-dropdown-header strong {
          display: block;
          color: #e5eaf3;
          font-size: 12px;
        }

        .fs-dropdown-header span {
          display: block;
          margin-top: 3px;
          color: #5f6c81;
          font-size: 9px;
        }

        .fs-dropdown-header button {
          width: 28px;
          height: 28px;
          display: grid;
          place-items: center;
          border: 0;
          border-radius: 8px;
          background: rgba(255, 255, 255, 0.025);
          color: #718098;
          cursor: pointer;
        }

        .fs-notification-list {
          max-height: 330px;
          overflow-y: auto;
        }

        .fs-notification-item {
          display: flex;
          gap: 11px;
          padding: 13px 16px;
          border-bottom: 1px solid rgba(112, 132, 172, 0.06);
        }

        .fs-notification-icon {
          width: 32px;
          height: 32px;
          flex: 0 0 32px;
          display: grid;
          place-items: center;
          border-radius: 9px;
        }

        .fs-notification-positive {
          color: #5ddbad;
          background: rgba(42, 209, 157, 0.08);
        }

        .fs-notification-warning {
          color: #ffc26d;
          background: rgba(255, 174, 65, 0.08);
        }

        .fs-notification-neutral {
          color: #8ca6ff;
          background: rgba(84, 119, 255, 0.08);
        }

        .fs-notification-content {
          min-width: 0;
        }

        .fs-notification-content strong {
          display: block;
          color: #d5dce8;
          font-size: 10px;
        }

        .fs-notification-content p {
          margin: 4px 0;
          color: #69768a;
          font-size: 9px;
          line-height: 1.5;
        }

        .fs-notification-content span {
          color: #4f5c70;
          font-size: 8px;
        }

        .fs-notification-footer {
          display: flex;
          align-items: center;
          justify-content: space-between;
          padding: 12px 16px;
          color: #8098e5;
          background: rgba(255, 255, 255, 0.018);
          font-size: 9px;
          text-decoration: none;
        }

        .fs-profile-menu-header {
          display: flex;
          align-items: center;
          gap: 10px;
          padding: 9px;
        }

        .fs-profile-large-avatar {
          width: 39px;
          height: 39px;
          font-size: 10px;
        }

        .fs-profile-menu-header strong {
          display: block;
          color: #dce3ef;
          font-size: 10px;
        }

        .fs-profile-menu-header span {
          display: block;
          margin-top: 3px;
          color: #5e6b80;
          font-size: 8px;
        }

        .fs-profile-menu-divider {
          height: 1px;
          margin: 6px 0;
          background: rgba(112, 132, 172, 0.08);
        }

        .fs-profile-menu a,
        .fs-profile-menu button {
          width: 100%;
          box-sizing: border-box;
          display: flex;
          align-items: center;
          gap: 9px;
          padding: 10px;
          border: 0;
          border-radius: 8px;
          background: transparent;
          color: #8b97ab;
          cursor: pointer;
          font: inherit;
          font-size: 10px;
          text-align: left;
          text-decoration: none;
        }

        .fs-profile-menu a:hover,
        .fs-profile-menu button:hover {
          background: rgba(255, 255, 255, 0.035);
          color: #d1d9e7;
        }

        .fs-search-overlay {
          position: fixed;
          inset: 0;
          z-index: 1000;
          display: grid;
          place-items: start center;
          padding-top: 110px;
        }

        .fs-search-overlay-backdrop {
          position: absolute;
          inset: 0;
          border: 0;
          background: rgba(2, 5, 11, 0.68);
          backdrop-filter: blur(8px);
          cursor: default;
        }

        .fs-command-search {
          position: relative;
          z-index: 2;
          width: min(680px, calc(100vw - 30px));
          overflow: hidden;
          border: 1px solid rgba(113, 141, 205, 0.2);
          border-radius: 18px;
          background:
            linear-gradient(145deg, #151e31, #0b111d);
          box-shadow:
            0 35px 100px rgba(0, 0, 0, 0.55),
            0 0 0 1px rgba(101, 130, 230, 0.035);
          animation: fs-command-in 170ms ease-out;
        }

        .fs-command-search-header {
          height: 61px;
          display: flex;
          align-items: center;
          gap: 11px;
          padding: 0 16px;
          border-bottom: 1px solid rgba(112, 132, 172, 0.09);
          color: #738eff;
        }

        .fs-command-search-header input {
          flex: 1;
          min-width: 0;
          border: 0;
          outline: 0;
          background: transparent;
          color: #f1f5fc;
          font-size: 14px;
        }

        .fs-command-search-header input::placeholder {
          color: #5d6a80;
        }

        .fs-command-search-header > kbd {
          padding: 4px 6px;
          border: 1px solid rgba(113, 135, 177, 0.12);
          border-radius: 5px;
          color: #5f6c80;
          background: rgba(255, 255, 255, 0.025);
          font-size: 8px;
        }

        .fs-command-search-header button {
          width: 30px;
          height: 30px;
          display: grid;
          place-items: center;
          border: 0;
          border-radius: 8px;
          background: rgba(255, 255, 255, 0.025);
          color: #718097;
          cursor: pointer;
        }

        .fs-command-search-body {
          max-height: 430px;
          overflow-y: auto;
          padding: 12px;
        }

        .fs-command-section-label {
          padding: 5px 8px 9px;
          color: #59667c;
          font-size: 8px;
          font-weight: 850;
          letter-spacing: 0.14em;
        }

        .fs-command-result {
          display: flex;
          align-items: center;
          gap: 11px;
          padding: 10px;
          border-radius: 10px;
          color: inherit;
          text-decoration: none;
          transition: 140ms ease;
        }

        .fs-command-result:hover {
          background: rgba(88, 119, 228, 0.07);
        }

        .fs-command-result-icon {
          width: 34px;
          height: 34px;
          display: grid;
          place-items: center;
          border: 1px solid rgba(104, 133, 213, 0.13);
          border-radius: 9px;
          color: #8099ff;
          background: rgba(80, 113, 228, 0.07);
        }

        .fs-command-result-copy {
          min-width: 0;
          flex: 1;
        }

        .fs-command-result-copy strong {
          display: block;
          color: #d9e0eb;
          font-size: 10px;
        }

        .fs-command-result-copy span {
          display: block;
          margin-top: 3px;
          color: #647187;
          font-size: 8px;
        }

        .fs-command-result-path {
          color: #4f5c70;
          font-family: ui-monospace, SFMono-Regular, Menlo, monospace;
          font-size: 8px;
        }

        .fs-command-empty {
          min-height: 180px;
          display: flex;
          align-items: center;
          justify-content: center;
          flex-direction: column;
          gap: 6px;
          color: #58667b;
        }

        .fs-command-empty strong {
          color: #aab5c7;
          font-size: 11px;
        }

        .fs-command-empty span {
          font-size: 9px;
        }

        .fs-command-search-footer {
          display: flex;
          align-items: center;
          gap: 16px;
          padding: 10px 15px;
          border-top: 1px solid rgba(112, 132, 172, 0.08);
          color: #536077;
          background: rgba(255, 255, 255, 0.012);
          font-size: 8px;
        }

        .fs-command-search-footer span {
          display: inline-flex;
          align-items: center;
          gap: 5px;
        }

        .fs-command-search-footer kbd {
          padding: 3px 5px;
          border: 1px solid rgba(112, 132, 172, 0.12);
          border-radius: 4px;
          color: #718097;
          background: rgba(255, 255, 255, 0.025);
        }

        @keyframes fs-command-in {
          from {
            opacity: 0;
            transform: translateY(-8px) scale(0.985);
          }

          to {
            opacity: 1;
            transform: translateY(0) scale(1);
          }
        }

        @media (max-width: 900px) {
          .fs-topbar {
            padding: 0 18px;
          }

          .fs-topbar-search-button {
            min-width: 39px;
            width: 39px;
            padding: 0;
          }

          .fs-topbar-search-button span,
          .fs-topbar-search-button kbd {
            display: none;
          }

          .fs-page-context-description {
            display: none;
          }

          .fs-profile-copy {
            display: none;
          }
        }

        @media (max-width: 680px) {
          .fs-topbar {
            height: 70px;
            padding: 0 13px;
          }

          .fs-mobile-menu-button {
            display: grid;
          }

          .fs-page-context-title {
            font-size: 14px;
          }

          .fs-page-context-eyebrow {
            font-size: 8px;
          }

          .fs-topbar-actions {
            gap: 3px;
          }

          .fs-topbar-action:nth-child(2),
          .fs-topbar-action:nth-child(3) {
            display: none;
          }

          .fs-notification-panel {
            position: fixed;
            top: 76px;
            left: 12px;
            right: 12px;
            width: auto;
          }

          .fs-profile-menu {
            right: -4px;
          }

          .fs-search-overlay {
            padding-top: 75px;
          }

          .fs-command-search {
            width: calc(100vw - 20px);
          }

          .fs-command-result-path {
            display: none;
          }
        }
      `}</style>
    </>
  );
}