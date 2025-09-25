"use client";

import { useEffect, useRef } from "react";

type HeroAnimState = "idle" | "move" | "attack";
type Direction = "up" | "down" | "left" | "right";

const FRAME_SIZE = 16; // px
const META: Record<HeroAnimState, { frames: number }> = {
  idle: { frames: 1 },
  move: { frames: 4 },
  attack: { frames: 4 },
};

const DIRECTIONS: Direction[] = ["up", "down", "left", "right"];

export default function SpriteGeneratorPage() {
  const canvasRefs = useRef<
    Partial<Record<`${HeroAnimState}_${Direction}`, HTMLCanvasElement | null>>
  >({});

  useEffect(() => {
    // 모든 방향과 애니메이션 조합에 대해 캔버스 생성
    const timer = setTimeout(() => {
      Object.keys(META).forEach((animState) => {
        DIRECTIONS.forEach((direction) => {
          const key =
            `${animState}_${direction}` as keyof typeof canvasRefs.current;
          if (canvasRefs.current[key]) {
            drawStripToCanvasRef(
              { current: canvasRefs.current[key] },
              animState as HeroAnimState,
              direction,
              META[animState as HeroAnimState].frames
            );
          }
        });
      });
    }, 100); // DOM이 완전히 렌더링된 후 실행

    return () => clearTimeout(timer);
  }, []);

  async function downloadAllSprites() {
    try {
      // JSZip 라이브러리 동적 로드
      const JSZip = (await import("jszip")).default;
      const zip = new JSZip();

      // 모든 스프라이트를 ZIP에 추가
      Object.keys(META).forEach((animState) => {
        DIRECTIONS.forEach((direction) => {
          const key =
            `${animState}_${direction}` as keyof typeof canvasRefs.current;
          const canvas = canvasRefs.current[key];
          if (canvas) {
            const dataURL = canvas.toDataURL("image/png");
            const base64Data = dataURL.split(",")[1];
            zip.file(`hero_${animState}_${direction}.png`, base64Data, {
              base64: true,
            });
          }
        });
      });

      // ZIP 파일 생성 및 다운로드
      const content = await zip.generateAsync({ type: "blob" });
      const url = URL.createObjectURL(content);
      const link = document.createElement("a");
      link.href = url;
      link.download = "hero_sprites_package.zip";
      link.style.display = "none";
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);

      // 자동으로 public/sprites에 저장 (개발 환경에서만)
      if (process.env.NODE_ENV === "development") {
        await saveSpritesToPublic();
      }
    } catch (error) {
      console.error("Failed to create ZIP:", error);
      alert("ZIP 생성에 실패했습니다. 개별 다운로드를 사용해주세요.");
    }
  }

  async function saveSpritesToPublic() {
    try {
      // 각 스프라이트를 개별적으로 다운로드하여 public/sprites에 저장
      Object.keys(META).forEach((animState) => {
        DIRECTIONS.forEach((direction) => {
          const key =
            `${animState}_${direction}` as keyof typeof canvasRefs.current;
          const canvas = canvasRefs.current[key];
          if (canvas) {
            const dataURL = canvas.toDataURL("image/png");
            const link = document.createElement("a");
            link.href = dataURL;
            link.download = `hero_${animState}_${direction}.png`;
            link.style.display = "none";
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
          }
        });
      });

      console.log(
        "스프라이트 파일들이 다운로드되었습니다. public/sprites 폴더에 수동으로 복사해주세요."
      );
    } catch (error) {
      console.error("Failed to save sprites:", error);
    }
  }

  return (
    <div className="page-root" style={{ width: "100%", padding: 16 }}>
      <div
        className="page-main"
        style={{
          width: "100%",
          maxWidth: 1000,
          margin: "0 auto",
          display: "block",
          alignItems: "unset",
          justifyContent: "unset",
        }}
      >
        <h2 style={{ marginBottom: 8 }}>
          방향별 스프라이트 생성기 (16x16, 투명배경)
        </h2>
        <p style={{ color: "#9bb3c6", marginBottom: 20 }}>
          아래 미리보기는 확대되어 보여집니다. 다운로드 시 원본 16×N PNG로
          저장됩니다.
        </p>
        <div style={{ marginBottom: 20, textAlign: "center" }}>
          <button
            onClick={downloadAllSprites}
            style={{
              background: "var(--accent)",
              color: "#1a1f26",
              border: "none",
              borderRadius: 8,
              padding: "12px 24px",
              fontWeight: 700,
              fontSize: "14px",
              cursor: "pointer",
            }}
          >
            모든 스프라이트 패키지 다운로드 (ZIP)
          </button>
        </div>

        {Object.keys(META).map((animState) => (
          <div key={animState} style={{ marginBottom: 32 }}>
            <h3 style={{ marginBottom: 16, textTransform: "capitalize" }}>
              {animState} ({META[animState as HeroAnimState].frames}프레임)
            </h3>
            <div
              style={{
                display: "grid",
                gridTemplateColumns: "repeat(4, minmax(0, 1fr))",
                gap: 16,
                width: "100%",
                maxWidth: "800px",
                margin: "0 auto",
              }}
            >
              {DIRECTIONS.map((direction) => {
                const key =
                  `${animState}_${direction}` as keyof typeof canvasRefs.current;
                return (
                  <Section
                    key={key}
                    title={`${direction.toUpperCase()} ${animState.toUpperCase()}`}
                    canvasRef={{ current: canvasRefs.current[key] || null }}
                    downloadName={`hero_${animState}_${direction}.png`}
                    frames={META[animState as HeroAnimState].frames}
                    onRef={(ref) => {
                      canvasRefs.current[key] = ref;
                    }}
                  />
                );
              })}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function Section(props: {
  title: string;
  canvasRef: React.RefObject<HTMLCanvasElement | null>;
  downloadName: string;
  frames: number;
  onRef?: (ref: HTMLCanvasElement | null) => void;
}) {
  const scale = 6; // preview scale (reduced for better fit)
  const style = {
    imageRendering: "pixelated" as const,
    width: props.frames * FRAME_SIZE * scale,
    height: FRAME_SIZE * scale,
    border: "1px solid rgba(255,255,255,0.12)",
    background: "transparent",
    maxWidth: "100%",
  };
  return (
    <div
      style={{
        marginBottom: 16,
        width: "100%",
        minWidth: 0,
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
      }}
    >
      <div
        style={{
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          gap: 6,
          marginBottom: 8,
          width: "100%",
        }}
      >
        <h4
          style={{
            margin: 0,
            fontSize: "11px",
            textAlign: "center",
            whiteSpace: "nowrap",
            overflow: "hidden",
            textOverflow: "ellipsis",
            width: "100%",
          }}
        >
          {props.title}
        </h4>
        <button
          type="button"
          onClick={() => downloadFromRef(props.canvasRef, props.downloadName)}
          style={{
            cursor: "pointer",
            background: "var(--accent)",
            color: "#1a1f26",
            border: "none",
            borderRadius: 4,
            padding: "2px 6px",
            fontWeight: 700,
            fontSize: "9px",
            whiteSpace: "nowrap",
          }}
        >
          다운로드
        </button>
      </div>
      <div
        style={{
          display: "flex",
          justifyContent: "center",
          width: "100%",
          overflow: "hidden",
        }}
      >
        <canvas
          ref={props.onRef}
          style={{
            ...style,
            maxWidth: "100%",
            height: "auto",
          }}
        />
      </div>
    </div>
  );
}

function drawStripToCanvasRef(
  ref: React.RefObject<HTMLCanvasElement | null>,
  stateName: HeroAnimState,
  direction: Direction,
  frames: number
) {
  const target = ref.current;
  if (!target) return;
  target.width = frames * FRAME_SIZE;
  target.height = FRAME_SIZE;
  const ctx = target.getContext("2d");
  if (!ctx) return;
  (
    ctx as CanvasRenderingContext2D & { imageSmoothingEnabled?: boolean }
  ).imageSmoothingEnabled = false;
  ctx.clearRect(0, 0, target.width, target.height);
  for (let i = 0; i < frames; i++) {
    ctx.save();
    ctx.translate(i * FRAME_SIZE, 0);
    drawHeroPixelFallbackTile(ctx, stateName, direction, i);
    ctx.restore();
  }
}

function downloadCanvas(canvas: HTMLCanvasElement, filename: string) {
  const url = canvas.toDataURL("image/png");
  const link = document.createElement("a");
  link.href = url;
  link.download = filename;
  link.style.display = "none";
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}

function downloadFromRef(
  ref: React.RefObject<HTMLCanvasElement | null>,
  filename: string
) {
  const el = ref.current;
  if (!el) {
    console.error("Canvas not found for download:", filename);
    return;
  }
  downloadCanvas(el, filename);
}

function drawHeroPixelFallbackTile(
  ctx: CanvasRenderingContext2D,
  stateName: HeroAnimState,
  direction: Direction,
  frameIndex: number
) {
  const outline = "#3a2b11";
  const bodyColor = "#ffd36e";

  function px(ix: number, iy: number, w: number, h: number, color: string) {
    ctx.fillStyle = color;
    ctx.fillRect(ix, iy, w, h);
  }

  // 방향에 따른 회전/반전 적용
  const isFlipped = direction === "left";
  const isUp = direction === "up";
  const isDown = direction === "down";

  // 기본 몸체 그리기 (방향에 따라 조정)
  if (isUp) {
    // 위쪽을 향하는 캐릭터
    drawUpFacingCharacter(ctx, stateName, frameIndex, px, outline, bodyColor);
  } else if (isDown) {
    // 아래쪽을 향하는 캐릭터 (기본)
    drawDownFacingCharacter(ctx, stateName, frameIndex, px, outline, bodyColor);
  } else if (isFlipped) {
    // 왼쪽을 향하는 캐릭터 (좌우 반전)
    drawLeftFacingCharacter(ctx, stateName, frameIndex, px, outline, bodyColor);
  } else {
    // 오른쪽을 향하는 캐릭터 (기본)
    drawRightFacingCharacter(
      ctx,
      stateName,
      frameIndex,
      px,
      outline,
      bodyColor
    );
  }
}

function drawDownFacingCharacter(
  ctx: CanvasRenderingContext2D,
  stateName: HeroAnimState,
  frameIndex: number,
  px: (ix: number, iy: number, w: number, h: number, color: string) => void,
  outline: string,
  bodyColor: string
) {
  // 기본 아래쪽 향하는 캐릭터 (기존 로직)
  // Outline
  px(5, 2, 6, 1, outline);
  px(4, 3, 1, 8, outline);
  px(11, 3, 1, 8, outline);
  px(5, 11, 6, 1, outline);
  // Face/body fill
  px(5, 3, 6, 8, bodyColor);

  // Eyes - down facing: both eyes visible
  const eyeOpen = true; // Always show eyes for attack
  px(6, 5, 1, 1, eyeOpen ? "#4a3b1a" : bodyColor);
  px(9, 5, 1, 1, eyeOpen ? "#4a3b1a" : bodyColor);

  if (stateName === "move") {
    const phase = frameIndex % 4;
    const footFront = "#ffe57a";
    const footBack = "#caa24e";
    if (phase === 0) {
      // Left forward, Right back. Arms opposite
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
    // Idle: static pose, no chest movement
    px(4, 7, 1, 1, outline);
    px(11, 7, 1, 1, outline);
    px(6, 12, 1, 2, outline);
    px(9, 12, 1, 2, outline);
  }
}

function drawUpFacingCharacter(
  ctx: CanvasRenderingContext2D,
  stateName: HeroAnimState,
  frameIndex: number,
  px: (ix: number, iy: number, w: number, h: number, color: string) => void,
  outline: string,
  bodyColor: string
) {
  // 위쪽을 향하는 캐릭터 (90도 회전)
  // Outline
  px(5, 2, 6, 1, outline);
  px(4, 3, 1, 8, outline);
  px(11, 3, 1, 8, outline);
  px(5, 11, 6, 1, outline);
  // Face/body fill
  px(5, 3, 6, 8, bodyColor);

  // Eyes (up facing: no eyes visible - looking away)
  // No eyes drawn for up-facing character

  if (stateName === "move") {
    const phase = frameIndex % 4;
    const footFront = "#ffe57a";
    const footBack = "#caa24e";
    // 위쪽으로 걸을 때는 다리 움직임을 위아래로 조정
    if (phase === 0) {
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
      px(9, 12, 1, 2, outline);
      px(9, 13, 1, 1, footBack);
    }
  } else if (stateName === "attack") {
    const phase = frameIndex % 4;
    const slashColor = "#ffe57a";
    // 위쪽 공격은 위쪽으로 슬래시
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
    // Arms position for attack (same as move)
    px(3, 6, 2, 1, outline);
    px(3, 7, 2, 1, bodyColor);
    px(11, 6, 2, 1, outline);
    px(11, 7, 2, 1, bodyColor);
    // Legs stance (same as move)
    px(6, 12, 1, 2, outline);
    px(9, 12, 1, 2, outline);
  } else {
    // Idle: static pose, no chest movement
    px(4, 7, 1, 1, outline);
    px(11, 7, 1, 1, outline);
    px(6, 12, 1, 2, outline);
    px(9, 12, 1, 2, outline);
  }
}

function drawLeftFacingCharacter(
  ctx: CanvasRenderingContext2D,
  stateName: HeroAnimState,
  frameIndex: number,
  px: (ix: number, iy: number, w: number, h: number, color: string) => void,
  outline: string,
  bodyColor: string
) {
  // 왼쪽을 향하는 캐릭터 (좌우 반전)
  // Outline
  px(5, 2, 6, 1, outline);
  px(4, 3, 1, 8, outline);
  px(11, 3, 1, 8, outline);
  px(5, 11, 6, 1, outline);
  // Face/body fill
  px(5, 3, 6, 8, bodyColor);

  // Eyes (left facing: only left eye visible)
  const eyeOpen = true; // Always show eyes for attack
  px(6, 5, 1, 1, eyeOpen ? "#4a3b1a" : bodyColor);
  // Right eye not visible when facing left

  if (stateName === "move") {
    const phase = frameIndex % 4;
    const footFront = "#ffe57a";
    const footBack = "#caa24e";
    // 왼쪽으로 걸을 때는 팔과 다리 움직임을 좌우 반전
    if (phase === 0) {
      // Right forward, Left back. Arms opposite
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
  } else if (stateName === "attack") {
    const phase = frameIndex % 4;
    const slashColor = "#ffe57a";
    // 왼쪽 공격은 왼쪽으로 슬래시
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
    // Arms position for attack (same as move)
    px(11, 6, 2, 1, outline);
    px(11, 7, 2, 1, bodyColor);
    px(3, 6, 2, 1, outline);
    px(3, 7, 2, 1, bodyColor);
    // Legs stance (same as move)
    px(6, 12, 1, 2, outline);
    px(9, 12, 1, 2, outline);
  } else {
    // Idle: static pose, no chest movement
    px(4, 7, 1, 1, outline);
    px(11, 7, 1, 1, outline);
    px(6, 12, 1, 2, outline);
    px(9, 12, 1, 2, outline);
  }
}

function drawRightFacingCharacter(
  ctx: CanvasRenderingContext2D,
  stateName: HeroAnimState,
  frameIndex: number,
  px: (ix: number, iy: number, w: number, h: number, color: string) => void,
  outline: string,
  bodyColor: string
) {
  // 오른쪽을 향하는 캐릭터 - 기본 몸체 그리기
  // Outline
  px(5, 2, 6, 1, outline);
  px(4, 3, 1, 8, outline);
  px(11, 3, 1, 8, outline);
  px(5, 11, 6, 1, outline);
  // Face/body fill
  px(5, 3, 6, 8, bodyColor);

  // Eyes (right facing: only right eye visible)
  const eyeOpen = true; // Always show eyes for attack
  // Left eye not visible when facing right
  px(9, 5, 1, 1, eyeOpen ? "#4a3b1a" : bodyColor);

  // 나머지 애니메이션은 down과 동일
  if (stateName === "move") {
    const phase = frameIndex % 4;
    const footFront = "#ffe57a";
    const footBack = "#caa24e";
    if (phase === 0) {
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
    // Arms position for attack (same as move)
    px(3, 6, 2, 1, outline);
    px(3, 7, 2, 1, bodyColor);
    px(11, 6, 2, 1, outline);
    px(11, 7, 2, 1, bodyColor);
    // Legs stance (same as move)
    px(6, 12, 1, 2, outline);
    px(9, 12, 1, 2, outline);
  } else {
    // Idle: static pose, no chest movement
    px(4, 7, 1, 1, outline);
    px(11, 7, 1, 1, outline);
    px(6, 12, 1, 2, outline);
    px(9, 12, 1, 2, outline);
  }
}
