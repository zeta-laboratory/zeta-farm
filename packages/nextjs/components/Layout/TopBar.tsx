"use client";

import { useEffect, useState } from "react";
import { LEVELS } from "~~/constants";
import type { Language } from "~~/types";
import { clamp } from "~~/utils/game";

interface TopBarProps {
  coins: number;
  zeta: number;
  tickets: number;
  exp: number;
  level: number;
  onProtect: () => void;
  lang: Language;
  setLang: (lang: Language) => void;
  t: (key: string) => string;
}

export function TopBar({ coins, zeta, tickets, exp, level, onProtect, lang, setLang, t }: TopBarProps) {
  const nextLvl = clamp(level, 1, LEVELS.length);
  const curNeed = LEVELS[nextLvl - 1] ?? 0;
  const nextNeed = LEVELS[nextLvl] ?? LEVELS[LEVELS.length - 1];
  const prog = LEVELS[nextLvl] ? clamp((exp - curNeed) / (nextNeed - curNeed), 0, 1) : 1;

  // 计算升级所需经验
  const expNeeded = nextNeed > exp ? nextNeed - exp : 0;
  const isMaxLevel = level >= LEVELS.length;
  const [langMenuOpen, setLangMenuOpen] = useState(false);

  // 点击外部关闭下拉菜单
  useEffect(() => {
    if (!langMenuOpen) return;
    const handleClickOutside = (e: MouseEvent) => {
      if (!(e.target as HTMLElement).closest(".lang-menu-container")) {
        setLangMenuOpen(false);
      }
    };
    document.addEventListener("click", handleClickOutside);
    return () => document.removeEventListener("click", handleClickOutside);
  }, [langMenuOpen]);

  return (
    <div className="bg-white/80 backdrop-blur sticky top-0 z-50 shadow-sm border-b border-amber-200/50">
      <div className="max-w-6xl mx-auto px-3 py-2 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="text-2xl font-serif">ZETA Farm</div>
          <div className="relative lang-menu-container">
            <button
              className="text-sm text-slate-500 hidden md:block hover:text-slate-700 px-2 py-1 rounded"
              onClick={() => setLangMenuOpen(!langMenuOpen)}
            >
              {t("switchLanguage")}
            </button>
            {langMenuOpen && (
              <div
                className="absolute left-0 mt-1 w-32 bg-white border rounded-lg shadow-lg z-50"
                onClick={e => e.stopPropagation()}
              >
                <button
                  className={`w-full text-left px-3 py-2 text-sm hover:bg-slate-50 ${
                    lang === "zh" ? "bg-emerald-50" : ""
                  }`}
                  onClick={() => {
                    console.log("[TopBar] Switching to Chinese");
                    setLangMenuOpen(false);
                    setLang("zh");
                  }}
                >
                  中文
                </button>
                <button
                  className={`w-full text-left px-3 py-2 text-sm hover:bg-slate-50 ${
                    lang === "en" ? "bg-emerald-50" : ""
                  }`}
                  onClick={() => {
                    console.log("[TopBar] Switching to English");
                    setLangMenuOpen(false);
                    setLang("en");
                  }}
                >
                  English
                </button>
                <button
                  className={`w-full text-left px-3 py-2 text-sm hover:bg-slate-50 ${
                    lang === "ko" ? "bg-emerald-50" : ""
                  }`}
                  onClick={() => {
                    console.log("[TopBar] Switching to Korean");
                    setLangMenuOpen(false);
                    setLang("ko");
                  }}
                >
                  한국어
                </button>
              </div>
            )}
          </div>
        </div>
        <div className="flex items-center gap-2 sm:gap-3">
          <div className="px-2 sm:px-3 py-1 rounded-full bg-amber-100 border border-amber-200/80">
            💰 <b>{coins}</b>
          </div>
          <div className="px-2 sm:px-3 py-1 rounded-full bg-cyan-100 border border-cyan-200/80">
            Ζ <b>{zeta}</b>
          </div>
          <div className="px-2 sm:px-3 py-1 rounded-full bg-pink-100 border border-pink-200/80">
            🎟️ <b>{tickets}</b>
          </div>
          <div className="px-2 sm:px-3 py-1 rounded-full bg-indigo-100 border border-indigo-200/80">
            ⭐ <b>{exp}</b>
          </div>
          <div className="relative group">
            <div className="px-2 sm:px-3 py-1 rounded-full bg-emerald-100 border border-emerald-200/80">
              🎖️ {t("level")}
              <b>{level}</b>
            </div>
            {!isMaxLevel && (
              <div className="pointer-events-none absolute z-10 hidden group-hover:block right-0 mt-2 w-48 p-2 rounded-lg border bg-white shadow-lg text-center">
                <div className="text-sm text-slate-700">
                  {t("levelUpTo")} {level + 1}
                </div>
                <div className="text-xs text-slate-500 mt-1">
                  {t("expNeeded")}：<b>{expNeeded}</b>
                </div>
              </div>
            )}
          </div>
          <button
            className="px-3 py-1 rounded-full bg-rose-100 border border-rose-200/80 hover:bg-rose-200"
            onClick={onProtect}
          >
            🛡️ {t("protect30min")}
          </button>
        </div>
      </div>
      <div className="h-1 bg-amber-200/40">
        <div className="h-full bg-emerald-500" style={{ width: `${prog * 100}%` }} />
      </div>
    </div>
  );
}
