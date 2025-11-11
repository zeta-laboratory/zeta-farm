"use client";

import { useState } from "react";
import { I18N } from "~~/constants/i18n";

interface RobotModalProps {
  open: boolean;
  onClose: () => void;
  onSubscribe: (name: string, email: string, acceptMarketing: boolean) => void;
  subscribed: boolean;
  language: string;
}

export function RobotModal({ open, onClose, onSubscribe, subscribed, language }: RobotModalProps) {
  const t = (key: string): string => {
    const langData = I18N[language as keyof typeof I18N];
    return (langData?.[key as keyof typeof langData] as string) || I18N.zh[key as keyof typeof I18N.zh] || key;
  };

  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [acceptMarketing, setAcceptMarketing] = useState(true);

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
      <div className="bg-white w-[min(480px,95vw)] rounded-2xl border shadow-lg p-4">
        <div className="flex items-center justify-between mb-3">
          <div className="font-semibold text-lg">🤖 {t("robotTool")}</div>
          <button onClick={onClose} className="text-slate-500 hover:text-slate-700">
            ✖
          </button>
        </div>
        {subscribed ? (
          <div className="text-center py-6">
            <div className="text-6xl mb-4">✓</div>
            <div className="text-lg font-medium text-emerald-600">{t("subscribeSuccess")}</div>
            <div className="text-sm text-slate-500 mt-2">{t("emailNotify")}</div>
          </div>
        ) : (
          <>
            <div className="text-sm text-slate-600 mb-4">{t("subscribeDescription")}</div>
            <div className="space-y-3">
              <div>
                <div className="text-sm text-slate-700 mb-1">{t("name")}：</div>
                <input
                  type="text"
                  value={name}
                  onChange={e => setName(e.target.value)}
                  className="w-full px-3 py-2 border rounded-lg"
                  placeholder={t("name")}
                />
              </div>
              <div>
                <div className="text-sm text-slate-700 mb-1">{t("email")}：</div>
                <input
                  type="email"
                  value={email}
                  onChange={e => setEmail(e.target.value)}
                  className="w-full px-3 py-2 border rounded-lg"
                  placeholder="example@email.com"
                />
              </div>
              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  checked={acceptMarketing}
                  onChange={e => setAcceptMarketing(e.target.checked)}
                  className="w-4 h-4"
                />
                <label className="text-sm text-slate-600">{t("acceptMarketing")}</label>
              </div>
            </div>
            <div className="flex gap-2 mt-4">
              <button
                onClick={() => {
                  if (!name.trim() || !email.trim()) {
                    return;
                  }
                  onSubscribe(name, email, acceptMarketing);
                }}
                className="flex-1 px-3 py-1.5 rounded-lg border bg-emerald-100 hover:bg-emerald-200 text-emerald-700"
              >
                {t("subscribe")}
              </button>
              <button onClick={onClose} className="px-3 py-1.5 rounded-lg border bg-white hover:bg-slate-50">
                {t("close")}
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
