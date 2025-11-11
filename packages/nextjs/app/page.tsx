"use client";

import { useEffect, useMemo, useState } from "react";
import type { NextPage } from "next";
import { Header } from "~~/components/Header";
import { AutumnBackground } from "~~/components/Layout/AutumnBackground";
import { Banner } from "~~/components/Layout/Banner";
// 导入布局组件
import { TopBar } from "~~/components/Layout/TopBar";
// 导入常量配置
import {
  FERTILIZER_COST,
  LETTER_DROP_PROBABILITY,
  PEST_PROBABILITY,
  PROTECT_DURATION_SEC,
  PROTECT_PURCHASE_COST,
  TICKET_EXCHANGE_RATE,
  TICK_MS,
  ZETA_EXCHANGE_RATE,
} from "~~/constants/game";
import { I18N } from "~~/constants/i18n";
import { PETS } from "~~/constants/pets";
import { GLUCK_SEED_POOLS, LETTER_COLLECTION_PHRASES, REWARDS_LIST } from "~~/constants/rewards";
import { SEEDS } from "~~/constants/seeds";
// 导入类型定义
import type { CurrencyType, GameSave, Language, Plot, ShopTab, ToolType } from "~~/types";
// 导入游戏工具函数
import {
  // 作物阶段相关
  STAGE, // 通用工具
  clamp, // 存档相关
  createDefaultSave, // UI 相关
  cursorForTool, // 签到相关
  dailyCheckin,
  fmtTime,
  getAllDaysInMonth, // 字母收集相关
  getAllRequiredLetters, // 等级相关
  getLevel, // 地块相关
  getPlotUnlockCost,
  getPlotUnlockLevel,
  getTodayDateStr, // 需求相关
  getWateringCount,
  getWeedingCount,
  getYearMonthStr,
  hasCheckedInToday, // 时间相关
  now,
  randomChance,
  replacePlot,
  soilTextureStyle,
  stageOf,
  timeToNextStage, // 产量相关
  yieldAmount,
} from "~~/utils/game";

/**********************
 * 基础常量与工具函数 *
 **********************/

/**********************
 * 多语言系统          *
 **********************/
// 检测浏览器语言
function detectLanguage(): string {
  const saved = localStorage.getItem("farm-language");
  if (saved && (saved === "zh" || saved === "en" || saved === "ko")) {
    return saved;
  }
  const browserLang = navigator.language;
  if (browserLang.startsWith("ko")) return "ko";
  if (browserLang.startsWith("en")) return "en";
  return "zh"; // 默认中文
}

// 获取当前语言文本
let currentLanguage: string = detectLanguage();
function t(key: string): string {
  const langData = I18N[currentLanguage as keyof typeof I18N];
  return (langData?.[key as keyof typeof langData] as string) || I18N.zh[key as keyof typeof I18N.zh] || key;
}

/**********************
 * 存档与默认状态      *
 **********************/
// DEFAULT_SAVE 已移至 utils/game/save.ts

/**********************
 * 游戏逻辑核心        *
 **********************/

/**********************
 * 主组件              *
 **********************/
function SocialFarmGame() {
  const [lang, setLang] = useState(() => detectLanguage());

  // 当语言改变时，更新全局变量并保存
  useEffect(() => {
    currentLanguage = lang;
    localStorage.setItem("farm-language", lang);
  }, [lang]);

  const [save, setSave] = useState(() => {
    const raw = localStorage.getItem("social-farm-save-v1");
    if (raw) {
      try {
        const loaded = JSON.parse(raw);
        // 确保新字段存在（向后兼容）
        if (loaded.checkinLastDate === undefined) loaded.checkinLastDate = "";
        if (loaded.checkinRecords === undefined) loaded.checkinRecords = {};
        if (loaded.collectedLetters === undefined) loaded.collectedLetters = {};
        if (loaded.redeemedRewards === undefined) loaded.redeemedRewards = [];
        if (loaded.fertilizer === undefined) loaded.fertilizer = 0;
        if (loaded.pets === undefined) loaded.pets = {};
        if (loaded.robotSubscribed === undefined) loaded.robotSubscribed = false;
        return loaded;
      } catch (e) {
        console.warn("Load save failed", e);
      }
    }
    return createDefaultSave();
  });

  const lvl = useMemo(() => getLevel(save.exp), [save.exp]);

  // 测试加成功能已移除，新用户使用 createDefaultSave() 的默认值

  // 自动保存
  useEffect(() => {
    localStorage.setItem("social-farm-save-v1", JSON.stringify(save));
  }, [save]);

  // 背景音乐自动播放（循环）
  useEffect(() => {
    const audio = document.getElementById("bgMusic") as HTMLAudioElement;
    if (audio) {
      audio.volume = 0.3; // 设置音量为30%
      audio.play().catch((err: Error) => {
        console.warn("Background music autoplay failed:", err);
      });
    }
  }, []);

  // 初始化时计算离线收益
  useEffect(() => {
    if (save.lastLogin && save.lastLogin < now()) {
      const offlineHours = (now() - save.lastLogin) / 3600;
      if (offlineHours > 0) {
        const pets = save.pets || {};
        let totalOfflineCoins = 0;

        PETS.forEach(pet => {
          if (pets[pet.id]) {
            totalOfflineCoins += pet.coinsPerHour * offlineHours;
          }
        });

        if (totalOfflineCoins > 0) {
          setSave((s: any) => ({
            ...s,
            coins: s.coins + Math.floor(totalOfflineCoins),
            lastLogin: now(),
          }));
          toast(
            `${t("offlineEarn")}：${Math.floor(totalOfflineCoins)} ${t("coins")}（${Math.floor(offlineHours)}${t("hours")}）`,
          );
        } else {
          setSave((s: any) => ({ ...s, lastLogin: now() }));
        }
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []); // 仅在初始化时执行一次

  // 每秒：检查浇水/除草需求并暂停生长，随机事件（害虫）
  useEffect(() => {
    const id = setInterval(() => {
      setSave((prev: any) => {
        const next = { ...prev };
        next.plots = prev.plots.map((p: Plot) => {
          if (!p.seedId || !p.plantedAt) return p;

          // 计算实际生长时间（不包含暂停时间）
          const actualElapsed = now() - p.plantedAt - (p.pausedDuration || 0);
          let hasActiveWaterReq = false;
          let hasActiveWeedReq = false;

          // 检查浇水需求
          for (const req of p.waterRequirements || []) {
            if (!req.done && actualElapsed >= req.time) {
              hasActiveWaterReq = true;
              // 如果还没开始暂停，记录暂停开始时间
              if (!p.pausedAt) {
                p = { ...p, pausedAt: now() };
              }
            }
          }

          // 检查除草需求
          for (const req of p.weedRequirements || []) {
            if (!req.done && actualElapsed >= req.time) {
              hasActiveWeedReq = true;
              // 如果还没开始暂停，记录暂停开始时间
              if (!p.pausedAt) {
                p = { ...p, pausedAt: now() };
              }
            }
          }

          // 如果有未完成的需求，累计暂停时间
          if (hasActiveWaterReq || hasActiveWeedReq) {
            if (p.pausedAt) {
              // const pausedSince = now() - p.pausedAt; // 未来可能用于显示暂停时长
              p = { ...p, pausedDuration: (p.pausedDuration || 0) + 1 };
            }
          } else if (p.pausedAt) {
            // 所有需求都完成了，清除暂停
            p = { ...p, pausedAt: null };
          }

          // 随机事件：害虫（不暂停生长）
          const st = stageOf(p);
          if (st === STAGE.RIPE || st === STAGE.GROWING) {
            const pests = p.pests || randomChance(PEST_PROBABILITY);
            return { ...p, pests };
          }

          return p;
        });
        return next;
      });
    }, TICK_MS);
    return () => clearInterval(id);
  }, []);

  // 工具/种子选择 + 指针
  function setTool(t: string) {
    setSave((s: any) => ({ ...s, tool: t }));
  }
  useEffect(() => {
    const c = cursorForTool(save.tool);
    const prev = document.body.style.cursor;
    document.body.style.cursor = c;
    return () => {
      document.body.style.cursor = prev;
    };
  }, [save.tool]);

  function selectSeed(id: string) {
    setSave((s: any) => ({ ...s, selectedSeed: id, tool: "plant" }));
  }

  // 购买种子（只能用金币，无等级限制）
  function buySeed(id: string, count = 1) {
    const seed = SEEDS[id as keyof typeof SEEDS];
    if (!seed) return toast(t("unknownSeed"));
    const cost = seed.cost * count;
    if (save.coins < cost) return toast(t("insufficientCoins"));
    setSave((s: any) => ({
      ...s,
      coins: s.coins - cost,
      inventory: { ...s.inventory, [id]: (s.inventory[id] || 0) + count },
    }));
    toast(`${t("bought")} ${seed.name} ×${count}，${t("consumed")} ${cost} ${t("coins")}`);
  }

  // 购买肥料（只能用金币）
  function buyFertilizer(count = 1) {
    const cost = FERTILIZER_COST * count;
    if (save.coins < cost) return toast(t("insufficientCoins"));
    setSave((s: any) => ({
      ...s,
      coins: s.coins - cost,
      fertilizer: (s.fertilizer || 0) + count,
    }));
    toast(`${t("bought")} ${t("fertilizer")} ×${count}，${t("consumed")} ${cost} ${t("coins")}`);
  }

  // 购买宠物
  function buyPet(petId: string) {
    const pet = PETS.find((p: any) => p.id === petId);
    if (!pet) return toast(t("unknownPet"));
    if (save.coins < pet.price) return toast(t("insufficientCoins"));
    const pets = save.pets || {};
    if (pets[petId]) return toast(t("alreadyOwnPet"));

    setSave((s: any) => ({
      ...s,
      coins: s.coins - pet.price,
      pets: { ...(s.pets || {}), [petId]: true },
    }));
    toast(`${t("bought")} ${pet.name}！${t("offlineCoins")}：${(pet.coinsPerHour * 24).toFixed(1)} ${t("perHour")}`);
  }

  // 行为：播种/收获/等
  function plant(plot: Plot) {
    if (!plot.unlocked) return toast(t("plotLocked"));
    if (!save.selectedSeed) return toast(t("selectSeedFirst"));
    if (plot.seedId) return toast(t("plotOccupied"));
    const sid = save.selectedSeed;
    if ((save.inventory[sid] || 0) <= 0) return toast(t("insufficientSeeds"));
    const seed = SEEDS[sid as keyof typeof SEEDS];
    const [, , s3] = seed.stages; // s1, s2 未使用，但保留解构以便理解

    // 生成浇水需求时间点（在生长过程中随机分布）
    const waterCount = getWateringCount(seed.levelReq);
    const waterRequirements = [];
    for (let i = 0; i < waterCount; i++) {
      const time = Math.floor(Math.random() * s3);
      waterRequirements.push({ time, done: false });
    }
    waterRequirements.sort((a, b) => a.time - b.time); // 按时间排序

    // 生成除草需求时间点
    const weedCount = getWeedingCount(seed.levelReq);
    const weedRequirements = [];
    for (let i = 0; i < weedCount; i++) {
      const time = Math.floor(Math.random() * s3);
      weedRequirements.push({ time, done: false });
    }
    weedRequirements.sort((a, b) => a.time - b.time); // 按时间排序

    const newPlot = {
      ...plot,
      seedId: sid,
      plantedAt: now(),
      fertilized: false,
      wateredAt: null,
      weeds: false,
      pests: false,
      waterRequirements,
      weedRequirements,
      pausedDuration: 0,
      pausedAt: null,
    };
    const inv = { ...save.inventory, [sid]: (save.inventory[sid] || 0) - 1 };

    // 随机掉落字母
    let letterDropped = null;
    if (Math.random() < LETTER_DROP_PROBABILITY) {
      const letters = getAllRequiredLetters();
      letterDropped = letters[Math.floor(Math.random() * letters.length)];
    }

    const nextLetters = letterDropped
      ? { ...save.collectedLetters, [letterDropped]: (save.collectedLetters[letterDropped] || 0) + 1 }
      : save.collectedLetters;

    setSave((s: GameSave) => ({
      ...s,
      plots: replacePlot(s.plots, newPlot),
      inventory: inv,
      collectedLetters: nextLetters,
    }));

    if (letterDropped) {
      toast(`${t("letterDropped")}: ${letterDropped}`);
    }
  }

  function harvest(plot: Plot) {
    if (!plot.unlocked) return;
    if (!plot.seedId) return;
    const st = stageOf(plot);
    if (st !== STAGE.RIPE) return toast(t("notRipe"));
    const amount = yieldAmount(plot);
    const seed = SEEDS[plot.seedId as keyof typeof SEEDS];
    const exp = seed.exp * amount; // 经验值 = 基础经验 × 收获数量

    // 随机掉落字母
    let letterDropped: string | null = null;
    if (Math.random() < LETTER_DROP_PROBABILITY) {
      const letters = getAllRequiredLetters();
      letterDropped = (letters[Math.floor(Math.random() * letters.length)] as string) || null;
    }

    const cleared: Plot = {
      ...plot,
      seedId: null,
      plantedAt: null,
      fertilized: false,
      weeds: false,
      pests: false,
      waterRequirements: [],
      weedRequirements: [],
      pausedDuration: 0,
      pausedAt: null,
    };

    setSave((s: any) => {
      const next = {
        ...s,
        exp: s.exp + exp,
        plots: replacePlot(s.plots, cleared),
        fruits: { ...(s.fruits || {}), [plot.seedId!]: ((s.fruits || {})[plot.seedId!] || 0) + amount },
      };

      // 更新字母收集
      if (letterDropped) {
        next.collectedLetters = {
          ...(s.collectedLetters || {}),
          [letterDropped]: ((s.collectedLetters || {})[letterDropped] || 0) + 1,
        };
      }

      return next;
    });

    // 显示收获提示
    if (letterDropped) {
      toast(
        `${t("harvested")} ${seed.name} ×${amount}，${t("expGained")}${exp}，${t("letterDropped")}: ${letterDropped}`,
      );
    } else {
      toast(`${t("harvested")} ${seed.name} ×${amount}，${t("expGained")}${exp}，${t("sellAtShopFor")}`);
    }
  }

  function water(plot: Plot) {
    if (!plot.unlocked) return;
    if (!plot.seedId) return;
    const actualElapsed = now() - plot.plantedAt! - (plot.pausedDuration || 0);
    let next = { ...plot, wateredAt: now() };
    let completedAny = false;

    // 检查并完成已到达的浇水需求
    const waterReqs = [...(plot.waterRequirements || [])];
    for (let i = 0; i < waterReqs.length; i++) {
      if (!waterReqs[i].done && actualElapsed >= waterReqs[i].time) {
        waterReqs[i] = { ...waterReqs[i], done: true };
        completedAny = true;
      }
    }

    if (completedAny) {
      next = {
        ...next,
        waterRequirements: waterReqs,
        pausedAt: null, // 清除暂停（如果所有需求都完成了会在下次tick处理）
      };
      toast(t("watered"));
    }

    setSave((s: any) => ({ ...s, plots: replacePlot(s.plots, next) }));
  }
  function weed(plot: Plot) {
    if (!plot.unlocked) return;
    if (!plot.seedId) return;
    const actualElapsed = now() - plot.plantedAt! - (plot.pausedDuration || 0);
    let completedAny = false;

    // 检查并完成已到达的除草需求
    const weedReqs = [...(plot.weedRequirements || [])];
    for (let i = 0; i < weedReqs.length; i++) {
      if (!weedReqs[i].done && actualElapsed >= weedReqs[i].time) {
        weedReqs[i] = { ...weedReqs[i], done: true };
        completedAny = true;
      }
    }

    if (completedAny) {
      const next = {
        ...plot,
        weedRequirements: weedReqs,
        weeds: false, // 也清除杂草状态
        pausedAt: null, // 清除暂停
      };
      setSave((s: any) => ({ ...s, plots: replacePlot(s.plots, next) }));
      toast(t("weeded"));
    } else if (plot.weeds) {
      // 处理随机出现的杂草（不影响需求）
      setSave((s: any) => ({ ...s, plots: replacePlot(s.plots, { ...plot, weeds: false }) }));
    } else {
      toast(t("noWeeds"));
    }
  }
  function pesticide(plot: Plot) {
    if (!plot.unlocked) return;
    if (!plot.seedId) return;
    if (!plot.pests) return toast(t("noPests"));
    setSave((s: any) => ({ ...s, plots: replacePlot(s.plots, { ...plot, pests: false }) }));
  }
  function shovel(plot: Plot) {
    if (!plot.unlocked) return;
    if (!plot.seedId) return;
    const cleared: Plot = {
      ...plot,
      seedId: null,
      plantedAt: null,
      fertilized: false,
      weeds: false,
      pests: false,
      waterRequirements: [],
      weedRequirements: [],
      pausedDuration: 0,
      pausedAt: null,
    };
    setSave((s: any) => ({ ...s, plots: replacePlot(s.plots, cleared) }));
  }

  // 施肥功能
  function applyFertilizer(plot: Plot) {
    if (!plot.unlocked) return toast(t("plotNotUnlocked"));
    if (!plot.seedId) return toast(t("plantFirst"));
    if (plot.fertilized) return toast(t("alreadyFertilized"));
    if ((save.fertilizer || 0) <= 0) return toast(t("fertilizerInsufficient"));

    const seed = SEEDS[plot.seedId as keyof typeof SEEDS];
    let reductionFactor = 1; // 减少时间比例

    // 根据作物稀有程度（levelReq）决定效果
    if (seed.levelReq <= 3) {
      // 直接成熟
      reductionFactor = 0;
    } else if (seed.levelReq <= 6) {
      // 减少1/2时间
      reductionFactor = 0.5;
    } else if (seed.levelReq <= 9) {
      // 减少1/3时间
      reductionFactor = 2 / 3;
    } else if (seed.levelReq <= 12) {
      // 减少1/6时间
      reductionFactor = 5 / 6;
    } else {
      // 减少1/24时间
      reductionFactor = 23 / 24;
    }

    // 计算新的种植时间
    let newPlantedAt = plot.plantedAt!;
    if (reductionFactor === 0) {
      // 直接成熟：设置 plantedAt 使其已成熟
      const [, , s3] = seed.stages; // s1, s2 未使用，但保留解构以便理解
      newPlantedAt = now() - s3;
    } else {
      // 调整时间：让已过去的时间相对更长
      const elapsed = now() - plot.plantedAt!;
      newPlantedAt = now() - elapsed / reductionFactor;
    }

    setSave((s: any) => ({
      ...s,
      fertilizer: (s.fertilizer || 0) - 1,
      plots: replacePlot(s.plots, { ...plot, fertilized: true, plantedAt: newPlantedAt }),
    }));

    if (reductionFactor === 0) {
      toast(t("fertilizerSuccessInstant"));
    } else {
      toast(`${t("fertilizerSuccess")} ${Math.round((1 - reductionFactor) * 100)}${t("fertilizerPercent")}`);
    }
  }

  // 保护农场（30分钟）
  function protectFarm() {
    const durationSec = PROTECT_DURATION_SEC;
    const today = getTodayDateStr();

    // 检查是否需要重置每日计数（新的一天）
    const needReset = save.protectLastDate !== today;
    const protectFreeUsed = needReset ? false : save.protectFreeUsed || false;
    const protectBoughtToday = needReset ? 0 : save.protectBoughtToday || 0;

    // 如果有免费次数，使用免费保护
    if (!protectFreeUsed) {
      setSave((s: GameSave) => ({
        ...s,
        plots: s.plots.map((p: Plot) => ({ ...p, protectedUntil: now() + durationSec })),
        protectFreeUsed: true,
        protectLastDate: today,
      }));
      toast(t("protectUsed"));
      return;
    }

    // 如果没有免费次数，检查购买次数
    if (protectBoughtToday >= 3) {
      return toast(t("protectLimit"));
    }

    const cost = PROTECT_PURCHASE_COST;
    if (save.coins < cost) return toast(t("protectCost"));

    setSave((s: GameSave) => ({
      ...s,
      coins: s.coins - cost,
      plots: s.plots.map((p: Plot) => ({ ...p, protectedUntil: now() + durationSec })),
      protectBoughtToday: protectBoughtToday + 1,
      protectLastDate: today,
    }));
    toast(`${t("protectBought")}${2 - protectBoughtToday}）`);
  }

  // 开垦土地
  function unlockPlot(plot: Plot) {
    if (plot.unlocked) return toast(t("plotUnlocked"));
    const cost = getPlotUnlockCost(plot.id);
    const requiredLevel = getPlotUnlockLevel(plot.id);
    const currentLevel = getLevel(save.exp);

    if (currentLevel < requiredLevel)
      return toast(`${t("levelInsufficient")} ${requiredLevel}${t("currentLevel")} ${currentLevel} ${t("levelText")}`);
    if (save.coins < cost) return toast(`${t("insufficientCoins")}，需要 ${cost} ${t("coins")}`);

    setSave((s: GameSave) => ({
      ...s,
      coins: s.coins - cost,
      plots: replacePlot(s.plots, { ...plot, unlocked: true }),
    }));
    toast(`${t("plotUnlockedSuccess")}${plot.id + 1}，${t("unlockCost")} ${cost} ${t("coins")}`);
  }

  // 重置（恢复到默认配置）
  function resetSave() {
    if (!confirm(t("resetConfirm"))) return;
    const resetData = createDefaultSave();
    localStorage.setItem("social-farm-save-v1", JSON.stringify(resetData));
    setSave(resetData);
    toast(t("resetSuccess"));
  }

  // 每日签到
  function performCheckin() {
    if (hasCheckedInToday(save.checkinLastDate)) {
      return toast(t("checkinAlready"));
    }
    const coins = dailyCheckin();
    const today = getTodayDateStr();
    const yearMonth = getYearMonthStr();
    const day = new Date().getDate();

    setSave((s: GameSave) => {
      const nextRecords = { ...(s.checkinRecords || {}) };
      if (!nextRecords[yearMonth]) nextRecords[yearMonth] = [];
      nextRecords[yearMonth] = [...nextRecords[yearMonth], day];

      return {
        ...s,
        coins: s.coins + coins,
        checkinLastDate: today,
        checkinRecords: nextRecords,
      };
    });

    toast(`${t("checkinSuccess")} ${coins} ${t("coins")}！`);
  }

  // 弹窗：商店 / 银行 / Gluck / 签到 / 集字 / 机器人 / 宠物
  const [shopOpen, setShopOpen] = useState(false);
  const [bankOpen, setBankOpen] = useState(false);
  const [gluckOpen, setGluckOpen] = useState(false);
  const [checkinOpen, setCheckinOpen] = useState(false);
  const [letterCollectionOpen, setLetterCollectionOpen] = useState(false);
  const [robotOpen, setRobotOpen] = useState(false);
  const [petOpen, setPetOpen] = useState(false);

  // 处理机器人订阅
  function handleRobotSubscribe(name: string, email: string, acceptMarketing: boolean) {
    // 实际项目中这里应该调用后端API
    console.log("Subscribe:", { name, email, acceptMarketing });
    setSave((s: GameSave) => ({ ...s, robotSubscribed: true }));
    setRobotOpen(false);
    toast(t("subscribeSuccess"));
  }

  /**********************
   * 渲染                *
   **********************/
  return (
    <div className="min-h-screen relative text-slate-800 font-sans">
      <Header />
      <AutumnBackground />
      <div className="relative z-10" style={{ cursor: cursorForTool(save.tool) }}>
        <TopBar
          coins={save.coins}
          zeta={save.zeta}
          tickets={save.tickets}
          exp={save.exp}
          level={lvl}
          onProtect={protectFarm}
          lang={lang as Language}
          setLang={setLang}
          t={t}
        />
        <Banner t={t} />
        <div className="max-w-6xl mx-auto px-3 pb-24">
          <div className="grid md:grid-cols-12 gap-3 mt-3">
            <div className="md:col-span-9">
              <Board
                plots={save.plots}
                onPlotClick={p => {
                  if (!p.unlocked) return unlockPlot(p);
                  switch (save.tool) {
                    case "plant":
                      plant(p);
                      break;
                    case "harvest":
                      harvest(p);
                      break;
                    case "water":
                      water(p);
                      break;
                    case "weed":
                      weed(p);
                      break;
                    case "pesticide":
                      pesticide(p);
                      break;
                    case "fertilizer":
                      applyFertilizer(p);
                      break;
                    case "shovel":
                      shovel(p);
                      break;
                    default:
                      break;
                  }
                }}
                onHarvest={harvest}
                onShovel={shovel}
                onUnlock={unlockPlot}
              />
            </div>
            <div className="md:col-span-3">
              <Toolbox
                current={save.tool}
                setTool={setTool}
                fertilizer={save.fertilizer || 0}
                robotSubscribed={save.robotSubscribed || false}
              />
              <BagPanel
                inventory={save.inventory}
                fruits={save.fruits || {}}
                selected={save.selectedSeed}
                onSelect={selectSeed}
              />
              <div className="grid grid-cols-2 gap-2 mt-3">
                <button
                  className="w-full text-sm px-3 py-2 rounded-xl border bg-white/90 backdrop-blur hover:bg-white"
                  onClick={() => setShopOpen(true)}
                >
                  🛒 {t("shop")}
                </button>
                <button
                  className="w-full text-sm px-3 py-2 rounded-xl border bg-white/90 backdrop-blur hover:bg-white"
                  onClick={() => setBankOpen(true)}
                >
                  🏦 {t("bank")}
                </button>
              </div>
              <div className="grid grid-cols-2 gap-2 mt-2">
                <button
                  className="w-full text-sm px-3 py-2 rounded-xl border bg-white/90 backdrop-blur hover:bg-white"
                  onClick={() => setGluckOpen(true)}
                >
                  🎰 Gluck
                </button>
                <button
                  className={`w-full text-sm px-3 py-2 rounded-xl border backdrop-blur hover:bg-white ${hasCheckedInToday(save.checkinLastDate) ? "bg-emerald-50 border-emerald-200" : "bg-white"}`}
                  onClick={() => setCheckinOpen(true)}
                >
                  📅 {t("checkin")}
                </button>
              </div>
              <div className="grid grid-cols-1 gap-2 mt-2">
                <button
                  className="w-full text-sm px-3 py-2 rounded-xl border bg-white/90 backdrop-blur hover:bg-white"
                  onClick={() => setLetterCollectionOpen(true)}
                >
                  {t("letterCollection")}
                </button>
              </div>
              <SettingsPanel onReset={resetSave} />
            </div>
          </div>
        </div>
        <ShopModal
          open={shopOpen}
          onClose={() => setShopOpen(false)}
          buySeed={buySeed}
          buyFertilizer={buyFertilizer}
          sellFruit={(id: string, count: number) => {
            const seed = SEEDS[id];
            if (!seed) return toast(t("unknownCrop"));
            const fruits = save.fruits || {};
            const available = fruits[id] || 0;
            if (available < count) return toast(t("insufficientFruits"));

            // 商店只能卖成金币
            const income = seed.sell * count;
            setSave((s: GameSave) => ({
              ...s,
              coins: s.coins + income,
              fruits: { ...s.fruits, [id]: (s.fruits[id] || 0) - count },
            }));
            toast(`${t("sold")} ${seed.name} ×${count}，${t("obtained")} ${income} ${t("coins")}`);
          }}
          fruits={save.fruits || {}}
        />
        <BankModal
          open={bankOpen}
          onClose={() => setBankOpen(false)}
          coins={save.coins}
          onExchange={(amount: number, targetCurrency: CurrencyType) => {
            if (save.coins < amount) return toast(t("insufficientCoins"));
            const exchangeRate = targetCurrency === "zeta" ? ZETA_EXCHANGE_RATE : TICKET_EXCHANGE_RATE;
            const exchangeAmount = Math.floor(amount / exchangeRate);
            const minAmount = targetCurrency === "zeta" ? ZETA_EXCHANGE_RATE : TICKET_EXCHANGE_RATE;
            if (exchangeAmount < 1) return toast(`${t("exchangeFailed")}${minAmount}${t("coins")}`);

            setSave((s: GameSave) => ({
              ...s,
              coins: s.coins - amount,
              [targetCurrency]: (s[targetCurrency] || 0) + exchangeAmount,
            }));

            const currencyName = targetCurrency === "zeta" ? "ZETA" : currentLanguage === "ko" ? "티켓" : "奖券";
            toast(`${t("exchangeSuccess")}${amount} ${t("coins")} → ${exchangeAmount} ${currencyName}`);
          }}
        />
        <GluckModal
          open={gluckOpen}
          onClose={() => setGluckOpen(false)}
          onDraw={(n: number) => doGluck(n)}
          tickets={save.tickets}
        />
        <CheckinModal
          open={checkinOpen}
          onClose={() => setCheckinOpen(false)}
          onCheckin={performCheckin}
          checkinLastDate={save.checkinLastDate}
          checkinRecords={save.checkinRecords || {}}
        />
        <LetterCollectionModal
          open={letterCollectionOpen}
          onClose={() => setLetterCollectionOpen(false)}
          collectedLetters={save.collectedLetters || {}}
          redeemedRewards={save.redeemedRewards || []}
          onRedeem={(rewardId: string) => {
            if (save.redeemedRewards.includes(rewardId)) {
              toast(t("alreadyRedeemed"));
              return;
            }
            setSave((s: GameSave) => ({
              ...s,
              redeemedRewards: [...(s.redeemedRewards || []), rewardId],
            }));
            toast(t("redeemSuccess"));
          }}
        />
        <RobotModal
          open={robotOpen || save.tool === "robot"}
          onClose={() => {
            setRobotOpen(false);
            setTool("harvest");
          }}
          onSubscribe={handleRobotSubscribe}
          subscribed={save.robotSubscribed || false}
        />
        <PetModal
          open={petOpen || save.tool === "pet"}
          onClose={() => {
            setPetOpen(false);
            setTool("harvest");
          }}
          pets={save.pets || {}}
          onBuyPet={buyPet}
        />
        <ToastArea />
      </div>
    </div>
  );

  // ====== Gluck 逻辑 ======
  function doGluck(count = 1) {
    const cost = count; // 每抽 1 张奖券
    if (save.tickets < cost) return toast(t("ticketInsufficient"));

    interface GluckReward {
      type: string;
      id: string;
      qty: number;
    }

    const rewards: GluckReward[] = [];
    for (let i = 0; i < count; i++) {
      const r = Math.random();

      // 根据随机数选择种子池
      let selectedPool = null;
      for (const pool of GLUCK_SEED_POOLS) {
        if (r <= pool.prob) {
          selectedPool = pool;
          break;
        }
      }

      if (selectedPool) {
        // 从该池中随机选择一个种子
        const seedId = selectedPool.seeds[Math.floor(Math.random() * selectedPool.seeds.length)];
        // 随机数量
        const qty = selectedPool.minQty + Math.floor(Math.random() * (selectedPool.maxQty - selectedPool.minQty + 1));
        rewards.push({ type: "seed", id: seedId, qty });
      }
    }

    // 应用奖励
    setSave((s: GameSave) => {
      const next = { ...s, tickets: s.tickets - cost, inventory: { ...(s.inventory || {}) } };
      const seedGains: string[] = [];
      rewards.forEach((rw: GluckReward) => {
        if (rw.type === "seed") {
          next.inventory[rw.id] = (next.inventory[rw.id] || 0) + rw.qty;
          seedGains.push(`${SEEDS[rw.id].emoji} ${SEEDS[rw.id].name}×${rw.qty}`);
        }
      });

      // 汇总提示
      if (seedGains.length > 0) {
        const separator = currentLanguage === "en" ? ", " : currentLanguage === "ko" ? ", " : "、";
        toast(`${t("drew")}${seedGains.join(separator)}`);
      } else {
        toast(t("nextTimeLuck"));
      }
      return next;
    });
  }
}

/**********************
 * 组件类型定义        *
 **********************/

interface BoardProps {
  plots: Plot[];
  onPlotClick: (plot: Plot) => void;
  onHarvest: (plot: Plot) => void;
  onShovel: (plot: Plot) => void;
  onUnlock: (plot: Plot) => void;
}

interface PlotTileProps {
  plot: Plot;
  onClick: () => void;
  onHarvest: () => void;
  onShovel: () => void;
  onUnlock: () => void;
}

interface BadgeProps {
  text: string;
  color: string;
}

interface ToolboxProps {
  current: ToolType;
  setTool: (tool: ToolType) => void;
  fertilizer: number;
  robotSubscribed: boolean;
}

interface BagPanelProps {
  inventory: Record<string, number>;
  fruits: Record<string, number>;
  selected: string | null;
  onSelect: (id: string) => void;
}

interface ShopModalProps {
  open: boolean;
  onClose: () => void;
  buySeed: (id: string, count: number) => void;
  buyFertilizer: (count: number) => void;
  sellFruit: (id: string, count: number) => void;
  fruits: Record<string, number>;
}

interface BankModalProps {
  open: boolean;
  onClose: () => void;
  coins: number;
  onExchange: (amount: number, targetCurrency: CurrencyType) => void;
}

interface GluckModalProps {
  open: boolean;
  onClose: () => void;
  onDraw: (count: number) => void;
  tickets: number;
}

interface CheckinModalProps {
  open: boolean;
  onClose: () => void;
  onCheckin: () => void;
  checkinLastDate: string;
  checkinRecords: Record<string, number[]>;
}

interface LetterCollectionModalProps {
  open: boolean;
  onClose: () => void;
  collectedLetters: Record<string, number>;
  redeemedRewards: string[];
  onRedeem: (rewardId: string) => void;
}

interface SettingsPanelProps {
  onReset: () => void;
}

interface RobotModalProps {
  open: boolean;
  onClose: () => void;
  onSubscribe: (name: string, email: string, acceptMarketing: boolean) => void;
  subscribed: boolean;
}

interface PetModalProps {
  open: boolean;
  onClose: () => void;
  pets: Record<string, boolean>;
  onBuyPet: (petId: string) => void;
}

/**********************
 * 子组件              *
 **********************/

function Board({ plots, onPlotClick, onHarvest, onShovel, onUnlock }: BoardProps) {
  return (
    <div className="grid grid-cols-3 sm:grid-cols-4 lg:grid-cols-6 gap-2">
      {plots.map((p: Plot) => (
        <PlotTile
          key={p.id}
          plot={p}
          onClick={() => onPlotClick(p)}
          onHarvest={() => onHarvest(p)}
          onShovel={() => onShovel(p)}
          onUnlock={() => onUnlock(p)}
        />
      ))}
    </div>
  );
}

function PlotTile({ plot, onClick, onUnlock }: PlotTileProps) {
  const st = stageOf(plot);
  const seed = plot.seedId ? SEEDS[plot.seedId] : null;
  const timeNext = timeToNextStage(plot);
  const isProtected = (plot.protectedUntil || 0) > now();

  // 如果未解锁，显示开垦界面
  if (!plot.unlocked) {
    const unlockCost = getPlotUnlockCost(plot.id);
    const requiredLevel = getPlotUnlockLevel(plot.id);
    return (
      <div className="relative select-none p-2 rounded-3xl border shadow-sm bg-gray-100/50 opacity-60">
        <div className="flex items-center justify-between text-xs text-slate-500 mb-1">
          <span>#{plot.id + 1}</span>
          <span className="text-slate-400">🔒 {t("locked")}</span>
        </div>
        <div className="flex flex-col items-center py-6 h-32 justify-center">
          <div className="text-3xl opacity-50">🔒</div>
          <div className="text-sm mt-2 font-medium text-slate-600">{t("wasteland")}</div>
          <div className="text-[10px] mt-1 text-slate-500">
            {t("needLevel")} {requiredLevel}
          </div>
        </div>
        <button
          className="w-full mt-2 text-sm py-1.5 rounded-2xl border bg-white/90 hover:bg-white text-slate-700"
          onClick={e => {
            e.stopPropagation();
            if (onUnlock) onUnlock();
          }}
        >
          💰 {unlockCost} 金币
        </button>
      </div>
    );
  }

  // 计算实际生长时间，检查是否有未完成的浇水/除草需求
  const actualElapsed = plot.seedId && plot.plantedAt ? now() - plot.plantedAt - (plot.pausedDuration || 0) : 0;
  const hasActiveWaterReq = (plot.waterRequirements || []).some(r => !r.done && actualElapsed >= r.time);
  const hasActiveWeedReq = (plot.weedRequirements || []).some(r => !r.done && actualElapsed >= r.time);

  const labelByStage: Record<string, string> = {
    [STAGE.EMPTY]: t("empty"),
    [STAGE.SEED]: t("seeding"),
    [STAGE.SPROUT]: t("sprout"),
    [STAGE.GROWING]: t("growing"),
    [STAGE.RIPE]: t("ripe"),
    [STAGE.WITHER]: t("wither"),
  };

  const stageEmoji: Record<string, string> = {
    [STAGE.EMPTY]: "⬜",
    [STAGE.SEED]: "🌱",
    [STAGE.SPROUT]: "🌿",
    [STAGE.GROWING]: "🌾",
    [STAGE.RIPE]: seed?.emoji ?? "🍀",
    [STAGE.WITHER]: "🪦",
  };

  return (
    <div
      onClick={onClick}
      className="relative select-none p-2 rounded-3xl border shadow-sm hover:shadow transition"
      style={soilTextureStyle()}
    >
      <div className="flex items-center justify-between text-xs text-amber-900/85">
        <span>#{plot.id + 1}</span>
        {isProtected && <span className="text-white">🛡️{t("protect")}</span>}
      </div>
      <div className="flex flex-col items-center py-3 h-32 justify-center relative">
        <div className="text-4xl">{st === STAGE.RIPE && seed ? seed.emoji : stageEmoji[st]}</div>
        <div className="text-sm mt-1 font-medium text-amber-950">{seed ? seed.name : t("empty")}</div>
        <div className="text-xs text-amber-900/70 h-4">{seed ? labelByStage[st] : ""}</div>
        {seed && st === STAGE.RIPE && (
          <div className="text-[11px] text-amber-900/60 mt-1">
            {t("witherIn")}：{fmtTime(timeNext)}
          </div>
        )}
      </div>
      {(plot.weeds || plot.pests || hasActiveWaterReq || hasActiveWeedReq) && (
        <div className="absolute bottom-12 left-0 right-0 flex gap-1 justify-center pointer-events-none z-20">
          {hasActiveWaterReq && <Badge text={t("needWater")} color="bg-sky-700" />}
          {hasActiveWeedReq && <Badge text={t("needWeed")} color="bg-lime-700" />}
          {plot.weeds && !hasActiveWeedReq && <Badge text={t("weeds")} color="bg-lime-700" />}
          {plot.pests && <Badge text={t("pests")} color="bg-yellow-700" />}
        </div>
      )}
      <div className="relative w-full mt-2">
        <button
          className="w-full text-sm py-1.5 rounded-2xl border bg-white/90 hover:bg-white relative overflow-hidden"
          onClick={onClick}
        >
          {seed && st !== STAGE.WITHER && st !== STAGE.EMPTY && st !== STAGE.RIPE && (
            <div className="absolute inset-0 bg-green-100/30 rounded-2xl">
              <div
                className="absolute inset-0 bg-green-400/40 rounded-2xl transition-all"
                style={{
                  width: `${(() => {
                    const elapsed = now() - (plot.plantedAt || 0) - (plot.pausedDuration || 0);
                    const [s1, s2, s3] = seed.stages;
                    if (st === STAGE.SEED) {
                      return Math.max(0, Math.min(100, (elapsed / s1) * 100));
                    } else if (st === STAGE.SPROUT) {
                      return Math.max(0, Math.min(100, ((elapsed - s1) / (s2 - s1)) * 100));
                    } else if (st === STAGE.GROWING) {
                      return Math.max(0, Math.min(100, ((elapsed - s2) / (s3 - s2)) * 100));
                    }
                    return 0;
                  })()}%`,
                }}
              />
            </div>
          )}
          <span className="relative z-10">
            {(() => {
              if (st === STAGE.EMPTY) return t("nothingToDo");
              if (st === STAGE.RIPE) return t("harvest");
              if (st === STAGE.WITHER) return t("remove");
              return `${fmtTime(timeNext)}`;
            })()}
          </span>
        </button>
      </div>
    </div>
  );
}

function Badge({ text, color }: BadgeProps) {
  return <div className={`text-[10px] text-white px-1.5 py-0.5 rounded ${color}`}>{text}</div>;
}

function Toolbox({ current, setTool, fertilizer, robotSubscribed }: ToolboxProps) {
  const tools = [
    { id: "harvest", labelKey: "harvestTool", emoji: "🧺" },
    { id: "plant", labelKey: "plantTool", emoji: "🌱" },
    { id: "water", labelKey: "waterTool", emoji: "💧" },
    { id: "weed", labelKey: "weedTool", emoji: "🌿" },
    { id: "pesticide", labelKey: "pesticideTool", emoji: "🪲" },
    { id: "fertilizer", labelKey: "fertilizerTool", emoji: "🌾", count: fertilizer || 0 },
    { id: "shovel", labelKey: "shovelTool", emoji: "🪓" },
    { id: "robot", labelKey: "robotTool", emoji: "🤖", subscribed: robotSubscribed },
    { id: "pet", labelKey: "petTool", emoji: "🐶" },
  ];
  return (
    <div className="bg-white/90 backdrop-blur rounded-2xl p-3 border shadow-sm">
      <div className="font-semibold mb-2">{t("toolbox")}</div>
      <div className="grid grid-cols-6 gap-2">
        {tools.map(tool => (
          <div key={tool.id} className="relative group">
            <button
              onClick={() => setTool(tool.id as ToolType)}
              className={`w-full aspect-square rounded-xl border flex items-center justify-center text-2xl relative ${current === tool.id ? "border-emerald-400 bg-emerald-50" : "bg-white hover:bg-slate-50"}`}
              title={t(tool.labelKey)}
            >
              {tool.emoji}
              {(tool.count || 0) > 0 && (
                <div className="absolute bottom-0 left-0 right-0 h-1/5 bg-amber-800/80 flex items-center justify-center rounded-b-xl pointer-events-none z-20">
                  <span className="text-[7px] font-bold text-white">{tool.count}</span>
                </div>
              )}
              {tool.subscribed && <div className="absolute top-0 right-0 text-emerald-600 text-xs">✓</div>}
            </button>
            <div className="pointer-events-none absolute z-10 hidden group-hover:block left-1/2 -translate-x-1/2 mt-1 w-28 p-1.5 rounded-lg border bg-white shadow text-center">
              <div className="text-xs text-slate-700">
                {tool.emoji} {t(tool.labelKey)}
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function BagPanel({ inventory, fruits, selected, onSelect }: BagPanelProps) {
  const entries = Object.values(SEEDS);

  return (
    <div className="bg-white/90 backdrop-blur rounded-2xl p-3 border shadow-sm mt-3">
      <div className="font-semibold mb-2">{t("bag")}</div>
      {/* 种子区域 */}
      <div className="mb-3">
        <div className="text-xs text-slate-500 mb-1">{t("seeds")}</div>
        <div className="grid grid-cols-6 gap-2">
          {entries.map(s => {
            const count = inventory[s.id] ?? 0;
            const hasCount = count > 0;
            return (
              <div key={s.id} className="relative group">
                <button
                  onClick={() => hasCount && onSelect(s.id)}
                  disabled={!hasCount}
                  className={`w-full aspect-square rounded-xl border flex items-center justify-center text-2xl relative overflow-hidden ${
                    !hasCount
                      ? "bg-gray-100 opacity-50 border-gray-200 cursor-not-allowed"
                      : selected === s.id
                        ? "border-emerald-400 bg-emerald-50"
                        : "bg-white hover:bg-slate-50"
                  }`}
                  title={`${s.name}`}
                >
                  {hasCount && <div className="absolute inset-0 bg-amber-900/20 pointer-events-none" />}
                  <span className={`relative z-10 ${!hasCount ? "opacity-40" : ""}`}>{s.emoji}</span>
                  {count > 0 && (
                    <div className="absolute bottom-0 left-0 right-0 h-1/5 bg-amber-800/80 flex items-center justify-center rounded-b-xl pointer-events-none z-20">
                      <span className="text-[7px] font-bold text-white">{count}</span>
                    </div>
                  )}
                </button>
                {/* 悬浮说明 */}
                <div className="pointer-events-none absolute z-10 hidden group-hover:block left-1/2 -translate-x-1/2 mt-1 w-44 p-2 rounded-lg border bg-white shadow">
                  <div className="text-sm font-medium">
                    {s.name} <span className="text-xs text-slate-400">Lv{s.levelReq}</span>
                  </div>
                  <div className="text-xs text-slate-600">
                    {t("cost")} {s.cost}｜{t("sell")} {s.sell}｜{t("exp")} +{s.exp}
                  </div>
                  <div className="text-[11px] text-slate-500">
                    {t("mature")} {fmtTime(s.stages[2])}，{t("witherAfter")} {fmtTime(s.witherAfter)} {t("after")}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
      {/* 果实区域 */}
      <div>
        <div className="text-xs text-slate-500 mb-1">{t("fruits")}</div>
        <div className="grid grid-cols-6 gap-2">
          {entries.map(s => {
            const count = fruits[s.id] ?? 0;
            const hasCount = count > 0;
            return (
              <div key={s.id} className="relative group">
                <div
                  className={`w-full aspect-square rounded-xl border flex items-center justify-center text-2xl relative ${
                    !hasCount ? "bg-gray-100 opacity-50 border-gray-200" : "bg-white"
                  }`}
                  title={`${s.name}`}
                >
                  <span className={!hasCount ? "opacity-40" : ""}>{s.emoji}</span>
                  {count > 0 && (
                    <div className="absolute bottom-0 left-0 right-0 h-1/5 bg-amber-800/80 flex items-center justify-center rounded-b-xl pointer-events-none z-20">
                      <span className="text-[7px] font-bold text-white">{count}</span>
                    </div>
                  )}
                </div>
                {/* 悬浮说明 */}
                {hasCount && (
                  <div className="pointer-events-none absolute z-10 hidden group-hover:block left-1/2 -translate-x-1/2 mt-1 w-44 p-2 rounded-lg border bg-white shadow">
                    <div className="text-sm font-medium">{s.name}</div>
                    <div className="text-xs text-slate-600">
                      {t("sellPrice")} {s.sell} {t("coins")}
                    </div>
                    <div className="text-[11px] text-slate-500">{t("sellAtShop")}</div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

function ShopModal({ open, onClose, buySeed, buyFertilizer, sellFruit, fruits }: ShopModalProps) {
  const [tab, setTab] = useState<ShopTab>("buy"); // 'buy', 'buyFertilizer' or 'sell'
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

function BankModal({ open, onClose, coins, onExchange }: BankModalProps) {
  const [amount, setAmount] = useState(ZETA_EXCHANGE_RATE);
  const [targetCurrency, setTargetCurrency] = useState<CurrencyType>("zeta");
  if (!open) return null;

  // 使用导入的汇率常量
  const exchangeRate = targetCurrency === "zeta" ? ZETA_EXCHANGE_RATE : TICKET_EXCHANGE_RATE;
  const minAmount = targetCurrency === "zeta" ? ZETA_EXCHANGE_RATE : TICKET_EXCHANGE_RATE;
  // 确保金额不小于最小金额
  const validAmount = Math.max(amount, minAmount);
  const exchangeAmount = Math.floor(validAmount / exchangeRate);

  // 当切换货币时，调整金额
  const handleCurrencyChange = (currency: CurrencyType) => {
    setTargetCurrency(currency);
    const newMin = currency === "zeta" ? 10 : 70;
    if (amount < newMin) {
      setAmount(newMin);
    }
  };

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
              🎟️ {currentLanguage === "ko" ? "티켓" : currentLanguage === "en" ? "Tickets" : "奖券"}
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
              {currentLanguage === "en" ? "All" : currentLanguage === "ko" ? "전체" : "全部"}
            </button>
          </div>
        </div>
        <div className="text-sm text-slate-700 mb-3 p-3 bg-slate-50 rounded-lg">
          <div>
            {exchangeRate} {t("coins")} {t("exchangeRate")}{" "}
            {targetCurrency === "zeta"
              ? "ZETA"
              : currentLanguage === "ko"
                ? "티켓"
                : currentLanguage === "en"
                  ? "Ticket"
                  : "奖券"}
          </div>
          <div className="font-semibold mt-1">
            {validAmount} {t("coins")} → {exchangeAmount}{" "}
            {targetCurrency === "zeta"
              ? "ZETA"
              : currentLanguage === "ko"
                ? "티켓"
                : currentLanguage === "en"
                  ? "Tickets"
                  : "奖券"}
          </div>
        </div>
        <div className="flex gap-2">
          <button
            onClick={() => {
              if (coins < validAmount) {
                toast(t("insufficientCoins"));
                return;
              }
              if (exchangeAmount < 1) {
                toast(`${t("exchangeFailed")}${minAmount}${t("coins")}`);
                return;
              }
              onExchange(validAmount, targetCurrency);
              setAmount(minAmount);
            }}
            className="flex-1 px-3 py-1.5 rounded-lg border bg-white hover:bg-slate-50"
            disabled={coins < validAmount || exchangeAmount < 1}
          >
            {currentLanguage === "en" ? "Exchange" : currentLanguage === "ko" ? "교환" : "兑换"}
          </button>
          <button onClick={onClose} className="px-3 py-1.5 rounded-lg border bg-white hover:bg-slate-50">
            {t("close")}
          </button>
        </div>
      </div>
    </div>
  );
}

function GluckModal({ open, onClose, onDraw, tickets }: GluckModalProps) {
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

function CheckinModal({ open, onClose, onCheckin, checkinLastDate, checkinRecords }: CheckinModalProps) {
  if (!open) return null;
  const today = new Date();
  const year = today.getFullYear();
  const month = today.getMonth();
  const firstDayOfWeek = new Date(year, month, 1).getDay();
  const daysInMonth = getAllDaysInMonth(year, month);
  const yearMonth = getYearMonthStr();
  const checkedDays = checkinRecords[yearMonth] || [];
  const hasCheckedIn = hasCheckedInToday(checkinLastDate);

  let weekdays = ["日", "一", "二", "三", "四", "五", "六"];
  if (currentLanguage === "en") weekdays = ["S", "M", "T", "W", "T", "F", "S"];
  if (currentLanguage === "ko") weekdays = ["日", "月", "火", "水", "木", "金", "土"];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
      <div className="bg-white w-[min(600px,95vw)] rounded-2xl border shadow-lg p-4">
        <div className="flex items-center justify-between mb-2">
          <div className="font-semibold text-lg">{t("checkin")}</div>
          <button onClick={onClose} className="text-slate-500 hover:text-slate-700">
            ✖
          </button>
        </div>
        <div className="text-sm text-slate-600 mb-3">
          {hasCheckedIn ? (
            <span className="text-emerald-600">✓ {t("checkinTodayCompleted")}</span>
          ) : (
            <span>{t("checkinClickToGet")}</span>
          )}
        </div>
        <div className="mb-4">
          <div className="font-medium mb-2">
            {currentLanguage === "en"
              ? `${["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"][month]} ${year}`
              : currentLanguage === "ko"
                ? `${year}년 ${month + 1}월`
                : `${year}年${month + 1}月`}
          </div>
          <div className="grid grid-cols-7 gap-1">
            {weekdays.map(day => (
              <div key={day} className="text-center text-xs text-slate-500 py-1">
                {day}
              </div>
            ))}
            {Array.from({ length: firstDayOfWeek }).map((_, i) => (
              <div key={`empty-${i}`} />
            ))}
            {Array.from({ length: daysInMonth }).map((_, i) => {
              const dayNum = i + 1;
              const isChecked = checkedDays.includes(dayNum);
              const isToday = dayNum === today.getDate();
              return (
                <div
                  key={dayNum}
                  className={`aspect-square rounded-lg border flex items-center justify-center text-xs relative ${
                    isChecked
                      ? "bg-emerald-100 border-emerald-300 text-emerald-700"
                      : isToday
                        ? "bg-amber-100 border-amber-300 text-amber-700"
                        : "bg-slate-50 border-slate-200 text-slate-600"
                  }`}
                >
                  {dayNum}
                  {isChecked && <div className="absolute top-0 right-0 text-emerald-600">✓</div>}
                </div>
              );
            })}
          </div>
        </div>
        <div className="flex gap-2">
          <button
            onClick={() => {
              if (!hasCheckedIn) {
                onCheckin();
              }
            }}
            disabled={hasCheckedIn}
            className={`flex-1 px-3 py-1.5 rounded-lg border ${hasCheckedIn ? "bg-slate-100 text-slate-400 cursor-not-allowed" : "bg-emerald-100 hover:bg-emerald-200 text-emerald-700"}`}
          >
            {hasCheckedIn ? t("checkinAlready") : t("checkinNow")}
          </button>
          <button onClick={onClose} className="px-3 py-1.5 rounded-lg border bg-white hover:bg-slate-50">
            {t("close")}
          </button>
        </div>
      </div>
    </div>
  );
}

function LetterCollectionModal({
  open,
  onClose,
  collectedLetters,
  redeemedRewards,
  onRedeem,
}: LetterCollectionModalProps) {
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
                        <div className="text-xs text-slate-500">等值 100U</div>
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

function SettingsPanel({ onReset }: SettingsPanelProps) {
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

// === 机器人订阅模态框 ===
function RobotModal({ open, onClose, onSubscribe, subscribed }: RobotModalProps) {
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
                    toast(t("pleaseFillInfo"));
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

// === 宠物商店模态框 ===
function PetModal({ open, onClose, pets, onBuyPet }: PetModalProps) {
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

/**********************
 * 轻量 Toast 系统     *
 **********************/
interface ToastItem {
  id: number;
  text: string;
}

const toasts: ToastItem[] = [];
let toastId = 1;
const listeners: Array<(list: ToastItem[]) => void> = [];

function toast(text: string) {
  const item: ToastItem = { id: toastId++, text };
  toasts.push(item);
  listeners.forEach(l => l([...toasts]));
  setTimeout(() => {
    const idx = toasts.findIndex(t => t.id === item.id);
    if (idx >= 0) {
      toasts.splice(idx, 1);
      listeners.forEach(l => l([...toasts]));
    }
  }, 2600); // 增加时间以配合动画
}

function ToastArea() {
  const [visibleToasts, setVisibleToasts] = useState<ToastItem[]>([]);
  useEffect(() => {
    const l = (list: ToastItem[]) => setVisibleToasts([...list]);
    listeners.push(l);
    return () => {
      const i = listeners.indexOf(l);
      if (i >= 0) listeners.splice(i, 1);
    };
  }, []);

  return (
    <div className="fixed bottom-4 left-1/2 -translate-x-1/2 z-50 space-y-2">
      {visibleToasts.map((t, idx) => {
        const isLatest = idx === visibleToasts.length - 1;
        return (
          <div
            key={t.id}
            className="relative px-3 py-2 rounded-xl text-white text-sm shadow-lg backdrop-blur overflow-hidden"
            style={{
              animation: isLatest
                ? "toastFadeIn 0.3s ease-out, toastShine 1s ease-in-out"
                : "toastFadeOut 0.3s ease-in",
              background: isLatest
                ? `linear-gradient(45deg, rgba(15, 23, 42, 0.9), rgba(15, 23, 42, 0.9)), linear-gradient(90deg, transparent 30%, rgba(255,255,255,0.3) 50%, transparent 70%), linear-gradient(45deg, rgba(15, 23, 42, 0.9), rgba(15, 23, 42, 0.9))`
                : `rgba(15, 23, 42, 0.9)`,
              backgroundSize: isLatest ? "100%, 200%, 100%" : "100%",
            }}
          >
            <span className="relative z-10">{t.text}</span>
          </div>
        );
      })}
    </div>
  );
}

// ====== dev=1：测试（仅新增，不修改原有） ======
(function DevTests() {
  if (typeof window === "undefined") return;
  const isDev = new URLSearchParams(window.location.search).get("dev") === "1";
  if (!isDev) return;
  try {
    const results: any[] = [];
    const add = (name: string, cond: boolean, extra = "") => {
      results.push({ name, pass: !!cond, extra });
    };
    add("cursorForTool returns string", typeof cursorForTool("plant") === "string");
    const seed = SEEDS.radish;
    const t0 = 1000;
    const plantedAt = t0 - (seed.stages[0] - 1);
    const fakePlot: any = {
      id: 0,
      seedId: "radish",
      plantedAt,
      fertilized: false,
      weeds: false,
      pests: false,
      unlocked: true,
      wateredAt: null,
      waterRequirements: [],
      weedRequirements: [],
      pausedDuration: 0,
      protectedUntil: 0,
    };
    add("yieldAmount >=1", yieldAmount(fakePlot) >= 1);
    console.log("[DEV EXTRA TESTS]", results);
  } catch (e) {
    console.warn("Dev tests init failed", e);
  }
})();

// Next.js 页面导出
const Home: NextPage = () => {
  return <SocialFarmGame />;
};

export default Home;
