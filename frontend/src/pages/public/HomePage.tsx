// frontend/src/pages/public/HomePage.tsx 
import { Link } from "react-router-dom";
import { useState, useEffect, useRef } from "react";

type RoleKey = "citizens" | "police" | "forensic" | "court";

export function HomePage() {
  const [activeRole, setActiveRole] = useState<RoleKey>("citizens");
  const [hoveredStat, setHoveredStat] = useState<number | null>(null);
  const [hoveredStep, setHoveredStep] = useState<number | null>(null);
  const [mousePosition, setMousePosition] = useState({ x: 0, y: 0 });
  const [visibleSections, setVisibleSections] = useState({
    process: false,
    roles: false,
    trust: false,
    cta: false,
  });
  const autoTimerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const observerRef = useRef<IntersectionObserver | null>(null);

  useEffect(() => {
    document.title = "Decentralized Justice System | Blockchain Legal Platform";
    let meta = document.querySelector('meta[name="description"]');
    if (!meta) {
      meta = document.createElement("meta");
      meta.setAttribute("name", "description");
      document.head.appendChild(meta);
    }
    meta.setAttribute("content", "Modern justice ecosystem powered by blockchain technology for citizens, police, forensic labs, and courts.");
  }, []);

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      setMousePosition({ x: e.clientX, y: e.clientY });
    };
    window.addEventListener('mousemove', handleMouseMove);
    return () => window.removeEventListener('mousemove', handleMouseMove);
  }, []);

  const features = {
    citizens: ["File FIR Online", "Track Case Status", "Upload Evidence", "Emergency SOS", "Citizen Dashboard", "Feedback System"],
    police: ["Review FIR Requests", "Manage Investigations", "Witness & Suspect Logs", "Generate Reports", "Court Submissions", "Evidence Verification"],
    forensic: ["Evidence Queue", "Lab Analysis", "Digital Signatures", "Secure Reports", "Assigned Cases", "Transfer to Court"],
    court: ["Case Review", "Virtual Hearings", "Evidence Validation", "Judgment Delivery", "Fine Management", "Court Analytics"],
  };

  const rolesList: RoleKey[] = ["citizens", "police", "forensic", "court"];

  const setActiveTab = (role: RoleKey) => {
    setActiveRole(role);
  };

  const startAutoRotate = () => {
    if (autoTimerRef.current) clearInterval(autoTimerRef.current);
    autoTimerRef.current = setInterval(() => {
      setActiveRole((prev) => {
        const currentIndex = rolesList.indexOf(prev);
        return rolesList[(currentIndex + 1) % rolesList.length];
      });
    }, 5000);
  };

  useEffect(() => {
    startAutoRotate();
    return () => {
      if (autoTimerRef.current) clearInterval(autoTimerRef.current);
    };
  }, []);

  useEffect(() => {
    observerRef.current = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            const id = entry.target.getAttribute("data-section");
            if (id) setVisibleSections((prev) => ({ ...prev, [id]: true }));
          }
        });
      },
      { threshold: 0.07, rootMargin: "0px 0px -60px 0px" }
    );
    ["process", "roles", "trust", "cta"].forEach((s) => {
      const el = document.getElementById(s);
      if (el) observerRef.current?.observe(el);
    });
    return () => observerRef.current?.disconnect();
  }, []);

  const handleNewsletterSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const form = e.currentTarget;
    const input = form.elements.namedItem("email") as HTMLInputElement;
    const btn = form.querySelector('button[type="submit"]') as HTMLButtonElement;
    const orig = btn?.textContent;
    if (btn) btn.textContent = "Sending…";
    await new Promise((r) => setTimeout(r, 800));
    if (btn) btn.textContent = "Subscribed ✓";
    if (input) input.value = "";
    setTimeout(() => {
      if (btn) btn.textContent = orig || "Subscribe";
    }, 3000);
  };

  const statsData = [
    { value: "24/7", label: "ACCESS", icon: "🕒" },
    { value: "100%", label: "TRACEABLE", icon: "📊" },
    { value: "CLOUD", label: "STORAGE", icon: "💾" },
    { value: "5+", label: "ROLES", icon: "👥" },
  ];

  const stepsData = [
    { no: "01", title: "Register Complaint", desc: "Submit FIR digitally with documents and identity proof.", icon: "📝", color: "#6366f1" },
    { no: "02", title: "Investigation Begins", desc: "Authorities review and collect verifiable evidence.", icon: "🔍", color: "#4f46e5" },
    { no: "03", title: "Forensic Validation", desc: "Experts analyze and sign reports securely on-chain.", icon: "🔬", color: "#818cf8" },
    { no: "04", title: "Court Proceedings", desc: "Judge reviews immutable records and hearings.", icon: "⚖", color: "#6366f1" },
    { no: "05", title: "Final Verdict", desc: "Transparent judgment stored permanently on-chain.", icon: "✔", color: "#4f46e5" },
  ];

  return (
    <>
      <div className="cursor-glow" style={{ left: mousePosition.x, top: mousePosition.y }} />
      <div className="cursor-trail" style={{ left: mousePosition.x, top: mousePosition.y }} />

      <nav className="dj-nav">
        <div className="dj-nav-brand">
          <div className="dj-nav-brand-mark">⚖</div>
          Decentralized Justice
        </div>
        <div className="dj-nav-links">
          <Link to="#" className="active">Home</Link>
          <Link to="/login">Login</Link>
          <Link to="/register">Register</Link>
          <Link to="/dashboard">Dashboard</Link>
          <Link to="/explorer">Explorer</Link>
        </div>
        <Link to="/register" className="dj-nav-cta">Get Started</Link>
      </nav>

      {/* ── HERO SECTION ── */}
      <section className="dj-hero">
        <div className="dj-hero-grid"></div>
        <div className="dj-hero-radial"></div>
        <div className="dj-particle-field">
          {[...Array(50)].map((_, i) => (
            <div key={i} className="dj-particle" style={{ animationDelay: `${i * 0.1}s`, left: `${Math.random() * 100}%`, animationDuration: `${3 + Math.random() * 4}s` }} />
          ))}
        </div>
        <div className="dj-hero-inner">
          <div className="dj-hero-tag">
            <div className="dj-hero-tag-dot"></div>
            BLOCKCHAIN SECURED · TRANSPARENT · TRUSTED
          </div>
          <h1 className="dj-h1">
            Modern Justice
            <span className="dj-h1-accent">System</span>
          </h1>
          <p className="dj-hero-desc">
            A precision digital justice ecosystem for citizens, police, forensic labs,
            and courts — built with immutable trust, full transparency, and institutional speed.
          </p>
          <div className="dj-hero-btns">
            <Link to="/register" className="dj-btn-primary">
              <span className="btn-text">Begin Case</span>
              <span className="btn-arrow">→</span>
            </Link>
            <Link to="/explorer" className="dj-btn-outline">
              <span className="btn-text">View Explorer</span>
              <span className="btn-icon">⬡</span>
            </Link>
          </div>
          <div className="dj-stats-row">
            {statsData.map((stat, i) => (
              <div 
                key={i} 
                className="dj-stat-cell"
                onMouseEnter={() => setHoveredStat(i)}
                onMouseLeave={() => setHoveredStat(null)}
                style={{ transform: hoveredStat === i ? 'translateY(-8px)' : 'translateY(0)' }}
              >
                <span className="dj-stat-icon">{stat.icon}</span>
                <span className="dj-stat-val">{stat.value}</span>
                <span className="dj-stat-label">{stat.label}</span>
                <div className="stat-progress" style={{ width: hoveredStat === i ? '100%' : '0%' }} />
              </div>
            ))}
          </div>
        </div>
        <div className="dj-scroll-cue">
          <span>SCROLL</span>
          <div className="dj-scroll-track"></div>
        </div>
      </section>

      {/* ── PROCESS SECTION ── */}
      <section className={`dj-section dj-fade-section ${visibleSections.process ? "visible" : ""}`} id="process" data-section="process">
        <div className="dj-container">
          <div className="dj-section-hd">
            <p className="dj-eyebrow">Workflow</p>
            <h2>How the System Works</h2>
            <p className="dj-subtitle">From complaint to verdict — complete transparency at every step</p>
          </div>
          <div className="dj-timeline">
            {stepsData.map((step, i) => (
              <div 
                key={i} 
                className="dj-step-card"
                onMouseEnter={() => setHoveredStep(i)}
                onMouseLeave={() => setHoveredStep(null)}
                style={{ 
                  transform: hoveredStep === i ? 'translateY(-12px) scale(1.02)' : 'translateY(0) scale(1)',
                  transition: 'all 0.4s cubic-bezier(0.4, 0, 0.2, 1)'
                }}
              >
                <div className="dj-step-glow" style={{ background: `radial-gradient(circle, ${step.color}20 0%, transparent 70%)` }} />
                <span className="dj-step-num" style={{ color: step.color }}>// {step.no}</span>
                <div className="dj-step-icon" style={{ borderColor: step.color, background: `${step.color}10` }}>
                  <span style={{ fontSize: "1.2rem" }}>{step.icon}</span>
                </div>
                <h4>{step.title}</h4>
                <p>{step.desc}</p>
                <div className="dj-step-progress" style={{ width: hoveredStep === i ? '100%' : '0%', background: step.color }} />
                {i < stepsData.length - 1 && (
                  <div className="dj-step-connector">
                    <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
                      <path d="M5 12h14M13 6l6 6-6 6" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                    </svg>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      </section>

      <div className="dj-divider"></div>

      {/* ── ROLES SECTION ── */}
      <section className={`dj-section dj-section-alt dj-fade-section ${visibleSections.roles ? "visible" : ""}`} id="roles" data-section="roles">
        <div className="dj-container">
          <div className="dj-section-hd">
            <p className="dj-eyebrow">Capabilities</p>
            <h2>Built for Every Stakeholder</h2>
            <p className="dj-subtitle">Role-specific tools and dashboards tailored to every actor in the justice chain</p>
          </div>
          <div className="dj-tabs">
            {[
              { key: "citizens", label: "Citizens", tag: "PUBLIC_USER", icon: "👥" },
              { key: "police", label: "Police", tag: "INVESTIGATOR", icon: "👮" },
              { key: "forensic", label: "Forensic", tag: "FORENSIC_ANALYST", icon: "🔬" },
              { key: "court", label: "Court", tag: "COURT", icon: "⚖" },
            ].map((role) => (
              <button 
                key={role.key} 
                className={`dj-tab ${activeRole === role.key ? "active" : ""}`} 
                onClick={() => setActiveTab(role.key as RoleKey)}
              >
                <span className="dj-tab-icon">{role.icon}</span>
                <span>
                  <span className="dj-tab-label">{role.label}</span>
                  <span className="dj-tab-tag">{role.tag}</span>
                </span>
                {activeRole === role.key && <span className="dj-tab-underline" />}
                <div className="dj-tab-ripple" />
              </button>
            ))}
          </div>
          <div className="dj-features-grid">
            {features[activeRole].map((item, i) => (
              <div className="dj-feature-cell" key={i} style={{ animationDelay: `${i * 0.05}s` }}>
                <div className="dj-feature-dot">
                  <div className="feature-dot-pulse" />
                </div>
                <span>{item}</span>
                <div className="feature-hover-line" />
              </div>
            ))}
          </div>
        </div>
      </section>

      <div className="dj-divider"></div>

      {/* ── TRUST SECTION ── */}
      <section className={`dj-section dj-fade-section ${visibleSections.trust ? "visible" : ""}`} id="trust" data-section="trust">
        <div className="dj-container">
          <div className="dj-section-hd">
            <p className="dj-eyebrow">Security Layer</p>
            <h2>Enterprise Grade Infrastructure</h2>
            <p className="dj-subtitle">End-to-end encryption, tamper-proof records, and permanent audit trails</p>
          </div>
          <div className="dj-trust-grid">
            <div className="dj-trust-stat">
              <div className="trust-shimmer" />
              <span className="dj-trust-icon">🔒</span>
              <span className="dj-trust-val">256-bit</span>
              <span className="dj-trust-lbl">ENCRYPTION</span>
              <p className="dj-trust-desc">Military-grade encryption for all data in transit and at rest.</p>
            </div>
            <div className="dj-trust-stat">
              <div className="trust-shimmer" />
              <span className="dj-trust-icon">⏱</span>
              <span className="dj-trust-val">99.99%</span>
              <span className="dj-trust-lbl">UPTIME</span>
              <p className="dj-trust-desc">Guaranteed availability with redundant distributed infrastructure.</p>
            </div>
            <div className="dj-trust-stat">
              <div className="trust-shimmer" />
              <span className="dj-trust-icon">✔</span>
              <span className="dj-trust-val">ISO</span>
              <span className="dj-trust-lbl">CERTIFIED</span>
              <p className="dj-trust-desc">ISO 27001 certified for information security management systems.</p>
            </div>
          </div>
          <div className="dj-trust-wide-grid">
            <div className="dj-trust-wide">
              <span className="dj-tw-icon">🔒</span>
              <div>
                <h4>Evidence Integrity</h4>
                <p>Every file hashed and verifiable on blockchain with tamper-proof timestamps.</p>
                <span className="dj-trust-badge">IMMUTABLE</span>
              </div>
              <div className="trust-wide-glow" />
            </div>
            <div className="dj-trust-wide">
              <span className="dj-tw-icon">🤖</span>
              <div>
                <h4>Smart Governance</h4>
                <p>Automated approvals and intelligent workflows powered by AI and smart contracts.</p>
                <span className="dj-trust-badge">AI-POWERED</span>
              </div>
              <div className="trust-wide-glow" />
            </div>
            <div className="dj-trust-wide">
              <span className="dj-tw-icon">👁</span>
              <div>
                <h4>Citizen Trust</h4>
                <p>Live updates and transparent case history accessible anytime, anywhere.</p>
                <span className="dj-trust-badge">REAL-TIME</span>
              </div>
              <div className="trust-wide-glow" />
            </div>
          </div>
        </div>
      </section>

      {/* ── CTA SECTION ── */}
      <section className={`dj-cta-section dj-fade-section ${visibleSections.cta ? "visible" : ""}`} id="cta" data-section="cta">
        <div className="dj-cta-bg"></div>
        <div className="dj-cta-glow-ring" />
        <div className="dj-cta-inner">
          <p className="dj-eyebrow" style={{ justifyContent: "center" }}>Start Today</p>
          <h2>Justice Should Be Transparent</h2>
          <p className="dj-subtitle" style={{ marginBottom: "2rem" }}>
            Join a next-generation legal ecosystem built for fairness, speed, and institutional accountability.
          </p>
          <div className="dj-hero-btns">
            <Link to="/register" className="dj-btn-primary dj-btn-lg">
              <span className="btn-text">Register Now</span>
              <span className="btn-sparkle">✨</span>
            </Link>
            <Link to="/login" className="dj-btn-outline dj-btn-lg">
              <span className="btn-text">Login</span>
              <span className="btn-arrow">→</span>
            </Link>
          </div>
          <ul className="dj-cta-perks">
            <li><span className="perk-check">✓</span> FREE TRIAL</li>
            <li><span className="perk-check">✓</span> NO SETUP FEE</li>
            <li><span className="perk-check">✓</span> 24/7 SUPPORT</li>
            <li><span className="perk-check">✓</span> BLOCKCHAIN VERIFIED</li>
          </ul>
        </div>
      </section>

      {/* ── FOOTER ── */}
      <footer className="dj-footer">
        <div className="dj-container">
          <div className="dj-footer-grid">
            <div className="dj-footer-brand">
              <h3><span>⚖</span> Decentralized Justice</h3>
              <p>Modern legal transparency platform powered by blockchain technology for fair and efficient justice delivery.</p>
              <div className="dj-social-links">
                <Link to="#" className="social-link">𝕏 Twitter</Link>
                <Link to="#" className="social-link">in LinkedIn</Link>
                <Link to="#" className="social-link">⌨ GitHub</Link>
              </div>
            </div>
            <div className="dj-footer-col">
              <h4>Platform</h4>
              <Link to="/login">Login</Link>
              <Link to="/register">Register</Link>
              <Link to="/explorer">Explorer</Link>
              <Link to="/about">About</Link>
            </div>
            <div className="dj-footer-col">
              <h4>Support</h4>
              <a href="mailto:support@justice.gov.pk">support@justice.gov.pk</a>
              <span>Helpline: 1234</span>
              <span>Emergency: 15</span>
              <span>24/7 Available</span>
            </div>
            <div className="dj-footer-nl">
              <h4>Stay Updated</h4>
              <p>Platform updates and legal tech news, delivered to your inbox.</p>
              <form className="dj-nl-form" onSubmit={handleNewsletterSubmit}>
                <input type="email" name="email" placeholder="your@email.com" required />
                <button type="submit">Subscribe</button>
              </form>
              <p className="dj-nl-note">No spam. Unsubscribe anytime.</p>
            </div>
          </div>
          <div className="dj-footer-bottom">
            <div className="footer-glow" />
            © 2024 DECENTRALIZED JUSTICE · ALL RIGHTS RESERVED · BUILT WITH BLOCKCHAIN FOR TRANSPARENCY
          </div>
        </div>
      </footer>

      <style>{`
        /* ────────────────────────────────────────────────────────────
           ENHANCED STYLES - CONSISTENT INDIGO THEME (No Purple)
        ──────────────────────────────────────────────────────────── */
        *,*::before,*::after{margin:0;padding:0;box-sizing:border-box;}
        html{scroll-behavior:smooth;scroll-padding-top:72px;}
        :focus-visible{outline:2px solid #6366f1;outline-offset:3px;border-radius:4px;}

        :root{
          --bg: #07090e;
          --bg-1: #0c0f1a;
          --bg-2: #111527;
          --surface: rgba(255,255,255,0.03);
          --surface-h: rgba(255,255,255,0.06);
          --line: rgba(255,255,255,0.07);
          --line-h: rgba(255,255,255,0.14);
          --text: #e8ecf8;
          --muted: #7a849c;
          --faint: #3d4459;
          --indigo: #6366f1;
          --indigo-d: #4f46e5;
          --indigo-l: #818cf8;
          --indigo-light: #a5b4fc;
          --ice: #94a3b8;
          --mono: 'DM Mono', monospace;
          --sans: 'Inter', system-ui, sans-serif;
          --display: 'Syne', sans-serif;
          --r: 6px;
          --r2: 10px;
          --trans: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
          --shadow-sm: 0 1px 2px 0 rgb(0 0 0 / 0.05);
          --shadow-md: 0 4px 6px -1px rgb(0 0 0 / 0.1), 0 2px 4px -2px rgb(0 0 0 / 0.1);
          --shadow-lg: 0 10px 15px -3px rgb(0 0 0 / 0.1), 0 4px 6px -4px rgb(0 0 0 / 0.1);
          --shadow-xl: 0 20px 25px -5px rgb(0 0 0 / 0.1), 0 8px 10px -6px rgb(0 0 0 / 0.1);
          --shadow-2xl: 0 25px 50px -12px rgb(0 0 0 / 0.25);
          --shadow-glow: 0 0 20px rgba(99, 102, 241, 0.3);
          --shadow-glow-lg: 0 0 40px rgba(99, 102, 241, 0.4);
        }

        body{
          background: var(--bg);
          color: var(--text);
          font-family: var(--sans);
          overflow-x: hidden;
          min-height: 100vh;
          line-height: 1.6;
          -webkit-font-smoothing: antialiased;
          cursor: none;
        }

        /* Cursor Effects */
        .cursor-glow {
          position: fixed;
          width: 400px;
          height: 400px;
          background: radial-gradient(circle, rgba(99, 102, 241, 0.08) 0%, transparent 70%);
          border-radius: 50%;
          pointer-events: none;
          transform: translate(-50%, -50%);
          z-index: 9999;
          transition: transform 0.1s ease;
        }

        .cursor-trail {
          position: fixed;
          width: 8px;
          height: 8px;
          background: var(--indigo);
          border-radius: 50%;
          pointer-events: none;
          transform: translate(-50%, -50%);
          z-index: 10000;
          transition: transform 0.05s ease;
          box-shadow: 0 0 10px var(--indigo);
        }

        @media (max-width: 768px) {
          .cursor-glow, .cursor-trail { display: none; }
          body { cursor: auto; }
        }

        /* Navigation */
        .dj-nav{
          position:fixed;top:0;left:0;right:0;z-index:100;
          height:72px;
          display:flex;align-items:center;justify-content:space-between;
          padding:0 3rem;
          background:rgba(7,9,14,0.85);
          backdrop-filter:blur(16px);
          border-bottom:1px solid var(--line);
          transition: var(--trans);
        }
        .dj-nav:hover {
          background: rgba(7,9,14,0.95);
          box-shadow: var(--shadow-glow);
        }
        .dj-nav-brand{
          font-family:var(--display);
          font-weight:700;font-size:1rem;
          display:flex;align-items:center;gap:10px;
          letter-spacing:-0.3px;
        }
        .dj-nav-brand-mark{
          width:28px;height:28px;
          background: linear-gradient(135deg, var(--indigo), var(--indigo-d));
          display:flex;align-items:center;justify-content:center;
          font-size:14px;
          border-radius:4px;
          animation: rotateGlow 3s ease-in-out infinite;
        }
        @keyframes rotateGlow {
          0%, 100% { box-shadow: 0 0 5px var(--indigo); }
          50% { box-shadow: 0 0 20px var(--indigo); }
        }
        .dj-nav-links{display:flex;gap:2rem;}
        .dj-nav-links a{
          font-size:0.83rem;font-weight:500;
          color:var(--muted);letter-spacing:0.2px;
          transition:color 0.2s;
          text-decoration:none;
        }
        .dj-nav-links a:hover,.dj-nav-links a.active{color:var(--text);}
        .dj-nav-cta{
          padding:8px 20px;
          border:1px solid var(--indigo);
          border-radius:var(--r);
          font-size:0.82rem;font-weight:600;
          color:var(--indigo-l);
          background:rgba(99,102,241,0.08);
          transition:var(--trans);
          cursor:pointer;
          text-decoration:none;
        }
        .dj-nav-cta:hover{
          background:rgba(99,102,241,0.18);
          color:#fff;
          transform: translateY(-2px);
          box-shadow: var(--shadow-glow);
        }

        /* Hero */
        .dj-hero{
          min-height:100vh;
          display:flex;flex-direction:column;
          align-items:center;justify-content:center;
          padding:100px 0 80px;
          position:relative;
          overflow:hidden;
        }
        .dj-hero-grid{
          position:absolute;inset:0;
          background-image:
            linear-gradient(rgba(99,102,241,0.06) 1px,transparent 1px),
            linear-gradient(90deg,rgba(99,102,241,0.06) 1px,transparent 1px);
          background-size:60px 60px;
          mask-image:radial-gradient(ellipse 90% 70% at 50% 40%,black 20%,transparent 75%);
          -webkit-mask-image:radial-gradient(ellipse 90% 70% at 50% 40%,black 20%,transparent 75%);
          pointer-events:none;
          animation: gridPulse 4s ease-in-out infinite;
        }
        @keyframes gridPulse {
          0%, 100% { opacity: 0.5; }
          50% { opacity: 1; }
        }
        .dj-hero-radial{
          position:absolute;
          top:-20%;left:50%;transform:translateX(-50%);
          width:900px;height:500px;
          background:radial-gradient(ellipse,rgba(79,70,229,0.12) 0%,transparent 65%);
          pointer-events:none;
          animation: radialPulse 6s ease-in-out infinite;
        }
        @keyframes radialPulse {
          0%, 100% { transform: translateX(-50%) scale(1); opacity: 0.5; }
          50% { transform: translateX(-50%) scale(1.1); opacity: 0.8; }
        }
        .dj-particle-field {
          position: absolute;
          inset: 0;
          pointer-events: none;
          overflow: hidden;
        }
        .dj-particle {
          position: absolute;
          width: 2px;
          height: 2px;
          background: var(--indigo);
          border-radius: 50%;
          opacity: 0;
          animation: particleFloat 4s ease-in-out infinite;
        }
        @keyframes particleFloat {
          0% { transform: translateY(100vh) scale(0); opacity: 0; }
          50% { opacity: 0.5; }
          100% { transform: translateY(-100vh) scale(1); opacity: 0; }
        }
        .dj-hero-inner{
          position:relative;z-index:2;
          text-align:center;
          width:min(1000px,92%);
          margin:auto;
          animation:fadeUp 0.9s cubic-bezier(0.2,0.8,0.4,1) both;
        }
        @keyframes fadeUp{from{opacity:0;transform:translateY(24px)}to{opacity:1;transform:translateY(0)}}
        .dj-hero-tag{
          display:inline-flex;align-items:center;gap:8px;
          padding:6px 14px;
          border:1px solid rgba(99,102,241,0.25);
          border-radius:3px;
          font-family:var(--mono);
          font-size:0.68rem;letter-spacing:1.5px;text-transform:uppercase;
          color:var(--indigo-l);
          margin-bottom:2rem;
          background:rgba(99,102,241,0.05);
          animation: tagPulse 2s ease-in-out infinite;
        }
        @keyframes tagPulse {
          0%, 100% { border-color: rgba(99,102,241,0.25); }
          50% { border-color: rgba(99,102,241,0.6); }
        }
        .dj-hero-tag-dot{
          width:6px;height:6px;border-radius:50%;
          background:var(--indigo);
          animation:blink 2.5s infinite;
        }
        @keyframes blink{0%,100%{opacity:1}50%{opacity:0.3}}
        .dj-h1{
          font-family:var(--display);
          font-size:clamp(2.8rem,7.5vw,5.8rem);
          font-weight:800;
          line-height:1.05;
          letter-spacing:-0.04em;
          margin-bottom:1.5rem;
        }
        .dj-h1-accent{
          display:block;
          background: linear-gradient(135deg, var(--indigo) 0%, var(--indigo-l) 50%, var(--indigo-light) 100%);
          -webkit-background-clip: text;
          -webkit-text-fill-color: transparent;
          background-clip: text;
          animation: gradientShift 3s ease-in-out infinite;
        }
        @keyframes gradientShift {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.9; }
        }
        .dj-hero-desc{
          max-width:580px;margin:0 auto 2.5rem;
          color:var(--muted);font-size:1rem;line-height:1.8;
        }
        .dj-hero-btns{
          display:flex;justify-content:center;gap:12px;flex-wrap:wrap;
          margin-bottom:4rem;
        }
        .dj-btn-primary, .dj-btn-outline{
          padding:12px 28px;
          border-radius:var(--r);
          font-size:0.88rem;font-weight:600;
          transition:var(--trans);
          display:inline-flex;align-items:center;gap:8px;
          text-decoration:none;
          position: relative;
          overflow: hidden;
        }
        .dj-btn-primary{
          background: linear-gradient(135deg, var(--indigo), var(--indigo-d));
          border:1px solid var(--indigo-d);
          color:#fff;
          box-shadow: var(--shadow-sm);
        }
        .dj-btn-primary::before {
          content: '';
          position: absolute;
          top: 0;
          left: -100%;
          width: 100%;
          height: 100%;
          background: linear-gradient(90deg, transparent, rgba(255,255,255,0.2), transparent);
          transition: left 0.5s ease;
        }
        .dj-btn-primary:hover::before {
          left: 100%;
        }
        .dj-btn-primary:hover{
          transform:translateY(-2px);
          box-shadow:var(--shadow-glow);
        }
        .dj-btn-outline{
          border:1px solid var(--line-h);
          color:var(--ice);
          background:rgba(255,255,255,0.04);
          backdrop-filter:blur(8px);
        }
        .dj-btn-outline:hover{
          background:rgba(255,255,255,0.09);
          border-color:rgba(255,255,255,0.28);
          transform:translateY(-2px);
          box-shadow: var(--shadow-md);
        }
        .btn-arrow, .btn-icon, .btn-sparkle {
          transition: transform 0.3s ease;
        }
        .dj-btn-primary:hover .btn-arrow,
        .dj-btn-outline:hover .btn-arrow {
          transform: translateX(4px);
        }
        .dj-btn-primary:hover .btn-sparkle {
          transform: rotate(20deg) scale(1.1);
        }
        .dj-btn-lg{padding:14px 32px;font-size:0.93rem;}
        .dj-stats-row{
          display:grid;grid-template-columns:repeat(4,1fr);gap:1px;
          border:1px solid var(--line);border-radius:var(--r2);
          overflow:hidden;background:var(--line);
        }
        .dj-stat-cell{
          background:var(--bg-1);
          padding:24px 20px;text-align:center;
          transition:all 0.3s cubic-bezier(0.4,0,0.2,1);
          position: relative;
          overflow: hidden;
        }
        .dj-stat-cell:hover{
          background:linear-gradient(135deg, var(--bg-2), rgba(99,102,241,0.1));
          box-shadow: inset 0 0 20px rgba(99,102,241,0.1);
        }
        .stat-progress {
          position: absolute;
          bottom: 0;
          left: 0;
          height: 2px;
          background: linear-gradient(90deg, var(--indigo), var(--indigo-l));
          transition: width 0.3s ease;
        }
        .dj-stat-icon {
          font-size: 1.5rem;
          display: block;
          margin-bottom: 8px;
          animation: iconBounce 2s ease-in-out infinite;
        }
        @keyframes iconBounce {
          0%, 100% { transform: translateY(0); }
          50% { transform: translateY(-3px); }
        }
        .dj-stat-val{
          font-family:var(--mono);
          font-size:1.8rem;font-weight:500;
          color:var(--text);display:block;margin-bottom:4px;
          background: linear-gradient(135deg, var(--text), var(--indigo-l));
          -webkit-background-clip: text;
          -webkit-text-fill-color: transparent;
          background-clip: text;
        }
        .dj-stat-label{
          font-size:0.72rem;letter-spacing:1.5px;text-transform:uppercase;
          color:var(--muted);
        }
        .dj-scroll-cue{
          position:absolute;bottom:32px;left:50%;transform:translateX(-50%);
          display:flex;flex-direction:column;align-items:center;gap:8px;
          color:var(--faint);font-family:var(--mono);font-size:0.6rem;letter-spacing:2px;
        }
        .dj-scroll-track{
          width:1px;height:40px;
          background:linear-gradient(to bottom,var(--indigo),transparent);
          animation:scrollLine 2s ease-in-out infinite;
        }
        @keyframes scrollLine{0%,100%{opacity:0.3;transform:scaleY(1)}50%{opacity:1;transform:scaleY(0.6)}}
        .dj-section{padding:96px 0;position:relative;}
        .dj-section-alt{background:linear-gradient(180deg,rgba(0,0,0,0.3) 0%,transparent 100%);}
        .dj-section-hd{text-align:center;margin-bottom:56px;}
        .dj-eyebrow{
          font-family:var(--mono);
          font-size:0.65rem;letter-spacing:3px;text-transform:uppercase;
          color:var(--indigo-l);
          display:inline-flex;align-items:center;gap:10px;
          margin-bottom:16px;
        }
        .dj-eyebrow::before{
          content:'';display:block;width:24px;height:1px;
          background:linear-gradient(90deg, var(--indigo), var(--indigo-l));
        }
        .dj-section-hd h2{
          font-family:var(--display);
          font-size:clamp(1.8rem,4vw,2.9rem);
          font-weight:700;letter-spacing:-0.03em;line-height:1.15;
          margin-bottom:14px;
          background: linear-gradient(135deg, var(--text), var(--indigo-l));
          -webkit-background-clip: text;
          -webkit-text-fill-color: transparent;
          background-clip: text;
        }
        .dj-subtitle{
          color:var(--muted);font-size:0.95rem;
          max-width:520px;margin:0 auto;line-height:1.75;
        }
        .dj-container{width:min(1240px,93%);margin:auto;}
        .dj-timeline{display:flex;gap:0;position:relative;flex-wrap:wrap;}
        .dj-timeline::before{
          content:'';
          position:absolute;top:44px;left:44px;right:44px;
          height:1px;
          background:linear-gradient(90deg, transparent, var(--indigo), var(--indigo-l), transparent);
          z-index:0;
        }
        .dj-step-card{
          flex:1;padding:28px 24px;position:relative;z-index:1;
          border:1px solid var(--line);border-radius:var(--r2);
          background:var(--bg-1);
          margin:0 8px;
          transition:all 0.4s cubic-bezier(0.4,0,0.2,1);
          min-width:180px;
          overflow: hidden;
        }
        .dj-step-card::before {
          content: '';
          position: absolute;
          top: 0;
          left: 0;
          right: 0;
          height: 100%;
          background: linear-gradient(135deg, transparent, rgba(99,102,241,0.05), transparent);
          transform: translateX(-100%);
          transition: transform 0.6s ease;
        }
        .dj-step-card:hover::before {
          transform: translateX(100%);
        }
        .dj-step-card:hover{
          border-color:var(--indigo);
          background:linear-gradient(135deg, var(--bg-2), rgba(99,102,241,0.05));
          box-shadow:var(--shadow-glow);
        }
        .dj-step-glow {
          position: absolute;
          inset: 0;
          opacity: 0;
          transition: opacity 0.4s ease;
          pointer-events: none;
        }
        .dj-step-card:hover .dj-step-glow {
          opacity: 1;
        }
        .dj-step-num{
          font-family:var(--mono);
          font-size:0.65rem;letter-spacing:2px;
          margin-bottom:16px;display:block;
        }
        .dj-step-icon{
          width:44px;height:44px;
          border:1px solid var(--line);border-radius:var(--r);
          background:var(--surface);
          display:flex;align-items:center;justify-content:center;
          font-size:1.2rem;margin-bottom:16px;
          transition: all 0.3s ease;
        }
        .dj-step-card:hover .dj-step-icon {
          transform: scale(1.05) rotate(5deg);
          border-color: var(--indigo);
        }
        .dj-step-card h4{font-size:0.92rem;font-weight:600;margin-bottom:8px;color:var(--text);}
        .dj-step-card p{font-size:0.82rem;color:var(--muted);line-height:1.65;}
        .dj-step-progress {
          position: absolute;
          bottom: 0;
          left: 0;
          height: 2px;
          transition: width 0.3s ease;
        }
        .dj-step-connector {
          position: absolute;
          right: -18px;
          top: 50%;
          transform: translateY(-50%);
          color: var(--indigo);
          z-index: 1;
          display: flex;
          align-items: center;
          animation: connectorPulse 1.5s ease-in-out infinite;
        }
        @keyframes connectorPulse {
          0%, 100% { opacity: 0.5; transform: translateY(-50%) scale(1); }
          50% { opacity: 1; transform: translateY(-50%) scale(1.1); }
        }
        .dj-divider{
          width:100%;
          height:1px;
          background:linear-gradient(90deg, transparent, var(--indigo), var(--indigo-l), transparent);
        }
        .dj-tabs{
          display:grid;grid-template-columns:repeat(4,1fr);
          gap:1px;background:var(--line);
          border:1px solid var(--line);border-radius:var(--r2);
          overflow:hidden;margin-bottom:24px;
        }
        .dj-tab{
          background:var(--bg-1);padding:18px 16px;
          cursor:pointer;border:none;color:var(--muted);
          display:flex;align-items:center;gap:12px;
          transition:all 0.3s cubic-bezier(0.4,0,0.2,1);
          text-align:left;
          position:relative;font-family:var(--sans);
          width:100%;
          overflow: hidden;
        }
        .dj-tab::before {
          content: '';
          position: absolute;
          top: 50%;
          left: 50%;
          width: 0;
          height: 0;
          border-radius: 50%;
          background: rgba(99,102,241,0.2);
          transform: translate(-50%, -50%);
          transition: width 0.6s ease, height 0.6s ease;
        }
        .dj-tab:hover::before {
          width: 300px;
          height: 300px;
        }
        .dj-tab:hover{background:var(--bg-2);color:var(--text);transform:translateY(-2px);}
        .dj-tab.active{
          background:linear-gradient(135deg, var(--bg-2), rgba(99,102,241,0.1));
          color:var(--text);
          border-left: 1px solid var(--indigo);
          border-right: 1px solid var(--indigo);
        }
        .dj-tab.active::after{
          content:'';position:absolute;bottom:0;left:0;right:0;
          height:2px;
          background:linear-gradient(90deg, var(--indigo), var(--indigo-l));
          animation: tabSlide 0.3s ease-out forwards;
        }
        @keyframes tabSlide{
          from{transform:scaleX(0)}
          to{transform:scaleX(1)}
        }
        .dj-tab-icon{font-size:1.4rem;flex-shrink:0;transition:transform 0.3s ease;}
        .dj-tab:hover .dj-tab-icon{transform:scale(1.1);}
        .dj-tab-label{font-size:0.88rem;font-weight:600;display:block;}
        .dj-tab-tag{font-family:var(--mono);font-size:0.6rem;letter-spacing:1px;color:var(--muted);display:block;margin-top:2px;}
        .dj-features-grid{
          display:grid;grid-template-columns:repeat(auto-fit,minmax(220px,1fr));gap:1px;
          background:var(--line);
          border:1px solid var(--line);border-radius:var(--r2);overflow:hidden;
        }
        .dj-feature-cell{
          background:var(--bg-1);
          padding:18px 20px;
          display:flex;align-items:center;gap:12px;
          transition:all 0.3s cubic-bezier(0.4,0,0.2,1);
          position: relative;
          overflow: hidden;
        }
        .dj-feature-cell:hover{
          background:linear-gradient(135deg, var(--bg-2), rgba(99,102,241,0.08));
          transform:translateX(5px);
        }
        .dj-feature-dot{
          width:8px;
          height:8px;
          border-radius:50%;
          background:var(--indigo);
          flex-shrink:0;
          position: relative;
        }
        .feature-dot-pulse {
          position: absolute;
          width: 100%;
          height: 100%;
          border-radius: 50%;
          background: var(--indigo);
          animation: dotPulse 1.5s ease-in-out infinite;
        }
        @keyframes dotPulse {
          0%, 100% { opacity: 1; transform: scale(1); }
          50% { opacity: 0.5; transform: scale(1.5); }
        }
        .feature-hover-line {
          position: absolute;
          bottom: 0;
          left: 0;
          width: 0;
          height: 2px;
          background: linear-gradient(90deg, var(--indigo), var(--indigo-l));
          transition: width 0.3s ease;
        }
        .dj-feature-cell:hover .feature-hover-line {
          width: 100%;
        }
        .dj-feature-cell span{font-size:0.87rem;font-weight:500;color:var(--text);}
        .dj-trust-grid{
          display:grid;
          grid-template-columns:repeat(3,1fr);
          gap:16px;
          margin-bottom:16px;
        }
        .dj-trust-stat{
          border:1px solid var(--line);
          border-radius:var(--r2);
          background:var(--bg-1);
          padding:32px 28px;
          transition:all 0.3s cubic-bezier(0.4,0,0.2,1);
          position:relative;
          overflow:hidden;
          cursor: pointer;
        }
        .trust-shimmer {
          position: absolute;
          inset: 0;
          background: linear-gradient(135deg, transparent, rgba(99,102,241,0.05), transparent);
          transform: translateX(-100%);
          transition: transform 0.6s ease;
        }
        .dj-trust-stat:hover .trust-shimmer {
          transform: translateX(100%);
        }
        .dj-trust-stat::before{
          content:'';
          position:absolute;
          top:0;
          left:0;
          right:0;
          height:2px;
          background:linear-gradient(90deg, var(--indigo), var(--indigo-l));
          transform: scaleX(0);
          transition: transform 0.3s ease;
        }
        .dj-trust-stat:hover::before{
          transform: scaleX(1);
        }
        .dj-trust-stat:hover{
          transform:translateY(-8px);
          border-color:var(--indigo);
          background:linear-gradient(135deg, var(--bg-2), rgba(99,102,241,0.05));
          box-shadow:var(--shadow-glow);
        }
        .dj-trust-icon{font-size:1.5rem;margin-bottom:16px;display:block;opacity:0.8;transition:transform 0.3s ease;}
        .dj-trust-stat:hover .dj-trust-icon{transform:scale(1.1) rotate(5deg);}
        .dj-trust-val{
          font-family:var(--mono);
          font-size:2rem;font-weight:500;
          display:block;margin-bottom:4px;
          background: linear-gradient(135deg, var(--text), var(--indigo-l));
          -webkit-background-clip: text;
          -webkit-text-fill-color: transparent;
          background-clip: text;
        }
        .dj-trust-lbl{font-size:0.7rem;letter-spacing:2px;text-transform:uppercase;color:var(--indigo-l);margin-bottom:12px;display:block;}
        .dj-trust-desc{font-size:0.83rem;color:var(--muted);line-height:1.65;}
        .dj-trust-wide-grid{display:grid;grid-template-columns:repeat(3,1fr);gap:16px;}
        .dj-trust-wide{
          border:1px solid var(--line);border-radius:var(--r2);
          background:var(--bg-1);padding:24px;
          display:flex;gap:16px;align-items:flex-start;
          transition:all 0.3s cubic-bezier(0.4,0,0.2,1);
          position: relative;
          overflow: hidden;
        }
        .trust-wide-glow {
          position: absolute;
          inset: 0;
          background: radial-gradient(circle at var(--mouse-x, 50%) var(--mouse-y, 50%), rgba(99,102,241,0.15), transparent);
          opacity: 0;
          transition: opacity 0.3s ease;
        }
        .dj-trust-wide:hover .trust-wide-glow {
          opacity: 1;
        }
        .dj-trust-wide:hover{
          transform:translateY(-6px);
          border-color:var(--indigo);
          background:linear-gradient(135deg, var(--bg-2), rgba(99,102,241,0.05));
          box-shadow:var(--shadow-lg);
        }
        .dj-tw-icon{font-size:1.3rem;opacity:0.8;flex-shrink:0;margin-top:2px;transition:transform 0.3s ease;}
        .dj-trust-wide:hover .dj-tw-icon{transform:scale(1.1) rotate(5deg);}
        .dj-trust-wide h4{font-size:0.9rem;font-weight:600;margin-bottom:6px;}
        .dj-trust-wide p{font-size:0.82rem;color:var(--muted);line-height:1.65;margin-bottom:10px;}
        .dj-trust-badge{
          display:inline-block;
          padding:3px 10px;border-radius:3px;
          font-family:var(--mono);font-size:0.62rem;letter-spacing:1px;text-transform:uppercase;
          background:rgba(99,102,241,0.1);
          border:1px solid rgba(99,102,241,0.2);
          color:var(--indigo-l);
          transition: all 0.3s ease;
        }
        .dj-trust-wide:hover .dj-trust-badge{
          background:rgba(99,102,241,0.2);
          border-color: var(--indigo);
          transform: scale(1.05);
        }
        .dj-cta-section{
          padding:110px 0;text-align:center;
          border-top:1px solid var(--line);
          position:relative;
          overflow:hidden;
        }
        .dj-cta-bg{
          position:absolute;inset:0;
          background:radial-gradient(ellipse 60% 80% at 50% 100%,rgba(79,70,229,0.07),transparent);
          pointer-events:none;
        }
        .dj-cta-glow-ring {
          position: absolute;
          top: 50%;
          left: 50%;
          transform: translate(-50%, -50%);
          width: 300px;
          height: 300px;
          border-radius: 50%;
          background: radial-gradient(circle, rgba(99,102,241,0.1), transparent);
          animation: ringPulse 3s ease-in-out infinite;
        }
        @keyframes ringPulse {
          0%, 100% { transform: translate(-50%, -50%) scale(1); opacity: 0.3; }
          50% { transform: translate(-50%, -50%) scale(1.3); opacity: 0.6; }
        }
        .dj-cta-inner{position:relative;z-index:2;max-width:680px;margin:auto;}
        .dj-cta-perks{
          display:flex;justify-content:center;gap:32px;flex-wrap:wrap;
          margin-top:38px;list-style:none;
          font-family:var(--mono);font-size:0.75rem;
          letter-spacing:1px;color:var(--muted);
        }
        .dj-cta-perks li {
          transition: all 0.3s ease;
          cursor: default;
        }
        .dj-cta-perks li:hover {
          color: var(--indigo-l);
          transform: translateY(-2px);
        }
        .perk-check {
          display: inline-block;
          margin-right: 6px;
          color: var(--indigo);
          font-weight: bold;
          animation: checkBounce 2s ease-in-out infinite;
        }
        @keyframes checkBounce {
          0%, 100% { transform: scale(1); }
          50% { transform: scale(1.2); }
        }
        .dj-footer{
          border-top:1px solid var(--line);
          background:var(--bg-1);
          padding:64px 0 32px;
        }
        .dj-footer-grid{
          display:grid;grid-template-columns:2fr 1fr 1fr 1.6fr;
          gap:48px;padding-bottom:48px;
          border-bottom:1px solid var(--line);margin-bottom:24px;
        }
        .dj-footer-brand h3{
          font-family:var(--display);
          font-size:1.1rem;font-weight:700;
          margin-bottom:14px;display:flex;align-items:center;gap:8px;
        }
        .dj-footer-brand p{color:var(--muted);font-size:0.83rem;line-height:1.75;margin-bottom:20px;}
        .dj-social-links{display:flex;gap:8px;flex-wrap:wrap;}
        .social-link{
          padding:6px 14px;
          border:1px solid var(--line);border-radius:var(--r);
          background:var(--surface);
          font-size:0.78rem;color:var(--muted);
          transition:all 0.3s cubic-bezier(0.4,0,0.2,1);
          display:inline-flex;align-items:center;gap:6px;
          text-decoration:none;
          position: relative;
          overflow: hidden;
        }
        .social-link::before {
          content: '';
          position: absolute;
          top: 0;
          left: -100%;
          width: 100%;
          height: 100%;
          background: linear-gradient(90deg, transparent, rgba(99,102,241,0.2), transparent);
          transition: left 0.5s ease;
        }
        .social-link:hover::before {
          left: 100%;
        }
        .social-link:hover{
          color:var(--indigo-l);
          border-color:rgba(99,102,241,0.35);
          background:rgba(99,102,241,0.07);
          transform:translateY(-2px);
        }
        .dj-footer-col h4{font-size:0.78rem;font-weight:600;letter-spacing:1.5px;text-transform:uppercase;color:var(--ice);margin-bottom:18px;}
        .dj-footer-col a,.dj-footer-col span{
          display:block;color:var(--muted);font-size:0.83rem;margin-bottom:10px;
          transition:var(--trans);text-decoration:none;
        }
        .dj-footer-col a:hover{
          color:var(--indigo-l);
          transform:translateX(4px);
        }
        .dj-footer-nl h4{font-size:0.78rem;font-weight:600;letter-spacing:1.5px;text-transform:uppercase;color:var(--ice);margin-bottom:10px;}
        .dj-footer-nl>p{color:var(--muted);font-size:0.82rem;margin-bottom:14px;line-height:1.65;}
        .dj-nl-form{display:flex;gap:8px;}
        .dj-nl-form input{
          flex:1;padding:9px 14px;
          border:1px solid var(--line);border-radius:var(--r);
          background:rgba(255,255,255,0.03);
          color:var(--text);font-size:0.82rem;font-family:var(--sans);
          transition:all 0.2s;min-width:0;
        }
        .dj-nl-form input::placeholder{color:var(--faint);}
        .dj-nl-form input:focus{
          outline:none;
          border-color:var(--indigo);
          box-shadow:var(--shadow-glow);
        }
        .dj-nl-form button{
          padding:9px 18px;border-radius:var(--r);
          border:1px solid var(--indigo-d);
          background:linear-gradient(135deg, var(--indigo), var(--indigo-d));
          color:#fff;font-size:0.82rem;font-weight:600;font-family:var(--sans);
          cursor:pointer;transition:var(--trans);white-space:nowrap;
          position: relative;
          overflow: hidden;
        }
        .dj-nl-form button::before {
          content: '';
          position: absolute;
          top: 0;
          left: -100%;
          width: 100%;
          height: 100%;
          background: linear-gradient(90deg, transparent, rgba(255,255,255,0.2), transparent);
          transition: left 0.5s ease;
        }
        .dj-nl-form button:hover::before {
          left: 100%;
        }
        .dj-nl-form button:hover{
          transform:scale(1.02);
          box-shadow:var(--shadow-glow);
        }
        .dj-nl-note{font-family:var(--mono);font-size:0.65rem;color:var(--faint);margin-top:8px;}
        .dj-footer-bottom{
          text-align:center;
          color:var(--faint);
          font-family:var(--mono);
          font-size:0.68rem;
          letter-spacing:0.5px;
          position: relative;
          padding-top: 22px;
        }
        .footer-glow {
          position: absolute;
          top: -1px;
          left: 50%;
          transform: translateX(-50%);
          width: 100px;
          height: 1px;
          background: linear-gradient(90deg, transparent, var(--indigo), var(--indigo-l), transparent);
        }
        .dj-fade-section{opacity:0;transform:translateY(20px);transition:opacity 0.7s cubic-bezier(0.2,0.8,0.4,1),transform 0.7s cubic-bezier(0.2,0.8,0.4,1);}
        .dj-fade-section.visible{opacity:1;transform:none;}
        @media(max-width:1024px){
          .dj-footer-grid{grid-template-columns:1fr 1fr;gap:32px;}
          .dj-timeline{flex-wrap:wrap;}
          .dj-timeline::before{display:none;}
          .dj-step-card{min-width:45%;margin:6px;}
        }
        @media(max-width:900px){
          .dj-tabs{grid-template-columns:1fr 1fr;}
          .dj-stats-row{grid-template-columns:1fr 1fr;}
          .dj-trust-grid{grid-template-columns:repeat(2,1fr);}
          .dj-trust-wide-grid{grid-template-columns:repeat(2,1fr);}
        }
        @media(max-width:768px){
          .dj-nav{padding:0 1.5rem;}
          .dj-nav-links{display:none;}
          .dj-footer-grid{grid-template-columns:1fr;}
          .dj-nl-form{flex-direction:column;}
          .dj-trust-wide-grid{grid-template-columns:1fr;}
          .dj-trust-grid{grid-template-columns:1fr;}
          .dj-cta-perks{gap:16px;flex-direction:column;align-items:center;}
          .dj-stats-row{grid-template-columns:repeat(2,1fr);}
          .dj-tabs{grid-template-columns:1fr;}
        }
      `}</style>
    </>
  );
}