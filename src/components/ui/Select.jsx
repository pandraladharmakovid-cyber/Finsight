import React, {
  forwardRef,
  useEffect,
  useId,
  useRef,
  useState,
} from 'react';

import {
  Check,
  ChevronDown,
  Search,
  X,
} from 'lucide-react';

const Select = forwardRef(
  function Select(
    {
      label,
      hint,
      error,
      success,

      value,
      defaultValue = '',
      onChange,

      options = [],

      placeholder = 'Select an option',

      name,
      id,

      disabled = false,
      required = false,

      searchable = false,
      clearable = false,

      size = 'md',
      variant = 'default',

      fullWidth = true,

      icon,
      renderOption,
      renderValue,

      className = '',
      style = {},

      maxHeight = 280,

      ...props
    },
    ref,
  ) {
    const generatedId =
      useId();

    const selectId =
      id ||
      `fs-select-${generatedId}`;

    const hintId =
      `${selectId}-hint`;

    const errorId =
      `${selectId}-error`;

    const containerRef =
      useRef(null);

    const searchRef =
      useRef(null);

    const [
      open,
      setOpen,
    ] = useState(false);

    const [
      search,
      setSearch,
    ] = useState('');

    const [
      hovered,
      setHovered,
    ] = useState(false);

    const [
      internalValue,
      setInternalValue,
    ] = useState(
      defaultValue,
    );

    const selectedValue =
      value !== undefined
        ? value
        : internalValue;

    const selectedOption =
      options.find(
        (option) =>
          String(
            option?.value,
          ) ===
          String(
            selectedValue,
          ),
      ) || null;

    const filteredOptions =
      options.filter(
        (option) => {
          if (!searchable || !search) {
            return true;
          }

          const query =
            search.toLowerCase();

          return String(
            option?.label ??
              option?.value ??
              '',
          )
            .toLowerCase()
            .includes(query);
        },
      );

    const sizeMap = {
      sm: {
        height: 40,
        font: 12,
        padding: 12,
        radius: 10,
      },

      md: {
        height: 46,
        font: 13,
        padding: 14,
        radius: 12,
      },

      lg: {
        height: 54,
        font: 14,
        padding: 16,
        radius: 14,
      },

      xl: {
        height: 62,
        font: 15,
        padding: 19,
        radius: 16,
      },
    };

    const config =
      sizeMap[size] ??
      sizeMap.md;

    useEffect(() => {
      function handleOutside(
        event,
      ) {
        if (
          containerRef.current &&
          !containerRef.current.contains(
            event.target,
          )
        ) {
          setOpen(false);
          setSearch('');
        }
      }

      document.addEventListener(
        'mousedown',
        handleOutside,
      );

      return () => {
        document.removeEventListener(
          'mousedown',
          handleOutside,
        );
      };
    }, []);

    useEffect(() => {
      if (open && searchable) {
        window.setTimeout(() => {
          searchRef.current?.focus();
        }, 20);
      }
    }, [
      open,
      searchable,
    ]);

    function handleSelect(
      option,
    ) {
      if (
        option?.disabled ||
        disabled
      ) {
        return;
      }

      const nextValue =
        option?.value ?? '';

      if (
        value === undefined
      ) {
        setInternalValue(
          nextValue,
        );
      }

      onChange?.(
        nextValue,
        option,
      );

      setOpen(false);
      setSearch('');
    }

    function handleClear(
      event,
    ) {
      event.stopPropagation();

      if (disabled) {
        return;
      }

      if (
        value === undefined
      ) {
        setInternalValue('');
      }

      onChange?.('', null);
      setSearch('');
    }

    function handleKeyDown(
      event,
    ) {
      if (disabled) {
        return;
      }

      if (
        event.key ===
          'Enter' ||
        event.key === ' '
      ) {
        event.preventDefault();
        setOpen(
          (current) =>
            !current,
        );
      }

      if (
        event.key ===
        'Escape'
      ) {
        setOpen(false);
        setSearch('');
      }
    }

    const hasError =
      Boolean(error);

    const hasSuccess =
      Boolean(success) &&
      !hasError;

    return (
      <div
        ref={containerRef}
        className={[
          'fs-select-field',
          fullWidth
            ? 'fs-select-full'
            : '',
          className,
        ]
          .filter(Boolean)
          .join(' ')}
        style={style}
      >
        {label && (
          <div className="fs-select-label-row">
            <label
              htmlFor={selectId}
              className="fs-select-label"
            >
              {label}

              {required && (
                <span className="fs-select-required">
                  *
                </span>
              )}
            </label>
          </div>
        )}

        <div
          className={[
            'fs-select-shell',
            `fs-select-${size}`,
            `fs-select-variant-${variant}`,
            open
              ? 'fs-select-open'
              : '',
            hovered
              ? 'fs-select-hovered'
              : '',
            hasError
              ? 'fs-select-error'
              : '',
            hasSuccess
              ? 'fs-select-success'
              : '',
            disabled
              ? 'fs-select-disabled'
              : '',
          ]
            .filter(Boolean)
            .join(' ')}
          style={{
            '--select-height':
              `${config.height}px`,
            '--select-font':
              `${config.font}px`,
            '--select-padding':
              `${config.padding}px`,
            '--select-radius':
              `${config.radius}px`,
          }}
        >
          <button
            ref={ref}
            id={selectId}
            type="button"
            disabled={disabled}
            className="fs-select-trigger"
            aria-haspopup="listbox"
            aria-expanded={open}
            aria-invalid={
              hasError
                ? true
                : undefined
            }
            aria-describedby={
              error
                ? errorId
                : hint
                  ? hintId
                  : undefined
            }
            onClick={() =>
              setOpen(
                (current) =>
                  !current,
              )
            }
            onKeyDown={
              handleKeyDown
            }
            onMouseEnter={() =>
              setHovered(true)
            }
            onMouseLeave={() =>
              setHovered(false)
            }
            {...props}
          >
            <span className="fs-select-glow" />

            {icon && (
              <span className="fs-select-icon">
                {icon}
              </span>
            )}

            {selectedOption?.icon && (
              <span className="fs-select-option-icon">
                {selectedOption.icon}
              </span>
            )}

            <span
              className={[
                'fs-select-value',
                !selectedOption
                  ? 'fs-select-placeholder'
                  : '',
              ]
                .filter(Boolean)
                .join(' ')}
            >
              {selectedOption
                ? renderValue
                  ? renderValue(
                      selectedOption,
                    )
                  : selectedOption.label ??
                    selectedOption.value
                : placeholder}
            </span>

            {clearable &&
              selectedOption && (
                <span
                  role="button"
                  tabIndex={-1}
                  className="fs-select-clear"
                  onClick={
                    handleClear
                  }
                >
                  <X
                    size={14}
                  />
                </span>
              )}

            <span
              className={[
                'fs-select-chevron',
                open
                  ? 'fs-select-chevron-open'
                  : '',
              ]
                .filter(Boolean)
                .join(' ')}
            >
              <ChevronDown
                size={18}
                strokeWidth={2}
              />
            </span>
          </button>

          {open && (
            <div
              className="fs-select-menu"
              role="listbox"
              aria-labelledby={
                selectId
              }
              style={{
                '--select-menu-height':
                  `${maxHeight}px`,
              }}
            >
              <div className="fs-select-menu-glow" />

              {searchable && (
                <div className="fs-select-search">
                  <Search
                    size={15}
                    strokeWidth={2}
                  />

                  <input
                    ref={searchRef}
                    value={search}
                    onChange={(event) =>
                      setSearch(
                        event.target
                          .value,
                      )
                    }
                    placeholder="Search options..."
                    aria-label="Search options"
                  />

                  {search && (
                    <button
                      type="button"
                      onClick={() =>
                        setSearch('')
                      }
                    >
                      <X
                        size={13}
                      />
                    </button>
                  )}
                </div>
              )}

              <div className="fs-select-options">
                {filteredOptions.length ===
                0 ? (
                  <div className="fs-select-empty">
                    <Search
                      size={20}
                    />
                    <span>
                      No options found
                    </span>
                  </div>
                ) : (
                  filteredOptions.map(
                    (
                      option,
                      index,
                    ) => {
                      const isSelected =
                        String(
                          option?.value,
                        ) ===
                        String(
                          selectedValue,
                        );

                      return (
                        <button
                          key={
                            option?.value ??
                            index
                          }
                          type="button"
                          role="option"
                          aria-selected={
                            isSelected
                          }
                          disabled={
                            option?.disabled
                          }
                          className={[
                            'fs-select-option',
                            isSelected
                              ? 'fs-select-option-selected'
                              : '',
                            option?.disabled
                              ? 'fs-select-option-disabled'
                              : '',
                          ]
                            .filter(
                              Boolean,
                            )
                            .join(
                              ' ',
                            )}
                          onClick={() =>
                            handleSelect(
                              option,
                            )
                          }
                        >
                          <span className="fs-select-option-main">
                            {option?.icon && (
                              <span className="fs-select-option-icon">
                                {
                                  option.icon
                                }
                              </span>
                            )}

                            <span className="fs-select-option-copy">
                              {renderOption
                                ? renderOption(
                                    option,
                                    isSelected,
                                  )
                                : (
                                    <>
                                      <span className="fs-select-option-label">
                                        {option?.label ??
                                          option?.value}
                                      </span>

                                      {option?.description && (
                                        <span className="fs-select-option-description">
                                          {
                                            option.description
                                          }
                                        </span>
                                      )}
                                    </>
                                  )}
                            </span>
                          </span>

                          {isSelected && (
                            <span className="fs-select-check">
                              <Check
                                size={15}
                                strokeWidth={
                                  2.6
                                }
                              />
                            </span>
                          )}
                        </button>
                      );
                    },
                  )
                )}
              </div>
            </div>
          )}
        </div>

        {(hint ||
          error ||
          success) && (
          <div className="fs-select-message">
            {error ? (
              <span
                id={errorId}
                className="fs-select-error-text"
              >
                {error}
              </span>
            ) : success ? (
              <span className="fs-select-success-text">
                {success}
              </span>
            ) : (
              <span
                id={hintId}
                className="fs-select-hint"
              >
                {hint}
              </span>
            )}
          </div>
        )}

        <style>{`
          .fs-select-field {
            position: relative;
            display: flex;
            flex-direction: column;
            gap: 7px;
            min-width: 0;
          }

          .fs-select-full {
            width: 100%;
          }

          .fs-select-label-row {
            display: flex;
            align-items: center;
            justify-content: space-between;
          }

          .fs-select-label {
            color: #cbd5e1;
            font-size: 11px;
            font-weight: 650;
            line-height: 1.3;
            cursor: pointer;
          }

          .fs-select-required {
            margin-left: 3px;
            color: #f87171;
          }

          .fs-select-shell {
            position: relative;
            width: 100%;
            min-width: 0;
          }

          .fs-select-trigger {
            position: relative;
            display: flex;
            align-items: center;
            width: 100%;
            height: var(--select-height);
            padding:
              0 var(--select-padding);
            gap: 9px;
            overflow: hidden;
            border:
              1px solid
              rgba(148,163,184,.15);
            border-radius:
              var(--select-radius);
            outline: none;
            background:
              linear-gradient(
                135deg,
                rgba(15,23,42,.90),
                rgba(15,23,42,.70)
              );
            color: #f8fafc;
            font-family: inherit;
            font-size: var(--select-font);
            font-weight: 550;
            text-align: left;
            cursor: pointer;
            transition:
              border-color .2s ease,
              box-shadow .25s ease,
              background .2s ease;
          }

          .fs-select-trigger:hover {
            border-color:
              rgba(148,163,184,.28);
          }

          .fs-select-open
          .fs-select-trigger {
            border-color:
              rgba(167,139,250,.55);
            box-shadow:
              0 0 0 3px
                rgba(139,92,246,.10),
              0 16px 35px
                rgba(0,0,0,.15);
          }

          .fs-select-disabled {
            opacity: .5;
            pointer-events: none;
          }

          .fs-select-error
          .fs-select-trigger {
            border-color:
              rgba(248,113,113,.50);
          }

          .fs-select-success
          .fs-select-trigger {
            border-color:
              rgba(52,211,153,.42);
          }

          .fs-select-glow {
            position: absolute;
            top: -50px;
            left: 8%;
            width: 35%;
            height: 80px;
            border-radius: 50%;
            background:
              rgba(139,92,246,.13);
            filter: blur(28px);
            opacity: 0;
            pointer-events: none;
            transition: opacity .2s ease;
          }

          .fs-select-open
          .fs-select-glow {
            opacity: 1;
          }

          .fs-select-icon,
          .fs-select-option-icon {
            display: flex;
            align-items: center;
            justify-content: center;
            flex: 0 0 auto;
            color: #94a3b8;
          }

          .fs-select-value {
            flex: 1 1 auto;
            min-width: 0;
            overflow: hidden;
            text-overflow: ellipsis;
            white-space: nowrap;
          }

          .fs-select-placeholder {
            color: #475569;
          }

          .fs-select-chevron {
            display: flex;
            align-items: center;
            justify-content: center;
            flex: 0 0 auto;
            color: #64748b;
            transition:
              transform .25s
                cubic-bezier(.22,1,.36,1),
              color .2s ease;
          }

          .fs-select-chevron-open {
            color: #a78bfa;
            transform:
              rotate(180deg);
          }

          .fs-select-clear {
            display: flex;
            align-items: center;
            justify-content: center;
            width: 25px;
            height: 25px;
            flex: 0 0 25px;
            border-radius: 7px;
            color: #64748b;
            cursor: pointer;
            z-index: 3;
          }

          .fs-select-clear:hover {
            color: #f8fafc;
            background:
              rgba(255,255,255,.08);
          }

          .fs-select-menu {
            position: absolute;
            z-index: 100;
            top:
              calc(
                100% + 7px
              );
            left: 0;
            right: 0;
            max-height:
              var(--select-menu-height);
            overflow: hidden;
            border:
              1px solid
              rgba(148,163,184,.18);
            border-radius: 15px;
            background:
              linear-gradient(
                145deg,
                rgba(15,23,42,.98),
                rgba(10,15,30,.99)
              );
            box-shadow:
              0 25px 70px
                rgba(0,0,0,.45),
              0 0 0 1px
                rgba(255,255,255,.02),
              0 0 40px
                rgba(124,58,237,.12);
            backdrop-filter:
              blur(24px);
            -webkit-backdrop-filter:
              blur(24px);
            animation:
              fs-select-menu-in
              .18s
              cubic-bezier(.22,1,.36,1);
          }

          .fs-select-menu-glow {
            position: absolute;
            z-index: -1;
            top: -80px;
            left: 20%;
            width: 60%;
            height: 120px;
            border-radius: 50%;
            background:
              rgba(139,92,246,.10);
            filter: blur(40px);
            pointer-events: none;
          }

          .fs-select-search {
            position: relative;
            display: flex;
            align-items: center;
            gap: 8px;
            margin: 9px;
            padding:
              0 10px;
            height: 38px;
            border:
              1px solid
              rgba(148,163,184,.12);
            border-radius: 10px;
            background:
              rgba(255,255,255,.035);
            color: #64748b;
          }

          .fs-select-search:focus-within {
            border-color:
              rgba(167,139,250,.35);
            box-shadow:
              0 0 0 3px
                rgba(139,92,246,.08);
          }

          .fs-select-search input {
            width: 100%;
            min-width: 0;
            height: 100%;
            border: 0;
            outline: 0;
            background: transparent;
            color: #f8fafc;
            font-family: inherit;
            font-size: 11px;
          }

          .fs-select-search input::placeholder {
            color: #475569;
          }

          .fs-select-search button {
            display: flex;
            align-items: center;
            justify-content: center;
            width: 24px;
            height: 24px;
            padding: 0;
            border: 0;
            border-radius: 6px;
            background:
              transparent;
            color: #64748b;
            cursor: pointer;
          }

          .fs-select-search button:hover {
            color: #f8fafc;
            background:
              rgba(255,255,255,.07);
          }

          .fs-select-options {
            max-height:
              calc(
                var(--select-menu-height) - 4px
              );
            overflow-y: auto;
            padding:
              4px 7px 7px;
            scrollbar-width: thin;
            scrollbar-color:
              rgba(148,163,184,.16)
              transparent;
          }

          .fs-select-option {
            position: relative;
            display: flex;
            align-items: center;
            justify-content: space-between;
            width: 100%;
            min-height: 45px;
            padding:
              8px 10px;
            gap: 12px;
            border: 1px solid transparent;
            border-radius: 9px;
            outline: 0;
            background:
              transparent;
            color: #cbd5e1;
            font-family: inherit;
            text-align: left;
            cursor: pointer;
            transition:
              background .16s ease,
              border-color .16s ease,
              color .16s ease,
              transform .16s ease;
          }

          .fs-select-option:hover {
            background:
              rgba(255,255,255,.055);
            border-color:
              rgba(148,163,184,.08);
            color: #f8fafc;
            transform:
              translateX(2px);
          }

          .fs-select-option-selected {
            background:
              linear-gradient(
                90deg,
                rgba(139,92,246,.13),
                rgba(139,92,246,.045)
              );
            border-color:
              rgba(139,92,246,.16);
            color: #f8fafc;
          }

          .fs-select-option-disabled {
            opacity: .35;
            cursor: not-allowed;
          }

          .fs-select-option-main {
            display: flex;
            align-items: center;
            gap: 9px;
            min-width: 0;
          }

          .fs-select-option-copy {
            display: flex;
            flex-direction: column;
            min-width: 0;
            gap: 2px;
          }

          .fs-select-option-label {
            overflow: hidden;
            font-size: 11px;
            font-weight: 600;
            line-height: 1.3;
            text-overflow: ellipsis;
            white-space: nowrap;
          }

          .fs-select-option-description {
            overflow: hidden;
            color: #475569;
            font-size: 9px;
            font-weight: 500;
            line-height: 1.3;
            text-overflow: ellipsis;
            white-space: nowrap;
          }

          .fs-select-option-selected
          .fs-select-option-icon {
            color: #a78bfa;
          }

          .fs-select-check {
            display: flex;
            align-items: center;
            justify-content: center;
            width: 25px;
            height: 25px;
            flex: 0 0 25px;
            border-radius: 7px;
            background:
              rgba(139,92,246,.16);
            color: #a78bfa;
          }

          .fs-select-empty {
            display: flex;
            flex-direction: column;
            align-items: center;
            justify-content: center;
            gap: 8px;
            min-height: 120px;
            color: #475569;
            font-size: 10px;
            font-weight: 600;
          }

          .fs-select-message {
            min-height: 14px;
          }

          .fs-select-hint,
          .fs-select-error-text,
          .fs-select-success-text {
            font-size: 10px;
            font-weight: 500;
            line-height: 1.35;
          }

          .fs-select-hint {
            color: #475569;
          }

          .fs-select-error-text {
            color: #f87171;
          }

          .fs-select-success-text {
            color: #34d399;
          }

          .fs-select-variant-glass
          .fs-select-trigger {
            background:
              rgba(255,255,255,.045);
            backdrop-filter:
              blur(18px);
            -webkit-backdrop-filter:
              blur(18px);
          }

          @keyframes fs-select-menu-in {
            from {
              opacity: 0;
              transform:
                translateY(-5px)
                scale(.985);
            }

            to {
              opacity: 1;
              transform:
                translateY(0)
                scale(1);
            }
          }

          @media (max-width: 520px) {
            .fs-select-menu {
              max-height:
                min(
                  var(--select-menu-height),
                  45vh
                );
            }
          }

          @media (prefers-reduced-motion: reduce) {
            .fs-select-menu,
            .fs-select-chevron {
              animation: none !important;
              transition: none !important;
            }
          }
        `}</style>
      </div>
    );
  },
);

Select.displayName = 'Select';

export default Select;