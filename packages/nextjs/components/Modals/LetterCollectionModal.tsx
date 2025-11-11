"use client";

import { I18N } from "~~/constants/i18n";
import { LETTER_COLLECTION_PHRASES, REWARDS_LIST } from "~~/constants/rewards";

interface LetterCollectionModalProps {
  open: boolean;
  onClose: () => void;
  collectedLetters: Record<string, number>;
  redeemedRewards: string[];
  onRedeem: (rewardId: string) => void;
  language: string;
}

export function LetterCollectionModal({
  open,
  onClose,
  collectedLetters,
  redeemedRewards,
  onRedeem,
  language,
}: LetterCollectionModalProps) {
  const t = (key: string): string => {
    const langData = I18N[language as keyof typeof I18N];
    return (langData?.[key as keyof typeof langData] as string) || I18N.zh[key as keyof typeof I18N.zh] || key;
  };

  if (!open) return null;

  // 检查每个短语是否完整
  const checkPhraseComplete = (phrase: string) => {
    const letters = phrase.split("").filter((c: string) => /[A-Za-z]/.test(c));
    return letters.every((letter: string) => (collectedLetters[letter.toUpperCase()] || 0) > 0);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 overflow-y-auto">
      <div className="bg-white w-[min(800px,95vw)] rounded-2xl border shadow-lg p-4 m-4">
        <div className="flex items-center justify-between mb-3">
          <div className="font-semibold text-lg">{t("letterCollection")}</div>
          <button onClick={onClose} className="text-slate-500 hover:text-slate-700">
            ✖
          </button>
        </div>

        <div className="text-sm text-slate-600 mb-3">{t("collectWordHint")}</div>

        {/* 短语列表 */}
        <div className="space-y-3 mb-4 max-h-64 overflow-y-auto">
          {LETTER_COLLECTION_PHRASES.map(phrase => {
            const isComplete = checkPhraseComplete(phrase);
            const letters = phrase.split("").filter(c => /[A-Za-z]/.test(c));
            return (
              <div
                key={phrase}
                className={`p-2 rounded-lg border ${isComplete ? "bg-emerald-50 border-emerald-300" : "bg-slate-50 border-slate-200"}`}
              >
                <div className="flex items-center justify-between mb-1">
                  <div className="font-medium">{phrase}</div>
                  {isComplete && <span className="text-emerald-600 text-xs">✓ {t("wordComplete")}</span>}
                </div>
                <div className="flex flex-wrap gap-1">
                  {letters.map((letter, idx) => {
                    const count = collectedLetters[letter.toUpperCase()] || 0;
                    const hasLetter = count > 0;
                    return (
                      <div
                        key={idx}
                        className={`px-2 py-0.5 rounded border text-xs ${
                          hasLetter
                            ? "bg-emerald-100 border-emerald-300 text-emerald-700"
                            : "bg-white border-slate-300 text-slate-400"
                        }`}
                      >
                        {letter.toUpperCase()} {hasLetter && `×${count}`}
                      </div>
                    );
                  })}
                </div>
              </div>
            );
          })}
        </div>

        {/* 奖励列表 */}
        <div className="border-t pt-3">
          <div className="font-medium mb-2">{t("collectedWords")}</div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
            {REWARDS_LIST.map(reward => {
              const isRedeemed = redeemedRewards.includes(reward.id);
              return (
                <div
                  key={reward.id}
                  className={`p-3 rounded-lg border ${isRedeemed ? "bg-slate-100 border-slate-300" : "bg-white border-slate-200"}`}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span className="text-2xl">{reward.emoji}</span>
                      <div>
                        <div className="font-medium">{reward.name}</div>
                        <div className="text-xs text-slate-500">{t("equivalentValue")} 100U</div>
                      </div>
                    </div>
                    {!isRedeemed ? (
                      <button
                        onClick={() => onRedeem(reward.id)}
                        className="px-3 py-1 rounded-lg bg-emerald-100 hover:bg-emerald-200 text-emerald-700 text-sm"
                      >
                        {t("redeem")}
                      </button>
                    ) : (
                      <span className="text-xs text-slate-500">{t("redeemed")}</span>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        <div className="flex gap-2 mt-4">
          <button onClick={onClose} className="flex-1 px-3 py-1.5 rounded-lg border bg-white hover:bg-slate-50">
            {t("close")}
          </button>
        </div>
      </div>
    </div>
  );
}
