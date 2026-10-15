// src/pages/AuditLog.jsx

import { useCallback, useEffect, useMemo, useState } from 'react';
import {
  Activity,
  AlertCircle,
  ArrowDownToLine,
  CheckCircle2,
  ChevronDown,
  Clock3,
  Download,
  FileSearch,
  Filter,
  Lock,
  MoreHorizontal,
  RefreshCw,
  Search,
  Shield,
  ShieldAlert,
  User,
  XCircle,
} from 'lucide-react';

const auditEvents = [
  {
    id: 'AUD-10482',
    action: 'Transaction created',
    category: 'Transaction',
    description: 'Added an expense transaction of ₹2,450',
    user: 'You',
    source: 'Web Dashboard',
    status: 'Success',
    timestamp: '2026-10-05 20:41:32',
    ip: '192.168.1.24',
    risk: 'Low',
  },
  {
    id: 'AUD-10481',
    action: 'Budget updated',
    category: 'Budget',
    description: 'Monthly dining budget changed from ₹8,000 to ₹10,000',
    user: 'You',
    source: 'Web Dashboard',
    status: 'Success',
    timestamp: '2026-10-05 20:27:18',
    ip: '192.168.1.24',
    risk: 'Low',
  },
  {
    id: 'AUD-10480',
    action: 'Account connected',
    category: 'Account',
    description: 'New financial account connection initiated',
    user: 'You',
    source: 'Web Dashboard',
    status: 'Success',
    timestamp: '2026-10-05 19:54:06',
    ip: '192.168.1.24',
    risk: 'Medium',
  },
  {
    id: 'AUD-10479',
    action: 'Analytics generated',
    category: 'Analytics',
    description: 'Financial intelligence report generated',
    user: 'System',
    source: 'Analytics Engine',
    status: 'Success',
    timestamp: '2026-10-05 19:30:45',
    ip: 'SYSTEM',
    risk: 'Low',
  },
  {
    id: 'AUD-10478',
    action: 'Failed authentication',
    category: 'Security',
    description: 'Authentication attempt rejected',
    user: 'Unknown',
    source: 'API',
    status: 'Failed',
    timestamp: '2026-10-05 18:42:11',
    ip: '103.42.91.18',
    risk: 'High',
  },
  {
    id: 'AUD-10477',
    action: 'Savings goal updated',
    category: 'Savings',
    description: 'Emergency Fund target increased to ₹1,50,000',
    user: 'You',
    source: 'Web Dashboard',
    status: 'Success',
    timestamp: '2026-10-05 17:16:29',
    ip: '192.168.1.24',
    risk: 'Low',
  },
  {
    id: 'AUD-10476',
    action: 'Debt payment recorded',
    category: 'Debt',
    description: 'Recorded a debt payment of ₹7,500',
    user: 'You',
    source: 'Web Dashboard',
    status: 'Success',
    timestamp: '2026-10-05 16:52:07',
    ip: '192.168.1.24',
    risk: 'Low',
  },
  {
    id: 'AUD-10475',
    action: 'Export requested',
    category: 'Data',
    description: 'Financial transaction report exported',
    user: 'You',
    source: 'Web Dashboard',
    status: 'Success',
    timestamp: '2026-10-05 15:33:41',
    ip: '192.168.1.24',
    risk: 'Medium',
  },
  {
    id: 'AUD-10474',
    action: 'Recurring payment modified',
    category: 'Recurring',
    description: 'Netflix recurring transaction amount modified',
    user: 'You',
    source: 'Web Dashboard',
    status: 'Success',
    timestamp: '2026-10-05 14:22:16',
    ip: '192.168.1.24',
    risk: 'Low',
  },
  {
    id: 'AUD-10473',
    action: 'API request rejected',
    category: 'Security',
    description: 'Request rejected because of invalid authorization',
    user: 'Unknown',
    source: 'API',
    status: 'Failed',
    timestamp: '2026-10-05 13:08:54',
    ip: '45.91.22.61',
    risk: 'High',
  },
  {
    id: 'AUD-10472',
    action: 'Category created',
    category: 'Category',
    description: 'New custom spending category created',
    user: 'You',
    source: 'Web Dashboard',
    status: 'Success',
    timestamp: '2026-10-05 12:44:20',
    ip: '192.168.1.24',
    risk: 'Low',
  },
  {
    id: 'AUD-10471',
    action: 'Profile accessed',
    category: 'Account',
    description: 'Account profile information accessed',
    user: 'You',
    source: 'Web Dashboard',
    status: 'Success',
    timestamp: '2026-10-05 11:31:09',
    ip: '192.168.1.24',
    risk: 'Low',
  },
];

const categories = [
  'All categories',
  'Transaction',
  'Budget',
  'Account',
  'Analytics',
  'Security',
  'Savings',
  'Debt',
  'Data',
  'Recurring',
  'Category',
];

function statusIcon(status) {
  if (status === 'Success') {
    return <CheckCircle2 size={15} />;
  }

  if (status === 'Failed') {
    return <XCircle size={15} />;
  }

  return <AlertCircle size={15} />;
}

function categoryIcon(category) {
  const icons = {
    Transaction: Activity,
    Budget: Shield,
    Account: User,
    Analytics: Activity,
    Security: ShieldAlert,
    Savings: CheckCircle2,
    Debt: Lock,
    Data: Download,
    Recurring: Clock3,
    Category: FileSearch,
  };

  const Icon = icons[category] || Activity;

  return <Icon size={16} />;
}

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000/api';
const USER_ID = import.meta.env.VITE_FINSIGHT_USER_ID || '1';

export default function AuditLog() {
  const [events, setEvents] = useState(auditEvents);
  const [query, setQuery] = useState('');
  const [category, setCategory] = useState('All categories');
  const [status, setStatus] = useState('All statuses');
  const [risk, setRisk] = useState('All risk levels');
  const [period, setPeriod] = useState('Today');
  const [refreshing, setRefreshing] = useState(false);
  const [selectedEvent, setSelectedEvent] = useState(null);

  const loadAuditLogs = useCallback(async () => {
    setRefreshing(true);
    try {
      const res = await fetch(`${API_BASE_URL}/audit/${USER_ID}`);
      if (res.ok) {
        const json = await res.json();
        const rows = Array.isArray(json?.data) ? json.data : [];
        if (rows.length > 0) {
          setEvents(
            rows.map((row) => ({
              id: `AUD-${row.audit_id}`,
              action: `${row.action || 'ACTION'} on ${row.table_name || 'table'}`,
              category: String(row.table_name || 'Transaction').replace(/s$/i, '').replace(/^./, (c) => c.toUpperCase()),
              description: `Record #${row.record_id ?? '—'} modified in PostgreSQL`,
              user: `User #${row.user_id ?? USER_ID}`,
              source: 'PostgreSQL Trigger',
              status: 'Success',
              timestamp: row.action_time ? new Date(row.action_time).toLocaleString('en-IN') : 'Recent',
              ip: 'DB-INTERNAL',
              risk: String(row.action || '').toUpperCase() === 'DELETE' ? 'Medium' : 'Low',
            }))
          );
        }
      }
    } catch {
      // Keep fallback events if audit_log table is empty
    } finally {
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    loadAuditLogs();
  }, [loadAuditLogs]);

  const filteredEvents = useMemo(() => {
    const normalizedQuery = query.trim().toLowerCase();

    return events.filter((event) => {
      const matchesQuery =
        !normalizedQuery ||
        [
          event.id,
          event.action,
          event.category,
          event.description,
          event.user,
          event.source,
          event.ip,
        ]
          .join(' ')
          .toLowerCase()
          .includes(normalizedQuery);

      const matchesCategory =
        category === 'All categories' || event.category === category;

      const matchesStatus =
        status === 'All statuses' || event.status === status;

      const matchesRisk = risk === 'All risk levels' || event.risk === risk;

      return matchesQuery && matchesCategory && matchesStatus && matchesRisk;
    });
  }, [events, query, category, status, risk]);

  const stats = useMemo(() => {
    const successful = events.filter(
      (event) => event.status === 'Success',
    ).length;

    const failed = events.filter(
      (event) => event.status === 'Failed',
    ).length;

    const highRisk = events.filter(
      (event) => event.risk === 'High',
    ).length;

    return {
      total: events.length,
      successful,
      failed,
      highRisk,
    };
  }, [events]);

  const handleRefresh = () => {
    loadAuditLogs();
  };

  const handleExport = () => {
    const headers = [
      'ID',
      'Action',
      'Category',
      'Description',
      'User',
      'Source',
      'Status',
      'Timestamp',
      'IP',
      'Risk',
    ];

    const rows = filteredEvents.map((event) => [
      event.id,
      event.action,
      event.category,
      event.description,
      event.user,
      event.source,
      event.status,
      event.timestamp,
      event.ip,
      event.risk,
    ]);

    const csv = [
      headers,
      ...rows,
    ]
      .map((row) =>
        row
          .map((value) => `"${String(value).replaceAll('"', '""')}"`)
          .join(','),
      )
      .join('\n');

    const blob = new Blob([csv], {
      type: 'text/csv;charset=utf-8;',
    });

    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');

    link.href = url;
    link.download = 'finsight-audit-log.csv';
    link.click();

    URL.revokeObjectURL(url);
  };

  return (
    <main className="audit-page">
      <style>{`
        .audit-page {
          min-height: 100%;
          padding: 28px;
          color: #f8fafc;
          overflow: hidden;
          position: relative;
        }

        .audit-page::before {
          content: "";
          position: absolute;
          width: 520px;
          height: 520px;
          top: -260px;
          right: -180px;
          border-radius: 50%;
          background: rgba(124, 58, 237, 0.11);
          filter: blur(90px);
          pointer-events: none;
        }

        .audit-page::after {
          content: "";
          position: absolute;
          width: 420px;
          height: 420px;
          bottom: -250px;
          left: -180px;
          border-radius: 50%;
          background: rgba(6, 182, 212, 0.07);
          filter: blur(90px);
          pointer-events: none;
        }

        .audit-content {
          position: relative;
          z-index: 1;
          max-width: 1800px;
          margin: 0 auto;
        }

        .audit-header {
          display: flex;
          align-items: flex-end;
          justify-content: space-between;
          gap: 24px;
          margin-bottom: 23px;
        }

        .audit-eyebrow {
          display: flex;
          align-items: center;
          gap: 8px;
          color: #a78bfa;
          font-size: 10px;
          font-weight: 850;
          letter-spacing: 0.17em;
          text-transform: uppercase;
        }

        .audit-eyebrow::before {
          content: "";
          width: 23px;
          height: 2px;
          border-radius: 99px;
          background: #8b5cf6;
        }

        .audit-header h1 {
          margin: 9px 0 0;
          font-size: clamp(29px, 4vw, 45px);
          line-height: 1;
          letter-spacing: -0.045em;
          font-weight: 900;
        }

        .audit-header p {
          max-width: 690px;
          margin: 12px 0 0;
          color: #64748b;
          font-size: 13px;
          line-height: 1.7;
        }

        .audit-header-actions {
          display: flex;
          gap: 9px;
          align-items: center;
          flex-wrap: wrap;
          justify-content: flex-end;
        }

        .audit-button {
          height: 41px;
          padding: 0 13px;
          display: inline-flex;
          align-items: center;
          gap: 8px;
          border: 1px solid rgba(148, 163, 184, 0.14);
          border-radius: 11px;
          background: rgba(15, 23, 42, 0.75);
          color: #cbd5e1;
          font: inherit;
          font-size: 11px;
          font-weight: 750;
          cursor: pointer;
          transition: 180ms ease;
        }

        .audit-button:hover {
          color: #fff;
          border-color: rgba(139, 92, 246, 0.4);
          background: rgba(30, 41, 59, 0.9);
        }

        .audit-button.primary {
          color: #fff;
          border-color: rgba(139, 92, 246, 0.38);
          background: linear-gradient(
            135deg,
            rgba(124, 58, 237, 0.9),
            rgba(99, 102, 241, 0.82)
          );
        }

        .audit-button.spinning svg {
          animation: audit-spin 700ms linear infinite;
        }

        @keyframes audit-spin {
          to {
            transform: rotate(360deg);
          }
        }

        .audit-security-banner {
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 20px;
          margin-bottom: 18px;
          padding: 14px 17px;
          border: 1px solid rgba(16, 185, 129, 0.15);
          border-radius: 15px;
          background:
            linear-gradient(
              90deg,
              rgba(6, 78, 59, 0.18),
              rgba(15, 23, 42, 0.6)
            );
        }

        .audit-security-left {
          display: flex;
          align-items: center;
          gap: 11px;
        }

        .audit-security-icon {
          display: grid;
          place-items: center;
          width: 34px;
          height: 34px;
          border-radius: 10px;
          color: #6ee7b7;
          background: rgba(16, 185, 129, 0.1);
        }

        .audit-security-left strong {
          display: block;
          color: #d1fae5;
          font-size: 11px;
        }

        .audit-security-left span {
          display: block;
          margin-top: 3px;
          color: #64748b;
          font-size: 10px;
        }

        .audit-security-status {
          display: inline-flex;
          align-items: center;
          gap: 7px;
          color: #6ee7b7;
          font-size: 10px;
          font-weight: 800;
        }

        .audit-security-status::before {
          content: "";
          width: 6px;
          height: 6px;
          border-radius: 50%;
          background: #34d399;
          box-shadow: 0 0 13px rgba(52, 211, 153, 0.7);
        }

        .audit-stats {
          display: grid;
          grid-template-columns: repeat(4, 1fr);
          gap: 13px;
          margin-bottom: 18px;
        }

        .audit-stat {
          position: relative;
          overflow: hidden;
          min-height: 112px;
          padding: 16px;
          border: 1px solid rgba(148, 163, 184, 0.12);
          border-radius: 16px;
          background: rgba(15, 23, 42, 0.61);
        }

        .audit-stat::after {
          content: "";
          position: absolute;
          right: -38px;
          bottom: -42px;
          width: 100px;
          height: 100px;
          border-radius: 50%;
          background: currentColor;
          opacity: 0.045;
          filter: blur(8px);
        }

        .audit-stat-top {
          display: flex;
          align-items: center;
          justify-content: space-between;
        }

        .audit-stat-icon {
          display: grid;
          place-items: center;
          width: 34px;
          height: 34px;
          border-radius: 9px;
          color: #a78bfa;
          background: rgba(139, 92, 246, 0.1);
        }

        .audit-stat:nth-child(2) .audit-stat-icon {
          color: #6ee7b7;
          background: rgba(16, 185, 129, 0.1);
        }

        .audit-stat:nth-child(3) .audit-stat-icon {
          color: #fca5a5;
          background: rgba(239, 68, 68, 0.1);
        }

        .audit-stat:nth-child(4) .audit-stat-icon {
          color: #fcd34d;
          background: rgba(245, 158, 11, 0.1);
        }

        .audit-stat-value {
          margin-top: 13px;
          font-size: 22px;
          line-height: 1;
          font-weight: 900;
          letter-spacing: -0.03em;
        }

        .audit-stat-label {
          margin-top: 5px;
          color: #64748b;
          font-size: 9px;
          font-weight: 800;
          letter-spacing: 0.09em;
          text-transform: uppercase;
        }

        .audit-toolbar {
          display: grid;
          grid-template-columns: minmax(240px, 1.4fr) repeat(4, minmax(125px, 0.7fr));
          gap: 9px;
          margin-bottom: 13px;
          padding: 13px;
          border: 1px solid rgba(148, 163, 184, 0.11);
          border-radius: 16px;
          background: rgba(15, 23, 42, 0.64);
        }

        .audit-search {
          position: relative;
        }

        .audit-search svg {
          position: absolute;
          top: 13px;
          left: 13px;
          color: #64748b;
        }

        .audit-input,
        .audit-select {
          width: 100%;
          height: 40px;
          border: 1px solid rgba(148, 163, 184, 0.12);
          border-radius: 10px;
          outline: none;
          background: rgba(2, 6, 23, 0.42);
          color: #cbd5e1;
          font: inherit;
          font-size: 11px;
        }

        .audit-input {
          padding: 0 12px 0 38px;
        }

        .audit-select {
          appearance: none;
          padding: 0 31px 0 11px;
        }

        .audit-input:focus,
        .audit-select:focus {
          border-color: rgba(139, 92, 246, 0.45);
        }

        .audit-filter {
          position: relative;
        }

        .audit-filter svg {
          position: absolute;
          right: 10px;
          top: 13px;
          color: #64748b;
          pointer-events: none;
        }

        .audit-table-card {
          overflow: hidden;
          border: 1px solid rgba(148, 163, 184, 0.12);
          border-radius: 17px;
          background: rgba(15, 23, 42, 0.6);
        }

        .audit-table-head {
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 16px;
          padding: 14px 17px;
          border-bottom: 1px solid rgba(148, 163, 184, 0.09);
        }

        .audit-table-head-left {
          display: flex;
          align-items: center;
          gap: 9px;
        }

        .audit-table-head-left svg {
          color: #a78bfa;
        }

        .audit-table-head strong {
          font-size: 12px;
        }

        .audit-table-count {
          padding: 4px 8px;
          border-radius: 999px;
          color: #a78bfa;
          background: rgba(139, 92, 246, 0.09);
          font-size: 9px;
          font-weight: 800;
        }

        .audit-table-wrap {
          width: 100%;
          overflow-x: auto;
        }

        .audit-table {
          width: 100%;
          min-width: 1050px;
          border-collapse: collapse;
        }

        .audit-table th {
          height: 42px;
          padding: 0 15px;
          border-bottom: 1px solid rgba(148, 163, 184, 0.08);
          color: #475569;
          font-size: 9px;
          font-weight: 850;
          letter-spacing: 0.1em;
          text-align: left;
          text-transform: uppercase;
          white-space: nowrap;
        }

        .audit-table td {
          padding: 13px 15px;
          border-bottom: 1px solid rgba(148, 163, 184, 0.06);
          color: #94a3b8;
          font-size: 10px;
          vertical-align: middle;
        }

        .audit-table tbody tr {
          cursor: pointer;
          transition: 140ms ease;
        }

        .audit-table tbody tr:hover {
          background: rgba(139, 92, 246, 0.035);
        }

        .audit-id {
          color: #8b5cf6 !important;
          font-family: ui-monospace, SFMono-Regular, Menlo, monospace;
          font-size: 9px !important;
          font-weight: 800;
        }

        .audit-action {
          display: flex;
          align-items: center;
          gap: 9px;
          min-width: 220px;
        }

        .audit-action-icon {
          display: grid;
          place-items: center;
          flex: 0 0 auto;
          width: 31px;
          height: 31px;
          border-radius: 8px;
          color: #a78bfa;
          background: rgba(139, 92, 246, 0.09);
        }

        .audit-action strong {
          display: block;
          color: #e2e8f0;
          font-size: 10px;
          font-weight: 800;
        }

        .audit-action span {
          display: block;
          margin-top: 3px;
          max-width: 290px;
          overflow: hidden;
          color: #64748b;
          font-size: 9px;
          text-overflow: ellipsis;
          white-space: nowrap;
        }

        .audit-category {
          display: inline-flex;
          align-items: center;
          gap: 5px;
          padding: 5px 8px;
          border: 1px solid rgba(148, 163, 184, 0.09);
          border-radius: 7px;
          color: #94a3b8;
          background: rgba(148, 163, 184, 0.04);
          font-size: 9px;
          font-weight: 700;
        }

        .audit-status,
        .audit-risk {
          display: inline-flex;
          align-items: center;
          gap: 5px;
          padding: 5px 8px;
          border-radius: 999px;
          font-size: 9px;
          font-weight: 800;
        }

        .audit-status.success {
          color: #6ee7b7;
          background: rgba(16, 185, 129, 0.08);
        }

        .audit-status.failed {
          color: #fca5a5;
          background: rgba(239, 68, 68, 0.08);
        }

        .audit-risk.low {
          color: #94a3b8;
          background: rgba(148, 163, 184, 0.07);
        }

        .audit-risk.medium {
          color: #fcd34d;
          background: rgba(245, 158, 11, 0.08);
        }

        .audit-risk.high {
          color: #fca5a5;
          background: rgba(239, 68, 68, 0.09);
        }

        .audit-time {
          white-space: nowrap;
          color: #64748b !important;
          font-family: ui-monospace, SFMono-Regular, Menlo, monospace;
          font-size: 9px !important;
        }

        .audit-source {
          color: #cbd5e1 !important;
          font-weight: 650;
        }

        .audit-menu {
          display: grid;
          place-items: center;
          width: 28px;
          height: 28px;
          border: 0;
          border-radius: 7px;
          background: transparent;
          color: #64748b;
          cursor: pointer;
        }

        .audit-menu:hover {
          color: #cbd5e1;
          background: rgba(148, 163, 184, 0.07);
        }

        .audit-empty {
          padding: 65px 20px;
          text-align: center;
          color: #64748b;
        }

        .audit-empty svg {
          margin-bottom: 10px;
          color: #475569;
        }

        .audit-empty strong {
          display: block;
          color: #94a3b8;
          font-size: 12px;
        }

        .audit-empty span {
          display: block;
          margin-top: 5px;
          font-size: 10px;
        }

        .audit-footer {
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 15px;
          margin-top: 13px;
          color: #475569;
          font-size: 9px;
        }

        .audit-footer-security {
          display: inline-flex;
          align-items: center;
          gap: 6px;
        }

        .audit-footer-security svg {
          color: #34d399;
        }

        .audit-modal-backdrop {
          position: fixed;
          inset: 0;
          z-index: 100;
          display: grid;
          place-items: center;
          padding: 20px;
          background: rgba(2, 6, 23, 0.72);
          backdrop-filter: blur(9px);
        }

        .audit-modal {
          width: min(560px, 100%);
          overflow: hidden;
          border: 1px solid rgba(148, 163, 184, 0.16);
          border-radius: 19px;
          background: #0f172a;
          box-shadow: 0 30px 100px rgba(0, 0, 0, 0.5);
        }

        .audit-modal-header {
          display: flex;
          align-items: center;
          justify-content: space-between;
          padding: 18px;
          border-bottom: 1px solid rgba(148, 163, 184, 0.09);
        }

        .audit-modal-title {
          display: flex;
          align-items: center;
          gap: 10px;
        }

        .audit-modal-title-icon {
          display: grid;
          place-items: center;
          width: 36px;
          height: 36px;
          border-radius: 10px;
          color: #a78bfa;
          background: rgba(139, 92, 246, 0.1);
        }

        .audit-modal-title strong {
          display: block;
          font-size: 12px;
        }

        .audit-modal-title span {
          display: block;
          margin-top: 3px;
          color: #64748b;
          font-size: 9px;
        }

        .audit-modal-close {
          display: grid;
          place-items: center;
          width: 31px;
          height: 31px;
          border: 0;
          border-radius: 8px;
          color: #94a3b8;
          background: rgba(148, 163, 184, 0.06);
          cursor: pointer;
        }

        .audit-modal-body {
          padding: 18px;
        }

        .audit-detail-grid {
          display: grid;
          grid-template-columns: repeat(2, 1fr);
          gap: 10px;
        }

        .audit-detail {
          padding: 12px;
          border: 1px solid rgba(148, 163, 184, 0.08);
          border-radius: 10px;
          background: rgba(2, 6, 23, 0.22);
        }

        .audit-detail.full {
          grid-column: 1 / -1;
        }

        .audit-detail label {
          display: block;
          color: #475569;
          font-size: 8px;
          font-weight: 850;
          letter-spacing: 0.1em;
          text-transform: uppercase;
        }

        .audit-detail strong {
          display: block;
          margin-top: 6px;
          color: #cbd5e1;
          font-size: 10px;
        }

        @media (max-width: 1050px) {
          .audit-toolbar {
            grid-template-columns: repeat(2, 1fr);
          }

          .audit-search {
            grid-column: 1 / -1;
          }

          .audit-stats {
            grid-template-columns: repeat(2, 1fr);
          }
        }

        @media (max-width: 720px) {
          .audit-page {
            padding: 18px 14px 100px;
          }

          .audit-header {
            align-items: flex-start;
            flex-direction: column;
          }

          .audit-header-actions {
            justify-content: flex-start;
          }

          .audit-security-banner {
            align-items: flex-start;
            flex-direction: column;
          }

          .audit-stats {
            grid-template-columns: 1fr;
          }

          .audit-toolbar {
            grid-template-columns: 1fr;
          }

          .audit-search {
            grid-column: auto;
          }

          .audit-detail-grid {
            grid-template-columns: 1fr;
          }

          .audit-detail.full {
            grid-column: auto;
          }
        }
      `}</style>

      <div className="audit-content">
        <header className="audit-header">
          <div>
            <div className="audit-eyebrow">Security & Compliance</div>

            <h1>Audit Log</h1>

            <p>
              A complete immutable-style activity trail for financial,
              account, security, and system events across FinSight.
            </p>
          </div>

          <div className="audit-header-actions">
            <button
              type="button"
              className={`audit-button ${refreshing ? 'spinning' : ''}`}
              onClick={handleRefresh}
            >
              <RefreshCw size={14} />
              Refresh
            </button>

            <button
              type="button"
              className="audit-button primary"
              onClick={handleExport}
            >
              <Download size={14} />
              Export CSV
            </button>
          </div>
        </header>

        <section className="audit-security-banner">
          <div className="audit-security-left">
            <div className="audit-security-icon">
              <Shield size={18} />
            </div>

            <div>
              <strong>Audit monitoring is active</strong>
              <span>
                Events are tracked across application, API, and financial
                activity.
              </span>
            </div>
          </div>

          <div className="audit-security-status">
            Monitoring active
          </div>
        </section>

        <section className="audit-stats">
          <div className="audit-stat">
            <div className="audit-stat-top">
              <div className="audit-stat-icon">
                <Activity size={17} />
              </div>
            </div>

            <div className="audit-stat-value">{stats.total}</div>
            <div className="audit-stat-label">Total events</div>
          </div>

          <div className="audit-stat">
            <div className="audit-stat-top">
              <div className="audit-stat-icon">
                <CheckCircle2 size={17} />
              </div>
            </div>

            <div className="audit-stat-value">{stats.successful}</div>
            <div className="audit-stat-label">Successful events</div>
          </div>

          <div className="audit-stat">
            <div className="audit-stat-top">
              <div className="audit-stat-icon">
                <XCircle size={17} />
              </div>
            </div>

            <div className="audit-stat-value">{stats.failed}</div>
            <div className="audit-stat-label">Failed events</div>
          </div>

          <div className="audit-stat">
            <div className="audit-stat-top">
              <div className="audit-stat-icon">
                <ShieldAlert size={17} />
              </div>
            </div>

            <div className="audit-stat-value">{stats.highRisk}</div>
            <div className="audit-stat-label">High-risk events</div>
          </div>
        </section>

        <section className="audit-toolbar">
          <div className="audit-search">
            <Search size={15} />

            <input
              className="audit-input"
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder="Search event ID, action, user, IP..."
              type="search"
            />
          </div>

          <div className="audit-filter">
            <select
              className="audit-select"
              value={category}
              onChange={(event) => setCategory(event.target.value)}
            >
              {categories.map((item) => (
                <option key={item}>{item}</option>
              ))}
            </select>

            <ChevronDown size={14} />
          </div>

          <div className="audit-filter">
            <select
              className="audit-select"
              value={status}
              onChange={(event) => setStatus(event.target.value)}
            >
              <option>All statuses</option>
              <option>Success</option>
              <option>Failed</option>
            </select>

            <ChevronDown size={14} />
          </div>

          <div className="audit-filter">
            <select
              className="audit-select"
              value={risk}
              onChange={(event) => setRisk(event.target.value)}
            >
              <option>All risk levels</option>
              <option>Low</option>
              <option>Medium</option>
              <option>High</option>
            </select>

            <ChevronDown size={14} />
          </div>

          <div className="audit-filter">
            <select
              className="audit-select"
              value={period}
              onChange={(event) => setPeriod(event.target.value)}
            >
              <option>Today</option>
              <option>Last 7 days</option>
              <option>Last 30 days</option>
              <option>All time</option>
            </select>

            <ChevronDown size={14} />
          </div>
        </section>

        <section className="audit-table-card">
          <div className="audit-table-head">
            <div className="audit-table-head-left">
              <Filter size={15} />
              <strong>Activity stream</strong>
              <span className="audit-table-count">
                {filteredEvents.length} events
              </span>
            </div>

            <span
              style={{
                color: '#475569',
                fontSize: '9px',
              }}
            >
              {period}
            </span>
          </div>

          <div className="audit-table-wrap">
            {filteredEvents.length > 0 ? (
              <table className="audit-table">
                <thead>
                  <tr>
                    <th>Event ID</th>
                    <th>Activity</th>
                    <th>Category</th>
                    <th>User</th>
                    <th>Source</th>
                    <th>Status</th>
                    <th>Timestamp</th>
                    <th>Risk</th>
                    <th />
                  </tr>
                </thead>

                <tbody>
                  {filteredEvents.map((event) => (
                    <tr
                      key={event.id}
                      onClick={() => setSelectedEvent(event)}
                    >
                      <td className="audit-id">{event.id}</td>

                      <td>
                        <div className="audit-action">
                          <div className="audit-action-icon">
                            {categoryIcon(event.category)}
                          </div>

                          <div>
                            <strong>{event.action}</strong>
                            <span>{event.description}</span>
                          </div>
                        </div>
                      </td>

                      <td>
                        <span className="audit-category">
                          {categoryIcon(event.category)}
                          {event.category}
                        </span>
                      </td>

                      <td>{event.user}</td>

                      <td className="audit-source">{event.source}</td>

                      <td>
                        <span
                          className={`audit-status ${
                            event.status === 'Success'
                              ? 'success'
                              : 'failed'
                          }`}
                        >
                          {statusIcon(event.status)}
                          {event.status}
                        </span>
                      </td>

                      <td className="audit-time">
                        {event.timestamp}
                      </td>

                      <td>
                        <span
                          className={`audit-risk ${event.risk.toLowerCase()}`}
                        >
                          {event.risk}
                        </span>
                      </td>

                      <td>
                        <button
                          type="button"
                          className="audit-menu"
                          onClick={(clickEvent) => {
                            clickEvent.stopPropagation();
                            setSelectedEvent(event);
                          }}
                          aria-label={`View ${event.id}`}
                        >
                          <MoreHorizontal size={15} />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            ) : (
              <div className="audit-empty">
                <FileSearch size={28} />
                <strong>No audit events found</strong>
                <span>
                  Try changing the filters or search query.
                </span>
              </div>
            )}
          </div>
        </section>

        <footer className="audit-footer">
          <div className="audit-footer-security">
            <Shield size={12} />
            Audit trail protected by FinSight security controls
          </div>

          <span>
            Showing {filteredEvents.length} of {auditEvents.length} events
          </span>
        </footer>
      </div>

      {selectedEvent && (
        <div
          className="audit-modal-backdrop"
          onClick={() => setSelectedEvent(null)}
        >
          <section
            className="audit-modal"
            onClick={(event) => event.stopPropagation()}
          >
            <header className="audit-modal-header">
              <div className="audit-modal-title">
                <div className="audit-modal-title-icon">
                  <FileSearch size={17} />
                </div>

                <div>
                  <strong>Event details</strong>
                  <span>{selectedEvent.id}</span>
                </div>
              </div>

              <button
                type="button"
                className="audit-modal-close"
                onClick={() => setSelectedEvent(null)}
              >
                <XCircle size={16} />
              </button>
            </header>

            <div className="audit-modal-body">
              <div className="audit-detail-grid">
                <div className="audit-detail">
                  <label>Action</label>
                  <strong>{selectedEvent.action}</strong>
                </div>

                <div className="audit-detail">
                  <label>Category</label>
                  <strong>{selectedEvent.category}</strong>
                </div>

                <div className="audit-detail">
                  <label>User</label>
                  <strong>{selectedEvent.user}</strong>
                </div>

                <div className="audit-detail">
                  <label>Source</label>
                  <strong>{selectedEvent.source}</strong>
                </div>

                <div className="audit-detail">
                  <label>Status</label>
                  <strong>{selectedEvent.status}</strong>
                </div>

                <div className="audit-detail">
                  <label>Risk</label>
                  <strong>{selectedEvent.risk}</strong>
                </div>

                <div className="audit-detail">
                  <label>Timestamp</label>
                  <strong>{selectedEvent.timestamp}</strong>
                </div>

                <div className="audit-detail">
                  <label>IP address</label>
                  <strong>{selectedEvent.ip}</strong>
                </div>

                <div className="audit-detail full">
                  <label>Description</label>
                  <strong>{selectedEvent.description}</strong>
                </div>
              </div>
            </div>
          </section>
        </div>
      )}
    </main>
  );
}