"use client";

import { useState } from "react";
import { I18N } from "~~/constants/i18n";

interface SettingsPanelProps {
  onReset: () => void;
  language: string;
}

export function SettingsPanel({ onReset, language }: SettingsPanelProps) {
  const t = (key: string): string => {
    const langData = I18N[language as keyof typeof I18N];
    return (langData?.[key as keyof typeof langData] as string) || I18N.zh[key as keyof typeof I18N.zh] || key;
  };

  const [open, setOpen] = useState(false);
  return (
    <div className="bg-white/90 backdrop-blur rounded-2xl p-3 border shadow-sm mt-3">
      <div className="flex items-center justify-between">
        <div className="font-semibold">{t("settings")}</div>
        <button
          onClick={() => setOpen(!open)}
          className="text-xs px-2 py-1 rounded-lg border bg-white hover:bg-slate-50"
        >
          {open ? t("collapse") : t("expand")}
        </button>
      </div>
      {open && (
        <div className="mt-2 space-y-2">
          <button onClick={onReset} className="text-xs px-2 py-1 rounded-lg border bg-white hover:bg-slate-50">
            {t("resetSave")}
          </button>
          <div className="text-[11px] text-slate-500">{t("settingsNote")}</div>
        </div>
      )}
    </div>
  );
}
