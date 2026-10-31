import { Fragment, useMemo, useState } from 'react';
import {
  ArrowDownLeft,
  ChevronDown,
  ChevronRight,
  Clock,
  Database,
  FileDiff,
  History,
  Plus,
  RefreshCw,
  Search,
  Trash2,
  Pencil,
} from 'lucide-react';

import Card from '../components/ui/Card.jsx';
import Button from '../components/ui/Button.jsx';
import StatCard from '../components/ui/StatCard.jsx';
import { CardSkeleton, EmptyState, ErrorState } from '../components/ui/States.jsx';

import { api } from '../lib/api.js';
import { useResource } from '../lib/hooks.jsx';
import {
  asArray,
  prettyDate,
  relativeTime,
  titleCase,
  unwrap,
} from '../lib/format.js';

const ACTION_STYLES = {
  INSERT: { tone: 'fs-badge-pos', icon: Plus, color: 'var(--mint)' },
  UPDATE: { tone: 'fs-badge-info', icon: Pencil, color: 'var(--cyan-soft)' },
  DELETE: { tone: 'fs-badge-neg', icon: Trash2, color: 'var(--rose)' },
};

function DiffBlock({ title, data, color }) {
  if (!data || typeof data !== 'object') {
    return (
      <div>
        <div className="fs-xs fs-dim-2" style={{ letterSpacing: '0.1em', textTransform: 'uppercase' }}>
          {title}
        </div>
        <pre
          className="fs-mono fs-xs"
          style={{
            margin: '6px 0 0',
            padding: 10,
            borderRadius: 10,
            background: 'rgba(0,0,0,0.32)',
            border: '1px solid var(--glass-stroke)',
            color: 'var(--text-3)',
            overflowX: 'auto',
            maxHeight: 190,
          }}
        >
          {JSON.stringify(data, null, 2) ?? 'null'}
        </pre>
      </div>
    );
  }

  const entries = Object.entries(data).filter(
    ([key]) => !['created_at', 'updated_at'].includes(key),
  );

  return (
    <div>
      <div
        className="fs-xs"
        style={{
          letterSpacing: '0.1em',
          textTransform: 'uppercase',
          color,
          fontWeight: 700,
        }}
      >
        {title}
      </div>

      <div
        style={{
          marginTop: 6,
          padding: 10,
          borderRadius: 10,
          background: 'rgba(0,0,0,0.32)',
          border: '1px solid var(--glass-stroke)',
        }}
      >
        {entries.map(([key, value]) => (
          <div
            key={key}
            className="fs-row-between"
            style={{ gap: 12, padding: '3px 0', fontSize: 11.5 }}
          >
            <span className="fs-mono fs-dim-2">{key}</span>
            <span
              className="fs-mono fs-truncate"
              style={{ color: 'var(--text-2)', maxWidth: '60%', textAlign: 'right' }}
            >
              {value === null || value === undefined ? '—' : String(value)}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}

export default function AuditLog() {
  const auditRes = useResource(
    async () => {
      const [logs, overview] = await Promise.all([
        api.audit(200),
        api.auditOverview(),
      ]);
      return { logs, overview };
    },
    [],
  );

  const [search, setSearch] = useState('');
  const [actionFilter, setActionFilter] = useState('ALL');
  const [expanded, setExpanded] = useState(null);

  const payload = unwrap(auditRes.data) ?? {};
  const logs = useMemo(() => asArray(payload.logs), [payload.logs]);
  const overview = useMemo(() => unwrap(payload.overview) ?? {}, [payload.overview]);

  const filtered = useMemo(() => {
    const needle = search.trim().toLowerCase();

    return logs.filter((entry) => {
      if (actionFilter !== 'ALL' && entry.action !== actionFilter) return false;

      if (needle) {
        const haystack = `${entry.table_name} ${entry.action} ${entry.record_id}`.toLowerCase();
        if (!haystack.includes(needle)) return false;
      }

      return true;
    });
  }, [logs, search, actionFilter]);

  const actionCounts = overview.actionCounts ?? {};

  if (auditRes.error) {
    return (
      <ErrorState
        error={auditRes.error}
        onRetry={auditRes.reload}
        title="Audit log could not load"
      />
    );
  }

  return (
    <div className="fs-col fs-gap-20">
      <section className="fs-grid fs-grid-4">
        <StatCard
          label="Total entries"
          value={overview.totalEntries ?? logs.length}
          icon={History}
          tone="violet"
          format={(n) => Math.round(n).toString()}
          footnote="recorded by triggers"
        />
        <StatCard
          label="Inserts"
          value={actionCounts.INSERT ?? 0}
          icon={Plus}
          tone="mint"
          delay={1}
          format={(n) => Math.round(n).toString()}
          footnote="new rows created"
        />
        <StatCard
          label="Updates"
          value={actionCounts.UPDATE ?? 0}
          icon={Pencil}
          tone="cyan"
          delay={2}
          format={(n) => Math.round(n).toString()}
          footnote="rows modified"
        />
        <StatCard
          label="Deletes"
          value={actionCounts.DELETE ?? 0}
          icon={Trash2}
          tone="rose"
          delay={3}
          format={(n) => Math.round(n).toString()}
          footnote="rows removed"
        />
      </section>

      <Card padded={false}>
        <div
          className="fs-row fs-gap-10 fs-wrap"
          style={{ padding: '16px 18px', borderBottom: '1px solid var(--glass-stroke)' }}
        >
          <div className="fs-input-affix" style={{ flex: '1 1 240px' }}>
            <Search size={15} />
            <input
              className="fs-input"
              placeholder="Search table, action or record id…"
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              aria-label="Search audit entries"
            />
          </div>

          <div className="fs-tabs">
            {['ALL', 'INSERT', 'UPDATE', 'DELETE'].map((option) => (
              <button
                key={option}
                type="button"
                className={`fs-tab ${actionFilter === option ? 'is-on' : ''}`}
                onClick={() => setActionFilter(option)}
              >
                {titleCase(option)}
              </button>
            ))}
          </div>

          <Button icon={RefreshCw} onClick={auditRes.reload}>
            Refresh
          </Button>
        </div>

        {auditRes.loading ? (
          <div style={{ padding: 18 }}>
            <CardSkeleton rows={7} />
          </div>
        ) : filtered.length === 0 ? (
          <EmptyState
            icon={History}
            title="No audit entries"
            message="Database triggers record every insert, update and delete automatically."
          />
        ) : (
          <div className="fs-table-wrap">
            <table className="fs-table">
              <thead>
                <tr>
                  <th style={{ width: 34 }} />
                  <th>Action</th>
                  <th>Table</th>
                  <th>Record</th>
                  <th>When</th>
                  <th className="fs-right">Timestamp</th>
                </tr>
              </thead>

              <tbody>
                {filtered.map((entry) => {
                  const style = ACTION_STYLES[entry.action] ?? ACTION_STYLES.UPDATE;
                  const Icon = style.icon;
                  const isOpen = expanded === entry.audit_id;

                  return (
                    <Fragment key={entry.audit_id}>
                      <tr
                        onClick={() => setExpanded(isOpen ? null : entry.audit_id)}
                        style={{ cursor: 'pointer' }}
                      >
                        <td>
                          {isOpen ? (
                            <ChevronDown size={14} className="fs-dim" />
                          ) : (
                            <ChevronRight size={14} className="fs-dim" />
                          )}
                        </td>

                        <td>
                          <span className={`fs-badge ${style.tone}`}>
                            <Icon size={10} /> {entry.action}
                          </span>
                        </td>

                        <td>
                          <span className="fs-row fs-gap-6 fs-mono fs-sm">
                            <Database size={12} className="fs-dim-2" />
                            {entry.table_name}
                          </span>
                        </td>

                        <td className="fs-mono fs-dim">#{entry.record_id ?? '—'}</td>

                        <td className="fs-dim fs-nowrap">
                          <span className="fs-row fs-gap-4">
                            <Clock size={11} />
                            {relativeTime(entry.action_time)}
                          </span>
                        </td>

                        <td className="fs-right fs-dim-2 fs-nowrap fs-xs">
                          {prettyDate(entry.action_time)}
                        </td>
                      </tr>

                      {isOpen && (
                        <tr>
                          <td colSpan={6} style={{ background: 'rgba(0,0,0,0.24)' }}>
                            <div
                              className="fs-grid fs-grid-2"
                              style={{ padding: '10px 4px 16px' }}
                            >
                              <DiffBlock
                                title="Previous state"
                                data={entry.old_data}
                                color="var(--rose)"
                              />
                              <DiffBlock
                                title="New state"
                                data={entry.new_data}
                                color="var(--mint)"
                              />
                            </div>
                          </td>
                        </tr>
                      )}
                    </Fragment>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </Card>
    </div>
  );
}
