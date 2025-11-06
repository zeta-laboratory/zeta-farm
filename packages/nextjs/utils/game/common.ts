/**
 * 通用工具函数
 */

/**
 * 将数值限制在指定范围内
 * @param n 要限制的数值
 * @param a 最小值
 * @param b 最大值
 * @returns 限制后的数值
 */
export function clamp(n: number, a: number, b: number): number {
  return Math.max(a, Math.min(b, n));
}

/**
 * 根据概率返回随机布尔值
 * @param prob 概率（0-1之间）
 * @returns 是否命中概率
 */
export function randomChance(prob: number): boolean {
  return Math.random() < prob;
}
