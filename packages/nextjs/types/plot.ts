/**
 * 浇水需求
 */
export interface WaterRequirement {
  time: number;
  done: boolean;
  doneAt: number | null; // 实际完成时间戳
}

/**
 * 除草需求
 */
export interface WeedRequirement {
  time: number;
  done: boolean;
  doneAt: number | null; // 实际完成时间戳
}

/**
 * 地块信息（前端）
 * 直接使用后端返回的字段，移除本地计算字段
 */
export interface Plot {
  id: number;
  unlocked: boolean;
  seedId: string | null;
  plantedAt: number | null;
  fertilized: boolean;
  pausedDuration: number;
  pausedAt: number | null;
  // protectedUntil removed

  // 浇水/除草需求
  waterRequirements: WaterRequirement[];
  weedRequirements: WeedRequirement[];

  // 后端计算的状态（前端只读）
  pests: boolean; // 虫害状态
  lastPestCheckAt: number | null;
  matureAt: number | null; // 成熟时间
  witheredAt: number | null; // 枯萎时间
  stage: string | null; // 当前阶段：'seed'|'sprout'|'growing'|'ripe'|'wither'|'paused'|'empty'

  // 兼容字段（用于前端展示）
  needsWater?: boolean;
  hasWeeds?: boolean;
  progress?: number;
  isReady?: boolean;
}
