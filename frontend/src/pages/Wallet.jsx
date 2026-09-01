import { useEffect, useMemo, useState } from "react";
import { ethers } from "ethers";
import { useWeb3 } from "../context/Web3Context.jsx";
import styles from "./Wallet.module.css";

function formatHash(hash) {
  if (!hash) return "—";
  return `${hash.slice(0, 10)}...${hash.slice(-8)}`;
}

export default function Wallet() {
  const {
    account,
    provider,
    chainLabel,
    transactions,
    clearTransactions,
    formatAddress,
    connectDemoWallet,
    disconnect,
    demoMode,
    connecting,
    demoAccount,
  } = useWeb3();
  const [neuralBalance, setNeuralBalance] = useState("0");

  useEffect(() => {
    if (!account || !provider || !import.meta.env.VITE_NEURAL_TOKEN_ADDRESS) return;
    import("../contracts/NeuralToken.json").then(async ({ default: tokenData }) => {
      const token = new ethers.Contract(import.meta.env.VITE_NEURAL_TOKEN_ADDRESS, tokenData.abi, provider);
      setNeuralBalance(ethers.formatUnits(await token.balanceOf(account), 18));
    }).catch(() => setNeuralBalance("0"));
  }, [account, provider]);

  const stats = useMemo(() => {
    const total = transactions.length;
    const success = transactions.filter(t => t.status === "success").length;
    const failed = transactions.filter(t => t.status === "failed").length;
    const demo = transactions.filter(t => t.status === "demo").length;
    return { total, success, failed, demo };
  }, [transactions]);

  return (
    <div className="page-wrapper" style={{ paddingTop: 90 }}>
      <div className={styles.header}>
        <div>
          <h1 className="section-title">Wallet <span className="gradient-text">Activity</span></h1>
          <p style={{ color: "var(--text2)", marginTop: 8 }}>
            Connected: <span className={styles.mono}>{account ? formatAddress(account) : "—"}</span>
            {" "}• Network: <span className={styles.mono}>{chainLabel}</span>
          </p>
        </div>
        <button className="btn btn-secondary btn-sm" onClick={clearTransactions} disabled={!transactions.length}>
          Clear History
        </button>
      </div>

      <div className={`glass-card ${styles.tableCard}`} style={{ marginBottom: "1.5rem", padding: "1.25rem", display: "grid", gap: "1rem" }}>
        <div style={{ display: "flex", justifyContent: "space-between", gap: 12, alignItems: "center", flexWrap: "wrap" }}>
          <div>
            <div style={{ color: "var(--text3)", fontSize: ".72rem", letterSpacing: "0.14em", textTransform: "uppercase" }}>Wallet status</div>
            <div style={{ fontSize: "1.2rem", fontWeight: 700, marginTop: 4 }}>
              {account ? formatAddress(account) : "Not connected"}
            </div>
          </div>
          <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
            {!account ? (
              <button className="btn btn-secondary btn-sm" onClick={connectDemoWallet} disabled={connecting}>
                {connecting ? "Connecting..." : "🧪 Connect Demo Wallet"}
              </button>
            ) : (
              <button className="btn btn-ghost btn-sm" onClick={disconnect}>Disconnect</button>
            )}
          </div>
        </div>

        <div style={{ display: "flex", gap: 12, flexWrap: "wrap", color: "var(--text2)" }}>
          <span className={styles.mono}>Network: {chainLabel}</span>
          <span className={styles.mono}>Mode: {demoMode ? "Demo wallet" : account ? "MetaMask" : "Not connected"}</span>
          <span className={styles.mono}>Buyer wallet: {demoAccount ? formatAddress(demoAccount) : "—"}</span>
          <span className={styles.mono}>NEURAL: {Number(neuralBalance).toLocaleString()} NEURAL</span>
        </div>
      </div>

      <div className={styles.statsGrid}>
        {[
          { label: "Total Tx", value: stats.total, icon: "🧾" },
          { label: "Success", value: stats.success, icon: "✅" },
          { label: "Failed", value: stats.failed, icon: "❌" },
          { label: "Demo", value: stats.demo, icon: "🧪" },
        ].map(s => (
          <div key={s.label} className={`glass-card ${styles.statCard}`}>
            <div className={styles.statIcon}>{s.icon}</div>
            <div className={styles.statLabel}>{s.label}</div>
            <div className={styles.statValue}>{s.value}</div>
          </div>
        ))}
      </div>

      <div className={`glass-card ${styles.tableCard}`}>
        <div className={styles.tableHeader}>
          <h2 style={{ margin: 0 }}>Transaction History</h2>
          <div style={{ color: "var(--text3)", fontSize: "0.9rem" }}>
            Saved locally per wallet (demo-friendly)
          </div>
        </div>

        {transactions.length === 0 ? (
          <div className="empty-state" style={{ padding: "3rem 1rem" }}>
            <div className="icon">🦊</div>
            <h3>No transactions yet</h3>
            <p>Buy a model or mint a license to see activity here.</p>
          </div>
        ) : (
          <div className={styles.table}>
            <div className={styles.rowHead}>
              <div>Type</div>
              <div>Model</div>
              <div>Status</div>
              <div>Value</div>
              <div>Hash</div>
              <div>Time</div>
            </div>
            {transactions.map((t, idx) => (
              <div key={`${t.hash || "nohash"}-${t.timestamp}-${idx}`} className={styles.row}>
                <div className={styles.cellType}>
                  <span className={styles.badge}>{t.type}</span>
                </div>
                <div title={t.modelName || ""} style={{ fontWeight: 600 }}>
                  {t.modelName || (t.modelId ? `Model #${t.modelId}` : "—")}
                </div>
                <div>
                  <span className={`${styles.status} ${styles["status_" + t.status] || ""}`}>
                    {t.status}
                  </span>
                </div>
                <div className={styles.mono}>{t.valueEth != null ? `Ξ ${t.valueEth}` : "—"}</div>
                <div className={styles.mono} title={t.hash || ""}>{formatHash(t.hash)}</div>
                <div style={{ color: "var(--text2)" }}>
                  {new Date(t.timestamp).toLocaleString()}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

