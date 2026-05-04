import { useState, useEffect } from "react";
import { Link, useNavigate, useLocation } from "react-router-dom";
import { useAuth } from "../context/AuthContext.jsx";
import { useWeb3 } from "../context/Web3Context.jsx";
import styles from "./Navbar.module.css";

export default function Navbar() {
  const { user, logout } = useAuth();
  const { account, connectWallet, formatAddress, connecting } = useWeb3();
  const navigate = useNavigate();
  const location = useLocation();
  const [scrolled, setScrolled] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 20);
    window.addEventListener("scroll", onScroll);
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  useEffect(() => { setMenuOpen(false); }, [location]);

  const handleLogout = () => { logout(); navigate("/"); };
  const isActive = (path) => location.pathname === path;

  return (
    <nav className={`${styles.nav} ${scrolled ? styles.scrolled : ""}`}>
      <div className={styles.inner}>
        {/* Logo */}
        <Link to="/" className={styles.logo}>
          <span className={styles.logoIcon}>⛓️</span>
          <span>AI<span className={styles.logoAccent}>ModelChain</span></span>
        </Link>

        {/* Desktop Links */}
        <ul className={styles.links}>
          <li><Link to="/marketplace" className={`${styles.link} ${isActive("/marketplace") ? styles.active : ""}`}>Marketplace</Link></li>
          {user && <li><Link to="/upload" className={`${styles.link} ${isActive("/upload") ? styles.active : ""}`}>Upload Model</Link></li>}
        </ul>

        {/* Right Section */}
        <div className={styles.right}>
          {/* Wallet Button */}
          {account ? (
            <div className={styles.walletConnected}>
              <span className={styles.walletDot} />
              <span className={styles.walletAddr}>{formatAddress(account)}</span>
            </div>
          ) : (
            <button className={`btn btn-outline btn-sm ${styles.walletBtn}`} onClick={connectWallet} disabled={connecting}>
              {connecting ? "Connecting..." : "🦊 Connect Wallet"}
            </button>
          )}

          {/* Auth Buttons */}
          {user ? (
            <div className={styles.userMenu}>
              <span className={styles.userName}>👤 {user.username}</span>
              <button className="btn btn-secondary btn-sm" onClick={handleLogout}>Logout</button>
            </div>
          ) : (
            <div className={styles.authBtns}>
              <Link to="/login" className="btn btn-secondary btn-sm">Login</Link>
              <Link to="/register" className="btn btn-primary btn-sm">Sign Up</Link>
            </div>
          )}

          {/* Mobile Menu Toggle */}
          <button className={styles.hamburger} onClick={() => setMenuOpen(!menuOpen)} aria-label="Menu">
            <span className={`${styles.bar} ${menuOpen ? styles.open : ""}`} />
            <span className={`${styles.bar} ${menuOpen ? styles.open : ""}`} />
            <span className={`${styles.bar} ${menuOpen ? styles.open : ""}`} />
          </button>
        </div>
      </div>

      {/* Mobile Menu */}
      {menuOpen && (
        <div className={styles.mobileMenu}>
          <Link to="/marketplace" className={styles.mobileLink}>🛒 Marketplace</Link>
          {user && <Link to="/upload" className={styles.mobileLink}>⬆️ Upload Model</Link>}
          {!user && <Link to="/login" className={styles.mobileLink}>🔐 Login</Link>}
          {!user && <Link to="/register" className={styles.mobileLink}>✨ Sign Up</Link>}
          {user && <button className={styles.mobileLink} onClick={handleLogout}>🚪 Logout</button>}
        </div>
      )}
    </nav>
  );
}
