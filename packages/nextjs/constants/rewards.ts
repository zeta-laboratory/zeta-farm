import { CheckinReward, Reward } from "~~/types/reward";

/**
 * 每日签到奖励配置（6档，期望0.9金币）
 * 期望计算：0.1*55% + 0.5*30% + 1*8% + 3*4% + 10*2.5% + 50*0.5% = 0.905 ✓
 */
export const DAILY_CHECKIN_REWARDS: CheckinReward[] = [
  { coins: 0.1, prob: 0.55 }, // 0.1金币，55%概率
  { coins: 0.5, prob: 0.3 }, // 0.5金币，30%概率
  { coins: 1, prob: 0.08 }, // 1金币，8%概率
  { coins: 3, prob: 0.04 }, // 3金币，4%概率
  { coins: 10, prob: 0.025 }, // 10金币，2.5%概率
  { coins: 50, prob: 0.005 }, // 50金币，0.5%概率
];

/**
 * 奖励列表（用于字母收集兑换）
 */
export const REWARDS_LIST: Reward[] = [
  { id: "bnb", name: "BNB", emoji: "💎", token: "BNB" },
  { id: "eth", name: "ETH", emoji: "🔷", token: "ETH" },
  { id: "sol", name: "SOL", emoji: "☀️", token: "SOL" },
  { id: "avax", name: "AVAX", emoji: "🏔️", token: "AVAX" },
  { id: "sui", name: "SUI", emoji: "💧", token: "SUI" },
];

/**
 * 集字游戏配置 - 每个短语代表一个收集目标
 */
export const LETTER_COLLECTION_PHRASES: string[] = [
  "First Universal Blockchain", // 第一行
  "Build Once Launch Everywhere", // 第二行
  "Start Universal Journey", // 第三行
  "GZetaChain Access Any Chain", // 第四行
];

/**
 * 抽奖种子包概率分布
 */
export const GLUCK_SEED_POOLS = [
  // 低级种子（1-2级）：35%概率，数量3-5个
  { seeds: ["radish", "strawberry"], prob: 0.35, minQty: 3, maxQty: 5 },
  // 低级种子（3-4级）：20%概率，数量1-3个
  { seeds: ["corn", "grape"], prob: 0.55, minQty: 1, maxQty: 3 },
  // 中级种子（5-6级）：15%概率，数量1-2个
  { seeds: ["tomato", "blueberry"], prob: 0.7, minQty: 1, maxQty: 2 },
  // 中级种子（7-8级）：12%概率，数量1-2个
  { seeds: ["pumpkin", "pineapple"], prob: 0.82, minQty: 1, maxQty: 2 },
  // 高级种子（9-10级）：5%概率，数量1-2个
  { seeds: ["coffee", "cocoa"], prob: 0.87, minQty: 1, maxQty: 2 },
  // 高级种子（11-12级）：3%概率，数量1-2个
  { seeds: ["tea", "chili"], prob: 0.9, minQty: 1, maxQty: 2 },
  // 顶级种子（13-14级）：0.005%概率，数量1个
  { seeds: ["rice", "wheat"], prob: 0.90005, minQty: 1, maxQty: 1 },
  // 顶级种子（15-16级）：0.003%概率，数量1个
  { seeds: ["peach", "pear"], prob: 0.90008, minQty: 1, maxQty: 1 },
  // 稀有种子（17-18级）：0.001%概率，数量1个
  { seeds: ["mango", "cherry"], prob: 0.90009, minQty: 1, maxQty: 1 },
];
