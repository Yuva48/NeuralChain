# NeuralChain AI Model Marketplace

A prototype AI model marketplace with model verification, IPFS storage, blockchain listings, verified purchases, license NFTs, NEURAL payments, reviews, versioning, reputation, and token-based governance.

## Requirements

- Node.js 18+
- MetaMask configured for Hardhat Localhost (`http://127.0.0.1:8545`, chain ID `31337`)

## Quick start

From the repository root, install and prepare everything with:

```powershell
npm run install:all
npm run build:contracts
```

Then run the local blockchain, deploy the contracts, start the backend, and launch the frontend:

```powershell
# Terminal 1
npm run dev:blockchain

# Terminal 2
npm run deploy:local

# Terminal 3
npm run dev:backend

# Terminal 4
npm run dev:frontend
```

## Clean local start

Open three terminals from the repository root:

```powershell
Push-Location blockchain
npm install
npx hardhat compile
npx hardhat node
```

In a second terminal, deploy the contracts while the node is running:

```powershell
Push-Location blockchain
npx hardhat run scripts/deploy.js --network localhost
```

The deployment script writes synchronized ABI/address files to `frontend/src/contracts` and `backend/contracts`. Copy the printed marketplace, NFT, and NEURAL addresses into `frontend/.env`:

```env
VITE_API_URL=http://localhost:5000
VITE_CONTRACT_ADDRESS=<marketplace-address>
VITE_NFT_CONTRACT_ADDRESS=<model-nft-address>
VITE_NEURAL_TOKEN_ADDRESS=<neural-token-address>
```

Start the API in a third terminal:

```powershell
Push-Location backend
npm install
npm start
```

Start the frontend from another terminal:

```powershell
Push-Location frontend
npm install
npm run dev
```

Open the Vite URL printed in the terminal. Import a Hardhat test account into MetaMask for local testing. The frontend upload flow requires a connected wallet and a successful blockchain listing.

## Demo flow

1. Register/login, connect MetaMask, and upload a supported model file.
2. Verification runs before IPFS; the SHA-256 hash and verification metadata are stored with the listing.
3. The listing is recorded on-chain and receives a contract model ID.
4. Buyers purchase with ETH or NEURAL. The backend verifies the mined transaction before granting access.
5. A purchase mints a non-transferable license NFT and splits payment 10% to the creator and 90% to the platform.
6. Verified buyers can submit one review per model.
7. Model owners can publish versions from the model detail page.
8. NEURAL holders can vote; 100 NEURAL is required to create a proposal and 1 NEURAL is required to vote. Governance requests use MetaMask signatures.

## Configuration and limitations

- `blockchain/.env.example` documents optional Sepolia deployment variables. Never commit private keys or real RPC credentials.
- JSON files in `backend/data` are prototype storage and are not suitable for concurrent production writes.
- IPFS uses Pinata when `PINATA_JWT` is configured; otherwise it uses demo CIDs.
- Runtime model inference is not executed by the verifier. Uploaded files are inspected without importing or executing arbitrary code.
- Existing seeded models may be legacy records without blockchain IDs and cannot accept verified purchases until listed on-chain.
- Hardhat artifacts and cache are generated build output; regenerate them with Hardhat rather than editing them manually.

## Validation

```powershell
Push-Location blockchain; npx hardhat compile; Pop-Location
Push-Location frontend; npm run build; Pop-Location
```
