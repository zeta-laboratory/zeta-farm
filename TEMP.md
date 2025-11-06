智能合约功能需求清单 (for AI Copilot)

以下是 ZETA 农场游戏所需的两个智能合约的功能描述。

1. 合约1: FarmTreasury.sol (农场财库合约)

目的:
此合约是游戏的主要交互点，作为“生态财库”。其核心功能是接收玩家在所有游戏互动中支付的 0.0975 ZETA "税"，并将其拆分：0.0775 ZETA 存入公共奖池（合约自身），0.02 ZETA 转发给社区地址。同时，它允许玩家使用后端签名的“凭证”（Voucher）从该奖池中“兑换” ZETA。

核心要求:

继承 OpenZeppelin的 Ownable (用于管理) 和 EIP712 (用于签名凭证)。

合约需要能够接收 ZETA（用于项目方注入的 6000 ZETA 初始奖池）。

功能1: 状态变量

signerAddress (address): 后端签名钱包地址。在部署时于构造函数中设置。此地址用于签署 "兑换凭证"。

communityAddress (address payable): 社区奖励地址。在部署时于构造函数中设置。用于接收 0.02 ZETA 的社区奖励。

userNonces (mapping(address => uint256)): 用于防止重放攻击的 Nonce 映射，记录每个用户已完成的兑换次数。

功能2: recordAction() (玩家交互)

用途: 玩家在前端执行所有游戏互动时（包括播种、收获、浇水、除草、除虫、施肥、铲除、抽奖）都必须调用此函数。

目的: 刷 ZetaChain 主网交易量，并按比例为奖池和社区地址贡献 ZETA。

参数:

actionType (uint8): 动作类型的枚举 (例如 1=播种, 2=收获, 3=浇水, 4=抽奖...)。

data (uint256): 附加数据 (例如 plotId)。后续可拓展。

逻辑 (Payable):

此函数必须是 payable。

定义常量:

ACTION_TAX = 0.0975 ether (总交互成本)

COMMUNITY_PORTION = 0.02 ether (社区部分)

(奖池部分 0.0775 ether 将自动保留)

强制要求: require(msg.value == ACTION_TAX, "Must send exact tax of 0.0975 ZETA");。

转发社区奖励: 立即将 COMMUNITY_PORTION (0.02 ZETA) 发送到 communityAddress。

(bool sent, ) = communityAddress.call{value: COMMUNITY_PORTION}("");

require(sent, "Failed to send community reward");

(剩余的 0.0775 ZETA 将自动保留在合约余额中，作为奖池资金)。

发射一个事件: emit ActionRecorded(msg.sender, actionType, data);。

功能3: redeemZeta() (兑换 ZETA)

用途: 玩家在游戏中用“金币”（后端数据）兑换 ZETA 时调用。

目的: 允许玩家使用后端（Next.js）验证并签名的凭证，从该合约奖池中提取 ZETA。

EIP-712 结构: 需定义一个 EIP-712 Redem 类型，包含 (address user, uint256 amount, uint256 nonce)。

参数:

amount (uint256): 要兑换的 ZETA 数量 (wei)。

nonce (uint256): 此次兑换的唯一 Nonce，必须与 userNonces[msg.sender] 匹配。

signature (bytes): 由 signerAddress (后端) 生成的 EIP-712 签名。

逻辑:

验证 Nonce: require(nonce == userNonces[msg.sender], "Invalid nonce");。

验证签名:

使用 EIP-712 规范构建消息哈希。

使用 ECDSA.recover() 恢复签名者地址。

require(recoveredSigner == signerAddress, "Invalid signature");。

验证奖池余额: require(address(this).balance >= amount, "Insufficient pool balance");。

更新 Nonce (防重入): userNonces[msg.sender]++;。

发送 ZETA: 使用 call 方法安全地向 msg.sender 发送 amount 数量的 ZETA。

发射事件: emit ZetaRedeemed(msg.sender, amount)。

功能4: 管理功能

receive() external payable {}: 必须包含，用于接收项目方注入的 6000 ZETA 初始奖池。

updateSigner(address newSigner): onlyOwner 函数，用于在需要时更新后端签名钱包地址。

updateCommunityAddress(address payable newCommunityAddress): onlyOwner 函数，用于更新社区奖励地址。

ownerWithdraw(uint256 amount): onlyOwner 函数，用于提取奖池中多余的资金（例如玩家充入的税）。

2. 合约2: RewardRedeemer.sol (集字跨链奖励合约)

目的:
此合约是一个 ZetaChain 全链 (Omnichain) 合约，专门用于分发“集字游戏”的奖励。它不被玩家直接调用。它由后端服务器触发，将预充值的 ZRC-20 资产（如 z.BNB, z.ETH）跨链发送给获奖用户。

核心要求:

继承 OpenZeppelin 的 Ownable。合约的 owner 必须是后端服务器的钱包地址。

需要集成 ZetaChain 的 Omnichain 接口（IZRC20 和 ISystemContract / IConnector）。

功能1: 状态变量

zrc20Pools (mapping(string => address)): 映射（例如 "BNB" $\rightarrow$ ZRC-20 z.BNB 的合约地址）。

功能2: redeemCrossChainReward() (跨链分发奖励)

用途: 由后端服务器在验证玩家集齐字符后调用。

访问控制: 

$$关键$$

 必须是 onlyOwner。

参数:

targetChainId (uint256): 目标链的 ID (例如 BNB Chain, Ethereum)。

tokenSymbol (string): 要发送的代币符号 (例如 "BNB", "ETH")，用于在 zrc20Pools 映射中查找。

recipientAddress (bytes): 目标链上的接收者钱包地址（使用 bytes 以支持非 EVM 链）。

amount (uint256): 要发送的 ZRC-20 代币数量。

逻辑:

require(msg.sender == owner(), "Only backend server can call this");。

获取 ZRC-20 地址: address zrc20Address = zrc20Pools[tokenSymbol];。

require(zrc20Address != address(0), "Token not supported");。

验证奖池余额: require(IERC20(zrc20Address).balanceOf(address(this)) >= amount, "Insufficient pool balance");。

调用 ZetaChain 跨链:

(此部分逻辑需严格遵循 ZetaChain 文档)

IERC20(zrc20Address).approve(ZETA_SYSTEM_CONTRACT_ADDRESS, amount);

调用 ZetaChain 的系统合约或 ZRC-20 合约的 crossChainTransfer (或类似) 方法，将 amount 数量的 zrc20Address 代币发送到 targetChainId 上的 recipientAddress。

发射事件: emit CrossChainRedeemed(recipientAddress, tokenSymbol, amount)。

功能3: 管理功能

资金注入: 此合约需要项目方手动转账 ZRC-20 代币（如 z.BNB, z.ETH）到此合约地址，作为固定奖池。

addSupportedToken(string calldata symbol, address zrc20Address): onlyOwner 函数，用于添加新的 ZRC-20 奖池（例如 "SUI"）。

ownerWithdrawToken(address zrc20Address, uint256 amount): onlyOwner 函数，用于管理或提取奖池资金。