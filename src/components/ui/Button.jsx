import { useCallback, useRef } from 'react';
import { Loader2 } from 'lucide-react';

/**
 * Button with a material-style ripple and spring press feedback.
 */
export default function Button({
  children,
  variant = 'default',
  size = 'md',
  icon: Icon = null,
  iconRight: IconRight = null,
  loading = false,
  block = false,
  className = '',
  onClick,
  type = 'button',
  ...rest
}) {
  const ref = useRef(null);

  const handleClick = useCallback(
    (event) => {
      const node = ref.current;

      if (node) {
        const rect = node.getBoundingClientRect();
        const size = Math.max(rect.width, rect.height);
        const ripple = document.createElement('span');

        ripple.className = 'fs-ripple';
        ripple.style.width = `${size}px`;
        ripple.style.height = `${size}px`;
        ripple.style.left = `${event.clientX - rect.left - size / 2}px`;
        ripple.style.top = `${event.clientY - rect.top - size / 2}px`;

        node.appendChild(ripple);
        window.setTimeout(() => ripple.remove(), 640);
      }

      if (!loading && onClick) onClick(event);
    },
    [onClick, loading],
  );

  const classes = [
    'fs-btn',
    variant === 'primary' && 'fs-btn-primary',
    variant === 'ghost' && 'fs-btn-ghost',
    variant === 'danger' && 'fs-btn-danger',
    size === 'sm' && 'fs-btn-sm',
    size === 'lg' && 'fs-btn-lg',
    block && 'fs-btn-block',
    className,
  ]
    .filter(Boolean)
    .join(' ');

  return (
    <button
      ref={ref}
      type={type}
      className={classes}
      onClick={handleClick}
      disabled={loading || rest.disabled}
      {...rest}
    >
      {loading ? (
        <Loader2 size={15} className="fs-spin" />
      ) : (
        Icon && <Icon size={size === 'sm' ? 14 : 16} />
      )}

      {children}

      {IconRight && !loading && (
        <IconRight size={size === 'sm' ? 14 : 16} />
      )}
    </button>
  );
}
