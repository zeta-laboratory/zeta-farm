# 🌾 ZETA Farm - Frontend & Smart Contracts

<div align="center">

**一款基于 ZetaChain 的全链农场经营游戏**

[![ZetaChain](https://img.shields.io/badge/ZetaChain-Mainnet-blue)](https://www.zetachain.com/)
[![Next.js](https://img.shields.io/badge/Next.js-14-black)](https://nextjs.org/)
[![Solidity](https://img.shields.io/badge/Solidity-0.8.20-orange)](https://soliditylang.org/)
[![License](https://img.shields.io/badge/License-MIT-green.svg)](LICENSE)

[English](#english) | [中文](#中文)

</div>

---

## 中文

### 📖 项目简介

ZETA Farm 是一款创新的区块链农场经营游戏，采用"数据中心化，链上锚定"的混合架构。玩家可以种植作物、养殖宠物、参与抽奖，并通过游戏内经济系统兑换真实的加密货币奖励。

本仓库包含：
- 🎨 **前端应用** - 基于 Next.js 和 Scaffold-ETH 2 的用户界面
- 📜 **智能合约** - 部署在 ZetaChain 主网的 Solidity 合约

### 🔗 相关仓库

- **前端 & 合约仓库** (本项目): [ZETA-Farm](https://github.com/zeta-laboratory/zeta-farm)
- **后端 API 仓库**: [zeta-farm-backend](https://github.com/zeta-laboratory/zeta-farm-backend)

---

### 🏗️ 架构概览

#### 混合架构设计

```
┌─────────────────┐         ┌──────────────────┐         ┌─────────────────┐
│   前端 (Next.js)  │◄───────►│  后端 API (Node)  │◄───────►│  MongoDB 数据库   │
│                 │         │                  │         │                 │
│  - UI 渲染      │         │  - 游戏逻辑       │         │  - 地块状态      │
│  - 钱包连接     │         │  - 状态管理       │         │  - 库存数据      │
│  - 合约调用     │         │  - 经济计算       │         │  - 用户经验      │
└────────┬────────┘         └─────────┬────────┘         └─────────────────┘
         │                            │
         │                            │
         └──────────┬─────────────────┘
                    │
                    ▼
         ┌─────────────────────┐
         │  ZetaChain 主网      │
         │                     │
         │  - FarmTreasury     │
         │  - RewardRedeemer   │
         └─────────────────────┘
```

#### 数据流

1. **读取游戏状态**: 前端 → 后端 API `/api/user/state` → MongoDB
2. **执行游戏操作**: 
   - 前端 → 后端 API `/api/plot/plant` → MongoDB (更新状态)
   - 前端 → FarmTreasury.sol `recordAction()` → ZetaChain (支付 0.1 ZETA 税)
3. **兑换奖励**: 
   - 前端 → 后端 API `/api/redeem` (验证金币) → 返回签名
   - 前端 → FarmTreasury.sol `redeemZeta()` (使用签名) → 转账 ZETA

---

### 📄 智能合约详解

#### 1️⃣ FarmTreasury.sol (财库合约)

**地址**: `0x...` (待部署)

**目的**: 作为游戏生态财库，实现玩家与主网的交互，增加链上交易量。

**初始状态**: 
- 项目方注入 **6,000 ZETA** 作为初始奖池

**核心功能**:

```solidity
// 记录玩家操作并收取税费
function recordAction(string memory actionType, string memory data) 
    external payable
```
- **触发时机**: 玩家执行"播种"、"收获"、"铲除"、"抽奖"时
- **要求**: `msg.value == 0.1 ether` (0.1 ZETA)
- **逻辑**: 
  - 将 0.1 ZETA 加入奖池
  - 发射 `ActionRecorded` 事件
  - 增加链上交易量

```solidity
// 兑换 ZETA 奖励
function redeemZeta(uint256 amount, uint256 nonce, bytes memory signature) 
    external
```
- **触发时机**: 玩家在前端使用金币兑换 ZETA
- **要求**: 后端签名验证通过
- **逻辑**:
  - 验证 EIP-712 签名的有效性
  - 检查 nonce 防止重放攻击
  - 从奖池转账 `amount` 数量的 ZETA 到玩家地址

---

#### 2️⃣ RewardRedeemer.sol (跨链奖励合约)

**地址**: `0x...` (待部署)

**目的**: 分发集字游戏的高价值跨链奖励。

**初始状态**: 
- 预充值多种 ZRC-20 资产：
  - z.BNB
  - z.ETH
  - z.SUI
  - z.SOL

**核心功能**:

```solidity
// 分发跨链奖励 (仅后端可调用)
function redeemCrossChainReward(
    uint256 targetChainId,
    string memory tokenSymbol,
    address recipientAddress,
    uint256 amount
) external onlyOwner
```
- **触发时机**: 玩家在后端验证集齐字母后
- **权限**: 仅后端服务器钱包可调用
- **逻辑**:
  - 后端 API 验证玩家完成集字挑战
  - 调用 ZetaChain CCTX 机制
  - 将 ZRC-20 资产跨链发送到目标链的用户钱包
  - 例：将 z.BNB 发送到用户在 BNB Chain 上的地址

---

### 🎮 游戏机制

#### 核心玩法

1. **种植系统**
   - 购买种子 → 播种 → 等待成长 → 收获作物
   - 每次操作支付 0.1 ZETA 税费

2. **宠物系统**
   - 养殖宠物自动产出金币
   - 提升宠物等级增加收益

3. **抽奖系统**
   - 消耗金币参与抽奖
   - 赢取字母碎片或额外奖励

4. **集字挑战**
   - 集齐特定字母组合
   - 兑换跨链加密货币奖励

5. **金币兑换**
   - 使用游戏内金币兑换 ZETA
   - 1:1 汇率，后端签名验证

---

### 🛠️ 技术栈

#### 前端
- **框架**: Next.js 14 + TypeScript
- **UI 库**: React 18
- **样式**: Tailwind CSS + daisyUI
- **Web3**: 
  - Wagmi (React Hooks for Ethereum)
  - Viem (TypeScript Interface for Ethereum)
  - RainbowKit (钱包连接)
- **状态管理**: Zustand
- **HTTP 客户端**: Axios

#### 智能合约
- **语言**: Solidity ^0.8.20
- **框架**: Foundry / Hardhat
- **库**: OpenZeppelin Contracts
- **测试**: Forge / Hardhat Test
- **部署链**: ZetaChain Mainnet

#### 开发工具
- **脚手架**: Scaffold-ETH 2
- **包管理**: Yarn / pnpm
- **代码质量**: ESLint + Prettier
- **版本控制**: Git + GitHub

---

### 🚀 快速开始

#### 前置要求

- Node.js >= 18.x
- Yarn >= 1.22.x
- Foundry (用于合约开发)

#### 安装依赖

```bash
# 克隆仓库
git clone https://github.com/zeta-laboratory/zeta-farm
cd ZETA-Farm

# 安装依赖
yarn install
```

#### 配置环境变量

创建 `.env` 文件：

```bash
# 前端环境变量 (packages/nextjs/.env.local)
NEXT_PUBLIC_BACKEND_API_URL=https://api.zeta-farm.com
NEXT_PUBLIC_FARM_TREASURY_ADDRESS=0x...
NEXT_PUBLIC_REWARD_REDEEMER_ADDRESS=0x...

# 合约环境变量 (packages/foundry/.env)
DEPLOYER_PRIVATE_KEY=your_private_key_here
ZETACHAIN_RPC_URL=https://zetachain-mainnet.g.alchemy.com/v2/your-api-key
ETHERSCAN_API_KEY=your_etherscan_api_key
```

#### 运行前端开发服务器

```bash
cd packages/nextjs
yarn dev
```

访问 http://localhost:3000

#### 编译智能合约

```bash
cd packages/foundry
forge build
```

#### 运行合约测试

```bash
forge test
```

#### 部署合约

```bash
# 部署到 ZetaChain 测试网
forge script script/Deploy.s.sol --rpc-url zetachain-testnet --broadcast

# 部署到 ZetaChain 主网
forge script script/Deploy.s.sol --rpc-url zetachain-mainnet --broadcast --verify
```

---

### 📂 项目结构

```
z-farm/
├── packages/
│   ├── foundry/                # 智能合约
│   │   ├── contracts/
│   │   │   ├── FarmTreasury.sol
│   │   │   ├── RewardRedeemer.sol
│   │   │   └── interfaces/
│   │   ├── script/             # 部署脚本
│   │   ├── test/               # 合约测试
│   │   └── lib/                # 依赖库
│   │
│   └── nextjs/                 # 前端应用
│       ├── app/                # Next.js App Router
│       │   ├── page.tsx        # 主页
│       │   ├── farm/           # 农场页面
│       │   ├── lottery/        # 抽奖页面
│       │   └── redeem/         # 兑换页面
│       ├── components/         # React 组件
│       │   ├── Farm/
│       │   ├── Lottery/
│       │   └── Redeem/
│       ├── hooks/              # 自定义 Hooks
│       │   ├── useGameState.ts
│       │   └── useContract.ts
│       ├── services/           # API 服务
│       │   └── api.ts
│       └── styles/             # 样式文件
│
├── README.md
├── CONTRIBUTING.md
└── package.json
```

---

### 🔐 安全特性

1. **签名验证**: 使用 EIP-712 标准进行链下签名验证
2. **重放保护**: Nonce 机制防止重放攻击
3. **权限控制**: 关键函数使用 `onlyOwner` 修饰符
4. **金额限制**: 兑换功能设置单次和每日限额
5. **审计**: 合约经过第三方安全审计 (待完成)

---

### 🧪 测试

#### 合约测试

```bash
# 运行所有测试
forge test

# 运行特定测试文件
forge test --match-path test/FarmTreasury.t.sol

# 查看测试覆盖率
forge coverage
```

#### 前端测试

```bash
cd packages/nextjs
yarn test
```

---

### 📊 Gas 优化

- 使用 `calldata` 而非 `memory` 用于只读参数
- 合理使用 `uint256` 避免额外的类型转换
- 批量操作减少交易次数
- 事件索引优化查询效率

---

### 🤝 贡献指南

我们欢迎社区贡献！请阅读 [CONTRIBUTING.md](CONTRIBUTING.md) 了解详情。

#### 贡献流程

1. Fork 本仓库
2. 创建特性分支 (`git checkout -b feature/AmazingFeature`)
3. 提交更改 (`git commit -m 'Add some AmazingFeature'`)
4. 推送到分支 (`git push origin feature/AmazingFeature`)
5. 开启 Pull Request

---

### 📝 路线图

- [x] 基础农场系统
- [x] 财库合约部署
- [x] 跨链奖励合约
- [ ] 移动端适配
- [ ] 社交功能 (好友系统)
- [ ] NFT 皮肤系统
- [ ] DAO 治理模块
- [ ] 多语言支持

---

### 📄 许可证

本项目采用 MIT 许可证 - 查看 [LICENSE](LICENSE) 文件了解详情。

---

### 📞 联系方式

- **官网**: https://zeta-farm.com //需要修改成vercel的
- **Twitter**: [@ZETAFarm](https://x.com/ZetaChain_CH) 

---

### 🙏 致谢

- [ZetaChain](https://www.zetachain.com/) - 提供全链基础设施
- [Scaffold-ETH 2](https://scaffoldeth.io/) - 优秀的开发脚手架
- [OpenZeppelin](https://www.openzeppelin.com/) - 安全的智能合约库

---

<div align="center">

**Built with ❤️ on ZetaChain**

</div>

---

## English

### 📖 Project Overview

ZETA Farm is an innovative blockchain farming game built on ZetaChain, adopting a hybrid architecture of "centralized data, on-chain anchoring". Players can plant crops, raise pets, participate in lotteries, and redeem real cryptocurrency rewards through the in-game economic system.

This repository contains:
- 🎨 **Frontend Application** - User interface built with Next.js and Scaffold-ETH 2
- 📜 **Smart Contracts** - Solidity contracts deployed on ZetaChain Mainnet

### 🔗 Related Repositories

- **Frontend & Contracts** (This Repo): [ZETA-Farm](https://github.com/zeta-laboratory/zeta-farm)
- **Backend API**: [zeta-farm-backend](https://github.com/zeta-laboratory/zeta-farm-backend)

---

### 🏗️ Architecture Overview

#### Hybrid Architecture Design

```
┌─────────────────┐         ┌──────────────────┐         ┌─────────────────┐
│  Frontend       │◄───────►│   Backend API    │◄───────►│    MongoDB      │
│  (Next.js)      │         │   (Node.js)      │         │                 │
│                 │         │                  │         │  - Plot States  │
│  - UI Render    │         │  - Game Logic    │         │  - Inventory    │
│  - Wallet       │         │  - State Mgmt    │         │  - User XP      │
│  - Contract Call│         │  - Economics     │         │                 │
└────────┬────────┘         └─────────┬────────┘         └─────────────────┘
         │                            │
         │                            │
         └──────────┬─────────────────┘
                    │
                    ▼
         ┌─────────────────────┐
         │  ZetaChain Mainnet  │
         │                     │
         │  - FarmTreasury     │
         │  - RewardRedeemer   │
         └─────────────────────┘
```

#### Data Flow

1. **Read Game State**: Frontend → Backend API `/api/user/state` → MongoDB
2. **Execute Game Action**: 
   - Frontend → Backend API `/api/plot/plant` → MongoDB (update state)
   - Frontend → FarmTreasury.sol `recordAction()` → ZetaChain (pay 0.1 ZETA tax)
3. **Redeem Rewards**: 
   - Frontend → Backend API `/api/redeem` (verify coins) → return signature
   - Frontend → FarmTreasury.sol `redeemZeta()` (with signature) → transfer ZETA

---

### 📄 Smart Contracts

#### 1️⃣ FarmTreasury.sol (Treasury Contract)

**Address**: `0x...` (To be deployed)

**Purpose**: Acts as the game ecosystem treasury, enabling player interaction with the mainnet and increasing on-chain transaction volume.

**Initial State**: 
- Project team injects **6,000 ZETA** as initial prize pool

**Core Functions**:

```solidity
// Record player action and collect tax
function recordAction(string memory actionType, string memory data) 
    external payable
```
- **Triggered**: When player plants, harvests, removes, or plays lottery
- **Requirement**: `msg.value == 0.1 ether` (0.1 ZETA)
- **Logic**: 
  - Add 0.1 ZETA to prize pool
  - Emit `ActionRecorded` event
  - Increase on-chain transaction volume

```solidity
// Redeem ZETA rewards
function redeemZeta(uint256 amount, uint256 nonce, bytes memory signature) 
    external
```
- **Triggered**: When player redeems ZETA with in-game coins
- **Requirement**: Backend signature verification passed
- **Logic**:
  - Verify EIP-712 signature validity
  - Check nonce to prevent replay attacks
  - Transfer `amount` of ZETA from pool to player

---

#### 2️⃣ RewardRedeemer.sol (Cross-Chain Reward Contract)

**Address**: `0x...` (To be deployed)

**Purpose**: Distribute high-value cross-chain rewards for the letter collection game.

**Initial State**: 
- Pre-funded with various ZRC-20 assets:
  - z.BNB
  - z.ETH
  - z.SUI
  - z.SOL

**Core Function**:

```solidity
// Distribute cross-chain reward (backend only)
function redeemCrossChainReward(
    uint256 targetChainId,
    string memory tokenSymbol,
    address recipientAddress,
    uint256 amount
) external onlyOwner
```
- **Triggered**: After player completes letter collection verified by backend
- **Permission**: Only backend server wallet can call
- **Logic**:
  - Backend API verifies letter collection completion
  - Call ZetaChain CCTX mechanism
  - Send ZRC-20 assets cross-chain to user's wallet on target chain
  - Example: Send z.BNB to user's address on BNB Chain

---

### 🎮 Game Mechanics

#### Core Gameplay

1. **Farming System**
   - Buy seeds → Plant → Wait for growth → Harvest crops
   - Pay 0.1 ZETA tax per action

2. **Pet System**
   - Raise pets to automatically generate coins
   - Level up pets to increase earnings

3. **Lottery System**
   - Spend coins to participate in lottery
   - Win letter fragments or additional rewards

4. **Letter Collection Challenge**
   - Collect specific letter combinations
   - Redeem cross-chain cryptocurrency rewards

5. **Coin Redemption**
   - Exchange in-game coins for ZETA
   - 1:1 ratio, backend signature verification

---

### 🛠️ Tech Stack

#### Frontend
- **Framework**: Next.js 14 + TypeScript
- **UI Library**: React 18
- **Styling**: Tailwind CSS + daisyUI
- **Web3**: 
  - Wagmi (React Hooks for Ethereum)
  - Viem (TypeScript Interface for Ethereum)
  - RainbowKit (Wallet Connection)
- **State Management**: Zustand
- **HTTP Client**: Axios

#### Smart Contracts
- **Language**: Solidity ^0.8.20
- **Framework**: Foundry / Hardhat
- **Libraries**: OpenZeppelin Contracts
- **Testing**: Forge / Hardhat Test
- **Deployment**: ZetaChain Mainnet

#### Development Tools
- **Scaffold**: Scaffold-ETH 2
- **Package Manager**: Yarn / pnpm
- **Code Quality**: ESLint + Prettier
- **Version Control**: Git + GitHub

---

### 🚀 Quick Start

#### Prerequisites

- Node.js >= 18.x
- Yarn >= 1.22.x
- Foundry (for contract development)

#### Installation

```bash
# Clone repository
git clone https://github.com/zeta-laboratory/zeta-farm
cd ZETA-Farm

# Install dependencies
yarn install
```

#### Environment Configuration

Create `.env` file:

```bash
# Frontend environment variables (packages/nextjs/.env.local)
NEXT_PUBLIC_BACKEND_API_URL=https://api.zeta-farm.com
NEXT_PUBLIC_FARM_TREASURY_ADDRESS=0x...
NEXT_PUBLIC_REWARD_REDEEMER_ADDRESS=0x...

# Contract environment variables (packages/foundry/.env)
DEPLOYER_PRIVATE_KEY=your_private_key_here
ZETACHAIN_RPC_URL=https://zetachain-mainnet.g.alchemy.com/v2/your-api-key
ETHERSCAN_API_KEY=your_etherscan_api_key
```

#### Run Frontend Development Server

```bash
cd packages/nextjs
yarn dev
```

Visit http://localhost:3000

#### Compile Smart Contracts

```bash
cd packages/foundry
forge build
```

#### Run Contract Tests

```bash
forge test
```

#### Deploy Contracts

```bash
# Deploy to ZetaChain Testnet
forge script script/Deploy.s.sol --rpc-url zetachain-testnet --broadcast

# Deploy to ZetaChain Mainnet
forge script script/Deploy.s.sol --rpc-url zetachain-mainnet --broadcast --verify
```

---

### 📂 Project Structure

```
z-farm/
├── packages/
│   ├── foundry/                # Smart Contracts
│   │   ├── contracts/
│   │   │   ├── FarmTreasury.sol
│   │   │   ├── RewardRedeemer.sol
│   │   │   └── interfaces/
│   │   ├── script/             # Deployment Scripts
│   │   ├── test/               # Contract Tests
│   │   └── lib/                # Dependencies
│   │
│   └── nextjs/                 # Frontend Application
│       ├── app/                # Next.js App Router
│       │   ├── page.tsx        # Home Page
│       │   ├── farm/           # Farm Page
│       │   ├── lottery/        # Lottery Page
│       │   └── redeem/         # Redeem Page
│       ├── components/         # React Components
│       │   ├── Farm/
│       │   ├── Lottery/
│       │   └── Redeem/
│       ├── hooks/              # Custom Hooks
│       │   ├── useGameState.ts
│       │   └── useContract.ts
│       ├── services/           # API Services
│       │   └── api.ts
│       └── styles/             # Style Files
│
├── README.md
├── CONTRIBUTING.md
└── package.json
```

---

### 🔐 Security Features

1. **Signature Verification**: Use EIP-712 standard for off-chain signature verification
2. **Replay Protection**: Nonce mechanism to prevent replay attacks
3. **Access Control**: Critical functions use `onlyOwner` modifier
4. **Amount Limits**: Redemption functions set per-transaction and daily limits
5. **Audit**: Contracts audited by third-party security firm (pending)

---

### 📊 Gas Optimization

- Use `calldata` instead of `memory` for read-only parameters
- Properly use `uint256` to avoid extra type conversions
- Batch operations to reduce transaction count
- Event indexing for efficient querying

---

### 🤝 Contributing

We welcome community contributions! Please read [CONTRIBUTING.md](CONTRIBUTING.md) for details.

#### Contribution Workflow

1. Fork this repository
2. Create feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to branch (`git push origin feature/AmazingFeature`)
5. Open Pull Request

---

### 📝 Roadmap

- [x] Basic farming system
- [x] Treasury contract deployment
- [x] Cross-chain reward contract
- [ ] Mobile adaptation
- [ ] Social features (friend system)
- [ ] NFT skin system
- [ ] DAO governance module
- [ ] Multi-language support

---

### 📄 License

This project is licensed under the MIT License - see [LICENSE](LICENSE) file for details.

---

### 📞 Contact

- **Website**: https://zeta-farm.com //换成vercel
- **Twitter**: [@ZETAFarm](https://x.com/ZetaChain_CH)

---

### 🙏 Acknowledgments

- [ZetaChain](https://www.zetachain.com/) - Providing omnichain infrastructure
- [Scaffold-ETH 2](https://scaffoldeth.io/) - Excellent development scaffold
- [OpenZeppelin](https://www.openzeppelin.com/) - Secure smart contract libraries

---

<div align="center">

**Built with ❤️ on ZetaChain**

</div>
