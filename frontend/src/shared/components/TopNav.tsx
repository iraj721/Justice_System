// frontend/src/shared/components/TopNav.tsx
import { NavLink } from "react-router-dom";
import { useState, useEffect } from "react";
import { getToken } from "../services/auth";

const NAV_ITEMS = [
  { to: "/", label: "Home" },
  { to: "/login", label: "Login"},
  { to: "/register", label: "Register"},
  { to: "/app", label: "Dashboard" },
];

export function TopNav() {
  const token = getToken();
  const [menuOpen, setMenuOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);

  // Handle scroll effect
  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 20);
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  // Close menu on escape key
  useEffect(() => {
    const handleEsc = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && menuOpen) {
        setMenuOpen(false);
      }
    };
    window.addEventListener('keydown', handleEsc);
    return () => window.removeEventListener('keydown', handleEsc);
  }, [menuOpen]);

  // Prevent body scroll when menu is open
  useEffect(() => {
    if (menuOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
    }
    return () => {
      document.body.style.overflow = 'unset';
    };
  }, [menuOpen]);

  const navItems = token
    ? NAV_ITEMS
    : NAV_ITEMS.filter((item) => item.to !== "/app");

  return (
    <>
      <header className={`top-nav ${scrolled ? 'scrolled' : ''}`}>
        <div className="top-nav-inner">
          <NavLink to="/" className="brand" aria-label="Home">
            <div className="brand-mark">⚖</div>
            <span className="brand-text"> Justice System</span>
          </NavLink>

          {/* Desktop Navigation */}
          <nav className="desktop-nav" aria-label="Main navigation">
            {navItems.map((item) => (
              <NavLink
                key={item.to}
                to={item.to}
                className={({ isActive }) =>
                  isActive ? "top-link top-link-active" : "top-link"
                }
                aria-label={item.label}
              >
                <span>{item.label}</span>
              </NavLink>
            ))}
          </nav>

          {/* Hamburger Menu Button */}
          <button
            className={`menu-btn ${menuOpen ? "active" : ""}`}
            onClick={() => setMenuOpen(!menuOpen)}
            aria-label={menuOpen ? "Close menu" : "Open menu"}
            aria-expanded={menuOpen}
          >
            <span aria-hidden="true" />
            <span aria-hidden="true" />
            <span aria-hidden="true" />
          </button>
        </div>
      </header>

      {/* Overlay */}
      <div
        className={`menu-overlay ${menuOpen ? "show" : ""}`}
        onClick={() => setMenuOpen(false)}
        aria-hidden="true"
      />

      {/* Side Drawer Menu */}
      <aside className={`side-menu ${menuOpen ? "open" : ""}`} aria-label="Mobile menu">
        <div className="side-top">
          <h3>Menu</h3>
          <button 
            className="close-btn" 
            onClick={() => setMenuOpen(false)}
            aria-label="Close menu"
          >
            ✕
          </button>
        </div>

        <nav className="side-links" aria-label="Mobile navigation">
          {navItems.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              onClick={() => setMenuOpen(false)}
              className={({ isActive }) =>
                isActive ? "side-link active" : "side-link"
              }
              aria-label={item.label}
            >
              <span>{item.label}</span>
            </NavLink>
          ))}
        </nav>

        {/* Optional: User info when logged in */}
        {token && (
          <div className="side-footer">
            <div className="user-info">
              <div className="user-avatar">👤</div>
              <div className="user-details">
                <span className="user-name">Welcome Back!</span>
                <span className="user-role">Logged In</span>
              </div>
            </div>
          </div>
        )}
      </aside>

      <style>{`
        /* ────────────────────────────────────────────────────────────
           INDIGO THEME STYLES - MATCHING HOMEPAGE
        ──────────────────────────────────────────────────────────── */
        
        .top-nav {
          position: fixed;
          top: 0;
          left: 0;
          width: 100%;
          z-index: 999;
          backdrop-filter: blur(16px);
          background: rgba(7, 9, 14, 0.85);
          border-bottom: 1px solid rgba(255, 255, 255, 0.06);
          transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
        }

        .top-nav.scrolled {
          background: rgba(7, 9, 14, 0.95);
          border-bottom-color: rgba(99, 102, 241, 0.3);
          box-shadow: 0 4px 20px rgba(0, 0, 0, 0.2);
        }

        .top-nav-inner {
          width: min(1240px, 94%);
          margin: auto;
          height: 72px;
          display: flex;
          align-items: center;
          justify-content: space-between;
          transition: height 0.3s ease;
        }

        .top-nav.scrolled .top-nav-inner {
          height: 64px;
        }

        /* Brand Styles - Matching Homepage */
        .brand {
          display: flex;
          align-items: center;
          gap: 10px;
          text-decoration: none;
          transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
        }

        .brand:hover {
          transform: translateY(-1px);
        }

        .brand:focus-visible {
          outline: 2px solid #6366f1;
          outline-offset: 3px;
          border-radius: 8px;
        }

        .brand-mark {
          width: 32px;
          height: 32px;
          background: linear-gradient(135deg, #6366f1, #4f46e5);
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 1.1rem;
          border-radius: 6px;
          transition: all 0.3s ease;
          box-shadow: 0 0 0px rgba(99, 102, 241, 0);
        }

        .brand:hover .brand-mark {
          box-shadow: 0 0 12px rgba(99, 102, 241, 0.4);
          transform: scale(1.02);
        }

        .brand-text {
          font-family: 'Syne', 'Inter', system-ui, sans-serif;
          background: linear-gradient(135deg, #e8ecf8, #818cf8);
          -webkit-background-clip: text;
          -webkit-text-fill-color: transparent;
          background-clip: text;
          font-weight: 800;
          font-size: 1.1rem;
          letter-spacing: -0.3px;
        }

        /* Desktop Navigation */
        .desktop-nav {
          display: flex;
          gap: 8px;
          align-items: center;
        }

        .top-link {
          color: #7a849c;
          text-decoration: none;
          padding: 8px 18px;
          border-radius: 8px;
          transition: all 0.25s cubic-bezier(0.4, 0, 0.2, 1);
          display: flex;
          align-items: center;
          gap: 8px;
          font-weight: 500;
          font-size: 0.85rem;
          position: relative;
          letter-spacing: 0.2px;
        }

        .nav-icon {
          font-size: 1rem;
          transition: transform 0.2s ease;
        }

        .top-link:hover {
          color: #e8ecf8;
          background: rgba(255, 255, 255, 0.05);
          transform: translateY(-1px);
        }

        .top-link:hover .nav-icon {
          transform: scale(1.1);
        }

        .top-link:focus-visible {
          outline: 2px solid #6366f1;
          outline-offset: 3px;
          border-radius: 8px;
        }

        .top-link-active {
          background: linear-gradient(135deg, #6366f1, #4f46e5);
          color: #ffffff;
          font-weight: 600;
          box-shadow: 0 2px 8px rgba(99, 102, 241, 0.3);
        }

        .top-link-active:hover {
          transform: translateY(-1px);
          box-shadow: 0 4px 14px rgba(99, 102, 241, 0.4);
        }

        .top-link-active .nav-icon {
          transform: scale(1.05);
        }

        /* Hamburger Menu Button */
        .menu-btn {
          display: none;
          width: 44px;
          height: 44px;
          border: none;
          border-radius: 8px;
          background: rgba(255, 255, 255, 0.04);
          cursor: pointer;
          padding: 12px;
          flex-direction: column;
          justify-content: center;
          gap: 5px;
          transition: all 0.25s ease;
          position: relative;
        }

        .menu-btn:hover {
          background: rgba(255, 255, 255, 0.08);
        }

        .menu-btn:focus-visible {
          outline: 2px solid #6366f1;
          outline-offset: 3px;
        }

        .menu-btn span {
          height: 2px;
          width: 100%;
          background: linear-gradient(90deg, #818cf8, #6366f1);
          border-radius: 10px;
          transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
        }

        .menu-btn.active span:nth-child(1) {
          transform: translateY(7px) rotate(45deg);
          background: #6366f1;
        }

        .menu-btn.active span:nth-child(2) {
          opacity: 0;
          transform: scaleX(0);
        }

        .menu-btn.active span:nth-child(3) {
          transform: translateY(-7px) rotate(-45deg);
          background: #6366f1;
        }

        /* Overlay */
        .menu-overlay {
          position: fixed;
          inset: 0;
          background: rgba(0, 0, 0, 0.6);
          backdrop-filter: blur(4px);
          opacity: 0;
          visibility: hidden;
          transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
          z-index: 998;
        }

        .menu-overlay.show {
          opacity: 1;
          visibility: visible;
        }

        /* Side Drawer Menu - Indigo Theme */
        .side-menu {
          position: fixed;
          top: 0;
          right: 0;
          width: 320px;
          max-width: 88%;
          height: 100vh;
          background: linear-gradient(180deg, #0c0f1a, #07090e);
          border-left: 1px solid rgba(99, 102, 241, 0.2);
          z-index: 999;
          transform: translateX(100%);
          transition: transform 0.3s cubic-bezier(0.4, 0, 0.2, 1);
          padding: 24px 20px;
          display: flex;
          flex-direction: column;
          box-shadow: -10px 0 30px rgba(0, 0, 0, 0.5);
        }

        .side-menu.open {
          transform: translateX(0);
        }

        .side-top {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 32px;
          padding-bottom: 16px;
          border-bottom: 1px solid rgba(255, 255, 255, 0.08);
        }

        .side-top h3 {
          font-family: 'Syne', 'Inter', system-ui, sans-serif;
          color: #e8ecf8;
          font-size: 1.3rem;
          font-weight: 700;
          background: linear-gradient(135deg, #e8ecf8, #818cf8);
          -webkit-background-clip: text;
          -webkit-text-fill-color: transparent;
          background-clip: text;
        }

        .close-btn {
          border: none;
          background: rgba(255, 255, 255, 0.05);
          color: #7a849c;
          width: 40px;
          height: 40px;
          border-radius: 8px;
          cursor: pointer;
          font-size: 1.2rem;
          transition: all 0.2s ease;
          display: flex;
          align-items: center;
          justify-content: center;
        }

        .close-btn:hover {
          background: rgba(99, 102, 241, 0.15);
          color: #818cf8;
          transform: rotate(90deg);
        }

        .close-btn:focus-visible {
          outline: 2px solid #6366f1;
          outline-offset: 3px;
        }

        .side-links {
          display: flex;
          flex-direction: column;
          gap: 12px;
          flex: 1;
        }

        .side-link {
          color: #7a849c;
          text-decoration: none;
          padding: 14px 18px;
          border-radius: 10px;
          background: rgba(255, 255, 255, 0.02);
          transition: all 0.25s ease;
          display: flex;
          align-items: center;
          gap: 12px;
          font-weight: 500;
          border: 1px solid transparent;
          font-size: 0.9rem;
        }

        .side-icon {
          font-size: 1.2rem;
          transition: transform 0.2s ease;
        }

        .side-link:hover {
          color: #e8ecf8;
          background: rgba(99, 102, 241, 0.08);
          transform: translateX(5px);
          border-color: rgba(99, 102, 241, 0.3);
        }

        .side-link:hover .side-icon {
          transform: scale(1.1);
        }

        .side-link:focus-visible {
          outline: 2px solid #6366f1;
          outline-offset: 3px;
          border-radius: 10px;
        }

        .side-link.active {
          background: linear-gradient(135deg, rgba(99, 102, 241, 0.15), rgba(79, 70, 229, 0.05));
          color: #818cf8;
          font-weight: 600;
          border-color: rgba(99, 102, 241, 0.4);
        }

        .side-link.active .side-icon {
          transform: scale(1.05);
        }

        /* Side Footer - User Info */
        .side-footer {
          margin-top: auto;
          padding-top: 20px;
          border-top: 1px solid rgba(255, 255, 255, 0.08);
        }

        .user-info {
          display: flex;
          align-items: center;
          gap: 12px;
          padding: 12px;
          background: rgba(255, 255, 255, 0.03);
          border-radius: 10px;
          transition: all 0.25s ease;
        }

        .user-info:hover {
          background: rgba(99, 102, 241, 0.08);
          transform: translateX(-4px);
        }

        .user-avatar {
          width: 40px;
          height: 40px;
          background: linear-gradient(135deg, #6366f1, #4f46e5);
          border-radius: 50%;
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 1.2rem;
          transition: transform 0.2s ease;
        }

        .user-info:hover .user-avatar {
          transform: scale(1.05);
        }

        .user-details {
          display: flex;
          flex-direction: column;
        }

        .user-name {
          color: #e8ecf8;
          font-weight: 600;
          font-size: 0.9rem;
        }

        .user-role {
          color: #818cf8;
          font-size: 0.7rem;
          letter-spacing: 0.5px;
        }

        /* Animations */
        @keyframes fadeInDown {
          from {
            opacity: 0;
            transform: translateY(-10px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }

        .top-link-active {
          animation: fadeInDown 0.3s ease-out;
        }

        /* Responsive Styles */
        @media (max-width: 768px) {
          .desktop-nav {
            display: none;
          }

          .menu-btn {
            display: flex;
          }

          .brand-text {
            font-size: 0.9rem;
          }

          .brand-mark {
            width: 28px;
            height: 28px;
            font-size: 0.9rem;
          }
        }

        @media (max-width: 480px) {
          .top-nav-inner {
            height: 60px;
          }

          .top-nav.scrolled .top-nav-inner {
            height: 56px;
          }

          .brand-text {
            font-size: 0.8rem;
          }

          .brand-mark {
            width: 26px;
            height: 26px;
            font-size: 0.85rem;
          }

          .side-menu {
            width: 280px;
            padding: 20px 16px;
          }

          .side-link {
            padding: 12px 16px;
            font-size: 0.85rem;
          }

          .side-icon {
            font-size: 1rem;
          }

          .side-top h3 {
            font-size: 1.1rem;
          }
        }

        /* Reduced Motion */
        @media (prefers-reduced-motion: reduce) {
          .top-nav,
          .top-nav-inner,
          .menu-btn span,
          .side-menu,
          .side-link,
          .close-btn,
          .brand,
          .brand-mark {
            transition: none;
          }
          
          .top-link-active {
            animation: none;
          }
        }

        /* Print Styles */
        @media print {
          .top-nav,
          .menu-overlay,
          .side-menu {
            display: none;
          }
        }
        
        /* Custom Scrollbar for Side Menu */
        .side-menu::-webkit-scrollbar {
          width: 3px;
        }
        
        .side-menu::-webkit-scrollbar-track {
          background: rgba(255, 255, 255, 0.05);
        }
        
        .side-menu::-webkit-scrollbar-thumb {
          background: #6366f1;
          border-radius: 3px;
        }
      `}</style>
    </>
  );
}