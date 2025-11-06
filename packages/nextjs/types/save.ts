import { PetOwnership } from "./pet";
import { Plot } from "./plot";

/**
 * 签到记录类型（年月 -> 日期数组）
 */
export type CheckinRecords = Record<string, number[]>;

/**
 * 库存类型（种子ID -> 数量）
 */
export type Inventory = Record<string, number>;

/**
 * 果实库存类型（作物ID -> 数量）
 */
export type FruitInventory = Record<string, number>;

/**
 * 字母收集记录（字母 -> 数量）
 */
export type CollectedLetters = Record<string, number>;

/**
 * 游戏存档数据
 */
export interface GameSave {
  coins: number;
  zeta: number;
  tickets: number;
  exp: number;
  protectFreeUsed: boolean;
  protectBoughtToday: number;
  protectLastDate: string;
  checkinLastDate: string;
  checkinRecords: CheckinRecords;
  collectedLetters: CollectedLetters;
  redeemedRewards: string[];
  plots: Plot[];
  inventory: Inventory;
  fruits: FruitInventory;
  fertilizer: number;
  pets: PetOwnership;
  robotSubscribed: boolean;
  selectedSeed: string | null;
  tool: string;
  lastLogin: number;
  __testingBoostApplied: boolean;
}
