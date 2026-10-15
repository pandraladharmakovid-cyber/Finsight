import React from 'react';
import {
  ArrowRight,
  ArrowUpRight,
  BarChart3,
  CircleDollarSign,
  CreditCard,
  Plus,
  Receipt,
  Repeat2,
  ShieldCheck,
  Sparkles,
  Target,
  Wallet,
} from 'lucide-react';

import Card from '../ui/Card.jsx';

const ACTIONS = [
  {
    id: 'transaction',
    label: 'Add transaction',
    description: 'Record income or spending',
    icon: Plus,
    accent: '#a78bfa',
  },
  {
    id: 'budget',
    label: 'Create budget',
    description: 'Set a spending boundary',
    icon: Target,
    accent: '#38bdf8',
  },
  {
    id: 'savings',
    label: 'New savings goal',
    description: 'Build your next milestone',
    icon: Wallet,
    accent: '#34d399',
  },
  {
    id: 'recurring',
    label: 'Recurring payment',
    description: 'Track fixed commitments',
    icon: Repeat2,
    accent: '#fbbf24',
  },
  {
    id: 'debt',
    label: 'Track debt',
    description: 'Add a liability',
    icon: CreditCard,
    accent: '#fb7185',
  },
  {
    id: 'analytics',
    label: 'Open analytics',
    description: 'Explore financial patterns',
    icon: BarChart3,
    accent: '#22d3ee',
  },
];

export default function QuickActions({
  onAction,
  actions = ACTIONS,
  title = 'Quick actions',
  subtitle = 'Jump directly into your financial workflow',
}) {
  return (
    <Card
      title={title}
      subtitle={subtitle}
      icon={Sparkles}
      iconColor="#c4b5fd"
      padding="lg"
      radius="xl"
      glow
    >
      <div
        style={{
          display: 'grid',
          gridTemplateColumns:
            'repeat(2, minmax(0, 1fr))',
          gap: 9,
        }}
      >
        {actions.map((action) => {
          const Icon =
            action.icon || CircleDollarSign;

          return (
            <button
              key={action.id}
              type="button"
              onClick={() =>
                onAction?.(action.id, action)
              }
              style={{
                position: 'relative',
                minWidth: 0,
                overflow: 'hidden',
                display: 'grid',
                gridTemplateColumns:
                  '38px minmax(0,1fr) 18px',
                alignItems: 'center',
                gap: 10,
                padding: '12px 11px',
                borderRadius: 15,
                border:
                  '1px solid rgba(148,163,184,.09)',
                background:
                  'linear-gradient(135deg, rgba(255,255,255,.035), rgba(255,255,255,.012))',
                color: '#e2e8f0',
                textAlign: 'left',
                cursor: 'pointer',
                transition:
                  'transform .22s cubic-bezier(.22,1,.36,1), border-color .22s ease, background .22s ease, box-shadow .22s ease',
              }}
              onMouseEnter={(event) => {
                event.currentTarget.style.transform =
                  'translateY(-2px)';
                event.currentTarget.style.borderColor =
                  `${action.accent}45`;
                event.currentTarget.style.background =
                  `linear-gradient(135deg, ${action.accent}0f, rgba(255,255,255,.025))`;
                event.currentTarget.style.boxShadow =
                  `0 12px 32px ${action.accent}12`;
              }}
              onMouseLeave={(event) => {
                event.currentTarget.style.transform =
                  'translateY(0)';
                event.currentTarget.style.borderColor =
                  'rgba(148,163,184,.09)';
                event.currentTarget.style.background =
                  'linear-gradient(135deg, rgba(255,255,255,.035), rgba(255,255,255,.012))';
                event.currentTarget.style.boxShadow =
                  'none';
              }}
            >
              <span
                style={{
                  width: 38,
                  height: 38,
                  display: 'grid',
                  placeItems: 'center',
                  borderRadius: 12,
                  color: action.accent,
                  background: `${action.accent}12`,
                  border: `1px solid ${action.accent}20`,
                  boxShadow: `inset 0 1px 0 ${action.accent}0c`,
                }}
              >
                <Icon size={17} />
              </span>

              <span
                style={{
                  minWidth: 0,
                }}
              >
                <span
                  style={{
                    display: 'block',
                    overflow: 'hidden',
                    textOverflow: 'ellipsis',
                    whiteSpace: 'nowrap',
                    color: '#e2e8f0',
                    fontSize: 11,
                    fontWeight: 750,
                  }}
                >
                  {action.label}
                </span>

                <span
                  style={{
                    display: 'block',
                    marginTop: 4,
                    overflow: 'hidden',
                    textOverflow: 'ellipsis',
                    whiteSpace: 'nowrap',
                    color: '#64748b',
                    fontSize: 9,
                  }}
                >
                  {action.description}
                </span>
              </span>

              <ArrowRight
                size={14}
                style={{
                  color: '#475569',
                  transition:
                    'transform .2s ease, color .2s ease',
                }}
              />
            </button>
          );
        })}
      </div>

      <div
        style={{
          marginTop: 14,
          padding: '10px 12px',
          display: 'flex',
          alignItems: 'center',
          gap: 9,
          borderRadius: 12,
          border:
            '1px solid rgba(139,92,246,.12)',
          background:
            'linear-gradient(90deg, rgba(139,92,246,.065), rgba(56,189,248,.025))',
        }}
      >
        <div
          style={{
            width: 28,
            height: 28,
            flex: '0 0 28px',
            display: 'grid',
            placeItems: 'center',
            borderRadius: 9,
            color: '#a78bfa',
            background:
              'rgba(139,92,246,.10)',
          }}
        >
          <ShieldCheck size={14} />
        </div>

        <div
          style={{
            minWidth: 0,
            flex: 1,
          }}
        >
          <div
            style={{
              color: '#cbd5e1',
              fontSize: 10,
              fontWeight: 700,
            }}
          >
            Financial control center
          </div>

          <div
            style={{
              marginTop: 2,
              color: '#64748b',
              fontSize: 9,
              lineHeight: 1.4,
            }}
          >
            Keep your accounts, budgets and goals
            synchronized.
          </div>
        </div>

        <ArrowUpRight
          size={14}
          style={{
            color: '#64748b',
          }}
        />
      </div>

      <style>{`
        @media (max-width: 520px) {
          .fs-quick-actions-grid {
            grid-template-columns: 1fr !important;
          }
        }
      `}</style>
    </Card>
  );
}