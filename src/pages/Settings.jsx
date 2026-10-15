import {
  Activity,
  Bell,
  Check,
  CheckCircle2,
  ChevronRight,
  Database,
  Gauge,
  Globe2,
  Info,
  Keyboard,
  Monitor,
  Moon,
  Palette,
  RefreshCw,
  Server,
  Shield,
  SlidersHorizontal,
  Sparkles,
  Sun,
  Terminal,
  Wifi,
  XCircle,
  Zap,
} from 'lucide-react';

import {
  useEffect,
  useMemo,
  useState,
} from 'react';

const API_BASE_URL =
  import.meta.env.VITE_API_BASE_URL ||
  'http://localhost:5000/api';

const USER_ID =
  import.meta.env.VITE_FINSIGHT_USER_ID;

const STORAGE_KEY =
  'finsight-ui-settings';

const DEFAULT_SETTINGS = {
  appearance: 'dark',
  density: 'comfortable',
  accent: 'violet',
  animations: true,
  reducedMotion: false,
  notifications: true,
};

const loadSettings = () => {
  try {
    const stored =
      localStorage.getItem(
        STORAGE_KEY,
      );

    if (!stored) {
      return DEFAULT_SETTINGS;
    }

    return {
      ...DEFAULT_SETTINGS,
      ...JSON.parse(stored),
    };
  } catch {
    return DEFAULT_SETTINGS;
  }
};

function SectionTitle({
  eyebrow,
  title,
  description,
  icon: Icon,
}) {
  return (
    <div className="fs-settings-section-title">
      <div className="fs-settings-section-icon">
        <Icon size={17} />
      </div>

      <div>
        <span>{eyebrow}</span>

        <h2>{title}</h2>

        <p>{description}</p>
      </div>
    </div>
  );
}

function SettingRow({
  icon: Icon,
  title,
  description,
  children,
}) {
  return (
    <div className="fs-setting-row">
      <div className="fs-setting-row-icon">
        <Icon size={16} />
      </div>

      <div className="fs-setting-copy">
        <strong>{title}</strong>

        <span>{description}</span>
      </div>

      <div className="fs-setting-control">
        {children}
      </div>
    </div>
  );
}

function Toggle({
  checked,
  onChange,
}) {
  return (
    <button
      type="button"
      className={`fs-toggle ${
        checked
          ? 'is-active'
          : ''
      }`}
      onClick={() =>
        onChange(!checked)
      }
      aria-pressed={checked}
    >
      <span />
    </button>
  );
}

function Choice({
  active,
  onClick,
  children,
}) {
  return (
    <button
      type="button"
      className={`fs-choice ${
        active
          ? 'is-active'
          : ''
      }`}
      onClick={onClick}
    >
      {active && (
        <Check size={12} />
      )}

      {children}
    </button>
  );
}

function StatusDot({
  online,
}) {
  return (
    <span
      className={`fs-status-dot ${
        online
          ? 'online'
          : 'offline'
      }`}
    />
  );
}

export default function Settings() {
  const [
    settings,
    setSettings,
  ] = useState(loadSettings);

  const [
    backendStatus,
    setBackendStatus,
  ] = useState({
    loading: true,
    online: false,
    database: false,
    message:
      'Checking connection...',
    serverTime: null,
    schema: null,
  });

  const [
    lastChecked,
    setLastChecked,
  ] = useState(null);

  const [
    saved,
    setSaved,
  ] = useState(false);

  const [
    activePanel,
    setActivePanel,
  ] = useState(
    'appearance',
  );

  const updateSetting = (
    key,
    value,
  ) => {
    setSettings((current) => ({
      ...current,
      [key]: value,
    }));

    setSaved(false);
  };

  useEffect(() => {
    try {
      localStorage.setItem(
        STORAGE_KEY,
        JSON.stringify(settings),
      );
    } catch {
      // Browser storage can be unavailable.
    }
  }, [settings]);

  useEffect(() => {
    document.documentElement.dataset
      .finsightTheme =
      settings.appearance;

    document.documentElement.dataset
      .finsightDensity =
      settings.density;

    document.documentElement.dataset
      .finsightAccent =
      settings.accent;

    document.documentElement.dataset
      .finsightMotion =
      settings.reducedMotion
        ? 'reduced'
        : settings.animations
          ? 'full'
          : 'minimal';
  }, [settings]);

  const checkBackend = async () => {
    setBackendStatus((current) => ({
      ...current,
      loading: true,
      message:
        'Checking FinSight backend...',
    }));

    try {
      const response =
        await fetch(
          `${API_BASE_URL}/health`,
          {
            cache: 'no-store',
          },
        );

      const data =
        await response.json();

      if (!response.ok) {
        throw new Error(
          data?.message ||
            `Backend returned ${response.status}`,
        );
      }

      setBackendStatus({
        loading: false,
        online: true,
        database:
          Boolean(
            data?.database,
          ),
        message:
          data?.message ||
          'Backend connection is healthy.',
        serverTime:
          data?.database
            ?.server_time ||
          null,
        schema:
          data?.database
            ?.current_schema ||
          null,
      });

      setLastChecked(
        new Date(),
      );
    } catch (error) {
      setBackendStatus({
        loading: false,
        online: false,
        database: false,
        message:
          error?.message ||
          'Unable to connect to the FinSight backend.',
        serverTime: null,
        schema: null,
      });

      setLastChecked(
        new Date(),
      );
    }
  };

  useEffect(() => {
    checkBackend();
  }, []);

  const apiHost = useMemo(() => {
    try {
      return new URL(
        API_BASE_URL,
      ).host;
    } catch {
      return API_BASE_URL;
    }
  }, []);

  const userConfigured =
    Boolean(USER_ID);

  const panels = [
    {
      id: 'appearance',
      label: 'Appearance',
      icon: Palette,
    },
    {
      id: 'experience',
      label: 'Experience',
      icon: SlidersHorizontal,
    },
    {
      id: 'connection',
      label: 'Connection',
      icon: Server,
    },
    {
      id: 'security',
      label: 'Security',
      icon: Shield,
    },
    {
      id: 'shortcuts',
      label: 'Shortcuts',
      icon: Keyboard,
    },
  ];

  return (
    <main
      className={`fs-settings-page ${
        settings.reducedMotion
          ? 'motion-reduced'
          : ''
      }`}
    >
      <header className="fs-settings-hero">
        <div>
          <div className="fs-settings-eyebrow">
            <span />
            FINANCE INTELLIGENCE
            <b>
              <Activity size={10} />
              SYSTEM SETTINGS
            </b>
          </div>

          <h1>
            Control your
            <span>
              FinSight workspace.
            </span>
          </h1>

          <p>
            Configure the interface,
            interaction behavior, and
            inspect the live connection
            between this workspace,
            the FinSight API, and
            PostgreSQL.
          </p>
        </div>

        <div className="fs-settings-hero-status">
          <div className="fs-hero-status-ring">
            {backendStatus.loading ? (
              <RefreshCw
                size={25}
                className="fs-spin"
              />
            ) : backendStatus.online ? (
              <CheckCircle2
                size={27}
              />
            ) : (
              <XCircle
                size={27}
              />
            )}
          </div>

          <div>
            <span>
              SYSTEM STATUS
            </span>

            <strong>
              {backendStatus.loading
                ? 'Checking'
                : backendStatus.online
                  ? 'Operational'
                  : 'Offline'}
            </strong>

            <small>
              {backendStatus.online
                ? 'API + database reachable'
                : 'Connection requires attention'}
            </small>
          </div>
        </div>
      </header>

      <div className="fs-settings-layout">
        <aside className="fs-settings-sidebar">
          <div className="fs-sidebar-label">
            WORKSPACE
          </div>

          <nav>
            {panels.map(
              (panel) => {
                const Icon =
                  panel.icon;

                return (
                  <button
                    type="button"
                    key={panel.id}
                    className={
                      activePanel ===
                      panel.id
                        ? 'active'
                        : ''
                    }
                    onClick={() =>
                      setActivePanel(
                        panel.id,
                      )
                    }
                  >
                    <Icon size={16} />

                    <span>
                      {panel.label}
                    </span>

                    <ChevronRight
                      size={14}
                    />
                  </button>
                );
              },
            )}
          </nav>

          <div className="fs-sidebar-card">
            <div className="fs-sidebar-card-icon">
              <Sparkles size={16} />
            </div>

            <strong>
              FinSight
            </strong>

            <span>
              Financial intelligence
              workspace
            </span>

            <div className="fs-sidebar-version">
              <span>
                Frontend
              </span>

              <b>
                Vite + React
              </b>
            </div>
          </div>
        </aside>

        <section className="fs-settings-content">
          {activePanel ===
            'appearance' && (
            <>
              <SectionTitle
                eyebrow="VISUAL SYSTEM"
                title="Appearance"
                description="Tune the visual language of your FinSight workspace."
                icon={Palette}
              />

              <div className="fs-settings-card">
                <SettingRow
                  icon={Monitor}
                  title="Interface theme"
                  description="Choose how the financial workspace is rendered."
                >
                  <div className="fs-choice-group">
                    <Choice
                      active={
                        settings.appearance ===
                        'dark'
                      }
                      onClick={() =>
                        updateSetting(
                          'appearance',
                          'dark',
                        )
                      }
                    >
                      <Moon
                        size={12}
                      />
                      Dark
                    </Choice>

                    <Choice
                      active={
                        settings.appearance ===
                        'light'
                      }
                      onClick={() =>
                        updateSetting(
                          'appearance',
                          'light',
                        )
                      }
                    >
                      <Sun
                        size={12}
                      />
                      Light
                    </Choice>
                  </div>
                </SettingRow>

                <SettingRow
                  icon={Palette}
                  title="Accent system"
                  description="Set the highlight color used across interactive surfaces."
                >
                  <div className="fs-accent-group">
                    {[
                      {
                        id: 'violet',
                        className:
                          'violet',
                      },
                      {
                        id: 'blue',
                        className:
                          'blue',
                      },
                      {
                        id: 'green',
                        className:
                          'green',
                      },
                      {
                        id: 'rose',
                        className:
                          'rose',
                      },
                    ].map(
                      (accent) => (
                        <button
                          key={
                            accent.id
                          }
                          type="button"
                          aria-label={`${accent.id} accent`}
                          className={`fs-accent ${
                            accent.className
                          } ${
                            settings.accent ===
                            accent.id
                              ? 'active'
                              : ''
                          }`}
                          onClick={() =>
                            updateSetting(
                              'accent',
                              accent.id,
                            )
                          }
                        >
                          {settings.accent ===
                            accent.id && (
                            <Check
                              size={13}
                            />
                          )}
                        </button>
                      ),
                    )}
                  </div>
                </SettingRow>

                <SettingRow
                  icon={Gauge}
                  title="Interface density"
                  description="Control spacing throughout tables, cards, and panels."
                >
                  <div className="fs-choice-group">
                    <Choice
                      active={
                        settings.density ===
                        'compact'
                      }
                      onClick={() =>
                        updateSetting(
                          'density',
                          'compact',
                        )
                      }
                    >
                      Compact
                    </Choice>

                    <Choice
                      active={
                        settings.density ===
                        'comfortable'
                      }
                      onClick={() =>
                        updateSetting(
                          'density',
                          'comfortable',
                        )
                      }
                    >
                      Comfortable
                    </Choice>

                    <Choice
                      active={
                        settings.density ===
                        'spacious'
                      }
                      onClick={() =>
                        updateSetting(
                          'density',
                          'spacious',
                        )
                      }
                    >
                      Spacious
                    </Choice>
                  </div>
                </SettingRow>
              </div>

              <div className="fs-preview-card">
                <div className="fs-preview-header">
                  <div>
                    <span>
                      LIVE PREVIEW
                    </span>

                    <strong>
                      Workspace visual
                      system
                    </strong>
                  </div>

                  <Sparkles size={16} />
                </div>

                <div className="fs-preview-dashboard">
                  <div className="fs-preview-stat">
                    <span>
                      NET WORTH
                    </span>

                    <strong>
                      ₹8,42,650
                    </strong>

                    <small>
                      +8.42%
                    </small>
                  </div>

                  <div className="fs-preview-chart">
                    <div />
                    <div />
                    <div />
                    <div />
                    <div />
                    <div />
                    <div />
                    <div />
                  </div>

                  <div className="fs-preview-side">
                    <span>
                      FINANCIAL HEALTH
                    </span>

                    <strong>
                      82
                    </strong>

                    <div>
                      <i />
                      Strong
                    </div>
                  </div>
                </div>
              </div>
            </>
          )}

          {activePanel ===
            'experience' && (
            <>
              <SectionTitle
                eyebrow="INTERACTION"
                title="Experience"
                description="Control motion, alerts, and workspace behavior."
                icon={
                  SlidersHorizontal
                }
              />

              <div className="fs-settings-card">
                <SettingRow
                  icon={Zap}
                  title="Interface animations"
                  description="Enable transitions, hover effects, and workspace motion."
                >
                  <Toggle
                    checked={
                      settings.animations
                    }
                    onChange={(value) =>
                      updateSetting(
                        'animations',
                        value,
                      )
                    }
                  />
                </SettingRow>

                <SettingRow
                  icon={Activity}
                  title="Reduced motion"
                  description="Reduce visual movement for a calmer workspace."
                >
                  <Toggle
                    checked={
                      settings.reducedMotion
                    }
                    onChange={(value) =>
                      updateSetting(
                        'reducedMotion',
                        value,
                      )
                    }
                  />
                </SettingRow>

                <SettingRow
                  icon={Bell}
                  title="Workspace notifications"
                  description="Allow FinSight interface notifications and status messages."
                >
                  <Toggle
                    checked={
                      settings.notifications
                    }
                    onChange={(value) =>
                      updateSetting(
                        'notifications',
                        value,
                      )
                    }
                  />
                </SettingRow>

                <SettingRow
                  icon={Globe2}
                  title="Regional format"
                  description="Financial amounts are currently formatted for the Indian locale."
                >
                  <div className="fs-static-value">
                    <span>
                      INR
                    </span>

                    <b>
                      India
                    </b>
                  </div>
                </SettingRow>
              </div>

              <div className="fs-info-banner">
                <Info size={16} />

                <div>
                  <strong>
                    Preference storage
                  </strong>

                  <span>
                    Interface preferences are
                    stored locally in this
                    browser. No fake backend
                    settings endpoint is used.
                  </span>
                </div>
              </div>
            </>
          )}

          {activePanel ===
            'connection' && (
            <>
              <SectionTitle
                eyebrow="INFRASTRUCTURE"
                title="Connection"
                description="Inspect the actual FinSight API and PostgreSQL connection."
                icon={Server}
              />

              <div className="fs-connection-grid">
                <div className="fs-connection-card">
                  <div className="fs-connection-top">
                    <div className="fs-connection-icon">
                      <Server size={18} />
                    </div>

                    <StatusDot
                      online={
                        backendStatus.online
                      }
                    />
                  </div>

                  <span>
                    API SERVER
                  </span>

                  <strong>
                    {apiHost}
                  </strong>

                  <small>
                    {backendStatus.online
                      ? 'Reachable'
                      : 'Unavailable'}
                  </small>
                </div>

                <div className="fs-connection-card">
                  <div className="fs-connection-top">
                    <div className="fs-connection-icon database">
                      <Database
                        size={18}
                      />
                    </div>

                    <StatusDot
                      online={
                        backendStatus.database
                      }
                    />
                  </div>

                  <span>
                    DATABASE
                  </span>

                  <strong>
                    PostgreSQL
                  </strong>

                  <small>
                    {backendStatus.database
                      ? 'Connection healthy'
                      : 'Not confirmed'}
                  </small>
                </div>

                <div className="fs-connection-card">
                  <div className="fs-connection-top">
                    <div className="fs-connection-icon network">
                      <Wifi size={18} />
                    </div>

                    <StatusDot
                      online={
                        userConfigured
                      }
                    />
                  </div>

                  <span>
                    USER CONTEXT
                  </span>

                  <strong>
                    {userConfigured
                      ? 'Configured'
                      : 'Missing'}
                  </strong>

                  <small>
                    VITE_FINSIGHT_USER_ID
                  </small>
                </div>
              </div>

              <div className="fs-settings-card fs-health-card">
                <div className="fs-health-heading">
                  <div>
                    <span>
                      LIVE HEALTH CHECK
                    </span>

                    <h3>
                      FinSight infrastructure
                    </h3>
                  </div>

                  <button
                    type="button"
                    className="fs-check-button"
                    onClick={
                      checkBackend
                    }
                    disabled={
                      backendStatus.loading
                    }
                  >
                    <RefreshCw
                      size={13}
                      className={
                        backendStatus.loading
                          ? 'fs-spin'
                          : ''
                      }
                    />

                    Check now
                  </button>
                </div>

                <div
                  className={`fs-health-result ${
                    backendStatus.online
                      ? 'healthy'
                      : 'failed'
                  }`}
                >
                  {backendStatus.online ? (
                    <CheckCircle2
                      size={21}
                    />
                  ) : (
                    <XCircle
                      size={21}
                    />
                  )}

                  <div>
                    <strong>
                      {backendStatus.online
                        ? 'Backend and database are responding'
                        : 'Backend connection could not be verified'}
                    </strong>

                    <span>
                      {backendStatus.message}
                    </span>
                  </div>
                </div>

                <div className="fs-health-details">
                  <div>
                    <span>
                      API BASE
                    </span>

                    <strong>
                      {API_BASE_URL}
                    </strong>
                  </div>

                  <div>
                    <span>
                      DATABASE SCHEMA
                    </span>

                    <strong>
                      {backendStatus.schema ||
                        'Not reported'}
                    </strong>
                  </div>

                  <div>
                    <span>
                      SERVER TIME
                    </span>

                    <strong>
                      {backendStatus.serverTime
                        ? new Date(
                            backendStatus.serverTime,
                          ).toLocaleString(
                            'en-IN',
                          )
                        : 'Not reported'}
                    </strong>
                  </div>

                  <div>
                    <span>
                      LAST CHECK
                    </span>

                    <strong>
                      {lastChecked
                        ? lastChecked.toLocaleTimeString(
                            'en-IN',
                          )
                        : 'Checking'}
                    </strong>
                  </div>
                </div>
              </div>

              <div className="fs-terminal-card">
                <div className="fs-terminal-top">
                  <div>
                    <Terminal size={15} />
                    <span>
                      SYSTEM DIAGNOSTICS
                    </span>
                  </div>

                  <div className="fs-terminal-lights">
                    <i />
                    <i />
                    <i />
                  </div>
                </div>

                <div className="fs-terminal-body">
                  <p>
                    <b>
                      $
                    </b>{' '}
                    FinSight connection
                    diagnostic
                  </p>

                  <p>
                    <em>
                      API
                    </em>{' '}
                    {backendStatus.online
                      ? '✓ reachable'
                      : '✗ unavailable'}
                  </p>

                  <p>
                    <em>
                      PostgreSQL
                    </em>{' '}
                    {backendStatus.database
                      ? '✓ connected'
                      : '✗ not confirmed'}
                  </p>

                  <p>
                    <em>
                      Schema
                    </em>{' '}
                    {backendStatus.schema ||
                      'not reported'}
                  </p>

                  <p>
                    <em>
                      User context
                    </em>{' '}
                    {userConfigured
                      ? '✓ configured'
                      : '✗ missing'}
                  </p>
                </div>
              </div>
            </>
          )}

          {activePanel ===
            'security' && (
            <>
              <SectionTitle
                eyebrow="PROTECTION"
                title="Security"
                description="Review the security boundaries currently exposed by this workspace."
                icon={Shield}
              />

              <div className="fs-security-banner">
                <div className="fs-security-shield">
                  <Shield size={23} />
                </div>

                <div>
                  <span>
                    CURRENT MODEL
                  </span>

                  <strong>
                    Environment-driven
                    configuration
                  </strong>

                  <p>
                    Frontend configuration is
                    read from Vite environment
                    variables. Secrets should
                    remain server-side and must
                    never be embedded in React
                    source code.
                  </p>
                </div>
              </div>

              <div className="fs-settings-card">
                <div className="fs-security-item">
                  <div>
                    <CheckCircle2 size={16} />
                  </div>

                  <section>
                    <strong>
                      API base URL
                    </strong>

                    <span>
                      Loaded from
                      VITE_API_BASE_URL.
                    </span>
                  </section>

                  <b>
                    Environment
                  </b>
                </div>

                <div className="fs-security-item">
                  <div>
                    <CheckCircle2 size={16} />
                  </div>

                  <section>
                    <strong>
                      User context
                    </strong>

                    <span>
                      Loaded from
                      VITE_FINSIGHT_USER_ID.
                    </span>
                  </section>

                  <b>
                    Environment
                  </b>
                </div>

                <div className="fs-security-item">
                  <div>
                    <CheckCircle2 size={16} />
                  </div>

                  <section>
                    <strong>
                      Database credentials
                    </strong>

                    <span>
                      Must remain inside the
                      backend environment.
                    </span>
                  </section>

                  <b>
                    Server-side
                  </b>
                </div>

                <div className="fs-security-item">
                  <div>
                    <CheckCircle2 size={16} />
                  </div>

                  <section>
                    <strong>
                      Browser storage
                    </strong>

                    <span>
                      Stores interface
                      preferences only.
                    </span>
                  </section>

                  <b>
                    Local only
                  </b>
                </div>
              </div>

              <div className="fs-warning-banner">
                <Info size={16} />

                <div>
                  <strong>
                    No pretend security controls
                  </strong>

                  <span>
                    This screen intentionally does
                    not display fake password,
                    authentication, session, or
                    account-management controls
                    because the current FinSight
                    backend does not expose those
                    mutation/authentication APIs.
                  </span>
                </div>
              </div>
            </>
          )}

          {activePanel ===
            'shortcuts' && (
            <>
              <SectionTitle
                eyebrow="PRODUCTIVITY"
                title="Shortcuts"
                description="Reference the keyboard and navigation patterns available in the workspace."
                icon={Keyboard}
              />

              <div className="fs-shortcuts-grid">
                <div className="fs-shortcut-card">
                  <div>
                    <Terminal size={17} />
                  </div>

                  <span>
                    SEARCH
                  </span>

                  <strong>
                    Search workspace
                  </strong>

                  <kbd>
                    Ctrl
                    <i>
                      +
                    </i>
                    K
                  </kbd>
                </div>

                <div className="fs-shortcut-card">
                  <div>
                    <Zap size={17} />
                  </div>

                  <span>
                    NAVIGATION
                  </span>

                  <strong>
                    Open command actions
                  </strong>

                  <kbd>
                    /
                  </kbd>
                </div>

                <div className="fs-shortcut-card">
                  <div>
                    <RefreshCw size={17} />
                  </div>

                  <span>
                    DATA
                  </span>

                  <strong>
                    Refresh active data
                  </strong>

                  <kbd>
                    R
                  </kbd>
                </div>

                <div className="fs-shortcut-card">
                  <div>
                    <Monitor size={17} />
                  </div>

                  <span>
                    DISPLAY
                  </span>

                  <strong>
                    Workspace navigation
                  </strong>

                  <kbd>
                    Alt
                    <i>
                      +
                    </i>
                    1–9
                  </kbd>
                </div>
              </div>

              <div className="fs-info-banner">
                <Keyboard size={16} />

                <div>
                  <strong>
                    Keyboard layer
                  </strong>

                  <span>
                    These are interface-level
                    shortcuts and do not modify
                    financial records.
                  </span>
                </div>
              </div>
            </>
          )}

          <footer className="fs-settings-footer">
            <div>
              <div className="fs-footer-check">
                <Check size={13} />
              </div>

              <div>
                <strong>
                  Preferences active
                </strong>

                <span>
                  Interface configuration is
                  automatically stored locally.
                </span>
              </div>
            </div>

            <button
              type="button"
              onClick={() => {
                setSettings(
                  DEFAULT_SETTINGS,
                );
                setSaved(true);
              }}
            >
              Reset interface
            </button>

            {saved && (
              <span className="fs-saved">
                <Check size={12} />
                Reset applied
              </span>
            )}
          </footer>
        </section>
      </div>

      <style>{`
        .fs-settings-page {
          width: 100%;
          min-height: 100%;
          padding: 28px 0 80px;
          color: #e8edf6;
        }

        .fs-settings-hero {
          position: relative;
          overflow: hidden;
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 30px;
          min-height: 255px;
          padding: 38px 40px;
          border: 1px solid rgba(109,136,201,.12);
          border-radius: 23px;
          background:
            radial-gradient(circle at 80% 35%, rgba(132,90,255,.11), transparent 28%),
            radial-gradient(circle at 20% 110%, rgba(51,208,166,.07), transparent 32%),
            linear-gradient(135deg, rgba(14,22,37,.96), rgba(8,13,23,.98));
          box-shadow: 0 25px 80px rgba(0,0,0,.16);
        }

        .fs-settings-hero::before {
          content: "";
          position: absolute;
          inset: 0;
          pointer-events: none;
          opacity: .25;
          background-image:
            linear-gradient(rgba(119,145,207,.035) 1px, transparent 1px),
            linear-gradient(90deg, rgba(119,145,207,.035) 1px, transparent 1px);
          background-size: 40px 40px;
        }

        .fs-settings-hero > div:first-child {
          position: relative;
          z-index: 2;
        }

        .fs-settings-eyebrow {
          display: flex;
          align-items: center;
          gap: 8px;
          color: #7183aa;
          font-size: 8px;
          font-weight: 850;
          letter-spacing: .17em;
        }

        .fs-settings-eyebrow > span {
          width: 25px;
          height: 1px;
          background: #9c78ff;
          box-shadow: 0 0 14px rgba(156,120,255,.7);
        }

        .fs-settings-eyebrow b {
          display: inline-flex;
          align-items: center;
          gap: 5px;
          margin-left: 6px;
          padding: 5px 7px;
          border: 1px solid rgba(160,123,255,.14);
          border-radius: 999px;
          color: #a88bff;
          background: rgba(143,100,255,.035);
          font-size: 7px;
          letter-spacing: .08em;
        }

        .fs-settings-hero h1 {
          max-width: 680px;
          margin: 13px 0 12px;
          font-size: clamp(34px, 4vw, 58px);
          line-height: .98;
          letter-spacing: -.055em;
          font-weight: 820;
        }

        .fs-settings-hero h1 span {
          display: block;
          background: linear-gradient(110deg, #a98aff, #6ccfc0);
          -webkit-background-clip: text;
          background-clip: text;
          color: transparent;
        }

        .fs-settings-hero p {
          max-width: 590px;
          margin: 0;
          color: #69768c;
          font-size: 11px;
          line-height: 1.75;
        }

        .fs-settings-hero-status {
          position: relative;
          z-index: 2;
          display: flex;
          align-items: center;
          gap: 14px;
          min-width: 220px;
          padding: 17px;
          border: 1px solid rgba(110,139,202,.12);
          border-radius: 16px;
          background: rgba(5,10,18,.46);
          backdrop-filter: blur(12px);
        }

        .fs-hero-status-ring {
          width: 52px;
          height: 52px;
          display: grid;
          place-items: center;
          flex: 0 0 auto;
          border: 1px solid rgba(78,210,168,.17);
          border-radius: 50%;
          color: #53d1a5;
          background: rgba(55,211,165,.04);
          box-shadow: 0 0 30px rgba(55,211,165,.06);
        }

        .fs-settings-hero-status > div:last-child > span {
          display: block;
          color: #53627b;
          font-size: 7px;
          font-weight: 850;
          letter-spacing: .13em;
        }

        .fs-settings-hero-status strong {
          display: block;
          margin-top: 3px;
          color: #dfe7f2;
          font-size: 14px;
        }

        .fs-settings-hero-status small {
          display: block;
          margin-top: 3px;
          color: #5b6a80;
          font-size: 7px;
        }

        .fs-settings-layout {
          display: grid;
          grid-template-columns: 205px minmax(0, 1fr);
          gap: 16px;
          margin-top: 16px;
        }

        .fs-settings-sidebar {
          align-self: start;
          position: sticky;
          top: 15px;
          padding: 11px;
          border: 1px solid rgba(109,136,198,.09);
          border-radius: 16px;
          background: rgba(10,16,27,.72);
        }

        .fs-sidebar-label {
          padding: 8px 10px;
          color: #4e5c72;
          font-size: 7px;
          font-weight: 850;
          letter-spacing: .13em;
        }

        .fs-settings-sidebar nav {
          display: grid;
          gap: 3px;
        }

        .fs-settings-sidebar nav button {
          width: 100%;
          display: flex;
          align-items: center;
          gap: 9px;
          padding: 10px;
          border: 1px solid transparent;
          border-radius: 9px;
          color: #627087;
          background: transparent;
          cursor: pointer;
          text-align: left;
          font-size: 8px;
          transition: .18s ease;
        }

        .fs-settings-sidebar nav button svg:last-child {
          margin-left: auto;
          opacity: 0;
        }

        .fs-settings-sidebar nav button:hover {
          color: #aebbd0;
          background: rgba(255,255,255,.02);
        }

        .fs-settings-sidebar nav button.active {
          border-color: rgba(130,100,232,.13);
          color: #ddd8ff;
          background: linear-gradient(90deg, rgba(121,91,220,.13), rgba(121,91,220,.025));
        }

        .fs-settings-sidebar nav button.active svg:last-child {
          opacity: .65;
          color: #a88dff;
        }

        .fs-settings-sidebar nav button.active > svg:first-child {
          color: #a98bff;
        }

        .fs-sidebar-card {
          margin: 16px 2px 2px;
          padding: 13px;
          border: 1px solid rgba(109,136,198,.08);
          border-radius: 11px;
          background: rgba(255,255,255,.015);
        }

        .fs-sidebar-card-icon {
          width: 31px;
          height: 31px;
          display: grid;
          place-items: center;
          border-radius: 8px;
          color: #a78aff;
          background: rgba(147,102,255,.07);
        }

        .fs-sidebar-card strong {
          display: block;
          margin-top: 10px;
          color: #b7c2d4;
          font-size: 10px;
        }

        .fs-sidebar-card > span {
          display: block;
          margin-top: 3px;
          color: #4e5d73;
          font-size: 7px;
        }

        .fs-sidebar-version {
          display: flex;
          justify-content: space-between;
          margin-top: 12px;
          padding-top: 9px;
          border-top: 1px solid rgba(110,133,175,.06);
          font-size: 6px;
        }

        .fs-sidebar-version span {
          color: #47556a;
        }

        .fs-sidebar-version b {
          color: #697892;
        }

        .fs-settings-content {
          min-width: 0;
        }

        .fs-settings-section-title {
          display: flex;
          align-items: flex-start;
          gap: 12px;
          margin-bottom: 12px;
        }

        .fs-settings-section-icon {
          width: 36px;
          height: 36px;
          display: grid;
          place-items: center;
          flex: 0 0 auto;
          border: 1px solid rgba(132,103,234,.13);
          border-radius: 9px;
          color: #a48aff;
          background: rgba(135,95,230,.045);
        }

        .fs-settings-section-title span {
          color: #61739b;
          font-size: 7px;
          font-weight: 850;
          letter-spacing: .14em;
        }

        .fs-settings-section-title h2 {
          margin: 4px 0 2px;
          color: #e1e7f0;
          font-size: 19px;
          letter-spacing: -.035em;
        }

        .fs-settings-section-title p {
          margin: 0;
          color: #59677d;
          font-size: 8px;
        }

        .fs-settings-card {
          overflow: hidden;
          border: 1px solid rgba(109,136,198,.09);
          border-radius: 15px;
          background: rgba(10,16,27,.72);
        }

        .fs-setting-row {
          min-height: 76px;
          display: grid;
          grid-template-columns: 38px minmax(0, 1fr) auto;
          align-items: center;
          gap: 12px;
          padding: 12px 17px;
          border-bottom: 1px solid rgba(109,133,176,.055);
        }

        .fs-setting-row:last-child {
          border-bottom: 0;
        }

        .fs-setting-row-icon {
          width: 34px;
          height: 34px;
          display: grid;
          place-items: center;
          border: 1px solid rgba(110,138,201,.08);
          border-radius: 9px;
          color: #7384a2;
          background: rgba(255,255,255,.018);
        }

        .fs-setting-copy strong {
          display: block;
          color: #bac5d5;
          font-size: 9px;
        }

        .fs-setting-copy span {
          display: block;
          max-width: 480px;
          margin-top: 3px;
          color: #56647a;
          font-size: 7px;
          line-height: 1.5;
        }

        .fs-setting-control {
          display: flex;
          justify-content: flex-end;
        }

        .fs-toggle {
          position: relative;
          width: 39px;
          height: 22px;
          padding: 3px;
          border: 1px solid rgba(111,137,198,.13);
          border-radius: 999px;
          background: rgba(255,255,255,.025);
          cursor: pointer;
          transition: .2s ease;
        }

        .fs-toggle span {
          display: block;
          width: 14px;
          height: 14px;
          border-radius: 50%;
          background: #647187;
          transition: .2s ease;
        }

        .fs-toggle.is-active {
          border-color: rgba(151,112,255,.35);
          background: rgba(130,90,244,.22);
        }

        .fs-toggle.is-active span {
          transform: translateX(16px);
          background: #a78aff;
          box-shadow: 0 0 10px rgba(167,138,255,.5);
        }

        .fs-choice-group {
          display: flex;
          align-items: center;
          gap: 4px;
          padding: 3px;
          border: 1px solid rgba(109,136,198,.08);
          border-radius: 9px;
          background: rgba(255,255,255,.015);
        }

        .fs-choice {
          min-height: 27px;
          display: inline-flex;
          align-items: center;
          justify-content: center;
          gap: 4px;
          padding: 0 8px;
          border: 1px solid transparent;
          border-radius: 6px;
          color: #59677c;
          background: transparent;
          cursor: pointer;
          font-size: 7px;
          font-weight: 750;
        }

        .fs-choice:hover {
          color: #a7b4c8;
        }

        .fs-choice.is-active {
          border-color: rgba(135,102,235,.13);
          color: #d5ceff;
          background: rgba(131,94,230,.1);
        }

        .fs-accent-group {
          display: flex;
          gap: 7px;
        }

        .fs-accent {
          width: 25px;
          height: 25px;
          display: grid;
          place-items: center;
          border: 2px solid transparent;
          border-radius: 50%;
          color: white;
          cursor: pointer;
        }

        .fs-accent.violet {
          background: #9775ff;
        }

        .fs-accent.blue {
          background: #5988ff;
        }

        .fs-accent.green {
          background: #48cda5;
        }

        .fs-accent.rose {
          background: #ff6d88;
        }

        .fs-accent.active {
          border-color: #eaf0ff;
          box-shadow: 0 0 0 2px rgba(255,255,255,.07);
        }

        .fs-static-value {
          display: flex;
          align-items: center;
          gap: 6px;
          padding: 7px 9px;
          border: 1px solid rgba(110,137,198,.08);
          border-radius: 8px;
          color: #65738a;
          background: rgba(255,255,255,.018);
          font-size: 7px;
        }

        .fs-static-value b {
          color: #a8b4c6;
        }

        .fs-preview-card {
          margin-top: 12px;
          padding: 16px;
          border: 1px solid rgba(109,136,198,.09);
          border-radius: 15px;
          background:
            radial-gradient(circle at 80% 30%, rgba(141,100,255,.07), transparent 30%),
            rgba(10,16,27,.72);
        }

        .fs-preview-header {
          display: flex;
          justify-content: space-between;
        }

        .fs-preview-header > div {
          display: grid;
          gap: 3px;
        }

        .fs-preview-header span {
          color: #596b91;
          font-size: 7px;
          font-weight: 850;
          letter-spacing: .13em;
        }

        .fs-preview-header strong {
          color: #bac5d6;
          font-size: 10px;
        }

        .fs-preview-header > svg {
          color: #9e83ed;
        }

        .fs-preview-dashboard {
          display: grid;
          grid-template-columns: 1fr 1.5fr .8fr;
          gap: 8px;
          margin-top: 13px;
        }

        .fs-preview-stat,
        .fs-preview-chart,
        .fs-preview-side {
          min-height: 92px;
          padding: 11px;
          border: 1px solid rgba(109,136,198,.07);
          border-radius: 9px;
          background: rgba(255,255,255,.012);
        }

        .fs-preview-stat span,
        .fs-preview-side span {
          display: block;
          color: #4f5e74;
          font-size: 6px;
          font-weight: 800;
        }

        .fs-preview-stat strong {
          display: block;
          margin-top: 9px;
          color: #d4dcea;
          font-size: 15px;
        }

        .fs-preview-stat small {
          display: block;
          margin-top: 5px;
          color: #51cda4;
          font-size: 7px;
        }

        .fs-preview-chart {
          display: flex;
          align-items: flex-end;
          gap: 6px;
          padding-bottom: 14px;
        }

        .fs-preview-chart div {
          flex: 1;
          border-radius: 3px 3px 1px 1px;
          background: linear-gradient(to top, #6554c8, #8b72ff);
          opacity: .72;
        }

        .fs-preview-chart div:nth-child(1) { height: 30%; }
        .fs-preview-chart div:nth-child(2) { height: 44%; }
        .fs-preview-chart div:nth-child(3) { height: 37%; }
        .fs-preview-chart div:nth-child(4) { height: 58%; }
        .fs-preview-chart div:nth-child(5) { height: 51%; }
        .fs-preview-chart div:nth-child(6) { height: 72%; }
        .fs-preview-chart div:nth-child(7) { height: 64%; }
        .fs-preview-chart div:nth-child(8) { height: 84%; }

        .fs-preview-side strong {
          display: block;
          margin-top: 7px;
          color: #d9e2ed;
          font-size: 23px;
        }

        .fs-preview-side div {
          display: flex;
          align-items: center;
          gap: 5px;
          margin-top: 5px;
          color: #55cda7;
          font-size: 7px;
        }

        .fs-preview-side i {
          width: 5px;
          height: 5px;
          border-radius: 50%;
          background: #55cda7;
        }

        .fs-info-banner,
        .fs-warning-banner {
          display: flex;
          align-items: flex-start;
          gap: 10px;
          margin-top: 12px;
          padding: 13px;
          border: 1px solid rgba(102,128,185,.08);
          border-radius: 11px;
          color: #6e7c92;
          background: rgba(255,255,255,.014);
        }

        .fs-info-banner > svg {
          flex: 0 0 auto;
          color: #7891c7;
        }

        .fs-info-banner div,
        .fs-warning-banner div {
          display: grid;
          gap: 3px;
        }

        .fs-info-banner strong,
        .fs-warning-banner strong {
          color: #aab6c9;
          font-size: 8px;
        }

        .fs-info-banner span,
        .fs-warning-banner span {
          color: #58667b;
          font-size: 7px;
          line-height: 1.5;
        }

        .fs-connection-grid {
          display: grid;
          grid-template-columns: repeat(3, 1fr);
          gap: 10px;
          margin-bottom: 12px;
        }

        .fs-connection-card {
          min-height: 130px;
          padding: 15px;
          border: 1px solid rgba(109,136,198,.09);
          border-radius: 14px;
          background: rgba(10,16,27,.72);
        }

        .fs-connection-top {
          display: flex;
          justify-content: space-between;
        }

        .fs-connection-icon {
          width: 34px;
          height: 34px;
          display: grid;
          place-items: center;
          border-radius: 9px;
          color: #9b83ed;
          background: rgba(139,101,241,.06);
        }

        .fs-connection-icon.database {
          color: #57cfaa;
          background: rgba(61,210,165,.045);
        }

        .fs-connection-icon.network {
          color: #6d9aff;
          background: rgba(88,133,255,.045);
        }

        .fs-status-dot {
          width: 7px;
          height: 7px;
          margin-top: 5px;
          border-radius: 50%;
          background: #6a7484;
        }

        .fs-status-dot.online {
          background: #4fd1a6;
          box-shadow: 0 0 10px rgba(79,209,166,.65);
        }

        .fs-status-dot.offline {
          background: #ff667f;
          box-shadow: 0 0 10px rgba(255,102,127,.45);
        }

        .fs-connection-card > span {
          display: block;
          margin-top: 13px;
          color: #506079;
          font-size: 7px;
          font-weight: 850;
          letter-spacing: .12em;
        }

        .fs-connection-card > strong {
          display: block;
          overflow: hidden;
          margin-top: 4px;
          color: #c2ccdb;
          font-size: 10px;
          text-overflow: ellipsis;
          white-space: nowrap;
        }

        .fs-connection-card > small {
          display: block;
          margin-top: 3px;
          color: #59677b;
          font-size: 7px;
        }

        .fs-health-card {
          padding: 17px;
        }

        .fs-health-heading {
          display: flex;
          align-items: center;
          justify-content: space-between;
        }

        .fs-health-heading span {
          color: #596d96;
          font-size: 7px;
          font-weight: 850;
          letter-spacing: .13em;
        }

        .fs-health-heading h3 {
          margin: 4px 0 0;
          color: #c5cfde;
          font-size: 13px;
        }

        .fs-check-button {
          display: inline-flex;
          align-items: center;
          gap: 6px;
          padding: 7px 9px;
          border: 1px solid rgba(110,137,199,.1);
          border-radius: 8px;
          color: #8492a9;
          background: rgba(255,255,255,.02);
          cursor: pointer;
          font-size: 7px;
        }

        .fs-check-button:disabled {
          opacity: .45;
          cursor: wait;
        }

        .fs-health-result {
          display: flex;
          align-items: center;
          gap: 10px;
          margin-top: 17px;
          padding: 13px;
          border: 1px solid rgba(64,211,164,.1);
          border-radius: 10px;
          color: #55d0a5;
          background: rgba(54,210,165,.025);
        }

        .fs-health-result.failed {
          border-color: rgba(255,91,116,.12);
          color: #ff788c;
          background: rgba(255,80,111,.025);
        }

        .fs-health-result div {
          display: grid;
          gap: 3px;
        }

        .fs-health-result strong {
          color: #aebacc;
          font-size: 8px;
        }

        .fs-health-result span {
          color: #58677d;
          font-size: 7px;
        }

        .fs-health-details {
          display: grid;
          grid-template-columns: 1.3fr 1fr 1fr 1fr;
          gap: 7px;
          margin-top: 10px;
        }

        .fs-health-details > div {
          min-width: 0;
          padding: 10px;
          border: 1px solid rgba(110,137,199,.06);
          border-radius: 8px;
          background: rgba(255,255,255,.012);
        }

        .fs-health-details span {
          display: block;
          color: #4d5c72;
          font-size: 6px;
          font-weight: 850;
          letter-spacing: .08em;
        }

        .fs-health-details strong {
          display: block;
          overflow: hidden;
          margin-top: 5px;
          color: #8d9ab0;
          font-size: 7px;
          text-overflow: ellipsis;
          white-space: nowrap;
        }

        .fs-terminal-card {
          margin-top: 12px;
          overflow: hidden;
          border: 1px solid rgba(108,137,200,.09);
          border-radius: 13px;
          background: #080d15;
        }

        .fs-terminal-top {
          display: flex;
          align-items: center;
          justify-content: space-between;
          padding: 9px 11px;
          border-bottom: 1px solid rgba(111,137,198,.07);
          background: rgba(255,255,255,.012);
        }

        .fs-terminal-top > div:first-child {
          display: flex;
          align-items: center;
          gap: 7px;
          color: #607393;
          font-size: 7px;
          font-weight: 800;
          letter-spacing: .08em;
        }

        .fs-terminal-lights {
          display: flex;
          gap: 4px;
        }

        .fs-terminal-lights i {
          width: 5px;
          height: 5px;
          border-radius: 50%;
          background: #394458;
        }

        .fs-terminal-body {
          padding: 14px;
          font-family: "SFMono-Regular", Consolas, monospace;
        }

        .fs-terminal-body p {
          margin: 5px 0;
          color: #61708a;
          font-size: 7px;
        }

        .fs-terminal-body p:first-child {
          color: #8390a6;
        }

        .fs-terminal-body b {
          color: #7e68d2;
        }

        .fs-terminal-body em {
          display: inline-block;
          width: 100px;
          color: #4fd0a5;
          font-style: normal;
        }

        .fs-security-banner {
          display: flex;
          align-items: flex-start;
          gap: 14px;
          margin-bottom: 12px;
          padding: 18px;
          border: 1px solid rgba(78,210,168,.1);
          border-radius: 15px;
          background:
            radial-gradient(circle at 10% 50%, rgba(62,211,165,.07), transparent 35%),
            rgba(10,17,28,.72);
        }

        .fs-security-shield {
          width: 47px;
          height: 47px;
          display: grid;
          place-items: center;
          flex: 0 0 auto;
          border: 1px solid rgba(78,210,168,.14);
          border-radius: 12px;
          color: #53cfa6;
          background: rgba(58,210,165,.04);
        }

        .fs-security-banner span {
          color: #57708d;
          font-size: 7px;
          font-weight: 850;
          letter-spacing: .13em;
        }

        .fs-security-banner strong {
          display: block;
          margin-top: 4px;
          color: #c1ccda;
          font-size: 12px;
        }

        .fs-security-banner p {
          max-width: 680px;
          margin: 5px 0 0;
          color: #59677c;
          font-size: 8px;
          line-height: 1.6;
        }

        .fs-security-item {
          display: grid;
          grid-template-columns: 30px minmax(0,1fr) auto;
          align-items: center;
          gap: 10px;
          padding: 13px 16px;
          border-bottom: 1px solid rgba(109,133,176,.055);
        }

        .fs-security-item:last-child {
          border-bottom: 0;
        }

        .fs-security-item > div {
          width: 29px;
          height: 29px;
          display: grid;
          place-items: center;
          border-radius: 8px;
          color: #51cda4;
          background: rgba(52,210,164,.04);
        }

        .fs-security-item section strong {
          display: block;
          color: #b9c4d4;
          font-size: 8px;
        }

        .fs-security-item section span {
          display: block;
          margin-top: 3px;
          color: #56647a;
          font-size: 7px;
        }

        .fs-security-item > b {
          padding: 5px 7px;
          border: 1px solid rgba(109,136,198,.08);
          border-radius: 6px;
          color: #68768d;
          background: rgba(255,255,255,.015);
          font-size: 6px;
          font-weight: 750;
        }

        .fs-warning-banner {
          border-color: rgba(255,171,76,.1);
          color: #c99555;
          background: rgba(255,171,76,.025);
        }

        .fs-warning-banner > svg {
          flex: 0 0 auto;
          color: #c99555;
        }

        .fs-shortcuts-grid {
          display: grid;
          grid-template-columns: repeat(2, 1fr);
          gap: 10px;
        }

        .fs-shortcut-card {
          position: relative;
          min-height: 140px;
          padding: 16px;
          border: 1px solid rgba(109,136,198,.09);
          border-radius: 14px;
          background: rgba(10,16,27,.72);
        }

        .fs-shortcut-card > div {
          width: 33px;
          height: 33px;
          display: grid;
          place-items: center;
          border: 1px solid rgba(139,102,238,.1);
          border-radius: 9px;
          color: #9e83ec;
          background: rgba(137,99,236,.045);
        }

        .fs-shortcut-card > span {
          display: block;
          margin-top: 15px;
          color: #52617a;
          font-size: 6px;
          font-weight: 850;
          letter-spacing: .12em;
        }

        .fs-shortcut-card > strong {
          display: block;
          margin-top: 4px;
          color: #b8c3d3;
          font-size: 9px;
        }

        .fs-shortcut-card kbd {
          position: absolute;
          right: 13px;
          bottom: 13px;
          padding: 6px 8px;
          border: 1px solid rgba(110,137,198,.1);
          border-bottom-width: 2px;
          border-radius: 6px;
          color: #8390a5;
          background: rgba(255,255,255,.02);
          font-family: inherit;
          font-size: 7px;
        }

        .fs-shortcut-card kbd i {
          padding: 0 3px;
          color: #4f5e73;
          font-style: normal;
        }

        .fs-settings-footer {
          display: flex;
          align-items: center;
          gap: 12px;
          margin-top: 14px;
          padding: 12px 14px;
          border: 1px solid rgba(109,136,198,.08);
          border-radius: 12px;
          background: rgba(10,16,27,.55);
        }

        .fs-settings-footer > div:first-child {
          display: flex;
          align-items: center;
          gap: 8px;
          flex: 1;
        }

        .fs-footer-check {
          width: 27px;
          height: 27px;
          display: grid;
          place-items: center;
          border-radius: 7px;
          color: #51cda5;
          background: rgba(58,210,165,.05);
        }

        .fs-settings-footer strong {
          display: block;
          color: #8f9caf;
          font-size: 7px;
        }

        .fs-settings-footer span {
          display: block;
          margin-top: 2px;
          color: #4e5c72;
          font-size: 6px;
        }

        .fs-settings-footer > button {
          padding: 7px 10px;
          border: 1px solid rgba(109,136,198,.09);
          border-radius: 7px;
          color: #68758b;
          background: rgba(255,255,255,.018);
          cursor: pointer;
          font-size: 7px;
        }

        .fs-settings-footer > button:hover {
          color: #aeb9ca;
        }

        .fs-saved {
          display: inline-flex !important;
          align-items: center;
          gap: 4px;
          color: #50cda4 !important;
        }

        .fs-spin {
          animation: fs-settings-spin 1s linear infinite;
        }

        @keyframes fs-settings-spin {
          to {
            transform: rotate(360deg);
          }
        }

        @media (max-width: 1050px) {
          .fs-settings-hero {
            padding: 30px;
          }

          .fs-settings-layout {
            grid-template-columns: 175px minmax(0,1fr);
          }

          .fs-health-details {
            grid-template-columns: repeat(2,1fr);
          }

          .fs-connection-grid {
            grid-template-columns: 1fr;
          }
        }

        @media (max-width: 800px) {
          .fs-settings-page {
            padding: 15px 0 70px;
          }

          .fs-settings-hero {
            display: block;
            padding: 25px;
          }

          .fs-settings-hero-status {
            margin-top: 22px;
          }

          .fs-settings-layout {
            grid-template-columns: 1fr;
          }

          .fs-settings-sidebar {
            position: static;
            overflow-x: auto;
          }

          .fs-settings-sidebar nav {
            display: flex;
            min-width: max-content;
          }

          .fs-settings-sidebar nav button {
            width: auto;
          }

          .fs-sidebar-label,
          .fs-sidebar-card {
            display: none;
          }

          .fs-preview-dashboard,
          .fs-health-details {
            grid-template-columns: 1fr;
          }

          .fs-shortcuts-grid {
            grid-template-columns: 1fr;
          }
        }

        @media (max-width: 560px) {
          .fs-settings-hero {
            padding: 20px;
          }

          .fs-settings-hero h1 {
            font-size: 36px;
          }

          .fs-setting-row {
            grid-template-columns: 34px minmax(0,1fr);
          }

          .fs-setting-control {
            grid-column: 2;
            justify-content: flex-start;
            padding-top: 2px;
          }

          .fs-choice-group {
            flex-wrap: wrap;
          }

          .fs-settings-footer {
            align-items: flex-start;
            flex-wrap: wrap;
          }
        }

        .motion-reduced *,
        .motion-reduced *::before,
        .motion-reduced *::after {
          animation-duration: .001ms !important;
          animation-iteration-count: 1 !important;
          transition-duration: .001ms !important;
          scroll-behavior: auto !important;
        }

        [data-finsight-motion="minimal"] *,
        [data-finsight-motion="minimal"] *::before,
        [data-finsight-motion="minimal"] *::after {
          animation-duration: .001ms !important;
          transition-duration: .001ms !important;
        }

        [data-finsight-accent="blue"] .fs-settings-section-icon {
          color: #6994ff;
        }

        [data-finsight-accent="green"] .fs-settings-section-icon {
          color: #55cfa7;
        }

        [data-finsight-accent="rose"] .fs-settings-section-icon {
          color: #ff718a;
        }

        [data-finsight-density="compact"] .fs-setting-row {
          min-height: 62px;
          padding-top: 8px;
          padding-bottom: 8px;
        }

        [data-finsight-density="spacious"] .fs-setting-row {
          min-height: 92px;
          padding-top: 17px;
          padding-bottom: 17px;
        }

        [data-finsight-theme="light"] .fs-settings-page {
          color: #182033;
        }
      `}</style>
    </main>
  );
}