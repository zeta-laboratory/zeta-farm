/**
 * 前后端 ID 映射
 *
 * 后端使用: seed_0, seed_1, seed_2, ... 和 fruit_0, fruit_1, fruit_2, ...
 * 前端使用: radish, strawberry, corn, ... (作物名称)
 */

/**
 * 后端 ID -> 前端 ID 映射
 */
export const BACKEND_TO_FRONTEND_SEED: Record<string, string> = {
  seed_0: "radish", // 白萝卜
  seed_1: "strawberry", // 草莓
  seed_2: "corn", // 玉米
  seed_3: "grape", // 葡萄
  seed_4: "watermelon", // 西瓜
  seed_5: "pumpkin", // 南瓜
  seed_6: "tomato", // 番茄
  seed_7: "eggplant", // 茄子
  seed_8: "cabbage", // 白菜
  seed_9: "potato", // 土豆
  seed_10: "carrot", // 胡萝卜
  seed_11: "broccoli", // 西兰花
  seed_12: "lettuce", // 生菜
  seed_13: "onion", // 洋葱
  seed_14: "garlic", // 大蒜
  seed_15: "pepper", // 辣椒
  seed_16: "cucumber", // 黄瓜
  seed_17: "pea", // 豌豆
};

/**
 * 前端 ID -> 后端 ID 映射
 */
export const FRONTEND_TO_BACKEND_SEED: Record<string, string> = {
  radish: "seed_0",
  strawberry: "seed_1",
  corn: "seed_2",
  grape: "seed_3",
  watermelon: "seed_4",
  pumpkin: "seed_5",
  tomato: "seed_6",
  eggplant: "seed_7",
  cabbage: "seed_8",
  potato: "seed_9",
  carrot: "seed_10",
  broccoli: "seed_11",
  lettuce: "seed_12",
  onion: "seed_13",
  garlic: "seed_14",
  pepper: "seed_15",
  cucumber: "seed_16",
  pea: "seed_17",
};

/**
 * 后端果实 ID -> 前端作物 ID 映射
 */
export const BACKEND_TO_FRONTEND_FRUIT: Record<string, string> = {
  fruit_0: "radish",
  fruit_1: "strawberry",
  fruit_2: "corn",
  fruit_3: "grape",
  fruit_4: "watermelon",
  fruit_5: "pumpkin",
  fruit_6: "tomato",
  fruit_7: "eggplant",
  fruit_8: "cabbage",
  fruit_9: "potato",
  fruit_10: "carrot",
  fruit_11: "broccoli",
  fruit_12: "lettuce",
  fruit_13: "onion",
  fruit_14: "garlic",
  fruit_15: "pepper",
  fruit_16: "cucumber",
  fruit_17: "pea",
};

/**
 * 前端作物 ID -> 后端果实 ID 映射
 */
export const FRONTEND_TO_BACKEND_FRUIT: Record<string, string> = {
  radish: "fruit_0",
  strawberry: "fruit_1",
  corn: "fruit_2",
  grape: "fruit_3",
  watermelon: "fruit_4",
  pumpkin: "fruit_5",
  tomato: "fruit_6",
  eggplant: "fruit_7",
  cabbage: "fruit_8",
  potato: "fruit_9",
  carrot: "fruit_10",
  broccoli: "fruit_11",
  lettuce: "fruit_12",
  onion: "fruit_13",
  garlic: "fruit_14",
  pepper: "fruit_15",
  cucumber: "fruit_16",
  pea: "fruit_17",
};

/**
 * 将后端种子 ID 转换为前端 ID
 */
export function backendSeedToFrontend(backendId: string): string {
  return BACKEND_TO_FRONTEND_SEED[backendId] || backendId;
}

/**
 * 将前端种子 ID 转换为后端 ID
 */
export function frontendSeedToBackend(frontendId: string): string {
  return FRONTEND_TO_BACKEND_SEED[frontendId] || frontendId;
}

/**
 * 将后端果实 ID 转换为前端 ID
 */
export function backendFruitToFrontend(backendId: string): string {
  return BACKEND_TO_FRONTEND_FRUIT[backendId] || backendId;
}

/**
 * 将前端作物 ID 转换为后端果实 ID
 */
export function frontendFruitToBackend(frontendId: string): string {
  return FRONTEND_TO_BACKEND_FRUIT[frontendId] || frontendId;
}

/**
 * 转换后端 inventory (seeds) 为前端格式
 */
export function convertBackendInventoryToFrontend(backendInventory: Record<string, number>): Record<string, number> {
  const result: Record<string, number> = {};
  for (const [backendId, count] of Object.entries(backendInventory)) {
    const frontendId = backendSeedToFrontend(backendId);
    result[frontendId] = count;
  }
  return result;
}

/**
 * 转换后端 fruits 为前端格式
 */
export function convertBackendFruitsToFrontend(backendFruits: Record<string, number>): Record<string, number> {
  const result: Record<string, number> = {};
  for (const [backendId, count] of Object.entries(backendFruits)) {
    const frontendId = backendFruitToFrontend(backendId);
    result[frontendId] = count;
  }
  return result;
}

/**
 * 转换完整的后端用户状态为前端格式
 */
export function convertBackendStateToFrontend(backendData: any): any {
  // 分离 backpack 中的 seeds 和 fruits
  const seeds: Record<string, number> = {};
  const fruits: Record<string, number> = {};
  let fertilizer = 0;

  if (backendData.backpack) {
    for (const [key, value] of Object.entries(backendData.backpack)) {
      if (key.startsWith("seed_")) {
        // 转换 seed_0 -> radish
        const frontendId = backendSeedToFrontend(key);
        seeds[frontendId] = value as number;
      } else if (key.startsWith("fruit_")) {
        // 转换 fruit_0 -> radish
        const frontendId = backendFruitToFrontend(key);
        fruits[frontendId] = value as number;
      } else if (key === "fertilizer") {
        fertilizer = value as number;
      }
    }
  }

  return {
    coins: backendData.coins || 0,
    zeta: backendData.zeta || 0,
    tickets: backendData.tickets || 0,
    exp: backendData.exp || 0,

    // 地块列表：plots_list -> plots，并转换 seedId
    plots: (backendData.plots_list || []).map((plot: any) => ({
      id: plot.plot_index,
      unlocked: plot.unlocked || false,
      seedId: plot.seedId ? backendSeedToFrontend(plot.seedId) : null,
      plantedAt: plot.plantedAt || null,
      pausedDuration: plot.pausedDuration || 0,
      pausedAt: plot.pausedAt || null,
      waterRequirements: plot.waterRequirements || [],
      weedRequirements: plot.weedRequirements || [],
      weeds: plot.status?.hasWeeds || false,
      pests: plot.status?.hasPests || false,
      protectedUntil: plot.protectedUntil || 0,
      fertilized: plot.fertilized || false,
    })),

    // 背包：从扁平结构分离为 seeds 和 fruits
    inventory: seeds,
    fruits: fruits,
    fertilizer: fertilizer,

    // 宠物列表：pet_list -> pets
    pets: (backendData.pet_list || []).reduce((acc: Record<string, boolean>, petId: string) => {
      acc[petId] = true;
      return acc;
    }, {}),

    // 签到相关
    checkinLastDate: backendData.last_checkin_date || "",

    // 字母收集
    collectedLetters: backendData.phrase_letters || {},

    // 已兑换奖励
    redeemedRewards: backendData.redeemed_rewards || [],

    // 其他状态
    lastLogin: Math.floor(Date.now() / 1000),
  };
}
