import { FormEvent, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { login } from "../../shared/services/auth";

export function LoginPage() {
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      await login(email, password);
      navigate("/app");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Login failed");
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="container">
      <div className="card" style={{ maxWidth: "500px", margin: "0 auto" }}>
        <h1 style={{ textAlign: "center" }}>🔐 Login</h1>
        <form className="form-grid" onSubmit={onSubmit}>
          <label>📧 Email</label>
          <input 
            value={email} 
            onChange={(e) => setEmail(e.target.value)} 
            required 
            type="email" 
            placeholder="your@email.com"
          />
          <label>🔒 Password</label>
          <input
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            type="password"
            placeholder="••••••••"
          />
          {error && <p className="error">❌ {error}</p>}
          <button disabled={loading} type="submit">
            {loading ? "Please wait..." : "Login →"}
          </button>
        </form>
        <p style={{ textAlign: "center", marginTop: "16px" }}>
          Need an account? <Link to="/register">Register here</Link>
        </p>
      </div>
    </main>
  );
}