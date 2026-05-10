import React, { FormEvent, useMemo, useState, useEffect, useRef } from "react";
import { Link, useNavigate } from "react-router-dom";
import type { UserRole } from "../../app/roleConfig";
import { RESTRICTED_ROLES } from "../../app/roleConfig";

const ROLE_OPTIONS: UserRole[] = [
  "PUBLIC_USER",
  "INVESTIGATOR",
  "FORENSIC_ANALYST",
  "COURT",
];

// API URL
const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || "http://127.0.0.1:8000";

export function RegisterPage() {
  const navigate = useNavigate();
  const [step, setStep] = useState<"form" | "otp">("form");
  const [otp, setOtp] = useState("");
  const [registerEmail, setRegisterEmail] = useState("");
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
    [form.role],
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
      default: return "👤";
    }
  };

  const getRoleDescription = (role: UserRole) => {
    switch (role) {
      case "PUBLIC_USER": return "File complaints, track cases, and upload evidence securely";
      case "INVESTIGATOR": return "Manage investigations, gather evidence, and coordinate with forensic labs";
      case "FORENSIC_ANALYST": return "Analyze evidence, generate secure reports with digital signatures";
      case "COURT": return "Review cases, conduct virtual hearings, and deliver judgments";
      default: return "Select your role in the justice system";
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    setForm((prev) => ({ ...prev, [e.target.name]: e.target.value }));
  };

  // Password validation function (returns errors array)
  const validatePassword = (password: string): string[] => {
    const errors = [];
    if (password.length < 8) errors.push("At least 8 characters");
    if (!/[A-Z]/.test(password)) errors.push("One uppercase letter (A-Z)");
    if (!/[a-z]/.test(password)) errors.push("One lowercase letter (a-z)");
    if (!/\d/.test(password)) errors.push("One number (0-9)");
    if (!/[!@#$%^&*(),.?":{}|<>]/.test(password)) errors.push("One special character (!@#$%^&*)");
    return errors;
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

    // Validate password
    const passwordErrorsList = validatePassword(form.password);
    if (passwordErrorsList.length > 0) {
      showToast(`Password requirements: ${passwordErrorsList.join(", ")}`, "error");
      return;
    }

    setIsLoading(true);
    try {
      const response = await fetch(`${API_BASE_URL}/auth/send-otp`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: form.email,
          full_name: form.fullName,
          password: form.password,
          role: form.role,
          onboarding_code: form.onboardingCode || undefined,
        }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.detail || "Failed to send verification code");
      }

      setRegisterEmail(form.email);
      setStep("otp");
      showToast("Verification code sent to your email!", "success");
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : "Registration failed";
      showToast(errorMessage, "error");
    } finally {
      setIsLoading(false);
    }
  };

  const handleVerifyOTP = async () => {
    if (!otp) {
      showToast("Please enter verification code", "error");
      return;
    }

    setIsLoading(true);
    try {
      const response = await fetch(`${API_BASE_URL}/auth/verify-otp`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: registerEmail,
          otp: otp,
        }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.detail || "Invalid verification code");
      }

      const data = await response.json();
      
      // Save session data
      localStorage.setItem("justice_token", data.access_token);
      localStorage.setItem("justice_role", data.role);
      localStorage.setItem("justice_user", JSON.stringify({ full_name: data.full_name, email: data.email }));
      
      showToast("Registration successful! Redirecting...", "success");
      setTimeout(() => navigate("/app"), 600);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : "Verification failed";
      showToast(errorMessage, "error");
    } finally {
      setIsLoading(false);
    }
  };

  const handleResendOTP = async () => {
    setIsLoading(true);
    try {
      const response = await fetch(`${API_BASE_URL}/auth/resend-otp`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: registerEmail }),
      });

      if (!response.ok) {
        throw new Error("Failed to resend code");
      }

      showToast("New verification code sent!", "success");
    } catch (err) {
      showToast("Failed to resend code", "error");
    } finally {
      setIsLoading(false);
    }
  };

  // Password strength indicator
  const getPasswordStrength = () => {
    const pwd = form.password;
    let strength = 0;
    if (pwd.length >= 8) strength++;
    if (/[A-Z]/.test(pwd)) strength++;
    if (/[a-z]/.test(pwd)) strength++;
    if (/\d/.test(pwd)) strength++;
    if (/[!@#$%^&*]/.test(pwd)) strength++;
    return strength;
  };

  const passwordStrength = getPasswordStrength();
  const showPasswordStrength = form.password.length > 0;

  return (
    <div className="register-page">
      {/* Background Elements - Indigo Theme */}
      <div className="register-bg" />
      <div className="register-grid" />
      <div className="register-aura register-aura-1" />
      <div className="register-aura register-aura-2" />
      <div className="register-aura register-aura-3" />

      {/* Navigation - Matching Homepage */}
      <nav className="register-nav">
        <Link to="/" className="register-logo">
          <div className="register-logo-mark">⚖</div>
          <span className="register-logo-text">Decentralized Justice</span>
        </Link>
        <div className="register-nav-links">
          <Link to="/" className="register-nav-link">Home</Link>
          <Link to="/login" className="register-nav-link">Login</Link>
          <Link to="/register" className="register-nav-link active">Register</Link>
          <Link to="/dashboard" className="register-nav-link">Dashboard</Link>
          <Link to="/explorer" className="register-nav-link">Explorer</Link>
        </div>
        <div className="register-nav-actions">
          <Link to="/login" className="register-nav-btn">Sign In</Link>
        </div>
      </nav>

      {/* Toast Notification */}
      {toast && (
        <div className={`register-toast register-toast-${toast.type}`}>
          <span className="register-toast-icon">
            {toast.type === "success" ? "✓" : toast.type === "warning" ? "⚠" : "✕"}
          </span>
          <span>{toast.message}</span>
        </div>
      )}

      {/* Main Content - Two Column Layout with aligned tops */}
      <main className="register-main">
        {/* Left Column - Registration Form */}
        <div className="register-left">
          <div className="register-card">
            <div className="register-card-inner">
              {step === "form" ? (
                <>
                  <div className="register-badge">Get Started</div>
                  <h1 className="register-title">
                    Create your
                    <br />
                    <span className="register-title-highlight">Justice Account</span>
                  </h1>
                  <p className="register-subtitle">
                    Join Pakistan's first blockchain-powered justice ecosystem.
                  </p>

                  <form className="register-form" onSubmit={handleSubmit}>
                    {/* Full Name */}
                    <div className={`register-field ${focused === "fullName" ? "focused" : ""}`}>
                      <label className="register-label">Full name *</label>
                      <div className="register-input-group">
                        <svg className="register-input-icon" width="18" height="18" viewBox="0 0 24 24" fill="none">
                          <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
                          <circle cx="12" cy="7" r="4" stroke="currentColor" strokeWidth="1.5"/>
                        </svg>
                        <input
                          name="fullName"
                          value={form.fullName}
                          onChange={handleChange}
                          onFocus={() => setFocused("fullName")}
                          onBlur={() => setFocused("")}
                          placeholder="Enter your full name"
                          disabled={isLoading}
                        />
                      </div>
                    </div>

                    {/* Email */}
                    <div className={`register-field ${focused === "email" ? "focused" : ""}`}>
                      <label className="register-label">Email address *</label>
                      <div className="register-input-group">
                        <svg className="register-input-icon" width="18" height="18" viewBox="0 0 24 24" fill="none">
                          <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z" stroke="currentColor" strokeWidth="1.5"/>
                          <path d="M22 6l-10 7L2 6" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
                        </svg>
                        <input
                          name="email"
                          type="email"
                          value={form.email}
                          onChange={handleChange}
                          onFocus={() => setFocused("email")}
                          onBlur={() => setFocused("")}
                          placeholder="you@example.com"
                          disabled={isLoading}
                        />
                      </div>
                    </div>

                    {/* Role Selection */}
                    <div className={`register-field ${focused === "role" ? "focused" : ""}`}>
                      <label className="register-label">Select your role *</label>
                      <div className="register-select-wrapper">
                        <svg className="register-select-icon" width="18" height="18" viewBox="0 0 24 24" fill="none">
                          <path d="M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4z" stroke="currentColor" strokeWidth="1.5"/>
                          <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" stroke="currentColor" strokeWidth="1.5"/>
                        </svg>
                        <select
                          name="role"
                          value={form.role}
                          onChange={handleChange}
                          onFocus={() => setFocused("role")}
                          onBlur={() => setFocused("")}
                          disabled={isLoading}
                          className="register-select"
                        >
                          {ROLE_OPTIONS.map((role) => (
                            <option key={role} value={role}>
                              {getRoleIcon(role)} {role.replace(/_/g, " ")}
                            </option>
                          ))}
                        </select>
                        <div className="register-select-arrow">
                          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                            <polyline points="6 9 12 15 18 9" />
                          </svg>
                        </div>
                      </div>
                      <div className="register-role-hint">{getRoleDescription(form.role)}</div>
                    </div>

                    {/* Password */}
                    <div className={`register-field ${focused === "password" ? "focused" : ""}`}>
                      <label className="register-label">Password *</label>
                      <div className="register-input-group">
                        <svg className="register-input-icon" width="18" height="18" viewBox="0 0 24 24" fill="none">
                          <rect x="5" y="11" width="14" height="10" rx="2" stroke="currentColor" strokeWidth="1.5"/>
                          <path d="M8 11V8c0-2.21 1.79-4 4-4s4 1.79 4 4v3" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
                        </svg>
                        <input
                          type={showPassword ? "text" : "password"}
                          name="password"
                          value={form.password}
                          onChange={handleChange}
                          onFocus={() => setFocused("password")}
                          onBlur={() => setFocused("")}
                          placeholder="Choose a strong password"
                          disabled={isLoading}
                        />
                        <button type="button" className="register-eye" onClick={() => setShowPassword(!showPassword)}>
                          {showPassword ? (
                            <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
                              <path d="M2 2L22 22M6.5 6.6C4.5 8.1 3 10 2 12c1.3 3 4 5 7 5 1.3 0 2.5-.4 3.5-1M9.5 9.5C8.5 10.5 8 12 8 12c0 1.1.9 2 2 2 1 0 2.5-.5 3.5-1.5M17.5 6.5C19 8 20 10 21 12c-1.5 3.5-5 6-9 6-1 0-2-.2-3-.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
                            </svg>
                          ) : (
                            <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
                              <path d="M2 12c1.3-3 4-5 7-5s5.7 2 7 5c-1.3 3-4 5-7 5s-5.7-2-7-5z" stroke="currentColor" strokeWidth="1.5"/>
                              <circle cx="12" cy="12" r="3" stroke="currentColor" strokeWidth="1.5"/>
                            </svg>
                          )}
                        </button>
                      </div>
                      {showPasswordStrength && (
                        <div className="register-strength">
                          <div className="register-strength-bars">
                            <div className={`register-strength-bar ${passwordStrength >= 1 ? "active" : ""}`} />
                            <div className={`register-strength-bar ${passwordStrength >= 2 ? "active" : ""}`} />
                            <div className={`register-strength-bar ${passwordStrength >= 3 ? "active" : ""}`} />
                            <div className={`register-strength-bar ${passwordStrength >= 4 ? "active" : ""}`} />
                            <div className={`register-strength-bar ${passwordStrength >= 5 ? "active" : ""}`} />
                          </div>
                          <span className={passwordStrength >= 5 ? "register-strength-valid" : ""}>
                            {passwordStrength >= 5 
                              ? "✓ Strong password" 
                              : `Weak password: Need ${5 - passwordStrength} more requirement(s)`}
                          </span>
                        </div>
                      )}
                    </div>

                    {/* Onboarding Code for Restricted Roles */}
                    {needsOnboarding && (
                      <div className={`register-field ${focused === "onboardingCode" ? "focused" : ""}`}>
                        <label className="register-label">Verification Code *</label>
                        <div className="register-input-group">
                          <svg className="register-input-icon" width="18" height="18" viewBox="0 0 24 24" fill="none">
                            <rect x="3" y="5" width="18" height="14" rx="2" stroke="currentColor" strokeWidth="1.5"/>
                            <path d="M7 9h10M7 13h6" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
                          </svg>
                          <input
                            name="onboardingCode"
                            value={form.onboardingCode}
                            onChange={handleChange}
                            onFocus={() => setFocused("onboardingCode")}
                            onBlur={() => setFocused("")}
                            placeholder={getOnboardingHint()}
                            disabled={isLoading}
                          />
                        </div>
                        <div className="register-code-hint">⚠️ Restricted role requires valid verification code</div>
                      </div>
                    )}

                    {/* Phone Number */}
                    <div className={`register-field ${focused === "phoneNumber" ? "focused" : ""}`}>
                      <label className="register-label">Phone number</label>
                      <div className="register-input-group">
                        <svg className="register-input-icon" width="18" height="18" viewBox="0 0 24 24" fill="none">
                          <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72c.127.96.362 1.903.7 2.81a2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45c.907.338 1.85.573 2.81.7A2 2 0 0 1 22 16.92z" stroke="currentColor" strokeWidth="1.5"/>
                        </svg>
                        <input
                          name="phoneNumber"
                          value={form.phoneNumber}
                          onChange={handleChange}
                          onFocus={() => setFocused("phoneNumber")}
                          onBlur={() => setFocused("")}
                          placeholder="0300-1234567"
                          disabled={isLoading}
                        />
                      </div>
                    </div>

                    {/* Location Fields */}
                    <div className="register-row">
                      <div className={`register-field ${focused === "city" ? "focused" : ""}`}>
                        <label className="register-label">City</label>
                        <input
                          name="city"
                          value={form.city}
                          onChange={handleChange}
                          onFocus={() => setFocused("city")}
                          onBlur={() => setFocused("")}
                          placeholder="Your city"
                          disabled={isLoading}
                          className="register-input-full"
                        />
                      </div>
                      <div className={`register-field ${focused === "district" ? "focused" : ""}`}>
                        <label className="register-label">District</label>
                        <input
                          name="district"
                          value={form.district}
                          onChange={handleChange}
                          onFocus={() => setFocused("district")}
                          onBlur={() => setFocused("")}
                          placeholder="Your district"
                          disabled={isLoading}
                          className="register-input-full"
                        />
                      </div>
                    </div>

                    {/* Address */}
                    <div className={`register-field ${focused === "address" ? "focused" : ""}`}>
                      <label className="register-label">Address</label>
                      <div className="register-input-group">
                        <svg className="register-input-icon" width="18" height="18" viewBox="0 0 24 24" fill="none">
                          <path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7z" stroke="currentColor" strokeWidth="1.5"/>
                          <circle cx="12" cy="9" r="3" stroke="currentColor" strokeWidth="1.5"/>
                        </svg>
                        <input
                          name="address"
                          value={form.address}
                          onChange={handleChange}
                          onFocus={() => setFocused("address")}
                          onBlur={() => setFocused("")}
                          placeholder="Your complete address"
                          disabled={isLoading}
                        />
                      </div>
                    </div>

                    {/* Terms Checkbox */}
                    <label className="register-checkbox">
                      <input type="checkbox" checked={agreeToTerms} onChange={(e) => setAgreeToTerms(e.target.checked)} />
                      <span>
                        I agree to the <Link to="/terms">Terms of Service</Link> and <Link to="/privacy">Privacy Policy</Link>
                      </span>
                    </label>

                    {/* Submit Button */}
                    <button type="submit" className="register-submit" disabled={isLoading}>
                      {isLoading ? (
                        <>
                          <span className="register-spinner" />
                          Sending verification code...
                        </>
                      ) : (
                        <>
                          Create Account
                          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                            <path d="M5 12h14M12 5l7 7-7 7" strokeLinecap="round" strokeLinejoin="round"/>
                          </svg>
                        </>
                      )}
                    </button>
                  </form>

                  <div className="register-footer">
                    <p>
                      Already have an account?{" "}
                      <Link to="/login" className="register-footer-link">Sign in instead</Link>
                    </p>
                  </div>
                </>
              ) : (
                // ============ OTP VERIFICATION STEP ============
                <>
                  <div className="register-badge">Email Verification</div>
                  <h1 className="register-title">
                    Verify Your
                    <br />
                    <span className="register-title-highlight">Email Address</span>
                  </h1>
                  <p className="register-subtitle">We've sent a 6-digit verification code to</p>
                  <p className="register-email-display"><strong>{registerEmail}</strong></p>

                  <div className="register-form">
                    <div className={`register-field ${focused === "otp" ? "focused" : ""}`}>
                      <label className="register-label">Verification Code</label>
                      <div className="register-input-group">
                        <svg className="register-input-icon" width="18" height="18" viewBox="0 0 24 24" fill="none">
                          <rect x="3" y="5" width="18" height="14" rx="2" stroke="currentColor" strokeWidth="1.5"/>
                          <path d="M7 9h10M7 13h6" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
                        </svg>
                        <input
                          type="text"
                          maxLength={6}
                          value={otp}
                          onChange={(e) => setOtp(e.target.value)}
                          onFocus={() => setFocused("otp")}
                          onBlur={() => setFocused("")}
                          placeholder="Enter 6-digit code"
                          disabled={isLoading}
                          style={{ letterSpacing: "4px", fontSize: "1.1rem" }}
                        />
                      </div>
                    </div>

                    <button
                      type="button"
                      className="register-submit"
                      onClick={handleVerifyOTP}
                      disabled={isLoading || !otp}
                    >
                      {isLoading ? (
                        <>
                          <span className="register-spinner" />
                          Verifying...
                        </>
                      ) : (
                        <>
                          Verify & Complete Registration
                          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                            <path d="M5 12h14M12 5l7 7-7 7" strokeLinecap="round" strokeLinejoin="round"/>
                          </svg>
                        </>
                      )}
                    </button>

                    <div className="register-otp-footer">
                      <p>
                        Didn't receive the code?{" "}
                        <button type="button" className="register-resend-btn" onClick={handleResendOTP} disabled={isLoading}>
                          Resend Code
                        </button>
                      </p>
                      <p className="register-otp-hint">Check your spam folder if you don't see the email in a few minutes.</p>
                    </div>
                  </div>

                  <div className="register-footer">
                    <button type="button" className="register-back-btn" onClick={() => setStep("form")}>
                      ← Back to Registration
                    </button>
                  </div>
                </>
              )}
            </div>
          </div>
        </div>

        {/* Right Column - Feature Panel (Aligned to top) */}
        <div className="register-right">
          <div className="register-feature">
            <div className="register-feature-badge">POWERED BY BLOCKCHAIN</div>
            <h2 className="register-feature-title">
              Join the future of
              <br />
              <span className="register-feature-highlight">Justice System</span>
            </h2>
            <p className="register-feature-text">
              Blockchain-verified records, transparent case tracking, and secure
              digital signatures — all in one unified platform.
            </p>

            <div className="register-feature-stats">
              <div className="register-stat">
                <div className="register-stat-value">100%</div>
                <div className="register-stat-label">Transparent</div>
              </div>
              <div className="register-stat">
                <div className="register-stat-value">24/7</div>
                <div className="register-stat-label">Accessible</div>
              </div>
              <div className="register-stat">
                <div className="register-stat-value">256-bit</div>
                <div className="register-stat-label">Encrypted</div>
              </div>
              <div className="register-stat">
                <div className="register-stat-value">10x</div>
                <div className="register-stat-label">Faster</div>
              </div>
            </div>

            <div className="register-feature-quote">
              <svg width="28" height="28" viewBox="0 0 24 24" fill="none">
                <path d="M10 11H6c-1.1 0-2 .9-2 2v4c0 1.1.9 2 2 2h4c1.1 0 2-.9 2-2v-4c0-1.1-.9-2-2-2zM10 11V7c0-1.1.9-2 2-2h2M20 11h-4c-1.1 0-2 .9-2 2v4c0 1.1.9 2 2 2h4c1.1 0 2-.9 2-2v-4c0-1.1-.9-2-2-2zM20 11V7c0-1.1.9-2 2-2h2" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
              </svg>
              <p>"The most secure and transparent justice platform we've implemented. Blockchain integration ensures complete trust in the system."</p>
              <div className="register-feature-author">
                <strong>— National Legal Commission</strong>
                <span>Digital Justice Initiative</span>
              </div>
            </div>
          </div>
        </div>
      </main>

      <style>{`
        /* Reset & Base - Indigo Theme */
        .register-page {
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
        .register-bg {
          position: fixed;
          inset: 0;
          background: radial-gradient(ellipse 70% 50% at 50% -20%, rgba(99, 102, 241, 0.08), transparent 60%);
          pointer-events: none;
          z-index: 0;
        }

        .register-grid {
          position: fixed;
          inset: 0;
          background-image: linear-gradient(rgba(99, 102, 241, 0.03) 1px, transparent 1px),
                          linear-gradient(90deg, rgba(99, 102, 241, 0.03) 1px, transparent 1px);
          background-size: 48px 48px;
          mask-image: radial-gradient(ellipse 80% 60% at 50% 40%, black 30%, transparent 80%);
          pointer-events: none;
          z-index: 0;
        }

        .register-aura {
          position: fixed;
          border-radius: 50%;
          filter: blur(80px);
          pointer-events: none;
          z-index: 0;
        }

        .register-aura-1 {
          width: 500px;
          height: 500px;
          top: -150px;
          left: 50%;
          transform: translateX(-50%);
          background: radial-gradient(circle, rgba(99, 102, 241, 0.15), transparent);
          animation: floatA 12s ease-in-out infinite;
        }

        .register-aura-2 {
          width: 350px;
          height: 350px;
          bottom: 10%;
          right: -5%;
          background: radial-gradient(circle, rgba(99, 102, 241, 0.1), transparent);
          animation: floatB 15s ease-in-out infinite reverse;
        }

        .register-aura-3 {
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
        .register-nav {
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

        .register-logo {
          display: flex;
          align-items: center;
          gap: 10px;
          text-decoration: none;
          transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
        }

        .register-logo:hover {
          transform: translateY(-1px);
        }

        .register-logo-mark {
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

        .register-logo:hover .register-logo-mark {
          box-shadow: 0 0 12px rgba(99, 102, 241, 0.4);
          transform: scale(1.02);
        }

        .register-logo-text {
          font-family: 'Syne', 'Inter', system-ui, sans-serif;
          background: linear-gradient(135deg, #e8ecf8, #818cf8);
          -webkit-background-clip: text;
          -webkit-text-fill-color: transparent;
          background-clip: text;
          font-weight: 800;
          font-size: 1.1rem;
          letter-spacing: -0.3px;
        }

        .register-nav-links {
          display: flex;
          gap: 2rem;
        }

        .register-nav-link {
          text-decoration: none;
          color: #7a849c;
          font-size: 0.83rem;
          font-weight: 500;
          letter-spacing: 0.2px;
          transition: color 0.2s;
        }

        .register-nav-link:hover,
        .register-nav-link.active {
          color: #e8ecf8;
        }

        .register-nav-btn {
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

        .register-nav-btn:hover {
          transform: translateY(-2px);
          box-shadow: 0 4px 12px rgba(99, 102, 241, 0.3);
        }

        /* Toast */
        .register-toast {
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

        .register-toast-success { border-color: rgba(99, 102, 241, 0.4); color: #818cf8; }
        .register-toast-error { border-color: rgba(239, 68, 68, 0.4); color: #f87171; }

        /* Main Layout - Two Columns */
        .register-main {
          position: relative;
          z-index: 10;
          min-height: 100vh;
          display: grid;
          grid-template-columns: 1fr 1fr;
          align-items: start;
          padding: 100px 3rem 3rem;
          gap: 4rem;
        }

        /* Left Column - Registration Card */
        .register-left {
          display: flex;
          justify-content: flex-end;
        }

        .register-card {
          width: 100%;
          max-width: 540px;
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

        .register-card-inner {
          padding: 2.5rem;
        }

        .register-badge {
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

        .register-title {
          font-size: 1.9rem;
          font-weight: 700;
          letter-spacing: -0.02em;
          line-height: 1.2;
          margin-bottom: 0.75rem;
          color: #e8ecf8;
        }

        .register-title-highlight {
          background: linear-gradient(135deg, #6366f1, #818cf8);
          -webkit-background-clip: text;
          -webkit-text-fill-color: transparent;
          background-clip: text;
        }

        .register-subtitle {
          font-size: 0.88rem;
          color: #7a849c;
          line-height: 1.6;
          margin-bottom: 2rem;
        }

        /* Form */
        .register-form {
          display: flex;
          flex-direction: column;
          gap: 1rem;
        }

        .register-field {
          display: flex;
          flex-direction: column;
          gap: 0.4rem;
        }

        .register-label {
          font-size: 0.75rem;
          font-weight: 500;
          color: #7a849c;
          letter-spacing: 0.5px;
          transition: color 0.2s;
        }

        .register-field.focused .register-label {
          color: #6366f1;
        }

        /* Input Group */
        .register-input-group {
          position: relative;
          display: flex;
          align-items: center;
        }

        .register-input-icon {
          position: absolute;
          left: 14px;
          color: #3d4459;
        }

        .register-field.focused .register-input-icon {
          color: #6366f1;
        }

        .register-input-group input {
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

        .register-input-group input:focus {
          border-color: #6366f1;
          background: rgba(99, 102, 241, 0.05);
          box-shadow: 0 0 0 3px rgba(99, 102, 241, 0.1);
        }

        .register-input-group input::placeholder {
          color: #3d4459;
        }

        /* Select Dropdown Styles */
        .register-select-wrapper {
          position: relative;
          display: flex;
          align-items: center;
        }

        .register-select-icon {
          position: absolute;
          left: 14px;
          z-index: 1;
          color: #3d4459;
          pointer-events: none;
        }

        .register-field.focused .register-select-icon {
          color: #6366f1;
        }

        .register-select {
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
          appearance: none;
          cursor: pointer;
        }

        .register-select:hover {
          background: rgba(255, 255, 255, 0.05);
          border-color: rgba(99, 102, 241, 0.3);
        }

        .register-select:focus {
          border-color: #6366f1;
          background: rgba(99, 102, 241, 0.05);
          box-shadow: 0 0 0 3px rgba(99, 102, 241, 0.1);
        }

        .register-select option {
          background: #0b0e1a;
          color: #e8ecf8;
          padding: 12px;
        }

        .register-select-arrow {
          position: absolute;
          right: 14px;
          pointer-events: none;
          color: #3d4459;
          transition: transform 0.2s ease;
        }

        .register-select:focus + .register-select-arrow {
          color: #6366f1;
          transform: rotate(180deg);
        }

        .register-input-full {
          width: 100%;
          padding: 12px 14px;
          background: rgba(255, 255, 255, 0.03);
          border: 1px solid rgba(255, 255, 255, 0.07);
          border-radius: 6px;
          font-family: inherit;
          font-size: 0.9rem;
          color: #e8ecf8;
          transition: all 0.2s;
          outline: none;
        }

        .register-input-full:focus {
          border-color: #6366f1;
          background: rgba(99, 102, 241, 0.05);
          box-shadow: 0 0 0 3px rgba(99, 102, 241, 0.1);
        }

        .register-eye {
          position: absolute;
          right: 14px;
          background: transparent;
          border: none;
          cursor: pointer;
          color: #3d4459;
          display: flex;
          padding: 4px;
        }

        .register-eye:hover {
          color: #818cf8;
        }

        .register-role-hint {
          font-size: 0.68rem;
          color: #3d4459;
          margin-top: 0.2rem;
          padding-left: 4px;
        }

        .register-code-hint {
          font-size: 0.68rem;
          color: #818cf8;
          margin-top: 0.2rem;
          padding-left: 4px;
        }

        /* Password Strength */
        .register-strength {
          margin-top: 0.4rem;
        }

        .register-strength-bars {
          display: flex;
          gap: 6px;
          margin-bottom: 0.4rem;
        }

        .register-strength-bar {
          flex: 1;
          height: 3px;
          background: rgba(255, 255, 255, 0.1);
          border-radius: 3px;
          transition: background 0.3s;
        }

        .register-strength-bar.active {
          background: #10b981;
        }

        .register-strength span {
          font-size: 0.68rem;
          color: #3d4459;
        }

        .register-strength-valid {
          color: #10b981 !important;
        }

        /* Two Column Row */
        .register-row {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 1rem;
        }

        /* Checkbox */
        .register-checkbox {
          display: flex;
          align-items: center;
          gap: 10px;
          font-size: 0.75rem;
          color: #7a849c;
          cursor: pointer;
          margin: 0.5rem 0;
        }

        .register-checkbox input {
          width: 16px;
          height: 16px;
          cursor: pointer;
          accent-color: #6366f1;
        }

        .register-checkbox a {
          color: #818cf8;
          text-decoration: none;
        }

        .register-checkbox a:hover {
          text-decoration: underline;
        }

        /* Submit Button */
        .register-submit {
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

        .register-submit:hover:not(:disabled) {
          transform: translateY(-2px);
          box-shadow: 0 6px 20px rgba(99, 102, 241, 0.4);
        }

        .register-submit:disabled {
          opacity: 0.7;
          cursor: not-allowed;
        }

        .register-spinner {
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

        /* Footer */
        .register-footer {
          margin-top: 1.5rem;
          text-align: center;
          padding-top: 1.25rem;
          border-top: 1px solid rgba(255, 255, 255, 0.05);
          font-size: 0.8rem;
          color: #7a849c;
        }

        .register-footer-link {
          color: #818cf8;
          text-decoration: none;
          font-weight: 500;
        }

        .register-footer-link:hover {
          color: #6366f1;
        }

        /* Right Column - Feature Panel */
        .register-right {
          display: flex;
          align-items: flex-start;
          margin-top: 5.5rem;
        }

        .register-feature {
          max-width: 460px;
          animation: sideReveal 0.6s ease-out 0.2s both;
        }

        @keyframes sideReveal {
          from { opacity: 0; transform: translateX(20px); }
          to { opacity: 1; transform: translateX(0); }
        }

        .register-feature-badge {
          font-size: 0.65rem;
          font-weight: 600;
          letter-spacing: 3px;
          color: #818cf8;
          margin-bottom: 1.5rem;
          font-family: 'DM Mono', monospace;
        }

        .register-feature-title {
          font-size: 2.5rem;
          font-weight: 800;
          line-height: 1.15;
          letter-spacing: -0.03em;
          margin-bottom: 1.25rem;
          font-family: 'Syne', sans-serif;
        }

        .register-feature-highlight {
          background: linear-gradient(135deg, #6366f1, #818cf8);
          -webkit-background-clip: text;
          -webkit-text-fill-color: transparent;
          background-clip: text;
        }

        .register-feature-text {
          font-size: 0.95rem;
          color: #7a849c;
          line-height: 1.75;
          margin-bottom: 2rem;
        }

        .register-feature-stats {
          display: grid;
          grid-template-columns: repeat(4, 1fr);
          background: rgba(255, 255, 255, 0.02);
          border: 1px solid rgba(255, 255, 255, 0.07);
          border-radius: 10px;
          overflow: hidden;
          margin-bottom: 2rem;
        }

        .register-stat {
          text-align: center;
          padding: 1rem;
          transition: all 0.3s ease;
        }

        .register-stat:hover {
          background: rgba(99, 102, 241, 0.05);
        }

        .register-stat-value {
          font-size: 1.4rem;
          font-weight: 800;
          background: linear-gradient(135deg, #e8ecf8, #818cf8);
          -webkit-background-clip: text;
          -webkit-text-fill-color: transparent;
          background-clip: text;
          margin-bottom: 0.25rem;
          font-family: 'DM Mono', monospace;
        }

        .register-stat-label {
          font-size: 0.68rem;
          color: #3d4459;
          font-weight: 500;
          letter-spacing: 1px;
        }

        .register-feature-quote {
          background: rgba(255, 255, 255, 0.02);
          border-left: 2px solid #6366f1;
          padding: 1.5rem;
          border-radius: 10px;
        }

        .register-feature-quote svg {
          color: #6366f1;
          margin-bottom: 1rem;
          opacity: 0.6;
        }

        .register-feature-quote p {
          font-size: 0.88rem;
          line-height: 1.7;
          color: #7a849c;
          margin-bottom: 1rem;
          font-style: italic;
        }

        .register-feature-author strong {
          display: block;
          color: #e8ecf8;
          font-size: 0.83rem;
          margin-bottom: 0.25rem;
        }

        .register-feature-author span {
          font-size: 0.68rem;
          color: #3d4459;
        }

        /* OTP Step Styles */
        .register-email-display {
          text-align: center;
          margin: -10px 0 20px 0;
          color: #818cf8;
          font-size: 0.9rem;
          background: rgba(99, 102, 241, 0.1);
          padding: 8px;
          border-radius: 8px;
        }

        .register-otp-footer {
          text-align: center;
          margin-top: 20px;
        }

        .register-resend-btn {
          background: none;
          border: none;
          color: #818cf8;
          cursor: pointer;
          font-weight: 600;
          text-decoration: underline;
        }

        .register-resend-btn:hover {
          color: #a5b4fc;
        }

        .register-resend-btn:disabled {
          opacity: 0.5;
          cursor: not-allowed;
        }

        .register-otp-hint {
          font-size: 0.7rem;
          color: #3d4459;
          margin-top: 12px;
        }

        .register-back-btn {
          background: none;
          border: none;
          color: #7a849c;
          cursor: pointer;
          font-size: 0.8rem;
          transition: color 0.2s;
        }

        .register-back-btn:hover {
          color: #818cf8;
        }

        /* OTP Input styling */
        .register-input-group input[type="text"][maxLength="6"] {
          text-align: center;
          font-size: 1.2rem;
          letter-spacing: 8px;
          font-family: monospace;
        }

        /* Responsive */
        @media (max-width: 1100px) {
          .register-main {
            grid-template-columns: 1fr;
            align-items: center;
            padding: 90px 2rem 2rem;
            gap: 2rem;
          }
          .register-left {
            justify-content: center;
          }
          .register-right {
            justify-content: center;
            align-items: center;
            margin-top: 0;
          }
          .register-feature {
            text-align: center;
          }
          .register-feature-stats {
            justify-content: center;
          }
          .register-feature-quote {
            text-align: left;
          }
        }

        @media (max-width: 768px) {
          .register-nav {
            padding: 0 1.5rem;
          }
          .register-nav-links {
            display: none;
          }
          .register-main {
            padding: 80px 1.25rem 2rem;
          }
          .register-card-inner {
            padding: 1.75rem;
          }
          .register-title {
            font-size: 1.5rem;
          }
          .register-feature-title {
            font-size: 1.8rem;
          }
          .register-row {
            grid-template-columns: 1fr;
            gap: 0.75rem;
          }
          .register-feature-stats {
            grid-template-columns: repeat(2, 1fr);
          }
        }

        @media (max-width: 480px) {
          .register-card {
            border-radius: 12px;
          }
          .register-card-inner {
            padding: 1.5rem 1.25rem;
          }
        }

        @media (prefers-reduced-motion: reduce) {
          .register-aura,
          .register-nav,
          .register-card,
          .register-feature {
            animation: none;
          }
        }
      `}</style>
    </div>
  );
}