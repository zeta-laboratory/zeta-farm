"use client";

import { useState } from "react";
import { FERTILIZER_COST, SEEDS } from "~~/constants";
import { I18N } from "~~/constants/i18n";
import type { ShopTab } from "~~/types";
import { clamp, fmtTime } from "~~/utils/game";

interface ShopModalProps {
  open: boolean;
  onClose: () => void;
  buySeed: (id: string, count: number) => void;
  buyFertilizer: (count: number) => void;
  sellFruit: (id: string, count: number) => void;
  fruits: Record<string, number>;
  language: string;
}

export function ShopModal({ open, onClose, buySeed, buyFertilizer, sellFruit, fruits, language }: ShopModalProps) {
  const t = (key: string): string => {
    const langData = I18N[language as keyof typeof I18N];
    return (langData?.[key as keyof typeof langData] as string) || I18N.zh[key as keyof typeof I18N.zh] || key;
  };
  const [tab, setTab] = useState<ShopTab>("buy");
  const [seedId, setSeedId] = useState("radish");
  const [qty, setQty] = useState(1);
  const entries = Object.values(SEEDS);
  if (!open) return null;
  const seed = SEEDS[seedId];
  const fruitEntries = entries.filter(s => (fruits[s.id] || 0) > 0);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
      <div className="bg-white w-[min(640px,95vw)] rounded-2xl border shadow-lg p-4">
        <div className="flex items-center justify-between mb-2">
          <div className="font-semibold text-lg">{t("shop")}</div>
          <button onClick={onClose} className="text-slate-500 hover:text-slate-700">
            ✖
          </button>
        </div>
        {/* 标签页切换 */}
        <div className="flex gap-2 mb-3 border-b">
          <button
            onClick={() => {
              setTab("buy");
              setSeedId("radish");
            }}
            className={`px-3 py-1 text-sm ${tab === "buy" ? "border-b-2 border-emerald-400 text-emerald-600" : "text-slate-500"}`}
          >
            {t("buySeeds")}
          </button>
          <button
            onClick={() => {
              setTab("buyFertilizer");
            }}
            className={`px-3 py-1 text-sm ${tab === "buyFertilizer" ? "border-b-2 border-emerald-400 text-emerald-600" : "text-slate-500"}`}
          >
            {t("fertilizer")}
          </button>
          <button
            onClick={() => {
              setTab("sell");
              if (fruitEntries.length > 0) setSeedId(fruitEntries[0].id);
            }}
            className={`px-3 py-1 text-sm ${tab === "sell" ? "border-b-2 border-emerald-400 text-emerald-600" : "text-slate-500"}`}
          >
            {t("sellFruits")}
          </button>
        </div>

        {tab === "buyFertilizer" ? (
          <div>
            <div className="text-base font-medium mb-2">{t("fertilizer")} 🌾</div>
            <div className="text-sm text-slate-600 mb-2">使用肥料可以加速作物生长，根据作物稀有程度效果不同</div>
            <div className="flex items-center gap-2 mb-4">
              <input
                type="number"
                min={1}
                value={qty}
                onChange={e => setQty(clamp(parseInt(e.target.value || "1", 10), 1, 999))}
                className="w-20 px-2 py-1 border rounded-lg"
              />
              <div className="text-sm text-slate-600">{t("quantity")}</div>
              <div className="text-sm text-slate-600">
                {t("totalPrice")}：{FERTILIZER_COST * qty} {t("coins")}
              </div>
            </div>
            <div className="flex gap-2">
              <button
                onClick={() => buyFertilizer(qty)}
                className="px-3 py-1.5 rounded-lg border bg-white hover:bg-slate-50"
              >
                {t("buy")}
              </button>
              <button onClick={onClose} className="px-3 py-1.5 rounded-lg border bg-white hover:bg-slate-50">
                {t("close")}
              </button>
            </div>
          </div>
        ) : tab === "buy" ? (
          <div className="grid grid-cols-5 gap-2">
            <div className="col-span-3">
              <div className="grid grid-cols-5 gap-2 max-h-72 overflow-auto pr-1">
                {entries.map(s => (
                  <button
                    key={s.id}
                    onClick={() => setSeedId(s.id)}
                    className={`aspect-square rounded-xl border flex items-center justify-center text-2xl ${seedId === s.id ? "border-emerald-400 bg-emerald-50" : "bg-white hover:bg-slate-50"}`}
                    title={s.name}
                  >
                    {s.emoji}
                  </button>
                ))}
              </div>
            </div>
            <div className="col-span-2">
              <div className="text-base font-medium mb-1">
                {seed.name} <span className="text-xs text-slate-400">Lv{seed.levelReq}</span>
              </div>
              <div className="text-sm text-slate-600">
                {t("cost")} {seed.cost} {t("coins")}｜{t("sell")} {seed.sell} {t("coins")}｜{t("exp")} +{seed.exp}
              </div>
              <div className="text-[11px] text-slate-500 mb-2">
                {t("mature")} {fmtTime(seed.stages[2])}，{t("witherAfter")} {fmtTime(seed.witherAfter)} {t("after")}
              </div>
              <div className="text-sm mb-2 text-slate-700">{t("buyWith")}</div>
              <div className="flex items-center gap-2 mb-2">
                <input
                  type="number"
                  min={1}
                  value={qty}
                  onChange={e => setQty(clamp(parseInt(e.target.value || "1", 10), 1, 999))}
                  className="w-20 px-2 py-1 border rounded-lg"
                />
                <div className="text-sm text-slate-600">{t("quantity")}</div>
                <div className="text-sm text-slate-600">
                  {t("totalPrice")}：{seed.cost * qty} {t("coins")}
                </div>
              </div>
              <div className="flex gap-2">
                <button
                  onClick={() => buySeed(seedId, qty)}
                  className="px-3 py-1.5 rounded-lg border bg-white hover:bg-slate-50"
                >
                  {t("buy")}
                </button>
                <button onClick={onClose} className="px-3 py-1.5 rounded-lg border bg-white hover:bg-slate-50">
                  {t("close")}
                </button>
              </div>
            </div>
          </div>
        ) : (
          <div className="grid grid-cols-5 gap-2">
            <div className="col-span-3">
              {fruitEntries.length > 0 ? (
                <div className="grid grid-cols-5 gap-2 max-h-72 overflow-auto pr-1">
                  {fruitEntries.map(s => (
                    <button
                      key={s.id}
                      onClick={() => setSeedId(s.id)}
                      className={`aspect-square rounded-xl border flex items-center justify-center text-2xl relative ${seedId === s.id ? "border-emerald-400 bg-emerald-50" : "bg-white hover:bg-slate-50"}`}
                      title={s.name}
                    >
                      {s.emoji}
                      <span className="absolute -top-1 -right-1 text-[10px] px-1 rounded bg-emerald-600 text-white">
                        {fruits[s.id] || 0}
                      </span>
                    </button>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8 text-slate-400">{t("noFruitsToSell")}</div>
              )}
            </div>
            <div className="col-span-2">
              {fruitEntries.length > 0 && seed ? (
                <>
                  <div className="text-base font-medium mb-1">{seed.name}</div>
                  <div className="text-sm text-slate-600 mb-2">
                    {t("unitPrice")} {seed.sell} {t("coins")}
                  </div>
                  <div className="text-sm text-slate-500 mb-2">
                    {t("holding")}：{fruits[seed.id] || 0}
                  </div>
                  <div className="flex items-center gap-2 mb-2">
                    <input
                      type="number"
                      min={1}
                      max={fruits[seed.id] || 0}
                      value={qty}
                      onChange={e => setQty(clamp(parseInt(e.target.value || "1", 10), 1, fruits[seed.id] || 0))}
                      className="w-20 px-2 py-1 border rounded-lg"
                    />
                    <div className="text-sm text-slate-600">{t("quantity")}</div>
                  </div>
                  <div className="text-sm text-slate-700 mb-2">
                    {t("total")}：{seed.sell * qty} {t("coins")}
                  </div>
                  <div className="text-[11px] text-slate-500 mb-2">{t("sellToShop")}</div>
                  <div className="flex gap-2">
                    <button
                      onClick={() => {
                        sellFruit(seedId, qty);
                        setQty(1);
                      }}
                      className="px-3 py-1.5 rounded-lg border bg-white hover:bg-slate-50"
                    >
                      {t("sellAction")}
                    </button>
                    <button onClick={onClose} className="px-3 py-1.5 rounded-lg border bg-white hover:bg-slate-50">
                      {t("close")}
                    </button>
                  </div>
                </>
              ) : (
                <div className="text-sm text-slate-400">{t("selectFruit")}</div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
