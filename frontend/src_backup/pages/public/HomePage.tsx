// frontend/src/pages/public/HomePage.tsx
import { Link } from "react-router-dom";
import { useState, useEffect, useRef, useMemo } from "react";

// Types for better type safety
type RoleKey = "citizens" | "police" | "forensic" | "court";

interface SectionRefs {
  [key: string]: HTMLElement | null;
}

interface VisibleSections {
  hero: boolean;
  process: boolean;
  roles: boolean;
  trust: boolean;
  cta: boolean;
}

// Debounce utility
const debounce = <T extends (...args: any[]) => any>(
  fn: T,
  delay: number,
): ((...args: Parameters<T>) => void) => {
  let timeoutId: ReturnType<typeof setTimeout> | null = null;
  return (...args: Parameters<T>) => {
    if (timeoutId) {
      clearTimeout(timeoutId);
    }
    timeoutId = setTimeout(() => fn(...args), delay);
  };
};

// Skeleton component with shimmer effect
const Skeleton = () => (
  <div className="skeleton-card">
    <div className="skeleton-shimmer"></div>
    <div className="skeleton-icon"></div>
    <div className="skeleton-line"></div>
    <div className="skeleton-line short"></div>
  </div>
);

export function HomePage() {
  const [activeRole, setActiveRole] = useState<RoleKey>("citizens");
  const [visibleSections, setVisibleSections] = useState<VisibleSections>({
    hero: true,
    process: false,
    roles: false,
    trust: false,
    cta: false,
  });
  const [isLoading, setIsLoading] = useState(true);

  const sectionRefs = useRef<SectionRefs>({});

  // Set page title dynamically
  useEffect(() => {
    document.title = "Decentralized Justice System | Blockchain Legal Platform";

    // Add meta description if not exists
    let metaDescription = document.querySelector('meta[name="description"]');
    if (!metaDescription) {
      metaDescription = document.createElement("meta");
      metaDescription.setAttribute("name", "description");
      document.head.appendChild(metaDescription);
    }
    metaDescription.setAttribute(
      "content",
      "Modern justice ecosystem powered by blockchain technology for citizens, police, forensic labs, and courts. Transparent, secure, and efficient legal proceedings.",
    );

    // Add canonical URL
    let canonicalLink = document.querySelector('link[rel="canonical"]');
    if (!canonicalLink) {
      canonicalLink = document.createElement("link");
      canonicalLink.setAttribute("rel", "canonical");
      document.head.appendChild(canonicalLink);
    }
    canonicalLink.setAttribute("href", window.location.origin + "/");

    // Add Open Graph tags
    let ogTitle = document.querySelector('meta[property="og:title"]');
    if (!ogTitle) {
      ogTitle = document.createElement("meta");
      ogTitle.setAttribute("property", "og:title");
      document.head.appendChild(ogTitle);
    }
    ogTitle.setAttribute("content", "Decentralized Justice System");

    let ogDescription = document.querySelector('meta[property="og:description"]');
    if (!ogDescription) {
      ogDescription = document.createElement("meta");
      ogDescription.setAttribute("property", "og:description");
      document.head.appendChild(ogDescription);
    }
    ogDescription.setAttribute(
      "content",
      "Modern justice ecosystem powered by blockchain technology"
    );

    return () => {
      // Cleanup if needed
    };
  }, []);

  const roles = [
    {
      key: "citizens" as const,
      label: "Citizens",
      tag: "PUBLIC_USER",
      icon: "👥",
      ariaLabel: "Switch to citizens role",
    },
    {
      key: "police" as const,
      label: "Police",
      tag: "INVESTIGATOR",
      icon: "👮",
      ariaLabel: "Switch to police role",
    },
    {
      key: "forensic" as const,
      label: "Forensic",
      tag: "FORENSIC_ANALYST",
      icon: "🔬",
      ariaLabel: "Switch to forensic role",
    },
    {
      key: "court" as const,
      label: "Court",
      tag: "COURT",
      icon: "⚖️",
      ariaLabel: "Switch to court role",
    },
  ];

  const features = {
    citizens: [
      "File FIR Online",
      "Track Case Status",
      "Upload Evidence",
      "Emergency SOS",
      "Citizen Dashboard",
      "Feedback System",
    ],
    police: [
      "Review FIR Requests",
      "Manage Investigations",
      "Witness & Suspect Logs",
      "Generate Reports",
      "Court Submissions",
      "Evidence Verification",
    ],
    forensic: [
      "Evidence Queue",
      "Lab Analysis",
      "Digital Signatures",
      "Secure Reports",
      "Assigned Cases",
      "Transfer to Court",
    ],
    court: [
      "Case Review",
      "Virtual Hearings",
      "Evidence Validation",
      "Judgment Delivery",
      "Fine Management",
      "Court Analytics",
    ],
  };

  const steps = [
    {
      no: "01",
      title: "Register Complaint",
      desc: "Submit FIR digitally with documents and identity proof.",
      icon: "📝",
      color: "#f3c66a",
    },
    {
      no: "02",
      title: "Investigation Begins",
      desc: "Authorities review and collect verifiable evidence.",
      icon: "🔍",
      color: "#5ea0ff",
    },
    {
      no: "03",
      title: "Forensic Validation",
      desc: "Experts analyze and sign reports securely.",
      icon: "🔬",
      color: "#6c5ce7",
    },
    {
      no: "04",
      title: "Court Proceedings",
      desc: "Judge reviews immutable records and hearings.",
      icon: "⚖️",
      color: "#e84393",
    },
    {
      no: "05",
      title: "Final Verdict",
      desc: "Transparent judgment stored permanently.",
      icon: "✅",
      color: "#00b894",
    },
  ];

  const stats = [
    { value: "24/7", label: "Access", icon: "🕒" },
    { value: "100%", label: "Traceable", icon: "📊" },
    { value: "IPFS", label: "Storage", icon: "💾" },
    { value: "5+", label: "Roles", icon: "👥" },
  ];

  // Debounced scroll handler for better performance
  const handleScroll = useMemo(
    () =>
      debounce(() => {
        const sections = ["process", "roles", "trust", "cta"];
        sections.forEach((section) => {
          const element = sectionRefs.current[section];
          if (element) {
            const rect = element.getBoundingClientRect();
            const isVisible = rect.top < window.innerHeight - 100;
            setVisibleSections((prev) => {
              if (isVisible && !prev[section as keyof VisibleSections]) {
                return { ...prev, [section]: true };
              }
              return prev;
            });
          }
        });
      }, 100),
    [], // Remove visibleSections dependency to prevent re-creation
  );

  // Scroll handler for section visibility
  useEffect(() => {
    window.addEventListener("scroll", handleScroll);
    handleScroll();

    return () => window.removeEventListener("scroll", handleScroll);
  }, [handleScroll]);

  // Auto-rotate role every 5 seconds
  useEffect(() => {
    const interval = setInterval(() => {
      setActiveRole((prevRole) => {
        const roleKeys = roles.map((r) => r.key);
        const currentIndex = roleKeys.indexOf(prevRole);
        const nextIndex = (currentIndex + 1) % roleKeys.length;
        return roleKeys[nextIndex];
      });
    }, 5000);

    return () => clearInterval(interval);
  }, [roles]); // Add roles to dependency array

  // Simulate loading for skeleton
  useEffect(() => {
    const timer = setTimeout(() => setIsLoading(false), 500);
    return () => clearTimeout(timer);
  }, []);

  // Newsletter subscription handler
  const handleNewsletterSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const form = e.currentTarget;
    const input = form.elements.namedItem("email") as HTMLInputElement;
    
    if (input?.value) {
      // Show loading state on button
      const button = form.querySelector('button[type="submit"]');
      const originalText = button?.textContent;
      if (button) button.textContent = "Subscribing...";
      
      try {
        // Simulate API call - replace with actual API endpoint
        await new Promise(resolve => setTimeout(resolve, 1000));
        console.log("Newsletter subscription:", input.value);
        
        // Show success message
        const successMsg = document.createElement("div");
        successMsg.textContent = "✓ Subscribed successfully!";
        successMsg.style.color = "var(--green)";
        successMsg.style.fontSize = "0.8rem";
        successMsg.style.marginTop = "8px";
        form.appendChild(successMsg);
        
        input.value = "";
        
        // Remove success message after 3 seconds
        setTimeout(() => successMsg.remove(), 3000);
      } catch (error) {
        console.error("Subscription failed:", error);
        const errorMsg = document.createElement("div");
        errorMsg.textContent = "❌ Failed to subscribe. Please try again.";
        errorMsg.style.color = "var(--pink)";
        errorMsg.style.fontSize = "0.8rem";
        errorMsg.style.marginTop = "8px";
        form.appendChild(errorMsg);
        setTimeout(() => errorMsg.remove(), 3000);
      } finally {
        if (button) button.textContent = originalText || "Subscribe";
      }
    }
  };

  return (
    <>
      <div className="page-shell" role="main" aria-label="Homepage">
        {/* HERO SECTION */}
        <section className="hero" id="hero" aria-label="Hero section">
          <div className="grid-overlay" aria-hidden="true" />

          <div className="hero-inner fade-in-up">
            <span className="badge pulse" role="status" aria-live="polite">
              <span className="badge-dot" aria-hidden="true"></span>
              Blockchain Secured • Transparent • Trusted
            </span>

            <h1 className="glow-text">
              Modern Justice <br />
              <span className="gradient-text">Powered by Blockchain</span>
            </h1>

            <p className="hero-description">
              A premium digital justice ecosystem for citizens, police, forensic
              labs, and courts — built with trust, transparency, and speed.
            </p>

            <div className="hero-actions">
              <Link
                to="/register"
                className="btn-primary"
                aria-label="Begin new case registration"
              >
                <span>Begin Case</span>
                <span className="btn-icon" aria-hidden="true">
                  →
                </span>
              </Link>

              <Link
                to="/blockchain"
                className="btn-secondary"
                aria-label="View blockchain explorer"
              >
                <span>View Explorer</span>
                <span className="btn-icon" aria-hidden="true">
                  🔗
                </span>
              </Link>
            </div>

            <div className="hero-stats">
              {stats.map((stat, i) => (
                <div
                  key={i}
                  className="stat-card fade-in-up"
                  style={{ animationDelay: `${i * 0.1}s` }}
                >
                  <span className="stat-icon" aria-hidden="true">
                    {stat.icon}
                  </span>
                  <h3>{stat.value}</h3>
                  <span>{stat.label}</span>
                </div>
              ))}
            </div>
          </div>

          <div className="scroll-indicator" aria-label="Scroll down indicator">
            <span>Scroll</span>
            <div className="scroll-mouse" aria-hidden="true">
              <div className="scroll-wheel"></div>
            </div>
          </div>
        </section>

        {/* PROCESS SECTION */}
        <section
          className={`section fade-in-section ${visibleSections.process ? "visible" : ""}`}
          id="process"
          ref={(el) => (sectionRefs.current.process = el)}
          aria-label="System workflow process"
        >
          <div className="container">
            <div className="section-header">
              <p className="eyebrow">
                <span className="eyebrow-line" aria-hidden="true"></span>
                Workflow
              </p>
              <h2>How the System Works</h2>
              <p className="section-subtitle">
                From complaint to verdict — complete transparency
              </p>
            </div>

            <div className="timeline">
              {steps.map((item, index) => (
                <div
                  className="glass-card step"
                  key={item.no}
                  style={{ animationDelay: `${index * 0.1}s` }}
                >
                  <div
                    className="step-icon"
                    style={{ background: `${item.color}20` }}
                    aria-hidden="true"
                  >
                    <span>{item.icon}</span>
                  </div>
                  <span className="step-no">{item.no}</span>
                  <h4>{item.title}</h4>
                  <p>{item.desc}</p>
                  {index < steps.length - 1 && (
                    <div className="step-arrow" aria-hidden="true">
                      →
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* ROLE SECTION */}
        <section
          className={`section alt fade-in-section ${visibleSections.roles ? "visible" : ""}`}
          id="roles"
          ref={(el) => (sectionRefs.current.roles = el)}
          aria-label="Role-specific capabilities"
        >
          <div className="container">
            <div className="section-header">
              <p className="eyebrow">
                <span className="eyebrow-line" aria-hidden="true"></span>
                Capabilities
              </p>
              <h2>Built for Every Stakeholder</h2>
              <p className="section-subtitle">
                Role-specific tools and dashboards
              </p>
            </div>

            <div className="tabs" role="tablist" aria-label="User roles">
              {roles.map((role) => (
                <button
                  key={role.key}
                  className={`tab-btn ${activeRole === role.key ? "active" : ""}`}
                  onClick={() => setActiveRole(role.key)}
                  role="tab"
                  aria-label={role.ariaLabel}
                  aria-selected={activeRole === role.key}
                  aria-controls={`${role.key}-features`}
                >
                  <span className="tab-icon" aria-hidden="true">
                    {role.icon}
                  </span>
                  <div className="tab-content">
                    <strong>{role.label}</strong>
                    <span>{role.tag}</span>
                  </div>
                  {activeRole === role.key && (
                    <span
                      className="tab-active-indicator"
                      aria-hidden="true"
                    ></span>
                  )}
                </button>
              ))}
            </div>

            <div
              className="features-grid"
              id={`${activeRole}-features`}
              role="tabpanel"
              aria-label={`${activeRole} features`}
            >
              {isLoading
                ? Array(6)
                    .fill(0)
                    .map((_, i) => <Skeleton key={i} />)
                : features[activeRole as keyof typeof features]?.map(
                    (item, i) => (
                      <div
                        className="glass-card feature"
                        key={i}
                        style={{ animationDelay: `${i * 0.05}s` }}
                      >
                        <div
                          className="feature-icon-wrapper"
                          aria-hidden="true"
                        >
                          <span className="feature-icon">✦</span>
                        </div>
                        <p>{item}</p>
                        <div
                          className="feature-hover-line"
                          aria-hidden="true"
                        ></div>
                      </div>
                    ),
                  )}
            </div>
          </div>
        </section>

        {/* TRUST SECTION */}
        <section
          className={`section fade-in-section ${visibleSections.trust ? "visible" : ""}`}
          id="trust"
          ref={(el) => (sectionRefs.current.trust = el)}
          aria-label="Security and trust features"
        >
          <div className="container trust">
            <div className="trust-content">
              <p className="eyebrow">
                <span className="eyebrow-line" aria-hidden="true"></span>
                Security Layer
              </p>
              <h2>Enterprise Grade Infrastructure</h2>
              <p className="muted">
                End-to-end encryption, tamper-proof records, digital signatures,
                JWT security, live notifications, and permanent audit trails.
              </p>
              <div className="trust-stats">
                <div className="trust-stat">
                  <span className="trust-stat-value">256-bit</span>
                  <span className="trust-stat-label">Encryption</span>
                </div>
                <div className="trust-stat">
                  <span className="trust-stat-value">99.99%</span>
                  <span className="trust-stat-label">Uptime</span>
                </div>
                <div className="trust-stat">
                  <span className="trust-stat-value">ISO</span>
                  <span className="trust-stat-label">Certified</span>
                </div>
              </div>
            </div>

            <div className="trust-cards">
              <div className="glass-card trust-card">
                <div className="trust-card-icon" aria-hidden="true">
                  🔒
                </div>
                <h4>Evidence Integrity</h4>
                <p>Every file hashed and verifiable on blockchain.</p>
                <div className="trust-card-badge">Immutable</div>
              </div>

              <div className="glass-card trust-card">
                <div className="trust-card-icon" aria-hidden="true">
                  🤖
                </div>
                <h4>Smart Governance</h4>
                <p>Automated approvals and intelligent workflows.</p>
                <div className="trust-card-badge">AI-Powered</div>
              </div>

              <div className="glass-card trust-card">
                <div className="trust-card-icon" aria-hidden="true">
                  👁️
                </div>
                <h4>Citizen Trust</h4>
                <p>Live updates and transparent case history.</p>
                <div className="trust-card-badge">Real-time</div>
              </div>
            </div>
          </div>
        </section>

        {/* CTA SECTION */}
        <section
          className={`cta fade-in-section ${visibleSections.cta ? "visible" : ""}`}
          id="cta"
          ref={(el) => (sectionRefs.current.cta = el)}
          aria-label="Call to action"
        >
          <div className="container center">
            <div className="cta-glow" aria-hidden="true"></div>
            <p className="eyebrow">Start Today</p>
            <h2>Justice Should Be Transparent</h2>
            <p className="muted">
              Join a next-generation legal ecosystem built for fairness and
              speed.
            </p>

            <div className="hero-actions">
              <Link
                to="/register"
                className="btn-primary btn-large"
                aria-label="Register new account"
              >
                <span>Register Now</span>
                <span className="btn-icon" aria-hidden="true">
                  ✨
                </span>
              </Link>

              <Link
                to="/login"
                className="btn-secondary btn-large"
                aria-label="Login to existing account"
              >
                <span>Login</span>
                <span className="btn-icon" aria-hidden="true">
                  →
                </span>
              </Link>
            </div>

            <div className="cta-features">
              <span>✓ Free Trial</span>
              <span>✓ No Setup Fee</span>
              <span>✓ 24/7 Support</span>
            </div>
          </div>
        </section>

        {/* FOOTER */}
        <footer className="footer" role="contentinfo">
          <div className="container footer-grid">
            <div className="footer-brand">
              <h3 aria-label="Decentralized Justice">
                ⚖ Decentralized Justice
              </h3>
              <p>
                Modern legal transparency platform powered by blockchain
                technology.
              </p>
              <div className="footer-social" aria-label="Social media links">
                <a
                  href="#"
                  target="_blank"
                  rel="noopener noreferrer"
                  aria-label="Follow us on Twitter"
                >
                  Twitter
                </a>
                <a
                  href="#"
                  target="_blank"
                  rel="noopener noreferrer"
                  aria-label="Follow us on LinkedIn"
                >
                  LinkedIn
                </a>
                <a
                  href="#"
                  target="_blank"
                  rel="noopener noreferrer"
                  aria-label="View our GitHub"
                >
                  GitHub
                </a>
              </div>
            </div>

            <div className="footer-links">
              <h4>Platform</h4>
              <Link to="/login" aria-label="Login to platform">
                Login
              </Link>
              <Link to="/register" aria-label="Register new account">
                Register
              </Link>
              <Link to="/blockchain" aria-label="View blockchain explorer">
                Explorer
              </Link>
            </div>

            <div className="footer-links">
              <h4>Support</h4>
              <a
                href="mailto:support@justice.gov.pk"
                aria-label="Email support"
              >
                support@justice.gov.pk
              </a>
              <p>Helpline: 1234</p>
              <p>Emergency: 15</p>
            </div>

            <div className="footer-newsletter">
              <h4>Stay Updated</h4>
              <form
                className="newsletter-form"
                onSubmit={handleNewsletterSubmit}
              >
                <input
                  type="email"
                  placeholder="Your email"
                  name="email"
                  aria-label="Email address for newsletter"
                  required
                />
                <button type="submit" aria-label="Subscribe to newsletter">
                  Subscribe
                </button>
              </form>
            </div>
          </div>
          <div className="footer-bottom">
            <div className="container">
              <p>&copy; 2024 Decentralized Justice. All rights reserved.</p>
            </div>
          </div>
        </footer>
      </div>

      <style>{`
        /* Smooth Scroll with padding fix */
        html {
          scroll-behavior: smooth;
          scroll-padding-top: 74px;
        }

        /* Hide focus ring for mouse users only */
        :focus:not(:focus-visible) {
          outline: none;
        }

        .page-shell {
          padding-top: 74px;
        }

        @media (max-width: 768px) {
          html {
            scroll-padding-top: 74px;
          }
          .page-shell {
            padding-top: 74px;
          }
        }

        @media (max-width: 480px) {
          html {
            scroll-padding-top: 60px;
          }
          .page-shell {
            padding-top: 60px;
          }
        }

        /* Button active state */
        .btn-primary:active,
        .btn-secondary:active {
          transform: translateY(1px);
          transition: transform 0.05s;
        }

        /* Enhanced Skeleton with Shimmer Effect */
        .skeleton-card {
          background: var(--card);
          border: 1px solid var(--line);
          border-radius: 22px;
          padding: 24px;
          position: relative;
          overflow: hidden;
        }

        .skeleton-shimmer {
          position: absolute;
          top: 0;
          left: 0;
          right: 0;
          bottom: 0;
          background: linear-gradient(
            90deg,
            transparent 0%,
            rgba(255, 255, 255, 0.05) 25%,
            rgba(255, 255, 255, 0.1) 50%,
            rgba(255, 255, 255, 0.05) 75%,
            transparent 100%
          );
          animation: shimmer 1.5s infinite;
          transform: translateX(-100%);
        }

        @keyframes shimmer {
          0% {
            transform: translateX(-100%);
          }
          100% {
            transform: translateX(100%);
          }
        }

        .skeleton-icon {
          width: 40px;
          height: 40px;
          border-radius: 12px;
          background: rgba(255, 255, 255, 0.1);
          margin-bottom: 12px;
          position: relative;
          z-index: 1;
        }

        .skeleton-line {
          height: 20px;
          background: rgba(255, 255, 255, 0.1);
          border-radius: 4px;
          margin-bottom: 8px;
          position: relative;
          z-index: 1;
        }

        .skeleton-line.short {
          width: 60%;
        }

        /* Rest of your existing styles... */
        * {
          margin: 0;
          padding: 0;
          box-sizing: border-box;
        }

        /* Reduced motion preferences */
        @media (prefers-reduced-motion: reduce) {
          *,
          *::before,
          *::after {
            animation-duration: 0.01ms !important;
            animation-iteration-count: 1 !important;
            transition-duration: 0.01ms !important;
            scroll-behavior: auto !important;
          }
          
          .fade-in-section,
          .glass-card:hover,
          .btn-primary:hover,
          .btn-secondary:hover {
            transition: none !important;
          }
          
          .skeleton-shimmer {
            animation: none;
          }
        }

        /* Focus visible for accessibility */
        *:focus-visible {
          outline: 2px solid var(--gold);
          outline-offset: 2px;
          border-radius: 4px;
        }

        :root {
          --bg: #07111f;
          --bg2: #0d1b2f;
          --card: rgba(255,255,255,.06);
          --card-hover: rgba(255,255,255,.1);
          --line: rgba(255,255,255,.08);
          --text: #ffffff;
          --muted: #8ba3c4;
          --gold: #f3c66a;
          --blue: #5ea0ff;
          --purple: #6c5ce7;
          --pink: #e84393;
          --green: #00b894;
        }

        body {
          background: linear-gradient(180deg, var(--bg), #050b14);
          color: var(--text);
          font-family: 'Inter', system-ui, -apple-system, sans-serif;
          overflow-x: hidden;
        }

        .page-shell {
          overflow-x: hidden;
        }

        .container {
          width: min(1200px, 92%);
          margin: auto;
        }

        .section {
          padding: 90px 0;
          position: relative;
        }

        .alt {
          background: rgba(255, 255, 255, .02);
        }

        .section-header {
          text-align: center;
          margin-bottom: 50px;
        }

        .section-subtitle {
          color: var(--muted);
          font-size: 1.1rem;
        }

        .eyebrow {
          color: var(--gold);
          font-size: .8rem;
          letter-spacing: 2px;
          margin-bottom: 14px;
          text-transform: uppercase;
          display: inline-flex;
          align-items: center;
          gap: 10px;
        }

        .eyebrow-line {
          width: 30px;
          height: 1px;
          background: var(--gold);
        }

        h2 {
          font-size: clamp(2rem, 5vw, 3.4rem);
          margin-bottom: 16px;
        }

        .muted {
          color: var(--muted);
          line-height: 1.7;
        }

        /* HERO */
        .hero {
          min-height: 100vh;
          display: grid;
          place-items: center;
          position: relative;
          padding: 120px 0 70px;
          overflow: hidden;
        }

        .hero-inner {
          width: min(1100px, 92%);
          margin: auto;
          text-align: center;
          position: relative;
          z-index: 2;
        }

        .hero h1 {
          font-size: clamp(3rem, 8vw, 6rem);
          line-height: 1.02;
          margin: 18px 0;
        }

        .gradient-text {
          background: linear-gradient(90deg, var(--gold), #fff, var(--blue));
          -webkit-background-clip: text;
          -webkit-text-fill-color: transparent;
          background-clip: text;
        }

        .glow-text {
          text-shadow: 0 0 30px rgba(243, 198, 106, 0.3);
        }

        .hero-description {
          max-width: 760px;
          margin: auto;
          color: var(--muted);
          line-height: 1.8;
          font-size: 1.05rem;
        }

        .badge {
          display: inline-flex;
          align-items: center;
          gap: 8px;
          padding: 10px 16px;
          border: 1px solid var(--line);
          border-radius: 999px;
          background: rgba(255, 255, 255, .04);
          color: var(--gold);
        }

        .badge-dot {
          width: 8px;
          height: 8px;
          background: var(--gold);
          border-radius: 50%;
          animation: pulse 2s infinite;
        }

        @keyframes pulse {
          0%, 100% { opacity: 1; transform: scale(1); }
          50% { opacity: 0.5; transform: scale(1.2); }
        }

        .pulse {
          animation: pulse-border 2s infinite;
        }

        @keyframes pulse-border {
          0%, 100% { box-shadow: 0 0 0 0 rgba(243, 198, 106, 0.4); }
          50% { box-shadow: 0 0 0 10px rgba(243, 198, 106, 0); }
        }

        .hero-actions {
          margin-top: 34px;
          display: flex;
          justify-content: center;
          gap: 14px;
          flex-wrap: wrap;
        }

        .btn-primary, .btn-secondary {
          padding: 14px 24px;
          border-radius: 14px;
          text-decoration: none;
          font-weight: 700;
          transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
          display: inline-flex;
          align-items: center;
          gap: 8px;
        }

        .btn-primary {
          background: linear-gradient(135deg, var(--gold), #ffd98d);
          color: #111;
        }

        .btn-primary:hover {
          transform: translateY(-3px);
          box-shadow: 0 10px 30px rgba(243, 198, 106, 0.3);
        }

        .btn-primary:focus-visible {
          outline: 2px solid var(--gold);
          outline-offset: 2px;
          transform: translateY(-3px);
        }

        .btn-secondary {
          border: 1px solid var(--line);
          color: white;
          background: rgba(255, 255, 255, .03);
        }

        .btn-secondary:hover {
          background: rgba(255, 255, 255, .1);
          transform: translateY(-3px);
        }

        .btn-secondary:focus-visible {
          outline: 2px solid var(--gold);
          outline-offset: 2px;
          transform: translateY(-3px);
        }

        .btn-large {
          padding: 16px 32px;
          font-size: 1.1rem;
        }

        .btn-icon {
          transition: transform 0.3s;
        }

        .btn-primary:hover .btn-icon,
        .btn-secondary:hover .btn-icon {
          transform: translateX(5px);
        }

        .hero-stats {
          margin-top: 52px;
          display: grid;
          grid-template-columns: repeat(4, 1fr);
          gap: 16px;
        }

        .stat-card {
          padding: 24px;
          border: 1px solid var(--line);
          border-radius: 18px;
          background: var(--card);
          backdrop-filter: blur(14px);
          transition: all 0.3s;
          cursor: pointer;
        }

        .stat-card:hover {
          transform: translateY(-5px);
          border-color: var(--gold);
          background: var(--card-hover);
        }

        .stat-card:focus-visible {
          outline: 2px solid var(--gold);
          outline-offset: 2px;
          transform: translateY(-5px);
        }

        .stat-icon {
          font-size: 2rem;
          display: block;
          margin-bottom: 10px;
        }

        .hero-stats h3 {
          font-size: 2rem;
          color: var(--gold);
        }

        .hero-stats span {
          color: var(--muted);
        }

        /* Scroll Indicator */
        .scroll-indicator {
          position: absolute;
          bottom: 30px;
          left: 50%;
          transform: translateX(-50%);
          text-align: center;
          color: var(--muted);
          font-size: 0.8rem;
        }

        .scroll-mouse {
          width: 26px;
          height: 40px;
          border: 2px solid var(--muted);
          border-radius: 20px;
          margin: 8px auto 0;
          position: relative;
        }

        .scroll-wheel {
          width: 4px;
          height: 8px;
          background: var(--gold);
          border-radius: 2px;
          position: absolute;
          top: 8px;
          left: 50%;
          transform: translateX(-50%);
          animation: scrollWheel 2s infinite;
        }

        @keyframes scrollWheel {
          0% { top: 8px; opacity: 1; }
          80% { top: 24px; opacity: 0; }
          100% { top: 8px; opacity: 0; }
        }

        /* GLASS CARD */
        .glass-card {
          background: var(--card);
          border: 1px solid var(--line);
          border-radius: 22px;
          padding: 24px;
          backdrop-filter: blur(14px);
          transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
          position: relative;
          overflow: hidden;
        }

        .glass-card::before {
          content: '';
          position: absolute;
          top: 0;
          left: -100%;
          width: 100%;
          height: 100%;
          background: linear-gradient(90deg, transparent, rgba(255,255,255,0.05), transparent);
          transition: left 0.5s;
        }

        .glass-card:hover::before {
          left: 100%;
        }

        .glass-card:hover {
          transform: translateY(-6px);
          border-color: rgba(255, 255, 255, .18);
          background: var(--card-hover);
        }

        /* TIMELINE */
        .timeline {
          display: flex;
          justify-content: space-between;
          gap: 18px;
          margin-top: 30px;
          flex-wrap: wrap;
        }

        .step {
          flex: 1;
          min-width: 180px;
          position: relative;
          animation: fadeInUp 0.6s ease-out backwards;
        }

        .step-icon {
          width: 50px;
          height: 50px;
          border-radius: 15px;
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 1.8rem;
          margin-bottom: 16px;
        }

        .step-no {
          color: var(--gold);
          font-size: 1rem;
          font-weight: 800;
          letter-spacing: 1px;
        }

        .step h4 {
          margin: 12px 0;
          font-size: 1.2rem;
        }

        .step p {
          color: var(--muted);
          line-height: 1.6;
          font-size: 0.9rem;
        }

        .step-arrow {
          position: absolute;
          right: -20px;
          top: 50%;
          transform: translateY(-50%);
          color: var(--muted);
          font-size: 1.5rem;
        }

        @media (max-width: 900px) {
          .step-arrow {
            display: none;
          }
        }

        /* TABS */
        .tabs {
          display: grid;
          grid-template-columns: repeat(4, 1fr);
          gap: 12px;
          margin-top: 24px;
        }

        .tab-btn {
          border: none;
          padding: 18px;
          border-radius: 18px;
          background: var(--card);
          color: white;
          cursor: pointer;
          border: 1px solid var(--line);
          transition: all 0.3s;
          display: flex;
          align-items: center;
          gap: 12px;
          position: relative;
          overflow: hidden;
        }

        .tab-btn:hover {
          background: var(--card-hover);
          transform: translateY(-2px);
        }

        .tab-btn:focus-visible {
          outline: 2px solid var(--gold);
          outline-offset: 2px;
          transform: translateY(-2px);
        }

        .tab-btn.active {
          border-color: var(--gold);
          background: rgba(243, 198, 106, 0.1);
        }

        .tab-icon {
          font-size: 1.8rem;
        }

        .tab-content {
          text-align: left;
        }

        .tab-content strong {
          display: block;
          font-size: 1rem;
        }

        .tab-content span {
          color: var(--muted);
          font-size: .8rem;
        }

        .tab-active-indicator {
          position: absolute;
          bottom: 0;
          left: 0;
          right: 0;
          height: 2px;
          background: var(--gold);
          animation: slideIn 0.3s ease-out;
        }

        @keyframes slideIn {
          from { transform: scaleX(0); }
          to { transform: scaleX(1); }
        }

        .features-grid {
          margin-top: 24px;
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(240px, 1fr));
          gap: 16px;
        }

        .feature {
          display: flex;
          align-items: center;
          gap: 12px;
          position: relative;
          overflow: hidden;
          animation: fadeInUp 0.4s ease-out backwards;
        }

        .feature-icon-wrapper {
          width: 40px;
          height: 40px;
          border-radius: 12px;
          background: rgba(243, 198, 106, 0.1);
          display: flex;
          align-items: center;
          justify-content: center;
        }

        .feature-icon {
          color: var(--gold);
          font-size: 1.2rem;
        }

        .feature-hover-line {
          position: absolute;
          bottom: 0;
          left: 0;
          right: 0;
          height: 2px;
          background: linear-gradient(90deg, var(--gold), transparent);
          transform: scaleX(0);
          transition: transform 0.3s;
        }

        .feature:hover .feature-hover-line {
          transform: scaleX(1);
        }

        /* TRUST SECTION */
        .trust {
          display: grid;
          grid-template-columns: 1.2fr 1fr;
          gap: 28px;
          align-items: start;
        }

        .trust-content {
          position: sticky;
          top: 100px;
        }

        .trust-stats {
          display: flex;
          gap: 24px;
          margin-top: 30px;
          flex-wrap: wrap;
        }

        .trust-stat {
          text-align: center;
        }

        .trust-stat-value {
          display: block;
          font-size: 1.5rem;
          font-weight: 700;
          color: var(--gold);
        }

        .trust-stat-label {
          font-size: 0.8rem;
          color: var(--muted);
        }

        .trust-cards {
          display: grid;
          gap: 16px;
        }

        .trust-card {
          position: relative;
          padding: 28px;
        }

        .trust-card-icon {
          font-size: 2.5rem;
          margin-bottom: 16px;
        }

        .trust-card-badge {
          position: absolute;
          top: 20px;
          right: 20px;
          background: rgba(94, 160, 255, 0.2);
          padding: 4px 8px;
          border-radius: 8px;
          font-size: 0.7rem;
          color: var(--blue);
        }

        /* CTA SECTION */
        .cta {
          padding: 100px 0;
          text-align: center;
          position: relative;
          overflow: hidden;
        }

        .cta-glow {
          position: absolute;
          top: 50%;
          left: 50%;
          transform: translate(-50%, -50%);
          width: 500px;
          height: 500px;
          background: radial-gradient(circle, rgba(243, 198, 106, 0.1), transparent);
          border-radius: 50%;
          pointer-events: none;
        }

        .center {
          max-width: 820px;
          position: relative;
          z-index: 2;
          margin: 0 auto;
        }

        .cta-features {
          display: flex;
          justify-content: center;
          gap: 24px;
          margin-top: 30px;
          color: var(--muted);
        }

        /* FOOTER */
        .footer {
          padding: 60px 0 20px;
          border-top: 1px solid var(--line);
          background: rgba(0, 0, 0, 0.3);
        }

        .footer-grid {
          display: grid;
          grid-template-columns: 2fr 1fr 1fr 1.5fr;
          gap: 40px;
        }

        .footer-brand h3 {
          margin-bottom: 16px;
        }

        .footer-brand p {
          color: var(--muted);
          line-height: 1.6;
          margin-bottom: 20px;
        }

        .footer-social {
          display: flex;
          gap: 16px;
        }

        .footer-social a {
          color: var(--muted);
          text-decoration: none;
          transition: color 0.2s;
        }

        .footer-social a:hover {
          color: var(--gold);
        }

        .footer-social a:focus-visible {
          outline: 2px solid var(--gold);
          outline-offset: 2px;
          border-radius: 4px;
        }

        .footer-links h4 {
          margin-bottom: 16px;
          font-size: 1rem;
        }

        .footer-links a, .footer-links p {
          display: block;
          color: var(--muted);
          text-decoration: none;
          margin-bottom: 10px;
          transition: color 0.2s;
        }

        .footer-links a:hover {
          color: var(--gold);
        }

        .footer-links a:focus-visible {
          outline: 2px solid var(--gold);
          outline-offset: 2px;
          border-radius: 4px;
        }

        .footer-newsletter h4 {
          margin-bottom: 16px;
        }

        .newsletter-form {
          display: flex;
          gap: 10px;
        }

        .newsletter-form input {
          flex: 1;
          padding: 10px 14px;
          border-radius: 10px;
          border: 1px solid var(--line);
          background: var(--card);
          color: white;
        }

        .newsletter-form input:focus-visible {
          outline: 2px solid var(--gold);
          outline-offset: 2px;
        }

        .newsletter-form button {
          padding: 10px 20px;
          border-radius: 10px;
          border: none;
          background: linear-gradient(135deg, var(--gold), #ffd98d);
          color: #111;
          cursor: pointer;
          font-weight: 600;
          transition: transform 0.2s;
        }

        .newsletter-form button:hover {
          transform: scale(1.05);
        }

        .newsletter-form button:focus-visible {
          outline: 2px solid var(--gold);
          outline-offset: 2px;
          transform: scale(1.05);
        }

        .footer-bottom {
          margin-top: 40px;
          padding-top: 20px;
          border-top: 1px solid var(--line);
          text-align: center;
          color: var(--muted);
          font-size: 0.8rem;
        }

        /* Grid Overlay */
        .grid-overlay {
          position: absolute;
          inset: 0;
          background-image:
            linear-gradient(rgba(255, 255, 255, .02) 1px, transparent 1px),
            linear-gradient(90deg, rgba(255, 255, 255, .02) 1px, transparent 1px);
          background-size: 60px 60px;
          mask-image: radial-gradient(circle at center, black 40%, transparent 90%);
          -webkit-mask-image: radial-gradient(circle at center, black 40%, transparent 90%);
          pointer-events: none;
        }

        /* Animations */
        @keyframes fadeInUp {
          from {
            opacity: 0;
            transform: translateY(30px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }

        .fade-in-up {
          animation: fadeInUp 0.8s ease-out;
        }

        .fade-in-section {
          opacity: 0;
          transform: translateY(30px);
          transition: all 0.8s ease-out;
        }

        .fade-in-section.visible {
          opacity: 1;
          transform: translateY(0);
        }

        /* RESPONSIVE */
        @media (max-width: 1024px) {
          .trust {
            grid-template-columns: 1fr;
          }
          
          .trust-content {
            position: relative;
            top: 0;
          }
          
          .footer-grid {
            grid-template-columns: 1fr 1fr;
            gap: 30px;
          }
        }

        @media (max-width: 900px) {
          .tabs {
            grid-template-columns: 1fr 1fr;
          }
          
          .hero-stats {
            grid-template-columns: 1fr 1fr;
          }
          
          .timeline {
            flex-direction: column;
          }
          
          .step {
            min-width: auto;
          }
        }

        @media (max-width: 768px) {
          .section {
            padding: 60px 0;
          }
          
          .footer-grid {
            grid-template-columns: 1fr;
            text-align: center;
          }
          
          .footer-social {
            justify-content: center;
          }
          
          .newsletter-form {
            max-width: 300px;
            margin: 0 auto;
          }
          
          .tabs {
            grid-template-columns: 1fr;
          }
          
          .hero-stats {
            grid-template-columns: 1fr;
          }
          
          .cta-features {
            flex-direction: column;
            gap: 10px;
          }
        }

        /* Print styles */
        @media print {
          .hero-actions,
          .scroll-indicator,
          .cta,
          .footer,
          .grid-overlay {
            display: none;
          }
          
          .glass-card {
            break-inside: avoid;
            page-break-inside: avoid;
          }
          
          body {
            background: white;
            color: black;
          }
          
          .gradient-text {
            -webkit-text-fill-color: black;
            background: none;
          }
        }
      `}</style>
    </>
  );
}