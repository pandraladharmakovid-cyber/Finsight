import { useEffect, useMemo, useState } from 'react';
import {
  Check,
  Database,
  Palette,
  Save,
  Server,
  Shield,
  Sparkles,
  User,
  Zap,
} from 'lucide-react';

import Card from '../components/ui/Card.jsx';
import Button from '../components/ui/Button.jsx';
import Field, { Switch } from '../components/ui/Field.jsx';
import { CardSkeleton, ErrorState } from '../components/ui/States.jsx';

import { api, API_BASE_URL, USER_ID } from '../lib/api.js';
import { useLocalStorage, useResource, useToast } from '../lib/hooks.jsx';
import { money, prettyDate, unwrap } from '../lib/format.js';

const ACCENTS = [
  { id: 'violet', label: 'Aurora Violet', swatch: ['#7c5cff', '#22d3ee'] },
  { id: 'cyan', label: 'Deep Cyan', swatch: ['#22d3ee', '#7c5cff'] },
  { id: 'mint', label: 'Signal Mint', swatch: ['#34d399', '#22d3ee'] },
  { id: 'rose', label: 'Ember Rose', swatch: ['#fb7185', '#f472b6'] },
];

export default function Settings() {
  const toast = useToast();

  const userRes = useResource(() => api.user(), []);
  const healthRes = useResource(() => api.health(), []);

  const [accent, setAccent] = useLocalStorage('finsight:accent', 'violet');
  const [motion, setMotion] = useLocalStorage('finsight:motion', 'full');

  const [form, setForm] = useState({
    fullName: '',
    email: '',
    phone: '',
    monthlyIncome: '',
  });
  const [errors, setErrors] = useState({});
  const [saving, setSaving] = useState(false);

  const user = useMemo(() => unwrap(userRes.data) ?? {}, [userRes.data]);
  const health = useMemo(() => unwrap(healthRes.data) ?? {}, [healthRes.data]);

  useEffect(() => {
    if (user.user_id) {
      setForm({
        fullName: user.full_name ?? '',
        email: user.email ?? '',
        phone: user.phone ?? '',
        monthlyIncome: user.monthly_income ? String(user.monthly_income) : '',
      });
    }
  }, [user.user_id, user.full_name, user.email, user.phone, user.monthly_income]);

  useEffect(() => {
    document.documentElement.dataset.accent = accent;
  }, [accent]);

  useEffect(() => {
    document.documentElement.dataset.motion = motion;
  }, [motion]);

  async function saveProfile(event) {
    event?.preventDefault();

    const next = {};

    if (!form.fullName.trim()) next.fullName = 'Your name is required.';

    if (form.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email)) {
      next.email = 'Enter a valid email address.';
    }

    const income = Number(form.monthlyIncome || 0);
    if (Number.isFinite(income) && income < 0) {
      next.monthlyIncome = 'Income cannot be negative.';
    }

    setErrors(next);
    if (Object.keys(next).length) return;

    setSaving(true);

    try {
      await api.updateUser({
        fullName: form.fullName.trim(),
        email: form.email.trim() || null,
        phone: form.phone.trim() || null,
        monthlyIncome: Number(form.monthlyIncome || 0),
      });

      toast.success('Profile saved', 'Your details were updated in PostgreSQL.');
      await userRes.refresh();
    } catch (error) {
      toast.error('Could not save profile', error.message);
    } finally {
      setSaving(false);
    }
  }

  if (userRes.error) {
    return (
      <ErrorState
        error={userRes.error}
        onRetry={userRes.reload}
        title="Settings could not load"
      />
    );
  }

  return (
    <div className="fs-col fs-gap-20">
      <div className="fs-grid fs-grid-2" style={{ alignItems: 'start' }}>
        {/* ---------------- PROFILE ---------------- */}
        <Card
          title="Profile"
          subtitle="Stored in finance.users and used across the workspace"
          icon={User}
          className="fs-reveal"
        >
          {userRes.loading ? (
            <CardSkeleton rows={4} />
          ) : (
            <form className="fs-col fs-gap-16" onSubmit={saveProfile}>
              <Field
                label="Full name"
                placeholder="Your name"
                value={form.fullName}
                error={errors.fullName}
                onChange={(event) =>
                  setForm((prev) => ({ ...prev, fullName: event.target.value }))
                }
              />

              <div className="fs-grid fs-grid-2">
                <Field
                  label="Email"
                  type="email"
                  placeholder="you@example.com"
                  value={form.email}
                  error={errors.email}
                  onChange={(event) =>
                    setForm((prev) => ({ ...prev, email: event.target.value }))
                  }
                />

                <Field
                  label="Phone"
                  placeholder="+91…"
                  value={form.phone}
                  onChange={(event) =>
                    setForm((prev) => ({ ...prev, phone: event.target.value }))
                  }
                />
              </div>

              <Field
                label="Monthly income"
                type="number"
                min="0"
                step="1"
                prefix="₹"
                placeholder="0"
                value={form.monthlyIncome}
                error={errors.monthlyIncome}
                hint="Used as a reference against your spending totals."
                onChange={(event) =>
                  setForm((prev) => ({ ...prev, monthlyIncome: event.target.value }))
                }
              />

              <div className="fs-row-between" style={{ marginTop: 4 }}>
                <span className="fs-xs fs-dim-2">
                  User #{user.user_id ?? USER_ID} · joined{' '}
                  {user.created_at ? prettyDate(user.created_at) : '—'}
                </span>
                <Button variant="primary" type="submit" loading={saving} icon={Save}>
                  Save profile
                </Button>
              </div>
            </form>
          )}
        </Card>

        {/* ---------------- APPEARANCE ---------------- */}
        <Card
          title="Appearance"
          subtitle="Personalise the motion and colour of the workspace"
          icon={Palette}
          className="fs-reveal"
          style={{ '--i': 1 }}
        >
          <div className="fs-col fs-gap-20">
            <div>
              <div className="fs-label fs-mb-8">Accent theme</div>

              <div className="fs-grid fs-grid-2" style={{ gap: 10 }}>
                {ACCENTS.map((option) => (
                  <button
                    key={option.id}
                    type="button"
                    onClick={() => setAccent(option.id)}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: 10,
                      padding: '10px 12px',
                      borderRadius: 12,
                      background:
                        accent === option.id
                          ? 'rgba(124,92,255,0.14)'
                          : 'rgba(255,255,255,0.03)',
                      border: `1px solid ${
                        accent === option.id
                          ? 'rgba(124,92,255,0.5)'
                          : 'var(--glass-stroke)'
                      }`,
                      transition: 'all 180ms ease',
                    }}
                  >
                    <span
                      style={{
                        width: 26,
                        height: 26,
                        borderRadius: 9,
                        background: `linear-gradient(135deg, ${option.swatch[0]}, ${option.swatch[1]})`,
                        boxShadow: `0 0 14px -2px ${option.swatch[0]}`,
                        flex: '0 0 26px',
                      }}
                    />
                    <span
                      className="fs-xs truncate"
                      style={{
                        color: accent === option.id ? 'var(--text-1)' : 'var(--text-3)',
                        fontWeight: 600,
                      }}
                    >
                      {option.label}
                    </span>
                    {accent === option.id && (
                      <Check size={13} style={{ marginLeft: 'auto', color: 'var(--mint)' }} />
                    )}
                  </button>
                ))}
              </div>
            </div>

            <div className="fs-divider" />

            <Switch
              label="Full motion"
              hint="Disable for a calmer, reduced-animation interface."
              checked={motion === 'full'}
              onChange={(value) => setMotion(value ? 'full' : 'calm')}
            />

            <div className="fs-divider" />

            <div className="fs-row fs-gap-8 fs-wrap">
              <span className="fs-badge fs-badge-brand">
                <Sparkles size={10} /> Aurora glass
              </span>
              <span className="fs-badge fs-badge-info">
                <Zap size={10} /> GPU accelerated
              </span>
              <span className="fs-badge fs-badge-neutral">v2.0</span>
            </div>
          </div>
        </Card>
      </div>

      {/* ---------------- SYSTEM ---------------- */}
      <div className="fs-grid fs-grid-2" style={{ alignItems: 'start' }}>
        <Card
          title="System status"
          subtitle="Live backend and database connectivity"
          icon={Server}
          className="fs-reveal"
          style={{ '--i': 2 }}
          action={
            <Button size="sm" variant="ghost" onClick={healthRes.reload}>
              Re-check
            </Button>
          }
        >
          {healthRes.loading ? (
            <CardSkeleton rows={3} />
          ) : (
            <div className="fs-col fs-gap-12">
              {[
                {
                  label: 'API service',
                  value: health.status ?? 'unknown',
                  ok: health.status === 'healthy',
                },
                {
                  label: 'Database',
                  value: health.database?.database_name ?? 'not connected',
                  ok: Boolean(health.database),
                },
                {
                  label: 'Schema',
                  value: health.database?.current_schema ?? '—',
                  ok: Boolean(health.database?.current_schema),
                },
                {
                  label: 'Server time',
                  value: health.timestamp ? prettyDate(health.timestamp) : '—',
                  ok: true,
                },
              ].map((row) => (
                <div key={row.label} className="fs-row-between">
                  <span className="fs-xs fs-dim">{row.label}</span>
                  <span className="fs-row fs-gap-6">
                    <span
                      className="fs-live-dot"
                      style={{
                        background: row.ok ? 'var(--mint)' : 'var(--rose)',
                        boxShadow: 'none',
                      }}
                    />
                    <span className="fs-mono fs-xs" style={{ color: 'var(--text-2)' }}>
                      {row.value}
                    </span>
                  </span>
                </div>
              ))}

              <div className="fs-divider" />

              <div className="fs-row-between">
                <span className="fs-xs fs-dim">API base</span>
                <span className="fs-mono fs-xs fs-dim-2">{API_BASE_URL}</span>
              </div>
            </div>
          )}
        </Card>

        <Card
          title="Data source"
          subtitle="Everything you see is read from PostgreSQL"
          icon={Database}
          className="fs-reveal"
          style={{ '--i': 3 }}
        >
          <div className="fs-col fs-gap-10">
            <p className="fs-sm fs-dim">
              FinSight is a full-stack application. The Express API exposes
              endpoints over the <code className="fs-mono">finance</code> schema,
              and every figure on screen is a live query result — there is no
              mock or cached demo data in the interface.
            </p>

            <div className="fs-divider" />

            <div className="fs-row-between">
              <span className="fs-xs fs-dim">Workspace user</span>
              <span className="fs-mono fs-xs">#{USER_ID}</span>
            </div>

            <div className="fs-row-between">
              <span className="fs-xs fs-dim">Reference income</span>
              <span className="fs-mono fs-xs">
                {user.monthly_income ? money(user.monthly_income) : '—'}
              </span>
            </div>

            <div className="fs-row-between">
              <span className="fs-xs fs-dim">Balances maintained by</span>
              <span className="fs-mono fs-xs">trg_update_account_balance</span>
            </div>

            <div className="fs-row-between">
              <span className="fs-xs fs-dim">Change history</span>
              <span className="fs-mono fs-xs">trg_audit_transactions</span>
            </div>

            <div className="fs-mt-8">
              <div
                className="fs-row fs-gap-8"
                style={{
                  padding: '10px 12px',
                  borderRadius: 12,
                  background: 'rgba(52,211,153,0.07)',
                  border: '1px solid rgba(52,211,153,0.22)',
                  fontSize: 11.5,
                  color: '#a7f3d0',
                }}
              >
                <Shield size={14} />
                Balances and audit entries are enforced at the database layer, not
                in the UI.
              </div>
            </div>
          </div>
        </Card>
      </div>
    </div>
  );
}
