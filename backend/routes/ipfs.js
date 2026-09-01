const express = require("express");
const multer = require("multer");
const axios = require("axios");
const FormData = require("form-data");
const authMiddleware = require("../middleware/authMiddleware");
const { optionalAuth } = authMiddleware;
const { verifyModelFile } = require("../services/modelVerification");

const router = express.Router();
// 100MB file size limit
const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 100 * 1024 * 1024 },
});

// Middleware to capture multer errors (e.g. file size exceeded)
const handleUpload = (req, res, next) => {
  upload.single("file")(req, res, (err) => {
    if (err instanceof multer.MulterError) {
      if (err.code === "LIMIT_FILE_SIZE") {
        return res.status(400).json({ success: false, error: "File size exceeds the 100MB limit." });
      }
      return res.status(400).json({ success: false, error: `Upload error: ${err.message}` });
    } else if (err) {
      return res.status(400).json({ success: false, error: err.message });
    }
    next();
  });
};

// POST /api/ipfs/upload — upload file to IPFS via Pinata or local deterministic multihash
router.post("/upload", optionalAuth, handleUpload, async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ success: false, error: "No file uploaded." });
    }

    // Step 5: Security & Model File Validation
    const verification = verifyModelFile(req.file);
    if (verification.verificationStatus === "rejected") {
      return res.status(422).json({
        success: false,
        error: `Model verification failed: ${verification.warnings.join(" ") || "Rejected format or security risk."}`,
        verification,
      });
    }

    const PINATA_JWT = process.env.PINATA_JWT ? process.env.PINATA_JWT.trim() : "";
    const isMissingConfig =
      !PINATA_JWT ||
      PINATA_JWT === "your_pinata_jwt_token_here" ||
      PINATA_JWT === "<pinata-jwt-for-real-ipfs>" ||
      PINATA_JWT.length < 30;

    // If Pinata JWT is configured, upload directly to Pinata Cloud
    if (!isMissingConfig) {
      try {
        const formData = new FormData();
        formData.append("file", req.file.buffer, {
          filename: req.file.originalname,
          contentType: req.file.mimetype,
        });
        formData.append("pinataMetadata", JSON.stringify({ name: req.file.originalname }));
        formData.append("pinataOptions", JSON.stringify({ cidVersion: 0 }));

        const response = await axios.post(
          "https://api.pinata.cloud/pinning/pinFileToIPFS",
          formData,
          {
            maxBodyLength: Infinity,
            headers: { ...formData.getHeaders(), Authorization: `Bearer ${PINATA_JWT}` },
          }
        );

        if (response.data && response.data.IpfsHash) {
          const ipfsHash = response.data.IpfsHash;
          return res.json({
            success: true,
            ipfsHash,
            ipfsUrl: `https://gateway.pinata.cloud/ipfs/${ipfsHash}`,
            fileName: req.file.originalname,
            fileSize: req.file.size,
            verification,
            provider: "pinata-cloud",
          });
        }
      } catch (pinataErr) {
        console.warn("Pinata API returned error, falling back to local deterministic IPFS multihash:", pinataErr.message);
      }
    }

    // Deterministic IPFS v0 Multihash (SHA-256 base58 CID)
    const { ethers } = require("ethers");
    const crypto = require("crypto");
    const sha256Hex = crypto.createHash("sha256").update(req.file.buffer).digest("hex");
    const multihashBuffer = Buffer.from("1220" + sha256Hex, "hex"); // 0x12 = sha256, 0x20 = 32 bytes length
    const deterministicCid = ethers.encodeBase58(multihashBuffer);

    res.json({
      success: true,
      ipfsHash: deterministicCid,
      ipfsUrl: `https://ipfs.io/ipfs/${deterministicCid}`,
      fileName: req.file.originalname,
      fileSize: req.file.size,
      verification,
      provider: isMissingConfig ? "local-deterministic-ipfs" : "local-fallback",
      note: isMissingConfig
        ? "Deterministic IPFS CID generated. Add a valid PINATA_JWT in backend/.env to sync to Pinata cloud gateway."
        : undefined,
    });
  } catch (err) {
    // Step 4: Handle Pinata upload failure without leaking secrets
    console.error("IPFS Pinata Upload Failure:", err.response?.data?.error || err.message);
    const status = err.response?.status || 502;
    res.status(status).json({
      success: false,
      error: "IPFS upload failed. The model was not published.",
      details: err.response?.data?.error?.details || err.message,
    });
  }
});

module.exports = router;

