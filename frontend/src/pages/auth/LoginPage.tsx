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

  const handleGoogleLogin = () => {
    const GOOGLE_CLIENT_ID = "YOUR_GOOGLE_CLIENT_ID.apps.googleusercontent.com";
    const REDIRECT_URI = `${window.location.origin}/auth/google/callback`;
    const SCOPE = "email profile";
    
    const googleAuthUrl = `https://accounts.google.com/o/oauth2/v2/auth?client_id=${GOOGLE_CLIENT_ID}&redirect_uri=${REDIRECT_URI}&response_type=code&scope=${SCOPE}&access_type=offline&prompt=consent`;
    
    const width = 500;
    const height = 600;
    const left = window.screen.width / 2 - width / 2;
    const top = window.screen.height / 2 - height / 2;
    
    window.open(googleAuthUrl, "Google Login", `width=${width},height=${height},left=${left},top=${top}`);
    
    window.addEventListener("message", async (event) => {
      if (event.origin === window.location.origin && event.data.type === "GOOGLE_AUTH_SUCCESS") {
        try {
          setIsLoading(true);
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
    <div className="login-page">
      {/* Background Elements - Indigo Theme */}
      <div className="login-bg" />
      <div className="login-grid" />
      <div className="login-glow-1" />
      <div className="login-glow-2" />
      <div className="login-glow-3" />

      {/* Navigation - Matching Homepage */}
      <nav className="login-nav">
        <Link to="/" className="login-logo">
          <div className="login-logo-mark">⚖</div>
          <span className="login-logo-text">Decentralized Justice</span>
        </Link>
        <div className="login-nav-links">
          <Link to="/" className="login-nav-link">Home</Link>
          <Link to="/login" className="login-nav-link active">Login</Link>
          <Link to="/register" className="login-nav-link">Register</Link>
          <Link to="/dashboard" className="login-nav-link">Dashboard</Link>
          <Link to="/explorer" className="login-nav-link">Explorer</Link>
        </div>
        <div className="login-nav-actions">
          <Link to="/register" className="login-nav-btn">Get Started</Link>
        </div>
      </nav>

      {/* Toast Notification */}
      {toast && (
        <div className={`login-toast login-toast-${toast.type}`}>
          <span className="login-toast-icon">
            {toast.type === "success" ? "✓" : toast.type === "warning" ? "⚠" : "✕"}
          </span>
          <span>{toast.message}</span>
        </div>
      )}

      {/* Main Content - Two Column Layout */}
      <main className="login-main">
        {/* Left Column - Login Form */}
        <div className="login-left">
          <div className="login-card">
            <div className="login-card-inner">
              <div className="login-badge">Secure Access</div>
              <h1 className="login-title">
                Welcome Back
                <span className="login-title-highlight">to Justice Hub</span>
              </h1>
              <p className="login-subtitle">
                Access your dashboard, track cases, and manage investigations with blockchain-secured confidence.
              </p>

              <form className="login-form" onSubmit={handleSubmit}>
                <div className={`login-field ${focused === "email" ? "focused" : ""}`}>
                  <label className="login-label">Email address</label>
                  <div className="login-input-group">
                    <svg className="login-input-icon" width="18" height="18" viewBox="0 0 24 24" fill="none">
                      <path d="M4 4H20C21.1 4 22 4.9 22 6V18C22 19.1 21.1 20 20 20H4C2.9 20 2 19.1 2 18V6C2 4.9 2.9 4 4 4Z" stroke="currentColor" strokeWidth="1.5"/>
                      <path d="M22 6L12 13L2 6" stroke="currentColor" strokeWidth="1.5"/>
                    </svg>
                    <input
                      type="email"
                      name="email"
                      value={form.email}
                      onChange={handleChange}
                      onFocus={() => setFocused("email")}
                      onBlur={() => setFocused("")}
                      placeholder="iraj@gmail.com"
                      disabled={isLoading}
                    />
                  </div>
                </div>

                <div className={`login-field ${focused === "password" ? "focused" : ""}`}>
                  <div className="login-label-row">
                    <label className="login-label">Password</label>
                    <Link to="/forgot-password" className="login-forgot">Forgot password?</Link>
                  </div>
                  <div className="login-input-group">
                    <svg className="login-input-icon" width="18" height="18" viewBox="0 0 24 24" fill="none">
                      <path d="M12 15C13.6569 15 15 13.6569 15 12C15 10.3431 13.6569 9 12 9C10.3431 9 9 10.3431 9 12C9 13.6569 10.3431 15 12 15Z" stroke="currentColor" strokeWidth="1.5"/>
                      <path d="M19 12C17.5 16 15 18 12 18C9 18 6.5 16 5 12C6.5 8 9 6 12 6C15 6 17.5 8 19 12Z" stroke="currentColor" strokeWidth="1.5"/>
                    </svg>
                    <input
                      type={showPassword ? "text" : "password"}
                      name="password"
                      value={form.password}
                      onChange={handleChange}
                      onFocus={() => setFocused("password")}
                      onBlur={() => setFocused("")}
                      placeholder="Enter your password"
                      disabled={isLoading}
                    />
                    <button
                      type="button"
                      className="login-eye"
                      onClick={() => setShowPassword(!showPassword)}
                    >
                      {showPassword ? (
                        <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
                          <path d="M2 2L22 22M6.5 6.6C4.5 8.1 3 10 2 12C4 16 8 18 12 18C13.5 18 15 17.5 16.5 16.8M9.5 9.5C8.5 10.5 8 12 8 12C8 13.1 8.9 14 10 14C11 14 12.5 13.5 13.5 12.5M17.5 6.5C19 8 20 10 21 12C19.5 15.5 16 18 12 18C11 18 10 17.8 9 17.5" stroke="currentColor" strokeWidth="1.5"/>
                        </svg>
                      ) : (
                        <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
                          <path d="M12 15C13.6569 15 15 13.6569 15 12C15 10.3431 13.6569 9 12 9C10.3431 9 9 10.3431 9 12C9 13.6569 10.3431 15 12 15Z" stroke="currentColor" strokeWidth="1.5"/>
                          <path d="M19 12C17.5 16 15 18 12 18C9 18 6.5 16 5 12C6.5 8 9 6 12 6C15 6 17.5 8 19 12Z" stroke="currentColor" strokeWidth="1.5"/>
                        </svg>
                      )}
                    </button>
                  </div>
                </div>

                <label className="login-checkbox">
                  <input
                    type="checkbox"
                    checked={rememberMe}
                    onChange={(e) => setRememberMe(e.target.checked)}
                  />
                  <span>Remember me for 30 days</span>
                </label>

                <button type="submit" className="login-submit" disabled={isLoading}>
                  {isLoading ? (
                    <>
                      <span className="login-spinner" />
                      Signing in...
                    </>
                  ) : (
                    <>
                      Sign In
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <path d="M5 12H19M12 5L19 12L12 19" strokeLinecap="round"/>
                      </svg>
                    </>
                  )}
                </button>
              </form>

              <div className="login-divider">
                <span>or continue with</span>
              </div>

              <button className="login-google" onClick={handleGoogleLogin} disabled={isLoading}>
                <svg width="20" height="20" viewBox="0 0 24 24">
                  <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
                  <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
                  <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
                  <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
                </svg>
                Continue with Google
              </button>

              <div className="login-footer">
                <p>
                  Don't have an account?{" "}
                  <Link to="/register" className="login-footer-link">Create free account</Link>
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Right Column - Feature Panel */}
        <div className="login-right">
          <div className="login-feature">
            <div className="login-feature-badge">POWERED BY BLOCKCHAIN</div>
            <h2 className="login-feature-title">
              Justice reimagined<br />
              <span className="login-feature-highlight">with transparency</span>
            </h2>
            <p className="login-feature-text">
              Every case, evidence, and verdict is immutably recorded on the blockchain — ensuring tamper-proof justice delivery.
            </p>
            
            <div className="login-feature-stats">
              <div className="login-stat">
                <div className="login-stat-value">100%</div>
                <div className="login-stat-label">Traceable</div>
              </div>
              <div className="login-stat">
                <div className="login-stat-value">24/7</div>
                <div className="login-stat-label">Accessible</div>
              </div>
              <div className="login-stat">
                <div className="login-stat-value">256-bit</div>
                <div className="login-stat-label">Encrypted</div>
              </div>
            </div>

            <div className="login-feature-quote">
              <svg width="32" height="32" viewBox="0 0 24 24" fill="none">
                <path d="M10 11H6C4.9 11 4 11.9 4 13V17C4 18.1 4.9 19 6 19H10C11.1 19 12 18.1 12 17V13C12 11.9 11.1 11 10 11ZM10 11V7C10 5.9 10.9 5 12 5H14" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
                <path d="M20 11H16C14.9 11 14 11.9 14 13V17C14 18.1 14.9 19 16 19H20C21.1 19 22 18.1 22 17V13C22 11.9 21.1 11 20 11ZM20 11V7C20 5.9 20.9 5 22 5H24" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
              </svg>
              <p>"The most secure and transparent justice platform we've implemented. Blockchain integration ensures complete trust in the system."</p>
              <div className="login-feature-author">
                <strong>— Supreme Court Justice</strong>
                <span>Legal Technology Commission</span>
              </div>
            </div>
          </div>
        </div>
      </main>

      <style>{`
        /* Reset & Base - Indigo Theme */
        .login-page {
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
        .login-bg {
          position: fixed;
          inset: 0;
          background: radial-gradient(ellipse 70% 50% at 50% -20%, rgba(99, 102, 241, 0.08), transparent 60%);
          pointer-events: none;
          z-index: 0;
        }

        .login-grid {
          position: fixed;
          inset: 0;
          background-image: linear-gradient(rgba(99, 102, 241, 0.03) 1px, transparent 1px),
                          linear-gradient(90deg, rgba(99, 102, 241, 0.03) 1px, transparent 1px);
          background-size: 48px 48px;
          mask-image: radial-gradient(ellipse 80% 60% at 50% 40%, black 30%, transparent 80%);
          pointer-events: none;
          z-index: 0;
        }

        .login-glow-1, .login-glow-2, .login-glow-3 {
          position: fixed;
          border-radius: 50%;
          filter: blur(80px);
          pointer-events: none;
          z-index: 0;
        }

        .login-glow-1 {
          width: 500px;
          height: 500px;
          top: -150px;
          left: 50%;
          transform: translateX(-50%);
          background: radial-gradient(circle, rgba(99, 102, 241, 0.15), transparent);
          animation: float1 12s ease-in-out infinite;
        }

        .login-glow-2 {
          width: 350px;
          height: 350px;
          bottom: 10%;
          right: -5%;
          background: radial-gradient(circle, rgba(99, 102, 241, 0.1), transparent);
          animation: float2 15s ease-in-out infinite reverse;
        }

        .login-glow-3 {
          width: 300px;
          height: 300px;
          top: 40%;
          left: -8%;
          background: radial-gradient(circle, rgba(129, 140, 248, 0.08), transparent);
          animation: float3 18s ease-in-out infinite;
        }

        @keyframes float1 {
          0%, 100% { transform: translateX(-50%) scale(1); opacity: 0.5; }
          50% { transform: translateX(-50%) scale(1.05); opacity: 0.8; }
        }
        @keyframes float2 {
          0%, 100% { transform: scale(1); opacity: 0.4; }
          50% { transform: scale(1.08); opacity: 0.7; }
        }
        @keyframes float3 {
          0%, 100% { transform: translate(0, 0) scale(1); opacity: 0.3; }
          50% { transform: translate(20px, -20px) scale(1.05); opacity: 0.6; }
        }

        /* Navigation - Matching Homepage */
        .login-nav {
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

        .login-logo {
          display: flex;
          align-items: center;
          gap: 10px;
          text-decoration: none;
          transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
        }

        .login-logo:hover {
          transform: translateY(-1px);
        }

        .login-logo-mark {
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

        .login-logo:hover .login-logo-mark {
          box-shadow: 0 0 12px rgba(99, 102, 241, 0.4);
          transform: scale(1.02);
        }

        .login-logo-text {
          font-family: 'Syne', 'Inter', system-ui, sans-serif;
          background: linear-gradient(135deg, #e8ecf8, #818cf8);
          -webkit-background-clip: text;
          -webkit-text-fill-color: transparent;
          background-clip: text;
          font-weight: 800;
          font-size: 1.1rem;
          letter-spacing: -0.3px;
        }

        .login-nav-links {
          display: flex;
          gap: 2rem;
        }

        .login-nav-link {
          text-decoration: none;
          color: #7a849c;
          font-size: 0.83rem;
          font-weight: 500;
          letter-spacing: 0.2px;
          transition: color 0.2s;
        }

        .login-nav-link:hover,
        .login-nav-link.active {
          color: #e8ecf8;
        }

        .login-nav-btn {
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

        .login-nav-btn:hover {
          transform: translateY(-2px);
          box-shadow: 0 4px 12px rgba(99, 102, 241, 0.3);
        }

        /* Toast */
        .login-toast {
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

        .login-toast-success { border-color: rgba(99, 102, 241, 0.4); color: #818cf8; }
        .login-toast-error { border-color: rgba(239, 68, 68, 0.4); color: #f87171; }

        /* Main Layout - Two Columns */
        .login-main {
          position: relative;
          z-index: 10;
          min-height: 100vh;
          display: grid;
          grid-template-columns: 1fr 1fr;
          align-items: center;
          padding: 100px 3rem 3rem;
          gap: 3rem;
        }

        /* Left Column - Login Card */
        .login-left {
          display: flex;
          justify-content: flex-end;
        }

        .login-card {
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

        .login-card-inner {
          padding: 2.5rem;
        }

        .login-badge {
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

        .login-title {
          font-size: 2rem;
          font-weight: 700;
          letter-spacing: -0.02em;
          line-height: 1.2;
          margin-bottom: 0.75rem;
          color: #e8ecf8;
        }

        .login-title-highlight {
          display: block;
          background: linear-gradient(135deg, #6366f1, #818cf8);
          -webkit-background-clip: text;
          -webkit-text-fill-color: transparent;
          background-clip: text;
        }

        .login-subtitle {
          font-size: 0.88rem;
          color: #7a849c;
          line-height: 1.6;
          margin-bottom: 2rem;
        }

        /* Form */
        .login-form {
          display: flex;
          flex-direction: column;
          gap: 1.25rem;
        }

        .login-field {
          display: flex;
          flex-direction: column;
          gap: 0.5rem;
        }

        .login-label-row {
          display: flex;
          justify-content: space-between;
          align-items: center;
        }

        .login-label {
          font-size: 0.78rem;
          font-weight: 500;
          color: #7a849c;
          letter-spacing: 0.5px;
        }

        .login-field.focused .login-label {
          color: #6366f1;
        }

        .login-forgot {
          font-size: 0.7rem;
          color: #3d4459;
          text-decoration: none;
          transition: color 0.2s;
        }

        .login-forgot:hover {
          color: #818cf8;
        }

        .login-input-group {
          position: relative;
          display: flex;
          align-items: center;
        }

        .login-input-icon {
          position: absolute;
          left: 14px;
          color: #3d4459;
        }

        .login-field.focused .login-input-icon {
          color: #6366f1;
        }

        .login-input-group input {
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

        .login-input-group input:focus {
          border-color: #6366f1;
          background: rgba(99, 102, 241, 0.05);
          box-shadow: 0 0 0 3px rgba(99, 102, 241, 0.1);
        }

        .login-input-group input::placeholder {
          color: #3d4459;
        }

        .login-eye {
          position: absolute;
          right: 14px;
          background: transparent;
          border: none;
          cursor: pointer;
          color: #3d4459;
          display: flex;
          padding: 4px;
        }

        .login-eye:hover {
          color: #818cf8;
        }

        .login-checkbox {
          display: flex;
          align-items: center;
          gap: 10px;
          font-size: 0.78rem;
          color: #7a849c;
          cursor: pointer;
          margin: 0.25rem 0;
        }

        .login-checkbox input {
          width: 16px;
          height: 16px;
          cursor: pointer;
          accent-color: #6366f1;
        }

        .login-submit {
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
          margin-top: 0.5rem;
        }

        .login-submit:hover:not(:disabled) {
          transform: translateY(-2px);
          box-shadow: 0 6px 20px rgba(99, 102, 241, 0.4);
        }

        .login-submit:disabled {
          opacity: 0.7;
          cursor: not-allowed;
        }

        .login-spinner {
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

        .login-divider {
          text-align: center;
          margin: 1.5rem 0;
          position: relative;
          font-size: 0.72rem;
          color: #3d4459;
        }

        .login-divider::before,
        .login-divider::after {
          content: '';
          position: absolute;
          top: 50%;
          width: calc(50% - 70px);
          height: 1px;
          background: linear-gradient(90deg, transparent, rgba(99, 102, 241, 0.2), transparent);
        }

        .login-divider::before { left: 0; }
        .login-divider::after { right: 0; }

        .login-google {
          width: 100%;
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 12px;
          padding: 11px 20px;
          background: rgba(255, 255, 255, 0.03);
          border: 1px solid rgba(255, 255, 255, 0.07);
          border-radius: 6px;
          font-family: inherit;
          font-size: 0.85rem;
          font-weight: 500;
          color: #e8ecf8;
          cursor: pointer;
          transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
        }

        .login-google:hover:not(:disabled) {
          background: rgba(99, 102, 241, 0.08);
          border-color: rgba(99, 102, 241, 0.3);
          transform: translateY(-1px);
        }

        .login-footer {
          margin-top: 1.75rem;
          text-align: center;
          padding-top: 1.5rem;
          border-top: 1px solid rgba(255, 255, 255, 0.05);
          font-size: 0.8rem;
          color: #7a849c;
        }

        .login-footer-link {
          color: #818cf8;
          text-decoration: none;
          font-weight: 500;
        }

        .login-footer-link:hover {
          color: #6366f1;
        }

        /* Right Column - Feature Panel */
        .login-right {
          display: flex;
          align-items: center;
        }

        .login-feature {
          max-width: 460px;
          animation: sideReveal 0.6s ease-out 0.2s both;
        }

        @keyframes sideReveal {
          from { opacity: 0; transform: translateX(20px); }
          to { opacity: 1; transform: translateX(0); }
        }

        .login-feature-badge {
          font-size: 0.65rem;
          font-weight: 600;
          letter-spacing: 3px;
          color: #818cf8;
          margin-bottom: 1.5rem;
          font-family: 'DM Mono', monospace;
        }

        .login-feature-title {
          font-size: 2.5rem;
          font-weight: 800;
          line-height: 1.15;
          letter-spacing: -0.03em;
          margin-bottom: 1.25rem;
          font-family: 'Syne', sans-serif;
        }

        .login-feature-highlight {
          background: linear-gradient(135deg, #6366f1, #818cf8);
          -webkit-background-clip: text;
          -webkit-text-fill-color: transparent;
          background-clip: text;
        }

        .login-feature-text {
          font-size: 0.95rem;
          color: #7a849c;
          line-height: 1.75;
          margin-bottom: 2rem;
        }

        .login-feature-stats {
          display: flex;
          background: rgba(255, 255, 255, 0.02);
          border: 1px solid rgba(255, 255, 255, 0.07);
          border-radius: 10px;
          overflow: hidden;
          margin-bottom: 2rem;
        }

        .login-stat {
          flex: 1;
          text-align: center;
          padding: 1rem;
          transition: all 0.3s ease;
        }

        .login-stat:hover {
          background: rgba(99, 102, 241, 0.05);
        }

        .login-stat-value {
          font-size: 1.4rem;
          font-weight: 800;
          background: linear-gradient(135deg, #e8ecf8, #818cf8);
          -webkit-background-clip: text;
          -webkit-text-fill-color: transparent;
          background-clip: text;
          margin-bottom: 0.25rem;
          font-family: 'DM Mono', monospace;
        }

        .login-stat-label {
          font-size: 0.68rem;
          color: #3d4459;
          font-weight: 500;
          letter-spacing: 1px;
        }

        .login-feature-quote {
          background: rgba(255, 255, 255, 0.02);
          border-left: 2px solid #6366f1;
          padding: 1.5rem;
          border-radius: 10px;
        }

        .login-feature-quote svg {
          color: #6366f1;
          margin-bottom: 1rem;
          opacity: 0.6;
        }

        .login-feature-quote p {
          font-size: 0.88rem;
          line-height: 1.7;
          color: #7a849c;
          margin-bottom: 1rem;
          font-style: italic;
        }

        .login-feature-author strong {
          display: block;
          color: #e8ecf8;
          font-size: 0.83rem;
          margin-bottom: 0.25rem;
        }

        .login-feature-author span {
          font-size: 0.68rem;
          color: #3d4459;
        }

        /* Responsive */
        @media (max-width: 1024px) {
          .login-main {
            grid-template-columns: 1fr;
            padding: 90px 2rem 2rem;
            gap: 2rem;
          }
          .login-left {
            justify-content: center;
          }
          .login-right {
            justify-content: center;
          }
          .login-feature {
            text-align: center;
          }
          .login-feature-stats {
            justify-content: center;
          }
          .login-feature-quote {
            text-align: left;
          }
        }

        @media (max-width: 768px) {
          .login-nav {
            padding: 0 1.5rem;
          }
          .login-nav-links {
            display: none;
          }
          .login-main {
            padding: 80px 1.25rem 2rem;
          }
          .login-card-inner {
            padding: 1.75rem;
          }
          .login-title {
            font-size: 1.6rem;
          }
          .login-feature-title {
            font-size: 1.8rem;
          }
        }

        @media (prefers-reduced-motion: reduce) {
          .login-glow-1, .login-glow-2, .login-glow-3,
          .login-nav, .login-card, .login-feature {
            animation: none;
          }
        }
      `}</style>
    </div>
  );
}