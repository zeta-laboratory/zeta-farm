// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/utils/cryptography/ECDSA.sol";
import "@openzeppelin/contracts/utils/cryptography/EIP712.sol";

/**
 * @title FarmTreasury
 * @notice 农场游戏的核心合约，负责记录玩家的链上操作
 * @dev 使用 EIP-712 签名验证，后端签名授权玩家操作
 */
contract FarmTreasury is EIP712, Ownable {
    using ECDSA for bytes32;

    // ============================================
    // 状态变量
    // ============================================

    /// @notice 后端签名者地址（用于验证操作授权）
    address public backendSigner;

    /// @notice 用户的 nonce（防止重放攻击）
    mapping(address => uint256) public userNonces;

    /// @notice 社区激励地址（接收 0.02 ZETA）
    address public communityAddress;

    /// @notice 操作费用：0.0975 ZETA
    uint256 public constant ACTION_FEE = 0.0975 ether;

    /// @notice 奖池分配：0.0775 ZETA
    uint256 public constant PRIZE_POOL_AMOUNT = 0.0775 ether;

    /// @notice 社区分配：0.02 ZETA
    uint256 public constant COMMUNITY_AMOUNT = 0.02 ether;

    /// @notice 奖池累计金额
    uint256 public prizePoolBalance;

    /// @notice 社区累计金额
    uint256 public communityBalance;

    // ============================================
    // 事件
    // ============================================

    event ActionRecorded(address indexed user, string actionType, uint256 data, uint256 timestamp);
    event BackendSignerUpdated(address indexed oldSigner, address indexed newSigner);
    event CommunityAddressUpdated(address indexed oldAddress, address indexed newAddress);
    event FundsDistributed(address indexed user, uint256 totalAmount, uint256 prizePoolAmount, uint256 communityAmount);
    event PrizePoolWithdrawn(address indexed to, uint256 amount);
    event CommunityWithdrawn(address indexed to, uint256 amount);
    event InitialPrizePoolDeposited(address indexed from, uint256 amount);
    event ExchangePerformed(address indexed user, uint256 amount, uint256 nonce);

    // ============================================
    // EIP-712 类型哈希
    // ============================================

    bytes32 public constant RECORD_ACTION_TYPEHASH =
        keccak256("RecordAction(address user,string actionType,uint256 data,uint256 nonce)");

    bytes32 public constant EXCHANGE_TYPEHASH =
        keccak256("Exchange(address user,uint256 amount,uint256 nonce)");

    // ============================================
    // 构造函数
    // ============================================

    constructor(address _backendSigner, address _communityAddress)
        EIP712("ZetaFarmTreasury", "1")
    {
        require(_backendSigner != address(0), "Invalid backend signer");
        require(_communityAddress != address(0), "Invalid community address");

        backendSigner = _backendSigner;
        communityAddress = _communityAddress;
    }

    // ============================================
    // 核心功能
    // ============================================

    function recordActionWithSignature(
        string calldata actionType,
        uint256 data,
        uint256 nonce,
        bytes calldata signature
    ) external payable {
        require(msg.value == ACTION_FEE, "Must pay exactly 0.0975 ZETA");
        require(nonce == userNonces[msg.sender], "Invalid nonce");

        bytes32 structHash = keccak256(
            abi.encode(
                RECORD_ACTION_TYPEHASH,
                msg.sender,
                keccak256(bytes(actionType)),
                data,
                nonce
            )
        );

        bytes32 digest = _hashTypedDataV4(structHash);
        address recoveredSigner = digest.recover(signature);
        require(recoveredSigner == backendSigner, "Invalid signature");

        userNonces[msg.sender]++;

        prizePoolBalance += PRIZE_POOL_AMOUNT;
        communityBalance += COMMUNITY_AMOUNT;

        emit FundsDistributed(msg.sender, ACTION_FEE, PRIZE_POOL_AMOUNT, COMMUNITY_AMOUNT);
        emit ActionRecorded(msg.sender, actionType, data, block.timestamp);
    }

    function exchangeCoinsForZeta(
        uint256 amount,
        uint256 nonce,
        bytes calldata signature
    ) external {
        require(amount > 0, "Amount must be > 0");
        require(nonce == userNonces[msg.sender], "Invalid nonce");

        bytes32 structHash = keccak256(
            abi.encode(EXCHANGE_TYPEHASH, msg.sender, amount, nonce)
        );
        bytes32 digest = _hashTypedDataV4(structHash);
        address recoveredSigner = digest.recover(signature);
        require(recoveredSigner == backendSigner, "Invalid signature");

        require(prizePoolBalance >= amount, "Insufficient prize pool balance");
        require(address(this).balance >= amount + communityBalance, "Contract balance insufficient");

        prizePoolBalance -= amount;
        userNonces[msg.sender]++;

        (bool success, ) = payable(msg.sender).call{value: amount}("");
        require(success, "Transfer failed");

        emit ExchangePerformed(msg.sender, amount, nonce);
    }

    function withdrawPrizePoolTo(address to) external onlyOwner {
        require(to != address(0), "Invalid address");
        uint256 amount = prizePoolBalance;
        require(amount > 0, "No prize pool balance");

        prizePoolBalance = 0;
        (bool success, ) = payable(to).call{value: amount}("");
        require(success, "Transfer failed");

        emit PrizePoolWithdrawn(to, amount);
    }

    function withdrawCommunityTo(address to) external onlyOwner {
        require(to != address(0), "Invalid address");
        uint256 amount = communityBalance;
        require(amount > 0, "No community balance");

        communityBalance = 0;
        (bool success, ) = payable(to).call{value: amount}("");
        require(success, "Transfer failed");

        emit CommunityWithdrawn(to, amount);
    }

    function updateBackendSigner(address _newSigner) external onlyOwner {
        require(_newSigner != address(0), "Invalid signer address");
        address oldSigner = backendSigner;
        backendSigner = _newSigner;
        emit BackendSignerUpdated(oldSigner, _newSigner);
    }

    function updateCommunityAddress(address _newAddress) external onlyOwner {
        require(_newAddress != address(0), "Invalid address");
        address oldAddress = communityAddress;
        communityAddress = _newAddress;
        emit CommunityAddressUpdated(oldAddress, _newAddress);
    }

    function withdrawPrizePool() external onlyOwner {
        uint256 amount = prizePoolBalance;
        require(amount > 0, "No prize pool balance");
        prizePoolBalance = 0;
        (bool success, ) = payable(owner()).call{value: amount}("");
        require(success, "Transfer failed");
        emit PrizePoolWithdrawn(owner(), amount);
    }

    function withdrawCommunity() external onlyOwner {
        uint256 amount = communityBalance;
        require(amount > 0, "No community balance");
        communityBalance = 0;
        (bool success, ) = payable(communityAddress).call{value: amount}("");
        require(success, "Transfer failed");
        emit CommunityWithdrawn(communityAddress, amount);
    }

    function emergencyWithdraw() external onlyOwner {
        uint256 balance = address(this).balance;
        require(balance > 0, "No balance");

        if (prizePoolBalance > 0) {
            uint256 prizeAmount = prizePoolBalance;
            prizePoolBalance = 0;
            (bool success1, ) = payable(owner()).call{value: prizeAmount}("");
            require(success1, "Prize pool transfer failed");
        }

        if (communityBalance > 0) {
            uint256 communityAmount = communityBalance;
            communityBalance = 0;
            (bool success2, ) = payable(owner()).call{value: communityAmount}("");
            require(success2, "Community transfer failed");
        }

        uint256 remaining = address(this).balance;
        if (remaining > 0) {
            payable(owner()).transfer(remaining);
        }
    }

    function getUserNonce(address user) external view returns (uint256) {
        return userNonces[user];
    }

    function depositToPrizePool() external payable {
        require(msg.value > 0, "Must deposit some ZETA");
        prizePoolBalance += msg.value;
        emit InitialPrizePoolDeposited(msg.sender, msg.value);
    }

    receive() external payable {
        if (msg.value > 0) {
            prizePoolBalance += msg.value;
            emit InitialPrizePoolDeposited(msg.sender, msg.value);
        }
    }
}