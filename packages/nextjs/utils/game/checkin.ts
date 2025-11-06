/**
 * 签到相关工具函数
 */
import { getTodayDateStr, getYearMonthStr } from "./time";
import { DAILY_CHECKIN_REWARDS } from "~~/constants/rewards";

/**
 * 执行每日签到，返回奖励金币数
 * @returns 获得的金币数
 */
export function dailyCheckin(): number {
  const r = Math.random();
  let cumProb = 0;
  for (const reward of DAILY_CHECKIN_REWARDS) {
    cumProb += reward.prob;
    if (r <= cumProb) return reward.coins;
  }
  return DAILY_CHECKIN_REWARDS[0].coins; // fallback
}

/**
 * 检查今天是否已签到
 * @param checkinLastDate 上次签到日期
 * @returns 是否已签到
 */
export function hasCheckedInToday(checkinLastDate: string): boolean {
  return checkinLastDate === getTodayDateStr();
}

/**
 * 获取本月已签到天数
 * @param checkinRecords 签到记录
 * @returns 本月签到天数
 */
export function getCheckedDaysThisMonth(checkinRecords: Record<string, number[]>): number {
  const yearMonth = getYearMonthStr();
  return (checkinRecords[yearMonth] || []).length;
}
