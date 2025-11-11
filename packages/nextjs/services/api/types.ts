// API 类型定义

export interface SignatureResponse {
  success: boolean;
  signature: string;
  timestamp: number;
  deadline: number;
  nonce: number;
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
  protectedUntil: number;
  status?: {
    stage: string;
    needsWater: boolean;
    hasWeeds: boolean;
    hasPests: boolean;
    effectiveElapsedTime: number;
    progress: number;
    isReady: boolean;
  };
}

export interface WaterRequirement {
  time: number;
  done: boolean;
}

export interface WeedRequirement {
  time: number;
  done: boolean;
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
