/**
 * 作物生长阶段相关工具函数
 */
import { now } from "./time";
import { SEEDS } from "~~/constants/seeds";
import { GameStage, Plot } from "~~/types";

// 阶段常量
export const STAGE = {
  EMPTY: "EMPTY" as GameStage,
  SEED: "SEED" as GameStage,
  SPROUT: "SPROUT" as GameStage,
  GROWING: "GROWING" as GameStage,
  RIPE: "RIPE" as GameStage,
  WITHER: "WITHER" as GameStage,
};

/**
 * 计算地块当前的生长阶段
 * @param plot 地块信息
 * @returns 当前阶段
 */
export function stageOf(plot: Plot): string {
  if (!plot.seedId || !plot.plantedAt) return STAGE.EMPTY;

  const seed = SEEDS[plot.seedId];
  // 实际生长时间 = 总时间 - 暂停时间
  const elapsed = now() - plot.plantedAt - (plot.pausedDuration || 0);
  const [s1, s2, s3] = seed.stages;
  const aliveUntil = s3 + seed.witherAfter;

  if (elapsed < s1) return STAGE.SEED;
  if (elapsed < s2) return STAGE.SPROUT;
  if (elapsed < s3) return STAGE.GROWING;
  if (elapsed < aliveUntil) return STAGE.RIPE;
  return STAGE.WITHER;
}

/**
 * 计算到下一阶段的剩余时间
 * @param plot 地块信息
 * @returns 剩余秒数
 */
export function timeToNextStage(plot: Plot): number {
  if (!plot.seedId || !plot.plantedAt) return 0;

  const seed = SEEDS[plot.seedId];
  // 实际生长时间 = 总时间 - 暂停时间
  const elapsed = now() - plot.plantedAt - (plot.pausedDuration || 0);
  const [s1, s2, s3] = seed.stages;

  if (elapsed < s1) return s1 - elapsed;
  if (elapsed < s2) return s2 - elapsed;
  if (elapsed < s3) return s3 - elapsed;

  const aliveUntil = s3 + seed.witherAfter;
  if (elapsed < aliveUntil) return aliveUntil - elapsed; // 距离枯萎
  return 0;
}
