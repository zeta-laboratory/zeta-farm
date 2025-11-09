// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

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

    /// @notice 奖池地址（接收 0.0775 ZETA）
    address public prizePoolAddress;

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

    /// @notice 操作记录事件
    /// @param user 用户地址
    /// @param actionType 操作类型（plant, harvest, water, weed, fertilize, shovel, gluck_draw）
    /// @param data 操作数据（编码后的 uint256）
    /// @param timestamp 操作时间戳
    event ActionRecorded(
        address indexed user,
        string actionType,
        uint256 data,
        uint256 timestamp
    );

    /// @notice 后端签名者更新事件
    event BackendSignerUpdated(address indexed oldSigner, address indexed newSigner);

    /// @notice 奖池地址更新事件
    event PrizePoolAddressUpdated(address indexed oldAddress, address indexed newAddress);

    /// @notice 社区地址更新事件
    event CommunityAddressUpdated(address indexed oldAddress, address indexed newAddress);

    /// @notice 资金分配事件
    event FundsDistributed(
        address indexed user,
        uint256 totalAmount,
        uint256 prizePoolAmount,
        uint256 communityAmount
    );

    /// @notice 奖池提取事件
    event PrizePoolWithdrawn(address indexed to, uint256 amount);

    /// @notice 社区资金提取事件
    event CommunityWithdrawn(address indexed to, uint256 amount);

    // ============================================
    // EIP-712 类型哈希
    // ============================================

    bytes32 public constant RECORD_ACTION_TYPEHASH = 
        keccak256("RecordAction(address user,string actionType,uint256 data,uint256 nonce)");

    // ============================================
    // 构造函数
    // ============================================

    /**
     * @notice 初始化合约
     * @param _backendSigner 后端签名者地址
     * @param _prizePoolAddress 奖池地址（接收初始 6000 ZETA + 后续 0.0775 ZETA）
     * @param _communityAddress 社区激励地址（接收 0.02 ZETA）
     */
    constructor(
        address _backendSigner,
        address _prizePoolAddress,
        address _communityAddress
    ) 
        EIP712("ZetaFarmTreasury", "1") 
        Ownable(msg.sender)
    {
        require(_backendSigner != address(0), "Invalid backend signer");
        require(_prizePoolAddress != address(0), "Invalid prize pool address");
        require(_communityAddress != address(0), "Invalid community address");
        
        backendSigner = _backendSigner;
        prizePoolAddress = _prizePoolAddress;
        communityAddress = _communityAddress;
    }

    // ============================================
    // 核心功能
    // ============================================

    /**
     * @notice 使用后端签名记录操作
     * @dev 用户调用此函数，提供后端生成的签名，并支付 0.0975 ZETA
     * @param actionType 操作类型
     * @param data 操作数据
     * @param nonce 用户当前的 nonce
     * @param signature 后端签名
     */
    function recordActionWithSignature(
        string calldata actionType,
        uint256 data,
        uint256 nonce,
        bytes calldata signature
    ) external payable {
        // 0. 验证支付金额
        require(msg.value == ACTION_FEE, "Must pay exactly 0.0975 ZETA");

        // 1. 验证 nonce
        require(nonce == userNonces[msg.sender], "Invalid nonce");

        // 2. 构造 EIP-712 结构化数据哈希
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

        // 3. 验证签名
        address recoveredSigner = digest.recover(signature);
        require(recoveredSigner == backendSigner, "Invalid signature");

        // 4. 增加用户 nonce
        userNonces[msg.sender]++;

        // 5. 分配资金
        prizePoolBalance += PRIZE_POOL_AMOUNT;
        communityBalance += COMMUNITY_AMOUNT;

        emit FundsDistributed(msg.sender, ACTION_FEE, PRIZE_POOL_AMOUNT, COMMUNITY_AMOUNT);

        // 6. 记录操作事件
        emit ActionRecorded(msg.sender, actionType, data, block.timestamp);
    }

    // ============================================
    // 管理员函数
    // ============================================

    /**
     * @notice 更新后端签名者地址
     * @param _newSigner 新的签名者地址
     */
    function updateBackendSigner(address _newSigner) external onlyOwner {
        require(_newSigner != address(0), "Invalid signer address");
        address oldSigner = backendSigner;
        backendSigner = _newSigner;
        emit BackendSignerUpdated(oldSigner, _newSigner);
    }

    /**
     * @notice 更新奖池地址
     * @param _newAddress 新的奖池地址
     */
    function updatePrizePoolAddress(address _newAddress) external onlyOwner {
        require(_newAddress != address(0), "Invalid address");
        address oldAddress = prizePoolAddress;
        prizePoolAddress = _newAddress;
        emit PrizePoolAddressUpdated(oldAddress, _newAddress);
    }

    /**
     * @notice 更新社区地址
     * @param _newAddress 新的社区地址
     */
    function updateCommunityAddress(address _newAddress) external onlyOwner {
        require(_newAddress != address(0), "Invalid address");
        address oldAddress = communityAddress;
        communityAddress = _newAddress;
        emit CommunityAddressUpdated(oldAddress, _newAddress);
    }

    /**
     * @notice 提取奖池资金（只能提取到奖池地址）
     */
    function withdrawPrizePool() external onlyOwner {
        uint256 amount = prizePoolBalance;
        require(amount > 0, "No prize pool balance");
        
        prizePoolBalance = 0;
        
        (bool success, ) = prizePoolAddress.call{value: amount}("");
        require(success, "Transfer failed");
        
        emit PrizePoolWithdrawn(prizePoolAddress, amount);
    }

    /**
     * @notice 提取社区资金（只能提取到社区地址）
     */
    function withdrawCommunity() external onlyOwner {
        uint256 amount = communityBalance;
        require(amount > 0, "No community balance");
        
        communityBalance = 0;
        
        (bool success, ) = communityAddress.call{value: amount}("");
        require(success, "Transfer failed");
        
        emit CommunityWithdrawn(communityAddress, amount);
    }

    /**
     * @notice 紧急提取所有资金（仅用于紧急情况）
     * @dev 优先按照分配比例提取，剩余资金提取到 owner
     */
    function emergencyWithdraw() external onlyOwner {
        uint256 balance = address(this).balance;
        require(balance > 0, "No balance");

        // 提取奖池资金
        if (prizePoolBalance > 0) {
            uint256 prizeAmount = prizePoolBalance;
            prizePoolBalance = 0;
            (bool success1, ) = prizePoolAddress.call{value: prizeAmount}("");
            require(success1, "Prize pool transfer failed");
        }

        // 提取社区资金
        if (communityBalance > 0) {
            uint256 communityAmount = communityBalance;
            communityBalance = 0;
            (bool success2, ) = communityAddress.call{value: communityAmount}("");
            require(success2, "Community transfer failed");
        }

        // 剩余资金（如有）提取到 owner
        uint256 remaining = address(this).balance;
        if (remaining > 0) {
            payable(owner()).transfer(remaining);
        }
    }

    // ============================================
    // 查询函数
    // ============================================

    /**
     * @notice 获取用户的当前 nonce
     * @param user 用户地址
     * @return 用户的 nonce
     */
    function getUserNonce(address user) external view returns (uint256) {
        return userNonces[user];
    }

    /**
     * @notice 接收 ETH
     */
    receive() external payable {}
}
