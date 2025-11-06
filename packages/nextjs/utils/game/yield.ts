/**
 * 作物产量相关工具函数
 */
import { Plot } from "~~/types";

/**
 * 计算地块的收获数量
 * @param plot 地块信息
 * @returns 收获数量
 */
export function yieldAmount(plot: Plot): number {
  // 种植和收获是1:1，种1个得1个
  if (!plot.seedId || !plot.plantedAt) return 0;
  return 1;
}
