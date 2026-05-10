// frontend/src/pages/legal/PrivacyPage.tsx
import { Link } from "react-router-dom";
import { useEffect } from "react";

export function PrivacyPage() {
  useEffect(() => {
    document.title = "Privacy Policy | Decentralized Justice";
  }, []);

  return (
    <div className="privacy-root">
      {/* Background Elements */}
      <div className="privacy-bg" />
      <div className="privacy-grid" />
      <div className="privacy-orb privacy-orb-a" />
      <div className="privacy-orb privacy-orb-b" />
      <div className="privacy-orb privacy-orb-c" />

      {/* Navigation */}
      <nav className="privacy-nav">
        <Link to="/" className="privacy-logo">
          <span className="privacy-logo-gem">⚖</span>
          Decentralized Justice
        </Link>
        <div className="privacy-nav-right">
          <Link to="/login" className="privacy-nav-solid">Sign In</Link>
          <Link to="/register" className="privacy-nav-outline">Register</Link>
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
            <p className="privacy-card-sub">
              Last updated: January 1, 2024
            </p>
          </div>

          <div className="privacy-content">
            <section className="privacy-section">
              <h2>1. Information We Collect</h2>
              <p>
                <strong>Personal Information:</strong> Name, email address, phone number, 
                physical address, CNIC number, and role in the justice system.<br />
                <strong>Case Information:</strong> FIR details, evidence submissions, 
                investigation records, and court proceedings.<br />
                <strong>Technical Data:</strong> IP address, device information, browser 
                type, and usage logs.
              </p>
            </section>

            <section className="privacy-section">
              <h2>2. How We Use Your Information</h2>
              <p>
                2.1 To process and manage legal cases and FIRs.<br />
                2.2 To verify your identity and role in the justice system.<br />
                2.3 To communicate case updates and notifications.<br />
                2.4 To improve platform security and performance.<br />
                2.5 To comply with legal and regulatory requirements.
              </p>
            </section>

            <section className="privacy-section">
              <h2>3. Blockchain & Data Immutability</h2>
              <p>
                Case records, evidence hashes, and judicial decisions are stored on 
                the blockchain. Once recorded, this data becomes immutable and 
                publicly verifiable. Personal identifiable information is NOT stored 
                directly on the blockchain; only hashed references are used.
              </p>
            </section>

            <section className="privacy-section">
              <h2>4. Data Security</h2>
              <p>
                We implement 256-bit AES encryption for stored data. All communications 
                use TLS 1.3 protocols. Access to sensitive data is restricted based on 
                role-based access control (RBAC). Regular security audits are conducted.
              </p>
            </section>

            <section className="privacy-section">
              <h2>5. Data Sharing</h2>
              <p>
                We share information only with authorized parties in the justice system:
                police, forensic labs, and courts. Your data is never sold to third 
                parties. Law enforcement requests are honored only with valid legal orders.
              </p>
            </section>

            <section className="privacy-section">
              <h2>6. Your Rights</h2>
              <p>
                6.1 Right to access your personal data.<br />
                6.2 Right to correct inaccurate information.<br />
                6.3 Right to request deletion (subject to legal retention).<br />
                6.4 Right to data portability.<br />
                6.5 Right to withdraw consent.<br />
                6.6 Right to file a complaint with data protection authority.
              </p>
            </section>

            <section className="privacy-section">
              <h2>7. Data Retention</h2>
              <p>
                Personal data is retained as long as your account is active. Case 
                records are retained permanently for legal compliance. You may request 
                account deletion, but case records may remain for evidentiary purposes.
              </p>
            </section>

            <section className="privacy-section">
              <h2>8. Cookies & Tracking</h2>
              <p>
                We use essential cookies for authentication and security. No third-party 
                tracking cookies are used. You can disable cookies in your browser, 
                but some features may not function properly.
              </p>
            </section>

            <section className="privacy-section">
              <h2>9. Children's Privacy</h2>
              <p>
                Our platform is not intended for users under 18 years of age. We do not 
                knowingly collect information from minors. If you believe a minor has 
                provided data, please contact us immediately.
              </p>
            </section>

            <section className="privacy-section">
              <h2>10. International Data Transfers</h2>
              <p>
                Data is stored on servers located within Pakistan. By using our platform, 
                you consent to data processing within Pakistan's jurisdiction.
              </p>
            </section>

            <section className="privacy-section">
              <h2>11. Changes to This Policy</h2>
              <p>
                We may update this policy periodically. Significant changes will be 
                notified via email or platform notification. Continued use constitutes 
                acceptance of the updated policy.
              </p>
            </section>

            <section className="privacy-section">
              <h2>12. Contact Us</h2>
              <p>
                For privacy concerns or data requests:<br />
                Email: privacy@justice.gov.pk<br />
                Phone: 1234-567890<br />
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
        @import url('https://fonts.googleapis.com/css2?family=Syne:wght@500;600;700;800&family=Inter:wght@300;400;500;600;700&display=swap');

        .privacy-root {
          --bg: #0a0c12;
          --surface: #111318;
          --border: rgba(243, 198, 106, 0.12);
          --accent: #f3c66a;
          --accent2: #ffd98d;
          --violet: #9b7aff;
          --text: #edf2ff;
          --muted: #8e9cc4;
          --faint: #49587a;
          --fd: 'Syne', sans-serif;
          --fb: 'Inter', sans-serif;
        }

        *, *::before, *::after { margin: 0; padding: 0; box-sizing: border-box; }
        html { scroll-behavior: smooth; }

        .privacy-root {
          font-family: var(--fb);
          background: var(--bg);
          color: var(--text);
          min-height: 100vh;
          overflow-x: hidden;
        }

        .privacy-grad {
          background: linear-gradient(135deg, var(--accent) 0%, var(--accent2) 60%, var(--violet) 100%);
          -webkit-background-clip: text;
          -webkit-text-fill-color: transparent;
          background-clip: text;
        }

        /* Background */
        .privacy-bg {
          position: fixed; inset: 0; z-index: 0;
          background: radial-gradient(ellipse 60% 45% at 50% -5%, rgba(243, 198, 106, 0.13) 0%, transparent 60%);
        }
        .privacy-grid {
          position: fixed; inset: 0; z-index: 0;
          background-image: linear-gradient(rgba(243, 198, 106, 0.03) 1px, transparent 1px),
                          linear-gradient(90deg, rgba(243, 198, 106, 0.03) 1px, transparent 1px);
          background-size: 48px 48px;
          mask-image: radial-gradient(ellipse 80% 70% at 50% 40%, black 20%, transparent 80%);
        }
        .privacy-orb {
          position: fixed; border-radius: 50%; filter: blur(90px); pointer-events: none; z-index: 0;
        }
        .privacy-orb-a { width: 460px; height: 460px; top: -140px; left: 50%; transform: translateX(-50%); background: rgba(243, 198, 106, 0.09); animation: orbA 9s ease-in-out infinite; }
        .privacy-orb-b { width: 280px; height: 280px; bottom: 10%; right: -3%; background: rgba(255, 217, 141, 0.06); animation: orbB 11s 2s ease-in-out infinite; }
        .privacy-orb-c { width: 240px; height: 240px; top: 30%; left: -4%; background: rgba(155, 122, 255, 0.06); animation: orbB 10s 4s ease-in-out infinite; }
        @keyframes orbA { 0%,100%{transform:translateX(-50%) scale(1)} 50%{transform:translateX(-50%) scale(1.06)} }
        @keyframes orbB { 0%,100%{transform:scale(1)} 50%{transform:scale(1.09)} }

        /* Nav */
        .privacy-nav {
          position: fixed; top: 0; left: 0; right: 0; z-index: 100;
          display: flex; align-items: center; justify-content: space-between;
          padding: 0 2.5rem; height: 64px;
          background: rgba(10, 12, 18, 0.7);
          backdrop-filter: blur(24px);
          border-bottom: 1px solid var(--border);
          animation: navDown 0.5s cubic-bezier(.2,.9,.3,1.1) both;
        }
        @keyframes navDown { from{opacity:0;transform:translateY(-16px)} to{opacity:1;transform:none} }
        .privacy-logo { font-family: var(--fd); font-size: 1.15rem; font-weight: 700; letter-spacing: -0.02em; color: var(--text); display: flex; align-items: center; gap: 7px; text-decoration: none; }
        .privacy-logo-gem { color: var(--accent); filter: drop-shadow(0 0 6px rgba(243,198,106,0.55)); }
        .privacy-nav-right { display: flex; align-items: center; gap: 12px; }
        .privacy-nav-solid { font-size: 0.85rem; font-weight: 600; padding: 7px 20px; border-radius: 40px; background: linear-gradient(135deg, var(--accent), var(--accent2)); color: #111; text-decoration: none; transition: all 0.2s; box-shadow: 0 2px 12px rgba(243,198,106,0.3); }
        .privacy-nav-solid:hover { transform: translateY(-1px); box-shadow: 0 6px 20px rgba(243,198,106,0.45); }
        .privacy-nav-outline { font-size: 0.85rem; font-weight: 600; padding: 7px 20px; border-radius: 40px; border: 1px solid var(--border); color: var(--text); text-decoration: none; transition: all 0.2s; }
        .privacy-nav-outline:hover { border-color: var(--accent); color: var(--accent); }

        /* Main */
        .privacy-main {
          position: relative; z-index: 10;
          min-height: 100vh;
          padding: 5.5rem 2rem 3rem;
        }
        .privacy-card {
          position: relative; overflow: hidden;
          max-width: 900px; margin: 0 auto;
          background: rgba(17, 19, 24, 0.85);
          border: 1px solid var(--border);
          border-radius: 28px;
          padding: 2.5rem;
          backdrop-filter: blur(24px);
          box-shadow: 0 24px 60px rgba(0,0,0,0.4);
          animation: cardIn 0.6s cubic-bezier(.2,.9,.3,1.1) both;
        }
        @keyframes cardIn { from{opacity:0;transform:translateY(28px)} to{opacity:1;transform:none} }
        .privacy-card-glow { position: absolute; top: -60px; left: 50%; transform: translateX(-50%); width: 280px; height: 180px; background: radial-gradient(circle, rgba(243,198,106,0.15), transparent); border-radius: 50%; filter: blur(60px); pointer-events: none; }
        .privacy-card-head { margin-bottom: 2rem; text-align: center; }
        .privacy-card-eyebrow { font-size: 0.68rem; font-weight: 600; letter-spacing: 0.14em; text-transform: uppercase; color: var(--accent); margin-bottom: 0.6rem; }
        .privacy-card-title { font-family: var(--fd); font-size: 2rem; font-weight: 800; letter-spacing: -0.02em; margin-bottom: 0.5rem; color: var(--text); }
        .privacy-card-sub { font-size: 0.85rem; color: var(--muted); }

        /* Content */
        .privacy-content { display: flex; flex-direction: column; gap: 1.5rem; margin-bottom: 2rem; }
        .privacy-section { border-left: 2px solid var(--accent); padding-left: 1.2rem; }
        .privacy-section h2 { font-size: 1.2rem; font-weight: 600; margin-bottom: 0.5rem; color: var(--accent); }
        .privacy-section p { font-size: 0.9rem; color: var(--muted); line-height: 1.6; }

        /* Buttons */
        .privacy-footer { display: flex; gap: 1rem; justify-content: center; padding-top: 1rem; border-top: 1px solid var(--border); }
        .privacy-btn-primary { padding: 12px 28px; border-radius: 40px; background: linear-gradient(135deg, var(--accent), var(--accent2)); color: #111; text-decoration: none; font-weight: 600; transition: all 0.2s; }
        .privacy-btn-primary:hover { transform: translateY(-2px); box-shadow: 0 8px 25px rgba(243,198,106,0.4); }
        .privacy-btn-secondary { padding: 12px 28px; border-radius: 40px; border: 1px solid var(--border); color: var(--text); text-decoration: none; font-weight: 600; transition: all 0.2s; }
        .privacy-btn-secondary:hover { border-color: var(--accent); color: var(--accent); }

        @media (max-width: 768px) {
          .privacy-nav { padding: 0 1.25rem; height: 58px; }
          .privacy-main { padding: 5rem 1.25rem 3rem; }
          .privacy-card { padding: 1.5rem; }
          .privacy-card-title { font-size: 1.5rem; }
          .privacy-section h2 { font-size: 1rem; }
        }
        @media (max-width: 480px) {
          .privacy-footer { flex-direction: column; gap: 0.75rem; }
          .privacy-btn-primary, .privacy-btn-secondary { text-align: center; }
        }
      `}</style>
    </div>
  );
}