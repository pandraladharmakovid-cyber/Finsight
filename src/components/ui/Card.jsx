import { useCallback } from 'react';

/**
 * Glass card with an interactive cursor-tracked sheen.
 */
export default function Card({
  children,
  title,
  subtitle,
  action,
  icon: Icon = null,
  interactive = false,
  glow = false,
  className = '',
  bodyClassName = '',
  padded = true,
  style,
  ...rest
}) {
  const trackSheen = useCallback((event) => {
    const node = event.currentTarget;
    const rect = node.getBoundingClientRect();
    node.style.setProperty(
      '--sheen-x',
      `${((event.clientX - rect.left) / rect.width) * 100}%`,
    );
    node.style.setProperty(
      '--sheen-y',
      `${((event.clientY - rect.top) / rect.height) * 100}%`,
    );
  }, []);

  const classes = [
    'fs-card',
    interactive && 'is-interactive',
    glow && 'fs-card-glow',
    className,
  ]
    .filter(Boolean)
    .join(' ');

  const hasHead = Boolean(title || subtitle || action || Icon);

  return (
    <section
      className={classes}
      onMouseMove={interactive ? trackSheen : undefined}
      style={style}
      {...rest}
    >
      {hasHead && (
        <header className="fs-card-head">
          <div className="fs-row fs-gap-10" style={{ minWidth: 0 }}>
            {Icon && (
              <span
                className="fs-stat-icon"
                style={{ '--icon-color': 'var(--violet-soft)' }}
              >
                <Icon size={16} />
              </span>
            )}
            <div style={{ minWidth: 0 }}>
              {title && <h3 className="fs-card-title fs-truncate">{title}</h3>}
              {subtitle && <p className="fs-card-sub">{subtitle}</p>}
            </div>
          </div>
          {action && <div className="fs-row fs-gap-6">{action}</div>}
        </header>
      )}

      <div
        className={`${hasHead ? 'fs-card-body' : padded ? 'fs-card-pad' : ''} ${bodyClassName}`}
      >
        {children}
      </div>
    </section>
  );
}
