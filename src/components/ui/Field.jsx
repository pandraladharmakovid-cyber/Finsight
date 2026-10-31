import { useEffect, useId, useRef } from 'react';

/**
 * Labelled form control wrapper.
 * Renders <input>, <select> or <textarea> depending on `as`.
 */
export default function Field({
  label,
  as = 'input',
  options = [],
  error,
  hint,
  prefix,
  icon: Icon = null,
  value,
  onChange,
  className = '',
  ...rest
}) {
  const id = useId();
  const Control = as === 'select' ? 'select' : as === 'textarea' ? 'textarea' : 'input';

  const commonProps = {
    id,
    value: value ?? '',
    onChange,
    className: `fs-${as === 'select' ? 'select' : as === 'textarea' ? 'textarea' : 'input'} ${
      error ? 'is-invalid' : ''
    } ${prefix ? 'has-prefix' : ''}`,
    'aria-invalid': Boolean(error),
    'aria-describedby': error ? `${id}-error` : undefined,
    ...rest,
  };

  if (as === 'select') {
    return (
      <div className={`fs-field ${className}`}>
        {label && (
          <label className="fs-label" htmlFor={id}>
            {label}
          </label>
        )}
        <select {...commonProps}>
          {options.map((option) => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </select>
        {error && (
          <span className="fs-error-text" id={`${id}-error`}>
            {error}
          </span>
        )}
        {hint && !error && <span className="fs-xs fs-dim-2">{hint}</span>}
      </div>
    );
  }

  if (as === 'textarea') {
    return (
      <div className={`fs-field ${className}`}>
        {label && (
          <label className="fs-label" htmlFor={id}>
            {label}
          </label>
        )}
        <textarea {...commonProps} />
        {error && (
          <span className="fs-error-text" id={`${id}-error`}>
            {error}
          </span>
        )}
        {hint && !error && <span className="fs-xs fs-dim-2">{hint}</span>}
      </div>
    );
  }

  const input = <input {...commonProps} />;

  return (
    <div className={`fs-field ${className}`}>
      {label && (
        <label className="fs-label" htmlFor={id}>
          {label}
        </label>
      )}

      {prefix || Icon ? (
        <div className="fs-input-affix">
          {Icon ? <Icon size={15} /> : <span className="fs-input-affix-prefix">{prefix}</span>}
          {input}
        </div>
      ) : (
        input
      )}

      {error && (
        <span className="fs-error-text" id={`${id}-error`}>
          {error}
        </span>
      )}
      {hint && !error && <span className="fs-xs fs-dim-2">{hint}</span>}
    </div>
  );
}

/** Accessible toggle switch. */
export function Switch({ checked, onChange, label, hint }) {
  const id = useId();

  return (
    <div className="fs-row-between" style={{ gap: 16 }}>
      <div>
        {label && (
          <label htmlFor={id} className="fs-sm" style={{ color: 'var(--text-1)', fontWeight: 600 }}>
            {label}
          </label>
        )}
        {hint && <p className="fs-xs fs-dim">{hint}</p>}
      </div>
      <button
        id={id}
        type="button"
        role="switch"
        aria-checked={checked}
        aria-label={label}
        className={`fs-switch ${checked ? 'is-on' : ''}`}
        onClick={() => onChange(!checked)}
      />
    </div>
  );
}
