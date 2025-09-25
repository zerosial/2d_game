const fs = require("fs");
const path = require("path");
const { createCanvas } = require("canvas");

// public/sprites 디렉토리 생성
const spritesDir = path.join(__dirname, "..", "public", "sprites");
if (!fs.existsSync(spritesDir)) {
  fs.mkdirSync(spritesDir, { recursive: true });
}

const FRAME_SIZE = 16;
const META = {
  idle: { frames: 1 },
  move: { frames: 4 },
  attack: { frames: 4 },
};
const DIRECTIONS = ["up", "down", "left", "right"];

function px(ctx, ix, iy, w, h, color) {
  ctx.fillStyle = color;
  ctx.fillRect(ix, iy, w, h);
}

function drawDownFacingCharacter(
  ctx,
  stateName,
  frameIndex,
  outline,
  bodyColor
) {
  // 기본 아래쪽 향하는 캐릭터
  // Outline
  px(ctx, 5, 2, 6, 1, outline);
  px(ctx, 4, 3, 1, 8, outline);
  px(ctx, 11, 3, 1, 8, outline);
  px(ctx, 5, 11, 6, 1, outline);
  // Face/body fill
  px(ctx, 5, 3, 6, 8, bodyColor);

  // Eyes - down facing: both eyes visible
  const eyeOpen = true;
  px(ctx, 6, 5, 1, 1, eyeOpen ? "#4a3b1a" : bodyColor);
  px(ctx, 9, 5, 1, 1, eyeOpen ? "#4a3b1a" : bodyColor);

  if (stateName === "move") {
    const phase = frameIndex % 4;
    const footFront = "#ffe57a";
    const footBack = "#caa24e";
    if (phase === 0) {
      px(ctx, 3, 6, 2, 1, outline);
      px(ctx, 3, 7, 2, 1, bodyColor);
      px(ctx, 11, 6, 3, 1, outline);
      px(ctx, 11, 7, 3, 1, bodyColor);
      px(ctx, 5, 12, 1, 2, outline);
      px(ctx, 5, 13, 1, 1, footFront);
      px(ctx, 10, 12, 1, 2, outline);
      px(ctx, 10, 13, 1, 1, footBack);
    } else if (phase === 1) {
      px(ctx, 3, 6, 2, 1, outline);
      px(ctx, 3, 7, 2, 1, bodyColor);
      px(ctx, 11, 6, 2, 1, outline);
      px(ctx, 11, 7, 2, 1, bodyColor);
      px(ctx, 6, 12, 1, 2, outline);
      px(ctx, 6, 13, 1, 1, footBack);
      px(ctx, 9, 12, 1, 2, outline);
      px(ctx, 9, 13, 1, 1, footBack);
    } else if (phase === 2) {
      px(ctx, 2, 6, 3, 1, outline);
      px(ctx, 2, 7, 3, 1, bodyColor);
      px(ctx, 11, 6, 2, 1, outline);
      px(ctx, 11, 7, 2, 1, bodyColor);
      px(ctx, 6, 12, 1, 2, outline);
      px(ctx, 6, 13, 1, 1, footBack);
      px(ctx, 10, 12, 1, 2, outline);
      px(ctx, 10, 13, 1, 1, footFront);
    } else {
      px(ctx, 3, 6, 2, 1, outline);
      px(ctx, 3, 7, 2, 1, bodyColor);
      px(ctx, 11, 6, 2, 1, outline);
      px(ctx, 11, 7, 2, 1, bodyColor);
      px(ctx, 6, 12, 1, 2, outline);
      px(ctx, 6, 13, 1, 1, footBack);
      px(ctx, 9, 12, 1, 2, outline);
      px(ctx, 9, 13, 1, 1, footBack);
    }
  } else if (stateName === "attack") {
    const phase = frameIndex % 4;
    const slashColor = "#ffe57a";
    if (phase === 0) {
      px(ctx, 12, 6, 2, 1, slashColor);
    } else if (phase === 1) {
      px(ctx, 12, 6, 3, 1, slashColor);
      px(ctx, 14, 5, 1, 1, slashColor);
    } else if (phase === 2) {
      px(ctx, 12, 6, 3, 1, slashColor);
      px(ctx, 14, 5, 1, 1, slashColor);
      px(ctx, 14, 7, 1, 1, slashColor);
    } else {
      px(ctx, 12, 6, 2, 1, slashColor);
    }
    px(ctx, 3, 6, 2, 1, outline);
    px(ctx, 3, 7, 2, 1, bodyColor);
    px(ctx, 11, 6, 2, 1, outline);
    px(ctx, 11, 7, 2, 1, bodyColor);
    px(ctx, 6, 12, 1, 2, outline);
    px(ctx, 9, 12, 1, 2, outline);
  } else {
    // Idle: static pose
    px(ctx, 4, 7, 1, 1, outline);
    px(ctx, 11, 7, 1, 1, outline);
    px(ctx, 6, 12, 1, 2, outline);
    px(ctx, 9, 12, 1, 2, outline);
  }
}

function drawUpFacingCharacter(ctx, stateName, frameIndex, outline, bodyColor) {
  // 위쪽을 향하는 캐릭터
  px(ctx, 5, 2, 6, 1, outline);
  px(ctx, 4, 3, 1, 8, outline);
  px(ctx, 11, 3, 1, 8, outline);
  px(ctx, 5, 11, 6, 1, outline);
  px(ctx, 5, 3, 6, 8, bodyColor);

  // No eyes for up-facing character

  if (stateName === "move") {
    const phase = frameIndex % 4;
    const footFront = "#ffe57a";
    const footBack = "#caa24e";
    if (phase === 0) {
      px(ctx, 3, 6, 2, 1, outline);
      px(ctx, 3, 7, 2, 1, bodyColor);
      px(ctx, 11, 6, 3, 1, outline);
      px(ctx, 11, 7, 3, 1, bodyColor);
      px(ctx, 5, 12, 1, 2, outline);
      px(ctx, 5, 13, 1, 1, footFront);
      px(ctx, 10, 12, 1, 2, outline);
      px(ctx, 10, 13, 1, 1, footBack);
    } else if (phase === 1) {
      px(ctx, 3, 6, 2, 1, outline);
      px(ctx, 3, 7, 2, 1, bodyColor);
      px(ctx, 11, 6, 2, 1, outline);
      px(ctx, 11, 7, 2, 1, bodyColor);
      px(ctx, 6, 12, 1, 2, outline);
      px(ctx, 6, 13, 1, 1, footBack);
      px(ctx, 9, 12, 1, 2, outline);
      px(ctx, 9, 13, 1, 1, footBack);
    } else if (phase === 2) {
      px(ctx, 2, 6, 3, 1, outline);
      px(ctx, 2, 7, 3, 1, bodyColor);
      px(ctx, 11, 6, 2, 1, outline);
      px(ctx, 11, 7, 2, 1, bodyColor);
      px(ctx, 6, 12, 1, 2, outline);
      px(ctx, 6, 13, 1, 1, footBack);
      px(ctx, 10, 12, 1, 2, outline);
      px(ctx, 10, 13, 1, 1, footFront);
    } else {
      px(ctx, 3, 6, 2, 1, outline);
      px(ctx, 3, 7, 2, 1, bodyColor);
      px(ctx, 11, 6, 2, 1, outline);
      px(ctx, 11, 7, 2, 1, bodyColor);
      px(ctx, 6, 12, 1, 2, outline);
      px(ctx, 9, 12, 1, 2, outline);
      px(ctx, 9, 13, 1, 1, footBack);
    }
  } else if (stateName === "attack") {
    const phase = frameIndex % 4;
    const slashColor = "#ffe57a";
    if (phase === 0) {
      px(ctx, 6, 1, 1, 2, slashColor);
    } else if (phase === 1) {
      px(ctx, 5, 1, 1, 3, slashColor);
      px(ctx, 4, 1, 1, 1, slashColor);
    } else if (phase === 2) {
      px(ctx, 5, 1, 1, 3, slashColor);
      px(ctx, 4, 1, 1, 1, slashColor);
      px(ctx, 6, 1, 1, 1, slashColor);
    } else {
      px(ctx, 6, 1, 1, 2, slashColor);
    }
    px(ctx, 3, 6, 2, 1, outline);
    px(ctx, 3, 7, 2, 1, bodyColor);
    px(ctx, 11, 6, 2, 1, outline);
    px(ctx, 11, 7, 2, 1, bodyColor);
    px(ctx, 6, 12, 1, 2, outline);
    px(ctx, 9, 12, 1, 2, outline);
  } else {
    px(ctx, 4, 7, 1, 1, outline);
    px(ctx, 11, 7, 1, 1, outline);
    px(ctx, 6, 12, 1, 2, outline);
    px(ctx, 9, 12, 1, 2, outline);
  }
}

function drawLeftFacingCharacter(
  ctx,
  stateName,
  frameIndex,
  outline,
  bodyColor
) {
  px(ctx, 5, 2, 6, 1, outline);
  px(ctx, 4, 3, 1, 8, outline);
  px(ctx, 11, 3, 1, 8, outline);
  px(ctx, 5, 11, 6, 1, outline);
  px(ctx, 5, 3, 6, 8, bodyColor);

  // Left eye only
  const eyeOpen = true;
  px(ctx, 6, 5, 1, 1, eyeOpen ? "#4a3b1a" : bodyColor);

  if (stateName === "move") {
    const phase = frameIndex % 4;
    const footFront = "#ffe57a";
    const footBack = "#caa24e";
    if (phase === 0) {
      px(ctx, 11, 6, 2, 1, outline);
      px(ctx, 11, 7, 2, 1, bodyColor);
      px(ctx, 3, 6, 3, 1, outline);
      px(ctx, 3, 7, 3, 1, bodyColor);
      px(ctx, 10, 12, 1, 2, outline);
      px(ctx, 10, 13, 1, 1, footFront);
      px(ctx, 5, 12, 1, 2, outline);
      px(ctx, 5, 13, 1, 1, footBack);
    } else if (phase === 1) {
      px(ctx, 11, 6, 2, 1, outline);
      px(ctx, 11, 7, 2, 1, bodyColor);
      px(ctx, 3, 6, 2, 1, outline);
      px(ctx, 3, 7, 2, 1, bodyColor);
      px(ctx, 9, 12, 1, 2, outline);
      px(ctx, 9, 13, 1, 1, footBack);
      px(ctx, 6, 12, 1, 2, outline);
      px(ctx, 6, 13, 1, 1, footBack);
    } else if (phase === 2) {
      px(ctx, 11, 6, 3, 1, outline);
      px(ctx, 11, 7, 3, 1, bodyColor);
      px(ctx, 3, 6, 2, 1, outline);
      px(ctx, 3, 7, 2, 1, bodyColor);
      px(ctx, 9, 12, 1, 2, outline);
      px(ctx, 9, 13, 1, 1, footBack);
      px(ctx, 5, 12, 1, 2, outline);
      px(ctx, 5, 13, 1, 1, footFront);
    } else {
      px(ctx, 11, 6, 2, 1, outline);
      px(ctx, 11, 7, 2, 1, bodyColor);
      px(ctx, 3, 6, 2, 1, outline);
      px(ctx, 3, 7, 2, 1, bodyColor);
      px(ctx, 9, 12, 1, 2, outline);
      px(ctx, 9, 13, 1, 1, footBack);
      px(ctx, 6, 12, 1, 2, outline);
      px(ctx, 6, 13, 1, 1, footBack);
    }
  } else if (stateName === "attack") {
    const phase = frameIndex % 4;
    const slashColor = "#ffe57a";
    if (phase === 0) {
      px(ctx, 2, 6, 2, 1, slashColor);
    } else if (phase === 1) {
      px(ctx, 1, 6, 3, 1, slashColor);
      px(ctx, 1, 5, 1, 1, slashColor);
    } else if (phase === 2) {
      px(ctx, 1, 6, 3, 1, slashColor);
      px(ctx, 1, 5, 1, 1, slashColor);
      px(ctx, 1, 7, 1, 1, slashColor);
    } else {
      px(ctx, 2, 6, 2, 1, slashColor);
    }
    px(ctx, 11, 6, 2, 1, outline);
    px(ctx, 11, 7, 2, 1, bodyColor);
    px(ctx, 3, 6, 2, 1, outline);
    px(ctx, 3, 7, 2, 1, bodyColor);
    px(ctx, 6, 12, 1, 2, outline);
    px(ctx, 9, 12, 1, 2, outline);
  } else {
    px(ctx, 4, 7, 1, 1, outline);
    px(ctx, 11, 7, 1, 1, outline);
    px(ctx, 6, 12, 1, 2, outline);
    px(ctx, 9, 12, 1, 2, outline);
  }
}

function drawRightFacingCharacter(
  ctx,
  stateName,
  frameIndex,
  outline,
  bodyColor
) {
  px(ctx, 5, 2, 6, 1, outline);
  px(ctx, 4, 3, 1, 8, outline);
  px(ctx, 11, 3, 1, 8, outline);
  px(ctx, 5, 11, 6, 1, outline);
  px(ctx, 5, 3, 6, 8, bodyColor);

  // Right eye only
  const eyeOpen = true;
  px(ctx, 9, 5, 1, 1, eyeOpen ? "#4a3b1a" : bodyColor);

  if (stateName === "move") {
    const phase = frameIndex % 4;
    const footFront = "#ffe57a";
    const footBack = "#caa24e";
    if (phase === 0) {
      px(ctx, 3, 6, 2, 1, outline);
      px(ctx, 3, 7, 2, 1, bodyColor);
      px(ctx, 11, 6, 3, 1, outline);
      px(ctx, 11, 7, 3, 1, bodyColor);
      px(ctx, 5, 12, 1, 2, outline);
      px(ctx, 5, 13, 1, 1, footFront);
      px(ctx, 10, 12, 1, 2, outline);
      px(ctx, 10, 13, 1, 1, footBack);
    } else if (phase === 1) {
      px(ctx, 3, 6, 2, 1, outline);
      px(ctx, 3, 7, 2, 1, bodyColor);
      px(ctx, 11, 6, 2, 1, outline);
      px(ctx, 11, 7, 2, 1, bodyColor);
      px(ctx, 6, 12, 1, 2, outline);
      px(ctx, 6, 13, 1, 1, footBack);
      px(ctx, 9, 12, 1, 2, outline);
      px(ctx, 9, 13, 1, 1, footBack);
    } else if (phase === 2) {
      px(ctx, 2, 6, 3, 1, outline);
      px(ctx, 2, 7, 3, 1, bodyColor);
      px(ctx, 11, 6, 2, 1, outline);
      px(ctx, 11, 7, 2, 1, bodyColor);
      px(ctx, 6, 12, 1, 2, outline);
      px(ctx, 6, 13, 1, 1, footBack);
      px(ctx, 10, 12, 1, 2, outline);
      px(ctx, 10, 13, 1, 1, footFront);
    } else {
      px(ctx, 3, 6, 2, 1, outline);
      px(ctx, 3, 7, 2, 1, bodyColor);
      px(ctx, 11, 6, 2, 1, outline);
      px(ctx, 11, 7, 2, 1, bodyColor);
      px(ctx, 6, 12, 1, 2, outline);
      px(ctx, 6, 13, 1, 1, footBack);
      px(ctx, 9, 12, 1, 2, outline);
      px(ctx, 9, 13, 1, 1, footBack);
    }
  } else if (stateName === "attack") {
    const phase = frameIndex % 4;
    const slashColor = "#ffe57a";
    if (phase === 0) {
      px(ctx, 12, 6, 2, 1, slashColor);
    } else if (phase === 1) {
      px(ctx, 12, 6, 3, 1, slashColor);
      px(ctx, 14, 5, 1, 1, slashColor);
    } else if (phase === 2) {
      px(ctx, 12, 6, 3, 1, slashColor);
      px(ctx, 14, 5, 1, 1, slashColor);
      px(ctx, 14, 7, 1, 1, slashColor);
    } else {
      px(ctx, 12, 6, 2, 1, slashColor);
    }
    px(ctx, 3, 6, 2, 1, outline);
    px(ctx, 3, 7, 2, 1, bodyColor);
    px(ctx, 11, 6, 2, 1, outline);
    px(ctx, 11, 7, 2, 1, bodyColor);
    px(ctx, 6, 12, 1, 2, outline);
    px(ctx, 9, 12, 1, 2, outline);
  } else {
    px(ctx, 4, 7, 1, 1, outline);
    px(ctx, 11, 7, 1, 1, outline);
    px(ctx, 6, 12, 1, 2, outline);
    px(ctx, 9, 12, 1, 2, outline);
  }
}

function generateSprite(stateName, direction, frames) {
  const canvas = createCanvas(frames * FRAME_SIZE, FRAME_SIZE);
  const ctx = canvas.getContext("2d");

  const outline = "#3a2b11";
  const bodyColor = "#ffd36e";

  for (let i = 0; i < frames; i++) {
    ctx.save();
    ctx.translate(i * FRAME_SIZE, 0);

    if (direction === "up") {
      drawUpFacingCharacter(ctx, stateName, i, outline, bodyColor);
    } else if (direction === "down") {
      drawDownFacingCharacter(ctx, stateName, i, outline, bodyColor);
    } else if (direction === "left") {
      drawLeftFacingCharacter(ctx, stateName, i, outline, bodyColor);
    } else if (direction === "right") {
      drawRightFacingCharacter(ctx, stateName, i, outline, bodyColor);
    }

    ctx.restore();
  }

  return canvas;
}

// 모든 스프라이트 생성
console.log("스프라이트 생성 중...");

Object.keys(META).forEach((animState) => {
  DIRECTIONS.forEach((direction) => {
    const frames = META[animState].frames;
    const canvas = generateSprite(animState, direction, frames);
    const buffer = canvas.toBuffer("image/png");
    const filename = `hero_${animState}_${direction}.png`;
    const filepath = path.join(spritesDir, filename);

    fs.writeFileSync(filepath, buffer);
    console.log(`✓ ${filename} 생성 완료`);
  });
});

console.log("모든 스프라이트 생성이 완료되었습니다!");
