"use client";

export function AutumnBackground() {
  // 使用内联 style 注入关键帧，避免外部依赖
  return (
    <div className="absolute inset-0 -z-10 overflow-hidden">
      <style>{`
        @keyframes cloudMove { 0%{transform:translateX(-20%)} 100%{transform:translateX(120%)} }
        @keyframes leafFall { 0%{ transform:translateY(-10%) rotate(0deg); opacity:0 } 10%{opacity:1} 100%{ transform:translateY(120%) rotate(360deg); opacity:0 } }
        @keyframes toastFadeIn { 0%{opacity:0; transform:translateY(20px)} 100%{opacity:1; transform:translateY(0)} }
        @keyframes toastFadeOut { 0%{opacity:1; transform:translateY(0)} 100%{opacity:0; transform:translateY(-20px)} }
        @keyframes toastShine { 0%{background-position:200% 0} 100%{background-position:-200% 0} }
      `}</style>
      {/* 天空渐变 */}
      <div className="absolute inset-0 bg-gradient-to-b from-amber-100 via-amber-50 to-emerald-50" />
      {/* 远山/田野色带 */}
      <div className="absolute bottom-0 left-0 right-0 h-40 bg-gradient-to-t from-amber-200/60 to-transparent" />
      {/* 移动云层 */}
      <div
        className="absolute top-10 left-0 right-0 h-20 opacity-60"
        style={{ animation: "cloudMove 60s linear infinite" }}
      >
        <div className="mx-auto max-w-6xl h-full bg-white/40 blur-2xl rounded-full" />
      </div>
      {/* 飘落树叶（几层不同时长） */}
      {Array.from({ length: 12 }).map((_, i) => (
        <div
          key={i}
          className="absolute text-2xl"
          style={{
            left: `${Math.random() * 100}%`,
            animation: `leafFall ${20 + Math.random() * 15}s linear ${Math.random() * 5}s infinite`,
          }}
        >
          {["🍂", "🍁", "�"][i % 3]}
        </div>
      ))}
    </div>
  );
}
