import { useState, useEffect } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import { getModel, checkAccess, purchaseModel } from "../services/api";
import { useAuth } from "../context/AuthContext.jsx";
import { useWeb3 } from "../context/Web3Context.jsx";
import styles from "./ModelDetail.module.css";

const CATEGORY_ICONS = {
  "Computer Vision": "👁️", "NLP": "💬", "Generative AI": "🎨",
  "Finance": "📈", "Audio": "🎵", "General": "🤖",
};

export default function ModelDetail() {
  const { id } = useParams();
  const { user } = useAuth();
  const { account, connectWallet, signer } = useWeb3();
  const navigate = useNavigate();

  const [model, setModel] = useState(null);
  const [access, setAccess] = useState(null);
  const [loading, setLoading] = useState(true);
  const [buying, setBuying] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);

  useEffect(() => {
    const load = async () => {
      try {
        const res = await getModel(id);
        setModel(res.data);
        if (user) {
          const acc = await checkAccess(id);
          setAccess(acc.data);
        }
      } catch {
        setError("Model not found.");
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [id, user]);

  const handleBuy = async () => {
    if (!user) { navigate("/login"); return; }
    setBuying(true);
    setError(null);
    try {
      // Try blockchain payment if wallet connected
      if (account && signer && model.price > 0) {
        const { ethers } = await import("ethers");
        const priceWei = ethers.parseEther(model.price.toString());
        const tx = await signer.sendTransaction({
          to: model.owner?.walletAddress || account,
          value: priceWei,
        });
        await tx.wait();
        setSuccess(`✅ Transaction confirmed! Hash: ${tx.hash.slice(0, 20)}...`);
      }
      // Record purchase in backend (demo mode or after blockchain tx)
      await purchaseModel(id);
      const acc = await checkAccess(id);
      setAccess(acc.data);
      setSuccess(success || "✅ Purchase successful! You now have access to this model.");
    } catch (err) {
      setError(err.response?.data?.error || err.message || "Purchase failed.");
    } finally {
      setBuying(false);
    }
  };

  const handleDownload = () => {
    if (access?.ipfsHash) {
      window.open(`https://gateway.pinata.cloud/ipfs/${access.ipfsHash}`, "_blank");
    }
  };

  if (loading) return (
    <div className="loading-container" style={{ paddingTop: 120 }}>
      <div className="spinner" />
      <p>Loading model details...</p>
    </div>
  );

  if (error && !model) return (
    <div className="page-wrapper" style={{ paddingTop: 100, textAlign: "center" }}>
      <div style={{ fontSize: "3rem", marginBottom: 16 }}>😕</div>
      <h2>{error}</h2>
      <Link to="/marketplace" className="btn btn-primary" style={{ marginTop: 24 }}>← Back to Marketplace</Link>
    </div>
  );

  const isFree = model.price === 0;
  const hasAccess = access?.hasAccess || isFree;
  const isOwner = access?.isOwner;
  const icon = CATEGORY_ICONS[model.category] || "🤖";

  return (
    <div className="page-wrapper" style={{ paddingTop: 90, maxWidth: 1100 }}>
      <Link to="/marketplace" className={styles.back}>← Back to Marketplace</Link>

      <div className={styles.layout}>
        {/* LEFT: Info */}
        <div className={styles.main}>
          <div className={styles.titleRow}>
            <div className={styles.iconBig}>{icon}</div>
            <div>
              <div style={{ display: "flex", gap: 8, marginBottom: 8 }}>
                <span className="badge badge-purple">{model.category}</span>
                {isFree && <span className="badge badge-green">FREE</span>}
                {isOwner && <span className="badge badge-cyan">Your Model</span>}
              </div>
              <h1 className={styles.title}>{model.name}</h1>
              <p className={styles.ownerLine}>by <strong>{model.owner?.username}</strong></p>
            </div>
          </div>

          <p className={styles.description}>{model.description}</p>

          {/* Tags */}
          {model.tags?.length > 0 && (
            <div style={{ display: "flex", gap: 8, flexWrap: "wrap", margin: "20px 0" }}>
              {model.tags.map(t => <span key={t} className={styles.tag}>{t}</span>)}
            </div>
          )}

          {/* Stats row */}
          <div className={styles.statsRow}>
            <div className={styles.statItem}><span>⬇️</span><span>{model.downloads} Downloads</span></div>
            <div className={styles.statItem}><span>⭐</span><span>{model.rating} Rating</span></div>
            <div className={styles.statItem}><span>📅</span><span>{new Date(model.createdAt).toLocaleDateString()}</span></div>
          </div>

          {/* IPFS Hash */}
          <div className={styles.ipfsBox}>
            <span className={styles.ipfsLabel}>📦 IPFS Hash</span>
            <span className={styles.ipfsHash}>{hasAccess ? model.ipfsHash : model.ipfsHash.slice(0, 12) + "••••••••••••"}</span>
          </div>

          {/* Blockchain Info */}
          {model.txHash && (
            <div className={styles.ipfsBox} style={{ marginTop: 8 }}>
              <span className={styles.ipfsLabel}>⛓️ Tx Hash</span>
              <span className={styles.ipfsHash}>{model.txHash.slice(0, 20)}...</span>
            </div>
          )}

          {/* Alerts */}
          {error && <div className="alert alert-error" style={{ marginTop: 16 }}>⚠️ {error}</div>}
          {success && <div className="alert alert-success" style={{ marginTop: 16 }}>{success}</div>}
        </div>

        {/* RIGHT: Purchase Card */}
        <div className={styles.sidebar}>
          <div className={`glass-card ${styles.purchaseCard}`}>
            <div className={styles.priceDisplay}>
              {isFree ? (
                <span style={{ color: "var(--green)", fontSize: "1.8rem", fontWeight: 700 }}>FREE</span>
              ) : (
                <>
                  <span className={styles.ethSym}>Ξ</span>
                  <span className={styles.priceNum}>{model.price}</span>
                  <span className={styles.ethLabel}>ETH</span>
                </>
              )}
            </div>

            {!user ? (
              <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                <Link to="/login" className="btn btn-primary" style={{ width: "100%", justifyContent: "center" }}>🔐 Login to Purchase</Link>
                <Link to="/register" className="btn btn-secondary" style={{ width: "100%", justifyContent: "center" }}>✨ Create Account</Link>
              </div>
            ) : hasAccess ? (
              <div>
                <div className="alert alert-success" style={{ marginBottom: 16 }}>
                  {isOwner ? "✅ You own this model" : "✅ You have access"}
                </div>
                <button id="download-btn" className="btn btn-primary" style={{ width: "100%" }} onClick={handleDownload}>
                  ⬇️ Download from IPFS
                </button>
              </div>
            ) : (
              <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
                {!account && !isFree && (
                  <button className="btn btn-outline" style={{ width: "100%" }} onClick={connectWallet}>
                    🦊 Connect MetaMask
                  </button>
                )}
                <button
                  id="buy-btn"
                  className="btn btn-primary"
                  style={{ width: "100%" }}
                  onClick={handleBuy}
                  disabled={buying}
                >
                  {buying ? "⏳ Processing..." : isFree ? "⬇️ Get Free Access" : `💳 Buy for Ξ${model.price}`}
                </button>
                {!account && !isFree && (
                  <p style={{ fontSize: "0.8rem", color: "var(--text3)", textAlign: "center" }}>
                    Connect MetaMask for blockchain payment, or buy in demo mode.
                  </p>
                )}
              </div>
            )}

            <hr className="divider" />
            <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
              {[["🔒", "Secure blockchain ownership"], ["📦", "IPFS decentralised storage"], ["⚡", "Instant access after purchase"], ["♾️", "Lifetime access"]].map(([icon, text]) => (
                <div key={text} style={{ display: "flex", gap: 10, alignItems: "center", fontSize: "0.85rem", color: "var(--text2)" }}>
                  <span>{icon}</span><span>{text}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
