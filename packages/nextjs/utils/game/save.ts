import { getTodayDateStr, now } from "./time";
import type { GameSave } from "~~/types";

/**
 * 生成默认游戏存档
 */
export function createDefaultSave(): GameSave {
  return {
    coins: 0, // 初始0金币
    zeta: 0, // 初始没有ZETA
    tickets: 0, // 初始没有奖券
    exp: 0, // 初始经验值为0，等级1
    protectFreeUsed: false, // 今天是否已使用免费保护
    protectBoughtToday: 0, // 今天购买保护的次数
    protectLastDate: getTodayDateStr(), // 最后使用保护的日期
    checkinLastDate: "", // 上次签到日期
    checkinRecords: {}, // 签到记录 { "2025-01": [1,2,3...] } 记录该月签到的日期
    collectedLetters: {}, // 收集的字母 { "A": 3, "B": 1, ... }
    redeemedRewards: [], // 已兑换的奖励ID列表
    plots: Array.from({ length: 18 }).map((_, i) => ({
      id: i,
      unlocked: i === 0, // 只有第一块地默认解锁
      seedId: null,
      plantedAt: null,
      fertilized: false,
      wateredAt: null,
      weeds: false,
      pests: false,
      waterRequirements: [], // 浇水需求时间点数组 [{time: seconds, done: false}]
      weedRequirements: [], // 除草需求时间点数组 [{time: seconds, done: false}]
      pausedDuration: 0, // 累计暂停生长的时间（秒）
      protectedUntil: 0,
    })),
    // 初始背包：1个白萝卜种子
    inventory: { radish: 1 },
    fruits: {}, // 初始没有果实库存
    fertilizer: 0, // 肥料数量
    pets: {}, // 已拥有的宠物 { 'cat': true, 'dog': true, ... }
    robotSubscribed: false, // 机器人订阅状态
    selectedSeed: null,
    tool: "harvest",
    lastLogin: now(),
    __testingBoostApplied: false,
  } as GameSave;
}
