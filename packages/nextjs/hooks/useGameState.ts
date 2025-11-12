/**
 * 游戏状态管理 Hook
 * 负责：
 * 1. 从后端获取游戏状态
 * 2. 定时刷新状态（10秒轮询）
 * 3. 提供手动刷新方法
 */
import { useCallback, useEffect, useRef, useState } from "react";
import { convertBackendStateToFrontend } from "~~/constants/idMapping";
import { getUserState } from "~~/services/api/userService";
import type { GameSave } from "~~/types";

const REFRESH_INTERVAL = 10000; // 10秒刷新一次

interface UseGameStateOptions {
  address?: string;
  enabled?: boolean;
  onSuccess?: (state: Partial<GameSave>) => void;
  onError?: (error: Error) => void;
}

export function useGameState(options: UseGameStateOptions = {}) {
  const { address, enabled = true, onSuccess, onError } = options;

  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);
  const refreshTimerRef = useRef<NodeJS.Timeout | null>(null);
  const lastFetchTimeRef = useRef<number>(0);

  // 使用 ref 保存回调，避免作为依赖项
  const onSuccessRef = useRef(onSuccess);
  const onErrorRef = useRef(onError);

  // 每次渲染时更新 ref
  useEffect(() => {
    onSuccessRef.current = onSuccess;
    onErrorRef.current = onError;
  }, [onSuccess, onError]);

  /**
   * 从后端获取游戏状态
   */
  const fetchGameState = useCallback(async (): Promise<Partial<GameSave> | null> => {
    if (!address || !enabled) {
      return null;
    }

    try {
      setIsLoading(true);
      setError(null);
      lastFetchTimeRef.current = Date.now();

      const backendState = await getUserState(address);
      const frontendState = convertBackendStateToFrontend(backendState);

      console.log("[useGameState] State fetched successfully", {
        plots: frontendState.plots?.length,
        coins: frontendState.coins,
      });

      // 调用成功回调（使用 ref）
      onSuccessRef.current?.(frontendState);

      return frontendState;
    } catch (err) {
      const error = err instanceof Error ? err : new Error("Unknown error");
      console.error("[useGameState] Error fetching state:", error);
      setError(error);
      onErrorRef.current?.(error);
      return null;
    } finally {
      setIsLoading(false);
    }
  }, [address, enabled]); // 移除 onSuccess 和 onError 依赖

  /**
   * 启动定时刷新
   */
  const startAutoRefresh = useCallback(() => {
    // 清除现有定时器
    if (refreshTimerRef.current) {
      clearInterval(refreshTimerRef.current);
    }

    if (!enabled) {
      return;
    }

    console.log("[useGameState] Starting auto-refresh (10s interval)");

    refreshTimerRef.current = setInterval(() => {
      const timeSinceLastFetch = Date.now() - lastFetchTimeRef.current;

      // 避免重复请求（如果上次请求时间小于5秒，跳过）
      if (timeSinceLastFetch < 5000) {
        console.log("[useGameState] Skipping refresh (too soon)");
        return;
      }

      fetchGameState();
    }, REFRESH_INTERVAL);
  }, [enabled, fetchGameState]);

  /**
   * 停止定时刷新
   */
  const stopAutoRefresh = useCallback(() => {
    if (refreshTimerRef.current) {
      console.log("[useGameState] Stopping auto-refresh");
      clearInterval(refreshTimerRef.current);
      refreshTimerRef.current = null;
    }
  }, []);

  /**
   * 手动刷新（用于操作后立即更新）
   */
  const refreshNow = useCallback(async () => {
    console.log("[useGameState] Manual refresh triggered");
    return await fetchGameState();
  }, [fetchGameState]);

  /**
   * 组件挂载时启动定时刷新，卸载时清理
   */
  useEffect(() => {
    console.log("[useGameState] useEffect triggered - enabled:", enabled, "address:", !!address);
    if (enabled && address) {
      startAutoRefresh();
    }

    return () => {
      stopAutoRefresh();
    };
  }, [address, enabled, startAutoRefresh, stopAutoRefresh]);

  return {
    fetchGameState,
    refreshNow,
    startAutoRefresh,
    stopAutoRefresh,
    isLoading,
    error,
  };
}
