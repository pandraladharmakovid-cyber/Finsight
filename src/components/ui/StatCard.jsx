import { ArrowDownRight, ArrowUpRight } from 'lucide-react';
import { useCountUp } from '../../lib/hooks.jsx';
import { money } from '../../lib/format.js';

/**
 * Animated KPI tile. The primary number counts up whenever it changes.
 */
export default function StatCard({
  label,
  value,
  icon: Icon,
  tone = 'violet',
  format = money,
  trend = null,
  footnote,
  delay = 0,
}) {
  const animated = useCountUp(Number(value) || 0, 950);

  const glow =
    tone === 'mint'
      ? 'rgba(52,211,153,0.42)'
      : tone === 'rose'
        ? 'rgba(251,113,133,0.42)'
        : tone === 'amber'
          ? 'rgba(251,191,36,0.4)'
          : tone === 'cyan'
            ? 'rgba(34,211,238,0.4)'
            : 'rgba(124,92,255,0.42)';

  const iconColor =
    tone === 'mint'
      ? 'var(--mint-soft)'
      : tone === 'rose'
        ? 'var(--rose)'
        : tone === 'amber'
          ? 'var(--amber)'
          : tone === 'cyan'
            ? 'var(--cyan-soft)'
            : 'var(--violet-soft)';

  return (
    <article
      className="fs-stat fs-reveal"
      style={{ '--stat-glow': glow, '--i': delay }}
    >
      <div className="fs-stat-top">
        <span className="fs-stat-label">{label}</span>
        {Icon && (
          <span className="fs-stat-icon" style={{ '--icon-color': iconColor }}>
            <Icon size={16} />
          </span>
        )}
      </div>

      <div className="fs-stat-value">{format(animated)}</div>

      {(trend || footnote) && (
        <div className="fs-stat-foot">
          {trend && (
            <span className={`fs-trend ${trend.dir === 'down' ? 'is-down' : 'is-up'}`}>
              {trend.dir === 'down' ? (
                <ArrowDownRight size={13} />
              ) : (
                <ArrowUpRight size={13} />
              )}
              {trend.value}
            </span>
          )}
          {footnote && <span className="fs-truncate">{footnote}</span>}
        </div>
      )}
    </article>
  );
}
