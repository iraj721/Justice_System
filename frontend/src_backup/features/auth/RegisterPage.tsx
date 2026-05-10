import { FormEvent, useMemo, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import type { UserRole } from "../../app/roleConfig";
import { ONBOARDING_CODES, RESTRICTED_ROLES } from "../../app/roleConfig";
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
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [role, setRole] = useState<UserRole>("PUBLIC_USER");
  const [onboardingCode, setOnboardingCode] = useState("");
  const [phoneNumber, setPhoneNumber] = useState("");
  const [address, setAddress] = useState("");
  const [city, setCity] = useState("");
  const [district, setDistrict] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const needsOnboarding = useMemo(
    () => RESTRICTED_ROLES.includes(role),
    [role]
  );

  const getOnboardingHint = () => {
    if (role === "INVESTIGATOR") return "Enter: POLICE-2026";
    if (role === "FORENSIC_ANALYST") return "Enter: LAB-2026";
    if (role === "COURT") return "Enter: JUDGE-2026";
    return "";
  };

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      await register({
        full_name: fullName,
        email,
        password,
        role,
        onboarding_code: onboardingCode || undefined,
        phone_number: phoneNumber,
        address,
        city,
        district,
      });
      navigate("/app");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Registration failed");
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="container">
      <div className="card" style={{ maxWidth: "600px", margin: "0 auto" }}>
        <h1 style={{ textAlign: "center" }}>📝 Register</h1>
        <form className="form-grid" onSubmit={onSubmit}>
          <label>👤 Full name *</label>
          <input 
            value={fullName} 
            onChange={(e) => setFullName(e.target.value)} 
            required 
            placeholder="Enter your full name"
          />
          <label>📧 Email *</label>
          <input 
            value={email} 
            onChange={(e) => setEmail(e.target.value)} 
            required 
            type="email" 
            placeholder="your@email.com"
          />
          <label>🔒 Password *</label>
          <input
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            type="password"
            placeholder="Choose a strong password"
          />
          <label>📞 Phone Number</label>
          <input
            value={phoneNumber}
            onChange={(e) => setPhoneNumber(e.target.value)}
            placeholder="0300-1234567"
          />
          <label>📍 Address</label>
          <input
            value={address}
            onChange={(e) => setAddress(e.target.value)}
            placeholder="Your complete address"
          />
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px" }}>
            <div>
              <label>🏙️ City</label>
              <input value={city} onChange={(e) => setCity(e.target.value)} placeholder="City" />
            </div>
            <div>
              <label>🗺️ District</label>
              <input value={district} onChange={(e) => setDistrict(e.target.value)} placeholder="District" />
            </div>
          </div>
          <label>🎭 Role</label>
          <select value={role} onChange={(e) => setRole(e.target.value as UserRole)}>
            {ROLE_OPTIONS.map((item) => (
              <option key={item} value={item}>
                {item.replace("_", " ")}
              </option>
            ))}
          </select>
          {needsOnboarding && (
            <>
              <label>🔑 Onboarding Code</label>
              <input
                value={onboardingCode}
                onChange={(e) => setOnboardingCode(e.target.value)}
                required
                placeholder={getOnboardingHint()}
              />
              <small style={{ color: "#666" }}>
                * Restricted roles require valid onboarding code for verification
              </small>
            </>
          )}
          {error && <p className="error">❌ {error}</p>}
          <button disabled={loading} type="submit">
            {loading ? "Please wait..." : "Register →"}
          </button>
        </form>
        <p style={{ textAlign: "center", marginTop: "16px" }}>
          Already registered? <Link to="/login">Login here</Link>
        </p>
      </div>
    </main>
  );
}