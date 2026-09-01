import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { getPlatformStats, getCreatorLeaderboard, getModels } from '../services/api';
import styles from './Home.module.css';

const FEATURES = [
  { icon: '🔐', title: 'Verified Trust Layer', desc: 'Every listing is backed by immutable ownership, verification metadata, and model integrity tracking.' },
  { icon: '💎', title: 'Royalty-Managed Licensing', desc: 'Tokenized access licenses and automatic creator payouts create stronger monetization fairness.' },
  { icon: '⚡', title: 'Instant Marketplace Access', desc: 'Buy, compare, and deploy AI assets through a streamlined and high-trust experience.' },
  { icon: '📊', title: 'Creator Analytics', desc: 'Track revenue, downloads, buyer trust, and portfolio performance in one premium dashboard.' },
  { icon: '🌐', title: 'Decentralized Storage', desc: 'IPFS-backed distribution keeps model artifacts durable, verifiable, and censorship resistant.' },
  { icon: '👥', title: 'Community-Led Governance', desc: 'Token holders shape platform direction and platform governance with transparent voting.' },
];

const TRUST_PILLS = ['Verified models', 'ETH + NEURAL', 'Royalty engine', 'IPFS secured', 'DAO governance', 'Creator analytics'];

const TRUST_STACK = [
  { title: 'Model Integrity', text: 'Every asset is validated before publication with checks for structure, provenance, and trust signals.' },
  { title: 'Revenue Flow', text: 'Payments are routed with transparent on-chain logic and.creator-first royalties built into the purchase path.' },
  { title: 'Community Control', text: 'Governance is designed for long-term platform direction, not just a static product launch.' },
];

export default function Home() {
  const [stats, setStats] = useState([
    { value: "0", label: "Total Models" },
    { value: "0", label: "Models Sold" },
    { value: "0", label: "Transactions" },
    { value: "0", label: "Active Users" },
    { value: "0 ETH", label: "Total Volume" },
  ]);
  const [loadingStats, setLoadingStats] = useState(true);
  const [statsError, setStatsError] = useState(false);
  const [creators, setCreators] = useState([]);
  const [trending, setTrending] = useState([]);

  useEffect(() => {
    const fetchData = async () => {
      // 1. Fetch platform statistics
      try {
        setLoadingStats(true);
        setStatsError(false);
        const statsRes = await getPlatformStats();
        const data = statsRes.data || {};

        const totalModels = data.totalModels ?? 0;
        const modelsSold = data.modelsSold ?? 0;
        const transactions = data.verifiedTransactions ?? data.transactions ?? 0;
        const activeUsers = data.activeUsers ?? 0;
        const ethVolume = typeof data.ethRevenue === 'number'
          ? `${data.ethRevenue.toFixed(2)} ETH`
          : typeof data.totalRevenue === 'number'
          ? `${data.totalRevenue.toFixed(2)} ETH`
          : "0 ETH";

        setStats([
          { value: totalModels.toString(), label: "Total Models" },
          { value: modelsSold.toString(), label: "Models Sold" },
          { value: transactions.toString(), label: "Transactions" },
          { value: activeUsers.toString(), label: "Active Users" },
          { value: ethVolume, label: "Total Volume" },
        ]);
      } catch (error) {
        console.error("Failed to fetch platform stats:", error);
        setStatsError(true);
      } finally {
        setLoadingStats(false);
      }

      // 2. Fetch creators leaderboard
      try {
        const creatorsRes = await getCreatorLeaderboard();
        setCreators((creatorsRes.data || []).slice(0, 4));
      } catch (error) {
        console.error("Failed to fetch creators leaderboard:", error);
      }

      // 3. Fetch trending models
      try {
        const modelsRes = await getModels({ sort: 'popular', limit: 4 });
        const modelList = modelsRes.data?.models || (Array.isArray(modelsRes.data) ? modelsRes.data : []);
        setTrending(modelList.slice(0, 4).map(m => ({
          ...m,
          creator: m.owner?.username || "Anonymous",
          image: "🤖"
        })));
      } catch (error) {
        console.error("Failed to fetch trending models:", error);
      }
    };

    fetchData();
  }, []);

  return (
    <div>
      {/* ─── Hero Section ─────────────────────────────────────────────────────── */}
      <section className={styles.hero}>
        <div className={styles.heroBg} />
        <div className={styles.heroContent}>
          <div className={`badge badge-cyan ${styles.heroBadge} animate-fade`}>⚡ Production-grade AI marketplace</div>
          <h1 className={`${styles.heroTitle} animate-fade`} style={{ animationDelay: '0.1s' }}>
            Discover, trade, and <span className="gradient-text">monetize AI</span> with trust built in.
          </h1>
          <p className={`${styles.heroDesc} animate-fade`} style={{ animationDelay: '0.2s' }}>
            A premium marketplace for verified AI models, transparent ETH-backed payments, creator royalties, secure licensing, and governance-driven platform growth.
          </p>

          <div className={`${styles.trustPills} animate-fade`} style={{ animationDelay: '0.25s' }}>
            {TRUST_PILLS.map((item) => (
              <span key={item} className={styles.trustPill}>{item}</span>
            ))}
          </div>

          {/* Search Bar */}
          <div className={`${styles.heroSearch} animate-fade`} style={{ animationDelay: '0.3s' }}>
            <input
              type="text"
              placeholder="Search AI models, creators, or categories..."
              className="glass-input"
              style={{ flex: 1 }}
            />
            <button className="btn btn-primary">Search</button>
          </div>

          {/* CTA Buttons */}
          <div className={`${styles.heroCtas} animate-fade`} style={{ animationDelay: '0.4s' }}>
            <Link to="/marketplace" className="btn btn-primary btn-lg">🚀 Explore Marketplace</Link>
            <Link to="/upload" className="btn btn-secondary btn-lg">📤 Publish a Model</Link>
          </div>

          {/* Stats */}
          <div className={`${styles.stats} animate-fade`} style={{ animationDelay: '0.5s' }}>
            {loadingStats ? (
              <div style={{ color: 'var(--text2)', fontStyle: 'italic', gridColumn: '1 / -1' }}>
                Loading statistics...
              </div>
            ) : statsError ? (
              <div style={{ color: 'var(--text2)', fontStyle: 'italic', gridColumn: '1 / -1' }}>
                Statistics temporarily unavailable
              </div>
            ) : (
              stats.map(({ value, label }) => (
                <div key={label} className={styles.stat}>
                  <span className={styles.statValue}>{value}</span>
                  <span className={styles.statLabel}>{label}</span>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Hero Visual */}
        <div className={styles.heroVisual}>
          <div className={`${styles.heroPanel} glass-card animate-float`}>
            <div className={styles.panelBadge}>Live network</div>
            <div className={styles.panelHeadline}>AI marketplace pulse</div>
            <div className={styles.panelGrid}>
              <div>
                <span className={styles.panelLabel}>Verified</span>
                <strong>120+</strong>
              </div>
              <div>
                <span className={styles.panelLabel}>Volume</span>
                <strong>18.4 ETH</strong>
              </div>
              <div>
                <span className={styles.panelLabel}>Royalties</span>
                <strong>12.8%</strong>
              </div>
              <div>
                <span className={styles.panelLabel}>Growth</span>
                <strong>+34%</strong>
              </div>
            </div>
          </div>
          <div className={styles.graphicCard + ' glass-card animate-float'}>
            <span className={styles.graphicIcon}>🤖</span>
            <p>AI Model</p>
          </div>
          <div className={styles.graphicCard + ' glass-card animate-float'} style={{ animationDelay: '0.2s' }}>
            <span className={styles.graphicIcon}>⛓️</span>
            <p>Blockchain</p>
          </div>
        </div>
      </section>

      <section className={styles.section} style={{ background: 'rgba(9, 14, 24, 0.9)' }}>
        <div className="container">
          <div style={{ textAlign: 'center', marginBottom: 32 }}>
            <h2 className={styles.sectionTitle}>Built for trust, liquidity, and creator upside.</h2>
          </div>
          <div className="grid grid-3">
            {TRUST_STACK.map(({ title, text }) => (
              <div key={title} className={`${styles.featureCard} glass-card`}>
                <div className={styles.featureIcon}>✦</div>
                <h3 className={styles.featureTitle}>{title}</h3>
                <p className={styles.featureDesc}>{text}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ─── Trending Models ─────────────────────────────────────────────────────── */}
      <section className={styles.section}>
        <div className="container">
          <div className={styles.sectionHeader}>
            <h2>🔥 Trending Models</h2>
            <Link to="/marketplace" className="btn btn-secondary btn-sm">View All →</Link>
          </div>
          <div className="grid grid-4">
            {trending.map((model) => (
              <Link key={model.id} to={`/model/${model.id}`} className={`${styles.modelCard} glass-card`}>
                <div className={styles.cardHeader}>
                  <div className={styles.cardIcon}>{model.image}</div>
                  <span className={styles.cardCategory}>{model.category}</span>
                </div>
                <h3 className={styles.cardTitle}>{model.name}</h3>
                <p className={styles.cardCreator}>{model.creator}</p>
                <div className={styles.cardMetrics}>
                  <div className={styles.metric}>
                    <span className={styles.metricLabel}>Rating</span>
                    <span className={styles.metricValue}>⭐ {model.rating}</span>
                  </div>
                  <div className={styles.metric}>
                    <span className={styles.metricLabel}>Downloads</span>
                    <span className={styles.metricValue}>{(model.downloads / 1000).toFixed(1)}k</span>
                  </div>
                </div>
                <div className={styles.cardFooter}>
                  <span className={styles.price}>{model.price} ETH</span>
                  <button className="btn btn-sm btn-primary" onClick={(e) => e.preventDefault()}>Buy</button>
                </div>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* ─── Featured Creators ───────────────────────────────────────────────────── */}
      <section className={styles.section}>
        <div className="container">
          <div className={styles.sectionHeader}>
            <h2>⭐ Featured Creators</h2>
            <Link to="/leaderboard" className="btn btn-secondary btn-sm">Top Creators →</Link>
          </div>
          <div className="grid grid-4">
            {creators.map((creator, idx) => (
              <div key={creator.username || idx} className={`${styles.creatorCard} glass-card`}>
                <div className={styles.creatorAvatar}>{'👤'}</div>
                <h3 className={styles.creatorName}>{creator.username}</h3>
                <div className={styles.creatorStats}>
                  <div className={styles.creatorStat}>
                    <span className={styles.statNum}>{creator.modelCount}</span>
                    <span className={styles.statName}>Models</span>
                  </div>
                  <div className={styles.creatorStat}>
                    <span className={styles.statNum}>{creator.totalDownloads}</span>
                    <span className={styles.statName}>Followers</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ─── Features Section ─────────────────────────────────────────────────────── */}
      <section className={styles.section} style={{ background: 'var(--bg2)' }}>
        <div className="container">
          <div style={{ textAlign: 'center', marginBottom: 48 }}>
            <h2 className={styles.sectionTitle}>Why Choose Our Platform?</h2>
          </div>
          <div className="grid grid-3">
            {FEATURES.map(({ icon, title, desc }) => (
              <div key={title} className={`${styles.featureCard} glass-card`}>
                <div className={styles.featureIcon}>{icon}</div>
                <h3 className={styles.featureTitle}>{title}</h3>
                <p className={styles.featureDesc}>{desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ─── CTA Section ──────────────────────────────────────────────────────────── */}
      <section className={styles.ctaSection}>
        <div className={`${styles.ctaContent} glass-card`}>
          <h2>Ready to Monetize Your AI?</h2>
          <p>Start selling your models in minutes with our simple upload process.</p>
          <div className={styles.ctaButtons}>
            <Link to="/upload" className="btn btn-primary btn-lg">Get Started Now</Link>
            <a href="#" className="btn btn-ghost btn-lg">Learn More</a>
          </div>
        </div>
      </section>
    </div>
  );
}
