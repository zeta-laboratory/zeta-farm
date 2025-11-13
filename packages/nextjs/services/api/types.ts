// API 类型定义

export interface SignatureResponse {
  success: boolean;
  signature: string;
  timestamp: string; // 操作数据（字符串格式，使用时需转换）
  nonce: string; // 用户 nonce（字符串格式，使用时需转换）
  actionType?: string; // 操作类型
  data?: string; // 操作数据（字符串格式）
  user?: string; // 用户地址
  message?: string;
}

export interface UserStateResponse {
  wallet_address: string;
  zeta: number;
  tickets: number;
  coins: number;
  exp: number;
  level: number;
  pet_list: string[];
  lastOfflineClaimAt: Date;
  last_checkin_date: string;
  backpack: {
    seeds: Record<string, number>;
    fruits: Record<string, number>;
    fertilizer: number;
  };
  phrase_letters: Record<string, number>;
  redeemed_rewards: string[];
  plots_list: BackendPlot[];
  createdAt: Date;
  updatedAt: Date;
  _meta?: {
    serverTime: number;
    offlineEarnings: number;
    timestamp: string;
  };
}

export interface BackendPlot {
  plot_index: number;
  unlocked: boolean;
  seedId: string | null;
  plantedAt: number | null;
  pausedDuration: number;
  pausedAt: number | null;
  waterRequirements: WaterRequirement[];
  weedRequirements: WeedRequirement[];
  fertilized: boolean;
  protectedUntil: number | null;

  // 后端新增字段
  pests: boolean;
  lastPestCheckAt: number | null;
  matureAt: number | null;
  witheredAt: number | null;
  stage: string | null;

  // 兼容字段（后端返回的计算结果）
  needsWater?: boolean;
  hasWeeds?: boolean;
  progress?: number;
  isReady?: boolean;
}

export interface WaterRequirement {
  time: number;
  done: boolean;
  doneAt?: number | null; // 实际完成时间戳
}

export interface WeedRequirement {
  time: number;
  done: boolean;
  doneAt?: number | null; // 实际完成时间戳
}

export interface ActionRequest {
  address: string;
  actionType: string;
  data: any;
}

export interface CheckinResponse {
  success: boolean;
  coins: number;
  message?: string;
}

export interface ApiError {
  success: false;
  message: string;
  code?: string;
}
