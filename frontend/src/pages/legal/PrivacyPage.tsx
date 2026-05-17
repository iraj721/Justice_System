// frontend/src/pages/legal/PrivacyPage.tsx
import React from "react";
import { Link } from "react-router-dom";
import { useEffect } from "react";

export function PrivacyPage() {
  useEffect(() => {
    document.title = "Privacy Policy | Decentralized Justice";
  }, []);

  return (
    <div className="privacy-root">
      {/* Background Elements - Indigo Theme */}
      <div className="privacy-bg" />
      <div className="privacy-grid" />
      <div className="privacy-orb privacy-orb-a" />
      <div className="privacy-orb privacy-orb-b" />
      <div className="privacy-orb privacy-orb-c" />

      {/* Navigation - Matching Homepage */}
      <nav className="privacy-nav">
        <Link to="/" className="privacy-logo">
          <div className="privacy-logo-mark">⚖</div>
          <span className="privacy-logo-text">Decentralized Justice</span>
        </Link>
        <div className="privacy-nav-right">
          <Link to="/login" className="privacy-nav-solid">
            Sign In
          </Link>
          <Link to="/register" className="privacy-nav-outline">
            Register
          </Link>
        </div>
      </nav>

      {/* Main Content */}
      <main className="privacy-main">
        <div className="privacy-card">
          <div className="privacy-card-glow" />

          <div className="privacy-card-head">
            <div className="privacy-card-eyebrow">Data Protection</div>
            <h1 className="privacy-card-title">
              Privacy <span className="privacy-grad">Policy</span>
            </h1>
            <p className="privacy-card-sub">Last updated: January 1, 2024</p>
          </div>

          <div className="privacy-content">
            <section className="privacy-section">
              <h2>1. Information We Collect</h2>
              <p>
                <strong>Personal Information:</strong> Name, email address,
                phone number, physical address, CNIC number, and role in the
                justice system.
                <br />
                <strong>Case Information:</strong> FIR details, evidence
                submissions, investigation records, and court proceedings.
                <br />
                <strong>Technical Data:</strong> IP address, device information,
                browser type, and usage logs.
              </p>
            </section>

            <section className="privacy-section">
              <h2>2. How We Use Your Information</h2>
              <p>
                2.1 To process and manage legal cases and FIRs.
                <br />
                2.2 To verify your identity and role in the justice system.
                <br />
                2.3 To communicate case updates and notifications.
                <br />
                2.4 To improve platform security and performance.
                <br />
                2.5 To comply with legal and regulatory requirements.
              </p>
            </section>

            <section className="privacy-section">
              <h2>3. Data Integrity & Security</h2>
              <p>
                Case records, evidence hashes, and judicial decisions are stored
                on secure cloud infrastructure with cryptographic verification.
                Once recorded, this data becomes tamper-evident and publicly
                verifiable through hash matching. Personal identifiable
                information is encrypted and access-controlled.
              </p>
            </section>

            <section className="privacy-section">
              <h2>4. Data Security</h2>
              <p>
                We implement 256-bit AES encryption for stored data. All
                communications use TLS 1.3 protocols. Access to sensitive data
                is restricted based on role-based access control (RBAC). Regular
                security audits are conducted.
              </p>
            </section>

            <section className="privacy-section">
              <h2>5. Data Sharing</h2>
              <p>
                We share information only with authorized parties in the justice
                system: police, forensic labs, and courts. Your data is never
                sold to third parties. Law enforcement requests are honored only
                with valid legal orders.
              </p>
            </section>

            <section className="privacy-section">
              <h2>6. Your Rights</h2>
              <p>
                6.1 Right to access your personal data.
                <br />
                6.2 Right to correct inaccurate information.
                <br />
                6.3 Right to request deletion (subject to legal retention).
                <br />
                6.4 Right to data portability.
                <br />
                6.5 Right to withdraw consent.
                <br />
                6.6 Right to file a complaint with data protection authority.
              </p>
            </section>

            <section className="privacy-section">
              <h2>7. Data Retention</h2>
              <p>
                Personal data is retained as long as your account is active.
                Case records are retained permanently for legal compliance. You
                may request account deletion, but case records may remain for
                evidentiary purposes.
              </p>
            </section>

            <section className="privacy-section">
              <h2>8. Cookies & Tracking</h2>
              <p>
                We use essential cookies for authentication and security. No
                third-party tracking cookies are used. You can disable cookies
                in your browser, but some features may not function properly.
              </p>
            </section>

            <section className="privacy-section">
              <h2>9. Children's Privacy</h2>
              <p>
                Our platform is not intended for users under 18 years of age. We
                do not knowingly collect information from minors. If you believe
                a minor has provided data, please contact us immediately.
              </p>
            </section>

            <section className="privacy-section">
              <h2>10. International Data Transfers</h2>
              <p>
                Data is stored on servers located within Pakistan. By using our
                platform, you consent to data processing within Pakistan's
                jurisdiction.
              </p>
            </section>

            <section className="privacy-section">
              <h2>11. Changes to This Policy</h2>
              <p>
                We may update this policy periodically. Significant changes will
                be notified via email or platform notification. Continued use
                constitutes acceptance of the updated policy.
              </p>
            </section>

            <section className="privacy-section">
              <h2>12. Contact Us</h2>
              <p>
                For privacy concerns or data requests:
                <br />
                Email: privacy@justice.gov.pk
                <br />
                Phone: 1234-567890
                <br />
                Address: Justice Complex, Islamabad, Pakistan
              </p>
            </section>
          </div>

          <div className="privacy-footer">
            <Link to="/register" className="privacy-btn-primary">
              I Accept Privacy Policy
            </Link>
            <Link to="/" className="privacy-btn-secondary">
              Return to Home
            </Link>
          </div>
        </div>
      </main>

      <style>{`
        /* Indigo Theme Styles */
        @import url('https://fonts.googleapis.com/css2?family=Syne:wght@500;600;700;800&family=Inter:wght@300;400;500;600;700&family=DM+Mono:wght@400;500&display=swap');

        .privacy-root {
          --bg-deep: #06080f;
          --bg-base: #0b0e1a;
          --bg-card: rgba(12, 15, 26, 0.85);
          --border: rgba(99, 102, 241, 0.12);
          --border-light: rgba(255, 255, 255, 0.07);
          --indigo: #6366f1;
          --indigo-d: #4f46e5;
          --indigo-l: #818cf8;
          --indigo-light: #a5b4fc;
          --text: #e8ecf8;
          --text-secondary: #7a849c;
          --text-muted: #3d4459;
          --fd: 'Syne', sans-serif;
          --fb: 'Inter', sans-serif;
          --mono: 'DM Mono', monospace;
        }

        *, *::before, *::after { margin: 0; padding: 0; box-sizing: border-box; }
        html { scroll-behavior: smooth; scroll-padding-top: 72px; }

        .privacy-root {
          font-family: var(--fb);
          background: var(--bg-deep);
          color: var(--text);
          min-height: 100vh;
          overflow-x: hidden;
        }

        .privacy-grad {
          background: linear-gradient(135deg, var(--indigo) 0%, var(--indigo-l) 60%, var(--indigo-light) 100%);
          -webkit-background-clip: text;
          -webkit-text-fill-color: transparent;
          background-clip: text;
        }

        /* Background */
        .privacy-bg {
          position: fixed; inset: 0; z-index: 0;
          background: radial-gradient(ellipse 60% 45% at 50% -5%, rgba(99, 102, 241, 0.08) 0%, transparent 60%);
        }
        .privacy-grid {
          position: fixed; inset: 0; z-index: 0;
          background-image: linear-gradient(rgba(99, 102, 241, 0.03) 1px, transparent 1px),
                          linear-gradient(90deg, rgba(99, 102, 241, 0.03) 1px, transparent 1px);
          background-size: 48px 48px;
          mask-image: radial-gradient(ellipse 80% 70% at 50% 40%, black 20%, transparent 80%);
        }
        .privacy-orb {
          position: fixed; border-radius: 50%; filter: blur(90px); pointer-events: none; z-index: 0;
        }
        .privacy-orb-a { width: 460px; height: 460px; top: -140px; left: 50%; transform: translateX(-50%); background: rgba(99, 102, 241, 0.09); animation: orbA 9s ease-in-out infinite; }
        .privacy-orb-b { width: 280px; height: 280px; bottom: 10%; right: -3%; background: rgba(129, 140, 248, 0.06); animation: orbB 11s 2s ease-in-out infinite; }
        .privacy-orb-c { width: 240px; height: 240px; top: 30%; left: -4%; background: rgba(99, 102, 241, 0.06); animation: orbB 10s 4s ease-in-out infinite; }
        @keyframes orbA { 0%,100%{transform:translateX(-50%) scale(1)} 50%{transform:translateX(-50%) scale(1.06)} }
        @keyframes orbB { 0%,100%{transform:scale(1)} 50%{transform:scale(1.09)} }

        /* Nav */
        .privacy-nav {
          position: fixed; top: 0; left: 0; right: 0; z-index: 100;
          display: flex; align-items: center; justify-content: space-between;
          padding: 0 2.5rem; height: 72px;
          background: rgba(7, 9, 14, 0.85);
          backdrop-filter: blur(16px);
          border-bottom: 1px solid var(--border-light);
          animation: navDown 0.5s cubic-bezier(.2,.9,.3,1.1) both;
        }
        @keyframes navDown { from{opacity:0;transform:translateY(-16px)} to{opacity:1;transform:none} }
        
        .privacy-logo {
          display: flex; align-items: center; gap: 10px;
          text-decoration: none; transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
        }
        .privacy-logo:hover { transform: translateY(-1px); }
        .privacy-logo-mark {
          width: 32px; height: 32px;
          background: linear-gradient(135deg, #6366f1, #4f46e5);
          display: flex; align-items: center; justify-content: center;
          font-size: 1.1rem; border-radius: 6px;
          transition: all 0.3s ease;
        }
        .privacy-logo:hover .privacy-logo-mark {
          box-shadow: 0 0 12px rgba(99, 102, 241, 0.4);
          transform: scale(1.02);
        }
        .privacy-logo-text {
          font-family: var(--fd);
          background: linear-gradient(135deg, #e8ecf8, #818cf8);
          -webkit-background-clip: text;
          -webkit-text-fill-color: transparent;
          background-clip: text;
          font-weight: 800; font-size: 1.1rem; letter-spacing: -0.3px;
        }
        
        .privacy-nav-right { display: flex; align-items: center; gap: 12px; }
        .privacy-nav-solid {
          font-size: 0.82rem; font-weight: 600; padding: 8px 20px; border-radius: 6px;
          background: linear-gradient(135deg, #6366f1, #4f46e5); color: #ffffff;
          text-decoration: none; transition: all 0.3s;
          border: 1px solid rgba(99, 102, 241, 0.3);
        }
        .privacy-nav-solid:hover { transform: translateY(-2px); box-shadow: 0 4px 12px rgba(99, 102, 241, 0.3); }
        .privacy-nav-outline {
          font-size: 0.82rem; font-weight: 600; padding: 8px 20px; border-radius: 6px;
          border: 1px solid var(--border-light); color: #7a849c;
          text-decoration: none; transition: all 0.3s;
        }
        .privacy-nav-outline:hover { border-color: var(--indigo); color: var(--indigo-l); }

        /* Main */
        .privacy-main {
          position: relative; z-index: 10;
          min-height: 100vh;
          padding: 100px 2rem 3rem;
        }
        .privacy-card {
          position: relative; overflow: hidden;
          max-width: 900px; margin: 0 auto;
          background: var(--bg-card);
          border: 1px solid var(--border-light);
          border-radius: 10px;
          padding: 2.5rem;
          backdrop-filter: blur(20px);
          box-shadow: 0 24px 60px rgba(0,0,0,0.4);
          animation: cardIn 0.6s cubic-bezier(.2,.9,.3,1.1) both;
        }
        @keyframes cardIn { from{opacity:0;transform:translateY(28px)} to{opacity:1;transform:none} }
        .privacy-card-glow {
          position: absolute; top: -60px; left: 50%; transform: translateX(-50%);
          width: 280px; height: 180px;
          background: radial-gradient(circle, rgba(99, 102, 241, 0.15), transparent);
          border-radius: 50%; filter: blur(60px); pointer-events: none;
        }
        .privacy-card-head { margin-bottom: 2rem; text-align: center; }
        .privacy-card-eyebrow {
          font-size: 0.68rem; font-weight: 600; letter-spacing: 1.5px;
          text-transform: uppercase; color: var(--indigo-l);
          margin-bottom: 0.6rem; font-family: var(--mono);
        }
        .privacy-card-title {
          font-family: var(--fd); font-size: 2rem; font-weight: 800;
          letter-spacing: -0.02em; margin-bottom: 0.5rem; color: var(--text);
        }
        .privacy-card-sub { font-size: 0.85rem; color: var(--text-secondary); }

        /* Content */
        .privacy-content { display: flex; flex-direction: column; gap: 1.5rem; margin-bottom: 2rem; }
        .privacy-section {
          border-left: 2px solid var(--indigo);
          padding-left: 1.2rem;
          transition: all 0.3s ease;
        }
        .privacy-section:hover {
          border-left-color: var(--indigo-l);
          transform: translateX(3px);
        }
        .privacy-section h2 {
          font-size: 1.2rem; font-weight: 600; margin-bottom: 0.5rem;
          color: var(--indigo-l);
        }
        .privacy-section p {
          font-size: 0.88rem; color: var(--text-secondary);
          line-height: 1.7;
        }
        .privacy-section strong {
          color: var(--indigo-light);
          font-weight: 600;
        }

        /* Buttons */
        .privacy-footer {
          display: flex; gap: 1rem; justify-content: center;
          padding-top: 1rem; border-top: 1px solid var(--border-light);
        }
        .privacy-btn-primary {
          padding: 12px 28px; border-radius: 6px;
          background: linear-gradient(135deg, #6366f1, #4f46e5);
          color: #ffffff; text-decoration: none; font-weight: 600;
          transition: all 0.3s; font-size: 0.88rem;
        }
        .privacy-btn-primary:hover {
          transform: translateY(-2px);
          box-shadow: 0 8px 25px rgba(99, 102, 241, 0.4);
        }
        .privacy-btn-secondary {
          padding: 12px 28px; border-radius: 6px;
          border: 1px solid var(--border-light); color: #7a849c;
          text-decoration: none; font-weight: 600; transition: all 0.3s;
          background: transparent; font-size: 0.88rem;
        }
        .privacy-btn-secondary:hover {
          border-color: var(--indigo); color: var(--indigo-l);
          transform: translateY(-2px);
        }

        @media (max-width: 768px) {
          .privacy-nav { padding: 0 1.25rem; height: 64px; }
          .privacy-main { padding: 90px 1.25rem 3rem; }
          .privacy-card { padding: 1.5rem; border-radius: 10px; }
          .privacy-card-title { font-size: 1.5rem; }
          .privacy-section h2 { font-size: 1rem; }
        }
        @media (max-width: 480px) {
          .privacy-footer { flex-direction: column; gap: 0.75rem; }
          .privacy-btn-primary, .privacy-btn-secondary { text-align: center; }
          .privacy-nav-right { gap: 8px; }
          .privacy-nav-solid, .privacy-nav-outline { padding: 6px 14px; font-size: 0.75rem; }
        }
      `}</style>
    </div>
  );
}
