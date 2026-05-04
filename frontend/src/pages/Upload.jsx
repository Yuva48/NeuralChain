import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { uploadToIPFS, createModel } from "../services/api";
import { useAuth } from "../context/AuthContext.jsx";
import { useWeb3 } from "../context/Web3Context.jsx";
import styles from "./Upload.module.css";

const CATEGORIES = ["Computer Vision", "NLP", "Generative AI", "Finance", "Audio", "General"];

export default function Upload() {
  const { user } = useAuth();
  const { account, signer, connectWallet } = useWeb3();
  const navigate = useNavigate();

  const [form, setForm] = useState({ name: "", description: "", category: "General", price: "0.05", tags: "" });
  const [file, setFile] = useState(null);
  const [step, setStep] = useState("idle"); // idle | uploading-ipfs | uploading-chain | done
  const [error, setError] = useState(null);
  const [ipfsResult, setIpfsResult] = useState(null);

  const handleChange = (e) => setForm({ ...form, [e.target.name]: e.target.value });

  const handleFileChange = (e) => {
    const f = e.target.files[0];
    if (f) setFile(f);
  };

  const handleDrop = (e) => {
    e.preventDefault();
    const f = e.dataTransfer.files[0];
    if (f) setFile(f);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!file) { setError("Please select a file to upload."); return; }
    setError(null);

    try {
      // Step 1: Upload to IPFS
      setStep("uploading-ipfs");
      const fd = new FormData();
      fd.append("file", file);
      const ipfsRes = await uploadToIPFS(fd);
      const { ipfsHash, demoMode } = ipfsRes.data;
      setIpfsResult(ipfsRes.data);

      // Step 2: (Optional) Record on blockchain
      setStep("uploading-chain");
      let txHash = null;
      let contractModelId = null;

      if (account && signer && !demoMode) {
        try {
          const contractAddress = import.meta.env.VITE_CONTRACT_ADDRESS;
          const zeroAddr = "0x0000000000000000000000000000000000000000";
          if (contractAddress && contractAddress !== zeroAddr) {
            const { ethers } = await import("ethers");
            const contractData = await import("../contracts/ModelMarketplace.json").catch(() => null);
            if (contractData) {
              const contract = new ethers.Contract(contractAddress, contractData.default.abi, signer);
              const priceWei = ethers.parseEther(form.price || "0");
              const tx = await contract.uploadModel(form.name, form.description, form.category, ipfsHash, priceWei);
              const receipt = await tx.wait();
              txHash = receipt.hash;
            }
          }
        } catch (chainErr) {
          console.warn("Blockchain tx failed (demo mode continues):", chainErr.message);
        }
      }

      // Step 3: Save metadata to backend
      const tags = form.tags.split(",").map(t => t.trim()).filter(Boolean);
      await createModel({
        name: form.name,
        description: form.description,
        category: form.category,
        ipfsHash,
        price: parseFloat(form.price) || 0,
        txHash,
        contractModelId,
        tags,
      });

      setStep("done");
    } catch (err) {
      setError(err.response?.data?.error || err.message || "Upload failed.");
      setStep("idle");
    }
  };

  const formatBytes = (b) => b < 1024 * 1024 ? `${(b / 1024).toFixed(1)} KB` : `${(b / 1024 / 1024).toFixed(1)} MB`;

  if (step === "done") {
    return (
      <div className="page-wrapper" style={{ paddingTop: 100, textAlign: "center", maxWidth: 600 }}>
        <div style={{ fontSize: "4rem", marginBottom: 20 }}>🎉</div>
        <h1 style={{ fontSize: "2rem", marginBottom: 12 }}>Model <span className="gradient-text">Listed!</span></h1>
        <p style={{ color: "var(--text2)", marginBottom: 24 }}>Your AI model has been uploaded to IPFS and listed on the marketplace.</p>
        {ipfsResult && (
          <div className={styles.successBox}>
            <div className={styles.successRow}><span>📦 IPFS Hash:</span><span className={styles.mono}>{ipfsResult.ipfsHash}</span></div>
            {ipfsResult.demoMode && <div className="alert alert-info" style={{ marginTop: 12, fontSize: "0.82rem" }}>⚠️ Demo mode: Mock IPFS hash used. Set up Pinata for real storage.</div>}
          </div>
        )}
        <div style={{ display: "flex", gap: 12, justifyContent: "center", marginTop: 28 }}>
          <button className="btn btn-primary" onClick={() => navigate("/marketplace")}>🛒 View Marketplace</button>
          <button className="btn btn-secondary" onClick={() => { setStep("idle"); setFile(null); setIpfsResult(null); setForm({ name: "", description: "", category: "General", price: "0.05", tags: "" }); }}>
            ⬆️ Upload Another
          </button>
        </div>
      </div>
    );
  }

  const isUploading = step !== "idle";

  return (
    <div className="page-wrapper" style={{ paddingTop: 90, maxWidth: 760 }}>
      <h1 className="section-title" style={{ marginBottom: 8 }}>Upload <span className="gradient-text">AI Model</span></h1>
      <p style={{ color: "var(--text2)", marginBottom: 32 }}>Your file will be stored on IPFS. Metadata is recorded on the blockchain.</p>

      {/* Wallet Banner */}
      {!account && (
        <div className="alert alert-info" style={{ marginBottom: 24, justifyContent: "space-between", flexWrap: "wrap", gap: 10 }}>
          <span>🦊 Connect MetaMask to record your model on-chain (optional for demo)</span>
          <button className="btn btn-outline btn-sm" onClick={connectWallet}>Connect Wallet</button>
        </div>
      )}

      {error && <div className="alert alert-error" style={{ marginBottom: 20 }}>⚠️ {error}</div>}

      <form onSubmit={handleSubmit} className={styles.form}>
        {/* File Drop Zone */}
        <div
          className={`${styles.dropZone} ${file ? styles.dropZoneActive : ""}`}
          onDrop={handleDrop}
          onDragOver={(e) => e.preventDefault()}
          onClick={() => document.getElementById("file-input").click()}
        >
          <input id="file-input" type="file" style={{ display: "none" }} onChange={handleFileChange} />
          {file ? (
            <div className={styles.fileInfo}>
              <span className={styles.fileIcon}>📄</span>
              <div>
                <div className={styles.fileName}>{file.name}</div>
                <div className={styles.fileSize}>{formatBytes(file.size)}</div>
              </div>
              <span className="badge badge-green">Ready</span>
            </div>
          ) : (
            <div className={styles.dropPrompt}>
              <span style={{ fontSize: "2.5rem" }}>📦</span>
              <p><strong>Drop your model file here</strong> or click to browse</p>
              <p style={{ fontSize: "0.82rem", color: "var(--text3)" }}>.pkl, .pt, .h5, .onnx, .zip, etc. — Max 100MB</p>
            </div>
          )}
        </div>

        {/* Form Fields */}
        <div className={styles.grid2}>
          <div className="form-group">
            <label className="form-label" htmlFor="name">Model Name *</label>
            <input id="name" name="name" className="form-input" placeholder="e.g. ResNet-50 Classifier"
              value={form.name} onChange={handleChange} required />
          </div>
          <div className="form-group">
            <label className="form-label" htmlFor="category">Category *</label>
            <select id="category" name="category" className="form-input" value={form.category} onChange={handleChange}>
              {CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
            </select>
          </div>
        </div>

        <div className="form-group">
          <label className="form-label" htmlFor="description">Description *</label>
          <textarea id="description" name="description" className="form-input" rows={4}
            placeholder="Describe your model: architecture, training data, use cases, accuracy..." 
            value={form.description} onChange={handleChange} required />
        </div>

        <div className={styles.grid2}>
          <div className="form-group">
            <label className="form-label" htmlFor="price">Price (ETH) — set 0 for free</label>
            <input id="price" name="price" type="number" step="0.001" min="0" className="form-input"
              placeholder="0.05" value={form.price} onChange={handleChange} />
          </div>
          <div className="form-group">
            <label className="form-label" htmlFor="tags">Tags (comma separated)</label>
            <input id="tags" name="tags" className="form-input" placeholder="CNN, PyTorch, ImageNet"
              value={form.tags} onChange={handleChange} />
          </div>
        </div>

        {/* Progress */}
        {isUploading && (
          <div className={styles.progressBox}>
            <div className="spinner" style={{ width: 24, height: 24, borderWidth: 2 }} />
            <span>{step === "uploading-ipfs" ? "📦 Uploading to IPFS..." : "⛓️ Recording on blockchain..."}</span>
          </div>
        )}

        <button id="upload-btn" type="submit" className="btn btn-primary btn-lg" style={{ width: "100%", justifyContent: "center" }} disabled={isUploading}>
          {isUploading ? "Please wait..." : "🚀 Upload & List Model"}
        </button>
      </form>
    </div>
  );
}
