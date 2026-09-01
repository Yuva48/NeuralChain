// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/utils/ReentrancyGuard.sol";
import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "./ModelNFT.sol";

/// @title ModelMarketplace - A decentralized AI model marketplace
/// @notice Allows developers to list AI models and users to purchase access
contract ModelMarketplace is Ownable, ReentrancyGuard {
    uint256 public constant CREATOR_ROYALTY_BPS = 1000;
    uint256 public constant BPS_DENOMINATOR = 10000;
    uint256 public constant NEURAL_PER_ETH = 1000;
    uint256 public constant MIN_ETH_PRICE = 1e15; // 0.001 ETH minimal listing price

    bool public paused;

    struct Model {
        uint256 id;
        address payable owner;
        string name;
        string description;
        string category;
        string ipfsHash;
        string modelHash;
        string verificationStatus;
        uint256 verificationScore;
        uint256 price;
        bool isActive;
        uint256 createdAt;
    }

    uint256 public modelCount;
    address payable public immutable platform;
    ModelNFT public immutable licenseNFT;
    IERC20 public immutable neuralToken;

    mapping(uint256 => Model) public models;
    mapping(uint256 => mapping(address => bool)) private _access;

    event ModelListed(
        uint256 indexed id,
        address indexed owner,
        string name,
        uint256 price,
        string ipfsHash
    );
    event ModelPurchased(
        uint256 indexed id,
        address indexed buyer,
        address indexed seller,
        uint256 price
    );
    event LicenseMinted(uint256 indexed modelId, address indexed buyer, uint256 amount);
    event NeuralPurchase(uint256 indexed modelId, address indexed buyer, uint256 tokenAmount);
    event MarketplacePaused(bool paused);
    event PlatformWithdrawn(address indexed recipient, uint256 amount);

    modifier whenNotPaused() {
        require(!paused, "Marketplace paused");
        _;
    }

    constructor(address payable _platform, address _licenseNFT, address _neuralToken) Ownable(msg.sender) {
        require(_platform != address(0), "Platform required");
        require(_licenseNFT != address(0), "License NFT required");
        require(_neuralToken != address(0), "NEURAL token required");
        platform = _platform;
        licenseNFT = ModelNFT(_licenseNFT);
        neuralToken = IERC20(_neuralToken);
    }

    function setPaused(bool _paused) external onlyOwner {
        paused = _paused;
        emit MarketplacePaused(_paused);
    }

    function withdrawPlatformFees() external onlyOwner {
        uint256 balance = address(this).balance;
        require(balance > 0, "No ETH to withdraw");
        (bool sent, ) = platform.call{value: balance}("");
        require(sent, "Platform fee withdrawal failed");
        emit PlatformWithdrawn(platform, balance);
    }

    function uploadModel(
        string calldata _name,
        string calldata _description,
        string calldata _category,
        string calldata _ipfsHash,
        string calldata _modelHash,
        string calldata _verificationStatus,
        uint256 _verificationScore,
        uint256 _price
    ) external whenNotPaused returns (uint256) {
        require(bytes(_name).length > 0, "Name required");
        require(bytes(_ipfsHash).length > 0, "IPFS hash required");
        require(_price >= MIN_ETH_PRICE, "Price too low");

        modelCount++;
        models[modelCount] = Model({
            id: modelCount,
            owner: payable(msg.sender),
            name: _name,
            description: _description,
            category: _category,
            ipfsHash: _ipfsHash,
            modelHash: _modelHash,
            verificationStatus: _verificationStatus,
            verificationScore: _verificationScore,
            price: _price,
            isActive: true,
            createdAt: block.timestamp
        });

        _access[modelCount][msg.sender] = true;

        emit ModelListed(modelCount, msg.sender, _name, _price, _ipfsHash);
        return modelCount;
    }

    function buyModel(uint256 _modelId) external payable nonReentrant whenNotPaused {
        Model storage model = models[_modelId];
        require(model.id != 0, "Model does not exist");
        require(model.isActive, "Model not active");
        require(msg.sender != model.owner, "Owner already has access");
        require(!_access[_modelId][msg.sender], "Already purchased");
        require(msg.value >= model.price, "Insufficient ETH sent");

        _access[_modelId][msg.sender] = true;

        uint256 creatorAmount = (msg.value * CREATOR_ROYALTY_BPS) / BPS_DENOMINATOR;
        uint256 platformAmount = msg.value - creatorAmount;

        (bool creatorPaid, ) = model.owner.call{value: creatorAmount}("");
        require(creatorPaid, "Creator payment failed");
        (bool platformPaid, ) = platform.call{value: platformAmount}("");
        require(platformPaid, "Platform payment failed");

        licenseNFT.mint(msg.sender, _modelId, 1, "");

        emit ModelPurchased(_modelId, msg.sender, model.owner, msg.value);
        emit LicenseMinted(_modelId, msg.sender, 1);
    }

    function buyModelWithNeural(uint256 _modelId) external nonReentrant whenNotPaused {
        Model storage model = models[_modelId];
        require(model.id != 0, "Model does not exist");
        require(model.isActive, "Model not active");
        require(msg.sender != model.owner, "Owner already has access");
        require(!_access[_modelId][msg.sender], "Already purchased");

        uint256 tokenAmount = model.price * NEURAL_PER_ETH;
        require(neuralToken.transferFrom(msg.sender, address(this), tokenAmount), "NEURAL payment failed");

        _access[_modelId][msg.sender] = true;

        uint256 creatorAmount = (tokenAmount * CREATOR_ROYALTY_BPS) / BPS_DENOMINATOR;
        require(neuralToken.transfer(model.owner, creatorAmount), "Creator token payment failed");
        require(neuralToken.transfer(platform, tokenAmount - creatorAmount), "Platform token payment failed");
        licenseNFT.mint(msg.sender, _modelId, 1, "");

        emit NeuralPurchase(_modelId, msg.sender, tokenAmount);
        emit LicenseMinted(_modelId, msg.sender, 1);
    }

    function checkAccess(uint256 _modelId, address _user) external view returns (bool) {
        return _access[_modelId][_user];
    }

    function getModel(uint256 _modelId) external view returns (
        uint256 id,
        address owner,
        string memory name,
        string memory description,
        string memory category,
        string memory ipfsHash,
        string memory modelHash,
        string memory verificationStatus,
        uint256 verificationScore,
        uint256 price,
        bool isActive,
        uint256 createdAt
    ) {
        Model storage m = models[_modelId];
        require(m.id != 0, "Model does not exist");
        return (m.id, m.owner, m.name, m.description, m.category, m.ipfsHash, m.modelHash, m.verificationStatus, m.verificationScore, m.price, m.isActive, m.createdAt);
    }

    function getModelCount() external view returns (uint256) {
        return modelCount;
    }

    function deactivateModel(uint256 _modelId) external {
        require(models[_modelId].owner == msg.sender, "Not the owner");
        models[_modelId].isActive = false;
    }
}

