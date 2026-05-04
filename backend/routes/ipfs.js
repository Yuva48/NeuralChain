const express = require("express");
const multer = require("multer");
const axios = require("axios");
const FormData = require("form-data");
const authMiddleware = require("../middleware/authMiddleware");

const router = express.Router();
const upload = multer({ storage: multer.memoryStorage(), limits: { fileSize: 100 * 1024 * 1024 } });

// POST /api/ipfs/upload — upload file to IPFS via Pinata
router.post("/upload", authMiddleware, upload.single("file"), async (req, res) => {
  try {
    if (!req.file) return res.status(400).json({ error: "No file uploaded." });

    const PINATA_JWT = process.env.PINATA_JWT;
    const isDemo = !PINATA_JWT || PINATA_JWT === "your_pinata_jwt_token_here";

    if (isDemo) {
      // Demo mode: return a realistic-looking mock CID
      const mockHash = "Qm" + [...Array(44)].map(() => "ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnpqrstuvwxyz123456789"[Math.floor(Math.random() * 58)]).join("");
      console.log("⚠️  DEMO MODE: No Pinata JWT set. Returning mock IPFS hash.");
      return res.json({
        success: true,
        ipfsHash: mockHash,
        ipfsUrl: `https://gateway.pinata.cloud/ipfs/${mockHash}`,
        demoMode: true,
        fileName: req.file.originalname,
        fileSize: req.file.size,
      });
    }

    // Real Pinata upload
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

    const ipfsHash = response.data.IpfsHash;
    res.json({
      success: true,
      ipfsHash,
      ipfsUrl: `https://gateway.pinata.cloud/ipfs/${ipfsHash}`,
      demoMode: false,
      fileName: req.file.originalname,
      fileSize: req.file.size,
    });
  } catch (err) {
    console.error("IPFS upload error:", err.message);
    res.status(500).json({ error: "Failed to upload file to IPFS." });
  }
});

module.exports = router;
