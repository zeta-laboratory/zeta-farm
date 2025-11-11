// FarmTreasury 合约交互 Hook
import { parseEther } from "viem";
import { useScaffoldWriteContract } from "~~/hooks/scaffold-eth";

export function useFarmTreasury() {
  const { writeContractAsync, isPending } = useScaffoldWriteContract("FarmTreasury");

  /**
   * 记录操作并支付手续费
   * @param actionType 操作类型
   * @param data 操作数据 (uint256)
   * @param nonce 随机数
   * @param signature 签名
   * @returns 交易哈希
   */
  const recordAction = async (actionType: string, data: number, nonce: number, signature: string) => {
    try {
      const result = await writeContractAsync({
        functionName: "recordActionWithSignature",
        args: [actionType, BigInt(data), BigInt(nonce), signature as `0x${string}`],
        value: parseEther("0.0001"), // ACTION_FEE
      });

      return result;
    } catch (error) {
      console.error("Record action failed:", error);
      throw error;
    }
  };

  return {
    recordAction,
    isPending,
  };
}
