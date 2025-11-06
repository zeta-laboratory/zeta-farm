/**
 * 奖励信息
 */
export interface Reward {
  id: string;
  name: string;
  emoji: string;
  token: string;
}

/**
 * 抽奖奖励类型
 */
export interface DrawReward {
  type: "seed";
  id: string;
  qty: number;
}

/**
 * 签到奖励配置
 */
export interface CheckinReward {
  coins: number;
  prob: number;
}
