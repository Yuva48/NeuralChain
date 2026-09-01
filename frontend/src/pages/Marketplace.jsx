import { useState, useEffect, useCallback, useMemo } from "react";
import { getModels } from "../services/api";
import ModelCard from "../components/ModelCard.jsx";
import SkeletonCard from "../components/SkeletonCard.jsx";
import styles from "./Marketplace.module.css";

const CATEGORIES = ["All", "Computer Vision", "NLP", "Generative AI", "Finance", "Audio", "General"];
const SORT_OPTIONS = [
  { value: "newest", label: "Newest First" },
  { value: "popular", label: "Most Popular" },
  { value: "trending", label: "Trending" },
  { value: "price-asc", label: "Price: Low → High" },
  { value: "price-desc", label: "Price: High → Low" },
  { value: "rating", label: "Best Rated" },
];

const MARKETPLACE_HIGHLIGHTS = [
  { label: "Verified assets", value: "120+" },
  { label: "Royalty payout", value: "10%" },
  { label: "Live on-chain", value: "ETH" },
  { label: "Creator trust", value: "99%" },
];

export default function Marketplace() {
  const [models, setModels] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [search, setSearch] = useState("");
  const [category, setCategory] = useState("All");
  const [sort, setSort] = useState("newest");
  const [searchInput, setSearchInput] = useState("");
  const highestPrice = useMemo(() => {
    if (models.length === 0) return 1;
    const max = Math.max(...models.map(m => m.price || 0));
    return max > 0 ? max : 1;
  }, [models]);

  const [filters, setFilters] = useState({
    minPrice: 0,
    maxPrice: 10,
    minAccuracy: 0,
    freeOnly: false,
    verifiedOnly: false,
  });

  useEffect(() => {
    setFilters(prev => ({ ...prev, maxPrice: highestPrice }));
  }, [highestPrice]);

  const fetchModels = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await getModels({
        category: category !== "All" ? category : undefined,
        search: search || undefined,
        sort,
        minPrice: filters.minPrice > 0 ? filters.minPrice : undefined,
        maxPrice: filters.maxPrice > 0 && filters.maxPrice < highestPrice ? filters.maxPrice : undefined,
        freeOnly: filters.freeOnly ? true : undefined,
        verifiedOnly: filters.verifiedOnly ? true : undefined,
      });
      setModels(response.data?.models || []);
    } catch (err) {
      console.error("Failed to fetch models:", err);
      setError("Failed to load models. Please try again.");
    } finally {
      setLoading(false);
    }
  }, [category, search, sort, filters.minPrice, filters.maxPrice, filters.freeOnly, filters.verifiedOnly, highestPrice]);

  useEffect(() => {
    fetchModels();
  }, [fetchModels]);

  // Debounce search
  useEffect(() => {
    const t = setTimeout(() => setSearch(searchInput), 400);
    return () => clearTimeout(t);
  }, [searchInput]);

  // Client-side filtering & sorting using canonical data representations
  const filteredModels = useMemo(() => {
    let result = [...models];

    // Search filter across name, owner username, description, and tags
    if (search) {
      const q = search.toLowerCase();
      result = result.filter(m =>
        (m.name || "").toLowerCase().includes(q) ||
        (m.owner?.username || "").toLowerCase().includes(q) ||
        (m.description || "").toLowerCase().includes(q) ||
        (Array.isArray(m.tags) && m.tags.some(t => String(t).toLowerCase().includes(q)))
      );
    }

    // Category filter
    if (category !== "All") {
      result = result.filter(m => m.category === category);
    }

    // Price filter (canonical: price is a number in ETH)
    if (filters.minPrice > 0) {
      result = result.filter(m => (m.price || 0) >= filters.minPrice);
    }
    if (filters.maxPrice > 0) {
      result = result.filter(m => (m.price || 0) <= filters.maxPrice);
    }

    // Free filter (canonical: price === 0)
    if (filters.freeOnly) {
      result = result.filter(m => m.price === 0);
    }

    // Verified filter (canonical: verificationStatus === 'verified')
    if (filters.verifiedOnly) {
      result = result.filter(m => m.verificationStatus === "verified");
    }

    // Sorting
    if (sort === "price-asc") result.sort((a, b) => (a.price || 0) - (b.price || 0));
    else if (sort === "price-desc") result.sort((a, b) => (b.price || 0) - (a.price || 0));
    else if (sort === "rating") result.sort((a, b) => (parseFloat(b.rating) || 0) - (parseFloat(a.rating) || 0));
    else if (sort === "popular") result.sort((a, b) => (b.downloads || 0) - (a.downloads || 0));
    else if (sort === "trending") result.sort((a, b) => (parseFloat(b.rating) || 0) - (parseFloat(a.rating) || 0));
    else result.sort((a, b) => new Date(b.createdAt || 0) - new Date(a.createdAt || 0));

    return result;
  }, [models, search, category, sort, filters]);

  const skeletons = useMemo(() => Array(6).fill(0).map((_, i) => <SkeletonCard key={`skeleton-${i}`} />), []);

  const handleFilterChange = (key, value) => {
    setFilters(prev => ({ ...prev, [key]: value }));
  };

  return (
    <div className="page-wrapper" style={{ paddingTop: 90 }}>
      {/* Header */}
      <div className={styles.header}>
        <div>
          <div className={styles.eyebrow}>Marketplace intelligence</div>
          <h1 className="section-title">Explore <span className="gradient-text">Models</span></h1>
          <p style={{ color: "var(--text2)", marginTop: 8 }}>
            {loading ? "Loading available models..." : `${filteredModels.length} model${filteredModels.length !== 1 ? "s" : ""} found`}
          </p>
        </div>
      </div>

      <div className={styles.highlightStrip}>
        {MARKETPLACE_HIGHLIGHTS.map((item) => (
          <div key={item.label} className={styles.highlightCard}>
            <span>{item.label}</span>
            <strong>{item.value}</strong>
          </div>
        ))}
      </div>

      <div className={styles.mainContent}>
        {/* Sidebar Filters */}
        <aside className={styles.sidebar}>
          <div className="glass-card" style={{ padding: '1.5rem' }}>
            <h3 style={{ marginBottom: '1.5rem', fontWeight: '700' }}>Filters</h3>

            {/* Price Range */}
            <div className={styles.filterGroup}>
              <label style={{ fontWeight: '600', marginBottom: '0.75rem', display: 'block' }}>
                Price Range (ETH)
              </label>
              <div style={{ display: 'flex', gap: '0.5rem' }}>
                <input
                  type="number"
                  min="0"
                  step="0.001"
                  max={highestPrice}
                  value={filters.minPrice}
                  onChange={(e) => handleFilterChange('minPrice', parseFloat(e.target.value) || 0)}
                  className="glass-input"
                  style={{ width: '60px' }}
                  placeholder="Min"
                />
                <input
                  type="number"
                  min="0"
                  step="0.001"
                  max={highestPrice}
                  value={filters.maxPrice}
                  onChange={(e) => handleFilterChange('maxPrice', parseFloat(e.target.value) || 0)}
                  className="glass-input"
                  style={{ width: '60px' }}
                  placeholder="Max"
                />
              </div>
            </div>

            {/* Accuracy Filter — Marked as benchmark unavailable per schema requirement */}
            <div className={styles.filterGroup}>
              <label style={{ fontWeight: '600', marginBottom: '0.25rem', display: 'block', color: 'var(--text2)' }}>
                Min Accuracy: Unavailable
              </label>
              <input
                type="range"
                min="0"
                max="100"
                value="0"
                disabled
                style={{ width: '100%', opacity: 0.4, cursor: 'not-allowed' }}
              />
              <span style={{ fontSize: '0.75rem', color: 'var(--text2)', display: 'block', marginTop: '0.25rem' }}>
                Benchmark data not in model schema
              </span>
            </div>

            {/* Checkboxes */}
            <div className={styles.filterGroup}>
              <label style={{ display: 'flex', gap: '0.5rem', alignItems: 'center', cursor: 'pointer', marginBottom: '0.75rem' }}>
                <input
                  type="checkbox"
                  checked={filters.freeOnly}
                  onChange={(e) => handleFilterChange('freeOnly', e.target.checked)}
                />
                <span>Free Models Only</span>
              </label>
              <label style={{ display: 'flex', gap: '0.5rem', alignItems: 'center', cursor: 'pointer' }}>
                <input
                  type="checkbox"
                  checked={filters.verifiedOnly}
                  onChange={(e) => handleFilterChange('verifiedOnly', e.target.checked)}
                />
                <span>Verified Models Only</span>
              </label>
            </div>

            {/* Reset Filters */}
            <button
              onClick={() => setFilters({ minPrice: 0, maxPrice: highestPrice, minAccuracy: 0, freeOnly: false, verifiedOnly: false })}
              className="btn btn-secondary btn-sm"
              style={{ width: '100%', marginTop: '1rem' }}
            >
              Reset Filters
            </button>
          </div>
        </aside>

        {/* Main Content */}
        <div className={styles.content}>
          {/* Search & Sort Bar */}
          <div className={styles.toolbar}>
            <div className={styles.searchWrap}>
              <span className={styles.searchIcon}>🔍</span>
              <input
                id="search-input"
                type="text"
                className={styles.searchInput}
                placeholder="Search models, creators..."
                value={searchInput}
                onChange={(e) => setSearchInput(e.target.value)}
              />
            </div>

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
          ) : filteredModels.length === 0 ? (
            <div className="empty-state">
              <div className="icon">🔍</div>
              <h3>No models found</h3>
              <p>Try adjusting your filters or search terms.</p>
            </div>
          ) : (
            <div className={styles.grid}>
              {filteredModels.map((model) => (
                <ModelCard key={model.id} model={model} />
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

