const express = require("express");
const fs = require("fs");
const path = require("path");
const authMiddleware = require("../middleware/authMiddleware");

const router = express.Router();
const MODELS_FILE = path.join(__dirname, "../data/models.json");

const readModels = () => {
  if (!fs.existsSync(MODELS_FILE)) return [];
  return JSON.parse(fs.readFileSync(MODELS_FILE, "utf8"));
};

const writeModels = (models) => {
  fs.writeFileSync(MODELS_FILE, JSON.stringify(models, null, 2));
};

// GET /api/models — list all models
router.get("/", (req, res) => {
  try {
    const { category, search, sort } = req.query;
    let models = readModels();

    if (category && category !== "All") {
      models = models.filter((m) => m.category === category);
    }
    if (search) {
      const q = search.toLowerCase();
      models = models.filter(
        (m) => m.name.toLowerCase().includes(q) || m.description.toLowerCase().includes(q)
      );
    }
    if (sort === "price-asc") models.sort((a, b) => a.price - b.price);
    else if (sort === "price-desc") models.sort((a, b) => b.price - a.price);
    else if (sort === "popular") models.sort((a, b) => b.downloads - a.downloads);
    else models.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));

    res.json({ models, total: models.length });
  } catch (err) {
    res.status(500).json({ error: "Failed to fetch models." });
  }
});

// GET /api/models/:id — single model
router.get("/:id", (req, res) => {
  try {
    const models = readModels();
    const model = models.find((m) => m.id === req.params.id);
    if (!model) return res.status(404).json({ error: "Model not found." });
    res.json(model);
  } catch (err) {
    res.status(500).json({ error: "Failed to fetch model." });
  }
});

// POST /api/models — create listing (protected)
router.post("/", authMiddleware, (req, res) => {
  try {
    const { name, description, category, ipfsHash, price, txHash, contractModelId, tags } = req.body;
    if (!name || !ipfsHash) {
      return res.status(400).json({ error: "Name and IPFS hash are required." });
    }

    const models = readModels();
    const newModel = {
      id: Date.now().toString(),
      name,
      description: description || "",
      category: category || "General",
      ipfsHash,
      price: parseFloat(price) || 0,
      owner: { id: req.user.id, username: req.user.username, email: req.user.email },
      txHash: txHash || null,
      contractModelId: contractModelId || null,
      purchases: [],
      createdAt: new Date().toISOString(),
      downloads: 0,
      rating: (Math.random() * 1.5 + 3.5).toFixed(1),
      tags: tags || [],
    };

    models.push(newModel);
    writeModels(models);
    res.status(201).json({ message: "Model listed successfully!", model: newModel });
  } catch (err) {
    res.status(500).json({ error: "Failed to create model listing." });
  }
});

// POST /api/models/:id/purchase — record purchase (demo mode)
router.post("/:id/purchase", authMiddleware, (req, res) => {
  try {
    const models = readModels();
    const idx = models.findIndex((m) => m.id === req.params.id);
    if (idx === -1) return res.status(404).json({ error: "Model not found." });

    const model = models[idx];
    if (!model.purchases.includes(req.user.id)) {
      model.purchases.push(req.user.id);
      model.downloads++;
      models[idx] = model;
      writeModels(models);
    }
    res.json({ message: "Purchase recorded!", hasAccess: true });
  } catch (err) {
    res.status(500).json({ error: "Failed to record purchase." });
  }
});

// GET /api/models/:id/access — check access (protected)
router.get("/:id/access", authMiddleware, (req, res) => {
  try {
    const models = readModels();
    const model = models.find((m) => m.id === req.params.id);
    if (!model) return res.status(404).json({ error: "Model not found." });

    const isOwner = model.owner.id === req.user.id;
    const hasPurchased = model.purchases.includes(req.user.id);
    const isFree = model.price === 0;
    const hasAccess = isOwner || hasPurchased || isFree;

    res.json({
      hasAccess,
      isOwner,
      hasPurchased,
      isFree,
      ipfsHash: hasAccess ? model.ipfsHash : null,
    });
  } catch (err) {
    res.status(500).json({ error: "Failed to check access." });
  }
});

module.exports = router;
