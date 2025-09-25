"use client";

import { useEffect, useRef } from "react";

type LightningEffect = {
  type: "lightning";
  points: Array<{ x: number; y: number }>;
  ttlMs: number;
};

type Enemy = {
  x: number;
  y: number;
  radius: number;
  hp: number;
  maxHp: number;
  id: number;
};

type PlayerStats = {
  level: number;
  exp: number;
  expToNext: number;
  statPoints: number;
  attackSpeed: number; // percentage bonus
  attackPower: number; // flat bonus
  maxTargets: number; // number of targets
  _isProcessingStat?: boolean; // internal flag to prevent rapid clicks
};

type LevelUpPopup = {
  show: boolean;
  availablePoints: number;
};

type EquipmentGrade = "S" | "A" | "B" | "C" | "D";

type EquipmentType = "weapon" | "helmet" | "armor" | "shoes";

type Equipment = {
  id: string;
  name: string;
  grade: EquipmentGrade;
  type: EquipmentType;
  stats: {
    attackPower?: number;
    attackSpeed?: number;
    maxTargets?: number;
  };
  equipped: boolean;
};

type GachaResult = {
  equipment: Equipment[];
  totalCost: number;
};

export default function GameCanvas() {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const levelRef = useRef<HTMLSpanElement | null>(null);
  const expRef = useRef<HTMLSpanElement | null>(null);
  const goldRef = useRef<HTMLSpanElement | null>(null);
  const statusRef = useRef<HTMLDivElement | null>(null);
  const overlayRef = useRef<HTMLDivElement | null>(null);
  const overlayContentRef = useRef<HTMLDivElement | null>(null);
  const overlayCloseRef = useRef<HTMLButtonElement | null>(null);

  useEffect(() => {
    console.log("useEffect 실행됨");
    console.log("containerRef.current:", containerRef.current);
    console.log("canvasRef.current:", canvasRef.current);
    console.log("levelRef.current:", levelRef.current);
    console.log("expRef.current:", expRef.current);
    console.log("goldRef.current:", goldRef.current);
    console.log("statusRef.current:", statusRef.current);

    if (
      !containerRef.current ||
      !canvasRef.current ||
      !levelRef.current ||
      !expRef.current ||
      !goldRef.current ||
      !statusRef.current
    ) {
      console.log("일부 ref가 null입니다. startGame을 실행하지 않습니다.");
      return;
    }

    console.log("startGame 함수를 호출합니다.");
    const dispose = startGame(
      containerRef.current,
      canvasRef.current,
      levelRef.current,
      expRef.current,
      goldRef.current,
      statusRef.current,
      overlayRef.current,
      overlayContentRef.current,
      overlayCloseRef.current
    );
    return () => dispose();
  }, []);

  return (
    <div ref={containerRef} id="game-container" className="phone-viewport">
      <canvas ref={canvasRef} id="game-canvas" />
      <div className="hud">
        <div className="hud-left">
          <div className="stat" id="level-stat">
            <span className="label">LV</span>
            <span ref={levelRef}>1</span>
          </div>
          <div className="stat">
            <span className="label">EXP</span>
            <span ref={expRef}>0</span>
          </div>
          <div className="stat">
            <span className="label">G</span>
            <span ref={goldRef}>0</span>
          </div>
        </div>
        <div className="hud-right">
          <div ref={statusRef}></div>
        </div>
      </div>

      {/* Bottom Tab Menu */}
      <div className="bottom-tabs">
        <div className="tab active" id="character-tab">
          <span className="tab-icon">👤</span>
          <span className="tab-label">캐릭터</span>
        </div>
        <div className="tab" id="inventory-tab">
          <span className="tab-icon">🎒</span>
          <span className="tab-label">인벤토리</span>
        </div>
        <div className="tab" id="gacha-tab">
          <span className="tab-icon">🎰</span>
          <span className="tab-label">가챠</span>
        </div>
        <div className="tab" id="enhancement-tab">
          <span className="tab-icon">⚡</span>
          <span className="tab-label">강화</span>
        </div>
        <div className="tab" id="tab5">
          <span className="tab-icon">❓</span>
          <span className="tab-label">미정</span>
        </div>
      </div>
      <div className="overlay" ref={overlayRef}>
        <div className="overlay-box">
          <div className="overlay-title">오프라인 보상</div>
          <div className="overlay-content" ref={overlayContentRef}></div>
          <div className="overlay-actions">
            <button ref={overlayCloseRef} type="button">
              확인
            </button>
          </div>
        </div>
      </div>
      <div
        className="character-popup"
        id="character-popup"
        style={{ display: "none" }}
      >
        <div className="character-box">
          <div className="character-header">
            <div className="character-title">캐릭터 정보</div>
            <button className="close-btn" id="character-close">
              ×
            </button>
          </div>
          <div className="character-content">
            <div className="character-info">
              <div className="info-row">
                <span className="info-label">레벨</span>
                <span className="info-value" id="character-level">
                  1
                </span>
              </div>
              <div className="info-row">
                <span className="info-label">경험치</span>
                <span className="info-value" id="character-exp">
                  0/100
                </span>
              </div>
              <div className="info-row">
                <span className="info-label">골드</span>
                <span className="info-value" id="character-gold">
                  0
                </span>
              </div>
            </div>

            <div className="equipment-section">
              <div className="equipment-section-title">장착 장비</div>
              <div className="equipped-items">
                <div className="equipped-item">
                  <span className="equipment-slot">무기:</span>
                  <span className="equipment-name" id="equipped-weapon">
                    없음
                  </span>
                </div>
                <div className="equipped-item">
                  <span className="equipment-slot">모자:</span>
                  <span className="equipment-name" id="equipped-helmet">
                    없음
                  </span>
                </div>
                <div className="equipped-item">
                  <span className="equipment-slot">방어구:</span>
                  <span className="equipment-name" id="equipped-armor">
                    없음
                  </span>
                </div>
                <div className="equipped-item">
                  <span className="equipment-slot">신발:</span>
                  <span className="equipment-name" id="equipped-shoes">
                    없음
                  </span>
                </div>
              </div>
            </div>

            <div className="stat-section">
              <div className="stat-section-title">스탯</div>
              <div className="stat-points">
                스탯 포인트: <span id="available-points">0</span>
              </div>
              <div className="stat-buttons">
                <div className="stat-row">
                  <div className="stat-info">
                    <span className="stat-name">공격속도</span>
                    <span className="stat-value">
                      <span id="attack-speed-value">0</span>%
                    </span>
                  </div>
                  <button id="attack-speed-plus" className="stat-btn">
                    +
                  </button>
                </div>
                <div className="stat-row">
                  <div className="stat-info">
                    <span className="stat-name">공격력</span>
                    <span className="stat-value">
                      <span id="attack-power-value">0</span>
                    </span>
                  </div>
                  <button id="attack-power-plus" className="stat-btn">
                    +
                  </button>
                </div>
                <div className="stat-row">
                  <div className="stat-info">
                    <span className="stat-name">타겟수</span>
                    <span className="stat-value">
                      <span id="max-targets-value">1</span>
                    </span>
                  </div>
                  <button id="max-targets-plus" className="stat-btn">
                    +
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Inventory Popup */}
      <div
        className="inventory-popup"
        id="inventory-popup"
        style={{ display: "none" }}
      >
        <div className="inventory-box">
          <div className="inventory-header">
            <div className="inventory-title">인벤토리</div>
            <button className="close-btn" id="inventory-close">
              ×
            </button>
          </div>
          <div className="inventory-content">
            <div className="inventory-controls">
              <div className="sort-controls">
                <span className="control-label">정렬:</span>
                <button className="sort-btn" id="sort-grade" data-sort="grade">
                  등급순
                </button>
                <button
                  className="sort-btn"
                  id="sort-acquired"
                  data-sort="acquired"
                >
                  획득순
                </button>
              </div>
              <div className="sell-controls">
                <button className="sell-btn" id="sell-low-grade">
                  B등급 이하 판매
                </button>
              </div>
            </div>
            <div className="equipment-grid" id="equipment-grid">
              {/* Equipment items will be dynamically added here */}
            </div>
          </div>
        </div>
      </div>

      {/* Gacha Popup */}
      <div className="gacha-popup" id="gacha-popup" style={{ display: "none" }}>
        <div className="gacha-box">
          <div className="gacha-header">
            <div className="gacha-title">가챠</div>
            <button className="close-btn" id="gacha-close">
              ×
            </button>
          </div>
          <div className="gacha-content">
            <div className="gacha-currency">
              <span className="currency-label">가챠 재화:</span>
              <span className="currency-value" id="gacha-currency-value">
                300
              </span>
            </div>
            <div className="gacha-buttons">
              <button className="gacha-btn single" id="single-gacha">
                1회 뽑기 (10)
              </button>
              <button className="gacha-btn multi" id="multi-gacha">
                11회 뽑기 (10)
              </button>
            </div>
            <div className="gacha-rates">
              <div className="rate-info">
                S: 5% | A: 10% | B: 30% | C: 30% | D: 25%
              </div>
            </div>
            <div className="gacha-results" id="gacha-results">
              {/* Gacha results will be displayed here */}
            </div>
          </div>
        </div>
      </div>

      {/* Enhancement Popup */}
      <div
        className="enhancement-popup"
        id="enhancement-popup"
        style={{ display: "none" }}
      >
        <div className="enhancement-box">
          <div className="enhancement-header">
            <div className="enhancement-title">강화</div>
            <button className="close-btn" id="enhancement-close">
              ×
            </button>
          </div>
          <div className="enhancement-content">
            <div className="enhancement-info">
              <div className="enhancement-currency">
                <span className="currency-label">골드:</span>
                <span
                  className="currency-value"
                  id="enhancement-currency-value"
                >
                  0
                </span>
              </div>
            </div>
            <div className="enhancement-items" id="enhancement-items">
              {/* Enhancement items will be displayed here */}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

// ------------------------------
// Game Implementation
// ------------------------------
function startGame(
  containerElement: HTMLDivElement,
  canvasElement: HTMLCanvasElement,
  hudLevelElement: HTMLSpanElement,
  hudExpElement: HTMLSpanElement,
  hudGoldElement: HTMLSpanElement,
  hudStatusElement: HTMLDivElement,
  overlayEl: HTMLDivElement | null,
  overlayContentEl: HTMLDivElement | null,
  overlayCloseBtn: HTMLButtonElement | null
) {
  console.log("startGame 함수가 실행되었습니다!");
  // Constants
  const WORLD_WIDTH = 540;
  const WORLD_HEIGHT = 960;

  const HERO_RADIUS = 14;
  const ENEMY_RADIUS = 16;

  // Pixel-art rendering
  type HeroAnimState = "idle" | "move" | "attack";
  type Direction = "up" | "down" | "left" | "right";
  const HERO_SPRITE_SIZE_UNITS = 28; // Rendered size in world units
  const ATTACK_ANIMATION_TTL_MS = 220;
  const ANIM_META: Record<
    HeroAnimState,
    { frames: number; frameDurationMs: number }
  > = {
    idle: { frames: 1, frameDurationMs: 480 },
    move: { frames: 4, frameDurationMs: 120 },
    attack: { frames: 4, frameDurationMs: 90 },
  };
  const SPRITE_FRAME_PX = 16; // Expected frame size if external sprites are provided
  const DIRECTIONS: Direction[] = ["up", "down", "left", "right"];

  const HERO_SPEED_UNITS_PER_SECOND = 140;
  const ATTACK_RANGE_UNITS = 140;
  const BASE_ATTACK_INTERVAL_MS = 600;
  const BASE_ATTACK_DAMAGE_AMOUNT = 25;

  const BASE_ENEMY_MAX_HP = 100;

  const GOLD_REWARD_PER_KILL = 5;
  const EXP_REWARD_PER_KILL = 30;
  const ENEMY_RESPAWN_DELAY_MS = 300;

  // Level system constants
  const MAX_LEVEL = 99;
  const STAT_POINTS_PER_LEVEL = 5;
  const BASE_EXP_REQUIRED = 100; // Level 1 -> 2 requires 100 exp
  const EXP_MULTIPLIER = 1.15; // Each level requires 15% more exp

  const LIGHTNING_TTL_MS = 120;
  const LIGHTNING_SEGMENT_COUNT = 16;
  const LIGHTNING_JITTER_UNITS = 6;
  const OVERLAY_TOGGLE_KEY = "idleGame_offlineOverlayEnabled";
  // Persistence keys
  const PROGRESS_KEY = "idleGame_progress";
  const HIDDEN_AT_KEY = "idleGame_hiddenAt";
  const LAST_ACTIVE_KEY = "idleGame_lastActiveMs";
  // Cooldown to prevent duplicate resume processing (focus + pageshow + visible)
  let resumeCooldownUntil = 0;

  const ctx = canvasElement.getContext("2d", {
    alpha: false,
  }) as CanvasRenderingContext2D;
  if (!ctx) return () => {};

  const state = {
    devicePixelRatio: window.devicePixelRatio || 1,
    viewportScale: 1,
    lastFrameTimeMs: undefined as number | undefined,
    currentTimeMs: 0,
    lastWallClockMs: Date.now(),
    hero: {
      x: WORLD_WIDTH / 2,
      y: WORLD_HEIGHT * 0.66,
      radius: HERO_RADIUS,
      attackCooldownMs: 0,
      direction: "down" as Direction,
      animation: {
        current: "idle" as HeroAnimState,
        frameIndex: 0,
        frameElapsedMs: 0,
        attackAnimMs: 0,
      },
    },
    enemies: [] as Enemy[],
    pendingRespawnAtMs: 0,
    nextEnemyId: 1,
    stats: { gold: 0, exp: 0, kills: 0 },
    playerStats: {
      level: 1,
      exp: 0,
      expToNext: BASE_EXP_REQUIRED,
      statPoints: 0,
      attackSpeed: 0,
      attackPower: 0,
      maxTargets: 1,
    } as PlayerStats,
    levelUpPopup: {
      show: false,
      availablePoints: 0,
    } as LevelUpPopup,
    effects: [] as LightningEffect[],
    rafId: 0 as number | 0,
    // Equipment and Gacha system
    equipment: [] as Equipment[],
    equippedItems: {
      weapon: null as Equipment | null,
      helmet: null as Equipment | null,
      armor: null as Equipment | null,
      shoes: null as Equipment | null,
    },
    gachaCurrency: 300, // 기본 300
    currentTab: "character" as
      | "character"
      | "inventory"
      | "gacha"
      | "enhancement",
    inventorySortBy: "grade" as "grade" | "acquired", // 정렬 기준
  };

  // Optional external sprite resources (loaded if present under /public/sprites)
  type SpriteResource = {
    image: HTMLImageElement;
    frameSize: number;
    frames: number;
    loaded: boolean;
  };
  const sprites: Partial<
    Record<`${HeroAnimState}_${Direction}`, SpriteResource>
  > = {};

  // Load directional sprites
  Object.keys(ANIM_META).forEach((animState) => {
    DIRECTIONS.forEach((direction) => {
      const key = `${animState}_${direction}` as keyof typeof sprites;
      sprites[key] = tryLoadSprite(
        `/sprites/hero_${animState}_${direction}.png`,
        SPRITE_FRAME_PX
      );
    });
  });

  // Init
  fitCanvasToContainer();
  // Load saved progress and apply offline gains
  tryResumeProgress();
  spawnEnemies();
  updateHud();

  // Setup level up popup event listeners
  console.log("setupLevelUpPopupListeners 호출 전");
  setupLevelUpPopupListeners();
  console.log("setupLevelUpPopupListeners 호출 후");

  // Setup HUD click events
  console.log("HUD 클릭 이벤트 설정 시작");
  const levelStatElement = document.getElementById("level-stat");
  if (levelStatElement) {
    levelStatElement.addEventListener("click", () => {
      showCharacterPopup();
    });
  }
  console.log("HUD 클릭 이벤트 설정 완료");

  // Setup tab click events will be done after function definitions

  // Observers
  console.log("Observer 설정 시작");
  const resizeObserver = new ResizeObserver(() => {
    fitCanvasToContainer();
  });
  resizeObserver.observe(containerElement);
  console.log("Observer 설정 완료");

  // DPR change listener (with fallback)
  console.log("DPR change listener 설정 시작");
  type MediaQueryListDeprecated = MediaQueryList & {
    addListener: (
      listener: (this: MediaQueryList, ev: MediaQueryListEvent) => void
    ) => void;
    removeListener: (
      listener: (this: MediaQueryList, ev: MediaQueryListEvent) => void
    ) => void;
  };
  const mq = window.matchMedia(`(resolution: ${window.devicePixelRatio}dppx)`);
  const onDprChange = () => {
    state.devicePixelRatio = window.devicePixelRatio || 1;
    fitCanvasToContainer();
  };
  if (typeof mq.addEventListener === "function") {
    mq.addEventListener("change", onDprChange);
  } else if (
    typeof (mq as MediaQueryListDeprecated).addListener === "function"
  ) {
    (mq as MediaQueryListDeprecated).addListener(onDprChange);
  }
  console.log("DPR change listener 설정 완료");

  // Persist periodically and on tab hide/close
  const autosaveInterval = window.setInterval(persistProgress, 5000);
  const onVisibility = () => {
    if (document.visibilityState === "hidden") {
      // Anchor hidden timestamp for accurate offline time while minimized/tab-switched
      try {
        localStorage.setItem(HIDDEN_AT_KEY, String(Date.now()));
      } catch {}
      persistProgress();
    } else if (document.visibilityState === "visible") {
      tryResumeProgress();
      updateHud();
    }
  };
  document.addEventListener("visibilitychange", onVisibility);
  // Listen to overlay toggle changes from DevToolbar
  const onOverlayToggle = (ev: Event) => {
    const anyEv = ev as CustomEvent<{ enabled: boolean }>;
    // If disabled while showing, hide immediately
    const enabled = anyEv?.detail?.enabled;
    if (enabled === false && overlayEl) {
      overlayEl.classList.remove("show");
    }
  };
  window.addEventListener(
    "idleGame:overlayToggle",
    onOverlayToggle as EventListener
  );
  const onBeforeUnload = () => {
    try {
      localStorage.setItem(HIDDEN_AT_KEY, String(Date.now()));
    } catch {}
    persistProgress();
  };
  window.addEventListener("beforeunload", onBeforeUnload);
  const onPageHide = () => {
    try {
      localStorage.setItem(HIDDEN_AT_KEY, String(Date.now()));
    } catch {}
    persistProgress();
  };
  window.addEventListener("pagehide", onPageHide);
  const onPageShow = () => {
    if (performance.now() < resumeCooldownUntil) return;
    resumeCooldownUntil = performance.now() + 1200;
    tryResumeProgress();
    updateHud();
  };
  window.addEventListener("pageshow", onPageShow);
  const onFocus = () => {
    if (performance.now() < resumeCooldownUntil) return;
    resumeCooldownUntil = performance.now() + 1200;
    tryResumeProgress();
    updateHud();
  };
  const onBlur = () => {
    try {
      localStorage.setItem(HIDDEN_AT_KEY, String(Date.now()));
    } catch {}
    persistProgress();
  };
  window.addEventListener("focus", onFocus);
  window.addEventListener("blur", onBlur);

  // Loop
  const loop = (ts: number) => {
    if (state.lastFrameTimeMs === undefined) state.lastFrameTimeMs = ts;
    const deltaMs = Math.min(33, ts - state.lastFrameTimeMs);
    const deltaSeconds = deltaMs / 1000;
    state.currentTimeMs = ts;
    state.lastFrameTimeMs = ts;

    update(deltaSeconds, deltaMs);
    render();
    state.rafId = window.requestAnimationFrame(loop);
    state.lastWallClockMs = Date.now();
  };
  state.rafId = window.requestAnimationFrame(loop);

  // Setup tab click events
  console.log("탭 이벤트 리스너 설정을 시작합니다...");

  const characterTab = document.getElementById("character-tab");
  const inventoryTab = document.getElementById("inventory-tab");
  const gachaTab = document.getElementById("gacha-tab");
  const enhancementTab = document.getElementById("enhancement-tab");

  // Debug: Check if tabs exist
  console.log("Character tab:", characterTab);
  console.log("Inventory tab:", inventoryTab);
  console.log("Gacha tab:", gachaTab);

  if (characterTab) {
    characterTab.addEventListener("click", () => {
      switchTab("character");
      showCharacterPopup();
    });
  }

  if (inventoryTab) {
    console.log("Adding inventory tab listener");
    inventoryTab.addEventListener("click", () => {
      console.log("Inventory tab clicked!");
      switchTab("inventory");
      showInventoryPopup();
    });
  } else {
    console.log("Inventory tab not found!");
  }

  if (gachaTab) {
    console.log("Adding gacha tab listener");
    gachaTab.addEventListener("click", () => {
      console.log("Gacha tab clicked!");
      switchTab("gacha");
      showGachaPopup();
    });
  } else {
    console.log("Gacha tab not found!");
  }

  if (enhancementTab) {
    console.log("Adding enhancement tab listener");
    enhancementTab.addEventListener("click", () => {
      console.log("Enhancement tab clicked!");
      switchTab("enhancement");
      showEnhancementPopup();
    });
  } else {
    console.log("Enhancement tab not found!");
  }

  // ------------------------------
  // Enhancement System
  // ------------------------------
  function showEnhancementPopup() {
    const popup = document.getElementById(
      "enhancement-popup"
    ) as HTMLDivElement;
    if (!popup) return;

    updateEnhancementCurrency();
    updateEnhancementDisplay();
    popup.style.display = "flex";
  }

  function hideEnhancementPopup() {
    const popup = document.getElementById(
      "enhancement-popup"
    ) as HTMLDivElement;
    if (!popup) return;
    popup.style.display = "none";
  }

  function updateEnhancementCurrency() {
    const currencyEl = document.getElementById("enhancement-currency-value");
    if (currencyEl) {
      currencyEl.textContent = String(state.stats.gold);
    }
  }

  function updateEnhancementDisplay() {
    const itemsEl = document.getElementById("enhancement-items");
    if (!itemsEl) return;

    itemsEl.innerHTML = "";

    // Show only equipped items for enhancement
    const equippedItems = Object.values(state.equippedItems).filter(
      (item) => item !== null
    );

    if (equippedItems.length === 0) {
      itemsEl.innerHTML =
        "<div class='no-enhancement'>장착된 장비가 없습니다.</div>";
      return;
    }

    equippedItems.forEach((equipment) => {
      const itemEl = document.createElement("div");
      itemEl.className = `enhancement-item grade-${equipment.grade.toLowerCase()}`;
      itemEl.innerHTML = `
        <div class="item-grade">${equipment.grade}</div>
        <div class="item-name">${equipment.name}</div>
        <div class="item-type">${getEquipmentTypeName(equipment.type)}</div>
        <div class="item-stats">
          ${
            equipment.stats.attackPower
              ? `공격력 +${equipment.stats.attackPower} `
              : ""
          }
          ${
            equipment.stats.attackSpeed
              ? `공격속도 +${equipment.stats.attackSpeed}% `
              : ""
          }
          ${
            equipment.stats.maxTargets
              ? `타겟수 +${equipment.stats.maxTargets} `
              : ""
          }
        </div>
        <div class="enhancement-actions">
          <button class="enhance-btn" data-equipment-id="${equipment.id}">
            강화 (1000G)
          </button>
        </div>
      `;
      itemsEl.appendChild(itemEl);
    });

    // Add event listeners to enhance buttons
    const enhanceButtons = itemsEl.querySelectorAll(".enhance-btn");
    enhanceButtons.forEach((button) => {
      button.addEventListener("click", (e) => {
        const equipmentId = (e.target as HTMLButtonElement).getAttribute(
          "data-equipment-id"
        );
        if (equipmentId) {
          enhanceEquipment(equipmentId);
        }
      });
    });
  }

  function enhanceEquipment(equipmentId: string) {
    const equipment = state.equipment.find((eq) => eq.id === equipmentId);
    if (!equipment) return;

    const cost = 1000; // 1000 골드
    if (state.stats.gold < cost) {
      alert("골드가 부족합니다!");
      return;
    }

    state.stats.gold -= cost;

    // Enhance stats
    if (equipment.stats.attackPower) {
      equipment.stats.attackPower +=
        Math.floor(equipment.stats.attackPower * 0.1) + 1;
    }
    if (equipment.stats.attackSpeed) {
      equipment.stats.attackSpeed +=
        Math.floor(equipment.stats.attackSpeed * 0.1) + 1;
    }
    if (equipment.stats.maxTargets) {
      equipment.stats.maxTargets += 1;
    }

    updateEnhancementCurrency();
    updateEnhancementDisplay();
    updateCharacterEquipmentDisplay();
    updateHud();
  }

  // ------------------------------
  // Inventory Controls
  // ------------------------------
  function sellLowGradeEquipment() {
    const lowGradeItems = state.equipment.filter(
      (eq) => eq.grade === "C" || eq.grade === "D"
    );

    if (lowGradeItems.length === 0) {
      alert("판매할 장비가 없습니다!");
      return;
    }

    const totalValue = lowGradeItems.length * 100; // 100 골드 per item
    state.stats.gold += totalValue;

    // Remove items from equipment array
    state.equipment = state.equipment.filter(
      (eq) => eq.grade !== "C" && eq.grade !== "D"
    );

    // Unequip any low grade items that were equipped
    Object.keys(state.equippedItems).forEach((key) => {
      const item = state.equippedItems[key as keyof typeof state.equippedItems];
      if (item && (item.grade === "C" || item.grade === "D")) {
        state.equippedItems[key as keyof typeof state.equippedItems] = null;
      }
    });

    updateInventoryDisplay();
    updateCharacterEquipmentDisplay();
    updateHud();
    alert(
      `${lowGradeItems.length}개 장비를 판매하여 ${totalValue} 골드를 획득했습니다!`
    );
  }

  function setInventorySort(sortBy: "grade" | "acquired") {
    state.inventorySortBy = sortBy;
    updateInventoryDisplay();
    updateSortButtons();
  }

  function updateSortButtons() {
    const gradeBtn = document.getElementById("sort-grade");
    const acquiredBtn = document.getElementById("sort-acquired");

    if (gradeBtn) {
      gradeBtn.classList.toggle("active", state.inventorySortBy === "grade");
    }
    if (acquiredBtn) {
      acquiredBtn.classList.toggle(
        "active",
        state.inventorySortBy === "acquired"
      );
    }
  }

  // Setup enhancement and inventory controls
  function setupEnhancementAndInventoryControls() {
    // Enhancement close button
    const enhancementCloseBtn = document.getElementById("enhancement-close");
    if (enhancementCloseBtn) {
      enhancementCloseBtn.addEventListener("click", hideEnhancementPopup);
    }

    // Inventory sort buttons
    const sortGradeBtn = document.getElementById("sort-grade");
    const sortAcquiredBtn = document.getElementById("sort-acquired");
    const sellBtn = document.getElementById("sell-low-grade");

    if (sortGradeBtn) {
      sortGradeBtn.addEventListener("click", () => setInventorySort("grade"));
    }
    if (sortAcquiredBtn) {
      sortAcquiredBtn.addEventListener("click", () =>
        setInventorySort("acquired")
      );
    }
    if (sellBtn) {
      sellBtn.addEventListener("click", sellLowGradeEquipment);
    }

    // Click outside to close enhancement popup
    const enhancementPopup = document.getElementById("enhancement-popup");
    if (enhancementPopup) {
      enhancementPopup.addEventListener("click", (e) => {
        if (e.target === enhancementPopup) {
          hideEnhancementPopup();
        }
      });
    }
  }

  // Call setup function
  setupGachaAndInventoryListeners();
  setupEnhancementAndInventoryControls();

  // Cleanup
  return () => {
    window.cancelAnimationFrame(state.rafId);
    resizeObserver.disconnect();
    window.clearInterval(autosaveInterval);
    document.removeEventListener("visibilitychange", onVisibility);
    window.removeEventListener(
      "idleGame:overlayToggle",
      onOverlayToggle as EventListener
    );
    window.removeEventListener("beforeunload", onBeforeUnload);
    window.removeEventListener("pagehide", onPageHide);
    window.removeEventListener("pageshow", onPageShow);
    window.removeEventListener("focus", onFocus);
    window.removeEventListener("blur", onBlur);
    if (typeof mq.removeEventListener === "function") {
      mq.removeEventListener("change", onDprChange);
    } else if (
      typeof (mq as MediaQueryListDeprecated).removeListener === "function"
    ) {
      (mq as MediaQueryListDeprecated).removeListener(onDprChange);
    }
  };

  // --------------- Helpers ---------------
  function update(deltaSeconds: number, deltaMs: number) {
    const hero = state.hero;

    // 모든 몬스터가 죽었으면 새로 스폰
    if (
      state.enemies.length === 0 &&
      state.pendingRespawnAtMs &&
      state.currentTimeMs >= state.pendingRespawnAtMs
    ) {
      spawnEnemies();
    }

    // 가장 가까운 몬스터 찾기
    const targetEnemy = findClosestEnemy();

    if (!targetEnemy) {
      hudStatusElement.textContent = "...";
      updateEffects(deltaMs);
      return;
    }

    const dx = targetEnemy.x - hero.x;
    const dy = targetEnemy.y - hero.y;
    const distance = Math.hypot(dx, dy);
    const inRange = distance <= ATTACK_RANGE_UNITS;
    let moveDistanceThisFrame = 0;

    if (inRange) {
      hudStatusElement.textContent = "공격 중";
      hero.attackCooldownMs -= deltaMs;
      if (hero.attackCooldownMs <= 0) {
        performAttack(targetEnemy);
        hero.attackCooldownMs = getAttackInterval();
      }
    } else {
      hudStatusElement.textContent = "이동 중";
      const moveDistance = Math.min(
        distance,
        HERO_SPEED_UNITS_PER_SECOND * deltaSeconds
      );
      if (distance > 0.0001) {
        const invLen = 1 / distance;
        hero.x += dx * invLen * moveDistance;
        hero.y += dy * invLen * moveDistance;

        // Update hero direction based on movement
        updateHeroDirection(dx, dy);
      }
      moveDistanceThisFrame = moveDistance;
      if (hero.attackCooldownMs > 0) {
        hero.attackCooldownMs = Math.max(0, hero.attackCooldownMs - deltaMs);
      }
    }

    updateHeroAnimation(inRange, moveDistanceThisFrame, deltaMs);
    updateEffects(deltaMs);
  }

  function updateHeroDirection(dx: number, dy: number) {
    const hero = state.hero;
    const absDx = Math.abs(dx);
    const absDy = Math.abs(dy);

    if (absDx > absDy) {
      // Horizontal movement is dominant
      hero.direction = dx > 0 ? "right" : "left";
    } else {
      // Vertical movement is dominant
      hero.direction = dy > 0 ? "down" : "up";
    }
  }

  function performAttack(targetEnemy: Enemy) {
    const hero = state.hero;
    if (!targetEnemy) return;

    // Update hero direction to face the enemy before attacking
    const dx = targetEnemy.x - hero.x;
    const dy = targetEnemy.y - hero.y;
    updateHeroDirection(dx, dy);

    // Get multiple targets based on maxTargets stat
    const maxTargets = state.playerStats.maxTargets;
    const targets = findMultipleTargets(targetEnemy, maxTargets);

    // Attack all targets
    targets.forEach((enemy) => {
      spawnLightningEffect(hero.x, hero.y, enemy.x, enemy.y);
      enemy.hp -= getAttackDamage();
      if (enemy.hp <= 0) {
        handleEnemyDefeated(enemy);
      }
    });

    // Trigger attack animation window
    hero.animation.attackAnimMs = ATTACK_ANIMATION_TTL_MS;
  }

  function handleEnemyDefeated(defeatedEnemy: Enemy) {
    state.stats.gold += GOLD_REWARD_PER_KILL;
    state.stats.kills += 1;

    // Add experience points
    addExp(EXP_REWARD_PER_KILL);

    updateHud();

    // 몬스터를 배열에서 제거
    state.enemies = state.enemies.filter(
      (enemy) => enemy.id !== defeatedEnemy.id
    );

    // 모든 몬스터가 죽었으면 리스폰 타이머 설정
    if (state.enemies.length === 0) {
      state.pendingRespawnAtMs = state.currentTimeMs + ENEMY_RESPAWN_DELAY_MS;
    }
  }

  function render() {
    fitCanvasToContainer();
    applyViewportTransform();
    drawBackground();
    drawEnemy();
    drawHero();
    drawLightningEffects();
  }

  function drawBackground() {
    ctx.fillStyle = "#0f141a";
    ctx.fillRect(0, 0, WORLD_WIDTH, WORLD_HEIGHT);
    const GRID_SPACING = 40;
    ctx.strokeStyle = "rgba(255,255,255,0.04)";
    ctx.lineWidth = 1;
    ctx.beginPath();
    for (let x = 0; x <= WORLD_WIDTH; x += GRID_SPACING) {
      ctx.moveTo(x, 0);
      ctx.lineTo(x, WORLD_HEIGHT);
    }
    for (let y = 0; y <= WORLD_HEIGHT; y += GRID_SPACING) {
      ctx.moveTo(0, y);
      ctx.lineTo(WORLD_WIDTH, y);
    }
    ctx.stroke();
  }

  function drawHero() {
    const h = state.hero;
    ctx.save();
    // Ensure crisp pixel look for images
    (
      ctx as CanvasRenderingContext2D & { imageSmoothingEnabled?: boolean }
    ).imageSmoothingEnabled = false;

    const current: HeroAnimState = h.animation.current;
    const direction = h.direction;
    const spriteKey = `${current}_${direction}` as keyof typeof sprites;
    const res = sprites[spriteKey];
    const size = HERO_SPRITE_SIZE_UNITS;
    const destX = h.x - size / 2;
    const destY = h.y - size / 2;

    if (res && res.loaded && res.frames > 0) {
      const frame = h.animation.frameIndex % res.frames;
      const sx = frame * res.frameSize;
      const sy = 0;
      ctx.drawImage(
        res.image,
        sx,
        sy,
        res.frameSize,
        res.frameSize,
        destX,
        destY,
        size,
        size
      );
      ctx.restore();
      return;
    }

    // Fallback: programmatic pixel-art
    drawHeroPixelFallback(h.x, h.y, current, direction, h.animation.frameIndex);
    ctx.restore();
  }

  function updateHeroAnimation(
    inRange: boolean,
    moveDistanceThisFrame: number,
    deltaMs: number
  ) {
    const anim = state.hero.animation;
    const was = anim.current;

    // Attack animation takes precedence while active
    if (anim.attackAnimMs > 0) {
      anim.current = "attack";
    } else if (state.enemies.length === 0) {
      anim.current = "idle";
    } else if (inRange) {
      anim.current = "idle"; // in range but cooling down
    } else if (moveDistanceThisFrame > 0.0001) {
      anim.current = "move";
    } else {
      anim.current = "idle";
    }

    anim.attackAnimMs = Math.max(0, anim.attackAnimMs - deltaMs);

    if (anim.current !== was) {
      anim.frameIndex = 0;
      anim.frameElapsedMs = 0;
      return;
    }

    anim.frameElapsedMs += deltaMs;
    const meta = ANIM_META[anim.current];
    if (anim.frameElapsedMs >= meta.frameDurationMs) {
      anim.frameElapsedMs -= meta.frameDurationMs;
      anim.frameIndex = (anim.frameIndex + 1) % meta.frames;
    }
  }

  function drawHeroPixelFallback(
    x: number,
    y: number,
    stateName: HeroAnimState,
    direction: Direction,
    frameIndex: number
  ) {
    const GRID = 16;
    const UNIT = HERO_SPRITE_SIZE_UNITS / GRID;
    const originX = x - HERO_SPRITE_SIZE_UNITS / 2;
    const originY = y - HERO_SPRITE_SIZE_UNITS / 2;

    function px(ix: number, iy: number, w: number, h: number, color: string) {
      ctx.fillStyle = color;
      ctx.fillRect(
        originX + ix * UNIT,
        originY + iy * UNIT,
        w * UNIT,
        h * UNIT
      );
    }

    // Base body
    const bodyColor = "#ffd36e";
    const outline = "#3a2b11";

    // Apply direction-based transformations
    const isFlipped = direction === "left";
    const isUp = direction === "up";

    // Outline
    px(5, 2, 6, 1, outline);
    px(4, 3, 1, 8, outline);
    px(11, 3, 1, 8, outline);
    px(5, 11, 6, 1, outline);
    // Face/body fill
    px(5, 3, 6, 8, bodyColor);

    // Eyes (idle blink via frame) - adjust position based on direction
    const eyeOpen = stateName !== "attack" && frameIndex % 2 === 0;
    if (isUp) {
      // Eyes higher for up-facing character
      px(6, 4, 1, 1, eyeOpen ? "#4a3b1a" : bodyColor);
      px(9, 4, 1, 1, eyeOpen ? "#4a3b1a" : bodyColor);
    } else {
      px(6, 5, 1, 1, eyeOpen ? "#4a3b1a" : bodyColor);
      px(9, 5, 1, 1, eyeOpen ? "#4a3b1a" : bodyColor);
    }

    // Arms/legs animation
    if (stateName === "move") {
      const phase = frameIndex % 4; // 0: L forward, 1: neutral, 2: R forward, 3: neutral
      const footFront = "#ffe57a"; // brighter for front/forward foot
      const footBack = "#caa24e"; // dimmer for back foot

      if (isFlipped) {
        // Left-facing character - flip arm and leg movements
        if (phase === 0) {
          // Right leg forward, left leg back (flipped)
          px(11, 6, 2, 1, outline);
          px(11, 7, 2, 1, bodyColor);
          px(3, 6, 3, 1, outline);
          px(3, 7, 3, 1, bodyColor);
          px(10, 12, 1, 2, outline);
          px(10, 13, 1, 1, footFront);
          px(5, 12, 1, 2, outline);
          px(5, 13, 1, 1, footBack);
        } else if (phase === 1) {
          px(11, 6, 2, 1, outline);
          px(11, 7, 2, 1, bodyColor);
          px(3, 6, 2, 1, outline);
          px(3, 7, 2, 1, bodyColor);
          px(9, 12, 1, 2, outline);
          px(9, 13, 1, 1, footBack);
          px(6, 12, 1, 2, outline);
          px(6, 13, 1, 1, footBack);
        } else if (phase === 2) {
          px(11, 6, 3, 1, outline);
          px(11, 7, 3, 1, bodyColor);
          px(3, 6, 2, 1, outline);
          px(3, 7, 2, 1, bodyColor);
          px(9, 12, 1, 2, outline);
          px(9, 13, 1, 1, footBack);
          px(5, 12, 1, 2, outline);
          px(5, 13, 1, 1, footFront);
        } else {
          px(11, 6, 2, 1, outline);
          px(11, 7, 2, 1, bodyColor);
          px(3, 6, 2, 1, outline);
          px(3, 7, 2, 1, bodyColor);
          px(9, 12, 1, 2, outline);
          px(9, 13, 1, 1, footBack);
          px(6, 12, 1, 2, outline);
          px(6, 13, 1, 1, footBack);
        }
      } else {
        // Right-facing character (default)
        if (phase === 0) {
          // Left leg forward, right leg back
          px(3, 6, 2, 1, outline);
          px(3, 7, 2, 1, bodyColor);
          px(11, 6, 3, 1, outline);
          px(11, 7, 3, 1, bodyColor);
          px(5, 12, 1, 2, outline);
          px(5, 13, 1, 1, footFront);
          px(10, 12, 1, 2, outline);
          px(10, 13, 1, 1, footBack);
        } else if (phase === 1) {
          px(3, 6, 2, 1, outline);
          px(3, 7, 2, 1, bodyColor);
          px(11, 6, 2, 1, outline);
          px(11, 7, 2, 1, bodyColor);
          px(6, 12, 1, 2, outline);
          px(6, 13, 1, 1, footBack);
          px(9, 12, 1, 2, outline);
          px(9, 13, 1, 1, footBack);
        } else if (phase === 2) {
          px(2, 6, 3, 1, outline);
          px(2, 7, 3, 1, bodyColor);
          px(11, 6, 2, 1, outline);
          px(11, 7, 2, 1, bodyColor);
          px(6, 12, 1, 2, outline);
          px(6, 13, 1, 1, footBack);
          px(10, 12, 1, 2, outline);
          px(10, 13, 1, 1, footFront);
        } else {
          px(3, 6, 2, 1, outline);
          px(3, 7, 2, 1, bodyColor);
          px(11, 6, 2, 1, outline);
          px(11, 7, 2, 1, bodyColor);
          px(6, 12, 1, 2, outline);
          px(6, 13, 1, 1, footBack);
          px(9, 12, 1, 2, outline);
          px(9, 13, 1, 1, footBack);
        }
      }
    } else if (stateName === "attack") {
      const phase = frameIndex % ANIM_META.attack.frames;
      const slashColor = "#ffe57a";

      if (isFlipped) {
        // Left-facing attack
        if (phase === 0) {
          px(2, 6, 2, 1, slashColor);
        } else if (phase === 1) {
          px(1, 6, 3, 1, slashColor);
          px(1, 5, 1, 1, slashColor);
        } else if (phase === 2) {
          px(1, 6, 3, 1, slashColor);
          px(1, 5, 1, 1, slashColor);
          px(1, 7, 1, 1, slashColor);
        } else {
          px(2, 6, 2, 1, slashColor);
        }
      } else if (isUp) {
        // Up-facing attack
        if (phase === 0) {
          px(6, 1, 1, 2, slashColor);
        } else if (phase === 1) {
          px(5, 1, 1, 3, slashColor);
          px(4, 1, 1, 1, slashColor);
        } else if (phase === 2) {
          px(5, 1, 1, 3, slashColor);
          px(4, 1, 1, 1, slashColor);
          px(6, 1, 1, 1, slashColor);
        } else {
          px(6, 1, 1, 2, slashColor);
        }
      } else {
        // Right-facing attack (default)
        if (phase === 0) {
          px(12, 6, 2, 1, slashColor);
        } else if (phase === 1) {
          px(12, 6, 3, 1, slashColor);
          px(14, 5, 1, 1, slashColor);
        } else if (phase === 2) {
          px(12, 6, 3, 1, slashColor);
          px(14, 5, 1, 1, slashColor);
          px(14, 7, 1, 1, slashColor);
        } else {
          px(12, 6, 2, 1, slashColor);
        }
      }

      // Arms position based on direction
      if (isFlipped) {
        // Left-facing attack arms
        px(11, 6, 2, 1, outline);
        px(11, 7, 2, 1, bodyColor);
        px(3, 6, 2, 1, outline);
        px(3, 7, 2, 1, bodyColor);
      } else {
        // Right-facing attack arms (default)
        px(3, 6, 2, 1, outline);
        px(3, 7, 2, 1, bodyColor);
        px(11, 6, 2, 1, outline);
        px(11, 7, 2, 1, bodyColor);
      }
      // stance
      px(6, 12, 1, 2, outline);
      px(9, 12, 1, 2, outline);
    } else {
      // idle subtle breathing: move chest one pixel every other frame
      // Idle: static pose, no chest movement
      // simple arms and legs at rest
      px(4, 7, 1, 1, outline);
      px(11, 7, 1, 1, outline);
      px(6, 12, 1, 2, outline);
      px(9, 12, 1, 2, outline);
    }
  }

  function tryLoadSprite(src: string, frameSize: number): SpriteResource {
    const image = new Image();
    const resource: SpriteResource = {
      image,
      frameSize,
      frames: 0,
      loaded: false,
    };
    image.onload = () => {
      const frames = Math.max(1, Math.floor(image.width / frameSize));
      resource.frames = frames;
      resource.loaded = true;
    };
    image.onerror = () => {
      resource.loaded = false;
    };
    image.src = src;
    return resource;
  }

  function drawEnemy() {
    // 모든 몬스터를 렌더링
    for (const enemy of state.enemies) {
      ctx.save();
      ctx.fillStyle = "#72c2ff";
      drawCircle(enemy.x, enemy.y, enemy.radius);
      ctx.restore();

      const BAR_WIDTH = 60;
      const BAR_HEIGHT = 6;
      const hpRatio = Math.max(0, Math.min(1, enemy.hp / enemy.maxHp));
      const barX = enemy.x - BAR_WIDTH / 2;
      const barY = enemy.y - enemy.radius - 14;

      ctx.fillStyle = "rgba(0,0,0,0.5)";
      ctx.fillRect(barX, barY, BAR_WIDTH, BAR_HEIGHT);
      ctx.fillStyle = hpRatio > 0.4 ? "#7bff8e" : "#ff6e6e";
      ctx.fillRect(barX, barY, BAR_WIDTH * hpRatio, BAR_HEIGHT);
      ctx.strokeStyle = "rgba(255,255,255,0.15)";
      ctx.strokeRect(barX, barY, BAR_WIDTH, BAR_HEIGHT);
    }
  }

  function drawLightningEffects() {
    for (const fx of state.effects) {
      if (fx.type !== "lightning") continue;
      const alpha = Math.max(0, fx.ttlMs / LIGHTNING_TTL_MS);
      ctx.save();
      ctx.globalAlpha = 0.6 * alpha + 0.3;
      ctx.strokeStyle = "#ffe57a";
      ctx.lineWidth = 2;
      ctx.shadowColor = "#ffe57a";
      ctx.shadowBlur = 14;
      ctx.beginPath();
      ctx.moveTo(fx.points[0].x, fx.points[0].y);
      for (let i = 1; i < fx.points.length; i++) {
        ctx.lineTo(fx.points[i].x, fx.points[i].y);
      }
      ctx.stroke();
      ctx.restore();
    }
  }

  function drawCircle(x: number, y: number, r: number) {
    ctx.beginPath();
    ctx.arc(x, y, r, 0, Math.PI * 2);
    ctx.fill();
  }

  function spawnLightningEffect(
    x1: number,
    y1: number,
    x2: number,
    y2: number
  ) {
    const points = generateLightningPoints(
      x1,
      y1,
      x2,
      y2,
      LIGHTNING_SEGMENT_COUNT,
      LIGHTNING_JITTER_UNITS
    );
    state.effects.push({ type: "lightning", points, ttlMs: LIGHTNING_TTL_MS });
  }

  function updateEffects(deltaMs: number) {
    for (let i = state.effects.length - 1; i >= 0; i--) {
      const fx = state.effects[i];
      fx.ttlMs -= deltaMs;
      if (fx.ttlMs <= 0) state.effects.splice(i, 1);
    }
  }

  function generateLightningPoints(
    x1: number,
    y1: number,
    x2: number,
    y2: number,
    segments: number,
    jitter: number
  ) {
    const points: Array<{ x: number; y: number }> = [];
    for (let i = 0; i <= segments; i++) {
      const t = i / segments;
      const bx = x1 + (x2 - x1) * t;
      const by = y1 + (y2 - y1) * t;
      const nx = by - y1;
      const ny = -(bx - x1);
      const len = Math.hypot(nx, ny) || 1;
      const jitterAmount =
        (Math.random() * 2 - 1) * jitter * (1 - Math.abs(0.5 - t) * 1.7);
      points.push({
        x: bx + (nx / len) * jitterAmount,
        y: by + (ny / len) * jitterAmount,
      });
    }
    return points;
  }

  function spawnEnemies() {
    const spawnPadding = 80;
    const targetAreaY: [number, number] = [
      WORLD_HEIGHT * 0.18,
      WORLD_HEIGHT * 0.48,
    ];

    // 3-4마리의 몬스터 생성
    const enemyCount = randomRange(3, 5); // 3, 4, 5 중 하나 (5는 포함되지 않음)

    for (let i = 0; i < enemyCount; i++) {
      const x = randomRange(spawnPadding, WORLD_WIDTH - spawnPadding);
      const y = randomRange(targetAreaY[0], targetAreaY[1]);
      const maxHp = BASE_ENEMY_MAX_HP;

      // 다른 몬스터와 겹치지 않도록 체크
      let attempts = 0;
      let validPosition = false;
      let finalX = x;
      let finalY = y;

      while (!validPosition && attempts < 10) {
        validPosition = true;
        for (const existingEnemy of state.enemies) {
          const distance = Math.hypot(
            finalX - existingEnemy.x,
            finalY - existingEnemy.y
          );
          if (distance < ENEMY_RADIUS * 3) {
            // 최소 거리 보장
            validPosition = false;
            finalX = randomRange(spawnPadding, WORLD_WIDTH - spawnPadding);
            finalY = randomRange(targetAreaY[0], targetAreaY[1]);
            break;
          }
        }
        attempts++;
      }

      state.enemies.push({
        x: finalX,
        y: finalY,
        radius: ENEMY_RADIUS,
        hp: maxHp,
        maxHp,
        id: state.nextEnemyId++,
      });
    }
  }

  function findClosestEnemy() {
    if (state.enemies.length === 0) return null;

    const hero = state.hero;
    let closestEnemy = state.enemies[0];
    let closestDistance = Math.hypot(
      hero.x - closestEnemy.x,
      hero.y - closestEnemy.y
    );

    for (let i = 1; i < state.enemies.length; i++) {
      const enemy = state.enemies[i];
      const distance = Math.hypot(hero.x - enemy.x, hero.y - enemy.y);
      if (distance < closestDistance) {
        closestDistance = distance;
        closestEnemy = enemy;
      }
    }

    return closestEnemy;
  }

  function findMultipleTargets(
    primaryTarget: Enemy,
    maxTargets: number
  ): Enemy[] {
    if (state.enemies.length === 0) return [];

    const hero = state.hero;
    const targets: Enemy[] = [];

    // Always include the primary target
    targets.push(primaryTarget);

    // If we only need 1 target, return early
    if (maxTargets <= 1) return targets;

    // Find additional targets by distance
    const remainingEnemies = state.enemies.filter(
      (enemy) => enemy !== primaryTarget
    );
    const sortedEnemies = remainingEnemies.sort((a, b) => {
      const distA = Math.hypot(a.x - hero.x, a.y - hero.y);
      const distB = Math.hypot(b.x - hero.x, b.y - hero.y);
      return distA - distB;
    });

    // Add up to maxTargets - 1 additional targets
    const additionalTargets = sortedEnemies.slice(0, maxTargets - 1);
    targets.push(...additionalTargets);

    return targets;
  }

  function calculateExpRequired(level: number): number {
    if (level <= 1) return BASE_EXP_REQUIRED;
    return Math.floor(BASE_EXP_REQUIRED * Math.pow(EXP_MULTIPLIER, level - 1));
  }

  function addExp(amount: number) {
    const playerStats = state.playerStats;
    playerStats.exp += amount;
    console.log(
      "addExp called with amount:",
      amount,
      "current exp:",
      playerStats.exp,
      "expToNext:",
      playerStats.expToNext
    );

    // Check for level up
    while (
      playerStats.exp >= playerStats.expToNext &&
      playerStats.level < MAX_LEVEL
    ) {
      playerStats.exp -= playerStats.expToNext;
      playerStats.level++;
      playerStats.statPoints += STAT_POINTS_PER_LEVEL;
      console.log(
        "Level up! New level:",
        playerStats.level,
        "Stat points:",
        playerStats.statPoints
      );

      // Calculate next level exp requirement
      playerStats.expToNext = calculateExpRequired(playerStats.level + 1);

      // Show level up notification (blinking HUD)
      showLevelUpNotification();
    }

    // Cap at max level
    if (playerStats.level >= MAX_LEVEL) {
      playerStats.exp = 0;
      playerStats.expToNext = 0;
    }
  }

  function showLevelUpNotification() {
    // Add blinking effect to level display
    const levelStatElement = document.getElementById("level-stat");
    if (levelStatElement) {
      levelStatElement.classList.add("level-up-notification");

      // Add click listener to open popup
      const clickHandler = () => {
        levelStatElement.classList.remove("level-up-notification");
        levelStatElement.removeEventListener("click", clickHandler);
        showCharacterPopup();
      };
      levelStatElement.addEventListener("click", clickHandler);
      levelStatElement.style.cursor = "pointer";
    }
  }

  function showCharacterPopup() {
    const popup = document.getElementById("character-popup") as HTMLDivElement;
    if (!popup) return;

    // Update character info
    updateCharacterInfo();

    // Update stat info
    updateLevelUpPopup();

    popup.style.display = "flex";
  }

  function hideCharacterPopup() {
    const popup = document.getElementById("character-popup") as HTMLDivElement;
    if (!popup) return;

    // Remove blinking effect
    const levelStatElement = document.getElementById("level-stat");
    if (levelStatElement) {
      levelStatElement.classList.remove("level-up-notification");
    }

    popup.style.display = "none";
  }

  function updateLevelUpPopup() {
    const playerStats = state.playerStats;

    // Update available points
    const availablePointsEl = document.getElementById("available-points");
    if (availablePointsEl) {
      availablePointsEl.textContent = String(playerStats.statPoints);
    }

    // Update stat values
    const attackSpeedEl = document.getElementById("attack-speed-value");
    if (attackSpeedEl) {
      attackSpeedEl.textContent = String(playerStats.attackSpeed);
    }

    const attackPowerEl = document.getElementById("attack-power-value");
    if (attackPowerEl) {
      attackPowerEl.textContent = String(playerStats.attackPower);
    }

    const maxTargetsEl = document.getElementById("max-targets-value");
    if (maxTargetsEl) {
      maxTargetsEl.textContent = String(playerStats.maxTargets);
    }

    // Update button states
    const attackSpeedBtn = document.getElementById(
      "attack-speed-plus"
    ) as HTMLButtonElement;
    const attackPowerBtn = document.getElementById(
      "attack-power-plus"
    ) as HTMLButtonElement;
    const maxTargetsBtn = document.getElementById(
      "max-targets-plus"
    ) as HTMLButtonElement;

    if (attackSpeedBtn) {
      attackSpeedBtn.disabled = playerStats.statPoints < 1;
    }
    if (attackPowerBtn) {
      attackPowerBtn.disabled = playerStats.statPoints < 1;
    }
    if (maxTargetsBtn) {
      maxTargetsBtn.disabled =
        playerStats.statPoints < 5 || playerStats.maxTargets >= 5;
    }
  }

  function addStatPoint(
    statType: "attackSpeed" | "attackPower" | "maxTargets"
  ) {
    const playerStats = state.playerStats;

    // Check if player has enough points
    const cost = statType === "maxTargets" ? 5 : 1;
    if (playerStats.statPoints < cost) return;

    // Prevent multiple rapid clicks
    if (playerStats._isProcessingStat) return;
    playerStats._isProcessingStat = true;

    playerStats.statPoints -= cost;

    if (statType === "attackSpeed") {
      playerStats.attackSpeed += 2; // 2% per point
    } else if (statType === "attackPower") {
      playerStats.attackPower += 1; // 1 damage per point
    } else if (statType === "maxTargets") {
      if (playerStats.maxTargets < 5) {
        // Cap at 5 targets
        playerStats.maxTargets++;
      } else {
        playerStats.statPoints += cost; // Refund the points
        playerStats._isProcessingStat = false;
        return;
      }
    }

    updateLevelUpPopup();

    // Reset processing flag after a short delay
    setTimeout(() => {
      playerStats._isProcessingStat = false;
    }, 100);
  }

  function setupLevelUpPopupListeners() {
    // Stat buttons
    const attackSpeedBtn = document.getElementById("attack-speed-plus");
    const attackPowerBtn = document.getElementById("attack-power-plus");
    const maxTargetsBtn = document.getElementById("max-targets-plus");

    if (attackSpeedBtn) {
      attackSpeedBtn.addEventListener("click", () =>
        addStatPoint("attackSpeed")
      );
    }
    if (attackPowerBtn) {
      attackPowerBtn.addEventListener("click", () =>
        addStatPoint("attackPower")
      );
    }
    if (maxTargetsBtn) {
      maxTargetsBtn.addEventListener("click", () => addStatPoint("maxTargets"));
    }

    // Character popup close button
    const characterCloseBtn = document.getElementById("character-close");
    if (characterCloseBtn) {
      characterCloseBtn.addEventListener("click", () => {
        hideCharacterPopup();
        // If there are still stat points, show notification again
        if (state.playerStats.statPoints > 0) {
          showLevelUpNotification();
        }
      });
    }

    // Click outside to close
    const popup = document.getElementById("character-popup");
    if (popup) {
      popup.addEventListener("click", (e) => {
        if (e.target === popup) {
          hideCharacterPopup();
          // If there are still stat points, show notification again
          if (state.playerStats.statPoints > 0) {
            showLevelUpNotification();
          }
        }
      });
    }
  }

  function getAttackInterval(): number {
    const speedBonus = state.playerStats.attackSpeed / 100;
    return BASE_ATTACK_INTERVAL_MS * (1 - speedBonus);
  }

  function getAttackDamage(): number {
    return BASE_ATTACK_DAMAGE_AMOUNT + state.playerStats.attackPower;
  }

  function fitCanvasToContainer() {
    const rect = containerElement.getBoundingClientRect();
    const dpr = state.devicePixelRatio;
    const targetWidth = Math.max(1, Math.floor(rect.width * dpr));
    const targetHeight = Math.max(1, Math.floor(rect.height * dpr));
    if (
      canvasElement.width !== targetWidth ||
      canvasElement.height !== targetHeight
    ) {
      canvasElement.width = targetWidth;
      canvasElement.height = targetHeight;
    }
  }

  function applyViewportTransform() {
    const scale = Math.min(
      canvasElement.width / WORLD_WIDTH,
      canvasElement.height / WORLD_HEIGHT
    );
    state.viewportScale = scale;
    const offsetX = (canvasElement.width - WORLD_WIDTH * scale) * 0.5;
    const offsetY = (canvasElement.height - WORLD_HEIGHT * scale) * 0.5;
    ctx.setTransform(scale, 0, 0, scale, offsetX, offsetY);
  }

  function updateHud() {
    const playerStats = state.playerStats;

    // Update level display
    if (hudLevelElement) {
      hudLevelElement.textContent = String(playerStats.level);
    }

    // Update exp display
    if (hudExpElement) {
      if (playerStats.level >= MAX_LEVEL) {
        hudExpElement.textContent = "MAX";
      } else {
        hudExpElement.textContent = `${playerStats.exp}/${playerStats.expToNext}`;
      }
    }

    // Update gold display
    if (hudGoldElement) {
      hudGoldElement.textContent = String(state.stats.gold);
    }
  }

  function updateCharacterInfo() {
    const playerStats = state.playerStats;

    // Update character level
    const characterLevelEl = document.getElementById("character-level");
    if (characterLevelEl) {
      characterLevelEl.textContent = String(playerStats.level);
    }

    // Update character exp
    const characterExpEl = document.getElementById("character-exp");
    if (characterExpEl) {
      if (playerStats.level >= MAX_LEVEL) {
        characterExpEl.textContent = "MAX";
      } else {
        characterExpEl.textContent = `${playerStats.exp}/${playerStats.expToNext}`;
      }
    }

    // Update character gold
    const characterGoldEl = document.getElementById("character-gold");
    if (characterGoldEl) {
      characterGoldEl.textContent = String(state.stats.gold);
    }

    // Update equipped items display
    updateEquippedItemsDisplay();
  }

  function updateEquippedItemsDisplay() {
    const weaponEl = document.getElementById("equipped-weapon");
    const helmetEl = document.getElementById("equipped-helmet");
    const armorEl = document.getElementById("equipped-armor");
    const shoesEl = document.getElementById("equipped-shoes");

    if (weaponEl) {
      weaponEl.textContent = state.equippedItems.weapon?.name || "없음";
    }
    if (helmetEl) {
      helmetEl.textContent = state.equippedItems.helmet?.name || "없음";
    }
    if (armorEl) {
      armorEl.textContent = state.equippedItems.armor?.name || "없음";
    }
    if (shoesEl) {
      shoesEl.textContent = state.equippedItems.shoes?.name || "없음";
    }
  }

  function randomRange(min: number, max: number) {
    return min + Math.random() * (max - min);
  }

  // ------------------------------
  // Persistence & Offline Gains
  // ------------------------------
  function persistProgress() {
    try {
      const payload = {
        gold: state.stats.gold,
        exp: state.stats.exp,
        kills: state.stats.kills,
        lastTs: Date.now(),
      };
      localStorage.setItem(PROGRESS_KEY, JSON.stringify(payload));
      try {
        localStorage.setItem(LAST_ACTIVE_KEY, String(Date.now()));
      } catch {}
    } catch {}
  }

  function tryResumeProgress() {
    try {
      const raw = localStorage.getItem(PROGRESS_KEY);
      const hiddenRaw = localStorage.getItem(HIDDEN_AT_KEY);
      const data = raw
        ? (JSON.parse(raw) as {
            gold: number;
            exp: number;
            kills: number;
            lastTs: number;
          })
        : null;
      const hiddenAt = hiddenRaw ? Number(hiddenRaw) : NaN;
      const lastActiveRaw = localStorage.getItem(LAST_ACTIVE_KEY);
      const savedLastActive = lastActiveRaw ? Number(lastActiveRaw) : NaN;
      const hasHiddenAnchor = Number.isFinite(hiddenAt);
      if (!data && !hasHiddenAnchor) return;

      // Restore stats
      if (data) {
        if (Number.isFinite(data.gold)) state.stats.gold = data.gold;
        if (Number.isFinite(data.exp)) state.stats.exp = data.exp;
        if (Number.isFinite(data.kills)) state.stats.kills = data.kills;
      }

      // Compute offline window
      const now = Date.now();
      const lastActive = Number.isFinite(savedLastActive)
        ? savedLastActive
        : data && typeof data.lastTs === "number"
        ? data.lastTs
        : state.lastWallClockMs;
      const baseTs = hasHiddenAnchor ? hiddenAt : lastActive;
      const elapsedMs = Math.max(0, now - baseTs);
      if (elapsedMs <= 0) return;
      const result = simulateOffline(elapsedMs);
      // Always show overlay if any elapsed time; apply gains only if > 0
      if (result.killsGained > 0) {
        state.stats.gold += result.goldGained;
        state.stats.exp += result.expGained;
        state.stats.kills += result.killsGained;
      }
      showOfflineOverlay(
        result.killsGained,
        result.goldGained,
        result.expGained,
        elapsedMs
      );
      // Update persisted time to now
      localStorage.setItem(
        PROGRESS_KEY,
        JSON.stringify({
          gold: state.stats.gold,
          exp: state.stats.exp,
          kills: state.stats.kills,
          lastTs: now,
        })
      );
      try {
        localStorage.removeItem(HIDDEN_AT_KEY);
      } catch {}
      updateHud();
    } catch {}
  }

  // Simulate kills over elapsed time with progressive enemy HP
  function simulateOffline(elapsedMs: number) {
    let timeSpent = 0;
    let killsGained = 0;
    const damagePerHit = BASE_ATTACK_DAMAGE_AMOUNT;
    const hitInterval = BASE_ATTACK_INTERVAL_MS;
    while (timeSpent < elapsedMs) {
      const enemyMaxHp = BASE_ENEMY_MAX_HP;
      const hitsToKill = Math.ceil(enemyMaxHp / damagePerHit);
      const timeToKillMs = hitsToKill * hitInterval;
      const cycleMs = timeToKillMs + ENEMY_RESPAWN_DELAY_MS;
      if (timeSpent + cycleMs > elapsedMs) break;
      timeSpent += cycleMs;
      killsGained += 1;
      // Safety cap to avoid extremely long loops
      if (killsGained > 500000) break;
    }
    return {
      killsGained,
      goldGained: killsGained * GOLD_REWARD_PER_KILL,
      expGained: killsGained * EXP_REWARD_PER_KILL,
    };
  }

  // Overlay helpers
  function showOfflineOverlay(
    kills: number,
    gold: number,
    exp: number,
    elapsedMs: number
  ) {
    // Gate by developer toggle, also respect while overlay visible
    const overlayEnabled = (() => {
      try {
        const raw = localStorage.getItem(OVERLAY_TOGGLE_KEY);
        return raw === null ? true : raw === "1";
      } catch {
        return true;
      }
    })();
    if (!overlayEnabled) {
      if (overlayEl) overlayEl.classList.remove("show");
      return;
    }

    const el = overlayEl;
    const content = overlayContentEl;
    const closeBtn = overlayCloseBtn;
    if (!el || !content) return;
    const seconds = Math.floor(elapsedMs / 1000);
    content.textContent = `${seconds}초 동안 처치 ${kills} / +${gold} G / +${exp} EXP`;
    el.classList.add("show");
    if (closeBtn) {
      const onClose = () => {
        el.classList.remove("show");
        closeBtn.removeEventListener("click", onClose);
      };
      closeBtn.addEventListener("click", onClose);
    }
  }

  // ------------------------------
  // Tab System
  // ------------------------------
  function switchTab(
    tabName: "character" | "inventory" | "gacha" | "enhancement"
  ) {
    // Update active tab
    document.querySelectorAll(".tab").forEach((tab) => {
      tab.classList.remove("active");
    });

    const activeTab = document.getElementById(`${tabName}-tab`);
    if (activeTab) {
      activeTab.classList.add("active");
    }

    state.currentTab = tabName;
  }

  // ------------------------------
  // Gacha System
  // ------------------------------
  function generateEquipment(
    grade: EquipmentGrade,
    type: EquipmentType
  ): Equipment {
    const equipmentNames = {
      weapon: {
        S: ["전설의 검", "신의 창", "마법의 지팡이"],
        A: ["명검", "강화된 도끼", "마법 검"],
        B: ["철검", "강철 도끼", "마법 지팡이"],
        C: ["나무 검", "구리 도끼", "단순한 지팡이"],
        D: ["나무 막대", "돌 도끼", "약한 지팡이"],
      },
      helmet: {
        S: ["전설의 투구", "신의 관", "마법의 모자"],
        A: ["명장의 투구", "강화된 헬멧", "마법 모자"],
        B: ["철 투구", "강철 헬멧", "마법 모자"],
        C: ["가죽 모자", "구리 헬멧", "단순한 모자"],
        D: ["천 모자", "나무 헬멧", "약한 모자"],
      },
      armor: {
        S: ["전설의 갑옷", "신의 로브", "마법의 갑옷"],
        A: ["명장의 갑옷", "강화된 갑옷", "마법 로브"],
        B: ["철 갑옷", "강철 갑옷", "마법 갑옷"],
        C: ["가죽 갑옷", "구리 갑옷", "단순한 로브"],
        D: ["천 갑옷", "나무 갑옷", "약한 로브"],
      },
      shoes: {
        S: ["전설의 신발", "신의 부츠", "마법의 신발"],
        A: ["명장의 신발", "강화된 부츠", "마법 신발"],
        B: ["철 신발", "강철 부츠", "마법 신발"],
        C: ["가죽 신발", "구리 부츠", "단순한 신발"],
        D: ["천 신발", "나무 부츠", "약한 신발"],
      },
    };

    const names = equipmentNames[type][grade];
    const name = names[Math.floor(Math.random() * names.length)];

    // Generate stats based on grade
    const baseStats = {
      S: { attackPower: 20, attackSpeed: 15, maxTargets: 2 },
      A: { attackPower: 15, attackSpeed: 10, maxTargets: 1 },
      B: { attackPower: 10, attackSpeed: 8, maxTargets: 0 },
      C: { attackPower: 5, attackSpeed: 5, maxTargets: 0 },
      D: { attackPower: 2, attackSpeed: 2, maxTargets: 0 },
    };

    const stats = { ...baseStats[grade] };

    // Randomize stats slightly
    Object.keys(stats).forEach((key) => {
      const statKey = key as keyof typeof stats;
      if (stats[statKey] > 0) {
        stats[statKey] = Math.max(
          1,
          stats[statKey] + Math.floor(Math.random() * 3) - 1
        );
      }
    });

    return {
      id: `${type}_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      name,
      grade,
      type,
      stats,
      equipped: false,
    };
  }

  function performGacha(count: number): GachaResult {
    const cost = count === 1 ? 10 : 10; // 11연차도 10 재화

    if (state.gachaCurrency < cost) {
      return { equipment: [], totalCost: 0 };
    }

    state.gachaCurrency -= cost;
    const equipment: Equipment[] = [];

    // Gacha rates: S: 5%, A: 10%, B: 30%, C: 30%, D: 25%
    const rates = { S: 5, A: 10, B: 30, C: 30, D: 25 };
    const equipmentTypes: EquipmentType[] = [
      "weapon",
      "helmet",
      "armor",
      "shoes",
    ];

    // For 11-draw, guarantee at least one A grade
    const guaranteedA = count === 11;
    let hasA = false;

    for (let i = 0; i < count; i++) {
      let grade: EquipmentGrade = "D"; // Default fallback

      if (guaranteedA && i === count - 1 && !hasA) {
        // Last draw and no A grade yet, force A grade
        grade = "A";
      } else {
        const random = Math.random() * 100;
        let cumulative = 0;

        for (const [g, rate] of Object.entries(rates)) {
          cumulative += rate;
          if (random <= cumulative) {
            grade = g as EquipmentGrade;
            break;
          }
        }
      }

      if (grade === "A") hasA = true;

      const type =
        equipmentTypes[Math.floor(Math.random() * equipmentTypes.length)];
      const newEquipment = generateEquipment(grade, type);
      equipment.push(newEquipment);
      state.equipment.push(newEquipment);
    }

    updateGachaCurrency();
    return { equipment, totalCost: cost };
  }

  function updateGachaCurrency() {
    const currencyEl = document.getElementById("gacha-currency-value");
    if (currencyEl) {
      currencyEl.textContent = String(state.gachaCurrency);
    }
  }

  function showGachaPopup() {
    const popup = document.getElementById("gacha-popup") as HTMLDivElement;
    if (!popup) return;

    updateGachaCurrency();
    popup.style.display = "flex";
  }

  function hideGachaPopup() {
    const popup = document.getElementById("gacha-popup") as HTMLDivElement;
    if (!popup) return;
    popup.style.display = "none";
  }

  function displayGachaResults(results: GachaResult) {
    const resultsEl = document.getElementById("gacha-results");
    if (!resultsEl) return;

    resultsEl.innerHTML = "";

    if (results.equipment.length === 0) {
      resultsEl.innerHTML =
        "<div class='no-currency'>가챠 재화가 부족합니다!</div>";
      return;
    }

    results.equipment.forEach((equipment) => {
      const itemEl = document.createElement("div");
      itemEl.className = `gacha-item grade-${equipment.grade.toLowerCase()}`;
      itemEl.innerHTML = `
        <div class="item-grade">${equipment.grade}</div>
        <div class="item-name">${equipment.name}</div>
        <div class="item-type">${getEquipmentTypeName(equipment.type)}</div>
        <div class="item-stats">
          ${
            equipment.stats.attackPower
              ? `공격력 +${equipment.stats.attackPower} `
              : ""
          }
          ${
            equipment.stats.attackSpeed
              ? `공격속도 +${equipment.stats.attackSpeed}% `
              : ""
          }
          ${
            equipment.stats.maxTargets
              ? `타겟수 +${equipment.stats.maxTargets} `
              : ""
          }
        </div>
      `;
      resultsEl.appendChild(itemEl);
    });
  }

  function getEquipmentTypeName(type: EquipmentType): string {
    const names = {
      weapon: "무기",
      helmet: "모자",
      armor: "방어구",
      shoes: "신발",
    };
    return names[type];
  }

  // ------------------------------
  // Inventory System
  // ------------------------------
  function showInventoryPopup() {
    const popup = document.getElementById("inventory-popup") as HTMLDivElement;
    if (!popup) return;

    updateInventoryDisplay();
    popup.style.display = "flex";
  }

  function hideInventoryPopup() {
    const popup = document.getElementById("inventory-popup") as HTMLDivElement;
    if (!popup) return;
    popup.style.display = "none";
  }

  function updateInventoryDisplay() {
    const gridEl = document.getElementById("equipment-grid");
    if (!gridEl) return;

    gridEl.innerHTML = "";

    if (state.equipment.length === 0) {
      gridEl.innerHTML =
        "<div class='no-equipment'>장비가 없습니다. 가챠에서 뽑아보세요!</div>";
      return;
    }

    // Sort equipment based on current sort setting
    const sortedEquipment = [...state.equipment].sort((a, b) => {
      if (state.inventorySortBy === "grade") {
        const gradeOrder = { S: 5, A: 4, B: 3, C: 2, D: 1 };
        return gradeOrder[b.grade] - gradeOrder[a.grade];
      } else {
        // acquired order (by ID, which includes timestamp)
        return b.id.localeCompare(a.id);
      }
    });

    sortedEquipment.forEach((equipment) => {
      const itemEl = document.createElement("div");
      itemEl.className = `equipment-item grade-${equipment.grade.toLowerCase()} ${
        equipment.equipped ? "equipped" : ""
      }`;
      itemEl.innerHTML = `
        <div class="item-grade">${equipment.grade}</div>
        <div class="item-name">${equipment.name}</div>
        <div class="item-type">${getEquipmentTypeName(equipment.type)}</div>
        <div class="item-stats">
          ${
            equipment.stats.attackPower
              ? `공격력 +${equipment.stats.attackPower} `
              : ""
          }
          ${
            equipment.stats.attackSpeed
              ? `공격속도 +${equipment.stats.attackSpeed}% `
              : ""
          }
          ${
            equipment.stats.maxTargets
              ? `타겟수 +${equipment.stats.maxTargets} `
              : ""
          }
        </div>
        <div class="item-actions">
          <button class="equip-btn" data-equipment-id="${equipment.id}">
            ${equipment.equipped ? "해제" : "장착"}
          </button>
        </div>
      `;
      gridEl.appendChild(itemEl);
    });

    // Add event listeners to equip buttons
    const equipButtons = gridEl.querySelectorAll(".equip-btn");
    equipButtons.forEach((button) => {
      button.addEventListener("click", (e) => {
        const equipmentId = (e.target as HTMLButtonElement).getAttribute(
          "data-equipment-id"
        );
        if (equipmentId) {
          toggleEquipment(equipmentId);
        }
      });
    });
  }

  function toggleEquipment(equipmentId: string) {
    const equipment = state.equipment.find((eq) => eq.id === equipmentId);
    if (!equipment) return;

    if (equipment.equipped) {
      // Unequip
      equipment.equipped = false;
      state.equippedItems[equipment.type] = null;
    } else {
      // Equip - first unequip any existing item of the same type
      const existingItem = state.equippedItems[equipment.type];
      if (existingItem) {
        existingItem.equipped = false;
      }

      equipment.equipped = true;
      state.equippedItems[equipment.type] = equipment;
    }

    updateInventoryDisplay();
    updateCharacterEquipmentDisplay();
  }

  function updateCharacterEquipmentDisplay() {
    // This will be called to update the character popup to show equipped items
    // For now, we'll just update the stats
    updatePlayerStatsFromEquipment();
  }

  function updatePlayerStatsFromEquipment() {
    // Reset base stats
    state.playerStats.attackSpeed = 0;
    state.playerStats.attackPower = 0;
    state.playerStats.maxTargets = 1;

    // Add equipment bonuses
    Object.values(state.equippedItems).forEach((equipment) => {
      if (equipment) {
        if (equipment.stats.attackSpeed) {
          state.playerStats.attackSpeed += equipment.stats.attackSpeed;
        }
        if (equipment.stats.attackPower) {
          state.playerStats.attackPower += equipment.stats.attackPower;
        }
        if (equipment.stats.maxTargets) {
          state.playerStats.maxTargets += equipment.stats.maxTargets;
        }
      }
    });

    updateHud();
  }

  // Setup gacha and inventory event listeners
  function setupGachaAndInventoryListeners() {
    // Gacha buttons
    const singleGachaBtn = document.getElementById("single-gacha");
    const multiGachaBtn = document.getElementById("multi-gacha");
    const gachaCloseBtn = document.getElementById("gacha-close");

    if (singleGachaBtn) {
      singleGachaBtn.addEventListener("click", () => {
        const results = performGacha(1);
        displayGachaResults(results);
      });
    }

    if (multiGachaBtn) {
      multiGachaBtn.addEventListener("click", () => {
        const results = performGacha(11);
        displayGachaResults(results);
      });
    }

    if (gachaCloseBtn) {
      gachaCloseBtn.addEventListener("click", hideGachaPopup);
    }

    // Inventory close button
    const inventoryCloseBtn = document.getElementById("inventory-close");
    if (inventoryCloseBtn) {
      inventoryCloseBtn.addEventListener("click", hideInventoryPopup);
    }

    // Click outside to close popups
    const gachaPopup = document.getElementById("gacha-popup");
    const inventoryPopup = document.getElementById("inventory-popup");

    if (gachaPopup) {
      gachaPopup.addEventListener("click", (e) => {
        if (e.target === gachaPopup) {
          hideGachaPopup();
        }
      });
    }

    if (inventoryPopup) {
      inventoryPopup.addEventListener("click", (e) => {
        if (e.target === inventoryPopup) {
          hideInventoryPopup();
        }
      });
    }
  }
}
