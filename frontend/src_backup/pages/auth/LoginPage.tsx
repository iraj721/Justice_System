// frontend/src/pages/auth/LoginPage.tsx
import { FormEvent, useState, useEffect, useRef } from "react";
import { Link, useNavigate } from "react-router-dom";
import { login } from "../../shared/services/auth";

export function LoginPage() {
  const navigate = useNavigate();
  const [form, setForm] = useState({ email: "", password: "" });
  const [isLoading, setIsLoading] = useState(false);
  const [toast, setToast] = useState<{ message: string; type: string } | null>(null);
  const [showPassword, setShowPassword] = useState(false);
  const [focused, setFocused] = useState("");
  const [rememberMe, setRememberMe] = useState(false);
  const toastTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const showToast = (message: string, type: string = "error") => {
    setToast({ message, type });
    if (toastTimer.current) clearTimeout(toastTimer.current);
    toastTimer.current = setTimeout(() => setToast(null), 4000);
  };

  useEffect(() => {
    document.title = "Sign In | Decentralized Justice";
    // Load saved email if remember me was checked
    const savedEmail = localStorage.getItem("rememberedEmail");
    if (savedEmail) {
      setForm(prev => ({ ...prev, email: savedEmail }));
      setRememberMe(true);
    }
    return () => {
      if (toastTimer.current) clearTimeout(toastTimer.current);
    };
  }, []);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setForm(prev => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    
    if (!form.email || !form.password) {
      showToast("Please fill in all fields.", "error");
      return;
    }

    setIsLoading(true);
    try {
      await login(form.email, form.password);
      
      // Handle remember me
      if (rememberMe) {
        localStorage.setItem("rememberedEmail", form.email);
      } else {
        localStorage.removeItem("rememberedEmail");
      }
      
      showToast("Login successful! Redirecting...", "success");
      setTimeout(() => navigate("/app"), 600);
    } catch (err) {
      setIsLoading(false);
      const errorMessage = err instanceof Error ? err.message : "Login failed. Please try again.";
      showToast(errorMessage, "error");
    }
  };

  // Google OAuth handler
  const handleGoogleLogin = () => {
    // Google OAuth configuration
    const GOOGLE_CLIENT_ID = "YOUR_GOOGLE_CLIENT_ID.apps.googleusercontent.com"; // Replace with your client ID
    const REDIRECT_URI = `${window.location.origin}/auth/google/callback`;
    const SCOPE = "email profile";
    
    // Google OAuth URL
    const googleAuthUrl = `https://accounts.google.com/o/oauth2/v2/auth?client_id=${GOOGLE_CLIENT_ID}&redirect_uri=${REDIRECT_URI}&response_type=code&scope=${SCOPE}&access_type=offline&prompt=consent`;
    
    // Open Google login popup
    const width = 500;
    const height = 600;
    const left = window.screen.width / 2 - width / 2;
    const top = window.screen.height / 2 - height / 2;
    
    const popup = window.open(
      googleAuthUrl,
      "Google Login",
      `width=${width},height=${height},left=${left},top=${top}`
    );
    
    // Listen for message from popup
    window.addEventListener("message", async (event) => {
      if (event.origin === window.location.origin && event.data.type === "GOOGLE_AUTH_SUCCESS") {
        try {
          setIsLoading(true);
          // Send the code to your backend
          const response = await fetch("/api/auth/google", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ code: event.data.code }),
          });
          const data = await response.json();
          if (data.token) {
            localStorage.setItem("token", data.token);
            showToast("Google login successful!", "success");
            setTimeout(() => navigate("/app"), 600);
          }
        } catch (error) {
          showToast("Google login failed", "error");
        } finally {
          setIsLoading(false);
        }
      }
    });
  };

  return (
    <div className="dj-root">
      {/* Background Elements */}
      <div className="dj-bg" />
      <div className="dj-grid" />
      <div className="dj-orb dj-orb-a" />
      <div className="dj-orb dj-orb-b" />
      <div className="dj-orb dj-orb-c" />

      {/* Navigation */}
      <nav className="dj-nav">
        <Link to="/" className="dj-logo">
          <span className="dj-logo-gem">⚖</span>
          Decentralized Justice
        </Link>
        <div className="dj-nav-right">
          <span className="dj-nav-label">New here?</span>
          <Link to="/register" className="dj-nav-solid">Create Account</Link>
        </div>
      </nav>

      {/* Toast Notification */}
      {toast && (
        <div className={`dj-toast dj-toast-${toast.type}`}>
          <span className="dj-toast-icon">
            {toast.type === "success" ? "✓" : toast.type === "warning" ? "⚠" : "✕"}
          </span>
          {toast.message}
        </div>
      )}

      {/* Main Content */}
      <main className="dj-main">
        {/* Login Card */}
        <div className="dj-card">
          <div className="dj-card-glow" />
          
          <div className="dj-card-head">
            <div className="dj-card-eyebrow">Welcome back</div>
            <h1 className="dj-card-title">
              Sign in to<br />
              <span className="dj-grad">Justice System</span>
            </h1>
            <p className="dj-card-sub">
              Access your dashboard, track cases, and manage investigations.
            </p>
          </div>

          <form className="dj-form" onSubmit={handleSubmit} noValidate>
            {/* Email Field */}
            <div className={`dj-field ${focused === "email" ? "dj-field-focus" : ""}`}>
              <label className="dj-label" htmlFor="email">Email address</label>
              <div className="dj-input-wrap">
                <svg className="dj-input-icon" width="16" height="16" viewBox="0 0 16 16" fill="none">
                  <rect x="1" y="3" width="14" height="10" rx="2" stroke="currentColor" strokeWidth="1.3"/>
                  <path d="M1 5.5l6.293 4.207a1 1 0 001.414 0L15 5.5" stroke="currentColor" strokeWidth="1.3"/>
                </svg>
                <input
                  id="email"
                  name="email"
                  type="email"
                  autoComplete="email"
                  value={form.email}
                  onChange={handleChange}
                  onFocus={() => setFocused("email")}
                  onBlur={() => setFocused("")}
                  className="dj-input"
                  placeholder="you@example.com"
                  disabled={isLoading}
                />
              </div>
            </div>

            {/* Password Field */}
            <div className={`dj-field ${focused === "password" ? "dj-field-focus" : ""}`}>
              <div className="dj-label-row">
                <label className="dj-label" htmlFor="password">Password</label>
                <Link to="/forgot-password" className="dj-forgot">Forgot password?</Link>
              </div>
              <div className="dj-input-wrap">
                <svg className="dj-input-icon" width="16" height="16" viewBox="0 0 16 16" fill="none">
                  <rect x="3" y="7" width="10" height="7" rx="1.5" stroke="currentColor" strokeWidth="1.3"/>
                  <path d="M5 7V5a3 3 0 016 0v2" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round"/>
                </svg>
                <input
                  id="password"
                  name="password"
                  type={showPassword ? "text" : "password"}
                  autoComplete="current-password"
                  value={form.password}
                  onChange={handleChange}
                  onFocus={() => setFocused("password")}
                  onBlur={() => setFocused("")}
                  className="dj-input"
                  placeholder="Enter your password"
                  disabled={isLoading}
                />
                <button
                  type="button"
                  className="dj-eye"
                  onClick={() => setShowPassword(prev => !prev)}
                  tabIndex={-1}
                  aria-label={showPassword ? "Hide password" : "Show password"}
                >
                  {showPassword ? (
                    <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                      <path d="M2 2l12 12M6.5 6.6A2 2 0 019.4 9.5M4.2 4.3C2.8 5.3 1.7 6.5 1 8c1.3 3 4 5 7 5 1.3 0 2.5-.4 3.5-1M6 3.1C6.6 3 7.3 3 8 3c3 0 5.7 2 7 5-.5 1.2-1.3 2.2-2.3 3" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round"/>
                    </svg>
                  ) : (
                    <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                      <path d="M1 8c1.3-3 4-5 7-5s5.7 2 7 5c-1.3 3-4 5-7 5s-5.7-2-7-5z" stroke="currentColor" strokeWidth="1.3"/>
                      <circle cx="8" cy="8" r="2" stroke="currentColor" strokeWidth="1.3"/>
                    </svg>
                  )}
                </button>
              </div>
            </div>

            {/* Remember Me */}
            <div className="dj-checkbox-wrap">
              <label className="dj-checkbox">
                <input
                  type="checkbox"
                  checked={rememberMe}
                  onChange={(e) => setRememberMe(e.target.checked)}
                  disabled={isLoading}
                />
                <span>Remember me</span>
              </label>
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              className={`dj-submit ${isLoading ? "dj-submit-loading" : ""}`}
              disabled={isLoading}
            >
              {isLoading ? (
                <>
                  <span className="dj-spinner" />
                  Signing in…
                </>
              ) : (
                <>
                  Sign In
                  <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
                    <path d="M2.5 7h9M8 3.5l3.5 3.5L8 10.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                  </svg>
                </>
              )}
            </button>
          </form>

          {/* Divider */}
          <div className="dj-divider">
            <span>or continue with</span>
          </div>

          {/* Google Login Button */}
          <button
            type="button"
            className="dj-google-btn"
            onClick={handleGoogleLogin}
            disabled={isLoading}
          >
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
              <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
              <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
              <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
              <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
            </svg>
            Continue with Google
          </button>

          {/* Footer Link */}
          <div className="dj-card-foot">
            Don't have an account?{" "}
            <Link to="/register" className="dj-card-link">Create one free</Link>
          </div>
        </div>

        {/* Side Panel - Features */}
        <div className="dj-side">
          <div className="dj-side-content">
            <div className="dj-side-eyebrow">Trusted by citizens & authorities</div>
            <h2 className="dj-side-title">
              Justice powered by<br />
              <span className="dj-grad">Blockchain Technology</span>
            </h2>
            <p className="dj-side-sub">
              Transparent case tracking, immutable evidence storage, and secure digital signatures — all in one unified platform.
            </p>
            <div className="dj-side-stats">
              <div className="dj-side-stat">
                <div className="dj-side-stat-v">100%</div>
                <div className="dj-side-stat-l">Transparent</div>
              </div>
              <div className="dj-side-stat">
                <div className="dj-side-stat-v">24/7</div>
                <div className="dj-side-stat-l">Access</div>
              </div>
              <div className="dj-side-stat">
                <div className="dj-side-stat-v">256-bit</div>
                <div className="dj-side-stat-l">Encryption</div>
              </div>
            </div>
          </div>
        </div>
      </main>

      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700;800&display=swap');

        :root {
          --bg: #0a0c12;
          --surface: #111318;
          --surface2: #181b22;
          --border: rgba(243, 198, 106, 0.12);
          --border-h: rgba(243, 198, 106, 0.3);
          --accent: #f3c66a;
          --accent2: #ffd98d;
          --violet: #9b7aff;
          --text: #edf2ff;
          --muted: #8e9cc4;
          --faint: #49587a;
          --font: 'Inter', system-ui, -apple-system, sans-serif;
        }

        *, *::before, *::after { margin: 0; padding: 0; box-sizing: border-box; }
        html { scroll-behavior: smooth; }

        .dj-root {
          font-family: var(--font);
          background: var(--bg);
          color: var(--text);
          min-height: 100vh;
          overflow-x: hidden;
          -webkit-font-smoothing: antialiased;
        }

        .dj-grad {
          background: linear-gradient(135deg, var(--accent) 0%, var(--accent2) 60%, var(--violet) 100%);
          -webkit-background-clip: text;
          -webkit-text-fill-color: transparent;
          background-clip: text;
        }

        /* Background Effects */
        .dj-bg {
          position: fixed; inset: 0; z-index: 0;
          background: radial-gradient(ellipse 60% 45% at 50% -5%, rgba(243, 198, 106, 0.08) 0%, transparent 60%),
                      radial-gradient(ellipse 40% 30% at 90% 70%, rgba(255, 217, 141, 0.06) 0%, transparent 55%),
                      radial-gradient(ellipse 40% 30% at 10% 80%, rgba(155, 122, 255, 0.06) 0%, transparent 55%);
        }
        
        .dj-grid {
          position: fixed; inset: 0; z-index: 0;
          background-image: linear-gradient(rgba(243, 198, 106, 0.03) 1px, transparent 1px),
                          linear-gradient(90deg, rgba(243, 198, 106, 0.03) 1px, transparent 1px);
          background-size: 48px 48px;
          mask-image: radial-gradient(ellipse 80% 70% at 50% 40%, black 20%, transparent 80%);
        }
        
        .dj-orb {
          position: fixed; border-radius: 50%; filter: blur(90px); pointer-events: none; z-index: 0;
        }
        
        .dj-orb-a {
          width: 460px; height: 460px; top: -140px; left: 50%; transform: translateX(-50%);
          background: rgba(243, 198, 106, 0.07);
          animation: oa 9s ease-in-out infinite;
        }
        
        .dj-orb-b {
          width: 280px; height: 280px; bottom: 10%; right: -3%;
          background: rgba(255, 217, 141, 0.05);
          animation: ob 11s 2s ease-in-out infinite;
        }
        
        .dj-orb-c {
          width: 240px; height: 240px; top: 30%; left: -4%;
          background: rgba(155, 122, 255, 0.05);
          animation: ob 10s 4s ease-in-out infinite;
        }
        
        @keyframes oa {
          0%, 100% { transform: translateX(-50%) scale(1); }
          50% { transform: translateX(-50%) scale(1.06); }
        }
        
        @keyframes ob {
          0%, 100% { transform: scale(1); }
          50% { transform: scale(1.09); }
        }

        /* Navigation */
        .dj-nav {
          position: fixed; top: 0; left: 0; right: 0; z-index: 100;
          display: flex; align-items: center; justify-content: space-between;
          padding: 0 2.5rem; height: 64px;
          background: rgba(10, 12, 18, 0.7);
          backdrop-filter: blur(24px);
          border-bottom: 1px solid var(--border);
          animation: djDown 0.5s cubic-bezier(0.2, 0.9, 0.3, 1.1) both;
        }
        
        @keyframes djDown {
          from { opacity: 0; transform: translateY(-16px); }
          to { opacity: 1; transform: none; }
        }

        .dj-logo {
          font-family: var(--font); font-size: 1.15rem; font-weight: 700;
          letter-spacing: -0.02em; color: var(--text);
          display: flex; align-items: center; gap: 7px;
          text-decoration: none;
        }
        
        .dj-logo-gem { color: var(--accent); filter: drop-shadow(0 0 6px rgba(243, 198, 106, 0.55)); font-size: 1.2rem; }
        
        .dj-nav-right { display: flex; align-items: center; gap: 12px; }
        .dj-nav-label { font-size: 0.82rem; color: var(--faint); }
        
        .dj-nav-solid {
          font-size: 0.85rem; font-weight: 600;
          padding: 7px 20px; border-radius: 40px;
          background: linear-gradient(135deg, var(--accent), var(--accent2));
          color: #111; text-decoration: none;
          transition: all 0.2s;
          box-shadow: 0 2px 12px rgba(243, 198, 106, 0.3);
        }
        
        .dj-nav-solid:hover { transform: translateY(-1px); box-shadow: 0 6px 20px rgba(243, 198, 106, 0.45); }

        /* Toast */
        .dj-toast {
          position: fixed; top: 80px; left: 50%; transform: translateX(-50%);
          z-index: 300; display: flex; align-items: center; gap: 10px;
          padding: 12px 22px; border-radius: 40px;
          font-size: 0.85rem; font-weight: 500;
          backdrop-filter: blur(16px);
          animation: toastIn 0.35s cubic-bezier(0.2, 0.9, 0.3, 1.1) both;
          white-space: nowrap;
        }
        
        @keyframes toastIn {
          from { opacity: 0; transform: translateX(-50%) translateY(-10px); }
          to { opacity: 1; transform: translateX(-50%) translateY(0); }
        }
        
        .dj-toast-success { background: rgba(16, 185, 129, 0.15); border: 1px solid rgba(16, 185, 129, 0.35); color: #6ee7b7; }
        .dj-toast-error { background: rgba(239, 68, 68, 0.15); border: 1px solid rgba(239, 68, 68, 0.35); color: #fca5a5; }
        .dj-toast-warning { background: rgba(245, 158, 11, 0.15); border: 1px solid rgba(245, 158, 11, 0.35); color: #fcd34d; }
        .dj-toast-icon { font-size: 1rem; line-height: 1; }

        /* Main Layout */
        .dj-main {
          position: relative; z-index: 10;
          min-height: 100vh;
          display: flex; align-items: center; justify-content: center;
          padding: 5.5rem 2rem 3rem;
          gap: 5rem;
        }

        /* Card */
        .dj-card {
          position: relative; overflow: hidden;
          width: 100%; max-width: 420px;
          background: rgba(17, 19, 24, 0.85);
          border: 1px solid var(--border);
          border-radius: 24px;
          padding: 2.5rem;
          backdrop-filter: blur(24px);
          box-shadow: 0 24px 60px rgba(0, 0, 0, 0.4), 0 0 0 1px rgba(243, 198, 106, 0.06);
          animation: cardIn 0.6s cubic-bezier(0.2, 0.9, 0.3, 1.1) 0.1s both;
        }
        
        @keyframes cardIn {
          from { opacity: 0; transform: translateY(28px); }
          to { opacity: 1; transform: none; }
        }

        .dj-card-glow {
          position: absolute; top: -60px; left: 50%; transform: translateX(-50%);
          width: 280px; height: 180px; border-radius: 50%; filter: blur(60px);
          background: rgba(243, 198, 106, 0.08); pointer-events: none;
        }

        .dj-card-head { margin-bottom: 2rem; position: relative; }
        .dj-card-eyebrow {
          font-size: 0.68rem; font-weight: 600; letter-spacing: 0.14em;
          text-transform: uppercase; color: var(--accent); margin-bottom: 0.6rem;
        }
        .dj-card-title {
          font-size: 1.55rem; font-weight: 700;
          letter-spacing: -0.025em; line-height: 1.2; margin-bottom: 0.5rem;
          color: var(--text);
        }
        .dj-card-sub {
          font-size: 0.85rem; color: var(--muted); font-weight: 400; line-height: 1.5;
        }

        /* Form */
        .dj-form { display: flex; flex-direction: column; gap: 1.1rem; position: relative; }
        .dj-field { display: flex; flex-direction: column; gap: 0.45rem; }
        .dj-label-row { display: flex; align-items: center; justify-content: space-between; }
        .dj-label { font-size: 0.78rem; font-weight: 500; color: var(--muted); letter-spacing: 0.01em; transition: color 0.2s; }
        .dj-field-focus .dj-label { color: var(--accent); }
        .dj-forgot { font-size: 0.75rem; color: var(--faint); text-decoration: none; transition: color 0.2s; }
        .dj-forgot:hover { color: var(--accent); }

        .dj-input-wrap {
          position: relative; display: flex; align-items: center;
        }
        
        .dj-input-icon {
          position: absolute; left: 13px; color: var(--faint);
          pointer-events: none; transition: color 0.2s;
        }
        .dj-field-focus .dj-input-icon { color: var(--accent); }

        .dj-input {
          width: 100%; font-family: var(--font); font-size: 0.9rem; font-weight: 400;
          color: var(--text);
          background: rgba(255, 255, 255, 0.04);
          border: 1px solid var(--border);
          border-radius: 10px;
          padding: 11px 42px 11px 40px;
          outline: none;
          transition: all 0.2s;
        }
        
        .dj-input::placeholder { color: var(--faint); font-size: 0.85rem; }
        .dj-input:focus {
          border-color: rgba(243, 198, 106, 0.5);
          background: rgba(243, 198, 106, 0.04);
          box-shadow: 0 0 0 3px rgba(243, 198, 106, 0.1);
        }

        .dj-eye {
          position: absolute; right: 12px;
          background: transparent; border: none; cursor: pointer;
          color: var(--faint); display: flex; align-items: center;
          transition: color 0.2s; padding: 2px;
        }
        .dj-eye:hover { color: var(--muted); }

        .dj-checkbox-wrap { margin: 0.2rem 0; }
        .dj-checkbox {
          display: flex; align-items: center; gap: 8px;
          font-size: 0.8rem; color: var(--muted); cursor: pointer;
        }
        .dj-checkbox input {
          width: 16px; height: 16px; cursor: pointer;
          accent-color: var(--accent);
        }

        /* Submit Button */
        .dj-submit {
          margin-top: 0.4rem;
          width: 100%; display: flex; align-items: center; justify-content: center; gap: 10px;
          font-family: var(--font); font-size: 0.95rem; font-weight: 600;
          padding: 13px 24px; border-radius: 48px;
          background: linear-gradient(135deg, var(--accent), var(--accent2));
          border: none; color: #111; cursor: pointer;
          transition: all 0.2s ease;
          box-shadow: 0 4px 20px rgba(243, 198, 106, 0.35);
          position: relative; overflow: hidden;
        }
        
        .dj-submit::before {
          content: ''; position: absolute; inset: 0;
          background: linear-gradient(135deg, rgba(255, 255, 255, 0.2), transparent);
          opacity: 0; transition: opacity 0.2s;
        }
        
        .dj-submit:hover:not(:disabled)::before { opacity: 1; }
        .dj-submit:hover:not(:disabled) { transform: translateY(-2px); box-shadow: 0 10px 28px rgba(243, 198, 106, 0.5); }
        .dj-submit:active:not(:disabled) { transform: translateY(0); }
        .dj-submit:disabled { opacity: 0.7; cursor: not-allowed; }

        /* Spinner */
        .dj-spinner {
          width: 16px; height: 16px; border-radius: 50%;
          border: 2px solid rgba(0, 0, 0, 0.2);
          border-top-color: #111;
          animation: spin 0.7s linear infinite;
        }
        
        @keyframes spin { to { transform: rotate(360deg); } }

        /* Divider */
        .dj-divider {
          text-align: center; margin: 1.5rem 0 1rem;
          position: relative; font-size: 0.75rem; color: var(--faint);
        }
        .dj-divider::before, .dj-divider::after {
          content: ''; position: absolute; top: 50%;
          width: calc(50% - 60px); height: 1px;
          background: rgba(255, 255, 255, 0.08);
        }
        .dj-divider::before { left: 0; }
        .dj-divider::after { right: 0; }

        /* Google Button */
        .dj-google-btn {
          width: 100%; display: flex; align-items: center; justify-content: center; gap: 12px;
          padding: 11px 24px; border-radius: 48px;
          background: rgba(255, 255, 255, 0.03);
          border: 1px solid var(--border);
          color: var(--text);
          font-family: var(--font); font-size: 0.9rem; font-weight: 500;
          cursor: pointer;
          transition: all 0.2s;
        }
        
        .dj-google-btn:hover {
          background: rgba(255, 255, 255, 0.06);
          border-color: rgba(243, 198, 106, 0.3);
          transform: translateY(-1px);
        }

        /* Card Footer */
        .dj-card-foot {
          margin-top: 1.75rem;
          text-align: center;
          font-size: 0.82rem; color: var(--faint);
          padding-top: 1.5rem;
          border-top: 1px solid rgba(255, 255, 255, 0.05);
        }
        
        .dj-card-link {
          color: var(--accent); text-decoration: none; font-weight: 500;
          transition: color 0.2s;
        }
        .dj-card-link:hover { color: #ffd98d; }

        /* Side Panel */
        .dj-side {
          flex: 1; max-width: 420px;
          animation: cardIn 0.6s cubic-bezier(0.2, 0.9, 0.3, 1.1) 0.2s both;
        }
        
        .dj-side-eyebrow {
          font-size: 0.68rem; font-weight: 600; letter-spacing: 0.14em;
          text-transform: uppercase; color: var(--accent); margin-bottom: 1rem;
        }
        
        .dj-side-title {
          font-size: clamp(2rem, 3.5vw, 2.8rem);
          font-weight: 800; line-height: 1.1; letter-spacing: -0.03em;
          margin-bottom: 1rem; color: var(--text);
        }
        
        .dj-side-sub {
          font-size: 0.9rem; color: var(--muted); line-height: 1.7;
          font-weight: 400; max-width: 340px; margin-bottom: 2.5rem;
        }
        
        .dj-side-stats {
          display: flex; gap: 0; background: var(--border); gap: 1px;
          border: 1px solid var(--border); border-radius: 16px; overflow: hidden;
        }
        
        .dj-side-stat {
          flex: 1; background: var(--surface);
          padding: 1.2rem 1rem; text-align: center;
          transition: background 0.2s;
        }
        
        .dj-side-stat:hover { background: rgba(243, 198, 106, 0.06); }
        
        .dj-side-stat-v {
          font-size: 1.5rem; font-weight: 800;
          letter-spacing: -0.02em; line-height: 1;
          background: linear-gradient(135deg, #fff, var(--accent2));
          -webkit-background-clip: text; -webkit-text-fill-color: transparent;
          margin-bottom: 0.3rem;
        }
        
        .dj-side-stat-l { font-size: 0.72rem; color: var(--muted); font-weight: 500; }

        /* Responsive */
        @media (max-width: 900px) {
          .dj-side { display: none; }
          .dj-main { justify-content: center; gap: 0; }
        }
        
        @media (max-width: 768px) {
          .dj-nav { padding: 0 1.25rem; height: 58px; }
          .dj-nav-label { display: none; }
          .dj-main { padding: 5rem 1.25rem 3rem; }
          .dj-card { padding: 2rem 1.5rem; }
        }
        
        @media (max-width: 420px) {
          .dj-card { border-radius: 18px; padding: 1.75rem 1.25rem; }
          .dj-card-title { font-size: 1.3rem; }
        }

        /* Reduced Motion */
        @media (prefers-reduced-motion: reduce) {
          .dj-orb, .dj-orb-a, .dj-orb-b, .dj-orb-c,
          .dj-nav, .dj-card, .dj-submit, .dj-google-btn {
            animation: none; transition: none;
          }
        }
      `}</style>
    </div>
  );
}