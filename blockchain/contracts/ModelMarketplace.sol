// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

/// @title ModelMarketplace - A decentralized AI model marketplace
/// @notice Allows developers to list AI models and users to purchase access
contract ModelMarketplace {

    struct Model {
        uint256 id;
        address payable owner;
        string name;
        string description;
        string category;
        string ipfsHash;
        uint256 price; // in wei
        bool isActive;
        uint256 createdAt;
    }

    uint256 public modelCount;

    // modelId => Model
    mapping(uint256 => Model) public models;

    // modelId => buyer address => has access
    mapping(uint256 => mapping(address => bool)) private _access;

    // Events
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

    // ─── Developer Actions ──────────────────────────────────────────────────────

    /// @notice List a new AI model on the marketplace
    function uploadModel(
        string calldata _name,
        string calldata _description,
        string calldata _category,
        string calldata _ipfsHash,
        uint256 _price
    ) external returns (uint256) {
        require(bytes(_name).length > 0, "Name required");
        require(bytes(_ipfsHash).length > 0, "IPFS hash required");

        modelCount++;
        models[modelCount] = Model({
            id: modelCount,
            owner: payable(msg.sender),
            name: _name,
            description: _description,
            category: _category,
            ipfsHash: _ipfsHash,
            price: _price,
            isActive: true,
            createdAt: block.timestamp
        });

        // Owner always has access to their own model
        _access[modelCount][msg.sender] = true;

        emit ModelListed(modelCount, msg.sender, _name, _price, _ipfsHash);
        return modelCount;
    }

    // ─── Buyer Actions ──────────────────────────────────────────────────────────

    /// @notice Purchase access to an AI model
    function buyModel(uint256 _modelId) external payable {
        Model storage model = models[_modelId];
        require(model.isActive, "Model not active");
        require(msg.sender != model.owner, "Owner already has access");
        require(!_access[_modelId][msg.sender], "Already purchased");
        require(msg.value >= model.price, "Insufficient ETH sent");

        _access[_modelId][msg.sender] = true;
        model.owner.transfer(msg.value);

        emit ModelPurchased(_modelId, msg.sender, model.owner, msg.value);
    }

    // ─── View Functions ─────────────────────────────────────────────────────────

    /// @notice Check if a user has access to a model
    function checkAccess(uint256 _modelId, address _user) external view returns (bool) {
        return _access[_modelId][_user];
    }

    /// @notice Get a model's full details
    function getModel(uint256 _modelId) external view returns (
        uint256 id,
        address owner,
        string memory name,
        string memory description,
        string memory category,
        string memory ipfsHash,
        uint256 price,
        bool isActive,
        uint256 createdAt
    ) {
        Model storage m = models[_modelId];
        require(m.id != 0, "Model does not exist");
        return (m.id, m.owner, m.name, m.description, m.category, m.ipfsHash, m.price, m.isActive, m.createdAt);
    }

    /// @notice Get total number of models listed
    function getModelCount() external view returns (uint256) {
        return modelCount;
    }

    /// @notice Deactivate a model (owner only)
    function deactivateModel(uint256 _modelId) external {
        require(models[_modelId].owner == msg.sender, "Not the owner");
        models[_modelId].isActive = false;
    }
}
