import {
  BarChart3,
  CreditCard,
  LayoutDashboard,
  MoreHorizontal,
  PiggyBank,
  Plus,
  Target,
  Wallet,
  X,
} from 'lucide-react';

import {
  NavLink,
} from 'react-router-dom';

import {
  useEffect,
  useState,
} from 'react';

const primaryItems = [
  {
    label: 'Home',
    path: '/dashboard',
    icon: LayoutDashboard,
  },
  {
    label: 'Transactions',
    path: '/transactions',
    icon: CreditCard,
  },
  {
    label: 'Accounts',
    path: '/accounts',
    icon: Wallet,
  },
  {
    label: 'Budgets',
    path: '/budgets',
    icon: Target,
  },
];

const moreItems = [
  {
    label: 'Analytics',
    path: '/analytics',
    icon: BarChart3,
  },
  {
    label: 'Savings',
    path: '/savings',
    icon: PiggyBank,
  },
  {
    label: 'Debts',
    path: '/debts',
    icon: CreditCard,
  },
  {
    label: 'Recurring',
    path: '/recurring',
    icon: Target,
  },
  {
    label: 'Categories',
    path: '/categories',
    icon: Wallet,
  },
  {
    label: 'Audit Log',
    path: '/audit',
    icon: BarChart3,
  },
  {
    label: 'Settings',
    path: '/settings',
    icon: Target,
  },
];

export default function MobileNav() {
  const [
    moreOpen,
    setMoreOpen,
  ] = useState(false);

  useEffect(() => {
    document.body.classList.toggle(
      'fs-more-menu-open',
      moreOpen,
    );

    return () => {
      document.body.classList.remove(
        'fs-more-menu-open',
      );
    };
  }, [moreOpen]);

  useEffect(() => {
    const handleEscape = (
      event,
    ) => {
      if (
        event.key === 'Escape'
      ) {
        setMoreOpen(false);
      }
    };

    window.addEventListener(
      'keydown',
      handleEscape,
    );

    return () => {
      window.removeEventListener(
        'keydown',
        handleEscape,
      );
    };
  }, []);

  const closeMore = () => {
    setMoreOpen(false);
  };

  return (
    <>
      {moreOpen && (
        <>
          <button
            type="button"
            className="fs-mobile-more-backdrop"
            onClick={closeMore}
            aria-label="Close more menu"
          />

          <section
            className="fs-mobile-more-panel"
            aria-label="More navigation"
          >
            <div className="fs-mobile-more-header">
              <div>
                <span>
                  FINANCIAL WORKSPACE
                </span>

                <strong>
                  More tools
                </strong>
              </div>

              <button
                type="button"
                onClick={closeMore}
                aria-label="Close menu"
              >
                <X size={19} />
              </button>
            </div>

            <div className="fs-mobile-more-grid">
              {moreItems.map(
                (item) => {
                  const Icon =
                    item.icon;

                  return (
                    <NavLink
                      key={item.path}
                      to={item.path}
                      onClick={
                        closeMore
                      }
                      className={({
                        isActive,
                      }) =>
                        `fs-mobile-more-item ${
                          isActive
                            ? 'fs-mobile-more-item-active'
                            : ''
                        }`
                      }
                    >
                      <span className="fs-mobile-more-item-icon">
                        <Icon
                          size={19}
                          strokeWidth={1.8}
                        />
                      </span>

                      <strong>
                        {item.label}
                      </strong>

                      <span className="fs-mobile-more-item-arrow">
                        →
                      </span>
                    </NavLink>
                  );
                },
              )}
            </div>
          </section>
        </>
      )}

      <nav
        className="fs-mobile-navigation"
        aria-label="Mobile navigation"
      >
        {primaryItems.map(
          (item) => {
            const Icon =
              item.icon;

            return (
              <NavLink
                key={item.path}
                to={item.path}
                className={({
                  isActive,
                }) =>
                  `fs-mobile-navigation-item ${
                    isActive
                      ? 'fs-mobile-navigation-item-active'
                      : ''
                  }`
                }
              >
                {({
                  isActive,
                }) => (
                  <>
                    <span className="fs-mobile-navigation-icon">
                      <Icon
                        size={19}
                        strokeWidth={
                          isActive
                            ? 2.4
                            : 1.8
                        }
                      />
                    </span>

                    <span>
                      {item.label}
                    </span>
                  </>
                )}
              </NavLink>
            );
          },
        )}

        <button
          type="button"
          className="fs-mobile-add-button"
          aria-label="Create transaction"
        >
          <span>
            <Plus
              size={22}
              strokeWidth={2.2}
            />
          </span>
        </button>

        <button
          type="button"
          className={`fs-mobile-navigation-item ${
            moreOpen
              ? 'fs-mobile-navigation-item-active'
              : ''
          }`}
          onClick={() =>
            setMoreOpen(
              (current) =>
                !current,
            )
          }
          aria-expanded={
            moreOpen
          }
        >
          <span className="fs-mobile-navigation-icon">
            {moreOpen ? (
              <X size={19} />
            ) : (
              <MoreHorizontal
                size={19}
              />
            )}
          </span>

          <span>
            More
          </span>
        </button>
      </nav>

      <style>{`
        .fs-mobile-navigation {
          display: none;
        }

        .fs-mobile-more-backdrop {
          position: fixed;
          inset: 0;
          z-index: 998;
          border: 0;
          background: rgba(2, 5, 11, 0.62);
          backdrop-filter: blur(7px);
          -webkit-backdrop-filter: blur(7px);
        }

        .fs-mobile-more-panel {
          position: fixed;
          z-index: 999;
          left: 12px;
          right: 12px;
          bottom: 94px;
          max-height: min(70vh, 520px);
          overflow-y: auto;
          padding: 15px;
          border: 1px solid rgba(111, 139, 202, 0.18);
          border-radius: 20px;
          background:
            linear-gradient(
              145deg,
              rgba(20, 29, 46, 0.98),
              rgba(8, 13, 23, 0.99)
            );
          box-shadow:
            0 30px 90px rgba(0, 0, 0, 0.48);
          backdrop-filter: blur(25px);
          -webkit-backdrop-filter: blur(25px);
          animation: fs-mobile-panel-in 180ms ease-out;
        }

        .fs-mobile-more-header {
          display: flex;
          align-items: center;
          justify-content: space-between;
          margin-bottom: 14px;
          padding: 3px 3px 12px;
          border-bottom: 1px solid rgba(112, 132, 172, 0.08);
        }

        .fs-mobile-more-header div {
          display: flex;
          flex-direction: column;
        }

        .fs-mobile-more-header span {
          color: #61708a;
          font-size: 8px;
          font-weight: 800;
          letter-spacing: 0.15em;
        }

        .fs-mobile-more-header strong {
          margin-top: 3px;
          color: #e5ebf5;
          font-size: 15px;
        }

        .fs-mobile-more-header button {
          width: 34px;
          height: 34px;
          display: grid;
          place-items: center;
          border: 1px solid rgba(112, 132, 172, 0.1);
          border-radius: 10px;
          background: rgba(255, 255, 255, 0.03);
          color: #8592a8;
        }

        .fs-mobile-more-grid {
          display: grid;
          grid-template-columns: repeat(2, minmax(0, 1fr));
          gap: 8px;
        }

        .fs-mobile-more-item {
          position: relative;
          min-height: 78px;
          display: flex;
          flex-direction: column;
          justify-content: space-between;
          padding: 11px;
          border: 1px solid rgba(112, 132, 172, 0.08);
          border-radius: 13px;
          background: rgba(255, 255, 255, 0.018);
          color: #7e8ba0;
          text-decoration: none;
          transition:
            transform 150ms ease,
            border-color 150ms ease,
            background 150ms ease;
        }

        .fs-mobile-more-item:active {
          transform: scale(0.98);
        }

        .fs-mobile-more-item-active {
          border-color: rgba(103, 137, 241, 0.25);
          background: rgba(83, 116, 231, 0.09);
          color: #b9c9ff;
        }

        .fs-mobile-more-item-icon {
          width: 31px;
          height: 31px;
          display: grid;
          place-items: center;
          border-radius: 9px;
          background: rgba(94, 126, 238, 0.07);
          color: #8098ef;
        }

        .fs-mobile-more-item strong {
          margin-top: 9px;
          color: #b3bdcd;
          font-size: 10px;
        }

        .fs-mobile-more-item-arrow {
          position: absolute;
          right: 10px;
          bottom: 9px;
          color: #47556b;
          font-size: 11px;
        }

        .fs-mobile-more-item-active .fs-mobile-more-item-arrow {
          color: #7e96ed;
        }

        @keyframes fs-mobile-panel-in {
          from {
            opacity: 0;
            transform: translateY(12px) scale(0.98);
          }

          to {
            opacity: 1;
            transform: translateY(0) scale(1);
          }
        }

        @media (max-width: 820px) {
          .fs-mobile-navigation {
            position: fixed;
            z-index: 100;
            left: 10px;
            right: 10px;
            bottom: 10px;
            height: 67px;
            display: grid;
            grid-template-columns:
              repeat(4, 1fr)
              0.9fr
              1fr;
            align-items: center;
            gap: 2px;
            padding: 6px;
            box-sizing: border-box;
            border: 1px solid rgba(116, 143, 205, 0.17);
            border-radius: 19px;
            background:
              linear-gradient(
                145deg,
                rgba(17, 25, 40, 0.96),
                rgba(7, 12, 21, 0.98)
              );
            box-shadow:
              0 18px 55px rgba(0, 0, 0, 0.4);
            backdrop-filter: blur(24px);
            -webkit-backdrop-filter: blur(24px);
          }

          .fs-mobile-navigation-item {
            min-width: 0;
            height: 55px;
            display: flex;
            flex-direction: column;
            align-items: center;
            justify-content: center;
            gap: 3px;
            border: 0;
            border-radius: 13px;
            background: transparent;
            color: #59667b;
            text-decoration: none;
            cursor: pointer;
            font: inherit;
            font-size: 7px;
          }

          .fs-mobile-navigation-icon {
            width: 31px;
            height: 27px;
            display: grid;
            place-items: center;
          }

          .fs-mobile-navigation-item-active {
            color: #9fb3ff;
            background: rgba(87, 121, 239, 0.08);
          }

          .fs-mobile-navigation-item-active
            .fs-mobile-navigation-icon {
            color: #829aff;
          }

          .fs-mobile-add-button {
            width: 47px;
            height: 47px;
            justify-self: center;
            display: grid;
            place-items: center;
            border: 0;
            border-radius: 15px;
            background:
              linear-gradient(
                135deg,
                #6179ff,
                #a05cff
              );
            color: white;
            cursor: pointer;
            box-shadow:
              0 9px 25px rgba(92, 102, 255, 0.28);
          }

          .fs-mobile-add-button span {
            display: grid;
            place-items: center;
          }
        }

        @media (min-width: 821px) {
          .fs-mobile-more-panel,
          .fs-mobile-more-backdrop {
            display: none;
          }
        }
      `}</style>
    </>
  );
}