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
  success: boolean;
  data: {
    address: string;
    coins: number;
    zeta: number;
    tickets: number;
    exp: number;
    level: number;
    plots: Plot[];
    inventory: Record<string, number>;
    fruits: Record<string, number>;
    fertilizer: number;
    pets: Record<string, boolean>;
    robotSubscribed: boolean;
    checkinLastDate: string;
    checkinRecords: Record<string, number[]>;
    collectedLetters: Record<string, number>;
    redeemedRewards: string[];
    protectedUntil: number;
  };
  message?: string;
}

export interface Plot {
  id: number;
  unlocked: boolean;
  seedId: string | null;
  plantedAt: number | null;
  pausedDuration: number;
  waterRequirements: WaterRequirement[];
  weedRequirements: WeedRequirement[];
  weeds: boolean;
  pests: boolean;
  protectedUntil: number;
  fertilized: boolean;
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
