import type { SeedCollection } from "~~/types/seed";

/**
 * 18 种作物配置（时间单位：秒）
 * 按照新经济模型调整：成本/售价/经验/时间
 */
export const SEEDS: SeedCollection = {
  // 等级 1 - 白萝卜
  radish: {
    id: "radish",
    name: "白萝卜",
    cost: 6,
    sell: 12,
    exp: 3,
    stages: [25, 50, 75], // 总共 75秒 (1.25分钟)
    witherAfter: 60,
    emoji: "🥕",
    levelReq: 1,
  },

  // 等级 2 - 草莓
  strawberry: {
    id: "strawberry",
    name: "草莓",
    cost: 8,
    sell: 18,
    exp: 8,
    stages: [50, 100, 150], // 总共 150秒 (2.5分钟)
    witherAfter: 120,
    emoji: "🍓",
    levelReq: 2,
  },

  // 等级 3 - 玉米
  corn: {
    id: "corn",
    name: "玉米",
    cost: 10,
    sell: 25,
    exp: 13,
    stages: [100, 200, 300], // 总共 300秒 (5分钟)
    witherAfter: 180,
    emoji: "🌽",
    levelReq: 3,
  },

  // 等级 4 - 葡萄
  grape: {
    id: "grape",
    name: "葡萄",
    cost: 18,
    sell: 50,
    exp: 23,
    stages: [200, 400, 600], // 总共 600秒 (10分钟)
    witherAfter: 300,
    emoji: "🍇",
    levelReq: 4,
  },

  // 等级 5 - 番茄
  tomato: {
    id: "tomato",
    name: "番茄",
    cost: 22,
    sell: 70,
    exp: 28,
    stages: [400, 800, 1200], // 总共 1200秒 (20分钟)
    witherAfter: 480,
    emoji: "🍅",
    levelReq: 5,
  },

  // 等级 6 - 蓝莓
  blueberry: {
    id: "blueberry",
    name: "蓝莓",
    cost: 30,
    sell: 108,
    exp: 38,
    stages: [525, 1050, 1575], // 总共 1575秒 (26.25分钟)
    witherAfter: 600,
    emoji: "🫐",
    levelReq: 6,
  },

  // 等级 7 - 南瓜
  pumpkin: {
    id: "pumpkin",
    name: "南瓜",
    cost: 42,
    sell: 168,
    exp: 53,
    stages: [1050, 2100, 3150], // 总共 3150秒 (52.5分钟)
    witherAfter: 900,
    emoji: "🎃",
    levelReq: 7,
  },

  // 等级 8 - 菠萝
  pineapple: {
    id: "pineapple",
    name: "菠萝",
    cost: 58,
    sell: 255,
    exp: 73,
    stages: [2100, 4200, 6300], // 总共 6300秒 (105分钟)
    witherAfter: 1200,
    emoji: "🍍",
    levelReq: 8,
  },

  // 等级 9 - 咖啡豆
  coffee: {
    id: "coffee",
    name: "咖啡豆",
    cost: 80,
    sell: 384,
    exp: 80,
    stages: [4200, 8400, 12600], // 总共 12600秒 (210分钟)
    witherAfter: 1800,
    emoji: "☕",
    levelReq: 9,
  },

  // 等级 10 - 可可豆
  cocoa: {
    id: "cocoa",
    name: "可可豆",
    cost: 110,
    sell: 583,
    exp: 110,
    stages: [7200, 14400, 21600], // 总共 21600秒 (360分钟)
    witherAfter: 2400,
    emoji: "🍫",
    levelReq: 10,
  },

  // 等级 11 - 茶叶
  tea: {
    id: "tea",
    name: "茶叶",
    cost: 140,
    sell: 812,
    exp: 140,
    stages: [10800, 21600, 32400], // 总共 32400秒 (540分钟)
    witherAfter: 2700,
    emoji: "🍵",
    levelReq: 11,
  },

  // 等级 12 - 辣椒
  chili: {
    id: "chili",
    name: "辣椒",
    cost: 160,
    sell: 1008,
    exp: 160,
    stages: [14400, 28800, 43200], // 总共 43200秒 (720分钟)
    witherAfter: 3000,
    emoji: "🌶️",
    levelReq: 12,
  },

  // 等级 13 - 水稻
  rice: {
    id: "rice",
    name: "水稻",
    cost: 190,
    sell: 1292,
    exp: 190,
    stages: [21600, 43200, 64800], // 总共 64800秒 (1080分钟)
    witherAfter: 3300,
    emoji: "🍚",
    levelReq: 13,
  },

  // 等级 14 - 小麦
  wheat: {
    id: "wheat",
    name: "小麦",
    cost: 220,
    sell: 1628,
    exp: 220,
    stages: [24960, 49920, 74880], // 总共 74880秒 (1248分钟)
    witherAfter: 3480,
    emoji: "🌾",
    levelReq: 14,
  },

  // 等级 15 - 桃子
  peach: {
    id: "peach",
    name: "桃子",
    cost: 260,
    sell: 2054,
    exp: 260,
    stages: [28080, 56160, 112320], // 总共 112320秒 (1872分钟)
    witherAfter: 3540,
    emoji: "🍑",
    levelReq: 15,
  },

  // 等级 16 - 梨子
  pear: {
    id: "pear",
    name: "梨子",
    cost: 300,
    sell: 2520,
    exp: 300,
    stages: [56160, 112320, 168480], // 总共 168480秒 (2808分钟)
    witherAfter: 3570,
    emoji: "🍐",
    levelReq: 16,
  },

  // 等级 17 - 芒果
  mango: {
    id: "mango",
    name: "芒果",
    cost: 360,
    sell: 3132,
    exp: 360,
    stages: [72000, 144000, 216000], // 总共 216000秒 (3600分钟)
    witherAfter: 3590,
    emoji: "🥭",
    levelReq: 17,
  },

  // 等级 18 - 樱桃
  cherry: {
    id: "cherry",
    name: "樱桃",
    cost: 420,
    sell: 3780,
    exp: 420,
    stages: [108000, 216000, 324000], // 总共 324000秒 (5400分钟)
    witherAfter: 3600,
    emoji: "🍒",
    levelReq: 18,
  },
};
