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

export default function GameCanvas() {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const goldRef = useRef<HTMLSpanElement | null>(null);
  const expRef = useRef<HTMLSpanElement | null>(null);
  const statusRef = useRef<HTMLDivElement | null>(null);
  const overlayRef = useRef<HTMLDivElement | null>(null);
  const overlayContentRef = useRef<HTMLDivElement | null>(null);
  const overlayCloseRef = useRef<HTMLButtonElement | null>(null);

  useEffect(() => {
    if (
      !containerRef.current ||
      !canvasRef.current ||
      !goldRef.current ||
      !expRef.current ||
      !statusRef.current
    ) {
      return;
    }
    const dispose = startGame(
      containerRef.current,
      canvasRef.current,
      goldRef.current,
      expRef.current,
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
          <div className="stat">
            <span className="label">G</span>
            <span ref={goldRef}>0</span>
          </div>
          <div className="stat">
            <span className="label">EXP</span>
            <span ref={expRef}>0</span>
          </div>
        </div>
        <div className="hud-right">
          <div ref={statusRef}></div>
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
    </div>
  );
}

// ------------------------------
// Game Implementation
// ------------------------------
function startGame(
  containerElement: HTMLDivElement,
  canvasElement: HTMLCanvasElement,
  hudGoldElement: HTMLSpanElement,
  hudExpElement: HTMLSpanElement,
  hudStatusElement: HTMLDivElement,
  overlayEl: HTMLDivElement | null,
  overlayContentEl: HTMLDivElement | null,
  overlayCloseBtn: HTMLButtonElement | null
) {
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
  const ATTACK_INTERVAL_MS = 600;
  const ATTACK_DAMAGE_AMOUNT = 25;

  const BASE_ENEMY_MAX_HP = 100;

  const GOLD_REWARD_PER_KILL = 5;
  const EXP_REWARD_PER_KILL = 3;
  const ENEMY_RESPAWN_DELAY_MS = 300;

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
    effects: [] as LightningEffect[],
    rafId: 0 as number | 0,
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

  // Observers
  const resizeObserver = new ResizeObserver(() => {
    fitCanvasToContainer();
  });
  resizeObserver.observe(containerElement);

  // DPR change listener (with fallback)
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
        hero.attackCooldownMs = ATTACK_INTERVAL_MS;
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

    spawnLightningEffect(hero.x, hero.y, targetEnemy.x, targetEnemy.y);
    targetEnemy.hp -= ATTACK_DAMAGE_AMOUNT;
    if (targetEnemy.hp <= 0) {
      handleEnemyDefeated(targetEnemy);
    }
    // Trigger attack animation window
    hero.animation.attackAnimMs = ATTACK_ANIMATION_TTL_MS;
  }

  function handleEnemyDefeated(defeatedEnemy: Enemy) {
    state.stats.gold += GOLD_REWARD_PER_KILL;
    state.stats.exp += EXP_REWARD_PER_KILL;
    state.stats.kills += 1;
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
    hudGoldElement.textContent = String(state.stats.gold);
    hudExpElement.textContent = String(state.stats.exp);
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
    const damagePerHit = ATTACK_DAMAGE_AMOUNT;
    const hitInterval = ATTACK_INTERVAL_MS;
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
}
