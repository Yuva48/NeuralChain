import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { useAuth } from "../context/AuthContext.jsx";
import { login as loginApi } from "../services/api";
import styles from "./Auth.module.css";

export default function Login() {
  const { login } = useAuth();
  const navigate = useNavigate();
  const [form, setForm] = useState({ email: "", password: "" });
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(false);

  const handleChange = (e) => setForm({ ...form, [e.target.name]: e.target.value });

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      const res = await loginApi(form);
      login(res.data.user, res.data.token);
      navigate("/marketplace");
    } catch (err) {
      setError(err.response?.data?.error || "Login failed. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className={styles.page}>
      <div className={styles.card}>
        {/* Header */}
        <div className={styles.header}>
          <div className={styles.logo}>⛓️</div>
          <h1 className={styles.title}>Welcome Back</h1>
          <p className={styles.sub}>Sign in to your AIModelChain account</p>
        </div>

        {error && <div className="alert alert-error">{error}</div>}

        <form onSubmit={handleSubmit} className={styles.form}>
          <div className="form-group">
            <label className="form-label" htmlFor="email">Email Address</label>
            <input id="email" name="email" type="email" className="form-input"
              placeholder="you@example.com" value={form.email} onChange={handleChange} required />
          </div>
          <div className="form-group">
            <label className="form-label" htmlFor="password">Password</label>
            <input id="password" name="password" type="password" className="form-input"
              placeholder="Your password" value={form.password} onChange={handleChange} required />
          </div>
          <button id="login-btn" type="submit" className="btn btn-primary" style={{ width: "100%", justifyContent: "center" }} disabled={loading}>
            {loading ? "Signing in..." : "🔐 Sign In"}
          </button>
        </form>

        <p className={styles.switch}>
          Don't have an account? <Link to="/register" className={styles.switchLink}>Create one →</Link>
        </p>

        {/* Demo Hint */}
        <div className="alert alert-info" style={{ marginTop: 16, fontSize: "0.83rem" }}>
          💡 Register a new account to get started. No email verification needed.
        </div>
      </div>
    </div>
  );
}
