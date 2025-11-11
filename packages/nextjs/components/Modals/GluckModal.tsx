"use client";

import { useState } from "react";
import { I18N } from "~~/constants/i18n";
import { clamp } from "~~/utils/game";

interface GluckModalProps {
  open: boolean;
  onClose: () => void;
  onDraw: (count: number) => void;
  tickets: number;
  language: string;
}

export function GluckModal({ open, onClose, onDraw, tickets, language }: GluckModalProps) {
  const t = (key: string): string => {
    const langData = I18N[language as keyof typeof I18N];
    return (langData?.[key as keyof typeof langData] as string) || I18N.zh[key as keyof typeof I18N.zh] || key;
  };

  const [count, setCount] = useState(1);
  if (!open) return null;
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
      <div className="bg-white w-[min(560px,95vw)] rounded-2xl border shadow-lg p-4">
        <div className="flex items-center justify-between mb-2">
          <div className="font-semibold text-lg">{t("gluck")}</div>
          <button onClick={onClose} className="text-slate-500 hover:text-slate-700">
            ✖
          </button>
        </div>
        <div
          className="text-sm text-slate-600 mb-3"
          dangerouslySetInnerHTML={{ __html: t("gluckDesc") + "：<b>" + tickets + "</b>" }}
        />
        <div className="flex items-center gap-2 mb-3">
          <button
            onClick={() => setCount(1)}
            className={`px-3 py-1 rounded-lg border ${count === 1 ? "bg-emerald-100 border-emerald-300" : "bg-white hover:bg-slate-50"}`}
          >
            {t("singleDraw")}
          </button>
          <button
            onClick={() => setCount(10)}
            className={`px-3 py-1 rounded-lg border ${count === 10 ? "bg-emerald-100 border-emerald-300" : "bg-white hover:bg-slate-50"}`}
          >
            {t("tenDraw")}
          </button>
          <input
            type="number"
            min={1}
            value={count}
            onChange={e => setCount(clamp(parseInt(e.target.value || "1", 10), 1, 999))}
            className="w-24 px-2 py-1 border rounded-lg"
          />
        </div>
        <div className="flex gap-2">
          <button onClick={() => onDraw(count)} className="px-3 py-1.5 rounded-lg border bg-white hover:bg-slate-50">
            {t("startDraw")}
          </button>
          <button onClick={onClose} className="px-3 py-1.5 rounded-lg border bg-white hover:bg-slate-50">
            {t("close")}
          </button>
        </div>
        <div className="text-[11px] text-slate-500 mt-2">
          <div className="space-y-0.5"></div>
        </div>
      </div>
    </div>
  );
}
