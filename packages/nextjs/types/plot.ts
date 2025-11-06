/**
 * 浇水需求
 */
export interface WaterRequirement {
  time: number;
  done: boolean;
}

/**
 * 除草需求
 */
export interface WeedRequirement {
  time: number;
  done: boolean;
}

/**
 * 地块信息
 */
export interface Plot {
  id: number;
  unlocked: boolean;
  seedId: string | null;
  plantedAt: number | null;
  fertilized: boolean;
  wateredAt: number | null;
  weeds: boolean;
  pests: boolean;
  waterRequirements: WaterRequirement[];
  weedRequirements: WeedRequirement[];
  pausedDuration: number;
  pausedAt?: number | null;
  protectedUntil: number;
}
