const hre = require("hardhat");
const fs = require("fs");
const path = require("path");

async function main() {
  const [deployer] = await hre.ethers.getSigners();
  console.log("Deploying contracts with account:", deployer.address);

  const ModelMarketplace = await hre.ethers.getContractFactory("ModelMarketplace");
  const marketplace = await ModelMarketplace.deploy();
  await marketplace.waitForDeployment();

  const address = await marketplace.getAddress();
  console.log(`✅ ModelMarketplace deployed to: ${address}`);

  // Build contract data object
  const artifact = await hre.artifacts.readArtifact("ModelMarketplace");
  const contractData = {
    address,
    abi: artifact.abi,
    network: hre.network.name,
    deployedAt: new Date().toISOString(),
  };

  // Save to frontend
  const frontendDir = path.join(__dirname, "../../frontend/src/contracts");
  fs.mkdirSync(frontendDir, { recursive: true });
  fs.writeFileSync(
    path.join(frontendDir, "ModelMarketplace.json"),
    JSON.stringify(contractData, null, 2)
  );

  // Save to backend
  const backendDir = path.join(__dirname, "../../backend/contracts");
  fs.mkdirSync(backendDir, { recursive: true });
  fs.writeFileSync(
    path.join(backendDir, "ModelMarketplace.json"),
    JSON.stringify(contractData, null, 2)
  );

  console.log("📄 Contract ABI + address saved to frontend/src/contracts/ and backend/contracts/");
  console.log("\n📋 Next steps:");
  console.log("   1. Copy the contract address above");
  console.log("   2. Update VITE_CONTRACT_ADDRESS in frontend/.env");
  console.log(`   3. Contract Address: ${address}`);
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
