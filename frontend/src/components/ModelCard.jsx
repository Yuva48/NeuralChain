import { memo } from "react";
import { Link } from "react-router-dom";
import styles from "./ModelCard.module.css";

const CATEGORY_ICONS = {
  "Computer Vision": "👁️",
  "NLP": "💬",
  "Generative AI": "🎨",
  "Finance": "📈",
  "Audio": "🎵",
  "General": "🤖",
};

// Simple hash function to generate a consistent hue from a string
const getHueFromString = (str) => {
  let hash = 0;
  if (!str) return 0;
  for (let i = 0; i < str.length; i++) {
    hash = str.charCodeAt(i) + ((hash << 5) - hash);
  }
  return Math.abs(hash) % 360;
};

const ModelCard = memo(({ model }) => {
  const icon = CATEGORY_ICONS[model.category] || "🤖";
  const isFree = model.price === 0;
  
  // Generate a visually pleasing dynamic gradient based on model ID or name
  const hue1 = getHueFromString(model.id || model.name);
  const hue2 = (hue1 + 40) % 360;
  const gradient = `linear-gradient(135deg, hsl(${hue1}, 80%, 60%) 0%, hsl(${hue2}, 80%, 40%) 100%)`;

  return (
    <Link to={`/model/${model.id}`} className={styles.card}>
      {/* Dynamic Cover Graphic */}
      <div className={styles.cover} style={{ background: gradient }}>
        <div className={styles.coverOverlay}></div>
        <span className={styles.coverIcon}>{icon}</span>
      </div>

      <div className={styles.content}>
        {/* Header (Price & Badge) */}
        <div className={styles.header}>
          <div style={{ display: 'flex', gap: '0.35rem', alignItems: 'center', flexWrap: 'wrap' }}>
            <span className="badge badge-purple">{model.category}</span>
            {model.contractModelId ? (
              <span className="badge badge-cyan" title="Listed on Ethereum Smart Contract">✓ Blockchain Listed</span>
            ) : (
              <span className="badge badge-outline" style={{ opacity: 0.75 }} title="Legacy database listing">Legacy Listing</span>
            )}
            {model.verificationStatus === "verified" && (
              <span className="badge badge-green" title="Verified Model Certificate">✓ Verified</span>
            )}
          </div>
          <div className={styles.price}>
            {isFree ? (
              <span className="badge badge-green">FREE</span>
            ) : (
              <span className={styles.ethPrice}>
                <span className={styles.ethSymbol}>Ξ</span>
                {model.price}
              </span>
            )}
          </div>
        </div>

        {/* Body */}
        <div className={styles.body}>
          <h3 className={styles.name}>{model.name}</h3>
          <p className={styles.desc}>{model.description}</p>
        </div>

        {/* Tags */}
        {model.tags && model.tags.length > 0 && (
          <div className={styles.tags}>
            {model.tags.slice(0, 3).map((tag) => (
              <span key={tag} className={styles.tag}>{tag}</span>
            ))}
          </div>
        )}

        {/* Footer */}
        <div className={styles.footer}>
          <div className={styles.meta}>
            <span>⬇️ {model.downloads}</span>
            <span>⭐ {model.rating}</span>
          </div>
          <div className={styles.owner}>by {model.owner?.username || "Anonymous"}</div>
        </div>
      </div>

      {/* Hover CTA */}
      <div className={styles.ctaOverlay}>
        <span>View Details →</span>
      </div>
    </Link>
  );
});

export default ModelCard;
