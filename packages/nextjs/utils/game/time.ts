/**
 * 时间相关工具函数
 */

/**
 * 获取当前时间戳（秒）
 */
export function now(): number {
  return Math.floor(Date.now() / 1000);
}

/**
 * 格式化时间显示
 * @param sec 秒数
 * @returns 格式化的时间字符串
 */
export function fmtTime(sec: number): string {
  if (sec <= 0) return "0秒";
  const m = Math.floor(sec / 60);
  const s = sec % 60;
  if (m > 0 && s > 0) return `${m}分${s}秒`;
  if (m > 0) return `${m}分`;
  return `${s}秒`;
}

/**
 * 获取今天的日期字符串（YYYY-MM-DD）
 */
export function getTodayDateStr(): string {
  const today = new Date();
  return `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, "0")}-${String(today.getDate()).padStart(2, "0")}`;
}

/**
 * 获取年月字符串（YYYY-MM）
 */
export function getYearMonthStr(date = new Date()): string {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}`;
}

/**
 * 获取指定年月的天数
 */
export function getAllDaysInMonth(year: number, month: number): number {
  return new Date(year, month + 1, 0).getDate();
}
