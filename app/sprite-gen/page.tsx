"use client";

import { useEffect, useMemo, useRef } from "react";

type HeroAnimState = "idle" | "move" | "attack";

const FRAME_SIZE = 16; // px
const META: Record<HeroAnimState, { frames: number }> = {
  idle: { frames: 2 },
  move: { frames: 4 },
  attack: { frames: 4 },
};

export default function SpriteGeneratorPage() {
  const idleRef = useRef<HTMLCanvasElement | null>(null);
  const moveRef = useRef<HTMLCanvasElement | null>(null);
  const attackRef = useRef<HTMLCanvasElement | null>(null);

  const strips = useMemo(() => {
    return {
      idle: createStripCanvas("idle", META.idle.frames),
      move: createStripCanvas("move", META.move.frames),
      attack: createStripCanvas("attack", META.attack.frames),
    } as const;
  }, []);

  useEffect(() => {
    const idle = idleRef.current;
    const move = moveRef.current;
    const attack = attackRef.current;
    if (idle) drawToCanvasElement(idle, strips.idle);
    if (move) drawToCanvasElement(move, strips.move);
    if (attack) drawToCanvasElement(attack, strips.attack);
  }, [strips]);

  return (
    <div className="page-root" style={{ width: "100%", padding: 16 }}>
      <div className="page-main" style={{ width: "100%", maxWidth: 860 }}>
        <h2 style={{ marginBottom: 8 }}>스프라이트 생성기 (16x16, 투명배경)</h2>
        <p style={{ color: "#9bb3c6", marginBottom: 20 }}>
          아래 미리보기는 확대되어 보여집니다. 다운로드 시 원본 16×N PNG로
          저장됩니다.
        </p>

        <Section
          title="Idle (2프레임)"
          canvasRef={idleRef}
          source={strips.idle}
          downloadName="hero_idle.png"
          frames={META.idle.frames}
        />
        <Section
          title="Walk (4프레임)"
          canvasRef={moveRef}
          source={strips.move}
          downloadName="hero_walk.png"
          frames={META.move.frames}
        />
        <Section
          title="Attack (4프레임)"
          canvasRef={attackRef}
          source={strips.attack}
          downloadName="hero_attack.png"
          frames={META.attack.frames}
        />
      </div>
    </div>
  );
}

function Section(props: {
  title: string;
  canvasRef: React.RefObject<HTMLCanvasElement | null>;
  source: HTMLCanvasElement;
  downloadName: string;
  frames: number;
}) {
  const scale = 8; // preview scale
  const style = {
    imageRendering: "pixelated" as const,
    width: props.frames * FRAME_SIZE * scale,
    height: FRAME_SIZE * scale,
    border: "1px solid rgba(255,255,255,0.12)",
    background: "transparent",
  };
  return (
    <div style={{ marginBottom: 24 }}>
      <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
        <h3 style={{ margin: 0 }}>{props.title}</h3>
        <button
          type="button"
          onClick={() => downloadCanvas(props.source, props.downloadName)}
          style={{
            cursor: "pointer",
            background: "var(--accent)",
            color: "#1a1f26",
            border: "none",
            borderRadius: 8,
            padding: "6px 12px",
            fontWeight: 700,
          }}
        >
          PNG 다운로드
        </button>
      </div>
      <div style={{ marginTop: 8 }}>
        <canvas ref={props.canvasRef} style={style} />
      </div>
    </div>
  );
}

function drawToCanvasElement(
  target: HTMLCanvasElement,
  src: HTMLCanvasElement
) {
  target.width = src.width;
  target.height = src.height;
  const ctx = target.getContext("2d");
  if (!ctx) return;
  ctx.imageSmoothingEnabled = false;
  ctx.clearRect(0, 0, target.width, target.height);
  ctx.drawImage(src, 0, 0);
}

function downloadCanvas(canvas: HTMLCanvasElement, filename: string) {
  const url = canvas.toDataURL("image/png");
  const link = document.createElement("a");
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}

function createStripCanvas(stateName: HeroAnimState, frames: number) {
  const canvas = document.createElement("canvas");
  canvas.width = frames * FRAME_SIZE;
  canvas.height = FRAME_SIZE;
  const ctx = canvas.getContext("2d");
  if (!ctx) return canvas;
  ctx.imageSmoothingEnabled = false;
  for (let i = 0; i < frames; i++) {
    const tile = createTileFrame(stateName, i);
    ctx.drawImage(tile, i * FRAME_SIZE, 0);
  }
  return canvas;
}

function createTileFrame(stateName: HeroAnimState, frameIndex: number) {
  const canvas = document.createElement("canvas");
  canvas.width = FRAME_SIZE;
  canvas.height = FRAME_SIZE;
  const ctx = canvas.getContext("2d");
  if (!ctx) return canvas;
  ctx.clearRect(0, 0, FRAME_SIZE, FRAME_SIZE);
  drawHeroPixelFallbackTile(ctx, stateName, frameIndex);
  return canvas;
}

function drawHeroPixelFallbackTile(
  ctx: CanvasRenderingContext2D,
  stateName: HeroAnimState,
  frameIndex: number
) {
  const outline = "#3a2b11";
  const bodyColor = "#ffd36e";

  function px(ix: number, iy: number, w: number, h: number, color: string) {
    ctx.fillStyle = color;
    ctx.fillRect(ix, iy, w, h);
  }

  // Outline
  px(5, 2, 6, 1, outline);
  px(4, 3, 1, 8, outline);
  px(11, 3, 1, 8, outline);
  px(5, 11, 6, 1, outline);
  // Face/body fill
  px(5, 3, 6, 8, bodyColor);

  // Eyes (idle blink)
  const eyeOpen = stateName !== "attack" && frameIndex % 2 === 0;
  px(6, 5, 1, 1, eyeOpen ? "#4a3b1a" : bodyColor);
  px(9, 5, 1, 1, eyeOpen ? "#4a3b1a" : bodyColor);

  if (stateName === "move") {
    const phase = frameIndex % 4; // 0: L forward, 1: neutral, 2: R forward, 3: neutral
    const footFront = "#ffe57a";
    const footBack = "#caa24e";
    if (phase === 0) {
      // Left forward, Right back. Arms opposite
      // left arm retracted
      px(3, 6, 2, 1, outline);
      px(3, 7, 2, 1, bodyColor);
      // right arm extended
      px(11, 6, 3, 1, outline);
      px(11, 7, 3, 1, bodyColor);
      // legs
      px(5, 12, 1, 2, outline);
      px(5, 13, 1, 1, footFront);
      px(10, 12, 1, 2, outline);
      px(10, 13, 1, 1, footBack);
    } else if (phase === 1) {
      // Neutral
      px(3, 6, 2, 1, outline);
      px(3, 7, 2, 1, bodyColor);
      px(11, 6, 2, 1, outline);
      px(11, 7, 2, 1, bodyColor);
      px(6, 12, 1, 2, outline);
      px(6, 13, 1, 1, footBack);
      px(9, 12, 1, 2, outline);
      px(9, 13, 1, 1, footBack);
    } else if (phase === 2) {
      // Right forward, Left back. Arms opposite
      // left arm extended
      px(2, 6, 3, 1, outline);
      px(2, 7, 3, 1, bodyColor);
      // right arm retracted
      px(11, 6, 2, 1, outline);
      px(11, 7, 2, 1, bodyColor);
      // legs
      px(6, 12, 1, 2, outline);
      px(6, 13, 1, 1, footBack);
      px(10, 12, 1, 2, outline);
      px(10, 13, 1, 1, footFront);
    } else {
      // Neutral
      px(3, 6, 2, 1, outline);
      px(3, 7, 2, 1, bodyColor);
      px(11, 6, 2, 1, outline);
      px(11, 7, 2, 1, bodyColor);
      px(6, 12, 1, 2, outline);
      px(6, 13, 1, 1, footBack);
      px(9, 12, 1, 2, outline);
      px(9, 13, 1, 1, footBack);
    }
  } else if (stateName === "attack") {
    const phase = frameIndex % 4;
    const slashColor = "#ffe57a";
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
    px(3, 6, 2, 1, outline);
    px(3, 7, 2, 1, bodyColor);
    px(11, 6, 2, 1, outline);
    px(11, 7, 2, 1, bodyColor);
    px(6, 12, 1, 2, outline);
    px(9, 12, 1, 2, outline);
  } else {
    const chestOffset = frameIndex % 2 === 0 ? 0 : 1;
    if (chestOffset) px(5, 3, 6, 1, bodyColor);
    px(4, 7, 1, 1, outline);
    px(11, 7, 1, 1, outline);
    px(6, 12, 1, 2, outline);
    px(9, 12, 1, 2, outline);
  }
}
