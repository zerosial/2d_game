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
} | null;

export default function GameCanvas() {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const goldRef = useRef<HTMLSpanElement | null>(null);
  const expRef = useRef<HTMLSpanElement | null>(null);
  const statusRef = useRef<HTMLDivElement | null>(null);

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
      statusRef.current
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
  hudStatusElement: HTMLDivElement
) {
  // Constants
  const WORLD_WIDTH = 540;
  const WORLD_HEIGHT = 960;

  const HERO_RADIUS = 14;
  const ENEMY_RADIUS = 16;

  const HERO_SPEED_UNITS_PER_SECOND = 140;
  const ATTACK_RANGE_UNITS = 140;
  const ATTACK_INTERVAL_MS = 600;
  const ATTACK_DAMAGE_AMOUNT = 25;

  const BASE_ENEMY_MAX_HP = 100;
  const ENEMY_HP_GROWTH_PER_KILL = 18;

  const GOLD_REWARD_PER_KILL = 5;
  const EXP_REWARD_PER_KILL = 3;
  const ENEMY_RESPAWN_DELAY_MS = 300;

  const LIGHTNING_TTL_MS = 120;
  const LIGHTNING_SEGMENT_COUNT = 16;
  const LIGHTNING_JITTER_UNITS = 6;

  const ctx = canvasElement.getContext("2d", { alpha: false });
  if (!ctx) return () => {};

  const state = {
    devicePixelRatio: window.devicePixelRatio || 1,
    viewportScale: 1,
    lastFrameTimeMs: undefined as number | undefined,
    currentTimeMs: 0,
    hero: {
      x: WORLD_WIDTH / 2,
      y: WORLD_HEIGHT * 0.66,
      radius: HERO_RADIUS,
      attackCooldownMs: 0,
    },
    enemy: null as Enemy,
    pendingRespawnAtMs: 0,
    stats: { gold: 0, exp: 0, kills: 0 },
    effects: [] as LightningEffect[],
    rafId: 0 as number | 0,
  };

  // Init
  fitCanvasToContainer();
  spawnEnemy();
  updateHud();

  // Observers
  const resizeObserver = new ResizeObserver(() => {
    fitCanvasToContainer();
  });
  resizeObserver.observe(containerElement);

  // DPR change listener (with fallback)
  const mq = window.matchMedia(`(resolution: ${window.devicePixelRatio}dppx)`);
  const onDprChange = () => {
    state.devicePixelRatio = window.devicePixelRatio || 1;
    fitCanvasToContainer();
  };
  if (typeof mq.addEventListener === "function") {
    mq.addEventListener("change", onDprChange);
  } else if (typeof (mq as any).addListener === "function") {
    (mq as any).addListener(onDprChange);
  }

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
  };
  state.rafId = window.requestAnimationFrame(loop);

  // Cleanup
  return () => {
    window.cancelAnimationFrame(state.rafId);
    resizeObserver.disconnect();
    if (typeof mq.removeEventListener === "function") {
      mq.removeEventListener("change", onDprChange);
    } else if (typeof (mq as any).removeListener === "function") {
      (mq as any).removeListener(onDprChange);
    }
  };

  // --------------- Helpers ---------------
  function update(deltaSeconds: number, deltaMs: number) {
    const hero = state.hero;
    const enemy = state.enemy;

    // Respawn
    if (
      !enemy &&
      state.pendingRespawnAtMs &&
      state.currentTimeMs >= state.pendingRespawnAtMs
    ) {
      spawnEnemy();
    }

    if (!state.enemy) {
      hudStatusElement.textContent = "...";
      updateEffects(deltaMs);
      return;
    }

    const dx = state.enemy.x - hero.x;
    const dy = state.enemy.y - hero.y;
    const distance = Math.hypot(dx, dy);
    const inRange = distance <= ATTACK_RANGE_UNITS;

    if (inRange) {
      hudStatusElement.textContent = "공격 중";
      hero.attackCooldownMs -= deltaMs;
      if (hero.attackCooldownMs <= 0) {
        performAttack();
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
      }
      if (hero.attackCooldownMs > 0) {
        hero.attackCooldownMs = Math.max(0, hero.attackCooldownMs - deltaMs);
      }
    }

    updateEffects(deltaMs);
  }

  function performAttack() {
    const hero = state.hero;
    const enemy = state.enemy;
    if (!enemy) return;
    spawnLightningEffect(hero.x, hero.y, enemy.x, enemy.y);
    enemy.hp -= ATTACK_DAMAGE_AMOUNT;
    if (enemy.hp <= 0) {
      handleEnemyDefeated();
    }
  }

  function handleEnemyDefeated() {
    state.stats.gold += GOLD_REWARD_PER_KILL;
    state.stats.exp += EXP_REWARD_PER_KILL;
    state.stats.kills += 1;
    updateHud();
    state.enemy = null;
    state.pendingRespawnAtMs = state.currentTimeMs + ENEMY_RESPAWN_DELAY_MS;
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
    ctx.shadowColor = "rgba(255, 211, 110, 0.6)";
    ctx.shadowBlur = 18;
    ctx.fillStyle = "#ffd36e";
    drawCircle(h.x, h.y, h.radius);
    ctx.restore();
  }

  function drawEnemy() {
    const e = state.enemy;
    if (!e) return;
    ctx.save();
    ctx.fillStyle = "#72c2ff";
    drawCircle(e.x, e.y, e.radius);
    ctx.restore();

    const BAR_WIDTH = 60;
    const BAR_HEIGHT = 6;
    const hpRatio = Math.max(0, Math.min(1, e.hp / e.maxHp));
    const barX = e.x - BAR_WIDTH / 2;
    const barY = e.y - e.radius - 14;

    ctx.fillStyle = "rgba(0,0,0,0.5)";
    ctx.fillRect(barX, barY, BAR_WIDTH, BAR_HEIGHT);
    ctx.fillStyle = hpRatio > 0.4 ? "#7bff8e" : "#ff6e6e";
    ctx.fillRect(barX, barY, BAR_WIDTH * hpRatio, BAR_HEIGHT);
    ctx.strokeStyle = "rgba(255,255,255,0.15)";
    ctx.strokeRect(barX, barY, BAR_WIDTH, BAR_HEIGHT);
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

  function spawnEnemy() {
    const spawnPadding = 80;
    const targetAreaY: [number, number] = [
      WORLD_HEIGHT * 0.18,
      WORLD_HEIGHT * 0.48,
    ];
    const x = randomRange(spawnPadding, WORLD_WIDTH - spawnPadding);
    const y = randomRange(targetAreaY[0], targetAreaY[1]);
    const maxHp =
      BASE_ENEMY_MAX_HP + state.stats.kills * ENEMY_HP_GROWTH_PER_KILL;
    state.enemy = { x, y, radius: ENEMY_RADIUS, hp: maxHp, maxHp };
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
}
