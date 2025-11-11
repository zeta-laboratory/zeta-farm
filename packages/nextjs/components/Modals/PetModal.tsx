"use client";

import { PETS } from "~~/constants";
import { I18N } from "~~/constants/i18n";

interface PetModalProps {
  open: boolean;
  onClose: () => void;
  pets: Record<string, boolean>;
  onBuyPet: (petId: string) => void;
  language: string;
}

export function PetModal({ open, onClose, pets, onBuyPet, language }: PetModalProps) {
  const t = (key: string): string => {
    const langData = I18N[language as keyof typeof I18N];
    return (langData?.[key as keyof typeof langData] as string) || I18N.zh[key as keyof typeof I18N.zh] || key;
  };

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 overflow-y-auto">
      <div className="bg-white w-[min(640px,95vw)] rounded-2xl border shadow-lg p-4 m-4">
        <div className="flex items-center justify-between mb-3">
          <div className="font-semibold text-lg">🐶 {t("petTool")}</div>
          <button onClick={onClose} className="text-slate-500 hover:text-slate-700">
            ✖
          </button>
        </div>
        <div className="text-sm text-slate-600 mb-4">{t("petShopDesc")}</div>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {PETS.map(pet => {
            const owned = pets[pet.id] || false;
            const dailyEarn = (pet.coinsPerHour * 24).toFixed(2);
            return (
              <div
                key={pet.id}
                className={`p-4 rounded-xl border ${owned ? "bg-emerald-50 border-emerald-300" : "bg-white border-slate-200"}`}
              >
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <span className="text-4xl">{pet.emoji}</span>
                    <div>
                      <div className="font-medium">{pet.name}</div>
                      <div className="text-xs text-slate-500">
                        {t("offlineCoins")}: {pet.coinsPerHour.toFixed(3)}/{t("perHour")}
                      </div>
                    </div>
                  </div>
                  {owned && <span className="text-emerald-600 text-sm">✓</span>}
                </div>
                <div className="text-xs text-slate-600 mb-3">
                  {t("dailyEarn")} {dailyEarn} {t("coins")}
                </div>
                {!owned ? (
                  <button
                    onClick={() => onBuyPet(pet.id)}
                    className="w-full px-3 py-2 rounded-lg border bg-white hover:bg-slate-50 text-sm"
                  >
                    {t("buy")} - {pet.price} {t("coins")}
                  </button>
                ) : (
                  <div className="text-center py-2 text-sm text-emerald-600 font-medium">{t("owned")}</div>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
