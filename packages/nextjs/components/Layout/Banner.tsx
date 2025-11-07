"use client";

interface BannerProps {
  t: (key: string) => string;
}

export function Banner({ t }: BannerProps) {
  return (
    <div
      className="text-white py-2 text-center relative overflow-hidden"
      style={{
        background: "linear-gradient(135deg, #065f46 0%, #047857 25%, #059669 50%, #047857 75%, #065f46 100%)",
        backgroundSize: "200% 200%",
        animation: "gradientShift 3s ease infinite",
      }}
    >
      <style>{`
        @keyframes gradientShift {
          0%, 100% { background-position: 0% 50%; }
          50% { background-position: 100% 50%; }
        }
      `}</style>
      <div className="max-w-6xl mx-auto px-3 text-sm font-medium relative z-10">{t("seasonText")}</div>
      <audio id="bgMusic" loop preload="auto">
        <source src="/music/bg.mp3" type="audio/mpeg" />
      </audio>
    </div>
  );
}
