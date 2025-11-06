/**
 * 宠物信息
 */
export interface Pet {
  id: string;
  name: string;
  emoji: string;
  price: number;
  coinsPerHour: number;
}

/**
 * 宠物拥有状态
 */
export type PetOwnership = Record<string, boolean>;
