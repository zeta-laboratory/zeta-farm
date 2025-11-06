/**
 * UI 相关工具函数
 */

/**
 * 根据工具类型生成鼠标指针样式
 * @param tool 工具类型
 * @returns CSS cursor 值
 */
export function cursorForTool(tool: string): string {
  const map: Record<string, string> = {
    plant: "🌱",
    harvest: "🧺",
    water: "💧",
    weed: "🌿",
    pesticide: "🪲",
    shovel: "🪓",
  };
  const emoji = map[tool] || "";
  if (!emoji) return "auto";
  const svg = encodeURIComponent(
    `<svg xmlns='http://www.w3.org/2000/svg' width='32' height='32'><text x='0' y='24' font-size='24'>${emoji}</text></svg>`,
  );
  return `url("data:image/svg+xml;utf8,${svg}") 4 24, auto`;
}

/**
 * 生成黄土地纹理样式
 * @returns CSS 样式对象
 */
export function soilTextureStyle() {
  const baseGrad = `linear-gradient(to bottom, #d1a672, #c7924f)`; // 棕黄到土黄
  const noise1 = `radial-gradient(1px 1px at 10px 10px, rgba(80,50,20,0.08) 1px, transparent 1px)`;
  const noise2 = `radial-gradient(1px 1px at 20px 18px, rgba(80,50,20,0.06) 1px, transparent 1px)`;
  const noise3 = `radial-gradient(1px 1px at 15px 25px, rgba(80,50,20,0.05) 1px, transparent 1px)`;
  return {
    backgroundImage: `${baseGrad}, ${noise1}, ${noise2}, ${noise3}`,
    backgroundSize: `100% 100%, 22px 22px, 28px 28px, 26px 26px`,
    backgroundBlendMode: "multiply" as const,
    borderColor: "#b07a3d",
  };
}
