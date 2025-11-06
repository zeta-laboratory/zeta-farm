/**
 * 地块相关工具函数
 */
import { PLOT_UNLOCK_COSTS, PLOT_UNLOCK_LEVELS } from "~~/constants/levels";
import { Plot } from "~~/types";

/**
 * 计算开垦土地的价格（根据土地序号，价格递增）
 * @param plotId 地块ID
 * @returns 开垦价格（金币）
 */
export function getPlotUnlockCost(plotId: number): number {
  return PLOT_UNLOCK_COSTS[plotId] || 50000;
}

/**
 * 计算开垦土地所需的等级（根据土地序号，等级递增）
 * @param plotId 地块ID
 * @returns 所需等级
 */
export function getPlotUnlockLevel(plotId: number): number {
  return PLOT_UNLOCK_LEVELS[plotId] || 15;
}

/**
 * 替换地块数组中的某个地块
 * @param arr 地块数组
 * @param plot 要替换的地块
 * @returns 新的地块数组
 */
export function replacePlot(arr: Plot[], plot: Plot): Plot[] {
  return arr.map(p => (p.id === plot.id ? plot : p));
}
