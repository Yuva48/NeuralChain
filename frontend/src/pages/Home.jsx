import { Link } from "react-router-dom";
import styles from "./Home.module.css";

const STATS = [
  { value: "6+", label: "AI Models Listed" },
  { value: "IPFS", label: "Decentralised Storage" },
  { value: "ETH", label: "Blockchain Payments" },
  { value: "100%", label: "Ownership Verified" },
];

const STEPS = [
  { icon: "⬆️", title: "Developer Uploads", desc: "Upload your AI model file. It's stored on IPFS and metadata is recorded on the Ethereum blockchain." },
  { icon: "🛒", title: "User Discovers", desc: "Browse the marketplace. Each model shows its category, price in ETH, downloads, and rating." },
  { icon: "💳", title: "Pays via MetaMask", desc: "Click Buy. MetaMask pops up. Confirm the transaction. The smart contract transfers ETH to the seller instantly." },
  { icon: "🔐", title: "Gets Secure Access", desc: "Ownership is verified on-chain. Only verified buyers can download the model from IPFS." },
];

const FEATURES = [
  { icon: "⛓️", title: "Blockchain Ownership", desc: "Every model listing and purchase is recorded immutably on Ethereum — no central authority." },
  { icon: "📦", title: "IPFS Storage", desc: "AI model files are stored on IPFS, a distributed file system. No single point of failure." },
  { icon: "📝", title: "Smart Contracts", desc: "Payments, access control, and ownership transfer are all handled by auditable Solidity contracts." },
  { icon: "🦊", title: "MetaMask Payments", desc: "Pay directly with your Ethereum wallet. Instant, borderless, no middlemen." },
  { icon: "🔒", title: "Access Control", desc: "Only buyers can access model files. Ownership is verified before any download is allowed." },
  { icon: "🌐", title: "Decentralised", desc: "No company controls your models or payments. Trust the code, not the corporation." },
];

export default function Home() {
  return (
    <div>
      {/* ─── Hero ─── */}
      <section className={styles.hero}>
        <div className={styles.heroBg} />
        <div className={styles.heroContent}>
          <div className={`badge badge-cyan ${styles.heroBadge} fade-in`}>🚀 Blockchain-Powered AI Marketplace</div>
          <h1 className={`${styles.heroTitle} fade-in-delay-1`}>
            The Future of<br />
            <span className="gradient-text">AI Model Trading</span>
          </h1>
          <p className={`${styles.heroDesc} fade-in-delay-2`}>
            Upload, discover, and purchase AI models securely using Ethereum smart contracts and IPFS storage. True ownership. Zero middlemen.
          </p>
          <div className={`${styles.heroCta} fade-in-delay-3`}>
            <Link to="/marketplace" className="btn btn-primary btn-lg">🛒 Explore Marketplace</Link>
            <Link to="/register" className="btn btn-secondary btn-lg">Get Started Free →</Link>
          </div>

          {/* Stats */}
          <div className={`${styles.stats} fade-in-delay-3`}>
            {STATS.map(({ value, label }) => (
              <div key={label} className={styles.stat}>
                <span className={styles.statValue}>{value}</span>
                <span className={styles.statLabel}>{label}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Floating Illustration */}
        <div className={styles.heroVisual}>
          <div className={styles.orb1} />
          <div className={styles.orb2} />
          <div className={styles.floatCard}>
            <div className={styles.floatCardIcon}>🤖</div>
            <div>
              <div className={styles.floatCardTitle}>ResNet-50 Classifier</div>
              <div className={styles.floatCardSub}>Ξ 0.05 · ⭐ 4.8</div>
            </div>
          </div>
          <div className={`${styles.floatCard} ${styles.floatCard2}`}>
            <div className={styles.floatCardIcon}>💬</div>
            <div>
              <div className={styles.floatCardTitle}>GPT-2 Medical</div>
              <div className={styles.floatCardSub}>Ξ 0.10 · ⭐ 4.6</div>
            </div>
          </div>
          <div className={`${styles.floatCard} ${styles.floatCard3}`}>
            <div className={styles.floatCardIcon}>🎨</div>
            <div>
              <div className={styles.floatCardTitle}>Stable Diffusion Lite</div>
              <div className={styles.floatCardSub}>Ξ 0.15 · ⭐ 4.5</div>
            </div>
          </div>
        </div>
      </section>

      {/* ─── How it Works ─── */}
      <section className={styles.section}>
        <div className="container">
          <div style={{ textAlign: "center", marginBottom: 48 }}>
            <div className="badge badge-purple" style={{ marginBottom: 12 }}>How It Works</div>
            <h2 className="section-title">From Upload to <span className="gradient-text">Ownership</span></h2>
            <p style={{ color: "var(--text2)", marginTop: 12, maxWidth: 520, margin: "12px auto 0" }}>
              Four simple steps powered by blockchain technology
            </p>
          </div>
          <div className={styles.stepsGrid}>
            {STEPS.map((step, i) => (
              <div key={i} className={`glass-card ${styles.stepCard}`}>
                <div className={styles.stepNum}>{String(i + 1).padStart(2, "0")}</div>
                <div className={styles.stepIcon}>{step.icon}</div>
                <h3 className={styles.stepTitle}>{step.title}</h3>
                <p className={styles.stepDesc}>{step.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ─── Features ─── */}
      <section className={styles.section} style={{ background: "var(--bg2)" }}>
        <div className="container">
          <div style={{ textAlign: "center", marginBottom: 48 }}>
            <div className="badge badge-amber" style={{ marginBottom: 12 }}>Why AIModelChain</div>
            <h2 className="section-title">Built on <span className="gradient-text">Web3 Principles</span></h2>
          </div>
          <div className={styles.featuresGrid}>
            {FEATURES.map(({ icon, title, desc }) => (
              <div key={title} className={`glass-card ${styles.featureCard}`}>
                <div className={styles.featureIcon}>{icon}</div>
                <h3 className={styles.featureTitle}>{title}</h3>
                <p className={styles.featureDesc}>{desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ─── CTA Banner ─── */}
      <section className={styles.ctaBanner}>
        <div className="container" style={{ textAlign: "center" }}>
          <h2 style={{ fontSize: "2rem", fontWeight: 700, marginBottom: 16 }}>
            Ready to join the <span className="gradient-text">decentralized</span> future?
          </h2>
          <p style={{ color: "var(--text2)", marginBottom: 32, maxWidth: 480, margin: "0 auto 32px" }}>
            Start buying or selling AI models on the blockchain today. Connect your MetaMask wallet and explore.
          </p>
          <div style={{ display: "flex", gap: 16, justifyContent: "center", flexWrap: "wrap" }}>
            <Link to="/marketplace" className="btn btn-primary btn-lg">Browse Models</Link>
            <Link to="/register" className="btn btn-outline btn-lg">Create Account</Link>
          </div>
        </div>
      </section>
    </div>
  );
}
