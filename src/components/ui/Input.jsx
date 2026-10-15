import React, {
  forwardRef,
  useId,
  useState,
} from 'react';

import {
  AlertCircle,
  Check,
  Eye,
  EyeOff,
  Search,
  X,
} from 'lucide-react';

const Input = forwardRef(
  function Input(
    {
      label,
      hint,
      error,
      success,

      value,
      defaultValue,

      onChange,
      onFocus,
      onBlur,

      type = 'text',
      name,
      id,

      placeholder,

      icon,
      iconRight,

      clearable = false,
      onClear,

      showPasswordToggle = false,

      disabled = false,
      readOnly = false,
      required = false,

      size = 'md',
      variant = 'default',

      fullWidth = true,

      prefix,
      suffix,

      maxLength,
      min,
      max,
      step,

      autoComplete,
      autoFocus,

      className = '',
      inputClassName = '',
      style = {},

      'aria-label': ariaLabel,
      'aria-describedby': ariaDescribedBy,

      ...props
    },
    ref,
  ) {
    const generatedId =
      useId();

    const inputId =
      id ||
      `fs-input-${generatedId}`;

    const hintId =
      `${inputId}-hint`;

    const errorId =
      `${inputId}-error`;

    const [
      focused,
      setFocused,
    ] = useState(false);

    const [
      showPassword,
      setShowPassword,
    ] = useState(false);

    const [
      hovered,
      setHovered,
    ] = useState(false);

    const actualType =
      type === 'password' &&
      showPassword
        ? 'text'
        : type;

    const hasError =
      Boolean(error);

    const hasSuccess =
      Boolean(success) &&
      !hasError;

    const hasValue =
      value !== undefined
        ? String(value).length > 0
        : String(
            defaultValue ?? '',
          ).length > 0;

    const canClear =
      clearable &&
      hasValue &&
      !disabled &&
      !readOnly;

    const leftIcon =
      icon ||
      (type === 'search' ? (
        <Search />
      ) : null);

    const rightIcon =
      iconRight;

    const describedBy = [
      ariaDescribedBy,
      hint && hintId,
      error && errorId,
    ]
      .filter(Boolean)
      .join(' ') || undefined;

    const sizeMap = {
      sm: {
        height: 40,
        padding: 12,
        font: 12,
        icon: 16,
        radius: 10,
      },

      md: {
        height: 46,
        padding: 14,
        font: 13,
        icon: 18,
        radius: 12,
      },

      lg: {
        height: 54,
        padding: 16,
        font: 14,
        icon: 19,
        radius: 14,
      },

      xl: {
        height: 62,
        padding: 19,
        font: 15,
        icon: 21,
        radius: 16,
      },
    };

    const config =
      sizeMap[size] ??
      sizeMap.md;

    function handleFocus(
      event,
    ) {
      setFocused(true);
      onFocus?.(event);
    }

    function handleBlur(
      event,
    ) {
      setFocused(false);
      onBlur?.(event);
    }

    function handleClear() {
      if (onClear) {
        onClear();
        return;
      }

      if (onChange) {
        onChange({
          target: {
            name,
            value: '',
          },
          currentTarget: {
            name,
            value: '',
          },
        });
      }
    }

    const stateColor =
      hasError
        ? '#f87171'
        : hasSuccess
          ? '#34d399'
          : focused
            ? '#a78bfa'
            : 'rgba(148,163,184,.16)';

    return (
      <div
        className={[
          'fs-input-field',
          fullWidth
            ? 'fs-input-full'
            : '',
          className,
        ]
          .filter(Boolean)
          .join(' ')}
        style={style}
      >
        {(label ||
          required) && (
          <div className="fs-input-label-row">
            {label && (
              <label
                htmlFor={inputId}
                className="fs-input-label"
              >
                {label}
                {required && (
                  <span className="fs-input-required">
                    *
                  </span>
                )}
              </label>
            )}

            {maxLength &&
              hasValue && (
                <span className="fs-input-counter">
                  {String(
                    value ?? '',
                  ).length}
                  /
                  {maxLength}
                </span>
              )}
          </div>
        )}

        <div
          className={[
            'fs-input-shell',
            `fs-input-${size}`,
            `fs-input-variant-${variant}`,
            focused
              ? 'fs-input-focused'
              : '',
            hovered
              ? 'fs-input-hovered'
              : '',
            hasError
              ? 'fs-input-error'
              : '',
            hasSuccess
              ? 'fs-input-success'
              : '',
            disabled
              ? 'fs-input-disabled'
              : '',
          ]
            .filter(Boolean)
            .join(' ')}
          style={{
            '--input-height':
              `${config.height}px`,
            '--input-padding':
              `${config.padding}px`,
            '--input-font':
              `${config.font}px`,
            '--input-icon':
              `${config.icon}px`,
            '--input-radius':
              `${config.radius}px`,
            '--input-state':
              stateColor,
          }}
          onMouseEnter={() =>
            setHovered(true)
          }
          onMouseLeave={() =>
            setHovered(false)
          }
        >
          <span className="fs-input-glow" />

          {leftIcon && (
            <span className="fs-input-left-icon">
              {React.isValidElement(
                leftIcon,
              )
                ? React.cloneElement(
                    leftIcon,
                    {
                      size:
                        leftIcon.props
                          ?.size ??
                        config.icon,
                      strokeWidth:
                        leftIcon.props
                          ?.strokeWidth ??
                        2,
                    },
                  )
                : leftIcon}
            </span>
          )}

          {prefix && (
            <span className="fs-input-prefix">
              {prefix}
            </span>
          )}

          <input
            ref={ref}
            id={inputId}
            name={name}
            type={actualType}
            value={value}
            defaultValue={
              defaultValue
            }
            onChange={onChange}
            onFocus={handleFocus}
            onBlur={handleBlur}
            placeholder={placeholder}
            disabled={disabled}
            readOnly={readOnly}
            required={required}
            autoComplete={
              autoComplete
            }
            autoFocus={autoFocus}
            maxLength={maxLength}
            min={min}
            max={max}
            step={step}
            aria-label={ariaLabel}
            aria-invalid={
              hasError
                ? true
                : undefined
            }
            aria-describedby={
              describedBy
            }
            className={[
              'fs-input-control',
              inputClassName,
            ]
              .filter(Boolean)
              .join(' ')}
            {...props}
          />

          {suffix && (
            <span className="fs-input-suffix">
              {suffix}
            </span>
          )}

          {canClear && (
            <button
              type="button"
              className="fs-input-action"
              aria-label="Clear input"
              onClick={handleClear}
              tabIndex={-1}
            >
              <X
                size={
                  Math.max(
                    14,
                    config.icon - 2,
                  )
              }
                strokeWidth={2}
              />
            </button>
          )}

          {showPasswordToggle &&
            type ===
              'password' && (
              <button
                type="button"
                className="fs-input-action"
                aria-label={
                  showPassword
                    ? 'Hide password'
                    : 'Show password'
                }
                onClick={() =>
                  setShowPassword(
                    (current) =>
                      !current,
                  )
                }
              >
                {showPassword ? (
                  <EyeOff
                    size={config.icon}
                  />
                ) : (
                  <Eye
                    size={config.icon}
                  />
                )}
              </button>
            )}

          {rightIcon && (
            <span className="fs-input-right-icon">
              {React.isValidElement(
                rightIcon,
              )
                ? React.cloneElement(
                    rightIcon,
                    {
                      size:
                        rightIcon.props
                          ?.size ??
                        config.icon,
                      strokeWidth:
                        rightIcon.props
                          ?.strokeWidth ??
                        2,
                    },
                  )
                : rightIcon}
            </span>
          )}

          {hasSuccess &&
            !canClear &&
            !showPasswordToggle && (
              <span className="fs-input-status fs-input-status-success">
                <Check
                  size={
                    config.icon
                  }
                  strokeWidth={2.5}
                />
              </span>
            )}

          {hasError &&
            !canClear &&
            !showPasswordToggle && (
              <span className="fs-input-status fs-input-status-error">
                <AlertCircle
                  size={
                    config.icon
                  }
                  strokeWidth={2.2}
                />
              </span>
            )}

          {focused && (
            <span className="fs-input-focus-line" />
          )}
        </div>

        {(hint || error || success) && (
          <div className="fs-input-message">
            {error ? (
              <span
                id={errorId}
                className="fs-input-error-text"
              >
                <AlertCircle
                  size={13}
                />
                {error}
              </span>
            ) : success ? (
              <span className="fs-input-success-text">
                <Check size={13} />
                {success}
              </span>
            ) : (
              <span
                id={hintId}
                className="fs-input-hint"
              >
                {hint}
              </span>
            )}
          </div>
        )}

        <style>{`
          .fs-input-field {
            position: relative;
            display: flex;
            flex-direction: column;
            gap: 7px;
            min-width: 0;
          }

          .fs-input-full {
            width: 100%;
          }

          .fs-input-label-row {
            display: flex;
            align-items: center;
            justify-content: space-between;
            gap: 12px;
            min-height: 18px;
          }

          .fs-input-label {
            color: #cbd5e1;
            font-size: 11px;
            font-weight: 650;
            line-height: 1.3;
            letter-spacing: .005em;
            cursor: pointer;
          }

          .fs-input-required {
            margin-left: 3px;
            color: #f87171;
          }

          .fs-input-counter {
            color: #475569;
            font-size: 9px;
            font-weight: 600;
            font-variant-numeric: tabular-nums;
          }

          .fs-input-shell {
            position: relative;
            display: flex;
            align-items: center;
            width: 100%;
            height: var(--input-height);
            min-width: 0;
            box-sizing: border-box;
            border: 1px solid
              rgba(148,163,184,.15);
            border-radius: var(--input-radius);
            background:
              linear-gradient(
                135deg,
                rgba(15,23,42,.88),
                rgba(15,23,42,.68)
              );
            overflow: hidden;
            isolation: isolate;
            transition:
              border-color .22s ease,
              background .22s ease,
              box-shadow .25s ease,
              transform .2s
                cubic-bezier(.22,1,.36,1);
          }

          .fs-input-shell::before {
            content: '';
            position: absolute;
            inset: 0;
            z-index: -2;
            pointer-events: none;
            background:
              radial-gradient(
                circle at 0% 0%,
                rgba(139,92,246,.07),
                transparent 35%
              );
          }

          .fs-input-shell:hover {
            border-color:
              rgba(148,163,184,.26);
            background:
              linear-gradient(
                135deg,
                rgba(15,23,42,.94),
                rgba(15,23,42,.76)
              );
          }

          .fs-input-focused {
            border-color:
              var(--input-state);
            box-shadow:
              0 0 0 3px
                color-mix(
                  in srgb,
                  var(--input-state) 12%,
                  transparent
                ),
              0 12px 35px
                rgba(0,0,0,.14);
          }

          .fs-input-error {
            border-color:
              rgba(248,113,113,.52);
          }

          .fs-input-success {
            border-color:
              rgba(52,211,153,.45);
          }

          .fs-input-disabled {
            opacity: .5;
            cursor: not-allowed;
            background:
              rgba(15,23,42,.42);
          }

          .fs-input-glow {
            position: absolute;
            z-index: -1;
            top: -60px;
            left: 8%;
            width: 40%;
            height: 90px;
            border-radius: 50%;
            background:
              rgba(139,92,246,.12);
            filter: blur(35px);
            opacity: 0;
            pointer-events: none;
            transition: opacity .25s ease;
          }

          .fs-input-focused
          .fs-input-glow {
            opacity: 1;
          }

          .fs-input-focus-line {
            position: absolute;
            left: 8%;
            right: 8%;
            bottom: -1px;
            height: 1px;
            border-radius: 999px;
            background:
              linear-gradient(
                90deg,
                transparent,
                var(--input-state),
                transparent
              );
            box-shadow:
              0 0 10px
                var(--input-state);
            pointer-events: none;
          }

          .fs-input-control {
            width: 100%;
            min-width: 0;
            height: 100%;
            padding:
              0 var(--input-padding);
            border: 0;
            outline: 0;
            background: transparent;
            color: #f8fafc;
            font-family: inherit;
            font-size: var(--input-font);
            font-weight: 500;
            line-height: 1;
            letter-spacing: -.005em;
            caret-color: #a78bfa;
          }

          .fs-input-control::placeholder {
            color: #475569;
            opacity: 1;
            transition:
              color .2s ease,
              opacity .2s ease;
          }

          .fs-input-focused
          .fs-input-control::placeholder {
            color: #64748b;
          }

          .fs-input-control:disabled {
            cursor: not-allowed;
          }

          .fs-input-control:-webkit-autofill,
          .fs-input-control:-webkit-autofill:hover,
          .fs-input-control:-webkit-autofill:focus {
            -webkit-text-fill-color:
              #f8fafc;
            box-shadow:
              0 0 0 1000px
              rgba(15,23,42,.9)
              inset;
            transition:
              background-color 9999s
              ease-out;
          }

          .fs-input-left-icon,
          .fs-input-right-icon {
            display: flex;
            align-items: center;
            justify-content: center;
            flex: 0 0 auto;
            color: #64748b;
            transition:
              color .2s ease,
              transform .2s ease;
          }

          .fs-input-left-icon {
            margin-left:
              var(--input-padding);
          }

          .fs-input-right-icon {
            margin-right:
              var(--input-padding);
          }

          .fs-input-focused
          .fs-input-left-icon {
            color: #a78bfa;
            transform: scale(1.03);
          }

          .fs-input-prefix,
          .fs-input-suffix {
            flex: 0 0 auto;
            color: #64748b;
            font-size: var(--input-font);
            font-weight: 600;
            white-space: nowrap;
          }

          .fs-input-prefix {
            margin-left:
              var(--input-padding);
          }

          .fs-input-suffix {
            margin-right:
              var(--input-padding);
          }

          .fs-input-action {
            display: flex;
            align-items: center;
            justify-content: center;
            flex: 0 0 auto;
            width: 32px;
            height: 32px;
            margin-right: 6px;
            padding: 0;
            border: 0;
            border-radius: 8px;
            background:
              rgba(255,255,255,.035);
            color: #64748b;
            cursor: pointer;
            transition:
              color .18s ease,
              background .18s ease,
              transform .18s ease;
          }

          .fs-input-action:hover {
            color: #e2e8f0;
            background:
              rgba(255,255,255,.08);
            transform: scale(1.04);
          }

          .fs-input-status {
            display: flex;
            align-items: center;
            justify-content: center;
            flex: 0 0 auto;
            margin-right:
              var(--input-padding);
          }

          .fs-input-status-success {
            color: #34d399;
          }

          .fs-input-status-error {
            color: #f87171;
          }

          .fs-input-message {
            min-height: 14px;
          }

          .fs-input-hint,
          .fs-input-error-text,
          .fs-input-success-text {
            display: inline-flex;
            align-items: center;
            gap: 5px;
            font-size: 10px;
            font-weight: 500;
            line-height: 1.35;
          }

          .fs-input-hint {
            color: #475569;
          }

          .fs-input-error-text {
            color: #f87171;
          }

          .fs-input-success-text {
            color: #34d399;
          }

          .fs-input-variant-search
          .fs-input-shell {
            border-radius: 999px;
          }

          .fs-input-variant-glass
          .fs-input-shell {
            background:
              rgba(255,255,255,.045);
            backdrop-filter:
              blur(18px);
            -webkit-backdrop-filter:
              blur(18px);
          }

          @media (max-width: 520px) {
            .fs-input-label {
              font-size: 10px;
            }
          }

          @media (prefers-reduced-motion: reduce) {
            .fs-input-shell,
            .fs-input-glow,
            .fs-input-left-icon,
            .fs-input-action {
              transition: none !important;
            }
          }
        `}</style>
      </div>
    );
  },
);

Input.displayName = 'Input';

export default Input;