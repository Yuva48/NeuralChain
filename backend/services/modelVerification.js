const crypto = require("crypto");
const path = require("path");

const MAX_MODEL_SIZE = 100 * 1024 * 1024;
const FORMAT_RULES = {
  ".onnx": { format: "ONNX", framework: "ONNX" },
  ".pt": { format: "PyTorch Checkpoint", framework: "PyTorch" },
  ".pth": { format: "PyTorch Checkpoint", framework: "PyTorch" },
  ".pkl": { format: "Pickle Checkpoint", framework: "Python" },
  ".pickle": { format: "Pickle Checkpoint", framework: "Python" },
  ".h5": { format: "HDF5 / Keras Model", framework: "TensorFlow / Keras" },
  ".keras": { format: "Keras Model", framework: "TensorFlow / Keras" },
  ".safetensors": { format: "SafeTensors", framework: "PyTorch / Transformers" },
  ".zip": { format: "Model Archive", framework: "Not detected" },
  ".json": { format: "JSON Model Metadata", framework: "Not detected" },
};

const suspiciousPatterns = [
  /__reduce__|__setstate__|os\.system|subprocess|child_process|eval\s*\(|exec\s*\(/i,
  /powershell|cmd\.exe|bash\s+-c|curl\s+https?:|wget\s+https?:/i,
];

// SHA-256 integrity hash calculated directly from uploaded file buffer
const sha256 = (buffer) => crypto.createHash("sha256").update(buffer).digest("hex");

function inspectArchive(buffer) {
  // Read ZIP central directory file headers without extracting or executing any file
  const text = buffer.toString("latin1");
  const names = [];
  const namePattern = /(?:^|PK\x01\x02)[\s\S]{42}([^\x00]{1,240})/g;
  let match;
  while ((match = namePattern.exec(text)) && names.length < 500) {
    names.push(match[1]);
  }
  return names;
}

function verifyModelFile(file) {
  const extension = path.extname(file?.originalname || "").toLowerCase();
  const rule = FORMAT_RULES[extension];
  
  const checks = {
    fileFormat: Boolean(rule),
    fileSize: file.size > 0 && file.size <= MAX_MODEL_SIZE,
    architecture: false,
    dependencies: false,
    basicInference: "skipped_static_only",
    suspiciousContent: true,
  };
  
  const warnings = [];
  const buffer = file.buffer;
  const sample = buffer.subarray(0, Math.min(buffer.length, 1024 * 1024)).toString("utf8");

  if (!rule) {
    warnings.push(`Unsupported model format '${extension || "unknown"}'.`);
  }
  if (!checks.fileSize) {
    warnings.push("Model file must be greater than 0 bytes and no larger than 100 MB.");
  }

  // Static Architecture Inspection
  if (extension === ".onnx") {
    checks.architecture = buffer.length > 16 && buffer[0] === 0x08;
  } else if (extension === ".safetensors") {
    checks.architecture = buffer.length >= 8;
  } else if (extension === ".json") {
    try {
      const metadata = JSON.parse(buffer.toString("utf8"));
      checks.architecture = Boolean(metadata.architecture || metadata.model_type || metadata.layers);
      checks.dependencies = Boolean(metadata.framework || metadata.dependencies || metadata.requirements);
    } catch {
      warnings.push("JSON model metadata could not be parsed.");
    }
  } else if ([".zip", ".pt", ".pth", ".h5", ".keras"].includes(extension)) {
    checks.architecture = buffer.length > 32;
    checks.dependencies = extension === ".zip"
      ? inspectArchive(buffer).some((name) => /requirements\.txt|environment\.ya?ml|package\.json/i.test(name))
      : true;
  } else if ([".pkl", ".pickle"].includes(extension)) {
    warnings.push("Pickle format detected. Static analysis performed; arbitrary code execution risk present if loaded un-sandboxed.");
    checks.architecture = buffer.length > 16;
    checks.dependencies = false;
  }

  // Security Scan for Suspicious Executable / Command Patterns
  const archiveNames = extension === ".zip" ? inspectArchive(buffer) : [];
  const inspectedText = `${sample}\n${archiveNames.join("\n")}`;
  if (suspiciousPatterns.some((pattern) => pattern.test(inspectedText))) {
    checks.suspiciousContent = false;
    warnings.push("Potentially executable or unauthorized network/system access pattern detected.");
  }

  // Calculate Static Verification Score (percentage of passing static checks)
  const passedChecks = Object.values(checks).filter((value) => value === true).length;
  const checkCount = Object.keys(checks).length - 1; // Exclude basicInference
  const verificationScore = Math.round((passedChecks / checkCount) * 100);

  // Status determination
  const verificationStatus = !rule || !checks.fileSize || !checks.suspiciousContent
    ? "rejected"
    : verificationScore >= 60 && checks.architecture
    ? "verified"
    : "needs_review";

  return {
    verificationStatus,
    verificationScore, // Static Verification Score (0-100)
    modelHash: sha256(buffer), // Exact 64-hex SHA-256 hash
    framework: rule?.framework || "Not detected",
    modelFormat: rule?.format || extension || "Not detected",
    checks,
    warnings,
    verificationNote: "Static verification checks file integrity, SHA-256 hash, structure, dependencies, and suspicious content. It does not measure model accuracy or run live inference.",
  };
}

module.exports = { verifyModelFile, MAX_MODEL_SIZE };