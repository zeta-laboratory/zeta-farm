/**
 * 作物需求相关工具函数（浇水、除草）
 */

/**
 * 根据作物等级获取浇水次数
 * @param levelReq 作物所需等级
 * @returns 浇水次数
 */
export function getWateringCount(levelReq: number): number {
  // 按照表格：1-3级:1次, 4-6级:2次, 7-9级:3次, 10-12级:4次, 13级:4次, 14-15级:5次, 16-18级:5次
  if (levelReq <= 3) return 1;
  if (levelReq <= 6) return 2;
  if (levelReq <= 9) return 3;
  if (levelReq <= 12) return 4;
  if (levelReq === 13) return 4;
  if (levelReq <= 15) return 5;
  return 5; // 16-18
}

/**
 * 根据作物等级获取除草次数
 * @param levelReq 作物所需等级
 * @returns 除草次数
 */
export function getWeedingCount(levelReq: number): number {
  // 按照表格：1-3级:0次, 4-6级:1次, 7-9级:2次, 10-12级:3次, 13级:4次, 14-15级:4次, 16-18级:5次
  if (levelReq <= 3) return 0;
  if (levelReq <= 6) return 1;
  if (levelReq <= 9) return 2;
  if (levelReq <= 12) return 3;
  if (levelReq === 13) return 4;
  if (levelReq <= 15) return 4;
  if (levelReq <= 18) return 5;
  return 5;
}
