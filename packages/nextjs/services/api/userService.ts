// 用户状态服务
import { apiGet, apiPost } from "./client";
import type { CheckinResponse, UserStateResponse } from "./types";

/**
 * 获取用户游戏状态
 * @param address 用户钱包地址
 * @returns 用户状态数据
 */
export async function getUserState(address: string): Promise<UserStateResponse> {
  const response = await apiGet<UserStateResponse>(`/api/user/state?address=${address}`);

  if (!response.success) {
    throw new Error(response.message || "Failed to get user state");
  }

  return response;
}

/**
 * 每日签到
 * @param address 用户钱包地址
 * @returns 签到响应
 */
export async function dailyCheckin(address: string): Promise<CheckinResponse> {
  const response = await apiPost<CheckinResponse>("/api/checkin", { address });

  if (!response.success) {
    throw new Error(response.message || "Checkin failed");
  }

  return response;
}

/**
 * 购买宠物
 * @param address 用户钱包地址
 * @param petId 宠物 ID
 * @returns 购买结果
 */
export async function buyPet(address: string, petId: string): Promise<{ success: boolean; message?: string }> {
  const response = await apiPost<{ success: boolean; message?: string }>("/api/pet/buy", {
    address,
    petId,
  });

  if (!response.success) {
    throw new Error(response.message || "Failed to buy pet");
  }

  return response;
}

/**
 * 解锁地块
 * @param address 用户钱包地址
 * @param plotId 地块 ID
 * @returns 解锁结果
 */
export async function unlockPlot(address: string, plotId: number): Promise<{ success: boolean; message?: string }> {
  const response = await apiPost<{ success: boolean; message?: string }>("/api/plot/unlock", {
    address,
    plotId,
  });

  if (!response.success) {
    throw new Error(response.message || "Failed to unlock plot");
  }

  return response;
}

/**
 * 商店购买
 * @param address 用户钱包地址
 * @param itemType 物品类型
 * @param itemId 物品 ID
 * @param amount 数量
 * @returns 购买结果
 */
export async function shopBuy(
  address: string,
  itemType: string,
  itemId: string,
  amount: number,
): Promise<{ success: boolean; message?: string }> {
  const response = await apiPost<{ success: boolean; message?: string }>("/api/shop/buy", {
    address,
    itemType,
    itemId,
    amount,
  });

  if (!response.success) {
    throw new Error(response.message || "Failed to buy item");
  }

  return response;
}
