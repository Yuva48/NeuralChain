import { useState, useEffect, useCallback, useMemo } from "react";
import { getModels } from "../services/api";
import ModelCard from "../components/ModelCard.jsx";
import styles from "./Marketplace.module.css";

const CATEGORIES = ["All", "Computer Vision", "NLP", "Generative AI", "Finance", "Audio", "General"];
const SORT_OPTIONS = [
  { value: "newest", label: "Newest First" },
  { value: "popular", label: "Most Popular" },
  { value: "price-asc", label: "Price: Low → High" },
  { value: "price-desc", label: "Price: High → Low" },
];

// Skeleton loader component
const SkeletonCard = () => (
  <div className={styles.skeletonCard}>
    <div className={styles.skeletonCover}></div>
    <div className={styles.skeletonContent}>
      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '10px' }}>
        <div className={`${styles.skeletonLine} ${styles.badge}`}></div>
        <div className={`${styles.skeletonLine} ${styles.badge}`}></div>
      </div>
      <div className={`${styles.skeletonLine} ${styles.title}`}></div>
      <div className={styles.skeletonLine}></div>
      <div className={`${styles.skeletonLine} ${styles.medium}`}></div>
      <div style={{ marginTop: 'auto', paddingTop: '20px', borderTop: '1px solid var(--border)' }}>
        <div className={`${styles.skeletonLine} ${styles.short}`}></div>
      </div>
    </div>
  </div>
);

export default function Marketplace() {
  const [models, setModels] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [search, setSearch] = useState("");
  const [category, setCategory] = useState("All");
  const [sort, setSort] = useState("newest");
  const [searchInput, setSearchInput] = useState("");

  const fetchModels = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await getModels({ search, category, sort });
      setModels(res.data.models);
    } catch {
      setError("Failed to load models. Please make sure the backend is running.");
    } finally {
      setLoading(false);
    }
  }, [search, category, sort]);

  useEffect(() => { fetchModels(); }, [fetchModels]);

  // Debounce search
  useEffect(() => {
    const t = setTimeout(() => setSearch(searchInput), 400);
    return () => clearTimeout(t);
  }, [searchInput]);

  // Memoize skeleton array
  const skeletons = useMemo(() => Array(6).fill(0).map((_, i) => <SkeletonCard key={`skeleton-${i}`} />), []);

  return (
    <div className="page-wrapper" style={{ paddingTop: 90 }}>
      {/* Header */}
      <div className={styles.header}>
        <div>
          <h1 className="section-title">AI Model <span className="gradient-text">Marketplace</span></h1>
          <p style={{ color: "var(--text2)", marginTop: 8 }}>
            {loading ? "Loading available models..." : `${models.length} model${models.length !== 1 ? "s" : ""} available`}
          </p>
        </div>
      </div>

      {/* Filters */}
      <div className={styles.filters}>
        {/* Search */}
        <div className={styles.searchWrap}>
          <span className={styles.searchIcon}>🔍</span>
          <input
            id="search-input"
            type="text"
            className={styles.searchInput}
            placeholder="Search models..."
            value={searchInput}
            onChange={(e) => setSearchInput(e.target.value)}
          />
        </div>

        {/* Sort */}
        <select
          id="sort-select"
          className={styles.select}
          value={sort}
          onChange={(e) => setSort(e.target.value)}
        >
          {SORT_OPTIONS.map((o) => (
            <option key={o.value} value={o.value}>{o.label}</option>
          ))}
        </select>
      </div>

      {/* Category Pills */}
      <div className={styles.categories}>
        {CATEGORIES.map((cat) => (
          <button
            key={cat}
            id={`cat-${cat.replace(/\s+/g, "-").toLowerCase()}`}
            className={`${styles.catBtn} ${category === cat ? styles.catActive : ""}`}
            onClick={() => setCategory(cat)}
          >
            {cat}
          </button>
        ))}
      </div>

      {/* Content */}
      {error && (
        <div className="alert alert-error" style={{ marginBottom: 24 }}>
          ⚠️ {error}
        </div>
      )}

      {loading ? (
        <div className={styles.grid}>
          {skeletons}
        </div>
      ) : models.length === 0 ? (
        <div className="empty-state">
          <div className="icon">🤖</div>
          <h3>No models found</h3>
          <p>Try adjusting your search or category filter.</p>
        </div>
      ) : (
        <div className={styles.grid}>
          {models.map((model) => (
            <ModelCard key={model.id} model={model} />
          ))}
        </div>
      )}
    </div>
  );
}

