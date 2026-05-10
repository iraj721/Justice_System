// frontend/src/pages/auth/ForgotPasswordPage.tsx
import { Link } from "react-router-dom";
import { useState, useEffect, useRef } from "react";

export function ForgotPasswordPage() {
  const [email, setEmail] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [toast, setToast] = useState<{ message: string; type: string } | null>(null);
  const [emailSent, setEmailSent] = useState(false);
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
    <div className="forgot-root">
      {/* Background Elements */}
      <div className="forgot-bg" />
      <div className="forgot-grid" />
      <div className="forgot-orb forgot-orb-a" />
      <div className="forgot-orb forgot-orb-b" />
      <div className="forgot-orb forgot-orb-c" />

      {/* Navigation */}
      <nav className="forgot-nav">
        <Link to="/" className="forgot-logo">
          <span className="forgot-logo-gem">⚖</span>
          Decentralized Justice
        </Link>
        <div className="forgot-nav-right">
          <Link to="/login" className="forgot-nav-solid">Sign In</Link>
          <Link to="/register" className="forgot-nav-outline">Register</Link>
        </div>
      </nav>

      {/* Toast Notification */}
      {toast && (
        <div className={`forgot-toast forgot-toast-${toast.type}`}>
          <span className="forgot-toast-icon">
            {toast.type === "success" ? "✓" : toast.type === "warning" ? "⚠" : "✕"}
          </span>
          {toast.message}
        </div>
      )}

      {/* Main Content */}
      <main className="forgot-main">
        <div className="forgot-card">
          <div className="forgot-card-glow" />
          
          <div className="forgot-card-head">
            <div className="forgot-card-eyebrow">Need help?</div>
            <h1 className="forgot-card-title">
              Forgot <span className="forgot-grad">Password?</span>
            </h1>
            <p className="forgot-card-sub">
              Enter your email address and we'll send you a link to reset your password.
            </p>
          </div>

          {!emailSent ? (
            <form className="forgot-form" onSubmit={handleSubmit}>
              <div className="forgot-field">
                <label className="forgot-label" htmlFor="email">Email address</label>
                <div className="forgot-input-wrap">
                  <svg className="forgot-input-icon" width="16" height="16" viewBox="0 0 16 16" fill="none">
                    <rect x="1" y="3" width="14" height="10" rx="2" stroke="currentColor" strokeWidth="1.3"/>
                    <path d="M1 5.5l6.293 4.207a1 1 0 001.414 0L15 5.5" stroke="currentColor" strokeWidth="1.3"/>
                  </svg>
                  <input
                    id="email"
                    name="email"
                    type="email"
                    autoComplete="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="forgot-input"
                    placeholder="you@example.com"
                    disabled={isLoading}
                    required
                  />
                </div>
              </div>

              <button
                type="submit"
                className={`forgot-submit ${isLoading ? "forgot-submit-loading" : ""}`}
                disabled={isLoading}
              >
                {isLoading ? (
                  <>
                    <span className="forgot-spinner" />
                    Sending...
                  </>
                ) : (
                  <>
                    Send Reset Link
                    <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
                      <path d="M2.5 7h9M8 3.5l3.5 3.5L8 10.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
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
              <button
                onClick={() => setEmailSent(false)}
                className="forgot-resend"
              >
                Didn't receive email? Click to try again
              </button>
            </div>
          )}

          <div className="forgot-card-foot">
            Remember your password?{" "}
            <Link to="/login" className="forgot-card-link">Back to Sign In</Link>
          </div>
        </div>

        {/* Side Panel */}
        <div className="forgot-side">
          <div className="forgot-side-content">
            <div className="forgot-side-eyebrow">Security Tip</div>
            <h2 className="forgot-side-title">
              Keep your<br />
              <span className="forgot-grad">Account Safe</span>
            </h2>
            <div className="forgot-tips">
              <div className="forgot-tip">
                <div className="forgot-tip-icon">🔒</div>
                <div>
                  <h4>Use Strong Passwords</h4>
                  <p>Combine letters, numbers, and special characters</p>
                </div>
              </div>
              <div className="forgot-tip">
                <div className="forgot-tip-icon">🔄</div>
                <div>
                  <h4>Regular Updates</h4>
                  <p>Change your password every 3 months</p>
                </div>
              </div>
              <div className="forgot-tip">
                <div className="forgot-tip-icon">🔐</div>
                <div>
                  <h4>Enable 2FA</h4>
                  <p>Add an extra layer of security to your account</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </main>

      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Syne:wght@500;600;700;800&family=Inter:wght@300;400;500;600;700&display=swap');

        .forgot-root {
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
          --success: #10b981;
        }

        *, *::before, *::after { margin: 0; padding: 0; box-sizing: border-box; }
        html { scroll-behavior: smooth; }

        .forgot-root {
          font-family: var(--fb);
          background: var(--bg);
          color: var(--text);
          min-height: 100vh;
          overflow-x: hidden;
        }

        .forgot-grad {
          background: linear-gradient(135deg, var(--accent) 0%, var(--accent2) 60%, var(--violet) 100%);
          -webkit-background-clip: text;
          -webkit-text-fill-color: transparent;
          background-clip: text;
        }

        /* Background */
        .forgot-bg {
          position: fixed; inset: 0; z-index: 0;
          background: radial-gradient(ellipse 60% 45% at 50% -5%, rgba(243, 198, 106, 0.13) 0%, transparent 60%);
        }
        .forgot-grid {
          position: fixed; inset: 0; z-index: 0;
          background-image: linear-gradient(rgba(243, 198, 106, 0.03) 1px, transparent 1px),
                          linear-gradient(90deg, rgba(243, 198, 106, 0.03) 1px, transparent 1px);
          background-size: 48px 48px;
          mask-image: radial-gradient(ellipse 80% 70% at 50% 40%, black 20%, transparent 80%);
        }
        .forgot-orb {
          position: fixed; border-radius: 50%; filter: blur(90px); pointer-events: none; z-index: 0;
        }
        .forgot-orb-a { width: 460px; height: 460px; top: -140px; left: 50%; transform: translateX(-50%); background: rgba(243, 198, 106, 0.09); animation: orbA 9s ease-in-out infinite; }
        .forgot-orb-b { width: 280px; height: 280px; bottom: 10%; right: -3%; background: rgba(255, 217, 141, 0.06); animation: orbB 11s 2s ease-in-out infinite; }
        .forgot-orb-c { width: 240px; height: 240px; top: 30%; left: -4%; background: rgba(155, 122, 255, 0.06); animation: orbB 10s 4s ease-in-out infinite; }
        @keyframes orbA { 0%,100%{transform:translateX(-50%) scale(1)} 50%{transform:translateX(-50%) scale(1.06)} }
        @keyframes orbB { 0%,100%{transform:scale(1)} 50%{transform:scale(1.09)} }

        /* Nav */
        .forgot-nav {
          position: fixed; top: 0; left: 0; right: 0; z-index: 100;
          display: flex; align-items: center; justify-content: space-between;
          padding: 0 2.5rem; height: 64px;
          background: rgba(10, 12, 18, 0.7);
          backdrop-filter: blur(24px);
          border-bottom: 1px solid var(--border);
          animation: navDown 0.5s cubic-bezier(.2,.9,.3,1.1) both;
        }
        @keyframes navDown { from{opacity:0;transform:translateY(-16px)} to{opacity:1;transform:none} }
        .forgot-logo { font-family: var(--fd); font-size: 1.15rem; font-weight: 700; letter-spacing: -0.02em; color: var(--text); display: flex; align-items: center; gap: 7px; text-decoration: none; }
        .forgot-logo-gem { color: var(--accent); filter: drop-shadow(0 0 6px rgba(243,198,106,0.55)); }
        .forgot-nav-right { display: flex; align-items: center; gap: 12px; }
        .forgot-nav-solid { font-size: 0.85rem; font-weight: 600; padding: 7px 20px; border-radius: 40px; background: linear-gradient(135deg, var(--accent), var(--accent2)); color: #111; text-decoration: none; transition: all 0.2s; box-shadow: 0 2px 12px rgba(243,198,106,0.3); }
        .forgot-nav-solid:hover { transform: translateY(-1px); box-shadow: 0 6px 20px rgba(243,198,106,0.45); }
        .forgot-nav-outline { font-size: 0.85rem; font-weight: 600; padding: 7px 20px; border-radius: 40px; border: 1px solid var(--border); color: var(--text); text-decoration: none; transition: all 0.2s; }
        .forgot-nav-outline:hover { border-color: var(--accent); color: var(--accent); }

        /* Toast */
        .forgot-toast {
          position: fixed; top: 80px; left: 50%; transform: translateX(-50%);
          z-index: 300; display: flex; align-items: center; gap: 10px;
          padding: 12px 24px; border-radius: 48px;
          font-size: 0.85rem; font-weight: 500;
          backdrop-filter: blur(16px);
          animation: toastIn 0.35s cubic-bezier(.2,.9,.3,1.1) both;
          white-space: nowrap;
        }
        @keyframes toastIn { from{opacity:0;transform:translateX(-50%) translateY(-12px)} to{opacity:1;transform:translateX(-50%) translateY(0)} }
        .forgot-toast-success { background: rgba(16,185,129,0.15); border: 1px solid rgba(16,185,129,0.35); color: #6ee7b7; }
        .forgot-toast-error { background: rgba(239,68,68,0.15); border: 1px solid rgba(239,68,68,0.35); color: #fca5a5; }
        .forgot-toast-icon { font-size: 1rem; line-height: 1; }

        /* Main */
        .forgot-main {
          position: relative; z-index: 10;
          min-height: 100vh;
          display: flex;
          align-items: center;
          justify-content: center;
          padding: 5.5rem 2rem 3rem;
          gap: 5rem;
        }

        /* Card */
        .forgot-card {
          position: relative; overflow: hidden;
          width: 100%; max-width: 460px;
          background: rgba(17, 19, 24, 0.85);
          border: 1px solid var(--border);
          border-radius: 28px;
          padding: 2.5rem;
          backdrop-filter: blur(24px);
          box-shadow: 0 24px 60px rgba(0,0,0,0.4);
          animation: cardIn 0.6s cubic-bezier(.2,.9,.3,1.1) both;
        }
        @keyframes cardIn { from{opacity:0;transform:translateY(28px)} to{opacity:1;transform:none} }
        .forgot-card-glow { position: absolute; top: -60px; left: 50%; transform: translateX(-50%); width: 280px; height: 180px; background: radial-gradient(circle, rgba(243,198,106,0.15), transparent); border-radius: 50%; filter: blur(60px); pointer-events: none; }
        .forgot-card-head { margin-bottom: 2rem; text-align: center; }
        .forgot-card-eyebrow { font-size: 0.68rem; font-weight: 600; letter-spacing: 0.14em; text-transform: uppercase; color: var(--accent); margin-bottom: 0.6rem; }
        .forgot-card-title { font-family: var(--fd); font-size: 1.75rem; font-weight: 700; letter-spacing: -0.02em; margin-bottom: 0.5rem; color: var(--text); }
        .forgot-card-sub { font-size: 0.85rem; color: var(--muted); line-height: 1.5; }

        /* Form */
        .forgot-form { display: flex; flex-direction: column; gap: 1.5rem; }
        .forgot-field { display: flex; flex-direction: column; gap: 0.5rem; }
        .forgot-label { font-size: 0.8rem; font-weight: 500; color: var(--muted); }
        .forgot-input-wrap { position: relative; display: flex; align-items: center; }
        .forgot-input-icon { position: absolute; left: 13px; color: var(--faint); pointer-events: none; }
        .forgot-input { width: 100%; font-size: 0.9rem; color: var(--text); background: rgba(255,255,255,0.04); border: 1px solid var(--border); border-radius: 12px; padding: 12px 16px 12px 40px; outline: none; transition: all 0.2s; }
        .forgot-input:focus { border-color: rgba(243,198,106,0.5); background: rgba(243,198,106,0.04); box-shadow: 0 0 0 3px rgba(243,198,106,0.1); }
        .forgot-input::placeholder { color: var(--faint); }

        /* Submit Button */
        .forgot-submit { width: 100%; display: flex; align-items: center; justify-content: center; gap: 10px; font-size: 0.95rem; font-weight: 600; padding: 13px 24px; border-radius: 48px; background: linear-gradient(135deg, var(--accent), var(--accent2)); border: none; color: #111; cursor: pointer; transition: all 0.2s; }
        .forgot-submit:hover:not(:disabled) { transform: translateY(-2px); box-shadow: 0 8px 25px rgba(243,198,106,0.4); }
        .forgot-submit:disabled { opacity: 0.6; cursor: not-allowed; }
        .forgot-spinner { width: 18px; height: 18px; border-radius: 50%; border: 2px solid rgba(0,0,0,0.2); border-top-color: #111; animation: spin 0.6s linear infinite; }
        @keyframes spin { to { transform: rotate(360deg); } }

        /* Success State */
        .forgot-success { text-align: center; }
        .forgot-success-icon { font-size: 3rem; margin-bottom: 1rem; }
        .forgot-success h3 { font-size: 1.2rem; margin-bottom: 0.5rem; color: var(--success); }
        .forgot-success p { font-size: 0.85rem; color: var(--muted); line-height: 1.5; margin-bottom: 1.5rem; }
        .forgot-resend { background: none; border: none; color: var(--accent); cursor: pointer; font-size: 0.8rem; text-decoration: underline; }

        /* Card Footer */
        .forgot-card-foot { margin-top: 1.5rem; text-align: center; font-size: 0.82rem; color: var(--faint); padding-top: 1.25rem; border-top: 1px solid rgba(255,255,255,0.05); }
        .forgot-card-link { color: var(--accent); text-decoration: none; font-weight: 500; transition: color 0.2s; }
        .forgot-card-link:hover { color: var(--accent2); }

        /* Side Panel */
        .forgot-side { flex: 1; max-width: 400px; }
        .forgot-side-content { width: 100%; }
        .forgot-side-eyebrow { font-size: 0.68rem; font-weight: 600; letter-spacing: 0.14em; text-transform: uppercase; color: var(--accent); margin-bottom: 1rem; }
        .forgot-side-title { font-family: var(--fd); font-size: clamp(1.8rem, 3vw, 2.5rem); font-weight: 800; line-height: 1.1; letter-spacing: -0.03em; margin-bottom: 2rem; color: var(--text); }
        .forgot-tips { display: flex; flex-direction: column; gap: 1.25rem; }
        .forgot-tip { display: flex; gap: 14px; align-items: flex-start; }
        .forgot-tip-icon { font-size: 1.6rem; flex-shrink: 0; }
        .forgot-tip h4 { font-size: 0.9rem; font-weight: 600; margin-bottom: 0.25rem; color: var(--text); }
        .forgot-tip p { font-size: 0.78rem; color: var(--muted); line-height: 1.4; }

        /* Responsive */
        @media (max-width: 900px) {
          .forgot-side { display: none; }
          .forgot-main { justify-content: center; gap: 0; }
        }
        @media (max-width: 768px) {
          .forgot-nav { padding: 0 1.25rem; height: 58px; }
          .forgot-main { padding: 5rem 1.25rem 3rem; }
          .forgot-card { padding: 1.8rem 1.5rem; }
        }
        @media (max-width: 480px) {
          .forgot-card { border-radius: 20px; padding: 1.5rem; }
          .forgot-card-title { font-size: 1.5rem; }
        }
      `}</style>
    </div>
  );
}