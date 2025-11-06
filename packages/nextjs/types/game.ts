/**
 * 游戏阶段枚举
 */
export enum GameStage {
  EMPTY = "EMPTY",
  SEED = "SEED",
  SPROUT = "SPROUT",
  GROWING = "GROWING",
  RIPE = "RIPE",
  WITHER = "WITHER",
}

/**
 * 工具类型
 */
export type ToolType = "harvest" | "plant" | "water" | "weed" | "pesticide" | "fertilizer" | "shovel" | "robot" | "pet";

/**
 * 语言类型
 */
export type Language = "zh" | "en" | "ko";

/**
 * 货币类型
 */
export type CurrencyType = "zeta" | "tickets";

/**
 * 商店标签页类型
 */
export type ShopTab = "buy" | "buyFertilizer" | "sell";
