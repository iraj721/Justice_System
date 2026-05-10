// frontend/src/pages/auth/ForgotPasswordPage.tsx
import React from "react";
import { Link } from "react-router-dom";
import { useState, useEffect, useRef } from "react";

export function ForgotPasswordPage() {
  const [email, setEmail] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [toast, setToast] = useState<{ message: string; type: string } | null>(null);
  const [emailSent, setEmailSent] = useState(false);
  const [focused, setFocused] = useState("");
  const toastTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const showToast = (message: string, type: string = "error") => {
    setToast({ message, type });
    if (toastTimer.current) clearTimeout(toastTimer.current);
    toastTimer.current = setTimeout(() => setToast(null), 5000);
  };

  useEffect(() => {
    document.title = "Forgot Password | Decentralized Justice";
    return () => {
      if (toastTimer.current) clearTimeout(toastTimer.current);
    };
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!email) {
      showToast("Please enter your email address.", "error");
      return;
    }

    setIsLoading(true);
    try {
      // API call for password reset
      // await api.post("/auth/forgot-password", { email });
      
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 1500));
      
      setEmailSent(true);
      showToast("Password reset link sent to your email!", "success");
    } catch (err) {
      showToast("Failed to send reset link. Please try again.", "error");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="forgot-page">
      {/* Animated Background - Indigo Theme */}
      <div className="forgot-bg" />
      <div className="forgot-grid" />
      <div className="forgot-aura forgot-aura-1" />
      <div className="forgot-aura forgot-aura-2" />
      <div className="forgot-aura forgot-aura-3" />

      {/* Navigation - Matching Homepage */}
      <nav className="forgot-nav">
        <Link to="/" className="forgot-logo">
          <div className="forgot-logo-mark">⚖</div>
          <span className="forgot-logo-text">Decentralized Justice</span>
        </Link>
        <div className="forgot-nav-links">
          <Link to="/" className="forgot-nav-link">Home</Link>
          <Link to="/login" className="forgot-nav-link">Login</Link>
          <Link to="/register" className="forgot-nav-link">Register</Link>
          <Link to="/dashboard" className="forgot-nav-link">Dashboard</Link>
          <Link to="/explorer" className="forgot-nav-link">Explorer</Link>
        </div>
        <div className="forgot-nav-actions">
          <Link to="/login" className="forgot-nav-btn">Sign In</Link>
        </div>
      </nav>

      {/* Toast Notification */}
      {toast && (
        <div className={`forgot-toast forgot-toast-${toast.type}`}>
          <span className="forgot-toast-icon">
            {toast.type === "success" ? "✓" : toast.type === "warning" ? "⚠" : "✕"}
          </span>
          <span>{toast.message}</span>
        </div>
      )}

      {/* Main Content - Two Column Layout */}
      <main className="forgot-main">
        {/* Left Column - Reset Form */}
        <div className="forgot-left">
          <div className="forgot-card">
            <div className="forgot-card-inner">
              <div className="forgot-badge">Need Help?</div>
              <h1 className="forgot-title">
                Forgot<br />
                <span className="forgot-title-highlight">Password?</span>
              </h1>
              <p className="forgot-subtitle">
                Enter your email address and we'll send you a link to reset your password.
              </p>

              {!emailSent ? (
                <form className="forgot-form" onSubmit={handleSubmit}>
                  <div className={`forgot-field ${focused === "email" ? "focused" : ""}`}>
                    <label className="forgot-label">Email address</label>
                    <div className="forgot-input-group">
                      <svg className="forgot-input-icon" width="18" height="18" viewBox="0 0 24 24" fill="none">
                        <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z" stroke="currentColor" strokeWidth="1.5"/>
                        <path d="M22 6l-10 7L2 6" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
                      </svg>
                      <input
                        type="email"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        onFocus={() => setFocused("email")}
                        onBlur={() => setFocused("")}
                        placeholder="you@example.com"
                        disabled={isLoading}
                      />
                    </div>
                  </div>

                  <button type="submit" className="forgot-submit" disabled={isLoading}>
                    {isLoading ? (
                      <>
                        <span className="forgot-spinner" />
                        Sending...
                      </>
                    ) : (
                      <>
                        Send Reset Link
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                          <path d="M5 12h14M12 5l7 7-7 7" strokeLinecap="round" strokeLinejoin="round"/>
                        </svg>
                      </>
                    )}
                  </button>
                </form>
              ) : (
                <div className="forgot-success">
                  <div className="forgot-success-icon">📧</div>
                  <h3>Check your email</h3>
                  <p>
                    We've sent a password reset link to <strong>{email}</strong>.
                    The link will expire in 1 hour.
                  </p>
                  <button onClick={() => setEmailSent(false)} className="forgot-resend">
                    Didn't receive email? Click to try again
                  </button>
                </div>
              )}

              <div className="forgot-footer">
                <p>
                  Remember your password?{" "}
                  <Link to="/login" className="forgot-footer-link">Back to Sign In</Link>
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Right Column - Security Tips Panel */}
        <div className="forgot-right">
          <div className="forgot-feature">
            <div className="forgot-feature-badge">SECURITY TIPS</div>
            <h2 className="forgot-feature-title">
              Keep your<br />
              <span className="forgot-feature-highlight">Account Safe</span>
            </h2>

            <div className="forgot-tips">
              <div className="forgot-tip">
                <div className="forgot-tip-icon">🔒</div>
                <div className="forgot-tip-content">
                  <h4>Use Strong Passwords</h4>
                  <p>Combine uppercase, lowercase, numbers, and special characters for maximum security.</p>
                </div>
              </div>
              <div className="forgot-tip">
                <div className="forgot-tip-icon">🔄</div>
                <div className="forgot-tip-content">
                  <h4>Regular Updates</h4>
                  <p>Change your password every 3 months to maintain account security.</p>
                </div>
              </div>
              <div className="forgot-tip">
                <div className="forgot-tip-icon">🔐</div>
                <div className="forgot-tip-content">
                  <h4>Enable 2FA</h4>
                  <p>Add an extra layer of security with two-factor authentication.</p>
                </div>
              </div>
              <div className="forgot-tip">
                <div className="forgot-tip-icon">🛡️</div>
                <div className="forgot-tip-content">
                  <h4>Blockchain Security</h4>
                  <p>All credentials are hashed and stored on immutable blockchain records.</p>
                </div>
              </div>
            </div>

            <div className="forgot-feature-quote">
              <svg width="28" height="28" viewBox="0 0 24 24" fill="none">
                <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
                <path d="M12 8v4M12 16h.01" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
              </svg>
              <p>"Your account security is our top priority. We use bank-grade encryption and blockchain verification to protect your data."</p>
              <div className="forgot-feature-author">
                <strong>— Security Team</strong>
                <span>Decentralized Justice</span>
              </div>
            </div>
          </div>
        </div>
      </main>

      <style>{`
        /* Reset & Base - Indigo Theme */
        .forgot-page {
          --bg-deep: #06080f;
          --bg-base: #0b0e1a;
          --bg-card: rgba(12, 15, 26, 0.85);
          --border: rgba(99, 102, 241, 0.12);
          --indigo: #6366f1;
          --indigo-d: #4f46e5;
          --indigo-l: #818cf8;
          --indigo-light: #a5b4fc;
          --text: #e8ecf8;
          --text-secondary: #7a849c;
          --text-muted: #3d4459;
          
          font-family: 'Inter', system-ui, -apple-system, sans-serif;
          background: var(--bg-deep);
          color: var(--text);
          min-height: 100vh;
          position: relative;
          overflow-x: hidden;
        }

        /* Background Elements - Indigo Glows */
        .forgot-bg {
          position: fixed;
          inset: 0;
          background: radial-gradient(ellipse 70% 50% at 50% -20%, rgba(99, 102, 241, 0.08), transparent 60%);
          pointer-events: none;
          z-index: 0;
        }

        .forgot-grid {
          position: fixed;
          inset: 0;
          background-image: linear-gradient(rgba(99, 102, 241, 0.03) 1px, transparent 1px),
                          linear-gradient(90deg, rgba(99, 102, 241, 0.03) 1px, transparent 1px);
          background-size: 48px 48px;
          mask-image: radial-gradient(ellipse 80% 60% at 50% 40%, black 30%, transparent 80%);
          pointer-events: none;
          z-index: 0;
        }

        .forgot-aura {
          position: fixed;
          border-radius: 50%;
          filter: blur(80px);
          pointer-events: none;
          z-index: 0;
        }

        .forgot-aura-1 {
          width: 500px;
          height: 500px;
          top: -150px;
          left: 50%;
          transform: translateX(-50%);
          background: radial-gradient(circle, rgba(99, 102, 241, 0.15), transparent);
          animation: floatA 12s ease-in-out infinite;
        }

        .forgot-aura-2 {
          width: 350px;
          height: 350px;
          bottom: 10%;
          right: -5%;
          background: radial-gradient(circle, rgba(99, 102, 241, 0.1), transparent);
          animation: floatB 15s ease-in-out infinite reverse;
        }

        .forgot-aura-3 {
          width: 300px;
          height: 300px;
          top: 40%;
          left: -8%;
          background: radial-gradient(circle, rgba(129, 140, 248, 0.08), transparent);
          animation: floatC 18s ease-in-out infinite;
        }

        @keyframes floatA {
          0%, 100% { transform: translateX(-50%) scale(1); opacity: 0.5; }
          50% { transform: translateX(-50%) scale(1.05); opacity: 0.8; }
        }
        @keyframes floatB {
          0%, 100% { transform: scale(1); opacity: 0.4; }
          50% { transform: scale(1.08); opacity: 0.7; }
        }
        @keyframes floatC {
          0%, 100% { transform: translate(0, 0) scale(1); opacity: 0.3; }
          50% { transform: translate(20px, -20px) scale(1.05); opacity: 0.6; }
        }

        /* Navigation - Matching Homepage */
        .forgot-nav {
          position: fixed;
          top: 0;
          left: 0;
          right: 0;
          z-index: 100;
          display: flex;
          align-items: center;
          justify-content: space-between;
          padding: 0 3rem;
          height: 72px;
          background: rgba(7, 9, 14, 0.85);
          backdrop-filter: blur(16px);
          border-bottom: 1px solid rgba(255, 255, 255, 0.06);
          animation: navSlide 0.5s ease-out;
        }

        @keyframes navSlide {
          from { opacity: 0; transform: translateY(-20px); }
          to { opacity: 1; transform: translateY(0); }
        }

        .forgot-logo {
          display: flex;
          align-items: center;
          gap: 10px;
          text-decoration: none;
          transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
        }

        .forgot-logo:hover {
          transform: translateY(-1px);
        }

        .forgot-logo-mark {
          width: 32px;
          height: 32px;
          background: linear-gradient(135deg, #6366f1, #4f46e5);
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 1.1rem;
          border-radius: 6px;
          transition: all 0.3s ease;
        }

        .forgot-logo:hover .forgot-logo-mark {
          box-shadow: 0 0 12px rgba(99, 102, 241, 0.4);
          transform: scale(1.02);
        }

        .forgot-logo-text {
          font-family: 'Syne', 'Inter', system-ui, sans-serif;
          background: linear-gradient(135deg, #e8ecf8, #818cf8);
          -webkit-background-clip: text;
          -webkit-text-fill-color: transparent;
          background-clip: text;
          font-weight: 800;
          font-size: 1.1rem;
          letter-spacing: -0.3px;
        }

        .forgot-nav-links {
          display: flex;
          gap: 2rem;
        }

        .forgot-nav-link {
          text-decoration: none;
          color: #7a849c;
          font-size: 0.83rem;
          font-weight: 500;
          letter-spacing: 0.2px;
          transition: color 0.2s;
        }

        .forgot-nav-link:hover {
          color: #e8ecf8;
        }

        .forgot-nav-btn {
          padding: 8px 20px;
          border-radius: 6px;
          background: linear-gradient(135deg, #6366f1, #4f46e5);
          color: #ffffff;
          text-decoration: none;
          font-weight: 600;
          font-size: 0.82rem;
          transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
          border: 1px solid rgba(99, 102, 241, 0.3);
        }

        .forgot-nav-btn:hover {
          transform: translateY(-2px);
          box-shadow: 0 4px 12px rgba(99, 102, 241, 0.3);
        }

        /* Toast */
        .forgot-toast {
          position: fixed;
          top: 90px;
          left: 50%;
          transform: translateX(-50%);
          z-index: 200;
          display: flex;
          align-items: center;
          gap: 10px;
          padding: 12px 24px;
          border-radius: 8px;
          font-size: 0.85rem;
          background: rgba(12, 15, 26, 0.95);
          backdrop-filter: blur(12px);
          border: 1px solid;
          animation: toastIn 0.3s ease-out;
        }

        @keyframes toastIn {
          from { opacity: 0; transform: translateX(-50%) translateY(-10px); }
          to { opacity: 1; transform: translateX(-50%) translateY(0); }
        }

        .forgot-toast-success { border-color: rgba(99, 102, 241, 0.4); color: #818cf8; }
        .forgot-toast-error { border-color: rgba(239, 68, 68, 0.4); color: #f87171; }

        .forgot-toast-icon { font-size: 1rem; }

        /* Main Layout - Two Columns with top alignment */
        .forgot-main {
          position: relative;
          z-index: 10;
          min-height: 100vh;
          display: grid;
          grid-template-columns: 1fr 1fr;
          align-items: start;
          padding: 100px 3rem 3rem;
          gap: 4rem;
        }

        /* Left Column - Reset Card */
        .forgot-left {
          display: flex;
          justify-content: flex-end;
        }

        .forgot-card {
          width: 100%;
          max-width: 460px;
          background: var(--bg-card);
          backdrop-filter: blur(20px);
          border-radius: 10px;
          border: 1px solid rgba(255, 255, 255, 0.07);
          overflow: hidden;
          animation: cardReveal 0.6s ease-out 0.1s both;
        }

        @keyframes cardReveal {
          from { opacity: 0; transform: translateY(30px); }
          to { opacity: 1; transform: translateY(0); }
        }

        .forgot-card-inner {
          padding: 2.5rem;
        }

        .forgot-badge {
          display: inline-block;
          padding: 5px 12px;
          background: rgba(99, 102, 241, 0.1);
          border: 1px solid rgba(99, 102, 241, 0.2);
          border-radius: 3px;
          font-size: 0.68rem;
          font-weight: 600;
          letter-spacing: 1.5px;
          text-transform: uppercase;
          color: #818cf8;
          margin-bottom: 1.5rem;
        }

        .forgot-title {
          font-size: 2rem;
          font-weight: 700;
          letter-spacing: -0.02em;
          line-height: 1.2;
          margin-bottom: 0.75rem;
          color: #e8ecf8;
        }

        .forgot-title-highlight {
          background: linear-gradient(135deg, #6366f1, #818cf8);
          -webkit-background-clip: text;
          -webkit-text-fill-color: transparent;
          background-clip: text;
        }

        .forgot-subtitle {
          font-size: 0.88rem;
          color: #7a849c;
          line-height: 1.6;
          margin-bottom: 2rem;
        }

        /* Form */
        .forgot-form {
          display: flex;
          flex-direction: column;
          gap: 1.5rem;
        }

        .forgot-field {
          display: flex;
          flex-direction: column;
          gap: 0.5rem;
        }

        .forgot-label {
          font-size: 0.75rem;
          font-weight: 500;
          color: #7a849c;
          letter-spacing: 0.5px;
          transition: color 0.2s;
        }

        .forgot-field.focused .forgot-label {
          color: #6366f1;
        }

        .forgot-input-group {
          position: relative;
          display: flex;
          align-items: center;
        }

        .forgot-input-icon {
          position: absolute;
          left: 14px;
          color: #3d4459;
        }

        .forgot-field.focused .forgot-input-icon {
          color: #6366f1;
        }

        .forgot-input-group input {
          width: 100%;
          padding: 12px 14px 12px 44px;
          background: rgba(255, 255, 255, 0.03);
          border: 1px solid rgba(255, 255, 255, 0.07);
          border-radius: 6px;
          font-family: inherit;
          font-size: 0.9rem;
          color: #e8ecf8;
          transition: all 0.2s;
          outline: none;
        }

        .forgot-input-group input:focus {
          border-color: #6366f1;
          background: rgba(99, 102, 241, 0.05);
          box-shadow: 0 0 0 3px rgba(99, 102, 241, 0.1);
        }

        .forgot-input-group input::placeholder {
          color: #3d4459;
        }

        /* Submit Button */
        .forgot-submit {
          width: 100%;
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 8px;
          padding: 12px 24px;
          background: linear-gradient(135deg, #6366f1, #4f46e5);
          border: none;
          border-radius: 6px;
          font-family: inherit;
          font-size: 0.88rem;
          font-weight: 600;
          color: #ffffff;
          cursor: pointer;
          transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
        }

        .forgot-submit:hover:not(:disabled) {
          transform: translateY(-2px);
          box-shadow: 0 6px 20px rgba(99, 102, 241, 0.4);
        }

        .forgot-submit:disabled {
          opacity: 0.7;
          cursor: not-allowed;
        }

        .forgot-spinner {
          width: 18px;
          height: 18px;
          border: 2px solid rgba(255, 255, 255, 0.2);
          border-top-color: #ffffff;
          border-radius: 50%;
          animation: spin 0.6s linear infinite;
        }

        @keyframes spin {
          to { transform: rotate(360deg); }
        }

        /* Success State */
        .forgot-success {
          text-align: center;
        }

        .forgot-success-icon {
          font-size: 3rem;
          margin-bottom: 1rem;
        }

        .forgot-success h3 {
          font-size: 1.1rem;
          font-weight: 600;
          margin-bottom: 0.75rem;
          color: #10b981;
        }

        .forgot-success p {
          font-size: 0.85rem;
          color: #7a849c;
          line-height: 1.6;
          margin-bottom: 1.5rem;
        }

        .forgot-success p strong {
          color: #818cf8;
        }

        .forgot-resend {
          background: transparent;
          border: none;
          color: #818cf8;
          cursor: pointer;
          font-size: 0.8rem;
          text-decoration: underline;
          transition: color 0.2s;
        }

        .forgot-resend:hover {
          color: #6366f1;
        }

        /* Footer */
        .forgot-footer {
          margin-top: 1.5rem;
          text-align: center;
          padding-top: 1.25rem;
          border-top: 1px solid rgba(255, 255, 255, 0.05);
          font-size: 0.8rem;
          color: #7a849c;
        }

        .forgot-footer-link {
          color: #818cf8;
          text-decoration: none;
          font-weight: 500;
        }

        .forgot-footer-link:hover {
          color: #6366f1;
        }

        /* Right Column - Security Tips */
        .forgot-right {
          display: flex;
          align-items: flex-start;
        }

        .forgot-feature {
          max-width: 460px;
          animation: sideReveal 0.6s ease-out 0.2s both;
        }

        @keyframes sideReveal {
          from { opacity: 0; transform: translateX(20px); }
          to { opacity: 1; transform: translateX(0); }
        }

        .forgot-feature-badge {
          font-size: 0.65rem;
          font-weight: 600;
          letter-spacing: 3px;
          color: #818cf8;
          margin-bottom: 1.5rem;
          font-family: 'DM Mono', monospace;
        }

        .forgot-feature-title {
          font-size: 2.5rem;
          font-weight: 800;
          line-height: 1.15;
          letter-spacing: -0.03em;
          margin-bottom: 2rem;
          font-family: 'Syne', sans-serif;
        }

        .forgot-feature-highlight {
          background: linear-gradient(135deg, #6366f1, #818cf8);
          -webkit-background-clip: text;
          -webkit-text-fill-color: transparent;
          background-clip: text;
        }

        /* Tips List */
        .forgot-tips {
          display: flex;
          flex-direction: column;
          gap: 1.5rem;
          margin-bottom: 2rem;
        }

        .forgot-tip {
          display: flex;
          gap: 14px;
          align-items: flex-start;
          padding: 12px;
          border-radius: 10px;
          transition: all 0.3s ease;
        }

        .forgot-tip:hover {
          background: rgba(99, 102, 241, 0.05);
          transform: translateX(5px);
        }

        .forgot-tip-icon {
          font-size: 1.6rem;
          flex-shrink: 0;
        }

        .forgot-tip-content h4 {
          font-size: 0.9rem;
          font-weight: 600;
          margin-bottom: 0.25rem;
          color: #e8ecf8;
        }

        .forgot-tip-content p {
          font-size: 0.8rem;
          color: #7a849c;
          line-height: 1.5;
        }

        /* Quote */
        .forgot-feature-quote {
          background: rgba(255, 255, 255, 0.02);
          border-left: 2px solid #6366f1;
          padding: 1.5rem;
          border-radius: 10px;
          margin-top: 1rem;
        }

        .forgot-feature-quote svg {
          color: #6366f1;
          margin-bottom: 1rem;
          opacity: 0.6;
        }

        .forgot-feature-quote p {
          font-size: 0.85rem;
          line-height: 1.6;
          color: #7a849c;
          margin-bottom: 1rem;
          font-style: italic;
        }

        .forgot-feature-author strong {
          display: block;
          color: #e8ecf8;
          font-size: 0.8rem;
          margin-bottom: 0.25rem;
        }

        .forgot-feature-author span {
          font-size: 0.68rem;
          color: #3d4459;
        }

        /* Responsive */
        @media (max-width: 1100px) {
          .forgot-main {
            grid-template-columns: 1fr;
            align-items: center;
            padding: 90px 2rem 2rem;
            gap: 2rem;
          }
          .forgot-left {
            justify-content: center;
          }
          .forgot-right {
            justify-content: center;
            align-items: center;
          }
          .forgot-feature {
            text-align: center;
          }
          .forgot-tip {
            text-align: left;
          }
          .forgot-feature-quote {
            text-align: left;
          }
        }

        @media (max-width: 768px) {
          .forgot-nav {
            padding: 0 1.5rem;
          }
          .forgot-nav-links {
            display: none;
          }
          .forgot-main {
            padding: 80px 1.25rem 2rem;
          }
          .forgot-card-inner {
            padding: 1.75rem;
          }
          .forgot-title {
            font-size: 1.6rem;
          }
          .forgot-feature-title {
            font-size: 1.8rem;
          }
        }

        @media (max-width: 480px) {
          .forgot-card {
            border-radius: 12px;
          }
          .forgot-card-inner {
            padding: 1.5rem 1.25rem;
          }
        }

        @media (prefers-reduced-motion: reduce) {
          .forgot-aura,
          .forgot-nav,
          .forgot-card,
          .forgot-feature {
            animation: none;
          }
        }
      `}</style>
    </div>
  );
}