import { Pet } from "~~/types/pet";

/**
 * 宠物配置
 * 设计理念：100天回本
 * 计算公式：coinsPerHour = price / (100 * 24)
 */
export const PETS: Pet[] = [
  {
    id: "cat",
    name: "猫咪",
    emoji: "🐱",
    price: 100,
    coinsPerHour: 0.041667, // 每小时0.0417，日收益约1金币，100天ROI 100%
  },
  {
    id: "dog",
    name: "小狗",
    emoji: "🐶",
    price: 500,
    coinsPerHour: 0.208333, // 每小时0.2083，日收益约5金币，100天ROI 100%
  },
  {
    id: "bunny",
    name: "兔子",
    emoji: "🐰",
    price: 2500,
    coinsPerHour: 1.041667, // 每小时1.0417，日收益约25金币，100天ROI 100%
  },
  {
    id: "bird",
    name: "小鸟",
    emoji: "🐦",
    price: 10000,
    coinsPerHour: 4.166667, // 每小时4.1667，日收益约100金币，100天ROI 100%
  },
  {
    id: "dragon",
    name: "龙",
    emoji: "🐉",
    price: 50000,
    coinsPerHour: 20.833333, // 每小时20.8333，日收益约500金币，100天ROI 100%
  },
];
