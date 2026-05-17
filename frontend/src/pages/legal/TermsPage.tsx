// frontend/src/pages/legal/TermsPage.tsx
import React from "react";
import { Link } from "react-router-dom";
import { useEffect } from "react";

export function TermsPage() {
  useEffect(() => {
    document.title = "Terms of Service | Decentralized Justice";
  }, []);

  return (
    <div className="terms-root">
      {/* Background Elements - Indigo Theme */}
      <div className="terms-bg" />
      <div className="terms-grid" />
      <div className="terms-orb terms-orb-a" />
      <div className="terms-orb terms-orb-b" />
      <div className="terms-orb terms-orb-c" />

      {/* Navigation - Matching Homepage */}
      <nav className="terms-nav">
        <Link to="/" className="terms-logo">
          <div className="terms-logo-mark">⚖</div>
          <span className="terms-logo-text">Decentralized Justice</span>
        </Link>
        <div className="terms-nav-right">
          <Link to="/login" className="terms-nav-solid">
            Sign In
          </Link>
          <Link to="/register" className="terms-nav-outline">
            Register
          </Link>
        </div>
      </nav>

      {/* Main Content */}
      <main className="terms-main">
        <div className="terms-card">
          <div className="terms-card-glow" />

          <div className="terms-card-head">
            <div className="terms-card-eyebrow">Legal Agreement</div>
            <h1 className="terms-card-title">
              Terms of <span className="terms-grad">Service</span>
            </h1>
            <p className="terms-card-sub">Last updated: January 1, 2024</p>
          </div>

          <div className="terms-content">
            <section className="terms-section">
              <h2>1. Acceptance of Terms</h2>
              <p>
                By accessing or using the Decentralized Justice System
                ("Platform"), you agree to be bound by these Terms of Service.
                If you disagree with any part of these terms, you may not access
                the Platform.
              </p>
            </section>

            <section className="terms-section">
              <h2>2. Description of Service</h2>
              <p>
                The Decentralized Justice System is a blockchain-powered legal
                platform that facilitates case filing, evidence management,
                investigation tracking, and court proceedings. The Platform
                connects citizens, police, forensic labs, and courts in a
                transparent and secure ecosystem.
              </p>
            </section>

            <section className="terms-section">
              <h2>3. User Accounts</h2>
              <p>
                3.1 You must provide accurate and complete information when
                creating an account.
                <br />
                3.2 You are responsible for maintaining the security of your
                account credentials.
                <br />
                3.3 You are liable for all activities that occur under your
                account.
                <br />
                3.4 Notify us immediately of any unauthorized access to your
                account.
              </p>
            </section>

            <section className="terms-section">
              <h2>4. User Responsibilities</h2>
              <p>
                4.1 You agree to use the Platform only for lawful purposes.
                <br />
                4.2 You will not upload false, misleading, or fraudulent
                information.
                <br />
                4.3 You will not attempt to manipulate or tamper with blockchain
                records.
                <br />
                4.4 You will respect the privacy and rights of other users.
              </p>
            </section>

            <section className="terms-section">
              <h2>5. Data Integrity & Record Keeping</h2>
              <p>
                All case records, evidence hashes, and judicial decisions are
                stored on secure cloud infrastructure with cryptographic
                verification. Once recorded, data cannot be altered or deleted.
                This ensures transparency and tamper-evident record-keeping.
              </p>
            </section>

            <section className="terms-section">
              <h2>6. Privacy & Data Protection</h2>
              <p>
                Your personal data is protected under applicable data protection
                laws. We implement industry-standard security measures including
                256-bit encryption. For details, please refer to our Privacy
                Policy.
              </p>
            </section>

            <section className="terms-section">
              <h2>7. Prohibited Activities</h2>
              <p>
                7.1 Attempting to hack or bypass security measures.
                <br />
                7.2 Uploading malware or malicious code.
                <br />
                7.3 Harassing or threatening other users.
                <br />
                7.4 Using automated scripts to access the Platform.
                <br />
                7.5 Impersonating law enforcement or court officials.
              </p>
            </section>

            <section className="terms-section">
              <h2>8. Termination</h2>
              <p>
                We reserve the right to suspend or terminate accounts that
                violate these terms, engage in fraudulent activities, or misuse
                the Platform. Legal authorities will be notified of any illegal
                activities.
              </p>
            </section>

            <section className="terms-section">
              <h2>9. Limitation of Liability</h2>
              <p>
                The Platform is provided "as is" without warranties. We are not
                liable for indirect damages, data loss, or service
                interruptions. In no event shall our liability exceed the fees
                paid by you (if any).
              </p>
            </section>

            <section className="terms-section">
              <h2>10. Governing Law</h2>
              <p>
                These terms shall be governed by the laws of Pakistan. Any
                disputes arising from these terms shall be resolved in the
                courts of Islamabad.
              </p>
            </section>

            <section className="terms-section">
              <h2>11. Changes to Terms</h2>
              <p>
                We may update these terms from time to time. Continued use of
                the Platform after changes constitutes acceptance of the new
                terms.
              </p>
            </section>

            <section className="terms-section">
              <h2>12. Contact Information</h2>
              <p>
                For questions about these terms, contact us at:
                <br />
                Email: legal@justice.gov.pk
                <br />
                Phone: 1234-567890
              </p>
            </section>
          </div>

          <div className="terms-footer">
            <Link to="/register" className="terms-btn-primary">
              I Agree to Terms
            </Link>
            <Link to="/" className="terms-btn-secondary">
              Return to Home
            </Link>
          </div>
        </div>
      </main>

      <style>{`
        /* Indigo Theme Styles */
        @import url('https://fonts.googleapis.com/css2?family=Syne:wght@500;600;700;800&family=Inter:wght@300;400;500;600;700&family=DM+Mono:wght@400;500&display=swap');

        .terms-root {
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

        .terms-root {
          font-family: var(--fb);
          background: var(--bg-deep);
          color: var(--text);
          min-height: 100vh;
          overflow-x: hidden;
        }

        .terms-grad {
          background: linear-gradient(135deg, var(--indigo) 0%, var(--indigo-l) 60%, var(--indigo-light) 100%);
          -webkit-background-clip: text;
          -webkit-text-fill-color: transparent;
          background-clip: text;
        }

        /* Background */
        .terms-bg {
          position: fixed; inset: 0; z-index: 0;
          background: radial-gradient(ellipse 60% 45% at 50% -5%, rgba(99, 102, 241, 0.08) 0%, transparent 60%);
        }
        .terms-grid {
          position: fixed; inset: 0; z-index: 0;
          background-image: linear-gradient(rgba(99, 102, 241, 0.03) 1px, transparent 1px),
                          linear-gradient(90deg, rgba(99, 102, 241, 0.03) 1px, transparent 1px);
          background-size: 48px 48px;
          mask-image: radial-gradient(ellipse 80% 70% at 50% 40%, black 20%, transparent 80%);
        }
        .terms-orb {
          position: fixed; border-radius: 50%; filter: blur(90px); pointer-events: none; z-index: 0;
        }
        .terms-orb-a { width: 460px; height: 460px; top: -140px; left: 50%; transform: translateX(-50%); background: rgba(99, 102, 241, 0.09); animation: orbA 9s ease-in-out infinite; }
        .terms-orb-b { width: 280px; height: 280px; bottom: 10%; right: -3%; background: rgba(129, 140, 248, 0.06); animation: orbB 11s 2s ease-in-out infinite; }
        .terms-orb-c { width: 240px; height: 240px; top: 30%; left: -4%; background: rgba(99, 102, 241, 0.06); animation: orbB 10s 4s ease-in-out infinite; }
        @keyframes orbA { 0%,100%{transform:translateX(-50%) scale(1)} 50%{transform:translateX(-50%) scale(1.06)} }
        @keyframes orbB { 0%,100%{transform:scale(1)} 50%{transform:scale(1.09)} }

        /* Nav */
        .terms-nav {
          position: fixed; top: 0; left: 0; right: 0; z-index: 100;
          display: flex; align-items: center; justify-content: space-between;
          padding: 0 2.5rem; height: 72px;
          background: rgba(7, 9, 14, 0.85);
          backdrop-filter: blur(16px);
          border-bottom: 1px solid var(--border-light);
          animation: navDown 0.5s cubic-bezier(.2,.9,.3,1.1) both;
        }
        @keyframes navDown { from{opacity:0;transform:translateY(-16px)} to{opacity:1;transform:none} }
        
        .terms-logo {
          display: flex; align-items: center; gap: 10px;
          text-decoration: none; transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
        }
        .terms-logo:hover { transform: translateY(-1px); }
        .terms-logo-mark {
          width: 32px; height: 32px;
          background: linear-gradient(135deg, #6366f1, #4f46e5);
          display: flex; align-items: center; justify-content: center;
          font-size: 1.1rem; border-radius: 6px;
          transition: all 0.3s ease;
        }
        .terms-logo:hover .terms-logo-mark {
          box-shadow: 0 0 12px rgba(99, 102, 241, 0.4);
          transform: scale(1.02);
        }
        .terms-logo-text {
          font-family: var(--fd);
          background: linear-gradient(135deg, #e8ecf8, #818cf8);
          -webkit-background-clip: text;
          -webkit-text-fill-color: transparent;
          background-clip: text;
          font-weight: 800; font-size: 1.1rem; letter-spacing: -0.3px;
        }
        
        .terms-nav-right { display: flex; align-items: center; gap: 12px; }
        .terms-nav-solid {
          font-size: 0.82rem; font-weight: 600; padding: 8px 20px; border-radius: 6px;
          background: linear-gradient(135deg, #6366f1, #4f46e5); color: #ffffff;
          text-decoration: none; transition: all 0.3s;
          border: 1px solid rgba(99, 102, 241, 0.3);
        }
        .terms-nav-solid:hover { transform: translateY(-2px); box-shadow: 0 4px 12px rgba(99, 102, 241, 0.3); }
        .terms-nav-outline {
          font-size: 0.82rem; font-weight: 600; padding: 8px 20px; border-radius: 6px;
          border: 1px solid var(--border-light); color: #7a849c;
          text-decoration: none; transition: all 0.3s;
        }
        .terms-nav-outline:hover { border-color: var(--indigo); color: var(--indigo-l); }

        /* Main */
        .terms-main {
          position: relative; z-index: 10;
          min-height: 100vh;
          padding: 100px 2rem 3rem;
        }
        .terms-card {
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
        .terms-card-glow {
          position: absolute; top: -60px; left: 50%; transform: translateX(-50%);
          width: 280px; height: 180px;
          background: radial-gradient(circle, rgba(99, 102, 241, 0.15), transparent);
          border-radius: 50%; filter: blur(60px); pointer-events: none;
        }
        .terms-card-head { margin-bottom: 2rem; text-align: center; }
        .terms-card-eyebrow {
          font-size: 0.68rem; font-weight: 600; letter-spacing: 1.5px;
          text-transform: uppercase; color: var(--indigo-l);
          margin-bottom: 0.6rem; font-family: var(--mono);
        }
        .terms-card-title {
          font-family: var(--fd); font-size: 2rem; font-weight: 800;
          letter-spacing: -0.02em; margin-bottom: 0.5rem; color: var(--text);
        }
        .terms-card-sub { font-size: 0.85rem; color: var(--text-secondary); }

        /* Content */
        .terms-content { display: flex; flex-direction: column; gap: 1.5rem; margin-bottom: 2rem; }
        .terms-section {
          border-left: 2px solid var(--indigo);
          padding-left: 1.2rem;
          transition: all 0.3s ease;
        }
        .terms-section:hover {
          border-left-color: var(--indigo-l);
          transform: translateX(3px);
        }
        .terms-section h2 {
          font-size: 1.2rem; font-weight: 600; margin-bottom: 0.5rem;
          color: var(--indigo-l);
        }
        .terms-section p {
          font-size: 0.88rem; color: var(--text-secondary);
          line-height: 1.7;
        }
        .terms-section strong {
          color: var(--indigo-light);
          font-weight: 600;
        }

        /* Buttons */
        .terms-footer {
          display: flex; gap: 1rem; justify-content: center;
          padding-top: 1rem; border-top: 1px solid var(--border-light);
        }
        .terms-btn-primary {
          padding: 12px 28px; border-radius: 6px;
          background: linear-gradient(135deg, #6366f1, #4f46e5);
          color: #ffffff; text-decoration: none; font-weight: 600;
          transition: all 0.3s; font-size: 0.88rem;
        }
        .terms-btn-primary:hover {
          transform: translateY(-2px);
          box-shadow: 0 8px 25px rgba(99, 102, 241, 0.4);
        }
        .terms-btn-secondary {
          padding: 12px 28px; border-radius: 6px;
          border: 1px solid var(--border-light); color: #7a849c;
          text-decoration: none; font-weight: 600; transition: all 0.3s;
          background: transparent; font-size: 0.88rem;
        }
        .terms-btn-secondary:hover {
          border-color: var(--indigo); color: var(--indigo-l);
          transform: translateY(-2px);
        }

        @media (max-width: 768px) {
          .terms-nav { padding: 0 1.25rem; height: 64px; }
          .terms-main { padding: 90px 1.25rem 3rem; }
          .terms-card { padding: 1.5rem; border-radius: 10px; }
          .terms-card-title { font-size: 1.5rem; }
          .terms-section h2 { font-size: 1rem; }
        }
        @media (max-width: 480px) {
          .terms-footer { flex-direction: column; gap: 0.75rem; }
          .terms-btn-primary, .terms-btn-secondary { text-align: center; }
          .terms-nav-right { gap: 8px; }
          .terms-nav-solid, .terms-nav-outline { padding: 6px 14px; font-size: 0.75rem; }
        }
      `}</style>
    </div>
  );
}
