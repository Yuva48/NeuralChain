import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { useAuth } from "../context/AuthContext.jsx";
import { register as registerApi } from "../services/api";
import styles from "./Auth.module.css";

export default function Register() {
  const { login } = useAuth();
  const navigate = useNavigate();
  const [form, setForm] = useState({ username: "", email: "", password: "", confirm: "" });
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(false);

  const handleChange = (e) => setForm({ ...form, [e.target.name]: e.target.value });

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);
    if (form.password !== form.confirm) {
      setError("Passwords do not match.");
      return;
    }
    if (form.password.length < 6) {
      setError("Password must be at least 6 characters.");
      return;
    }
    setLoading(true);
    try {
      const res = await registerApi({ username: form.username, email: form.email, password: form.password });
      login(res.data.user, res.data.token);
      navigate("/marketplace");
    } catch (err) {
      setError(err.response?.data?.error || "Registration failed. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className={styles.page}>
      <div className={styles.card}>
        <div className={styles.header}>
          <div className={styles.logo}>✨</div>
          <h1 className={styles.title}>Create Account</h1>
          <p className={styles.sub}>Join the decentralised AI marketplace</p>
        </div>

        {error && <div className="alert alert-error">{error}</div>}

        <form onSubmit={handleSubmit} className={styles.form}>
          <div className="form-group">
            <label className="form-label" htmlFor="username">Username</label>
            <input id="username" name="username" type="text" className="form-input"
              placeholder="e.g. AIResearcher" value={form.username} onChange={handleChange} required />
          </div>
          <div className="form-group">
            <label className="form-label" htmlFor="reg-email">Email Address</label>
            <input id="reg-email" name="email" type="email" className="form-input"
              placeholder="you@example.com" value={form.email} onChange={handleChange} required />
          </div>
          <div className="form-group">
            <label className="form-label" htmlFor="reg-password">Password</label>
            <input id="reg-password" name="password" type="password" className="form-input"
              placeholder="Min. 6 characters" value={form.password} onChange={handleChange} required />
          </div>
          <div className="form-group">
            <label className="form-label" htmlFor="confirm">Confirm Password</label>
            <input id="confirm" name="confirm" type="password" className="form-input"
              placeholder="Repeat password" value={form.confirm} onChange={handleChange} required />
          </div>
          <button id="register-btn" type="submit" className="btn btn-primary" style={{ width: "100%", justifyContent: "center" }} disabled={loading}>
            {loading ? "Creating account..." : "🚀 Create Account"}
          </button>
        </form>

        <p className={styles.switch}>
          Already have an account? <Link to="/login" className={styles.switchLink}>Sign in →</Link>
        </p>
      </div>
    </div>
  );
}
