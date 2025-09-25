const fs = require("fs");
const path = require("path");
const { execSync } = require("child_process");

// public/sprites 디렉토리 생성
const spritesDir = path.join(__dirname, "..", "public", "sprites");
if (!fs.existsSync(spritesDir)) {
  fs.mkdirSync(spritesDir, { recursive: true });
}

console.log("스프라이트 파일들을 public/sprites에 복사합니다...");

// 스프라이트 파일 목록
const spriteFiles = [
  "hero_idle_up.png",
  "hero_idle_down.png",
  "hero_idle_left.png",
  "hero_idle_right.png",
  "hero_move_up.png",
  "hero_move_down.png",
  "hero_move_left.png",
  "hero_move_right.png",
  "hero_attack_up.png",
  "hero_attack_down.png",
  "hero_attack_left.png",
  "hero_attack_right.png",
];

// 각 스프라이트 파일을 public/sprites에 복사
spriteFiles.forEach((fileName) => {
  const sourcePath = path.join(__dirname, "..", "downloads", fileName);
  const destPath = path.join(spritesDir, fileName);

  if (fs.existsSync(sourcePath)) {
    fs.copyFileSync(sourcePath, destPath);
    console.log(`✓ ${fileName} 복사 완료`);
  } else {
    console.log(`✗ ${fileName} 파일을 찾을 수 없습니다`);
  }
});

console.log("스프라이트 파일 복사가 완료되었습니다!");
