/**
 * 种子/作物信息
 */
interface Seed {
  id: string;
  name: string;
  cost: number;
  sell: number;
  exp: number;
  stages: [number, number, number];
  witherAfter: number;
  emoji: string;
  levelReq: number;
}

/**
 * 种子集合类型
 */
export type SeedCollection = Record<string, Seed>;
