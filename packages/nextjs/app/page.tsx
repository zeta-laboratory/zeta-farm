"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import type { NextPage } from "next";
import { useAccount } from "wagmi";
import { AutumnBackground } from "~~/components/Layout/AutumnBackground";
import { Banner } from "~~/components/Layout/Banner";
// 导入布局组件
import { TopBar } from "~~/components/Layout/TopBar";
// 导入模态框组件
import {
  BankModal,
  CheckinModal,
  GluckModal,
  LetterCollectionModal,
  PetModal,
  RobotModal,
  SettingsPanel,
  ShopModal,
} from "~~/components/Modals";
// 导入常量配置
import { I18N } from "~~/constants/i18n";
// 导入 ID 映射工具
import { convertBackendStateToFrontend, frontendSeedToBackend } from "~~/constants/idMapping";
import { PETS } from "~~/constants/pets";
import { SEEDS } from "~~/constants/seeds";
// 导入 hooks
import { useGameAction } from "~~/hooks/useGameAction";
import { useGameState } from "~~/hooks/useGameState";
// 导入类型定义
import type { CurrencyType, GameSave, Language, Plot, ToolType } from "~~/types";
// 导入游戏工具函数
import {
  // 作物阶段相关
  STAGE, // UI 相关
  cursorForTool, // 签到相关
  fmtTime, // 等级相关
  getLevel, // 地块相关
  getPlotUnlockCost,
  getPlotUnlockLevel,
  hasCheckedInToday, // 时间相关
  now,
  soilTextureStyle,
  stageOf,
  timeToNextStage,
} from "~~/utils/game";

// Image assets live in public/corns/
// We use plain <img> here for simplicity and predictable sizing inside the game UI.

/**********************
 * 基础常量与工具函数 *
 **********************/

/**********************
 * 多语言系统          *
 **********************/
// 检测浏览器语言
function detectLanguage(): string {
  // 检查是否在浏览器环境
  if (typeof window === "undefined") {
    return "en"; // 服务器端默认中文
  }

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
let currentLanguage: string = "zh"; // 默认中文，会在组件挂载后更新
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
  // 钱包连接
  const { address, isConnected } = useAccount();

  // 使用 useRef 存储语言，避免重新渲染
  const langRef = useRef("zh"); // 初始默认中文
  const [, forceUpdate] = useState(0);

  // 初始化语言（仅在客户端执行）
  useEffect(() => {
    const initialLang = detectLanguage();
    langRef.current = initialLang;
    currentLanguage = initialLang;
    forceUpdate(prev => prev + 1);
  }, []);

  // 语言切换函数
  const setLang = useCallback((newLang: string) => {
    console.log("[Language] Switching to:", newLang);
    langRef.current = newLang;
    currentLanguage = newLang;
    // 只在浏览器环境中使用 localStorage
    if (typeof window !== "undefined") {
      localStorage.setItem("farm-language", newLang);
    }
    console.log("[Language] Switch complete");
    // 强制更新 UI 以反映语言变化
    forceUpdate(prev => prev + 1);
  }, []);

  // 游戏状态 - 初始化为空状态，等待从后端加载
  const [save, setSave] = useState<GameSave>({
    plots: Array(24)
      .fill(null)
      .map((_, i) => ({
        id: i,
        unlocked: i < 6, // 默认前6块地解锁
        seedId: null,
        plantedAt: null,
        fertilized: false,
        pests: false,
        waterRequirements: [],
        weedRequirements: [],
        pausedDuration: 0,
        pausedAt: null,
        protectedUntil: null,
        lastPestCheckAt: null,
        matureAt: null,
        witheredAt: null,
        stage: "empty",
      })),
    inventory: {},
    coins: 0,
    zeta: 0,
    tickets: 0,
    exp: 0,
    tool: "harvest" as ToolType,
    selectedSeed: null,
    fruits: {},
    lastLogin: now(),
    checkinLastDate: "",
    checkinRecords: {},
    collectedLetters: {},
    redeemedRewards: [],
    fertilizer: 0,
    pets: {},
    robotSubscribed: false,
    // protection mechanic removed
    __testingBoostApplied: false,
  });

  // ========== 游戏操作回调（使用 useCallback 避免重新渲染） ==========
  const handleGameActionSuccess = useCallback((backendState: any) => {
    // 转换后端数据为前端格式并更新游戏状态
    const frontendState = convertBackendStateToFrontend(backendState);
    setSave(prev => ({
      ...prev,
      ...frontendState,
    }));
  }, []);

  const handleGameActionError = useCallback((error: Error) => {
    console.error("Game action failed:", error);
    toast(error.message);
  }, []);

  const handleShowToast = useCallback((message: string) => {
    // message may be an i18n key (preferred) or a raw string
    try {
      const translated = t(message);
      toast(translated);
    } catch {
      toast(String(message));
    }
  }, []);

  // 游戏操作 hook
  const gameAction = useGameAction({
    onSuccess: handleGameActionSuccess,
    onError: handleGameActionError,
    showToast: handleShowToast,
  });

  // ========== ✅ 新：定时刷新游戏状态（10秒） ==========
  // 使用 useCallback 包装回调避免每次渲染都重新创建
  const handleGameStateSuccess = useCallback((state: Partial<GameSave>) => {
    console.log("[Game] State refreshed from backend");
    setSave(prev => ({ ...prev, ...state }));
  }, []);

  const handleGameStateError = useCallback((error: Error) => {
    console.error("[Game] State refresh failed:", error);
  }, []);

  const gameState = useGameState({
    address,
    enabled: isConnected && !!address,
    onSuccess: handleGameStateSuccess,
    onError: handleGameStateError,
  });

  // 监听钱包连接，初始加载用户数据
  useEffect(() => {
    if (!isConnected || !address) return;

    // 首次加载
    gameState
      .fetchGameState()
      .then(state => {
        if (state) {
          setSave(prev => ({ ...prev, ...state }));
          toast(`${t("welcomeBackLoaded")} ${address.slice(0, 6)}...${address.slice(-4)}`);
        }
      })
      .catch(error => {
        console.error("Failed to load user state:", error);
        toast(t("loadFailedDefault"));
      });
  }, [isConnected, address]); // gameState.fetchGameState 依赖已在 hook 中处理

  const lvl = useMemo(() => getLevel(save.exp), [save.exp]);

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

  // ========== 🚫 已废弃：本地时间流逝逻辑 ==========
  // 前端不再自行计算暂停、虫害等逻辑
  // 改由后端完全掌控，前端仅展示状态
  // 使用 useGameState hook 进行定时刷新
  /*
  useEffect(() => {
    const id = setInterval(() => {
      setSave((prev: any) => {
        // ... 旧的本地计算逻辑 ...
      });
    }, TICK_MS);
    return () => clearInterval(id);
  }, []);
  */

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

  // ========== Game Actions (Blockchain-based) ==========
  // 行为：播种
  async function plant(plot: Plot) {
    if (!isConnected || !address) return toast(t("pleaseConnectWallet"));
    if (!plot.unlocked) return toast(t("plotLocked"));
    if (!save.selectedSeed) return toast(t("selectSeedFirst"));
    if (plot.seedId) return toast(t("plotOccupied"));
    const sid = save.selectedSeed;
    if ((save.inventory[sid] || 0) <= 0) return toast(t("insufficientSeeds"));

    try {
      // 转换前端 seed ID 为后端 ID
      const backendSeedId = frontendSeedToBackend(sid);

      await gameAction.execute("plant", {
        plotId: plot.id,
        seedId: backendSeedId,
      });

      // onSuccess 回调会自动更新状态
      toast(`${t("planted")} ${SEEDS[sid as keyof typeof SEEDS].name}`);
    } catch (error) {
      // 错误已在 gameAction 中处理
      console.error("Plant failed:", error);
    }
  }

  // 行为：收获
  async function harvest(plot: Plot) {
    if (!isConnected || !address) return toast(t("pleaseConnectWallet"));
    if (!plot.unlocked) return;
    if (!plot.seedId) return;
    const st = stageOf(plot);
    if (st !== STAGE.RIPE) return toast(t("notRipe"));

    // Prevent harvesting when pests are present
    if (plot.pests) return toast(t("cannotHarvestWithPests") || "Cannot harvest while pests are present");

    try {
      await gameAction.execute("harvest", {
        plotId: plot.id,
      });

      // onSuccess 回调会自动更新状态
      const seed = SEEDS[plot.seedId as keyof typeof SEEDS];
      toast(`${t("harvested")} ${seed.name}`);
    } catch (error) {
      console.error("Harvest failed:", error);
    }
  }

  // 行为：浇水
  async function water(plot: Plot) {
    if (!isConnected || !address) return toast(t("pleaseConnectWallet"));
    if (!plot.unlocked) return;
    if (!plot.seedId) return;

    try {
      await gameAction.execute("water", {
        plotId: plot.id,
      });

      // onSuccess 回调会自动更新状态
      toast(t("watered"));
    } catch (error) {
      console.error("Water failed:", error);
    }
  }

  // 行为：除草
  async function weed(plot: Plot) {
    if (!isConnected || !address) return toast(t("pleaseConnectWallet"));
    if (!plot.unlocked) return;
    if (!plot.seedId) return;
    // 使用后端返回的 hasWeeds 字段
    if (!plot.hasWeeds) return toast(t("noWeeds"));

    try {
      await gameAction.execute("weed", {
        plotId: plot.id,
      });

      // onSuccess 回调会自动更新状态
      toast(t("weeded"));
    } catch (error) {
      console.error("Weed failed:", error);
    }
  }

  // 行为：除虫
  async function pesticide(plot: Plot) {
    if (!isConnected || !address) return toast(t("pleaseConnectWallet"));
    if (!plot.unlocked) return;
    if (!plot.seedId) return;
    if (!plot.pests) return toast(t("noPests"));

    try {
      await gameAction.execute("pesticide", {
        plotId: plot.id,
      });

      // onSuccess 回调会自动更新状态
      toast(t("pestsRemoved"));
    } catch (error) {
      console.error("Pesticide failed:", error);
    }
  }

  // 行为：铲除
  async function shovel(plot: Plot) {
    if (!isConnected || !address) return toast(t("pleaseConnectWallet"));
    if (!plot.unlocked) return;
    if (!plot.seedId) return;

    try {
      await gameAction.execute("shovel", {
        plotId: plot.id,
      });

      // onSuccess 回调会自动更新状态
      toast(t("removed"));
    } catch (error) {
      console.error("Shovel failed:", error);
    }
  }

  // 行为：施肥
  async function applyFertilizer(plot: Plot) {
    if (!isConnected || !address) return toast(t("pleaseConnectWallet"));
    if (!plot.unlocked) return toast(t("plotNotUnlocked"));
    if (!plot.seedId) return toast(t("plantFirst"));
    if (plot.fertilized) return toast(t("alreadyFertilized"));
    if ((save.fertilizer || 0) <= 0) return toast(t("fertilizerInsufficient"));

    try {
      await gameAction.execute("fertilize", {
        plotId: plot.id,
      });

      // onSuccess 回调会自动更新状态
      toast(t("fertilizerSuccess"));
    } catch (error) {
      console.error("Fertilize failed:", error);
    }
  }

  // 行为：解锁地块
  async function unlockPlot(plot: Plot) {
    if (!isConnected || !address) return toast(t("pleaseConnectWallet"));
    if (plot.unlocked) return toast(t("plotUnlocked"));

    const reqLv = getPlotUnlockLevel(plot.id);
    if (lvl < reqLv) {
      return toast(`${t("levelInsufficient")}${reqLv}${t("currentLevel")}${lvl}${t("levelText")}`);
    }

    const cost = getPlotUnlockCost(plot.id);
    if (save.coins < cost) return toast(t("insufficientCoins"));

    try {
      await gameAction.execute("unlockPlot", {
        plotId: plot.id,
      });

      // onSuccess 回调会自动更新状态
      toast(`${t("plotUnlockedSuccess")}${plot.id + 1}，${t("unlockCost")}${cost}${t("coins")}`);
    } catch (error) {
      console.error("Unlock plot failed:", error);
    }
  }

  // 重置存档（现在通过后端API重置）
  function resetSave() {
    if (!confirm(t("resetConfirm"))) return;

    if (!isConnected || !address) {
      toast(t("pleaseConnectWallet"));
      return;
    }

    // TODO: 调用后端API重置用户数据
    // 暂时只重置前端状态
    toast(t("resetSuccess"));
    window.location.reload();
  }

  // 购买种子（只能用金币，无等级限制）
  async function buySeed(id: string, count = 1) {
    if (!isConnected || !address) return toast(t("pleaseConnectWallet"));

    try {
      const newState = await gameAction.execute("buySeed", {
        seedId: id,
        count: count,
      });

      setSave(prev => ({
        ...prev,
        ...newState,
      }));

      const seed = SEEDS[id as keyof typeof SEEDS];
      toast(`${t("bought")} ${seed.name} ×${count}`);
    } catch (error) {
      console.error("Buy seed failed:", error);
    }
  }

  // 购买肥料（只能用金币）
  async function buyFertilizer(count = 1) {
    if (!isConnected || !address) return toast(t("pleaseConnectWallet"));

    try {
      const newState = await gameAction.execute("buyFertilizer", {
        count: count,
      });

      setSave(prev => ({
        ...prev,
        ...newState,
      }));

      toast(`${t("bought")} ${t("fertilizer")} ×${count}`);
    } catch (error) {
      console.error("Buy fertilizer failed:", error);
    }
  }

  // 购买宠物
  async function buyPet(petId: string) {
    if (!isConnected || !address) return toast(t("pleaseConnectWallet"));

    try {
      const newState = await gameAction.execute("buyPet", {
        petId: petId,
      });

      setSave(prev => ({
        ...prev,
        ...newState,
      }));

      const pet = PETS.find((p: any) => p.id === petId);
      toast(`${t("bought")} ${pet?.name}！`);
    } catch (error) {
      console.error("Buy pet failed:", error);
    }
  }

  // 每日签到
  async function performCheckin() {
    if (!isConnected || !address) return toast(t("pleaseConnectWallet"));

    try {
      // capture previous coins so we can compute the reward amount shown to the user
      const prevCoins = save.coins || 0;

      const newState = await gameAction.execute("checkin", {});

      setSave(prev => ({
        ...prev,
        ...newState,
      }));

      // compute reward as delta between returned coins and previous coins
      const reward = (newState.coins || 0) - prevCoins;
      if (typeof reward === "number" && reward > 0) {
        toast(`${t("checkinSuccess")} ${reward} ${t("coins")}！`);
      } else {
        // fallback to generic message if delta not available
        toast(t("checkinSuccess"));
      }
    } catch (error) {
      console.error("Checkin failed:", error);
    }
  }

  // 处理机器人订阅
  async function handleRobotSubscribe(name: string, email: string, acceptMarketing: boolean) {
    if (!isConnected || !address) return toast(t("pleaseConnectWallet"));

    try {
      const newState = await gameAction.execute("subscribeRobot", {
        name,
        email,
        acceptMarketing,
      });

      setSave(prev => ({
        ...prev,
        ...newState,
      }));

      setRobotOpen(false);
      toast(t("subscribeSuccess"));
    } catch (error) {
      console.error("Subscribe failed:", error);
    }
  }

  // 弹窗：商店 / 银行 / Gluck / 签到 / 集字 / 机器人 / 宠物
  const [shopOpen, setShopOpen] = useState(false);
  const [bankOpen, setBankOpen] = useState(false);
  const [gluckOpen, setGluckOpen] = useState(false);
  const [checkinOpen, setCheckinOpen] = useState(false);
  const [letterCollectionOpen, setLetterCollectionOpen] = useState(false);
  const [robotOpen, setRobotOpen] = useState(false);
  const [petOpen, setPetOpen] = useState(false);

  /**********************
   * 渲染                *
   **********************/
  return (
    <div className="min-h-screen relative text-slate-800 font-sans">
      <AutumnBackground />
      <div className="relative z-10" style={{ cursor: cursorForTool(save.tool) }}>
        <TopBar
          coins={save.coins}
          zeta={save.zeta}
          tickets={save.tickets}
          exp={save.exp}
          level={lvl}
          lang={langRef.current as Language}
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
                current={save.tool as ToolType}
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
              <SettingsPanel onReset={resetSave} language={langRef.current} />
            </div>
          </div>
        </div>
        <ShopModal
          open={shopOpen}
          onClose={() => setShopOpen(false)}
          buySeed={buySeed}
          buyFertilizer={buyFertilizer}
          sellFruit={async (id: string, count: number) => {
            if (!isConnected || !address) return toast(t("pleaseConnectWallet"));
            if (!isConnected || !address) return toast(t("pleaseConnectWallet"));

            try {
              const newState = await gameAction.execute("sellFruit", {
                fruitId: id,
                count: count,
              });

              setSave(prev => ({
                ...prev,
                ...newState,
              }));

              const seed = SEEDS[id as keyof typeof SEEDS];
              toast(`${t("sold")} ${seed.name} ×${count}`);
            } catch (error) {
              console.error("Sell fruit failed:", error);
            }
          }}
          fruits={save.fruits || {}}
          language={langRef.current}
        />
        <BankModal
          open={bankOpen}
          onClose={() => setBankOpen(false)}
          coins={save.coins}
          onExchange={async (amount: number, targetCurrency: CurrencyType) => {
            if (!isConnected || !address) return toast(t("pleaseConnectWallet"));
            if (!isConnected || !address) return toast(t("pleaseConnectWallet"));

            try {
              const newState = await gameAction.execute("exchange", {
                amount: amount,
                targetCurrency: targetCurrency,
              });

              setSave(prev => ({
                ...prev,
                ...newState,
              }));

              toast(t("exchangeSuccess"));
            } catch (error) {
              console.error("Exchange failed:", error);
            }
          }}
          language={langRef.current}
        />
        <GluckModal
          open={gluckOpen}
          onClose={() => setGluckOpen(false)}
          onDraw={async (n: number) => {
            if (!isConnected || !address) return toast(t("pleaseConnectWallet"));
            if (!isConnected || !address) return toast(t("pleaseConnectWallet"));

            try {
              // capture previous inventory/fruits so we can compute the gained items
              const prevInventory = { ...(save.inventory || {}) } as Record<string, number>;
              const prevFruits = { ...(save.fruits || {}) } as Record<string, number>;

              const newState = await gameAction.execute("draw", {
                count: n,
              });

              // convert backend state to frontend shape so we can read inventory/fruits
              const frontendNewState = convertBackendStateToFrontend(newState as any);

              setSave(prev => ({
                ...prev,
                ...frontendNewState,
              }));

              // compute deltas
              const gained: string[] = [];
              const nextInventory = (frontendNewState.inventory || {}) as Record<string, number>;
              const nextFruits = (frontendNewState.fruits || {}) as Record<string, number>;

              for (const [id, cnt] of Object.entries(nextInventory)) {
                const prev = prevInventory[id] || 0;
                if ((cnt || 0) > prev) {
                  const diff = (cnt || 0) - prev;
                  const name = (SEEDS as any)[id as any]?.name || id;
                  gained.push(`${name} ×${diff}`);
                }
              }

              for (const [id, cnt] of Object.entries(nextFruits)) {
                const prev = prevFruits[id] || 0;
                if ((cnt || 0) > prev) {
                  const diff = (cnt || 0) - prev;
                  const name = (SEEDS as any)[id as any]?.name || id;
                  gained.push(`${name} (fruit) ×${diff}`);
                }
              }

              if (gained.length > 0) {
                toast(`${t("drew")} ${gained.join(", ")}`);
              } else {
                toast(t("drew"));
              }
            } catch (error) {
              console.error("Draw failed:", error);
            }
          }}
          tickets={save.tickets}
          language={langRef.current}
        />
        <CheckinModal
          open={checkinOpen}
          onClose={() => setCheckinOpen(false)}
          onCheckin={performCheckin}
          checkinLastDate={save.checkinLastDate}
          checkinRecords={save.checkinRecords || {}}
          language={langRef.current}
        />
        <LetterCollectionModal
          open={letterCollectionOpen}
          onClose={() => setLetterCollectionOpen(false)}
          collectedLetters={save.collectedLetters || {}}
          redeemedRewards={save.redeemedRewards || []}
          onRedeem={async (rewardId: string) => {
            if (!isConnected || !address) return toast(t("pleaseConnectWallet"));
            if (!isConnected || !address) return toast(t("pleaseConnectWallet"));

            try {
              const newState = await gameAction.execute("redeemReward", {
                rewardId: rewardId,
              });

              setSave(prev => ({
                ...prev,
                ...newState,
              }));

              toast(t("redeemSuccess"));
            } catch (error) {
              console.error("Redeem failed:", error);
            }
          }}
          language={langRef.current}
        />
        <RobotModal
          open={robotOpen || save.tool === "robot"}
          onClose={() => {
            setRobotOpen(false);
            setTool("harvest");
          }}
          onSubscribe={handleRobotSubscribe}
          subscribed={save.robotSubscribed || false}
          language={langRef.current}
        />
        <PetModal
          open={petOpen || save.tool === "pet"}
          onClose={() => {
            setPetOpen(false);
            setTool("harvest");
          }}
          pets={save.pets || {}}
          onBuyPet={buyPet}
          language={langRef.current}
        />
        <ToastArea />
      </div>
    </div>
  );
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
  // protection removed

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

  const actualElapsed = plot.seedId && plot.plantedAt ? now() - plot.plantedAt - (plot.pausedDuration || 0) : 0;
  const hasActiveWaterReq = (plot.waterRequirements || []).some(
    r => !r.done && (Boolean((plot as any).pausedAt) || actualElapsed >= r.time),
  );
  const hasActiveWeedReq = (plot.weedRequirements || []).some(
    r => !r.done && (Boolean((plot as any).pausedAt) || actualElapsed >= r.time),
  );

  const labelByStage: Record<string, string> = {
    [STAGE.EMPTY]: t("empty"),
    [STAGE.SEED]: t("seeding"),
    [STAGE.SPROUT]: t("sprout"),
    [STAGE.GROWING]: t("growing"),
    [STAGE.RIPE]: t("ripe"),
    [STAGE.WITHER]: t("wither"),
  };

  // We replace emoji with images from public/corns/
  const stageImageSrc = (() => {
    if (!seed) return null;
    // Keep WITHER as emoji fallback per request
    if (st === STAGE.WITHER) return null;
    if (st === STAGE.SEED) return "/corns/seed.png";
    if (st === STAGE.SPROUT) return "/corns/sprout.png";
    // For growing/ripe we show the crop image
    if (st === STAGE.GROWING || st === STAGE.RIPE) return `/corns/${seed.id}.png`;
    return null;
  })();

  return (
    <div
      onClick={onClick}
      className="relative select-none p-0 rounded-3xl border shadow-sm hover:shadow transition"
      style={soilTextureStyle()}
    >
      <img
        src="/plots/plot-cube.png"
        alt="plot tile"
        className="absolute top-0 left-0 w-full h-full object-contain pointer-events-none"
        style={{ transform: "translateY(6px)" }}
      />
      <div className="flex items-center justify-between text-xs text-white/85">
        <span>#{plot.id + 1}</span>
        {/* protection indicator removed */}
      </div>
      <div className="flex flex-col items-center py-3 h-32 justify-center relative">
        <div className="text-4xl">
          {stageImageSrc ? (
            <img src={stageImageSrc} alt={seed ? seed.name : ""} className="w-20 h-20 object-contain" />
          ) : // fallback to emoji for empty/wither
          st === STAGE.EMPTY ? (
            ""
          ) : st === STAGE.WITHER ? (
            "🪦"
          ) : (
            ""
          )}
        </div>
        <div className="text-sm mt-1 font-medium text-white">{seed ? seed.name : t("empty")}</div>
        <div className="text-xs text-white/80 h-4">{seed ? labelByStage[st] : ""}</div>
        {seed && st === STAGE.RIPE && (
          <div className="text-[11px] text-white/70 mt-1">
            {t("witherIn")}：{fmtTime(timeNext)}
          </div>
        )}
      </div>
      {/* 使用后端返回的状态字段 */}
      {(plot.hasWeeds || plot.pests || hasActiveWaterReq || hasActiveWeedReq) && (
        <div className="absolute bottom-12 left-0 right-0 flex gap-1 justify-center pointer-events-none z-20">
          {hasActiveWaterReq && <Badge text={t("needWater")} color="bg-sky-700" />}
          {hasActiveWeedReq && <Badge text={t("needWeed")} color="bg-lime-700" />}
          {plot.hasWeeds && !hasActiveWeedReq && <Badge text={t("weeds")} color="bg-lime-700" />}
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
                  <img
                    src={`/corns/${s.id}.png`}
                    alt={s.name}
                    className={`relative z-10 ${!hasCount ? "opacity-40" : ""} w-8 h-8 object-contain`}
                  />
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
                  <img
                    src={`/corns/${s.id}.png`}
                    alt={s.name}
                    className={!hasCount ? "opacity-40 w-8 h-8 object-contain" : "w-8 h-8 object-contain"}
                  />
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

/**********************
 * 轻量 Toast 系统     *
 **********************/
interface ToastItem {
  id: number;
  text: string;
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
            className="px-4 py-2 rounded-lg border shadow-lg text-sm text-white animate-toast"
            style={{
              background: "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
              animation: isLatest ? "toastSlideIn 0.3s ease-out, toastFadeOut 0.4s ease-in 2.2s" : undefined,
              backgroundImage: isLatest
                ? "linear-gradient(135deg, #667eea 0%, #764ba2 100%), linear-gradient(90deg, rgba(255,255,255,0.3) 0%, rgba(255,255,255,0) 100%)"
                : undefined,
              backgroundSize: isLatest ? "100%, 200%, 100%" : "100%",
            }}
          >
            {t.text}
          </div>
        );
      })}
    </div>
  );
}

const Home: NextPage = () => {
  return <SocialFarmGame />;
};

export default Home;
