import { useId, useMemo, useState } from 'react';
import { moneyShort } from '../../lib/format.js';

/* ==========================================================================
   AREA / LINE CHART
   ========================================================================== */

export function AreaChart({
  data = [],
  height = 220,
  color = 'var(--violet)',
  color2 = 'var(--cyan)',
  valueKey = 'value',
  labelKey = 'label',
  formatValue = moneyShort,
  showGrid = true,
}) {
  const gid = useId().replace(/:/g, '');
  const [hover, setHover] = useState(null);

  const padding = { top: 16, right: 10, bottom: 26, left: 10 };
  const width = 640;

  const { points, max, linePath, areaPath } = useMemo(() => {
    const source = data.length ? data : [{ label: '—', value: 0 }];

    /*
     * A single data point has no segment to draw. Duplicate it so the
     * line and area still render as a flat, readable series.
     */
    const rows =
      source.length === 1
        ? [source[0], { ...source[0], label: '' }]
        : source;
    const values = rows.map((row) => Number(row[valueKey]) || 0);

    /* With one real data point, pad the peak so the point sits mid-chart
       instead of pinning to the top edge. */
    const peak =
      source.length === 1
        ? Math.max(values[0] * 1.6, 1)
        : Math.max(...values, 1);

    const innerW = width - padding.left - padding.right;
    const innerH = height - padding.top - padding.bottom;

    const step = rows.length > 1 ? innerW / (rows.length - 1) : 0;

    const pts = rows.map((row, index) => {
      const value = Number(row[valueKey]) || 0;
      return {
        x: padding.left + index * step,
        y: padding.top + innerH - (value / peak) * innerH,
        value,
        label: row[labelKey] ?? '',
        raw: row,
      };
    });

    const line = pts
      .map((p, i) => `${i === 0 ? 'M' : 'L'}${p.x.toFixed(2)},${p.y.toFixed(2)}`)
      .join(' ');

    const area = `${line} L${pts[pts.length - 1].x.toFixed(2)},${
      padding.top + innerH
    } L${pts[0].x.toFixed(2)},${padding.top + innerH} Z`;

    return { points: pts, max: peak, linePath: line, areaPath: area };
  }, [data, height, valueKey, labelKey]);

  const innerH = height - padding.top - padding.bottom;

  return (
    <div style={{ position: 'relative', width: '100%' }}>
      <svg
        className="fs-chart"
        viewBox={`0 0 ${width} ${height}`}
        preserveAspectRatio="none"
        style={{ height }}
        onMouseLeave={() => setHover(null)}
        role="img"
        aria-label="Trend chart"
      >
        <defs>
          <linearGradient id={`area-${gid}`} x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor={color} stopOpacity="0.42" />
            <stop offset="60%" stopColor={color} stopOpacity="0.1" />
            <stop offset="100%" stopColor={color} stopOpacity="0" />
          </linearGradient>

          <linearGradient id={`stroke-${gid}`} x1="0" y1="0" x2="1" y2="0">
            <stop offset="0%" stopColor={color} />
            <stop offset="100%" stopColor={color2} />
          </linearGradient>
        </defs>

        {showGrid &&
          [0, 0.25, 0.5, 0.75, 1].map((ratio) => (
            <line
              key={ratio}
              className="fs-chart-grid-line"
              x1={padding.left}
              x2={width - padding.right}
              y1={padding.top + innerH * ratio}
              y2={padding.top + innerH * ratio}
            />
          ))}

        <path className="fs-chart-area" d={areaPath} fill={`url(#area-${gid})`} />

        <path
          className="fs-chart-line"
          d={linePath}
          fill="none"
          stroke={`url(#stroke-${gid})`}
          strokeWidth="2.4"
          strokeLinecap="round"
          strokeLinejoin="round"
          style={{ '--dash': 3000 }}
        />

        {points.map((point, index) => (
          <g key={index}>
            <circle
              className="fs-chart-dot"
              cx={point.x}
              cy={point.y}
              r={hover === index ? 5 : 3}
              fill="var(--ink-900)"
              stroke={color2}
              strokeWidth="2"
              style={{ animationDelay: `${index * 45}ms`, transition: 'r 160ms ease' }}
            />

            <rect
              x={point.x - 16}
              y={0}
              width={32}
              height={height}
              fill="transparent"
              onMouseEnter={() => setHover(index)}
            />
          </g>
        ))}

        {points.map(
          (point, index) =>
            point.label &&
            index % Math.ceil(points.length / 6 || 1) === 0 && (
              <text
                key={`label-${index}`}
                className="fs-chart-axis-label"
                x={point.x}
                y={height - 8}
                textAnchor="middle"
              >
                {point.label}
              </text>
            ),
        )}
      </svg>

      {hover !== null && points[hover] && (
        <div
          className="fs-chart-tip"
          style={{
            left: `${(points[hover].x / width) * 100}%`,
            top: `${(points[hover].y / height) * 100}%`,
          }}
        >
          <strong style={{ color: 'var(--text-1)' }}>
            {formatValue(points[hover].value)}
          </strong>
          <span className="fs-dim" style={{ marginLeft: 6 }}>
            {points[hover].label}
          </span>
        </div>
      )}
    </div>
  );
}

/* ==========================================================================
   DONUT CHART
   ========================================================================== */

const DONUT_COLORS = [
  '#7c5cff',
  '#22d3ee',
  '#34d399',
  '#fbbf24',
  '#fb7185',
  '#a78bfa',
  '#38bdf8',
  '#f472b6',
  '#facc15',
  '#4ade80',
];

export function DonutChart({
  data = [],
  size = 190,
  thickness = 20,
  centerLabel,
  centerValue,
  formatValue = moneyShort,
}) {
  const [hover, setHover] = useState(null);

  const total = data.reduce((sum, item) => sum + (Number(item.value) || 0), 0);

  const radius = (size - thickness) / 2;
  const circumference = 2 * Math.PI * radius;

  let offset = 0;

  const segments = data.map((item, index) => {
    const value = Number(item.value) || 0;
    const fraction = total > 0 ? value / total : 0;
    const length = fraction * circumference;

    const segment = {
      ...item,
      value,
      fraction,
      length,
      offset,
      color: item.color || DONUT_COLORS[index % DONUT_COLORS.length],
    };

    offset += length;
    return segment;
  });

  return (
    <div
      className="fs-row fs-gap-24 fs-wrap"
      style={{ justifyContent: 'center', alignItems: 'center' }}
    >
      <div style={{ position: 'relative', width: size, height: size, flex: `0 0 ${size}px` }}>
        <svg width={size} height={size} style={{ transform: 'rotate(-90deg)' }}>
          <circle
            className="fs-ring-track"
            cx={size / 2}
            cy={size / 2}
            r={radius}
            fill="none"
            strokeWidth={thickness}
          />

          {segments.map((segment, index) => (
            <circle
              key={index}
              className="fs-donut-seg"
              cx={size / 2}
              cy={size / 2}
              r={radius}
              fill="none"
              stroke={segment.color}
              strokeWidth={hover === index ? thickness + 5 : thickness}
              strokeDasharray={`${segment.length} ${circumference - segment.length}`}
              strokeDashoffset={-segment.offset}
              strokeLinecap="butt"
              style={{
                opacity: hover === null || hover === index ? 1 : 0.35,
                cursor: 'pointer',
                filter:
                  hover === index
                    ? `drop-shadow(0 0 8px ${segment.color})`
                    : 'none',
                transitionDelay: `${index * 60}ms`,
              }}
              onMouseEnter={() => setHover(index)}
              onMouseLeave={() => setHover(null)}
            />
          ))}
        </svg>

        <div
          style={{
            position: 'absolute',
            inset: 0,
            display: 'grid',
            placeContent: 'center',
            textAlign: 'center',
            pointerEvents: 'none',
          }}
        >
          <div className="fs-xs fs-dim-2" style={{ letterSpacing: '0.12em' }}>
            {hover !== null ? segments[hover].label : centerLabel || 'TOTAL'}
          </div>
          <div
            style={{
              fontSize: 20,
              fontWeight: 700,
              color: 'var(--text-1)',
              letterSpacing: '-0.02em',
            }}
          >
            {hover !== null
              ? formatValue(segments[hover].value)
              : centerValue ?? formatValue(total)}
          </div>
          {hover !== null && (
            <div className="fs-xs" style={{ color: segments[hover].color }}>
              {(segments[hover].fraction * 100).toFixed(1)}%
            </div>
          )}
        </div>
      </div>

      <ul className="fs-col fs-gap-8" style={{ minWidth: 150, flex: 1 }}>
        {segments.map((segment, index) => (
          <li
            key={index}
            className="fs-row fs-gap-8"
            style={{
              justifyContent: 'space-between',
              fontSize: 12,
              cursor: 'pointer',
              opacity: hover === null || hover === index ? 1 : 0.45,
              transition: 'opacity 160ms ease',
            }}
            onMouseEnter={() => setHover(index)}
            onMouseLeave={() => setHover(null)}
          >
            <span className="fs-row fs-gap-8" style={{ minWidth: 0 }}>
              <span
                style={{
                  width: 8,
                  height: 8,
                  borderRadius: 3,
                  background: segment.color,
                  flex: '0 0 8px',
                  boxShadow: `0 0 8px ${segment.color}`,
                }}
              />
              <span className="fs-truncate" style={{ color: 'var(--text-2)' }}>
                {segment.label}
              </span>
            </span>
            <span className="fs-num fs-dim">{formatValue(segment.value)}</span>
          </li>
        ))}

        {segments.length === 0 && (
          <li className="fs-xs fs-dim-2">No data for this period.</li>
        )}
      </ul>
    </div>
  );
}

/* ==========================================================================
   BAR CHART (grouped / single)
   ========================================================================== */

export function BarChart({
  data = [],
  height = 200,
  color = 'var(--violet)',
  color2 = 'var(--cyan)',
  formatValue = moneyShort,
  horizontal = false,
}) {
  const [hover, setHover] = useState(null);

  const max = Math.max(
    ...data.map((row) => Math.max(Number(row.value) || 0, Number(row.value2) || 0)),
    1,
  );

  if (horizontal) {
    return (
      <div className="fs-col fs-gap-12">
        {data.map((row, index) => {
          const width = ((Number(row.value) || 0) / max) * 100;

          return (
            <div key={index} className="fs-col fs-gap-6">
              <div className="fs-row-between" style={{ fontSize: 12 }}>
                <span className="fs-truncate" style={{ color: 'var(--text-2)' }}>
                  {row.label}
                </span>
                <span className="fs-num fs-dim">{formatValue(row.value)}</span>
              </div>
              <div className="fs-meter">
                <span
                  style={{
                    width: `${width}%`,
                    background: row.color || `linear-gradient(90deg, ${color}, ${color2})`,
                    transitionDelay: `${index * 60}ms`,
                  }}
                />
              </div>
            </div>
          );
        })}

        {data.length === 0 && (
          <p className="fs-xs fs-dim-2">Nothing to chart yet.</p>
        )}
      </div>
    );
  }

  const barWidth = 100 / Math.max(data.length, 1);

  return (
    <div style={{ position: 'relative' }}>
      <svg
        className="fs-chart"
        viewBox={`0 0 100 ${height}`}
        preserveAspectRatio="none"
        style={{ height }}
        onMouseLeave={() => setHover(null)}
      >
        {[0, 0.5, 1].map((ratio) => (
          <line
            key={ratio}
            className="fs-chart-grid-line"
            x1="0"
            x2="100"
            y1={10 + (height - 40) * ratio}
            y2={10 + (height - 40) * ratio}
          />
        ))}

        {data.map((row, index) => {
          const value = Number(row.value) || 0;
          const value2 = Number(row.value2) || 0;

          const usable = height - 40;
          const h1 = (value / max) * usable;
          const h2 = (value2 / max) * usable;

          const x = index * barWidth + barWidth * 0.16;
          const w = barWidth * 0.68;

          return (
            <g key={index} onMouseEnter={() => setHover(index)}>
              <rect
                className="fs-bar-grow"
                x={x}
                y={10 + usable - h1}
                width={row.value2 !== undefined ? w * 0.46 : w}
                height={Math.max(h1, 1)}
                rx="1.4"
                fill={color}
                opacity={hover === null || hover === index ? 0.95 : 0.4}
                style={{ animationDelay: `${index * 55}ms` }}
              />

              {row.value2 !== undefined && (
                <rect
                  className="fs-bar-grow"
                  x={x + w * 0.5}
                  y={10 + usable - h2}
                  width={w * 0.46}
                  height={Math.max(h2, 1)}
                  rx="1.4"
                  fill={color2}
                  opacity={hover === null || hover === index ? 0.95 : 0.4}
                  style={{ animationDelay: `${index * 55 + 40}ms` }}
                />
              )}

              <rect
                x={index * barWidth}
                y={0}
                width={barWidth}
                height={height}
                fill="transparent"
              />
            </g>
          );
        })}
      </svg>

      <div className="fs-row" style={{ justifyContent: 'space-between', marginTop: 4 }}>
        {data.map((row, index) => (
          <span
            key={index}
            className="fs-xs fs-dim-2 fs-truncate"
            style={{ flex: 1, textAlign: 'center' }}
          >
            {row.label}
          </span>
        ))}
      </div>

      {hover !== null && data[hover] && (
        <div
          className="fs-chart-tip"
          style={{
            left: `${(hover + 0.5) * barWidth}%`,
            top: '4px',
          }}
        >
          <strong>{formatValue(data[hover].value)}</strong>
          {data[hover].value2 !== undefined && (
            <span style={{ marginLeft: 8, color: 'var(--cyan-soft)' }}>
              {formatValue(data[hover].value2)}
            </span>
          )}
          <span className="fs-dim" style={{ marginLeft: 6 }}>
            {data[hover].label}
          </span>
        </div>
      )}
    </div>
  );
}

/* ==========================================================================
   PROGRESS RING
   ========================================================================== */

export function ProgressRing({
  value = 0,
  size = 72,
  thickness = 7,
  color = 'var(--violet)',
  color2 = 'var(--cyan)',
  label,
  children,
}) {
  const gid = useId().replace(/:/g, '');
  const safe = Math.max(0, Math.min(Number(value) || 0, 100));

  const radius = (size - thickness) / 2;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference - (safe / 100) * circumference;

  return (
    <div style={{ position: 'relative', width: size, height: size, flex: `0 0 ${size}px` }}>
      <svg width={size} height={size} style={{ transform: 'rotate(-90deg)' }}>
        <defs>
          <linearGradient id={`ring-${gid}`} x1="0" y1="0" x2="1" y2="1">
            <stop offset="0%" stopColor={color} />
            <stop offset="100%" stopColor={color2} />
          </linearGradient>
        </defs>

        <circle
          className="fs-ring-track"
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          strokeWidth={thickness}
        />

        <circle
          className="fs-ring-value"
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke={`url(#ring-${gid})`}
          strokeWidth={thickness}
          strokeLinecap="round"
          strokeDasharray={circumference}
          strokeDashoffset={offset}
        />
      </svg>

      <div
        style={{
          position: 'absolute',
          inset: 0,
          display: 'grid',
          placeContent: 'center',
          textAlign: 'center',
        }}
      >
        {children ?? (
          <>
            <span
              style={{
                fontSize: size > 64 ? 15 : 12,
                fontWeight: 700,
                color: 'var(--text-1)',
                lineHeight: 1,
              }}
            >
              {safe.toFixed(0)}%
            </span>
            {label && (
              <span className="fs-xs fs-dim-2" style={{ marginTop: 2 }}>
                {label}
              </span>
            )}
          </>
        )}
      </div>
    </div>
  );
}

/* ==========================================================================
   SPARKLINE
   ========================================================================== */

export function Sparkline({
  values = [],
  width = 110,
  height = 34,
  color = 'var(--mint)',
}) {
  if (!values.length) return null;

  const max = Math.max(...values, 1);
  const min = Math.min(...values, 0);
  const span = max - min || 1;
  const step = values.length > 1 ? width / (values.length - 1) : 0;

  const points = values
    .map((value, index) => {
      const x = index * step;
      const y = height - ((value - min) / span) * (height - 6) - 3;
      return `${x.toFixed(1)},${y.toFixed(1)}`;
    })
    .join(' ');

  return (
    <svg width={width} height={height} style={{ overflow: 'visible' }}>
      <polyline
        points={points}
        fill="none"
        stroke={color}
        strokeWidth="1.8"
        strokeLinecap="round"
        strokeLinejoin="round"
        style={{ filter: `drop-shadow(0 0 5px ${color})` }}
      />
    </svg>
  );
}
