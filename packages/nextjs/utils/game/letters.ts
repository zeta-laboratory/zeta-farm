/**
 * 字母收集相关工具函数
 */
import { LETTER_COLLECTION_PHRASES } from "~~/constants/rewards";

/**
 * 获取所有需要的字母（去重）
 * @returns 字母数组
 */
export function getAllRequiredLetters(): string[] {
  const allLetters = new Set<string>();
  LETTER_COLLECTION_PHRASES.forEach(phrase => {
    phrase.split("").forEach(letter => {
      if (/[A-Za-z]/.test(letter)) allLetters.add(letter.toUpperCase());
    });
  });
  return Array.from(allLetters).sort();
}
