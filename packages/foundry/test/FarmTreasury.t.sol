// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

import "forge-std/Test.sol";
import "../contracts/FarmTreasury.sol";
import "@openzeppelin/contracts/utils/cryptography/ECDSA.sol";

contract FarmTreasuryTest is Test {
    using ECDSA for bytes32;

    FarmTreasury public farmTreasury;
    
    address public owner;
    address public backendSigner;
    uint256 public backendSignerKey;
    address public user;
    uint256 public userKey;
    address public prizePoolAddress;
    address public communityAddress;

    // Events for testing
    event ActionRecorded(address indexed user, string actionType, uint256 data, uint256 timestamp);
    event BackendSignerUpdated(address indexed oldSigner, address indexed newSigner);
    event InitialPrizePoolDeposited(address indexed from, uint256 amount);

    // EIP-712 Domain
    bytes32 private DOMAIN_SEPARATOR;

    // Receive function to accept ETH transfers
    receive() external payable {}

    // 常量
    uint256 constant ACTION_FEE = 0.0975 ether;
    uint256 constant PRIZE_POOL_AMOUNT = 0.0775 ether;
    uint256 constant COMMUNITY_AMOUNT = 0.02 ether;

    function setUp() public {
        owner = address(this);
        
        // 创建后端签名者
        backendSignerKey = 0xBEEF;
        backendSigner = vm.addr(backendSignerKey);
        
        // 创建用户
        userKey = 0xCAFE;
        user = vm.addr(userKey);
        vm.deal(user, 100 ether); // 给用户一些 ETH

        // 创建奖池和社区地址
        prizePoolAddress = address(0x1111);
        communityAddress = address(0x2222);

        // 部署合约
        farmTreasury = new FarmTreasury(backendSigner, communityAddress);

        // 计算 DOMAIN_SEPARATOR
        DOMAIN_SEPARATOR = keccak256(
            abi.encode(
                keccak256("EIP712Domain(string name,string version,uint256 chainId,address verifyingContract)"),
                keccak256(bytes("ZetaFarmTreasury")),
                keccak256(bytes("1")),
                block.chainid,
                address(farmTreasury)
            )
        );
    }

    // Helper: 生成 EIP-712 digest
    function _hashTypedDataV4(bytes32 structHash) internal view returns (bytes32) {
        return keccak256(abi.encodePacked("\x19\x01", DOMAIN_SEPARATOR, structHash));
    }

    function testInitialState() public view {
        assertEq(farmTreasury.backendSigner(), backendSigner);
        assertEq(farmTreasury.communityAddress(), communityAddress);
        assertEq(farmTreasury.owner(), owner);
        assertEq(farmTreasury.userNonces(user), 0);
        assertEq(farmTreasury.ACTION_FEE(), ACTION_FEE);
        assertEq(farmTreasury.PRIZE_POOL_AMOUNT(), PRIZE_POOL_AMOUNT);
        assertEq(farmTreasury.COMMUNITY_AMOUNT(), COMMUNITY_AMOUNT);
    }

    function testRecordActionWithValidSignature() public {
        string memory actionType = "plant";
        uint256 data = 123;
        uint256 nonce = 0;

        // 生成签名
        bytes32 structHash = keccak256(
            abi.encode(
                farmTreasury.RECORD_ACTION_TYPEHASH(),
                user,
                keccak256(bytes(actionType)),
                data,
                nonce
            )
        );

        bytes32 digest = _hashTypedDataV4(structHash);
        (uint8 v, bytes32 r, bytes32 s) = vm.sign(backendSignerKey, digest);
        bytes memory signature = abi.encodePacked(r, s, v);

        // 记录操作（支付 0.0975 ZETA）
        vm.prank(user);
        vm.expectEmit(true, false, false, true);
        emit ActionRecorded(user, actionType, data, block.timestamp);
        farmTreasury.recordActionWithSignature{value: ACTION_FEE}(actionType, data, nonce, signature);

        // 验证 nonce 增加
        assertEq(farmTreasury.userNonces(user), 1);
        
        // 验证资金分配
        assertEq(farmTreasury.prizePoolBalance(), PRIZE_POOL_AMOUNT);
        assertEq(farmTreasury.communityBalance(), COMMUNITY_AMOUNT);
    }

    function testRecordActionWithInsufficientPayment() public {
        string memory actionType = "plant";
        uint256 data = 123;
        uint256 nonce = 0;

        bytes32 structHash = keccak256(
            abi.encode(
                farmTreasury.RECORD_ACTION_TYPEHASH(),
                user,
                keccak256(bytes(actionType)),
                data,
                nonce
            )
        );

        bytes32 digest = _hashTypedDataV4(structHash);
        (uint8 v, bytes32 r, bytes32 s) = vm.sign(backendSignerKey, digest);
        bytes memory signature = abi.encodePacked(r, s, v);

        // 支付错误金额应该失败
        vm.prank(user);
        vm.expectRevert("Must pay exactly 0.0975 ZETA");
        farmTreasury.recordActionWithSignature{value: 0.05 ether}(actionType, data, nonce, signature);
    }

    function testRecordActionWithInvalidNonce() public {
        string memory actionType = "harvest";
        uint256 data = 456;
        uint256 wrongNonce = 5; // 用户 nonce 应该是 0

        // 生成签名
        bytes32 structHash = keccak256(
            abi.encode(
                farmTreasury.RECORD_ACTION_TYPEHASH(),
                user,
                keccak256(bytes(actionType)),
                data,
                wrongNonce
            )
        );

        bytes32 digest = _hashTypedDataV4(structHash);
        (uint8 v, bytes32 r, bytes32 s) = vm.sign(backendSignerKey, digest);
        bytes memory signature = abi.encodePacked(r, s, v);

        // 应该失败
        vm.prank(user);
        vm.expectRevert("Invalid nonce");
        farmTreasury.recordActionWithSignature{value: ACTION_FEE}(actionType, data, wrongNonce, signature);
    }

    function testRecordActionWithInvalidSignature() public {
        string memory actionType = "water";
        uint256 data = 789;
        uint256 nonce = 0;

        // 使用错误的私钥签名
        uint256 wrongKey = 0xDEAD;
        
        bytes32 structHash = keccak256(
            abi.encode(
                farmTreasury.RECORD_ACTION_TYPEHASH(),
                user,
                keccak256(bytes(actionType)),
                data,
                nonce
            )
        );

        bytes32 digest = _hashTypedDataV4(structHash);
        (uint8 v, bytes32 r, bytes32 s) = vm.sign(wrongKey, digest);
        bytes memory signature = abi.encodePacked(r, s, v);

        // 应该失败
        vm.prank(user);
        vm.expectRevert("Invalid signature");
        farmTreasury.recordActionWithSignature{value: ACTION_FEE}(actionType, data, nonce, signature);
    }

    function testUpdateBackendSigner() public {
        address newSigner = address(0x999);
        
        vm.expectEmit(true, true, false, false);
        emit BackendSignerUpdated(backendSigner, newSigner);
        farmTreasury.updateBackendSigner(newSigner);

        assertEq(farmTreasury.backendSigner(), newSigner);
    }

    function testUpdateBackendSignerOnlyOwner() public {
        address newSigner = address(0x999);
        
        vm.prank(user);
        vm.expectRevert();
        farmTreasury.updateBackendSigner(newSigner);
    }

    function testGetUserNonce() public view {
        assertEq(farmTreasury.getUserNonce(user), 0);
    }

    function testMultipleActions() public {
        // 第一次操作
        _recordAction(user, "plant", 1, 0);
        assertEq(farmTreasury.userNonces(user), 1);
        assertEq(farmTreasury.prizePoolBalance(), PRIZE_POOL_AMOUNT);
        assertEq(farmTreasury.communityBalance(), COMMUNITY_AMOUNT);

        // 第二次操作
        _recordAction(user, "water", 2, 1);
        assertEq(farmTreasury.userNonces(user), 2);
        assertEq(farmTreasury.prizePoolBalance(), PRIZE_POOL_AMOUNT * 2);
        assertEq(farmTreasury.communityBalance(), COMMUNITY_AMOUNT * 2);

        // 第三次操作
        _recordAction(user, "harvest", 3, 2);
        assertEq(farmTreasury.userNonces(user), 3);
        assertEq(farmTreasury.prizePoolBalance(), PRIZE_POOL_AMOUNT * 3);
        assertEq(farmTreasury.communityBalance(), COMMUNITY_AMOUNT * 3);
    }

    function testWithdrawPrizePool() public {
        // 执行一些操作累积资金
        _recordAction(user, "plant", 1, 0);
        _recordAction(user, "water", 2, 1);

        uint256 expectedAmount = PRIZE_POOL_AMOUNT * 2;
        assertEq(farmTreasury.prizePoolBalance(), expectedAmount);

        // 提取奖池资金
        uint256 beforeBalance = owner.balance;
        farmTreasury.withdrawPrizePool();
        
        assertEq(farmTreasury.prizePoolBalance(), 0);
        assertEq(owner.balance, beforeBalance + expectedAmount);
    }

    function testWithdrawCommunity() public {
        // 执行一些操作累积资金
        _recordAction(user, "plant", 1, 0);
        _recordAction(user, "water", 2, 1);

        uint256 expectedAmount = COMMUNITY_AMOUNT * 2;
        assertEq(farmTreasury.communityBalance(), expectedAmount);

        // 提取社区资金
        uint256 beforeBalance = communityAddress.balance;
        farmTreasury.withdrawCommunity();
        
        assertEq(farmTreasury.communityBalance(), 0);
        assertEq(communityAddress.balance, beforeBalance + expectedAmount);
    }

    function testDepositToPrizePool() public {
        // 注入初始奖池资金（比如 6000 ZETA）
        uint256 initialDeposit = 6000 ether;
        
        vm.deal(owner, initialDeposit);
        
        vm.expectEmit(true, false, false, true);
        emit InitialPrizePoolDeposited(owner, initialDeposit);
        farmTreasury.depositToPrizePool{value: initialDeposit}();
        
        assertEq(farmTreasury.prizePoolBalance(), initialDeposit);
        assertEq(address(farmTreasury).balance, initialDeposit);
    }

    function testReceiveEther() public {
        // 直接向合约转账
        uint256 depositAmount = 6000 ether;
        vm.deal(user, depositAmount);
        
        vm.prank(user);
        (bool success, ) = address(farmTreasury).call{value: depositAmount}("");
        require(success, "Transfer failed");
        
        assertEq(farmTreasury.prizePoolBalance(), depositAmount);
        assertEq(address(farmTreasury).balance, depositAmount);
    }

    function testDepositAndUserActions() public {
        // 1. 先注入初始奖池 6000 ZETA
        uint256 initialDeposit = 6000 ether;
        vm.deal(owner, initialDeposit);
        farmTreasury.depositToPrizePool{value: initialDeposit}();
        
        assertEq(farmTreasury.prizePoolBalance(), initialDeposit);
        
        // 2. 用户操作累积更多资金
        _recordAction(user, "plant", 1, 0);
        _recordAction(user, "water", 2, 1);
        
        // 3. 验证奖池累计 = 初始 6000 + 用户操作贡献
        uint256 expectedTotal = initialDeposit + (PRIZE_POOL_AMOUNT * 2);
        assertEq(farmTreasury.prizePoolBalance(), expectedTotal);
        
        // 4. 提取奖池资金
        uint256 beforeBalance = owner.balance;
        farmTreasury.withdrawPrizePool();
        
        assertEq(farmTreasury.prizePoolBalance(), 0);
        assertEq(owner.balance, beforeBalance + expectedTotal);
    }

    // Helper function
    function _recordAction(
        address _user,
        string memory actionType,
        uint256 data,
        uint256 nonce
    ) internal {
        bytes32 structHash = keccak256(
            abi.encode(
                farmTreasury.RECORD_ACTION_TYPEHASH(),
                _user,
                keccak256(bytes(actionType)),
                data,
                nonce
            )
        );

        bytes32 digest = _hashTypedDataV4(structHash);
        (uint8 v, bytes32 r, bytes32 s) = vm.sign(backendSignerKey, digest);
        bytes memory signature = abi.encodePacked(r, s, v);

        vm.prank(_user);
        farmTreasury.recordActionWithSignature{value: ACTION_FEE}(actionType, data, nonce, signature);
    }
}
