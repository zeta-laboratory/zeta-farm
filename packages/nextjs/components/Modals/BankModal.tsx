"use client";

import { useState } from "react";
import { I18N } from "~~/constants/i18n";
import { clamp } from "~~/utils/game";

interface BankModalProps {
  open: boolean;
  onClose: () => void;
  coins: number;
  onExchange: (amount: number, target: "zeta" | "tickets") => void;
  language: string;
}

type BankCurrency = "zeta" | "tickets";

export function BankModal({ open, onClose, coins, onExchange, language }: BankModalProps) {
  const t = (key: string): string => {
    const langData = I18N[language as keyof typeof I18N];
    return (langData?.[key as keyof typeof langData] as string) || I18N.zh[key as keyof typeof I18N.zh] || key;
  };
  const [targetCurrency, setTargetCurrency] = useState<BankCurrency>("zeta");
  const [amount, setAmount] = useState(10);

  const exchangeRate = targetCurrency === "zeta" ? 10 : 70;
  const minAmount = exchangeRate;

  const validAmount = Math.max(minAmount, Math.min(amount, coins));
  const exchangeAmount = Math.floor(validAmount / exchangeRate);

  const handleCurrencyChange = (newCurrency: BankCurrency) => {
    setTargetCurrency(newCurrency);
    const newMin = newCurrency === "zeta" ? 10 : 70;
    setAmount(newMin);
    if (amount < newMin) {
      setAmount(newMin);
    }
  };

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
      <div className="bg-white w-[min(480px,95vw)] rounded-2xl border shadow-lg p-4">
        <div className="flex items-center justify-between mb-2">
          <div className="font-semibold text-lg">{t("bank")}</div>
          <button onClick={onClose} className="text-slate-500 hover:text-slate-700">
            ✖
          </button>
        </div>
        <div className="text-sm text-slate-600 mb-3">
          {t("currentCoins")}：<b>{coins}</b>
        </div>
        <div className="mb-3">
          <div className="text-sm text-slate-700 mb-2">{t("exchangeTarget")}：</div>
          <div className="flex gap-2 mb-2">
            <button
              onClick={() => handleCurrencyChange("zeta")}
              className={`px-3 py-2 rounded-lg border flex-1 ${targetCurrency === "zeta" ? "bg-emerald-100 border-emerald-300" : "bg-white hover:bg-slate-50"}`}
            >
              Ζ ZETA
            </button>
            <button
              onClick={() => handleCurrencyChange("tickets")}
              className={`px-3 py-2 rounded-lg border flex-1 ${targetCurrency === "tickets" ? "bg-emerald-100 border-emerald-300" : "bg-white hover:bg-slate-50"}`}
            >
              🎟️ {language === "ko" ? "티켓" : language === "en" ? "Tickets" : "奖券"}
            </button>
          </div>
        </div>
        <div className="mb-3">
          <div className="text-sm text-slate-700 mb-2">{t("exchangeAmount")}：</div>
          <div className="flex items-center gap-2 mb-2">
            <input
              type="number"
              min={minAmount}
              max={coins}
              step={targetCurrency === "zeta" ? 10 : 70}
              value={validAmount}
              onChange={e => setAmount(clamp(parseInt(e.target.value || String(minAmount), 10), minAmount, coins))}
              className="flex-1 px-3 py-2 border rounded-lg"
            />
          </div>
          <div className="flex gap-2 mb-2">
            {targetCurrency === "zeta" ? (
              <>
                <button
                  onClick={() => setAmount(10)}
                  className="px-2 py-1 text-xs rounded border bg-white hover:bg-slate-50"
                >
                  10
                </button>
                <button
                  onClick={() => setAmount(100)}
                  className="px-2 py-1 text-xs rounded border bg-white hover:bg-slate-50"
                >
                  100
                </button>
                <button
                  onClick={() => setAmount(1000)}
                  className="px-2 py-1 text-xs rounded border bg-white hover:bg-slate-50"
                >
                  1000
                </button>
              </>
            ) : (
              <>
                <button
                  onClick={() => setAmount(70)}
                  className="px-2 py-1 text-xs rounded border bg-white hover:bg-slate-50"
                >
                  70
                </button>
                <button
                  onClick={() => setAmount(350)}
                  className="px-2 py-1 text-xs rounded border bg-white hover:bg-slate-50"
                >
                  350
                </button>
                <button
                  onClick={() => setAmount(700)}
                  className="px-2 py-1 text-xs rounded border bg-white hover:bg-slate-50"
                >
                  700
                </button>
              </>
            )}
            <button
              onClick={() => setAmount(coins)}
              className="px-2 py-1 text-xs rounded border bg-white hover:bg-slate-50"
            >
              {language === "en" ? "All" : language === "ko" ? "전체" : "全部"}
            </button>
          </div>
        </div>
        <div className="text-sm text-slate-700 mb-3 p-3 bg-slate-50 rounded-lg">
          <div>
            {exchangeRate} {t("coins")} {t("exchangeRate")}{" "}
            {targetCurrency === "zeta" ? "ZETA" : language === "ko" ? "티켓" : language === "en" ? "Ticket" : "奖券"}
          </div>
          <div className="font-semibold mt-1">
            {validAmount} {t("coins")} → {exchangeAmount}{" "}
            {targetCurrency === "zeta" ? "ZETA" : language === "ko" ? "티켓" : language === "en" ? "Tickets" : "奖券"}
          </div>
        </div>
        <div className="flex gap-2">
          <button
            onClick={() => {
              if (coins < validAmount) {
                return;
              }
              if (exchangeAmount < 1) {
                return;
              }
              onExchange(validAmount, targetCurrency);
              setAmount(minAmount);
            }}
            className="flex-1 px-3 py-1.5 rounded-lg border bg-white hover:bg-slate-50"
            disabled={coins < validAmount || exchangeAmount < 1}
          >
            {language === "en" ? "Exchange" : language === "ko" ? "교환" : "兑换"}
          </button>
          <button onClick={onClose} className="px-3 py-1.5 rounded-lg border bg-white hover:bg-slate-50">
            {t("close")}
          </button>
        </div>
      </div>
    </div>
  );
}
