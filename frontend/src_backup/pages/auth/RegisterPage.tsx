// frontend/src/pages/auth/RegisterPage.tsx
import { FormEvent, useMemo, useState, useEffect, useRef } from "react";
import { Link, useNavigate } from "react-router-dom";
import type { UserRole } from "../../app/roleConfig";
import { RESTRICTED_ROLES } from "../../app/roleConfig";
import { register } from "../../shared/services/auth";

const ROLE_OPTIONS: UserRole[] = [
  "PUBLIC_USER",
  "INVESTIGATOR",
  "FORENSIC_ANALYST",
  "COURT",
  "PUBLIC_AUDITOR",
];

export function RegisterPage() {
  const navigate = useNavigate();
  const [form, setForm] = useState({
    fullName: "",
    email: "",
    password: "",
    role: "PUBLIC_USER" as UserRole,
    onboardingCode: "",
    phoneNumber: "",
    address: "",
    city: "",
    district: "",
  });
  const [isLoading, setIsLoading] = useState(false);
  const [toast, setToast] = useState<{ message: string; type: string } | null>(null);
  const [showPassword, setShowPassword] = useState(false);
  const [focused, setFocused] = useState("");
  const [agreeToTerms, setAgreeToTerms] = useState(false);
  const toastTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const showToast = (message: string, type: string = "error") => {
    setToast({ message, type });
    if (toastTimer.current) clearTimeout(toastTimer.current);
    toastTimer.current = setTimeout(() => setToast(null), 5000);
  };

  useEffect(() => {
    document.title = "Create Account | Decentralized Justice";
    return () => {
      if (toastTimer.current) clearTimeout(toastTimer.current);
    };
  }, []);

  const needsOnboarding = useMemo(
    () => RESTRICTED_ROLES.includes(form.role),
    [form.role]
  );

  const getOnboardingHint = () => {
    if (form.role === "INVESTIGATOR") return "Enter: POLICE-2026";
    if (form.role === "FORENSIC_ANALYST") return "Enter: LAB-2026";
    if (form.role === "COURT") return "Enter: JUDGE-2026";
    return "";
  };

  const getRoleIcon = (role: UserRole) => {
    switch (role) {
      case "PUBLIC_USER": return "👥";
      case "INVESTIGATOR": return "👮";
      case "FORENSIC_ANALYST": return "🔬";
      case "COURT": return "⚖️";
      case "PUBLIC_AUDITOR": return "📊";
      default: return "👤";
    }
  };

  const getRoleDescription = (role: UserRole) => {
    switch (role) {
      case "PUBLIC_USER": return "File complaints, track cases, and upload evidence";
      case "INVESTIGATOR": return "Manage investigations and gather evidence";
      case "FORENSIC_ANALYST": return "Analyze evidence and generate secure reports";
      case "COURT": return "Review cases and deliver judgments";
      case "PUBLIC_AUDITOR": return "Audit system transparency and compliance";
      default: return "Select your role in the justice system";
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    setForm(prev => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    
    if (!form.fullName || !form.email || !form.password) {
      showToast("Please fill in all required fields.", "error");
      return;
    }

    if (!agreeToTerms) {
      showToast("Please agree to the Terms of Service.", "error");
      return;
    }

    if (form.password.length < 6) {
      showToast("Password must be at least 6 characters long.", "error");
      return;
    }

    setIsLoading(true);
    try {
      await register({
        full_name: form.fullName,
        email: form.email,
        password: form.password,
        role: form.role,
        onboarding_code: form.onboardingCode || undefined,
        phone_number: form.phoneNumber,
        address: form.address,
        city: form.city,
        district: form.district,
      });
      showToast("Account created successfully! Redirecting...", "success");
      setTimeout(() => navigate("/app"), 600);
    } catch (err) {
      setIsLoading(false);
      const errorMessage = err instanceof Error ? err.message : "Registration failed. Please try again.";
      showToast(errorMessage, "error");
    }
  };

  // Password strength validation
  const validatePassword = (password: string) => {
    const hasMinLength = password.length >= 6;
    return {
      isValid: hasMinLength,
      hasMinLength,
    };
  };

  const passwordValidation = validatePassword(form.password);
  const showPasswordStrength = form.password.length > 0;

  return (
    <div className="reg-root">
      {/* Background Elements */}
      <div className="reg-bg" />
      <div className="reg-grid" />
      <div className="reg-orb reg-orb-a" />
      <div className="reg-orb reg-orb-b" />
      <div className="reg-orb reg-orb-c" />

      {/* Navigation */}
      <nav className="reg-nav">
        <Link to="/" className="reg-logo">
          <span className="reg-logo-gem">⚖</span>
          Decentralized Justice
        </Link>
        <div className="reg-nav-right">
          <span className="reg-nav-label">Already have an account?</span>
          <Link to="/login" className="reg-nav-solid">Sign In</Link>
        </div>
      </nav>

      {/* Toast Notification */}
      {toast && (
        <div className={`reg-toast reg-toast-${toast.type}`}>
          <span className="reg-toast-icon">
            {toast.type === "success" ? "✓" : toast.type === "warning" ? "⚠" : "✕"}
          </span>
          {toast.message}
        </div>
      )}

      {/* Main Content */}
      <main className="reg-main">
        {/* Register Card */}
        <div className="reg-card">
          <div className="reg-card-glow" />
          
          <div className="reg-card-head">
            <div className="reg-card-eyebrow">Get started</div>
            <h1 className="reg-card-title">
              Create your<br />
              <span className="reg-grad">Justice Account</span>
            </h1>
            <p className="reg-card-sub">
              Join Pakistan's first blockchain-powered justice ecosystem.
            </p>
          </div>

          <form className="reg-form" onSubmit={handleSubmit} noValidate>
            {/* Full Name */}
            <div className={`reg-field ${focused === "fullName" ? "reg-field-focus" : ""}`}>
              <label className="reg-label" htmlFor="fullName">Full name *</label>
              <div className="reg-input-wrap">
                <svg className="reg-input-icon" width="16" height="16" viewBox="0 0 16 16" fill="none">
                  <path d="M13 14v-1.5a3.5 3.5 0 00-7 0V14M8 8a3 3 0 100-6 3 3 0 000 6z" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round"/>
                </svg>
                <input
                  id="fullName"
                  name="fullName"
                  type="text"
                  autoComplete="name"
                  value={form.fullName}
                  onChange={handleChange}
                  onFocus={() => setFocused("fullName")}
                  onBlur={() => setFocused("")}
                  className="reg-input"
                  placeholder="Enter your full name"
                  disabled={isLoading}
                  required
                />
              </div>
            </div>

            {/* Email */}
            <div className={`reg-field ${focused === "email" ? "reg-field-focus" : ""}`}>
              <label className="reg-label" htmlFor="email">Email address *</label>
              <div className="reg-input-wrap">
                <svg className="reg-input-icon" width="16" height="16" viewBox="0 0 16 16" fill="none">
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
                  className="reg-input"
                  placeholder="you@example.com"
                  disabled={isLoading}
                  required
                />
              </div>
            </div>

            {/* Role Selection */}
            <div className={`reg-field ${focused === "role" ? "reg-field-focus" : ""}`}>
              <label className="reg-label" htmlFor="role">Select your role *</label>
              <div className="reg-input-wrap">
                <svg className="reg-input-icon" width="16" height="16" viewBox="0 0 16 16" fill="none">
                  <circle cx="5" cy="5" r="3" stroke="currentColor" strokeWidth="1.3"/>
                  <circle cx="11" cy="5" r="3" stroke="currentColor" strokeWidth="1.3"/>
                  <path d="M1 13v-1a3 3 0 013-3h2a3 3 0 013 3v1M9 13v-1a3 3 0 013-3h2a3 3 0 013 3v1" stroke="currentColor" strokeWidth="1.3"/>
                </svg>
                <select
                  id="role"
                  name="role"
                  value={form.role}
                  onChange={handleChange}
                  onFocus={() => setFocused("role")}
                  onBlur={() => setFocused("")}
                  className="reg-select"
                  disabled={isLoading}
                  required
                >
                  {ROLE_OPTIONS.map((item) => (
                    <option key={item} value={item}>
                      {getRoleIcon(item)} {item.replace(/_/g, " ")}
                    </option>
                  ))}
                </select>
                <div className="reg-select-arrow">
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <polyline points="6 9 12 15 18 9" />
                  </svg>
                </div>
              </div>
              <div className="reg-role-description">
                {getRoleDescription(form.role)}
              </div>
            </div>

            {/* Password */}
            <div className={`reg-field ${focused === "password" ? "reg-field-focus" : ""}`}>
              <label className="reg-label" htmlFor="password">Password *</label>
              <div className="reg-input-wrap">
                <svg className="reg-input-icon" width="16" height="16" viewBox="0 0 16 16" fill="none">
                  <rect x="3" y="7" width="10" height="7" rx="1.5" stroke="currentColor" strokeWidth="1.3"/>
                  <path d="M5 7V5a3 3 0 016 0v2" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round"/>
                </svg>
                <input
                  id="password"
                  name="password"
                  type={showPassword ? "text" : "password"}
                  autoComplete="new-password"
                  value={form.password}
                  onChange={handleChange}
                  onFocus={() => setFocused("password")}
                  onBlur={() => setFocused("")}
                  className="reg-input"
                  placeholder="Choose a strong password"
                  disabled={isLoading}
                  required
                />
                <button
                  type="button"
                  className="reg-eye"
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
              {/* Password Strength Indicator */}
              {showPasswordStrength && (
                <div className="reg-password-strength">
                  <div className="reg-strength-bars">
                    <div className={`reg-strength-bar ${passwordValidation.hasMinLength ? "active" : ""}`} />
                    <div className={`reg-strength-bar ${form.password.length >= 6 ? "active" : ""}`} />
                  </div>
                  <div className="reg-strength-text">
                    {passwordValidation.isValid ? (
                      <span className="reg-strength-valid">✓ Password strength: Good</span>
                    ) : (
                      <span>Minimum 6 characters required</span>
                    )}
                  </div>
                </div>
              )}
            </div>

            {/* Onboarding Code for Restricted Roles */}
            {needsOnboarding && (
              <div className={`reg-field ${focused === "onboardingCode" ? "reg-field-focus" : ""}`}>
                <label className="reg-label" htmlFor="onboardingCode">
                  Onboarding Code *
                </label>
                <div className="reg-input-wrap">
                  <svg className="reg-input-icon" width="16" height="16" viewBox="0 0 16 16" fill="none">
                    <rect x="2" y="4" width="12" height="8" rx="1" stroke="currentColor" strokeWidth="1.3"/>
                    <path d="M5 7h6M8 7v4" stroke="currentColor" strokeWidth="1.3"/>
                  </svg>
                  <input
                    id="onboardingCode"
                    name="onboardingCode"
                    type="text"
                    value={form.onboardingCode}
                    onChange={handleChange}
                    onFocus={() => setFocused("onboardingCode")}
                    onBlur={() => setFocused("")}
                    className="reg-input"
                    placeholder={getOnboardingHint()}
                    disabled={isLoading}
                    required
                  />
                </div>
                <div className="reg-hint-warning">
                  ⚠️ Restricted roles require valid verification code
                </div>
              </div>
            )}

            {/* Phone */}
            <div className={`reg-field ${focused === "phoneNumber" ? "reg-field-focus" : ""}`}>
              <label className="reg-label" htmlFor="phoneNumber">Phone number</label>
              <div className="reg-input-wrap">
                <svg className="reg-input-icon" width="16" height="16" viewBox="0 0 16 16" fill="none">
                  <path d="M3 1h3l1.5 3L6 5.5 4.5 7c1 1.5 2 2.5 3.5 3.5L9 10l2.5 1.5v3l-2 .5C4 15 1 12 1 5.5L3 1z" stroke="currentColor" strokeWidth="1.3"/>
                </svg>
                <input
                  id="phoneNumber"
                  name="phoneNumber"
                  type="tel"
                  autoComplete="tel"
                  value={form.phoneNumber}
                  onChange={handleChange}
                  onFocus={() => setFocused("phoneNumber")}
                  onBlur={() => setFocused("")}
                  className="reg-input"
                  placeholder="0300-1234567"
                  disabled={isLoading}
                />
              </div>
            </div>

            {/* Address Fields - 2 Column Grid */}
            <div className="reg-row-2">
              <div className={`reg-field ${focused === "city" ? "reg-field-focus" : ""}`}>
                <label className="reg-label" htmlFor="city">City</label>
                <div className="reg-input-wrap">
                  <input
                    id="city"
                    name="city"
                    type="text"
                    value={form.city}
                    onChange={handleChange}
                    onFocus={() => setFocused("city")}
                    onBlur={() => setFocused("")}
                    className="reg-input"
                    placeholder="Your city"
                    disabled={isLoading}
                  />
                </div>
              </div>

              <div className={`reg-field ${focused === "district" ? "reg-field-focus" : ""}`}>
                <label className="reg-label" htmlFor="district">District</label>
                <div className="reg-input-wrap">
                  <input
                    id="district"
                    name="district"
                    type="text"
                    value={form.district}
                    onChange={handleChange}
                    onFocus={() => setFocused("district")}
                    onBlur={() => setFocused("")}
                    className="reg-input"
                    placeholder="Your district"
                    disabled={isLoading}
                  />
                </div>
              </div>
            </div>

            {/* Address */}
            <div className={`reg-field ${focused === "address" ? "reg-field-focus" : ""}`}>
              <label className="reg-label" htmlFor="address">Address</label>
              <div className="reg-input-wrap">
                <svg className="reg-input-icon" width="16" height="16" viewBox="0 0 16 16" fill="none">
                  <path d="M8 1C5.2 1 3 3.2 3 6c0 3 5 9 5 9s5-6 5-9c0-2.8-2.2-5-5-5z" stroke="currentColor" strokeWidth="1.3"/>
                  <circle cx="8" cy="6" r="2" stroke="currentColor" strokeWidth="1.3"/>
                </svg>
                <input
                  id="address"
                  name="address"
                  type="text"
                  autoComplete="street-address"
                  value={form.address}
                  onChange={handleChange}
                  onFocus={() => setFocused("address")}
                  onBlur={() => setFocused("")}
                  className="reg-input"
                  placeholder="Your complete address"
                  disabled={isLoading}
                />
              </div>
            </div>

            {/* Terms and Conditions */}
            <div className="reg-checkbox-wrap">
              <label className="reg-checkbox">
                <input
                  type="checkbox"
                  checked={agreeToTerms}
                  onChange={(e) => setAgreeToTerms(e.target.checked)}
                  disabled={isLoading}
                />
                <span>
                  I agree to the{" "}
                  <Link to="/terms" className="reg-link">Terms of Service</Link>
                  {" "}and{" "}
                  <Link to="/privacy" className="reg-link">Privacy Policy</Link>
                </span>
              </label>
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              className={`reg-submit ${isLoading ? "reg-submit-loading" : ""}`}
              disabled={isLoading}
            >
              {isLoading ? (
                <>
                  <span className="reg-spinner" />
                  Creating account…
                </>
              ) : (
                <>
                  Create Account
                  <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
                    <path d="M2.5 7h9M8 3.5l3.5 3.5L8 10.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                  </svg>
                </>
              )}
            </button>
          </form>

          {/* Footer Link */}
          <div className="reg-card-foot">
            Already have an account?{" "}
            <Link to="/login" className="reg-card-link">Sign in instead</Link>
          </div>
        </div>

        {/* Side Panel - Perfect alignment like sample */}
        <div className="reg-side">
          <div className="reg-side-content">
            <div className="reg-side-eyebrow">Why join us?</div>
            <h2 className="reg-side-title">
              Join the future of<br />
              <span className="reg-grad">Justice System</span>
            </h2>
            <p className="reg-side-sub">
              Blockchain-verified records, transparent case tracking, and secure digital signatures — all in one unified platform.
            </p>
            <div className="reg-side-stats">
              <div className="reg-side-stat">
                <div className="reg-side-stat-v">100%</div>
                <div className="reg-side-stat-l">Transparent</div>
              </div>
              <div className="reg-side-stat">
                <div className="reg-side-stat-v">24/7</div>
                <div className="reg-side-stat-l">Access</div>
              </div>
              <div className="reg-side-stat">
                <div className="reg-side-stat-v">256-bit</div>
                <div className="reg-side-stat-l">Encryption</div>
              </div>
              <div className="reg-side-stat">
                <div className="reg-side-stat-v">10x</div>
                <div className="reg-side-stat-l">Faster</div>
              </div>
            </div>
          </div>
        </div>
      </main>

      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Syne:wght@500;600;700;800&family=Inter:wght@300;400;500;600;700&display=swap');

        .reg-root {
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
          --fd: 'Syne', sans-serif;
          --fb: 'Inter', sans-serif;
          --success: #10b981;
          --error: #ef4444;
        }

        *, *::before, *::after { margin: 0; padding: 0; box-sizing: border-box; }
        html { scroll-behavior: smooth; }

        .reg-root {
          font-family: var(--fb);
          background: var(--bg);
          color: var(--text);
          min-height: 100vh;
          overflow-x: hidden;
          -webkit-font-smoothing: antialiased;
        }

        .reg-grad {
          background: linear-gradient(135deg, var(--accent) 0%, var(--accent2) 60%, var(--violet) 100%);
          -webkit-background-clip: text;
          -webkit-text-fill-color: transparent;
          background-clip: text;
        }

        /* Background */
        .reg-bg {
          position: fixed; inset: 0; z-index: 0;
          background:
            radial-gradient(ellipse 60% 45% at 50% -5%, rgba(243, 198, 106, 0.13) 0%, transparent 60%),
            radial-gradient(ellipse 40% 30% at 90% 70%, rgba(255, 217, 141, 0.06) 0%, transparent 55%),
            radial-gradient(ellipse 40% 30% at 10% 80%, rgba(155, 122, 255, 0.06) 0%, transparent 55%);
        }
        .reg-grid {
          position: fixed; inset: 0; z-index: 0;
          background-image:
            linear-gradient(rgba(243, 198, 106, 0.03) 1px, transparent 1px),
            linear-gradient(90deg, rgba(243, 198, 106, 0.03) 1px, transparent 1px);
          background-size: 48px 48px;
          mask-image: radial-gradient(ellipse 80% 70% at 50% 40%, black 20%, transparent 80%);
        }
        .reg-orb {
          position: fixed; border-radius: 50%; filter: blur(90px);
          pointer-events: none; z-index: 0;
        }
        .reg-orb-a {
          width: 460px; height: 460px; top: -140px; left: 50%;
          transform: translateX(-50%);
          background: rgba(243, 198, 106, 0.09);
          animation: orbA 9s ease-in-out infinite;
        }
        .reg-orb-b {
          width: 280px; height: 280px; bottom: 10%; right: -3%;
          background: rgba(255, 217, 141, 0.06);
          animation: orbB 11s 2s ease-in-out infinite;
        }
        .reg-orb-c {
          width: 240px; height: 240px; top: 30%; left: -4%;
          background: rgba(155, 122, 255, 0.06);
          animation: orbB 10s 4s ease-in-out infinite;
        }
        @keyframes orbA {
          0%, 100% { transform: translateX(-50%) scale(1); }
          50% { transform: translateX(-50%) scale(1.06); }
        }
        @keyframes orbB {
          0%, 100% { transform: scale(1); }
          50% { transform: scale(1.09); }
        }

        /* Nav */
        .reg-nav {
          position: fixed; top: 0; left: 0; right: 0; z-index: 100;
          display: flex; align-items: center; justify-content: space-between;
          padding: 0 2.5rem; height: 64px;
          background: rgba(10, 12, 18, 0.7);
          backdrop-filter: blur(24px);
          border-bottom: 1px solid var(--border);
          animation: navDown 0.5s cubic-bezier(.2, .9, .3, 1.1) both;
        }
        @keyframes navDown {
          from { opacity: 0; transform: translateY(-16px); }
          to { opacity: 1; transform: none; }
        }
        .reg-logo {
          font-family: var(--fd); font-size: 1.15rem; font-weight: 700;
          letter-spacing: -0.02em; color: var(--text);
          display: flex; align-items: center; gap: 7px;
          text-decoration: none;
        }
        .reg-logo-gem {
          color: var(--accent);
          filter: drop-shadow(0 0 6px rgba(243, 198, 106, 0.55));
        }
        .reg-nav-right {
          display: flex; align-items: center; gap: 12px;
        }
        .reg-nav-label {
          font-size: 0.82rem; color: var(--faint);
        }
        .reg-nav-solid {
          font-size: 0.85rem; font-weight: 600;
          padding: 7px 20px; border-radius: 40px;
          background: linear-gradient(135deg, var(--accent), var(--accent2));
          color: #111; text-decoration: none;
          transition: all 0.2s;
          box-shadow: 0 2px 12px rgba(243, 198, 106, 0.3);
        }
        .reg-nav-solid:hover {
          transform: translateY(-1px);
          box-shadow: 0 6px 20px rgba(243, 198, 106, 0.45);
        }

        /* Toast */
        .reg-toast {
          position: fixed; top: 80px; left: 50%; transform: translateX(-50%);
          z-index: 300; display: flex; align-items: center; gap: 10px;
          padding: 12px 24px; border-radius: 48px;
          font-size: 0.85rem; font-weight: 500;
          backdrop-filter: blur(16px);
          animation: toastIn 0.35s cubic-bezier(.2, .9, .3, 1.1) both;
          white-space: nowrap;
        }
        @keyframes toastIn {
          from { opacity: 0; transform: translateX(-50%) translateY(-12px); }
          to { opacity: 1; transform: translateX(-50%) translateY(0); }
        }
        .reg-toast-success {
          background: rgba(16, 185, 129, 0.15);
          border: 1px solid rgba(16, 185, 129, 0.35);
          color: #6ee7b7;
        }
        .reg-toast-error {
          background: rgba(239, 68, 68, 0.15);
          border: 1px solid rgba(239, 68, 68, 0.35);
          color: #fca5a5;
        }
        .reg-toast-warning {
          background: rgba(245, 158, 11, 0.15);
          border: 1px solid rgba(245, 158, 11, 0.35);
          color: #fcd34d;
        }
        .reg-toast-icon {
          font-size: 1rem; line-height: 1;
        }

        /* Main Layout */
        .reg-main {
          position: relative; z-index: 10;
          min-height: 100vh;
          display: flex;
          align-items: center;
          justify-content: center;
          padding: 5.5rem 2rem 3rem;
          gap: 5rem;
        }

        /* Card */
        .reg-card {
          position: relative; overflow: hidden;
          width: 100%; max-width: 480px;
          background: rgba(17, 19, 24, 0.85);
          border: 1px solid var(--border);
          border-radius: 28px;
          padding: 2.5rem;
          backdrop-filter: blur(24px);
          box-shadow: 0 24px 60px rgba(0, 0, 0, 0.4), 0 0 0 1px rgba(243, 198, 106, 0.06);
          animation: cardIn 0.6s cubic-bezier(.2, .9, .3, 1.1) 0.1s both;
        }
        @keyframes cardIn {
          from { opacity: 0; transform: translateY(28px); }
          to { opacity: 1; transform: none; }
        }
        .reg-card-glow {
          position: absolute; top: -60px; left: 50%; transform: translateX(-50%);
          width: 280px; height: 180px; border-radius: 50%; filter: blur(60px);
          background: rgba(243, 198, 106, 0.1); pointer-events: none;
        }
        .reg-card-head {
          margin-bottom: 1.75rem;
          position: relative;
        }
        .reg-card-eyebrow {
          font-size: 0.68rem; font-weight: 600; letter-spacing: 0.14em;
          text-transform: uppercase; color: var(--accent); margin-bottom: 0.6rem;
        }
        .reg-card-title {
          font-family: var(--fd); font-size: 1.75rem; font-weight: 700;
          letter-spacing: -0.025em; line-height: 1.2; margin-bottom: 0.5rem;
          color: var(--text);
        }
        .reg-card-sub {
          font-size: 0.85rem; color: var(--muted); font-weight: 400; line-height: 1.5;
        }

        /* Form */
        .reg-form {
          display: flex; flex-direction: column; gap: 1rem;
          position: relative;
        }
        .reg-field {
          display: flex; flex-direction: column; gap: 0.4rem;
        }
        .reg-label {
          font-size: 0.78rem; font-weight: 500;
          color: var(--muted); letter-spacing: 0.01em;
          transition: color 0.2s;
        }
        .reg-field-focus .reg-label {
          color: var(--accent);
        }
        .reg-input-wrap {
          position: relative; display: flex; align-items: center;
        }
        .reg-input-icon {
          position: absolute; left: 13px; color: var(--faint);
          pointer-events: none; transition: color 0.2s;
          z-index: 2;
        }
        .reg-field-focus .reg-input-icon {
          color: var(--accent);
        }
        .reg-input {
          width: 100%; font-family: var(--fb); font-size: 0.9rem; font-weight: 400;
          color: var(--text);
          background: rgba(255, 255, 255, 0.04);
          border: 1px solid var(--border);
          border-radius: 12px;
          padding: 11px 42px 11px 40px;
          outline: none;
          transition: border-color 0.2s, background 0.2s, box-shadow 0.2s;
        }
        .reg-input::placeholder {
          color: var(--faint); font-size: 0.85rem;
        }
        .reg-input:focus {
          border-color: rgba(243, 198, 106, 0.5);
          background: rgba(243, 198, 106, 0.04);
          box-shadow: 0 0 0 3px rgba(243, 198, 106, 0.1);
        }
        
        /* Custom Select Styling */
        .reg-select {
          width: 100%; font-family: var(--fb); font-size: 0.9rem; font-weight: 400;
          color: var(--text);
          background: rgba(255, 255, 255, 0.04);
          border: 1px solid var(--border);
          border-radius: 12px;
          padding: 11px 42px 11px 40px;
          outline: none;
          cursor: pointer;
          transition: border-color 0.2s, background 0.2s, box-shadow 0.2s;
          appearance: none;
          -webkit-appearance: none;
        }
        .reg-select:focus {
          border-color: rgba(243, 198, 106, 0.5);
          background: rgba(243, 198, 106, 0.04);
          box-shadow: 0 0 0 3px rgba(243, 198, 106, 0.1);
        }
        .reg-select option {
          background: var(--surface);
          color: var(--text);
          padding: 10px;
        }
        .reg-select-arrow {
          position: absolute;
          right: 14px;
          pointer-events: none;
          color: var(--faint);
          transition: color 0.2s;
        }
        .reg-field-focus .reg-select-arrow {
          color: var(--accent);
        }
        
        /* Role Description */
        .reg-role-description {
          font-size: 0.7rem;
          color: var(--faint);
          margin-top: 0.3rem;
          padding-left: 4px;
        }
        
        .reg-hint-warning {
          font-size: 0.7rem;
          color: var(--accent);
          margin-top: 0.3rem;
          padding-left: 4px;
        }
        
        .reg-eye {
          position: absolute; right: 12px;
          background: transparent; border: none; cursor: pointer;
          color: var(--faint); display: flex; align-items: center;
          transition: color 0.2s; padding: 4px;
          z-index: 2;
        }
        .reg-eye:hover {
          color: var(--muted);
        }

        /* Password Strength */
        .reg-password-strength {
          margin-top: 0.5rem;
        }
        .reg-strength-bars {
          display: flex; gap: 6px; margin-bottom: 0.5rem;
        }
        .reg-strength-bar {
          flex: 1; height: 4px; background: rgba(255, 255, 255, 0.1);
          border-radius: 4px; transition: background 0.3s;
        }
        .reg-strength-bar.active {
          background: var(--success);
        }
        .reg-strength-text {
          font-size: 0.7rem; color: var(--faint);
        }
        .reg-strength-valid {
          color: var(--success);
        }

        /* 2 Column Grid */
        .reg-row-2 {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 12px;
        }

        .reg-checkbox-wrap {
          margin: 0.25rem 0;
        }
        .reg-checkbox {
          display: flex;
          align-items: center;
          gap: 10px;
          font-size: 0.8rem;
          color: var(--muted);
          cursor: pointer;
        }
        .reg-checkbox input {
          width: 16px;
          height: 16px;
          cursor: pointer;
          accent-color: var(--accent);
        }
        
        .reg-link {
          color: var(--accent);
          text-decoration: none;
          transition: color 0.2s;
        }
        .reg-link:hover {
          color: var(--accent2);
          text-decoration: underline;
        }

        /* Submit Button */
        .reg-submit {
          margin-top: 0.6rem;
          width: 100%; display: flex; align-items: center; justify-content: center; gap: 10px;
          font-family: var(--fb); font-size: 0.95rem; font-weight: 600;
          padding: 13px 24px; border-radius: 48px;
          background: linear-gradient(135deg, var(--accent), var(--accent2));
          border: none; color: #111; cursor: pointer;
          transition: all 0.2s ease;
          box-shadow: 0 4px 20px rgba(243, 198, 106, 0.35);
          position: relative; overflow: hidden;
        }
        .reg-submit::before {
          content: ''; position: absolute; inset: 0;
          background: linear-gradient(135deg, rgba(255, 255, 255, 0.2), transparent);
          opacity: 0; transition: opacity 0.2s;
        }
        .reg-submit:hover:not(:disabled)::before {
          opacity: 1;
        }
        .reg-submit:hover:not(:disabled) {
          transform: translateY(-2px);
          box-shadow: 0 10px 28px rgba(243, 198, 106, 0.5);
        }
        .reg-submit:active:not(:disabled) {
          transform: translateY(0);
        }
        .reg-submit:disabled {
          opacity: 0.7; cursor: not-allowed;
        }
        .reg-spinner {
          width: 18px; height: 18px; border-radius: 50%;
          border: 2px solid rgba(0, 0, 0, 0.2);
          border-top-color: #111;
          animation: spin 0.7s linear infinite;
        }
        @keyframes spin {
          to { transform: rotate(360deg); }
        }

        /* Card Footer */
        .reg-card-foot {
          margin-top: 1.5rem;
          text-align: center;
          font-size: 0.82rem; color: var(--faint);
          padding-top: 1.25rem;
          border-top: 1px solid rgba(255, 255, 255, 0.05);
        }
        .reg-card-link {
          color: var(--accent); text-decoration: none; font-weight: 500;
          transition: color 0.2s;
        }
        .reg-card-link:hover {
          color: var(--accent2);
        }

        /* Side Panel */
        .reg-side {
          flex: 1;
          max-width: 420px;
        }
        .reg-side-content {
          width: 100%;
        }
        .reg-side-eyebrow {
          font-size: 0.68rem; font-weight: 600; letter-spacing: 0.14em;
          text-transform: uppercase; color: var(--accent); margin-bottom: 1rem;
        }
        .reg-side-title {
          font-family: var(--fd); font-size: clamp(2rem, 3.5vw, 2.8rem);
          font-weight: 800; line-height: 1.1; letter-spacing: -0.03em;
          margin-bottom: 1rem; color: var(--text);
        }
        .reg-side-sub {
          font-size: 0.9rem; color: var(--muted); line-height: 1.7;
          font-weight: 400; max-width: 380px; margin-bottom: 2rem;
        }
        .reg-side-stats {
          display: grid; grid-template-columns: repeat(2, 1fr);
          gap: 1px; background: var(--border);
          border: 1px solid var(--border); border-radius: 20px; overflow: hidden;
        }
        .reg-side-stat {
          background: var(--surface);
          padding: 1.2rem 1rem; text-align: center;
          transition: background 0.2s;
        }
        .reg-side-stat:hover {
          background: rgba(243, 198, 106, 0.06);
        }
        .reg-side-stat-v {
          font-family: var(--fd); font-size: 1.5rem; font-weight: 800;
          letter-spacing: -0.02em; line-height: 1;
          background: linear-gradient(135deg, #fff, var(--accent2));
          -webkit-background-clip: text; -webkit-text-fill-color: transparent;
          margin-bottom: 0.3rem;
        }
        .reg-side-stat-l {
          font-size: 0.72rem; color: var(--muted); font-weight: 500;
        }

        /* Responsive */
        @media (max-width: 1000px) {
          .reg-side {
            display: none;
          }
          .reg-main {
            justify-content: center;
            gap: 0;
          }
        }
        @media (max-width: 768px) {
          .reg-nav {
            padding: 0 1.25rem; height: 58px;
          }
          .reg-nav-label {
            display: none;
          }
          .reg-main {
            padding: 5rem 1.25rem 3rem;
          }
          .reg-card {
            padding: 2rem 1.5rem;
          }
          .reg-row-2 {
            grid-template-columns: 1fr;
            gap: 0.75rem;
          }
        }
        @media (max-width: 480px) {
          .reg-card {
            border-radius: 20px;
            padding: 1.75rem 1.25rem;
          }
          .reg-card-title {
            font-size: 1.5rem;
          }
          .reg-toast {
            white-space: normal;
            text-align: center;
            max-width: 90%;
            padding: 10px 18px;
          }
          .reg-select {
            font-size: 0.85rem;
            padding: 10px 38px 10px 36px;
          }
        }

        /* Reduced Motion */
        @media (prefers-reduced-motion: reduce) {
          * { animation: none !important; transition: none !important; }
        }
      `}</style>
    </div>
  );
}