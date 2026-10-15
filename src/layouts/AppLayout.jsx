import {
  useCallback,
  useEffect,
  useState,
} from 'react';

import {
  Outlet,
  useLocation,
} from 'react-router-dom';

import Sidebar from '../components/layout/Sidebar.jsx';
import Topbar from '../components/layout/Topbar.jsx';
import MobileNav from '../components/layout/MobileNav.jsx';

function AppLayout() {
  const location = useLocation();

  const [sidebarOpen, setSidebarOpen] =
    useState(false);

  const [commandOpen, setCommandOpen] =
    useState(false);

  const closeSidebar = useCallback(() => {
    setSidebarOpen(false);
  }, []);

  const openSidebar = useCallback(() => {
    setSidebarOpen(true);
  }, []);

  const openCommand = useCallback(() => {
    setCommandOpen(true);
  }, []);

  const closeCommand = useCallback(() => {
    setCommandOpen(false);
  }, []);

  /*
   * Close mobile navigation whenever
   * the route changes.
   */
  useEffect(() => {
    setSidebarOpen(false);
    setCommandOpen(false);
  }, [location.pathname]);

  /*
   * Keyboard controls.
   *
   * Escape:
   * - closes sidebar
   * - closes command interface
   */
  useEffect(() => {
    const handleKeyDown = (event) => {
      if (event.key === 'Escape') {
        setSidebarOpen(false);
        setCommandOpen(false);
      }

      /*
       * Ctrl/Cmd + K
       *
       * The Topbar/Sidebar can use the same
       * command interface.
       */
      if (
        (event.ctrlKey || event.metaKey) &&
        event.key.toLowerCase() === 'k'
      ) {
        event.preventDefault();

        setCommandOpen((current) => !current);
      }
    };

    window.addEventListener(
      'keydown',
      handleKeyDown,
    );

    return () => {
      window.removeEventListener(
        'keydown',
        handleKeyDown,
      );
    };
  }, []);

  /*
   * Prevent background scrolling while the
   * mobile sidebar is open.
   */
  useEffect(() => {
    document.body.classList.toggle(
      'fs-mobile-menu-open',
      sidebarOpen,
    );

    return () => {
      document.body.classList.remove(
        'fs-mobile-menu-open',
      );
    };
  }, [sidebarOpen]);

  /*
   * Prevent background scrolling while the
   * command interface is active.
   */
  useEffect(() => {
    document.body.classList.toggle(
      'fs-command-open',
      commandOpen,
    );

    return () => {
      document.body.classList.remove(
        'fs-command-open',
      );
    };
  }, [commandOpen]);

  return (
    <>
      <div className="fs-app-shell">

        {/* =================================================
            GLOBAL FINANCIAL BACKGROUND
            ================================================= */}

        <div
          className="fs-app-background"
          aria-hidden="true"
        >
          <div className="fs-background-grid" />

          <div className="fs-background-glow fs-glow-one" />

          <div className="fs-background-glow fs-glow-two" />

          <div className="fs-background-glow fs-glow-three" />

          <div className="fs-background-noise" />

          <div className="fs-background-vignette" />
        </div>

        {/* =================================================
            SIDEBAR
            ================================================= */}

        <Sidebar
          mobileOpen={sidebarOpen}
          onClose={closeSidebar}
          onCommandOpen={openCommand}
        />

        {/* =================================================
            MAIN APPLICATION
            ================================================= */}

        <div className="fs-main-shell">

          <Topbar
            onMenuClick={openSidebar}
            onCommandOpen={openCommand}
          />

          <main
            className="fs-main-content"
            id="main-content"
          >
            <div className="fs-content-container">
              <Outlet />
            </div>
          </main>

        </div>

        {/* =================================================
            MOBILE NAVIGATION
            ================================================= */}

        <MobileNav />

        {/* =================================================
            COMMAND / OVERLAY LAYER
            ================================================= */}

        {commandOpen && (
          <button
            type="button"
            className="fs-command-state-layer"
            aria-label="Close command interface"
            onClick={closeCommand}
          />
        )}

      </div>

      {/* =====================================================
          APP SHELL STYLES
          ===================================================== */}

      <style>{`
        :root {
          --fs-sidebar-width: 268px;
          --fs-topbar-height: 78px;
          --fs-content-max-width: 1700px;

          --fs-bg:
            #060911;

          --fs-surface:
            rgba(13, 18, 30, 0.78);

          --fs-surface-strong:
            rgba(16, 22, 36, 0.94);

          --fs-border:
            rgba(118, 142, 194, 0.12);

          --fs-border-bright:
            rgba(118, 150, 240, 0.22);

          --fs-text:
            #f3f6fc;

          --fs-text-secondary:
            #9aa6ba;

          --fs-text-muted:
            #657188;

          --fs-accent:
            #6b8cff;

          --fs-accent-soft:
            rgba(107, 140, 255, 0.12);

          --fs-success:
            #36d6a2;

          --fs-warning:
            #ffbd66;

          --fs-danger:
            #ff6f82;
        }

        /* =====================================================
           BODY LOCKS
           ===================================================== */

        body.fs-mobile-menu-open,
        body.fs-command-open {
          overflow: hidden;
        }

        /* =====================================================
           APPLICATION SHELL
           ===================================================== */

        .fs-app-shell {
          position: relative;
          min-height: 100vh;
          width: 100%;
          overflow-x: hidden;
          color: var(--fs-text);
          background:
            radial-gradient(
              circle at 75% -10%,
              rgba(78, 110, 255, 0.11),
              transparent 34%
            ),
            radial-gradient(
              circle at 10% 80%,
              rgba(36, 206, 161, 0.055),
              transparent 28%
            ),
            var(--fs-bg);
        }

        /* =====================================================
           BACKGROUND SYSTEM
           ===================================================== */

        .fs-app-background {
          position: fixed;
          inset: 0;
          z-index: 0;
          pointer-events: none;
          overflow: hidden;
        }

        .fs-background-grid {
          position: absolute;
          inset: 0;
          opacity: 0.26;

          background-image:
            linear-gradient(
              rgba(120, 145, 205, 0.045) 1px,
              transparent 1px
            ),
            linear-gradient(
              90deg,
              rgba(120, 145, 205, 0.045) 1px,
              transparent 1px
            );

          background-size:
            48px 48px;

          mask-image:
            linear-gradient(
              to bottom,
              black,
              rgba(0, 0, 0, 0.45),
              transparent
            );
        }

        .fs-background-glow {
          position: absolute;
          border-radius: 50%;
          pointer-events: none;
          filter: blur(70px);
        }

        .fs-glow-one {
          width: 500px;
          height: 500px;
          top: -250px;
          right: 5%;
          background:
            rgba(71, 105, 255, 0.09);
          animation:
            fsFloatOne 14s ease-in-out infinite;
        }

        .fs-glow-two {
          width: 420px;
          height: 420px;
          bottom: -230px;
          left: 5%;
          background:
            rgba(33, 204, 157, 0.055);
          animation:
            fsFloatTwo 18s ease-in-out infinite;
        }

        .fs-glow-three {
          width: 300px;
          height: 300px;
          top: 38%;
          left: 38%;
          background:
            rgba(123, 82, 255, 0.025);
          animation:
            fsFloatThree 20s ease-in-out infinite;
        }

        .fs-background-noise {
          position: absolute;
          inset: 0;
          opacity: 0.025;
          background-image:
            url("data:image/svg+xml,%3Csvg viewBox='0 0 180 180' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)' opacity='.55'/%3E%3C/svg%3E");
          mix-blend-mode: soft-light;
        }

        .fs-background-vignette {
          position: absolute;
          inset: 0;
          background:
            radial-gradient(
              ellipse at center,
              transparent 45%,
              rgba(0, 0, 0, 0.32) 100%
            );
        }

        /* =====================================================
           MAIN SHELL
           ===================================================== */

        .fs-main-shell {
          position: relative;
          z-index: 2;
          min-height: 100vh;
          margin-left: var(--fs-sidebar-width);
          width: calc(
            100% - var(--fs-sidebar-width)
          );
        }

        .fs-main-content {
          position: relative;
          z-index: 1;
          min-height: calc(
            100vh - var(--fs-topbar-height)
          );
          padding:
            0
            0
            80px;
        }

        .fs-content-container {
          width: 100%;
          max-width: var(--fs-content-max-width);
          margin: 0 auto;
          padding:
            0
            clamp(20px, 2.5vw, 42px);
          box-sizing: border-box;
        }

        /* =====================================================
           COMMAND STATE LAYER
           ===================================================== */

        .fs-command-state-layer {
          position: fixed;
          inset: 0;
          z-index: 999;
          border: 0;
          padding: 0;
          margin: 0;
          cursor: default;

          background:
            rgba(2, 5, 11, 0.42);

          backdrop-filter:
            blur(3px);

          -webkit-backdrop-filter:
            blur(3px);

          animation:
            fsOverlayIn 160ms ease-out;
        }

        /* =====================================================
           SIDEBAR FALLBACK / SHELL POLISH
           ===================================================== */

        .fs-sidebar {
          position: fixed;
          z-index: 100;
          top: 0;
          bottom: 0;
          left: 0;

          width: var(--fs-sidebar-width);

          box-sizing: border-box;

          background:
            linear-gradient(
              180deg,
              rgba(10, 15, 27, 0.98),
              rgba(7, 11, 20, 0.98)
            );

          border-right:
            1px solid
            rgba(115, 140, 192, 0.11);

          box-shadow:
            20px 0 70px
            rgba(0, 0, 0, 0.16);

          backdrop-filter:
            blur(24px);

          -webkit-backdrop-filter:
            blur(24px);
        }

        .fs-sidebar::after {
          content: "";
          position: absolute;
          top: 0;
          right: -1px;
          width: 1px;
          height: 100%;

          background:
            linear-gradient(
              to bottom,
              transparent,
              rgba(101, 133, 229, 0.32),
              transparent
            );

          opacity: 0.55;
          pointer-events: none;
        }

        /* =====================================================
           TOPBAR FALLBACK / SHELL POLISH
           ===================================================== */

        .fs-main-shell > header,
        .fs-topbar {
          position: sticky;
          top: 0;
          z-index: 80;
        }

        /* =====================================================
           SCROLLBARS
           ===================================================== */

        .fs-main-content,
        .fs-content-container {
          scrollbar-width: thin;
          scrollbar-color:
            rgba(91, 119, 182, 0.28)
            transparent;
        }

        ::-webkit-scrollbar {
          width: 8px;
          height: 8px;
        }

        ::-webkit-scrollbar-track {
          background: transparent;
        }

        ::-webkit-scrollbar-thumb {
          border-radius: 999px;
          background:
            rgba(91, 119, 182, 0.25);
          border:
            2px solid transparent;
          background-clip:
            padding-box;
        }

        ::-webkit-scrollbar-thumb:hover {
          background:
            rgba(103, 135, 210, 0.42);
          border:
            2px solid transparent;
          background-clip:
            padding-box;
        }

        /* =====================================================
           SELECTION
           ===================================================== */

        ::selection {
          color: #ffffff;
          background:
            rgba(91, 123, 255, 0.38);
        }

        /* =====================================================
           FOCUS
           ===================================================== */

        :where(
          button,
          a,
          input,
          select,
          textarea
        ):focus-visible {
          outline:
            2px solid
            rgba(108, 143, 255, 0.72);

          outline-offset: 2px;
        }

        /* =====================================================
           ANIMATIONS
           ===================================================== */

        @keyframes fsFloatOne {
          0%,
          100% {
            transform:
              translate3d(0, 0, 0)
              scale(1);
          }

          50% {
            transform:
              translate3d(-35px, 28px, 0)
              scale(1.06);
          }
        }

        @keyframes fsFloatTwo {
          0%,
          100% {
            transform:
              translate3d(0, 0, 0)
              scale(1);
          }

          50% {
            transform:
              translate3d(42px, -24px, 0)
              scale(1.08);
          }
        }

        @keyframes fsFloatThree {
          0%,
          100% {
            transform:
              translate3d(0, 0, 0);
          }

          50% {
            transform:
              translate3d(25px, -30px, 0);
          }
        }

        @keyframes fsOverlayIn {
          from {
            opacity: 0;
          }

          to {
            opacity: 1;
          }
        }

        /* =====================================================
           LARGE DESKTOP
           ===================================================== */

        @media (min-width: 1600px) {
          :root {
            --fs-sidebar-width: 286px;
          }

          .fs-content-container {
            padding-left: 46px;
            padding-right: 46px;
          }
        }

        /* =====================================================
           TABLET
           ===================================================== */

        @media (max-width: 1100px) {
          :root {
            --fs-sidebar-width: 235px;
          }

          .fs-content-container {
            padding-left: 22px;
            padding-right: 22px;
          }
        }

        /* =====================================================
           MOBILE
           ===================================================== */

        @media (max-width: 820px) {
          :root {
            --fs-sidebar-width: 0px;
            --fs-topbar-height: 70px;
          }

          .fs-main-shell {
            margin-left: 0;
            width: 100%;
          }

          .fs-main-content {
            min-height: calc(
              100vh - var(--fs-topbar-height)
            );

            padding-bottom: 100px;
          }

          .fs-content-container {
            padding:
              0
              15px;
          }

          .fs-sidebar {
            width: min(
              320px,
              86vw
            );

            transform:
              translateX(-105%);

            transition:
              transform
              260ms
              cubic-bezier(
                .22,
                1,
                .36,
                1
              );

            box-shadow:
              24px 0 80px
              rgba(0, 0, 0, 0.4);
          }

          .fs-sidebar.fs-sidebar-mobile-open {
            transform:
              translateX(0);
          }

          .fs-sidebar-overlay {
            position: fixed;
            inset: 0;
            z-index: 90;

            opacity: 0;
            visibility: hidden;

            background:
              rgba(2, 5, 11, 0.58);

            backdrop-filter:
              blur(4px);

            -webkit-backdrop-filter:
              blur(4px);

            transition:
              opacity 220ms ease,
              visibility 220ms ease;
          }

          .fs-sidebar-overlay.fs-sidebar-overlay-visible {
            opacity: 1;
            visibility: visible;
          }

          .fs-sidebar-close {
            display: grid !important;
          }
        }

        /* =====================================================
           REDUCED MOTION
           ===================================================== */

        @media (prefers-reduced-motion: reduce) {
          *,
          *::before,
          *::after {
            scroll-behavior: auto !important;
            animation-duration: 0.01ms !important;
            animation-iteration-count: 1 !important;
            transition-duration: 0.01ms !important;
          }
        }
      `}</style>
    </>
  );
}

export default AppLayout;