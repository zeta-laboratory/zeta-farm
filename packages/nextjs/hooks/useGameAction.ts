// 统一游戏操作 Hook
import { useState } from "react";
import { useFarmTreasury } from "./blockchain/useFarmTreasury";
import { useAccount } from "wagmi";
import { requestActionSignature } from "~~/services/api/actionService";
import type { UserStateResponse } from "~~/services/api/types";
import { getUserState } from "~~/services/api/userService";

export interface GameActionOptions {
  onSuccess?: (state: UserStateResponse) => void;
  onError?: (error: Error) => void;
  showToast?: (message: string) => void;
}

export function useGameAction(options?: GameActionOptions) {
  const { address, isConnected } = useAccount();
  const { recordAction, isPending: isContractPending } = useFarmTreasury();

  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  /**
   * 执行游戏操作的统一流程
   * @param actionType 操作类型
   * @param actionData 操作数据
   * @returns 更新后的用户状态
   */
  const execute = async (actionType: string, actionData: any): Promise<UserStateResponse> => {
    // 1. 检查钱包连接
    if (!isConnected || !address) {
      const error = new Error("Please connect your wallet first");
      setError(error);
      options?.onError?.(error);
      options?.showToast?.("Please connect your wallet first");
      throw error;
    }

    setIsLoading(true);
    setError(null);

    try {
      // 2. 请求后端签名
      options?.showToast?.("Requesting signature...");
      const signatureResponse = await requestActionSignature(address, actionType, actionData);

      // 3. 调用合约
      options?.showToast?.("Please confirm transaction in your wallet...");
      const txHash = await recordAction(
        actionType,
        Number(signatureResponse.timestamp), // 转换字符串为数字
        Number(signatureResponse.nonce), // 转换字符串为数字
        signatureResponse.signature,
      );

      // 4. 等待交易确认
      options?.showToast?.("Transaction confirmed! Processing...");
      console.log("Transaction hash:", txHash);

      // 等待几秒让后端处理事件
      await new Promise(resolve => setTimeout(resolve, 3000));

      // 5. 刷新用户状态
      options?.showToast?.("Refreshing game state...");
      const newState = await getUserState(address);

      // 6. 成功回调 - 让调用方更新界面状态
      options?.onSuccess?.(newState);
      options?.showToast?.("✅ Action completed!");

      return newState;
    } catch (err) {
      const error = err instanceof Error ? err : new Error("Unknown error");
      setError(error);
      options?.onError?.(error);
      options?.showToast?.(error.message);
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  return {
    execute,
    isLoading: isLoading || isContractPending,
    error,
    isConnected,
    address,
  };
}
