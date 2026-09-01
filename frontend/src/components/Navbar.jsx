import { useState, useEffect, useRef } from "react";
import { Link, useNavigate, useLocation } from "react-router-dom";
import { useAuth } from "../context/AuthContext.jsx";
import { useWeb3 } from "../context/Web3Context.jsx";
import styles from "./Navbar.module.css";

export default function Navbar() {
  const { user, logout } = useAuth();
  const {
    account,
    walletType,
    isDemoWallet,
    isMetaMask,
    ethBalance,
    neuralBalance,
    connectMetaMask,
    connectDemoWallet,
    disconnectWallet,
    connecting,
    error,
  } = useWeb3();
  const navigate = useNavigate();
  const location = useLocation();
  const [scrolled, setScrolled] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const [walletDropdownOpen, setWalletDropdownOpen] = useState(false);
  const dropdownRef = useRef(null);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 20);
    window.addEventListener("scroll", onScroll);
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  useEffect(() => {
    setMenuOpen(false);
    setWalletDropdownOpen(false);
  }, [location]);

  // Close dropdown when clicking outside
  useEffect(() => {
    function handleClickOutside(e) {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target)) {
        setWalletDropdownOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleLogout = () => {
    logout();
    disconnectWallet();
    navigate("/");
  };
  const isActive = (path) => location.pathname === path;

  const formatAddr = (addr) => {
    if (!addr) return "";
    return `${addr.slice(0, 6)}...${addr.slice(-4)}`;
  };

  return (
    <nav className={`${styles.nav} ${scrolled ? styles.scrolled : ""}`}>
      <div className={styles.inner}>
        {/* Logo */}
        <Link to="/" className={styles.logo}>
          <span className={styles.logoIcon}>⚡</span>
          <span>
            Neural<span className={styles.logoAccent}>Chain</span>
          </span>
        </Link>

        {/* Desktop Navigation Links */}
        <ul className={styles.links}>
          <li>
            <Link to="/marketplace" className={`${styles.link} ${isActive("/marketplace") ? styles.active : ""}`}>
              Marketplace
            </Link>
          </li>
          <li>
            <Link to="/compare" className={`${styles.link} ${isActive("/compare") ? styles.active : ""}`}>
              Compare
            </Link>
          </li>
          <li>
            <Link to="/leaderboard" className={`${styles.link} ${isActive("/leaderboard") ? styles.active : ""}`}>
              Leaderboard
            </Link>
          </li>
          {user && (
            <li>
              <Link to="/dashboard" className={`${styles.link} ${isActive("/dashboard") ? styles.active : ""}`}>
                Dashboard
              </Link>
            </li>
          )}
          {user && (
            <li>
              <Link to="/upload" className={`${styles.link} ${isActive("/upload") ? styles.active : ""}`}>
                Studio
              </Link>
            </li>
          )}
          {user && (
            <li>
              <Link to="/governance" className={`${styles.link} ${isActive("/governance") ? styles.active : ""}`}>
                DAO
              </Link>
            </li>
          )}
        </ul>

        {/* Right Section / Dual Wallet Portal */}
        <div className={styles.right} ref={dropdownRef}>
          {/* Connected Wallet Pill with Dropdown */}
          {account ? (
            <div className={styles.walletContainer}>
              <button
                className={styles.walletPill}
                onClick={() => setWalletDropdownOpen(!walletDropdownOpen)}
                title="Click to view wallet details and switch wallets"
              >
                <span className={styles.walletDot} />
                <span className={styles.walletLabel}>
                  {isDemoWallet ? "⚡ Demo Wallet" : "🦊 MetaMask"}
                </span>
                <span className={styles.walletAddr}>{formatAddr(account)}</span>
                <span className={styles.walletDropdownArrow}>▾</span>
              </button>

              {walletDropdownOpen && (
                <div className={styles.walletDropdown}>
                  <div className={styles.walletDropdownHeader}>
                    <div style={{ fontSize: "0.75rem", color: "var(--text3)", textTransform: "uppercase", letterSpacing: "0.05em" }}>
                      Active Web3 Account
                    </div>
                    <div className={styles.dropdownAddress}>{account}</div>
                  </div>

                  <div className={styles.walletBalances}>
                    <div className={styles.balanceRow}>
                      <span style={{ color: "var(--text2)" }}>ETH Balance:</span>
                      <strong style={{ color: "var(--cyan)" }}>Ξ {ethBalance} ETH</strong>
                    </div>
                    <div className={styles.balanceRow}>
                      <span style={{ color: "var(--text2)" }}>NEURAL Balance:</span>
                      <strong style={{ color: "var(--purple-light)" }}>{neuralBalance} NEURAL</strong>
                    </div>
                  </div>

                  <div className={styles.walletActions}>
                    {isDemoWallet ? (
                      <button
                        className="btn btn-outline btn-sm"
                        style={{ width: "100%", justifyContent: "center" }}
                        onClick={() => {
                          connectMetaMask();
                          setWalletDropdownOpen(false);
                        }}
                      >
                        🦊 Switch to MetaMask
                      </button>
                    ) : (
                      <button
                        className="btn btn-outline btn-sm"
                        style={{ width: "100%", justifyContent: "center" }}
                        onClick={() => {
                          connectDemoWallet();
                          setWalletDropdownOpen(false);
                        }}
                      >
                        ⚡ Switch to Instant Demo Wallet
                      </button>
                    )}
                    <button
                      className="btn btn-ghost btn-sm"
                      style={{ width: "100%", color: "#ef4444", justifyContent: "center" }}
                      onClick={() => {
                        disconnectWallet();
                        setWalletDropdownOpen(false);
                      }}
                    >
                      Disconnect Wallet
                    </button>
                  </div>
                </div>
              )}
            </div>
          ) : (
            <div className={styles.connectButtonsGroup}>
              <button
                className={`btn btn-secondary btn-sm ${styles.glowBtn}`}
                onClick={connectDemoWallet}
                disabled={connecting}
                title="Instant 1-click test wallet pre-funded with ETH & NEURAL"
              >
                {connecting ? "Connecting..." : "⚡ Demo Wallet"}
              </button>
              <button
                className="btn btn-outline btn-sm"
                onClick={connectMetaMask}
                disabled={connecting}
                title="Connect genuine MetaMask browser wallet"
              >
                🦊 MetaMask
              </button>
            </div>
          )}

          {/* User Authentication Menu */}
          {user ? (
            <div className={styles.userMenu}>
              <Link to="/dashboard" className={styles.userName} title="Go to Dashboard">
                👤 {user.username}
              </Link>
              <button className="btn btn-secondary btn-sm" onClick={handleLogout}>
                Logout
              </button>
            </div>
          ) : (
            <div className={styles.authBtns}>
              <Link to="/login" className="btn btn-secondary btn-sm">
                Login
              </Link>
              <Link to="/register" className="btn btn-primary btn-sm">
                Sign Up
              </Link>
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

      {/* Mobile Dropdown Menu */}
      {menuOpen && (
        <div className={styles.mobileMenu}>
          <Link to="/marketplace" className={styles.mobileLink}>
            🛒 Marketplace
          </Link>
          <Link to="/compare" className={styles.mobileLink}>
            ⚖️ Compare Models
          </Link>
          <Link to="/leaderboard" className={styles.mobileLink}>
            🏆 Leaderboard
          </Link>
          {user && (
            <Link to="/dashboard" className={styles.mobileLink}>
              📊 Dashboard
            </Link>
          )}
          {user && (
            <Link to="/upload" className={styles.mobileLink}>
              ⬆️ Model Studio
            </Link>
          )}
          {user && (
            <Link to="/governance" className={styles.mobileLink}>
              🏛️ DAO Governance
            </Link>
          )}
          {!user && (
            <Link to="/login" className={styles.mobileLink}>
              🔐 Login
            </Link>
          )}
          {!user && (
            <Link to="/register" className={styles.mobileLink}>
              ✨ Sign Up
            </Link>
          )}
          {user && (
            <button className={styles.mobileLink} onClick={handleLogout}>
              🚪 Logout
            </button>
          )}
        </div>
      )}
    </nav>
  );
}
