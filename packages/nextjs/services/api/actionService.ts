// 操作签名服务
import { apiPost } from "./client";
import type { ActionRequest, SignatureResponse } from "./types";
import { frontendFruitToBackend, frontendSeedToBackend } from "~~/constants/idMapping";

/**
 * 转换前端操作数据为后端格式
 */
function convertActionDataToBackend(actionType: string, data: any): any {
  switch (actionType) {
    case "plant":
      // 转换 seedId: "strawberry" -> "seed_1"
      return {
        ...data,
        seedId: data.seedId ? frontendSeedToBackend(data.seedId) : data.seedId,
      };

    case "buySeed":
      // 转换 seedId
      return {
        ...data,
        seedId: data.seedId ? frontendSeedToBackend(data.seedId) : data.seedId,
      };

    case "sellFruit":
      // 转换 fruitId: "strawberry" -> "fruit_1"
      return {
        ...data,
        fruitId: data.fruitId ? frontendFruitToBackend(data.fruitId) : data.fruitId,
      };

    default:
      // 其他操作不需要转换
      return data;
  }
}

/**
 * 请求操作签名
 * @param address 用户钱包地址
 * @param actionType 操作类型 (plant, water, harvest, etc.)
 * @param data 操作数据
 * @returns 签名响应
 */
export async function requestActionSignature(
  address: string,
  actionType: string,
  data: any,
): Promise<SignatureResponse> {
  // 转换前端数据为后端格式
  const backendData = convertActionDataToBackend(actionType, data);

  const requestData: ActionRequest = {
    address,
    actionType,
    data: backendData,
  };

  const response = await apiPost<SignatureResponse>("/api/actions/request-action-voucher", requestData, {
    headers: {
      Authorization: `Bearer ${address}`,
    },
  });

  if (!response.success) {
    throw new Error(response.message || "Failed to get action signature");
  }

  return response;
}

/**
 * 操作类型枚举
 */
export const ActionTypes = {
  // 地块操作
  PLANT: "plant",
  WATER: "water",
  WEED: "weed",
  HARVEST: "harvest",
  FERTILIZE: "fertilize",
  PESTICIDE: "pesticide",
  SHOVEL: "shovel",
  UNLOCK_PLOT: "unlock_plot",

  // 商店操作
  BUY_SEED: "buy_seed",
  BUY_FERTILIZER: "buy_fertilizer",
  SELL_FRUIT: "sell_fruit",

  // 其他操作
  CHECKIN: "checkin",
  BUY_PET: "buy_pet",
  EXCHANGE: "exchange",
  DRAW: "draw",
  LETTER_EXCHANGE: "letter_exchange",
  ROBOT_SUBSCRIBE: "robot_subscribe",
} as const;

export type ActionType = (typeof ActionTypes)[keyof typeof ActionTypes];
