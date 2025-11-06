/**
 * 等级相关工具函数
 */
import { LEVELS } from "~~/constants/levels";

/**
 * 根据经验值计算当前等级
 * @param exp 经验值
 * @returns 当前等级
 */
export function getLevel(exp: number): number {
  let lvl = 1;
  for (let i = 0; i < LEVELS.length; i++) {
    if (exp >= LEVELS[i]) lvl = i + 1;
  }
  return Math.min(lvl, LEVELS.length);
}
