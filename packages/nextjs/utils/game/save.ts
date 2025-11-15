import { now } from "./time";
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
    // protection mechanic removed: protectFreeUsed/protectBoughtToday/protectLastDate removed
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
      pests: false,
      waterRequirements: [], // 浇水需求时间点数组 [{time: seconds, done: boolean, doneAt: number | null}]
      weedRequirements: [], // 除草需求时间点数组 [{time: seconds, done: boolean, doneAt: number | null}]
      pausedDuration: 0, // 累计暂停生长的时间（秒）
      pausedAt: null, // 暂停开始时间（秒）
      lastPestCheckAt: null,
      matureAt: null,
      witheredAt: null,
      stage: "empty",
      // 兼容字段（用于前端展示）
      needsWater: false,
      hasWeeds: false,
      progress: 0,
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
