import {
  ChevronDown,
  ChevronRight,
  LogOut,
  Plus,
  Search,
  Settings,
  Sparkles,
  X,
} from 'lucide-react';

import {
  NavLink,
} from 'react-router-dom';

import {
  useState,
} from 'react';

import navigation, {
  secondaryNavigation,
} from '../../constants/navigation.js';

function Sidebar({
  mobileOpen = false,
  onClose,
  onCommandOpen,
}) {
  const [
    workspaceOpen,
    setWorkspaceOpen,
  ] = useState(false);

  return (
    <>
      <div
        className={`fs-sidebar-overlay ${
          mobileOpen
            ? 'fs-sidebar-overlay-visible'
            : ''
        }`}
        onClick={onClose}
        aria-hidden="true"
      />

      <aside
        className={`fs-sidebar ${
          mobileOpen
            ? 'fs-sidebar-mobile-open'
            : ''
        }`}
        aria-label="FinSight main navigation"
      >
        {/* ============================================================
            BRAND
            ============================================================ */}

        <div className="fs-brand">
          <NavLink
            to="/dashboard"
            className="fs-brand-link"
            onClick={onClose}
          >
            <div className="fs-brand-mark">
              <span className="fs-brand-mark-glow" />

              <span className="fs-brand-mark-inner">
                FS
              </span>
            </div>

            <div className="fs-brand-copy">
              <strong className="fs-brand-title">
                FinSight
              </strong>

              <span className="fs-brand-subtitle">
                Financial Intelligence
              </span>
            </div>
          </NavLink>

          <button
            type="button"
            className="fs-sidebar-close"
            onClick={onClose}
            aria-label="Close navigation"
          >
            <X size={17} />
          </button>
        </div>

        {/* ============================================================
            WORKSPACE
            ============================================================ */}

        <div className="fs-workspace-wrapper">
          <button
            type="button"
            className="fs-workspace-selector"
            onClick={() =>
              setWorkspaceOpen(
                (current) => !current,
              )
            }
            aria-expanded={workspaceOpen}
          >
            <span className="fs-workspace-avatar">
              DK
            </span>

            <span className="fs-workspace-info">
              <small>
                WORKSPACE
              </small>

              <strong>
                Personal Finance
              </strong>
            </span>

            <ChevronDown
              size={14}
              className={
                workspaceOpen
                  ? 'fs-workspace-chevron-open'
                  : ''
              }
            />
          </button>

          {workspaceOpen && (
            <div className="fs-workspace-menu">
              <button
                type="button"
                className="fs-workspace-menu-current"
              >
                <span className="fs-workspace-menu-avatar">
                  DK
                </span>

                <span>
                  <strong>
                    Personal Finance
                  </strong>

                  <small>
                    Active workspace
                  </small>
                </span>

                <span className="fs-active-indicator" />
              </button>

              <div className="fs-workspace-divider" />

              <button
                type="button"
                className="fs-workspace-create"
              >
                <Plus size={14} />

                <span>
                  Create workspace
                </span>
              </button>
            </div>
          )}
        </div>

        {/* ============================================================
            SEARCH
            ============================================================ */}

        <button
          type="button"
          className="fs-sidebar-search"
          onClick={onCommandOpen}
        >
          <Search size={16} />

          <span>
            Search anything...
          </span>

          <kbd>
            ⌘K
          </kbd>
        </button>

        {/* ============================================================
            NAVIGATION
            ============================================================ */}

        <nav
          className="fs-navigation"
          aria-label="Main navigation"
        >
          {navigation.map(
            (section) => (
              <div
                className="fs-navigation-section"
                key={section.id}
              >
                <div className="fs-navigation-section-title">
                  {section.label}
                </div>

                <div className="fs-navigation-items">
                  {section.items.map(
                    (item) => {
                      const Icon =
                        item.icon;

                      return (
                        <NavLink
                          key={item.id}
                          to={item.path}
                          onClick={onClose}
                          className={({
                            isActive,
                          }) =>
                            `fs-navigation-item ${
                              isActive
                                ? 'fs-navigation-item-active'
                                : ''
                            }`
                          }
                        >
                          <span className="fs-navigation-icon">
                            <Icon
                              size={17}
                              strokeWidth={1.8}
                            />
                          </span>

                          <span className="fs-navigation-label">
                            {item.label}
                          </span>

                          {item.badge && (
                            <span className="fs-navigation-badge">
                              <Sparkles
                                size={10}
                              />

                              {item.badge}
                            </span>
                          )}

                          <ChevronRight
                            size={13}
                            className="fs-navigation-arrow"
                          />
                        </NavLink>
                      );
                    },
                  )}
                </div>
              </div>
            ),
          )}
        </nav>

        {/* ============================================================
            INTELLIGENCE
            ============================================================ */}

        <div className="fs-sidebar-intelligence">
          <div className="fs-intelligence-orb">
            <Sparkles size={16} />
          </div>

          <div className="fs-intelligence-content">
            <div className="fs-intelligence-heading">
              <strong>
                FinSight Intelligence
              </strong>

              <span>
                AI
              </span>
            </div>

            <p>
              Discover spending patterns,
              trends and financial
              opportunities.
            </p>

            <NavLink
              to="/analytics"
              onClick={onClose}
              className="fs-intelligence-link"
            >
              Explore insights

              <ChevronRight size={13} />
            </NavLink>
          </div>
        </div>

        {/* ============================================================
            FOOTER
            ============================================================ */}

        <div className="fs-sidebar-footer">
          <div className="fs-sidebar-footer-links">
            {secondaryNavigation.map(
              (item) => {
                const Icon =
                  item.icon ??
                  Settings;

                return (
                  <NavLink
                    key={item.id}
                    to={item.path}
                    onClick={onClose}
                    className={({
                      isActive,
                    }) =>
                      `fs-footer-navigation-link ${
                        isActive
                          ? 'fs-footer-navigation-link-active'
                          : ''
                      }`
                    }
                  >
                    <Icon size={16} />

                    <span>
                      {item.label}
                    </span>
                  </NavLink>
                );
              },
            )}
          </div>

          <div className="fs-sidebar-user">
            <div className="fs-sidebar-user-avatar">
              DK
            </div>

            <div className="fs-sidebar-user-info">
              <strong>
                Personal Profile
              </strong>

              <span>
                Finance workspace
              </span>
            </div>

            <button
              type="button"
              className="fs-sidebar-user-menu"
              aria-label="Profile options"
            >
              <ChevronDown size={14} />
            </button>
          </div>

          <button
            type="button"
            className="fs-sidebar-logout"
          >
            <LogOut size={15} />

            <span>
              Sign out
            </span>
          </button>
        </div>
      </aside>
    </>
  );
}

export default Sidebar;