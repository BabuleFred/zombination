// ===== Зомбинация: процедурная графика (canvas) =====
// Всё рисуется кодом — никаких внешних ассетов.
// Референс: скриншоты оригинала (арена-склеп, карта-свиток, ферма с кладбищем).

const W = 960, H = 600;
const ROAD_TOP = 248, ROAD_BOT = 330;

function mulberry32(a) {
  return function () {
    a |= 0; a = a + 0x6D2B79F5 | 0;
    let t = Math.imul(a ^ a >>> 15, 1 | a);
    t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t;
    return ((t ^ t >>> 14) >>> 0) / 4294967296;
  };
}

// ================= БОЕВОЕ ПОЛЕ (пре-рендер) =================
let BG = null;
function buildBattleBackground(leftTheme, rightTheme) {
  BG = document.createElement('canvas'); BG.width = W; BG.height = H;
  const c = BG.getContext('2d');
  const rnd = mulberry32(77);

  // небо
  let g = c.createLinearGradient(0, 0, 0, 200);
  g.addColorStop(0, '#a9c4d4'); g.addColorStop(1, '#d4d8bc');
  c.fillStyle = g; c.fillRect(0, 0, W, 200);
  // тучи
  c.fillStyle = 'rgba(90,96,110,.35)';
  c.beginPath(); c.ellipse(200, 55, 130, 22, 0, 0, 7); c.fill();
  c.beginPath(); c.ellipse(700, 40, 160, 26, 0, 0, 7); c.fill();
  c.fillStyle = 'rgba(255,255,255,.75)';
  [[130, 66, 30], [172, 72, 22], [95, 74, 20], [820, 70, 28]].forEach(([x, y, r]) => {
    c.beginPath(); c.arc(x, y, r, 0, 7); c.fill();
  });
  // солнце мутное
  c.fillStyle = 'rgba(255,244,200,.5)'; c.beginPath(); c.arc(490, 60, 20, 0, 7); c.fill();

  // дальние холмы
  c.fillStyle = '#9cc46e';
  c.beginPath(); c.moveTo(0, 185);
  for (let x = 0; x <= W; x += 40) c.lineTo(x, 158 + Math.sin(x * 0.011) * 24);
  c.lineTo(W, 205); c.lineTo(0, 205); c.fill();

  // верхнее поле
  c.fillStyle = '#a3c26a'; c.fillRect(0, 195, W, ROAD_TOP - 193);
  // пашня рядами (центр)
  for (let i = 0; i < 5; i++) {
    c.strokeStyle = 'rgba(122,90,48,.4)'; c.lineWidth = 4;
    c.beginPath();
    const y = 205 + i * 8;
    for (let x = 460; x <= 650; x += 10) (x === 460) ? c.moveTo(x, y + Math.sin(x * .1) * 2) : c.lineTo(x, y + Math.sin(x * .1) * 2);
    c.stroke();
  }
  // домики на холмах справа (ферма)
  drawFarmHouse(c, 705, 175, '#e8d8a0', '#8a5a30');
  drawFarmHouse(c, 790, 162, '#d8c890', '#8a5a30', 0.8);
  drawWaterTower(c, 640, 185);
  drawBarn(c, 520, 224);
  drawHaystack(c, 600, 236, 24);
  drawHaystack(c, 250, 230, 16);
  drawTree(c, 90, 228); drawTree(c, 340, 220); drawTree(c, 455, 226); drawTree(c, 735, 226); drawTree(c, 870, 232);

  // === сцена слева (тема игрока) ===
  scenerySide(c, leftTheme, 1, rnd);
  // === сцена справа (тема врага, зеркально) ===
  c.save(); c.translate(W, 0); c.scale(-1, 1);
  scenerySide(c, rightTheme, -1, mulberry32(155));
  c.restore();

  // ============ ДОРОГА ============
  g = c.createLinearGradient(0, ROAD_TOP, 0, ROAD_BOT);
  g.addColorStop(0, '#b2a894'); g.addColorStop(.55, '#9d9480'); g.addColorStop(1, '#89806d');
  c.fillStyle = g; c.fillRect(0, ROAD_TOP, W, ROAD_BOT - ROAD_TOP);
  // грязевые пятна
  for (let i = 0; i < 14; i++) {
    const x = 60 + rnd() * 840, y = ROAD_TOP + 14 + rnd() * 52, rw = 20 + rnd() * 40;
    c.fillStyle = 'rgba(122,92,60,.55)';
    c.beginPath(); c.ellipse(x, y, rw, rw * 0.32, 0, 0, 7); c.fill();
    c.fillStyle = 'rgba(96,70,44,.5)';
    c.beginPath(); c.ellipse(x + rw * .2, y + 2, rw * .55, rw * .18, 0, 0, 7); c.fill();
  }
  // трещины
  c.strokeStyle = 'rgba(70,60,48,.4)'; c.lineWidth = 1.5;
  for (let i = 0; i < 6; i++) {
    let x = 100 + rnd() * 760, y = ROAD_TOP + 8 + rnd() * 60;
    c.beginPath(); c.moveTo(x, y);
    for (let s = 0; s < 4; s++) { x += (rnd() - .5) * 40; y += (rnd() - .5) * 10; c.lineTo(x, y); }
    c.stroke();
  }
  // сломанный забор поперёк дороги
  drawBrokenFence(c, 470, ROAD_TOP + 34);
  c.strokeStyle = '#6e6858'; c.lineWidth = 2;
  c.beginPath(); c.moveTo(0, ROAD_TOP + 1); c.lineTo(W, ROAD_TOP + 1); c.stroke();

  // ============ НИЗ (кладбище/болото) ============
  g = c.createLinearGradient(0, ROAD_BOT, 0, H);
  g.addColorStop(0, '#7ba04e'); g.addColorStop(.4, '#5f8440'); g.addColorStop(1, '#48682f');
  c.fillStyle = g; c.fillRect(0, ROAD_BOT, W, H - ROAD_BOT);
  // дорожка грязи от дороги вниз
  c.fillStyle = 'rgba(110,86,54,.45)';
  c.beginPath(); c.moveTo(455, ROAD_BOT);
  c.quadraticCurveTo(430, 395, 465, 448);
  c.quadraticCurveTo(500, 420, 515, ROAD_BOT);
  c.fill();

  // болото с камышами
  drawSwamp(c, 330, 415);
  // ряды могильных холмиков справа
  for (let row = 0; row < 3; row++)
    for (let i = 0; i < 5; i++) {
      const x = 700 + i * 52 + (row % 2) * 20, y = 384 + row * 26;
      c.fillStyle = 'rgba(40,56,28,.6)';
      c.beginPath(); c.ellipse(x, y, 20, 10, 0, Math.PI, 0); c.fill();
      c.fillStyle = 'rgba(70,96,44,.5)';
      c.beginPath(); c.ellipse(x - 6, y - 3, 14, 6, 0, Math.PI, 0); c.fill();
    }
  // надгробия
  for (let i = 0; i < 14; i++) {
    const x = 30 + rnd() * 900, y = ROAD_BOT + 18 + rnd() * 92;
    if (rnd() < 0.55) drawGravestone(c, x, y); else drawCross(c, x, y);
  }
  // мёртвые деревья с воронами
  drawDeadTree(c, 240, 428, 0.95); drawDeadTree(c, 655, 438, 0.8); drawDeadTree(c, 60, 422, 0.75);
  // ржавые остовы
  drawWreckCar(c, 470, 420); drawWreckTractor(c, 745, 432);
  // палатки-лавки по углам
  drawMarketTent(c, 40, ROAD_BOT + 80, 1);
  drawMarketTent(c, 880, ROAD_BOT + 80, -1);
  // черепа кучкой
  drawSkullPile(c, 150, 428);
  // брёвна
  drawLogs(c, 590, 430);
}

// --- тематические декорации одной стороны ---
function scenerySide(c, theme, dir, rnd) {
  if (theme === 'zombie') {
    // мёртвое дерево с повешенным и лужей крови
    drawDeadTree(c, 60, 232, 1.35);
    c.strokeStyle = '#5a4a3a'; c.lineWidth = 2;
    c.beginPath(); c.moveTo(64, 208); c.lineTo(64, 224); c.stroke();
    c.fillStyle = '#8a8a7e';
    c.beginPath(); c.arc(64, 229, 5, 0, 7); c.fill();
    c.fillStyle = 'rgba(140,30,24,.7)';
    c.beginPath(); c.ellipse(64, 244, 16, 5, 0, 0, 7); c.fill();
    // вышка с клеткой
    drawWatchtower(c, 150, 236);
    // виселица
    drawGallows(c, 225, 240);
    // разрушенная часовня с крестом
    drawChapel(c, 290, 226);
    // силуэты зомби-памятников
    c.fillStyle = 'rgba(40,48,30,.85)';
    for (let i = 0; i < 4; i++) {
      const x = 355 + i * 24 + rnd() * 8, y = 240 + rnd() * 4;
      c.beginPath(); c.arc(x, y - 10, 3.4, 0, 7); c.fill();
      c.fillRect(x - 2.4, y - 7, 5, 9);
      c.fillRect(x - 3.4, y - 5, 7, 2.4);
    }
    // ворон
    drawCrow(c, 58, 205);
  } else {
    // ферма: всё главное уже нарисовано в центре, добавим курятник и стог сена
    drawCoop(c, 90, 236);
    drawHaystack(c, 170, 242, 14);
    drawFenceRun(c, 210, 244, 80);
  }
}

function drawFarmHouse(c, x, y, wall, roof, s = 1) {
  c.save(); c.translate(x, y); c.scale(s, s);
  c.fillStyle = wall; c.fillRect(-16, -22, 32, 22);
  c.fillStyle = roof;
  c.beginPath(); c.moveTo(-20, -22); c.lineTo(0, -34); c.lineTo(20, -22); c.fill();
  c.fillStyle = '#6a4a2a'; c.fillRect(-3, -12, 6, 12);
  c.restore();
}
function drawCoop(c, x, y) {
  c.fillStyle = '#a88a4e'; c.fillRect(x - 14, y - 16, 28, 16);
  c.fillStyle = '#7a5a2e'; c.beginPath(); c.moveTo(-0 + x - 17, y - 16); c.lineTo(x, y - 25); c.lineTo(x + 17, y - 16); c.fill();
  c.fillStyle = '#4a3418'; c.fillRect(x - 4, y - 9, 8, 9);
}
function drawFenceRun(c, x, y, len) {
  c.strokeStyle = '#8a6a42'; c.lineWidth = 3;
  c.beginPath(); c.moveTo(x, y); c.lineTo(x + len, y); c.stroke();
  for (let i = 0; i <= len; i += 16) {
    c.beginPath(); c.moveTo(x + i, y); c.lineTo(x + i, y - 9); c.stroke();
  }
}
function drawWatchtower(c, x, y) {
  c.strokeStyle = '#5d4a32'; c.lineWidth = 4;
  c.beginPath();
  c.moveTo(x - 14, y); c.lineTo(x - 7, y - 46);
  c.moveTo(x + 14, y); c.lineTo(x + 7, y - 46);
  c.stroke();
  c.lineWidth = 2.4;
  c.beginPath(); c.moveTo(x - 12, y - 18); c.lineTo(x + 12, y - 24); c.moveTo(x - 12, y - 30); c.lineTo(x + 12, y - 36); c.stroke();
  // платформа + клетка
  c.fillStyle = '#6e5a3e'; c.fillRect(x - 16, y - 54, 32, 6);
  c.strokeStyle = '#4e4030'; c.lineWidth = 2;
  c.strokeRect(x - 9, y - 76, 18, 22);
  c.beginPath(); c.moveTo(x - 9, y - 76); c.lineTo(x + 9, y - 54); c.stroke();
  // фигурка в клетке
  c.fillStyle = '#3a3226'; c.beginPath(); c.arc(x, y - 66, 3, 0, 7); c.fill();
}
function drawGallows(c, x, y) {
  c.strokeStyle = '#54442e'; c.lineWidth = 4; c.lineCap = 'round';
  c.beginPath();
  c.moveTo(x - 14, y); c.lineTo(x - 14, y - 40);
  c.moveTo(x - 14, y - 40); c.lineTo(x + 10, y - 40);
  c.moveTo(x - 20, y); c.lineTo(x - 8, y);
  c.stroke();
  c.strokeStyle = '#7a6a4e'; c.lineWidth = 1.6;
  c.beginPath(); c.moveTo(x + 8, y - 40); c.lineTo(x + 8, y - 30); c.stroke();
  c.strokeStyle = '#54442e'; c.lineWidth = 3;
  c.beginPath(); c.moveTo(x + 3, y - 30); c.lineTo(x + 13, y - 30); c.stroke();
}
function drawChapel(c, x, y) {
  c.fillStyle = '#8a8578';
  c.fillRect(x - 20, y - 34, 40, 34);
  c.fillStyle = '#75705f';
  c.beginPath(); c.moveTo(x - 24, y - 34); c.lineTo(x, y - 50); c.lineTo(x + 24, y - 34); c.fill();
  c.fillStyle = '#2c2820';
  c.beginPath(); c.moveTo(x - 6, y); c.lineTo(x - 6, y - 14); c.arc(x, y - 14, 6, Math.PI, 0); c.lineTo(x + 6, y); c.fill();
  c.strokeStyle = '#4e4a40'; c.lineWidth = 3;
  c.beginPath(); c.moveTo(x, y - 50); c.lineTo(x, y - 62); c.moveTo(x - 5, y - 57); c.lineTo(x + 5, y - 57); c.stroke();
  // трещина
  c.strokeStyle = '#5a5648'; c.lineWidth = 1.4;
  c.beginPath(); c.moveTo(x + 10, y - 30); c.lineTo(x + 7, y - 18); c.lineTo(x + 12, y - 8); c.stroke();
}
function drawCrow(c, x, y) {
  c.fillStyle = '#181418';
  c.beginPath(); c.ellipse(x, y, 5, 3, -0.2, 0, 7); c.fill();
  c.beginPath(); c.arc(x + 4.4, y - 2.6, 2.2, 0, 7); c.fill();
  c.beginPath(); c.moveTo(x + 6.4, y - 2.8); c.lineTo(x + 9.4, y - 2); c.lineTo(x + 6.4, y - 1.6); c.fill();
}
function drawSwamp(c, x, y) {
  c.fillStyle = '#46604e';
  c.beginPath(); c.ellipse(x, y, 85, 32, 0, 0, 7); c.fill();
  c.fillStyle = '#547661';
  c.beginPath(); c.ellipse(x - 12, y - 5, 62, 20, 0, 0, 7); c.fill();
  c.strokeStyle = 'rgba(30,44,34,.55)'; c.lineWidth = 2;
  for (let i = 0; i < 7; i++) {
    const rx = x - 60 + i * 22;
    c.beginPath(); c.moveTo(rx, y + 6);
    c.quadraticCurveTo(rx + 4, y - 10, rx + 1, y - 22);
    c.stroke();
  }
  // зомби в болоте
  c.fillStyle = '#6a9a3e';
  c.beginPath(); c.arc(x + 40, y + 2, 6, 0, 7); c.fill();
  c.fillStyle = '#2c3c22';
  c.fillRect(x + 35, y + 2, 10, 5);
}
function drawMarketTent(c, x, y, dir) {
  c.save(); c.translate(x, y); c.scale(dir, 1);
  // прилавок
  c.fillStyle = '#7a5a34'; c.fillRect(-26, -18, 52, 6);
  c.strokeStyle = '#54401e'; c.lineWidth = 3;
  c.beginPath(); c.moveTo(-22, -12); c.lineTo(-22, 0); c.moveTo(22, -12); c.lineTo(22, 0); c.stroke();
  // полосатый тент
  for (let i = 0; i < 6; i++) {
    c.fillStyle = i % 2 ? '#c8402e' : '#e8dcc0';
    c.beginPath();
    c.moveTo(-26 + i * 8.8, -18);
    c.lineTo(-26 + (i + 1) * 8.8, -18);
    c.lineTo(-20 + (i + 1) * 8.8, -34);
    c.lineTo(-20 + i * 8.8, -34);
    c.fill();
  }
  // товар
  c.fillStyle = '#c8931e'; c.beginPath(); c.arc(-10, -21, 4, 0, 7); c.fill();
  c.fillStyle = '#7a9a3e'; c.beginPath(); c.arc(2, -21, 4, 0, 7); c.fill();
  c.fillStyle = '#a84e2e'; c.beginPath(); c.arc(13, -21, 4, 0, 7); c.fill();
  c.restore();
}
function drawSkullPile(c, x, y) {
  const sk = (sx, sy, s) => {
    c.fillStyle = '#cfc9b8';
    c.beginPath(); c.arc(sx, sy, 6 * s, 0, 7); c.fill();
    c.fillStyle = '#2c2822';
    c.beginPath(); c.arc(sx - 2 * s, sy - 1 * s, 1.6 * s, 0, 7); c.arc(sx + 2 * s, sy - 1 * s, 1.6 * s, 0, 7); c.fill();
  };
  sk(x - 8, y, 1); sk(x + 8, y, .9); sk(x, y - 7, 1.1);
  c.fillStyle = '#b8b2a0';
  c.beginPath(); c.ellipse(x, y + 7, 16, 4, 0, 0, 7); c.fill();
}
function drawLogs(c, x, y) {
  c.strokeStyle = '#6e5232'; c.lineWidth = 7; c.lineCap = 'round';
  c.beginPath(); c.moveTo(x - 22, y); c.lineTo(x + 22, y - 4); c.stroke();
  c.strokeStyle = '#8a6a42'; c.lineWidth = 6;
  c.beginPath(); c.moveTo(x - 16, y + 7); c.lineTo(x + 18, y + 4); c.stroke();
}
function drawBrokenFence(c, x, y) {
  c.strokeStyle = '#7a6242'; c.lineWidth = 3.4; c.lineCap = 'round';
  c.beginPath(); c.moveTo(x - 60, y); c.lineTo(x + 60, y + 6); c.stroke();
  c.beginPath(); c.moveTo(x - 55, y + 12); c.lineTo(x + 40, y + 16); c.stroke();
  c.lineWidth = 2.6;
  for (let i = 0; i < 4; i++) {
    c.beginPath(); c.moveTo(x - 48 + i * 32, y - 2 + i); c.lineTo(x - 44 + i * 32, y + 18); c.stroke();
  }
}

function drawWaterTower(c, x, y) {
  c.strokeStyle = '#7a6242'; c.lineWidth = 4;
  c.beginPath(); c.moveTo(x - 14, y); c.lineTo(x - 6, y - 44); c.moveTo(x + 14, y); c.lineTo(x + 6, y - 44); c.stroke();
  c.fillStyle = '#8fa6b2';
  c.beginPath(); c.ellipse(x, y - 56, 30, 20, 0, 0, 7); c.fill();
  c.fillStyle = '#77909c'; c.fillRect(x - 30, y - 60, 60, 10);
}
function drawBarn(c, x, y) {
  c.fillStyle = '#b5432f'; c.fillRect(x - 34, y - 34, 68, 34);
  c.fillStyle = '#9c3526'; c.beginPath(); c.moveTo(x - 38, y - 34); c.lineTo(x, y - 52); c.lineTo(x + 38, y - 34); c.fill();
  c.fillStyle = '#e8e0d0'; c.fillRect(x - 8, y - 22, 16, 22);
  c.strokeStyle = '#9c3526'; c.lineWidth = 2; c.strokeRect(x - 8, y - 22, 16, 22);
  c.beginPath(); c.moveTo(x - 8, y - 22); c.lineTo(x + 8, y); c.stroke();
}
function drawHaystack(c, x, y, r = 22) {
  c.fillStyle = '#d8b84e';
  c.beginPath(); c.ellipse(x, y, r, r * 0.64, 0, Math.PI, 0); c.fill();
  c.strokeStyle = '#b3922e'; c.lineWidth = 1.5;
  for (let i = -2; i <= 2; i++) { c.beginPath(); c.moveTo(x + i * r * 0.36, y); c.lineTo(x + i * r * 0.24, y - r * 0.6); c.stroke(); }
}
function drawTree(c, x, y) {
  c.fillStyle = '#6e4a28'; c.fillRect(x - 3, y - 16, 6, 16);
  c.fillStyle = '#4e7c2e';
  c.beginPath(); c.arc(x, y - 24, 15, 0, 7); c.arc(x - 11, y - 17, 10, 0, 7); c.arc(x + 11, y - 17, 10, 0, 7); c.fill();
  c.fillStyle = '#5f9438'; c.beginPath(); c.arc(x - 4, y - 26, 9, 0, 7); c.fill();
}
function drawDeadTree(c, x, y, s = 1) {
  c.save(); c.translate(x, y); c.scale(s, s);
  c.strokeStyle = '#3a3028'; c.lineCap = 'round';
  c.lineWidth = 7;
  c.beginPath(); c.moveTo(0, 0); c.quadraticCurveTo(-3, -22, 2, -40); c.stroke();
  c.lineWidth = 3.6;
  c.beginPath();
  c.moveTo(1, -26); c.quadraticCurveTo(-14, -34, -22, -46);
  c.moveTo(2, -34); c.quadraticCurveTo(14, -44, 24, -50);
  c.moveTo(2, -40); c.quadraticCurveTo(-4, -54, -10, -62);
  c.moveTo(2, -40); c.quadraticCurveTo(8, -56, 14, -66);
  c.stroke();
  c.lineWidth = 2;
  c.beginPath();
  c.moveTo(-22, -46); c.lineTo(-27, -52); c.moveTo(24, -50); c.lineTo(30, -54);
  c.moveTo(-10, -62); c.lineTo(-13, -70); c.moveTo(14, -66); c.lineTo(19, -72);
  c.stroke();
  c.restore();
}
function drawGravestone(c, x, y) {
  c.fillStyle = '#8b8b86';
  c.beginPath(); c.moveTo(x - 8, y); c.lineTo(x - 8, y - 12); c.arc(x, y - 12, 8, Math.PI, 0); c.lineTo(x + 8, y); c.fill();
  c.fillStyle = 'rgba(0,0,0,.2)'; c.fillRect(x - 8, y - 4, 16, 3);
  c.fillStyle = '#6e6e68'; c.font = '8px sans-serif'; c.textAlign = 'center'; c.fillText('RIP', x, y - 12);
}
function drawCross(c, x, y) {
  c.strokeStyle = '#5d4a2e'; c.lineWidth = 4;
  c.beginPath(); c.moveTo(x, y); c.lineTo(x, y - 16); c.moveTo(x - 6, y - 11); c.lineTo(x + 6, y - 11); c.stroke();
}
function drawWreckCar(c, x, y) {
  c.fillStyle = '#7a7468'; c.fillRect(x - 20, y - 12, 40, 10);
  c.fillRect(x - 12, y - 19, 22, 8);
  c.fillStyle = '#4a463e'; c.beginPath(); c.arc(x - 12, y, 5, 0, 7); c.arc(x + 12, y, 5, 0, 7); c.fill();
  c.strokeStyle = 'rgba(140,60,30,.6)'; c.lineWidth = 1.6;
  c.beginPath(); c.moveTo(x - 18, y - 8); c.lineTo(x + 16, y - 6); c.stroke();
}
function drawWreckTractor(c, x, y) {
  c.fillStyle = '#8a5a3a'; c.fillRect(x - 16, y - 12, 30, 10);
  c.fillStyle = '#4a463e'; c.beginPath(); c.arc(x - 9, y, 7, 0, 7); c.arc(x + 10, y, 4, 0, 7); c.fill();
  c.fillStyle = '#6a4a30'; c.fillRect(x + 4, y - 20, 6, 10);
  c.strokeStyle = 'rgba(140,60,30,.6)'; c.lineWidth = 1.6;
  c.beginPath(); c.moveTo(x - 14, y - 8); c.lineTo(x + 12, y - 6); c.stroke();
}
function drawBush(c, x, y) {
  c.fillStyle = '#4e7c2e';
  c.beginPath(); c.arc(x, y, 8, 0, 7); c.arc(x + 8, y + 2, 6, 0, 7); c.arc(x - 8, y + 2, 6, 0, 7); c.fill();
}

// ================= БАЗЫ =================
function drawBase(ctx, theme, hpFrac, t) {
  ctx.save();
  const flick = Math.sin(t * 13) * 0.5 + 0.5;
  if (theme === 'human') {
    // комплекс силосов на синем ангаре — как на скриншоте оригинала
    ctx.fillStyle = '#4a6a8a';
    ctx.beginPath(); ctx.roundRect(2, ROAD_TOP - 46, 72, 46, 3); ctx.fill();
    ctx.fillStyle = '#3a5570';
    ctx.fillRect(2, ROAD_TOP - 12, 72, 12);
    // ворота
    ctx.fillStyle = '#22262c';
    ctx.fillRect(26, ROAD_TOP - 34, 26, 34);
    ctx.strokeStyle = '#4a5a68'; ctx.lineWidth = 1.6;
    for (let i = 1; i < 4; i++) { ctx.beginPath(); ctx.moveTo(26, ROAD_TOP - 34 + i * 8.5); ctx.lineTo(52, ROAD_TOP - 34 + i * 8.5); ctx.stroke(); }
    // эмблема-монета
    ctx.fillStyle = '#e8b83e';
    ctx.beginPath(); ctx.arc(14, ROAD_TOP - 28, 6, 0, 7); ctx.fill();
    ctx.strokeStyle = '#8a6a10'; ctx.lineWidth = 1.4; ctx.stroke();
    // три силоса
    for (const [dx, h, r] of [[14, 88, 15], [40, 104, 17], [64, 84, 13]]) {
      ctx.fillStyle = '#aab4bc';
      ctx.beginPath(); ctx.ellipse(dx, ROAD_TOP - 44, r, h, 0, Math.PI, 0); ctx.fill();
      ctx.fillStyle = '#8d97a0';
      ctx.beginPath(); ctx.ellipse(dx, ROAD_TOP - 44, r, h * 0.16, 0, Math.PI, 0); ctx.fill();
      ctx.strokeStyle = '#7c868e'; ctx.lineWidth = 1.2;
      for (let i = 1; i < 6; i++) {
        ctx.beginPath(); ctx.ellipse(dx, ROAD_TOP - 44, r * (1 - i * 0.13), h * (1 - i * 0.13), 0, Math.PI, 0); ctx.stroke();
      }
      // крышка
      ctx.fillStyle = '#c8d0d6';
      ctx.beginPath(); ctx.ellipse(dx, ROAD_TOP - 44 - h, r, 5, 0, Math.PI, 0); ctx.fill();
    }
  } else {
    // склеп зомби: каменный холм с аркой, крест, черепа
    ctx.fillStyle = '#5a5448';
    ctx.beginPath();
    ctx.moveTo(0, ROAD_TOP);
    ctx.quadraticCurveTo(4, ROAD_TOP - 70, 40, ROAD_TOP - 78);
    ctx.quadraticCurveTo(72, ROAD_TOP - 72, 78, ROAD_TOP);
    ctx.fill();
    ctx.fillStyle = '#4a4438';
    ctx.beginPath(); ctx.ellipse(40, ROAD_TOP - 74, 34, 12, 0, 0, 7); ctx.fill();
    // арка-вход
    ctx.fillStyle = '#181410';
    ctx.beginPath();
    ctx.moveTo(26, ROAD_TOP);
    ctx.lineTo(26, ROAD_TOP - 30);
    ctx.arc(40, ROAD_TOP - 30, 14, Math.PI, 0);
    ctx.lineTo(54, ROAD_TOP);
    ctx.fill();
    // решётка
    ctx.strokeStyle = '#3e3a32'; ctx.lineWidth = 2;
    for (let i = 0; i < 4; i++) { ctx.beginPath(); ctx.moveTo(29 + i * 7.4, ROAD_TOP - 2); ctx.lineTo(29 + i * 7.4, ROAD_TOP - 36); ctx.stroke(); }
    // крест на макушке
    ctx.strokeStyle = '#2e2a24'; ctx.lineWidth = 4;
    ctx.beginPath(); ctx.moveTo(40, ROAD_TOP - 78); ctx.lineTo(40, ROAD_TOP - 96); ctx.moveTo(33, ROAD_TOP - 89); ctx.lineTo(47, ROAD_TOP - 89); ctx.stroke();
    // черепа у входа
    ctx.fillStyle = '#cfc9b8';
    ctx.beginPath(); ctx.arc(16, ROAD_TOP - 4, 4.4, 0, 7); ctx.arc(60, ROAD_TOP - 5, 4, 0, 7); ctx.fill();
    // ведьмин котёл
    ctx.fillStyle = '#22201c';
    ctx.beginPath(); ctx.arc(66, ROAD_TOP - 12, 8, Math.PI, 0); ctx.fill();
    ctx.fillStyle = '#7ec850'; ctx.globalAlpha = 0.65 + flick * 0.3;
    ctx.beginPath(); ctx.ellipse(66, ROAD_TOP - 12, 6, 2.4, 0, 0, 7); ctx.fill();
    ctx.globalAlpha = 1;
  }
  // повреждения общие
  if (hpFrac < 0.6) {
    ctx.strokeStyle = '#2c221a'; ctx.lineWidth = 2;
    ctx.beginPath(); ctx.moveTo(20, ROAD_TOP - 40); ctx.lineTo(26, ROAD_TOP - 30); ctx.lineTo(21, ROAD_TOP - 20); ctx.stroke();
  }
  if (hpFrac < 0.3) {
    ctx.strokeStyle = '#2c221a';
    ctx.beginPath(); ctx.moveTo(48, ROAD_TOP - 60); ctx.lineTo(44, ROAD_TOP - 46); ctx.lineTo(50, ROAD_TOP - 34); ctx.stroke();
    ctx.fillStyle = `rgba(255,${140 + flick * 60},40,.85)`;
    ctx.beginPath(); ctx.ellipse(34, ROAD_TOP - 10, 8, 12 + flick * 4, 0, 0, 7); ctx.fill();
    ctx.fillStyle = `rgba(255,220,80,.9)`;
    ctx.beginPath(); ctx.ellipse(34, ROAD_TOP - 8, 4.4, 7 + flick * 2, 0, 0, 7); ctx.fill();
  }
  ctx.restore();
}

// ================= ВНЕШНОСТЬ ЮНИТОВ (детализированные чиби-спрайты) =================
const OUTLINE = '#262014';

const LOOK = {
  // люди
  farmer:   { cloth:'#7a9c3e', clothHi:'#a5c46a', pants:'#5d4a2e', skin:'#e8b88a', skinHi:'#f7d9b8', hat:'straw',   weapon:'pitchfork' },
  sheriff:  { cloth:'#6b5a3e', clothHi:'#937c56', pants:'#4a3c26', skin:'#e0aa80', skinHi:'#f2c9a2', hat:'sheriff', weapon:'revolver', mustache:true },
  commando: { cloth:'#4e6434', clothHi:'#6d8a4a', pants:'#3a4a28', skin:'#d8a878', skinHi:'#ecc49a', hat:'helmet',  weapon:'smg' },
  granny:   { cloth:'#9c6a8a', clothHi:'#c493ac', pants:'#6a4a5e', skin:'#eabfa0', skinHi:'#f8dcc4', hat:'kerchief',weapon:'bat', hunch:true, small:0.92 },
  bazooka:  { cloth:'#5d6a3e', clothHi:'#7f9060', pants:'#444e2c', skin:'#e0aa80', skinHi:'#f2c9a2', hat:'cap',     weapon:'rocket' },
  smith:    { cloth:'#5d4a3e', clothHi:'#826856', pants:'#3a2e26', skin:'#d89c70', skinHi:'#eec094', hat:'none',    weapon:'sledge', apron:'#40332a', big:1.16, bald:true },
  hunter:   { cloth:'#6e5a3a', clothHi:'#967c52', pants:'#4e4028', skin:'#e0b090', skinHi:'#f2d2b4', hat:'ushanka', weapon:'rifle', beard:'#cfc3ae' },
  tractor:  { veh:'tractor' },
  // зомби
  crawler:  { cloth:'#5e6a4a', clothHi:'#7e8c66', pants:'#4a5238', skin:'#8ec45e', skinHi:'#b2e07e', hat:'none', weapon:'none', zomb:true, crawl:true },
  zombik:   { cloth:'#6a7a52', clothHi:'#8da072', pants:'#4e5a3e', skin:'#8ec45e', skinHi:'#b2e07e', hat:'none', weapon:'pipe',   zomb:true },
  spitter:  { cloth:'#7a8a5e', clothHi:'#9dae7e', pants:'#5a6a44', skin:'#9ed46a', skinHi:'#c2ea8e', hat:'none', weapon:'none', zomb:true, fat:0.16, openMouth:true },
  brute:    { cloth:'#4e5e3e', clothHi:'#6d8256', pants:'#3e4e30', skin:'#7eb84e', skinHi:'#a2dc74', hat:'none', weapon:'fists',  zomb:true, big:1.3, smallHead:true },
  hearse:   { veh:'hearse' },
  fattie:   { cloth:'#8a7a4e', clothHi:'#b0a072', pants:'#6a5a3a', skin:'#92ca62', skinHi:'#b6e686', hat:'none', weapon:'none', zomb:true, fat:0.42 },
  vampire:  { cloth:'#7a2e3e', clothHi:'#a24a5c', pants:'#3a1e26', skin:'#a8d46a', skinHi:'#c8ec8c', hat:'none', weapon:'claws',  zomb:true, cape:'#4e1a26', fangs:true },
  reaper:   { cloth:'#3a3a44', clothHi:'#5a5a66', pants:'#2a2a32', skin:'#9ed46a', skinHi:'#c2ea8e', hat:'hood', weapon:'scythe', zomb:true, big:1.18, robe:true },
};

// --- вспомогательные ---
function oStroke(ctx, w = 1.4) { ctx.strokeStyle = OUTLINE; ctx.lineWidth = w; ctx.stroke(); }
function limb(ctx, x1, y1, x2, y2, w, color) {
  ctx.lineCap = 'round';
  ctx.strokeStyle = OUTLINE; ctx.lineWidth = w + 1.8;
  ctx.beginPath(); ctx.moveTo(x1, y1); ctx.lineTo(x2, y2); ctx.stroke();
  ctx.strokeStyle = color; ctx.lineWidth = w;
  ctx.beginPath(); ctx.moveTo(x1, y1); ctx.lineTo(x2, y2); ctx.stroke();
}
function boot(ctx, x, y, dir = 1) {
  ctx.fillStyle = OUTLINE;
  ctx.beginPath(); ctx.ellipse(x + dir * 1.5, y, 4.6, 3, 0, 0, 7); ctx.fill();
  ctx.fillStyle = '#3a2e20';
  ctx.beginPath(); ctx.ellipse(x + dir * 1.5, y - 0.4, 3.6, 2.2, 0, 0, 7); ctx.fill();
}

function drawUnit(ctx, u, t) {
  const L = LOOK[u.id];
  ctx.save();
  ctx.translate(u.x, u.y);
  ctx.scale(u.dir, 1);
  if (u.state === 'dead') {
    const p = Math.min(1, (1 - u.deadT / 0.9) * 2.2);
    ctx.globalAlpha = Math.max(0, u.deadT / 0.9);
    ctx.rotate(-Math.PI / 2 * p);
  }
  if (u.state !== 'dead') {
    ctx.fillStyle = 'rgba(0,0,0,.28)';
    ctx.beginPath(); ctx.ellipse(0, 2, L.big ? 16 : 12, 4.4, 0, 0, 7); ctx.fill();
  }
  if (L.veh) drawVehicle(ctx, L.veh, t, u);
  else drawHumanoid(ctx, L, t, u);
  ctx.restore();
}

function drawHumanoid(ctx, L, t, u) {
  const s = (L.big || 1) * (L.small || 1);
  const walking = u.state === 'walk';
  const attacking = u.state === 'attack';
  const tt = t * 9 + (u.seed || 0);
  const bob = walking ? Math.abs(Math.sin(tt)) * 1.7 : 0;
  const legSw = walking ? Math.sin(tt) * 5.5 : 0;
  const lean = walking ? 0.07 : (L.zomb ? 0.1 : 0.02);
  const sw = attacking ? Math.sin(Math.min(1, u.atkT) * Math.PI) : 0;
  const fat = L.fat || 0;

  ctx.save();
  ctx.scale(s, s);
  if (L.crawl) { ctx.translate(3, -4.5); ctx.rotate(1.08); }
  else ctx.rotate(lean);
  const hipY = -7;
  const bodyBot = -5.5, bodyTop = -19.5;
  const bodyW = 12 + fat * 16;
  const headR = L.smallHead ? 6.4 : 8.2;
  const headY = bodyTop - headR + 2.5 - bob - (L.zomb ? 1 : 0);
  const headX = 1.5 + (L.zomb ? 1.6 : 0);

  // ---- дальняя рука (за телом) ----
  const backArmSw = walking ? Math.sin(tt + 3.1) * 3 : 0;
  if (!L.crawl) limb(ctx, -2, bodyTop + 4, -5 - backArmSw * .5, hipY + 2 - Math.abs(backArmSw) * .3, 3.2, shade(L.skin, -18));

  // ---- ноги ----
  if (L.robe) {
    // халат жнеца вместо ног
    ctx.fillStyle = OUTLINE;
    ctx.beginPath(); ctx.moveTo(-9, hipY + 7); ctx.lineTo(9, hipY + 7); ctx.lineTo(7, bodyBot - 1); ctx.lineTo(-7, bodyBot - 1); ctx.fill();
    ctx.fillStyle = L.cloth;
    ctx.beginPath(); ctx.moveTo(-8, hipY + 7); ctx.lineTo(8, hipY + 7); ctx.lineTo(6, bodyBot); ctx.lineTo(-6, bodyBot); ctx.fill();
    ctx.strokeStyle = shade(L.cloth, -30); ctx.lineWidth = 1.4;
    ctx.beginPath(); ctx.moveTo(-2, bodyBot + 1); ctx.lineTo(-1, hipY + 7); ctx.stroke();
    boot(ctx, -5, hipY + 7.4); boot(ctx, 6, hipY + 7.4);
  } else {
    limb(ctx, -3, hipY, -3 + legSw * .6, -1.6, 3.6, L.pants);
    limb(ctx, 3, hipY, 3 - legSw * .6, -1.6, 3.6, shade(L.pants, -14));
    boot(ctx, -3 + legSw, 0, 1);
    boot(ctx, 3 - legSw, 0, 1);
  }

  // ---- плащ ----
  if (L.cape) {
    const fl = walking ? Math.sin(tt * .7) * 2 : sw * 2;
    ctx.fillStyle = OUTLINE;
    ctx.beginPath();
    ctx.moveTo(-3, bodyTop + 1);
    ctx.quadraticCurveTo(-13 - fl, bodyTop + 8, -11 - fl, bodyBot + 6);
    ctx.quadraticCurveTo(-5, bodyBot + 2, 2, bodyBot);
    ctx.lineTo(-3, bodyTop + 1);
    ctx.fill();
    ctx.fillStyle = L.cape;
    ctx.beginPath();
    ctx.moveTo(-3.6, bodyTop + 1.6);
    ctx.quadraticCurveTo(-12 - fl, bodyTop + 8, -10 - fl, bodyBot + 5);
    ctx.quadraticCurveTo(-5, bodyBot + 1.6, 1.4, bodyBot - .6);
    ctx.lineTo(-3.6, bodyTop + 1.6);
    ctx.fill();
  }

  // ---- торс ----
  const gr = ctx.createLinearGradient(0, bodyTop, 0, bodyBot + 1);
  gr.addColorStop(0, L.clothHi); gr.addColorStop(.55, L.cloth); gr.addColorStop(1, shade(L.cloth, -22));
  ctx.fillStyle = OUTLINE;
  ctx.beginPath(); ctx.roundRect(-bodyW / 2 - 1, bodyTop - 1, bodyW + 2, bodyBot - bodyTop + 3, 5.5); ctx.fill();
  ctx.fillStyle = gr;
  ctx.beginPath(); ctx.roundRect(-bodyW / 2, bodyTop, bodyW, bodyBot - bodyTop + 1, 5); ctx.fill();
  // пояс
  ctx.fillStyle = shade(L.pants, -10);
  ctx.fillRect(-bodyW / 2 + 1, bodyBot - 3, bodyW - 2, 2.4);
  // жилет/заплата/рвань
  if (L.zomb) {
    ctx.fillStyle = shade(L.cloth, -34);
    ctx.beginPath(); ctx.moveTo(-bodyW / 2 + 1, bodyTop + 2); ctx.lineTo(-bodyW / 2 + 5, bodyTop + 2); ctx.lineTo(-bodyW / 2 + 2, bodyTop + 7); ctx.fill();
    ctx.strokeStyle = shade(L.cloth, -40); ctx.lineWidth = 1;
    ctx.beginPath(); ctx.moveTo(bodyW / 2 - 4, bodyBot - 5); ctx.lineTo(bodyW / 2 - 1.4, bodyBot - 1); ctx.stroke();
  }
  if (L.apron) {
    ctx.fillStyle = L.apron;
    ctx.beginPath(); ctx.roundRect(-4.4, bodyTop + 3, 8.8, bodyBot - bodyTop - 2, 2); ctx.fill();
    ctx.strokeStyle = shade(L.apron, 30); ctx.lineWidth = 1;
    ctx.beginPath(); ctx.moveTo(-3.4, bodyTop + 3); ctx.lineTo(-3.4, bodyBot - 2); ctx.stroke();
  }
  // пуговицы
  ctx.fillStyle = shade(L.cloth, 40);
  ctx.beginPath(); ctx.arc(bodyW / 2 - 3.4, bodyTop + 4, .9, 0, 7); ctx.arc(bodyW / 2 - 3.4, bodyTop + 7.4, .9, 0, 7); ctx.fill();

  // ---- голова ----
  const hg = ctx.createRadialGradient(headX - 2.4, headY - 3, 1.6, headX, headY, headR + 1);
  hg.addColorStop(0, L.skinHi); hg.addColorStop(.72, L.skin); hg.addColorStop(1, shade(L.skin, -20));
  ctx.fillStyle = OUTLINE;
  ctx.beginPath(); ctx.arc(headX, headY, headR + 1, 0, 7); ctx.fill();
  ctx.fillStyle = hg;
  ctx.beginPath(); ctx.arc(headX, headY, headR, 0, 7); ctx.fill();
  // ухо
  ctx.fillStyle = shade(L.skin, -12);
  ctx.beginPath(); ctx.arc(headX - headR + 1.6, headY + 1, 1.8, 0, 7); ctx.fill();
  // лицо: глаз(а)
  const eyeY = headY - 1;
  if (L.smallHead) {
    // громила: злые щелки
    ctx.strokeStyle = OUTLINE; ctx.lineWidth = 1.6;
    ctx.beginPath(); ctx.moveTo(headX + 1.4, eyeY); ctx.lineTo(headX + 4.6, eyeY - 1); ctx.stroke();
  } else {
    ctx.fillStyle = '#fff';
    ctx.beginPath(); ctx.ellipse(headX + 3.6, eyeY, 2.3, 2.5, 0, 0, 7); ctx.fill();
    oStroke(ctx, .9);
    ctx.fillStyle = L.zomb ? '#e8c81e' : '#26201a';
    ctx.beginPath(); ctx.arc(headX + 4.2, eyeY + .2, 1.15, 0, 7); ctx.fill();
    if (L.zomb) { // второй глаз навыкате
      ctx.fillStyle = '#fff';
      ctx.beginPath(); ctx.ellipse(headX - .4, eyeY - .4, 1.7, 2.1, 0, 0, 7); ctx.fill();
      oStroke(ctx, .8);
      ctx.fillStyle = '#e8c81e';
      ctx.beginPath(); ctx.arc(headX + .1, eyeY - .3, .9, 0, 7); ctx.fill();
    }
    // бровь
    ctx.strokeStyle = OUTLINE; ctx.lineWidth = 1.3;
    ctx.beginPath();
    if (L.zomb) { ctx.moveTo(headX + 1.8, eyeY - 3.4); ctx.lineTo(headX + 5.6, eyeY - 2.2); }
    else { ctx.moveTo(headX + 1.8, eyeY - 3.6); ctx.lineTo(headX + 5.4, eyeY - 3); }
    ctx.stroke();
  }
  // рот
  if (L.openMouth) {
    ctx.fillStyle = '#4a1420';
    ctx.beginPath(); ctx.ellipse(headX + 3.8, headY + 3.6, 2.6, 2, 0, 0, 7); ctx.fill();
    oStroke(ctx, .8);
  } else {
    ctx.strokeStyle = OUTLINE; ctx.lineWidth = 1.1;
    ctx.beginPath(); ctx.moveTo(headX + 2, headY + 4.2); ctx.lineTo(headX + 5.2, headY + 3.8); ctx.stroke();
  }
  if (L.fangs) {
    ctx.fillStyle = '#fff';
    ctx.beginPath(); ctx.moveTo(headX + 2.6, headY + 3.2); ctx.lineTo(headX + 3.4, headY + 5.4); ctx.lineTo(headX + 4, headY + 3.2); ctx.fill();
  }
  if (L.mustache) {
    ctx.strokeStyle = '#4a3a26'; ctx.lineWidth = 1.7; ctx.lineCap = 'round';
    ctx.beginPath(); ctx.moveTo(headX + .8, headY + 2.4); ctx.quadraticCurveTo(headX + 3.6, headY + 3.6, headX + 6, headY + 2.2); ctx.stroke();
  }
  if (L.beard) {
    ctx.fillStyle = L.beard;
    ctx.beginPath(); ctx.arc(headX + 2.4, headY + 4.6, 4.4, -.4, 2.4); ctx.fill();
    oStroke(ctx, .9);
  }
  if (L.zomb) {
    // рана и мозги
    ctx.fillStyle = '#a8443a';
    ctx.beginPath(); ctx.arc(headX - 3.6, headY - 3.4, 2.4, 0, 7); ctx.fill();
    ctx.fillStyle = '#c46a6a';
    ctx.beginPath(); ctx.arc(headX - 3.9, headY - 4, 1.3, 0, 7); ctx.fill();
    ctx.strokeStyle = '#7a2e28'; ctx.lineWidth = 1;
    ctx.beginPath(); ctx.moveTo(headX - 1.6, headY + 2.6); ctx.lineTo(headX - 4.6, headY + 1.4); ctx.stroke();
    // шрам-заплата на торсе уже нарисована
  }
  drawHat(ctx, L, headX, headY, headR);
  if (L.bald) { // лысина-блик
    ctx.fillStyle = 'rgba(255,255,255,.22)';
    ctx.beginPath(); ctx.ellipse(headX - 1, headY - 4, 3.4, 2, -.5, 0, 7); ctx.fill();
  }

  // ---- передняя рука + оружие ----
  drawWeaponArms(ctx, L, bodyTop, bodyBot, sw, t, walking, tt, headR);

  ctx.restore();
}

// затемнение/осветление цвета
function shade(hex, amt) {
  const n = hex.replace('#', '');
  const v = parseInt(n.length === 3 ? n.split('').map(c => c + c).join('') : n, 16);
  let r = (v >> 16) + amt, g = ((v >> 8) & 255) + amt, b = (v & 255) + amt;
  r = Math.max(0, Math.min(255, r)); g = Math.max(0, Math.min(255, g)); b = Math.max(0, Math.min(255, b));
  return `rgb(${r},${g},${b})`;
}

function drawHat(ctx, L, hx, hy, hr) {
  switch (L.hat) {
    case 'straw': {
      ctx.fillStyle = OUTLINE;
      ctx.beginPath(); ctx.ellipse(hx + .6, hy - hr + 1.4, 12, 3.6, 0, 0, 7); ctx.fill();
      ctx.fillStyle = '#e0c25e';
      ctx.beginPath(); ctx.ellipse(hx + .6, hy - hr + 1, 11, 3.1, 0, 0, 7); ctx.fill();
      ctx.fillStyle = '#eed488';
      ctx.beginPath(); ctx.ellipse(hx + .6, hy - hr - .6, 10, 2.4, 0, 0, 7); ctx.fill();
      ctx.fillStyle = '#d8b44a';
      ctx.beginPath(); ctx.arc(hx + .6, hy - hr - 1.6, 5.4, Math.PI, 0); ctx.fill();
      ctx.strokeStyle = '#a8842e'; ctx.lineWidth = 1.1;
      ctx.beginPath(); ctx.moveTo(hx - 4, hy - hr - 2.4); ctx.quadraticCurveTo(hx + .6, hy - hr - 4.6, hx + 5, hy - hr - 2.4); ctx.stroke();
      // поля: тень
      ctx.fillStyle = 'rgba(0,0,0,.14)';
      ctx.beginPath(); ctx.ellipse(hx + .6, hy - hr + 2.2, 11, 1.2, 0, 0, 7); ctx.fill();
      break;
    }
    case 'sheriff': {
      ctx.fillStyle = OUTLINE;
      ctx.beginPath(); ctx.ellipse(hx + .4, hy - hr + 1.2, 11, 3.2, 0, 0, 7); ctx.fill();
      ctx.fillStyle = '#7a5a34';
      ctx.beginPath(); ctx.ellipse(hx + .4, hy - hr + .8, 10, 2.8, 0, 0, 7); ctx.fill();
      ctx.fillStyle = '#8d6a3e';
      ctx.beginPath(); ctx.arc(hx + .4, hy - hr - 1.4, 5, Math.PI, 0); ctx.fill();
      ctx.fillStyle = '#e8c85e';
      ctx.beginPath(); ctx.arc(hx + .4, hy - hr - 3.6, 1.5, 0, 7); ctx.fill();
      oStroke(ctx, .8);
      break;
    }
    case 'helmet': {
      ctx.fillStyle = OUTLINE;
      ctx.beginPath(); ctx.arc(hx, hy - 2.4, hr + 1.4, Math.PI, 0); ctx.fill();
      ctx.fillStyle = '#3e5a2e';
      ctx.beginPath(); ctx.arc(hx, hy - 2.4, hr + .4, Math.PI, 0); ctx.fill();
      ctx.fillStyle = '#55793e';
      ctx.beginPath(); ctx.arc(hx - 1, hy - 3.6, hr - 1.4, Math.PI * 1.05, Math.PI * 1.8); ctx.fill();
      ctx.fillStyle = '#33502a';
      ctx.fillRect(hx - hr - 1, hy - 3.4, hr * 2 + 2.4, 2.2);
      break;
    }
    case 'kerchief': {
      ctx.fillStyle = OUTLINE;
      ctx.beginPath(); ctx.moveTo(hx - hr - 1, hy - 1); ctx.lineTo(hx + hr + 1, hy - 1); ctx.lineTo(hx, hy - hr - 3); ctx.fill();
      ctx.fillStyle = '#c46a8a';
      ctx.beginPath(); ctx.moveTo(hx - hr + .4, hy - 1.6); ctx.lineTo(hx + hr - .4, hy - 1.6); ctx.lineTo(hx, hy - hr - 2); ctx.fill();
      // узел
      ctx.fillStyle = '#a85577';
      ctx.beginPath(); ctx.arc(hx - hr + 1.4, hy - 1, 1.8, 0, 7); ctx.fill();
      break;
    }
    case 'cap': {
      ctx.fillStyle = OUTLINE;
      ctx.beginPath(); ctx.arc(hx, hy - 3, hr + .6, Math.PI, 0); ctx.fill();
      ctx.fillStyle = '#4e6434';
      ctx.beginPath(); ctx.arc(hx, hy - 3, hr - .4, Math.PI, 0); ctx.fill();
      ctx.fillRect(hx - 1, hy - 4.4, 10, 2.2);
      ctx.fillStyle = '#3a4a28';
      ctx.fillRect(hx - 1, hy - 4.4, 10, 1);
      break;
    }
    case 'ushanka': {
      ctx.fillStyle = OUTLINE;
      ctx.beginPath(); ctx.arc(hx, hy - 2.6, hr + 1, Math.PI * .95, Math.PI * 2.05); ctx.fill();
      ctx.fillStyle = '#7a6248';
      ctx.beginPath(); ctx.arc(hx, hy - 2.6, hr, Math.PI, 0); ctx.fill();
      ctx.fillStyle = '#8d7358';
      ctx.beginPath(); ctx.arc(hx - 1, hy - 4, hr - 2.4, Math.PI * 1.05, Math.PI * 1.7); ctx.fill();
      ctx.fillStyle = '#5d4a34';
      ctx.fillRect(hx - hr - 1.4, hy - 3.4, 4.4, 5.4);
      ctx.fillRect(hx + hr - 2.8, hy - 3.4, 4.4, 5.4);
      break;
    }
    case 'hood': {
      ctx.fillStyle = OUTLINE;
      ctx.beginPath(); ctx.arc(hx - .8, hy - 1, hr + 2.2, Math.PI * .8, Math.PI * 2.08); ctx.fill();
      ctx.fillStyle = L.cloth;
      ctx.beginPath(); ctx.arc(hx - .8, hy - 1, hr + 1.2, Math.PI * .82, Math.PI * 2.06); ctx.fill();
      // тень лица под капюшоном
      ctx.fillStyle = 'rgba(10,8,14,.75)';
      ctx.beginPath(); ctx.arc(hx + 1, hy + 1, hr - 2.6, -1.2, 1.4); ctx.fill();
      // глаза светятся
      ctx.fillStyle = '#ffd34e';
      ctx.beginPath(); ctx.arc(hx + 2.6, hy - .4, 1.1, 0, 7); ctx.arc(hx + 5, hy + .2, 1, 0, 7); ctx.fill();
      break;
    }
  }
}

function drawWeaponArms(ctx, L, bodyTop, bodyBot, sw, t, walking, tt, headR) {
  const shY = bodyTop + 3.4; // плечо
  const hx = 7.5, hy = shY + 4; // базовая позиция кисти
  const skinF = L.skin, skinB = shade(L.skin, -18);

  switch (L.weapon) {
    case 'pitchfork': {
      const a = -.35 + sw * .8;
      limb(ctx, 1, shY, hx + Math.cos(a) * 3, hy + Math.sin(a) * 3, 3.4, skinF);
      ctx.save(); ctx.translate(hx + 1, hy + 2); ctx.rotate(-.3 + sw * .8);
      ctx.strokeStyle = '#6a4a28'; ctx.lineWidth = 3.4; ctx.lineCap = 'round';
      ctx.beginPath(); ctx.moveTo(-1, 12); ctx.lineTo(0, -13); ctx.stroke();
      ctx.strokeStyle = '#8a6a3e'; ctx.lineWidth = 2;
      ctx.beginPath(); ctx.moveTo(-1, 12); ctx.lineTo(0, -13); ctx.stroke();
      ctx.fillStyle = '#c8ccd2';
      for (const tx of [-4.6, 0, 4.6]) {
        ctx.beginPath(); ctx.roundRect(tx - 1.1, -21, 2.2, 8, 1); ctx.fill();
      }
      ctx.strokeStyle = '#9aa0a8'; ctx.lineWidth = .8;
      for (const tx of [-4.6, 0, 4.6]) { ctx.beginPath(); ctx.moveTo(tx, -21); ctx.lineTo(tx, -17); ctx.stroke(); }
      ctx.restore(); break;
    }
    case 'revolver': {
      const a = -.5 + sw * .5;
      limb(ctx, 1, shY, hx + 2, shY + 1.6, 3.4, skinF);
      ctx.save(); ctx.translate(hx + 3, shY + 1.4); ctx.rotate(a);
      ctx.fillStyle = OUTLINE; ctx.fillRect(-1, -2.6, 12.4, 4);
      ctx.fillStyle = '#565c64'; ctx.fillRect(-.4, -2, 11, 2.6);
      ctx.fillStyle = '#3a3026'; ctx.fillRect(0, 0, 3.4, 4.6); // рукоять
      ctx.fillStyle = '#8a8e96'; ctx.beginPath(); ctx.arc(2, -1, 1.6, 0, 7); ctx.fill(); // барабан
      ctx.restore(); break;
    }
    case 'smg': {
      limb(ctx, 1, shY, hx + 1, shY + 2.6, 3.4, skinF);
      ctx.save(); ctx.translate(hx + 2, shY + 1.6); ctx.rotate(-.1 + sw * .2);
      ctx.fillStyle = OUTLINE; ctx.fillRect(-1.4, -2.2, 15, 5.4);
      ctx.fillStyle = '#2e3236'; ctx.fillRect(-.8, -1.6, 13.6, 4);
      ctx.fillStyle = '#22262a'; ctx.fillRect(3, 1.6, 3, 5); // магазин
      ctx.fillStyle = '#4a5056'; ctx.fillRect(9, -3, 4, 2); // прицел
      ctx.restore(); break;
    }
    case 'bat': {
      const a = -1.9 + sw * 1.5;
      limb(ctx, 1, shY, hx - 1 + sw * 2, hy - 2 - sw * 3, 3.4, skinF);
      ctx.save(); ctx.translate(hx - 1 + sw * 2, hy - 2 - sw * 3); ctx.rotate(a);
      ctx.strokeStyle = OUTLINE; ctx.lineWidth = 6; ctx.lineCap = 'round';
      ctx.beginPath(); ctx.moveTo(0, 2); ctx.lineTo(0, -15); ctx.stroke();
      ctx.strokeStyle = '#a8763e'; ctx.lineWidth = 4.4;
      ctx.beginPath(); ctx.moveTo(0, 2); ctx.lineTo(0, -15); ctx.stroke();
      ctx.strokeStyle = '#c49a5e'; ctx.lineWidth = 2;
      ctx.beginPath(); ctx.moveTo(-.8, -8); ctx.lineTo(-.8, -14); ctx.stroke();
      ctx.restore(); break;
    }
    case 'rocket': {
      limb(ctx, 1, shY, hx - 1, shY + 1, 3.4, skinF);
      limb(ctx, -1, shY + 1, hx + 6, shY + 1.6, 3.4, skinF);
      ctx.save(); ctx.translate(hx, shY - 1);
      ctx.fillStyle = OUTLINE; ctx.beginPath(); ctx.roundRect(-3, -5.4, 24, 7.4, 3); ctx.fill();
      ctx.fillStyle = '#4e6a34'; ctx.beginPath(); ctx.roundRect(-2.2, -4.6, 22.4, 5.8, 2.6); ctx.fill();
      ctx.fillStyle = '#5d7a40'; ctx.fillRect(-2.2, -4.6, 22.4, 1.8);
      ctx.fillStyle = '#c43a2e';
      ctx.beginPath(); ctx.moveTo(20, -5); ctx.lineTo(26, -2); ctx.lineTo(20, 1.4); ctx.fill();
      ctx.restore(); break;
    }
    case 'sledge': {
      const a = -2.2 + sw * 1.9;
      limb(ctx, 1, shY, hx + sw * 3, shY + 1 - sw * 4, 3.6, skinF);
      ctx.save(); ctx.translate(hx + sw * 3, shY + 1 - sw * 4); ctx.rotate(a);
      ctx.strokeStyle = '#6a4a28'; ctx.lineWidth = 4.6; ctx.lineCap = 'round';
      ctx.beginPath(); ctx.moveTo(0, 3); ctx.lineTo(0, -16); ctx.stroke();
      ctx.strokeStyle = '#8a6a3e'; ctx.lineWidth = 3;
      ctx.beginPath(); ctx.moveTo(0, 3); ctx.lineTo(0, -16); ctx.stroke();
      ctx.fillStyle = OUTLINE; ctx.beginPath(); ctx.roundRect(-6, -22, 12, 7.4, 1.6); ctx.fill();
      ctx.fillStyle = '#7a7e84';
      ctx.beginPath(); ctx.roundRect(-5, -21, 10, 5.6, 1.2); ctx.fill();
      ctx.fillStyle = '#9aa0a8'; ctx.fillRect(-5, -21, 10, 1.6);
      ctx.restore(); break;
    }
    case 'rifle': {
      limb(ctx, 1, shY, hx, shY + 2, 3.4, skinF);
      limb(ctx, -1, shY + 1, hx + 7, shY + 3, 3.4, skinF);
      ctx.save(); ctx.translate(hx, shY + 1.6); ctx.rotate(-.06 + sw * .1);
      ctx.fillStyle = OUTLINE; ctx.fillRect(-2, -2.4, 26, 4.4);
      ctx.fillStyle = '#6e4a28'; ctx.fillRect(-1.4, -1.8, 17, 3.2);
      ctx.fillStyle = '#4a4e54'; ctx.fillRect(15, -1.4, 9, 2.4);
      ctx.fillStyle = '#3a3e44'; ctx.fillRect(2, -4.4, 5, 2.4); // прицел
      ctx.fillStyle = '#5d4326'; ctx.fillRect(-2, 1, 5, 4.4); // ложа
      ctx.restore(); break;
    }
    case 'pipe': {
      const a = -1.7 + sw * 1.4;
      limb(ctx, 1, shY, hx - 1 + sw * 2, hy - 2 - sw * 3, 3.4, skinF);
      ctx.save(); ctx.translate(hx - 1 + sw * 2, hy - 2 - sw * 3); ctx.rotate(a);
      ctx.strokeStyle = OUTLINE; ctx.lineWidth = 4.6; ctx.lineCap = 'round';
      ctx.beginPath(); ctx.moveTo(0, 2); ctx.lineTo(0, -14); ctx.stroke();
      ctx.strokeStyle = '#8a8e94'; ctx.lineWidth = 3;
      ctx.beginPath(); ctx.moveTo(0, 2); ctx.lineTo(0, -14); ctx.stroke();
      ctx.strokeStyle = '#aab0b6'; ctx.lineWidth = 1.2;
      ctx.beginPath(); ctx.moveTo(-.7, -2); ctx.lineTo(-.7, -12); ctx.stroke();
      ctx.restore(); break;
    }
    case 'fists': {
      const punch = sw * 7;
      limb(ctx, 1, shY, hx + 2 + punch, shY + 3, 3.8, skinF);
      ctx.fillStyle = OUTLINE;
      ctx.beginPath(); ctx.arc(hx + 3.6 + punch, shY + 3, 4.2, 0, 7); ctx.fill();
      ctx.fillStyle = L.skin;
      ctx.beginPath(); ctx.arc(hx + 3.6 + punch, shY + 3, 3.4, 0, 7); ctx.fill();
      ctx.fillStyle = shade(L.skin, -16);
      ctx.beginPath(); ctx.arc(hx + 2.4 + punch, shY + 4.4, 1.4, 0, 7); ctx.fill();
      break;
    }
    case 'claws': {
      const a = sw * .5;
      limb(ctx, 1, shY, hx + 2 + a * 4, shY + 2.6, 3.4, skinF);
      ctx.save(); ctx.translate(hx + 3.6 + a * 4, shY + 2.6);
      ctx.fillStyle = OUTLINE;
      ctx.beginPath(); ctx.arc(0, 0, 3.6, 0, 7); ctx.fill();
      ctx.fillStyle = L.skin;
      ctx.beginPath(); ctx.arc(0, 0, 2.9, 0, 7); ctx.fill();
      ctx.strokeStyle = OUTLINE; ctx.lineWidth = 2.2; ctx.lineCap = 'round';
      for (let i = -1; i <= 1; i++) {
        ctx.beginPath(); ctx.moveTo(2, i * 2.6); ctx.lineTo(9.4, i * 3.4 - .8); ctx.stroke();
      }
      ctx.strokeStyle = '#e8e8e8'; ctx.lineWidth = 1.2;
      for (let i = -1; i <= 1; i++) {
        ctx.beginPath(); ctx.moveTo(2.6, i * 2.6); ctx.lineTo(9, i * 3.4 - .8); ctx.stroke();
      }
      ctx.restore(); break;
    }
    case 'scythe': {
      const a = -1.8 + sw * 1.2;
      limb(ctx, 1, shY, hx + sw * 2, shY + 2, 3.6, skinF);
      ctx.save(); ctx.translate(hx + sw * 2, shY + 2); ctx.rotate(a);
      ctx.strokeStyle = '#3a2c1c'; ctx.lineWidth = 4; ctx.lineCap = 'round';
      ctx.beginPath(); ctx.moveTo(0, 8); ctx.lineTo(0, -24); ctx.stroke();
      ctx.strokeStyle = '#54432c'; ctx.lineWidth = 2.4;
      ctx.beginPath(); ctx.moveTo(0, 8); ctx.lineTo(0, -24); ctx.stroke();
      // изогнутый клинок с градиентом
      const bg = ctx.createLinearGradient(0, -30, 14, -18);
      bg.addColorStop(0, '#eef1f4'); bg.addColorStop(1, '#8a9098');
      ctx.strokeStyle = OUTLINE; ctx.lineWidth = 4.4;
      ctx.beginPath(); ctx.arc(7, -24, 8.4, Math.PI * .92, Math.PI * 1.76); ctx.stroke();
      ctx.strokeStyle = bg; ctx.lineWidth = 3;
      ctx.beginPath(); ctx.arc(7, -24, 8.4, Math.PI * .92, Math.PI * 1.76); ctx.stroke();
      ctx.restore(); break;
    }
    default: {
      // без оружия: зомби тянет обе лапы вперёд
      const reach = walking ? Math.sin(tt) * 1.4 : sw * 3;
      limb(ctx, 1, shY, 10 + reach, shY + 3.4, 3.4, L.skin);
      limb(ctx, -1, shY + 1.4, 8.4 - reach, shY + 5.4, 3.2, skinB);
      // кисти
      ctx.fillStyle = OUTLINE;
      ctx.beginPath(); ctx.arc(10.8 + reach, shY + 3.4, 2.9, 0, 7); ctx.arc(8.8 - reach, shY + 5.4, 2.6, 0, 7); ctx.fill();
      ctx.fillStyle = L.skin;
      ctx.beginPath(); ctx.arc(10.8 + reach, shY + 3.4, 2.2, 0, 7); ctx.fill();
      ctx.fillStyle = skinB;
      ctx.beginPath(); ctx.arc(8.8 - reach, shY + 5.4, 2, 0, 7); ctx.fill();
    }
  }
}

function drawVehicle(ctx, kind, t, u) {
  const walking = u.state === 'walk';
  const wheelR = walking ? t * 5 : 0;
  if (kind === 'tractor') {
    ctx.fillStyle = 'rgba(0,0,0,.28)';
    ctx.beginPath(); ctx.ellipse(0, 2, 21, 5.4, 0, 0, 7); ctx.fill();
    // корпус с градиентом
    const bg = ctx.createLinearGradient(0, -22, 0, -8);
    bg.addColorStop(0, '#d4614a'); bg.addColorStop(.5, '#b5432f'); bg.addColorStop(1, '#8a2f20');
    ctx.fillStyle = bg;
    ctx.beginPath(); ctx.roundRect(-18, -21, 35, 14, 3); ctx.fill();
    oStroke(ctx, 1.4);
    // кабина
    ctx.fillStyle = '#c4523e';
    ctx.beginPath(); ctx.roundRect(-9, -31, 15, 11, 2); ctx.fill();
    oStroke(ctx, 1.2);
    ctx.fillStyle = '#bfe4f0'; ctx.fillRect(-6, -28.4, 9, 6);
    ctx.fillStyle = 'rgba(255,255,255,.5)'; ctx.beginPath(); ctx.moveTo(-5, -28); ctx.lineTo(-2, -28); ctx.lineTo(-5, -23); ctx.fill();
    // труба + дым
    ctx.fillStyle = '#3a3a3a'; ctx.fillRect(12.4, -31, 4.4, 11);
    ctx.fillStyle = 'rgba(160,160,160,.5)';
    ctx.beginPath(); ctx.arc(14.6 + Math.sin(t * 3) * 1, -34, 2.4, 0, 7); ctx.fill();
    // крылья-щитки
    ctx.fillStyle = '#8a2f20';
    ctx.beginPath(); ctx.arc(-9, -7, 10, Math.PI, 0); ctx.fill();
    // колёса
    wheel(ctx, -9, -7, 7.4, wheelR);
    wheel(ctx, 10.4, -6, 11, wheelR);
    // таран-шипы
    ctx.fillStyle = '#8a8e94';
    ctx.beginPath(); ctx.moveTo(-18, -17); ctx.lineTo(-26.4, -13.4); ctx.lineTo(-18, -10.4); ctx.fill();
    oStroke(ctx, 1);
    ctx.fillStyle = '#b8bcc2';
    ctx.beginPath(); ctx.moveTo(-18, -16); ctx.lineTo(-23, -13.6); ctx.lineTo(-18, -12.4); ctx.fill();
  } else if (kind === 'hearse') {
    ctx.fillStyle = 'rgba(0,0,0,.28)';
    ctx.beginPath(); ctx.ellipse(0, 2, 23, 5.4, 0, 0, 7); ctx.fill();
    const bg = ctx.createLinearGradient(0, -24, 0, -6);
    bg.addColorStop(0, '#635472'); bg.addColorStop(.6, '#4a3e52'); bg.addColorStop(1, '#332a3c');
    ctx.fillStyle = bg;
    ctx.beginPath(); ctx.roundRect(-20, -22, 40, 16, 3); ctx.fill();
    oStroke(ctx, 1.4);
    ctx.fillStyle = '#5d4e66';
    ctx.beginPath(); ctx.moveTo(-21, -21); ctx.lineTo(-14, -31); ctx.lineTo(14, -31); ctx.lineTo(21, -21); ctx.closePath(); ctx.fill();
    oStroke(ctx, 1.2);
    // гроб сзади
    ctx.fillStyle = '#6e4a28';
    ctx.beginPath(); ctx.roundRect(-26, -19, 11, 8, 2); ctx.fill();
    oStroke(ctx, 1);
    ctx.fillStyle = '#8a6238'; ctx.fillRect(-25, -18, 9, 2);
    // зомби за рулём
    ctx.fillStyle = '#8ec45e';
    ctx.beginPath(); ctx.arc(13, -27, 5, 0, 7); ctx.fill();
    oStroke(ctx, 1);
    ctx.fillStyle = '#e8c81e'; ctx.beginPath(); ctx.arc(14.6, -27.6, 1.2, 0, 7); ctx.fill();
    // окно
    ctx.fillStyle = 'rgba(180,220,230,.35)';
    ctx.beginPath(); ctx.moveTo(-12, -29); ctx.lineTo(-4, -29); ctx.lineTo(-6, -22); ctx.lineTo(-13, -22); ctx.fill();
    // колёса
    wheel(ctx, -11, -6, 8.4, wheelR);
    wheel(ctx, 12, -6, 8.4, wheelR);
    // крест спереди
    ctx.strokeStyle = '#c8ccd2'; ctx.lineWidth = 3; ctx.lineCap = 'round';
    ctx.beginPath(); ctx.moveTo(-25, -12); ctx.lineTo(-30, -23); ctx.moveTo(-29, -20); ctx.lineTo(-26.4, -16); ctx.stroke();
  }

  function wheel(x, y, r, rot) {
    ctx.fillStyle = OUTLINE;
    ctx.beginPath(); ctx.arc(x, y, r + .8, 0, 7); ctx.fill();
    ctx.fillStyle = '#2e2a26';
    ctx.beginPath(); ctx.arc(x, y, r, 0, 7); ctx.fill();
    ctx.fillStyle = '#4a443e';
    ctx.beginPath(); ctx.arc(x, y, r * .55, 0, 7); ctx.fill();
    ctx.strokeStyle = '#5a544e'; ctx.lineWidth = 2;
    for (let i = 0; i < 4; i++) {
      const a = rot + i * Math.PI / 2;
      ctx.beginPath(); ctx.moveTo(x - Math.cos(a) * (r - 2), y - Math.sin(a) * (r - 2));
      ctx.lineTo(x + Math.cos(a) * (r - 2), y + Math.sin(a) * (r - 2)); ctx.stroke();
    }
  }
}


// ================= ЗАЩИТА =================
function drawTurret(ctx, d, x, y, side, t, hpFrac) {
  ctx.save(); ctx.translate(x, y);
  ctx.fillStyle = 'rgba(0,0,0,.22)';
  ctx.beginPath(); ctx.ellipse(0, 2, 12, 4, 0, 0, 7); ctx.fill();
  switch (d.id) {
    case 'h_beehive':
      ctx.strokeStyle = '#8a6a3e'; ctx.lineWidth = 4;
      ctx.beginPath(); ctx.moveTo(0, 0); ctx.lineTo(0, -22); ctx.stroke();
      ctx.fillStyle = '#e0a83e';
      ctx.beginPath(); ctx.ellipse(0, -28, 9, 11, 0, 0, 7); ctx.fill();
      ctx.strokeStyle = '#a87a1e'; ctx.lineWidth = 1.4;
      for (let i = 0; i < 3; i++) { ctx.beginPath(); ctx.ellipse(0, -28, 9 - i * 2.4, 11 - i * 3, 0, Math.PI, 0); ctx.stroke(); }
      for (let i = 0; i < 3; i++) {
        const a = t * 3 + i * 2.1, r = 14;
        ctx.fillStyle = '#3a2e14';
        ctx.beginPath(); ctx.arc(Math.cos(a) * r, -28 + Math.sin(a * 1.3) * 8, 1.8, 0, 7); ctx.fill();
      }
      break;
    case 'h_mg':
      ctx.fillStyle = '#9c8a5e';
      ctx.beginPath(); ctx.ellipse(-6, -5, 10, 6, 0, 0, 7); ctx.ellipse(7, -4, 9, 5, 0, 0, 7); ctx.fill();
      ctx.fillStyle = '#4a4e54'; ctx.fillRect(2, -14, 18, 4); ctx.fillRect(4, -11, 6, 7);
      ctx.fillStyle = '#6a6e74'; ctx.fillRect(16, -18, 5, 5);
      break;
    case 'h_scare':
      ctx.strokeStyle = '#8a6a3e'; ctx.lineWidth = 3;
      ctx.beginPath(); ctx.moveTo(0, 0); ctx.lineTo(0, -30); ctx.moveTo(-10, -22); ctx.lineTo(10, -22); ctx.stroke();
      ctx.fillStyle = '#b5903e'; ctx.fillRect(-6, -30, 12, 12);
      ctx.fillStyle = '#e8b88a'; ctx.beginPath(); ctx.arc(0, -34, 5, 0, 7); ctx.fill();
      ctx.fillStyle = '#e0c25e'; ctx.fillRect(-8, -40, 16, 4);
      ctx.fillStyle = '#ff4e2e'; ctx.beginPath(); ctx.arc(0, -34, 2 + Math.sin(t * 6) * 0.6, 0, 7); ctx.fill();
      break;
    case 'z_skull':
      ctx.strokeStyle = '#5a4a2e'; ctx.lineWidth = 4;
      ctx.beginPath(); ctx.moveTo(0, 0); ctx.lineTo(0, -26); ctx.stroke();
      ctx.fillStyle = '#d8d4c8';
      ctx.beginPath(); ctx.arc(0, -32, 8, 0, 7); ctx.fill();
      ctx.fillStyle = '#2a2a2a';
      ctx.beginPath(); ctx.arc(-3, -33, 2.2, 0, 7); ctx.arc(3, -33, 2.2, 0, 7); ctx.fill();
      ctx.fillStyle = '#ffd34e';
      ctx.globalAlpha = 0.5 + Math.sin(t * 5) * 0.4;
      ctx.beginPath(); ctx.arc(-3, -33, 1, 0, 7); ctx.arc(3, -33, 1, 0, 7); ctx.fill();
      ctx.globalAlpha = 1;
      ctx.fillStyle = '#b8b4a8';
      ctx.beginPath(); ctx.arc(-6, -22, 4, 0, 7); ctx.arc(6, -20, 4, 0, 7); ctx.arc(0, -15, 4.5, 0, 7); ctx.fill();
      break;
    case 'z_mosq':
      for (let i = 0; i < 9; i++) {
        const a = t * 5 + i * 0.7, r = 6 + (i % 3) * 4;
        ctx.fillStyle = '#3a3a3a';
        ctx.beginPath(); ctx.arc(Math.cos(a) * r, -14 + Math.sin(a * 1.7) * 9, 1.6, 0, 7); ctx.fill();
      }
      ctx.fillStyle = 'rgba(120,80,60,.25)';
      ctx.beginPath(); ctx.arc(0, -14, 16, 0, 7); ctx.fill();
      break;
  }
  ctx.restore();
}

function drawTrap(ctx, d, x, y, side, t, triggered) {
  ctx.save(); ctx.translate(x, y);
  switch (d.id) {
    case 'h_mine':
      ctx.fillStyle = '#5a5e64';
      ctx.beginPath(); ctx.ellipse(0, -3, 8, 4, 0, 0, 7); ctx.fill();
      ctx.strokeStyle = '#c8ccd2'; ctx.lineWidth = 1.4;
      ctx.beginPath(); ctx.moveTo(0, -6); ctx.lineTo(0, -11); ctx.stroke();
      ctx.fillStyle = (Math.sin(t * 6) > 0) ? '#ff4e2e' : '#7a2e1e';
      ctx.beginPath(); ctx.arc(0, -12, 1.6, 0, 7); ctx.fill();
      break;
    case 'h_trap':
      ctx.strokeStyle = '#7a7e84'; ctx.lineWidth = 2.4;
      ctx.beginPath(); ctx.arc(0, -2, 8, Math.PI, 0); ctx.stroke();
      for (let i = -2; i <= 2; i++) { ctx.beginPath(); ctx.moveTo(i * 3.4, -9); ctx.lineTo(i * 3.4, -13); ctx.stroke(); }
      break;
    case 'h_molotov':
      if (triggered) {
        ctx.fillStyle = `rgba(255,${150 + Math.sin(t * 20) * 50},40,.85)`;
        ctx.beginPath(); ctx.ellipse(0, -6, 11, 8 + Math.sin(t * 15) * 2, 0, 0, 7); ctx.fill();
      } else {
        ctx.fillStyle = '#a86a2e'; ctx.fillRect(-2, -12, 5, 9);
        ctx.fillStyle = '#e8dcc8'; ctx.beginPath(); ctx.arc(0, -13, 3.4, 0, 7); ctx.fill();
        ctx.strokeStyle = '#c46a3e'; ctx.lineWidth = 1.6;
        ctx.beginPath(); ctx.moveTo(-4, -18); ctx.lineTo(0, -16); ctx.lineTo(4, -19); ctx.stroke();
      }
      break;
    case 'z_bones':
      ctx.fillStyle = '#d8d4c8';
      for (let i = -1; i <= 1; i++) {
        ctx.beginPath(); ctx.moveTo(i * 6 - 2, 0); ctx.lineTo(i * 6, -11 - (i === 0 ? 3 : 0)); ctx.lineTo(i * 6 + 2, 0); ctx.fill();
      }
      ctx.fillStyle = '#c46a6a'; ctx.beginPath(); ctx.arc(0, -14, 2.4, 0, 7); ctx.fill();
      break;
    case 'z_claws':
      ctx.strokeStyle = '#8a8e94'; ctx.lineWidth = 2.6;
      for (let i = -1; i <= 1; i++) {
        ctx.beginPath(); ctx.arc(i * 6, -1, 5, Math.PI * 1.1, Math.PI * 1.9); ctx.stroke();
        ctx.beginPath(); ctx.moveTo(i * 6 - 4.4, -4.6); ctx.lineTo(i * 6 - 6.4, -8.6); ctx.stroke();
        ctx.beginPath(); ctx.moveTo(i * 6 + 4.4, -4.6); ctx.lineTo(i * 6 + 6.4, -8.6); ctx.stroke();
      }
      ctx.fillStyle = '#c46a6a'; ctx.beginPath(); ctx.arc(0, -6, 1.8, 0, 7); ctx.fill();
      break;
    case 'z_press':
      ctx.fillStyle = '#3a3a42';
      ctx.beginPath(); ctx.roundRect(-8, -16, 16, 14, 3); ctx.fill();
      ctx.fillRect(-3, -21, 6, 6);
      ctx.fillStyle = '#ffd34e'; ctx.font = 'bold 8px sans-serif'; ctx.textAlign = 'center'; ctx.fillText('16', 0, -7);
      break;
    case 'z_mine':
      ctx.fillStyle = '#8b8b86';
      ctx.beginPath(); ctx.moveTo(-7, 0); ctx.lineTo(-7, -10); ctx.arc(0, -10, 7, Math.PI, 0); ctx.lineTo(7, 0); ctx.fill();
      ctx.fillStyle = (Math.sin(t * 7) > 0) ? '#7ec850' : '#3e6a2e';
      ctx.beginPath(); ctx.arc(0, -13, 2, 0, 7); ctx.fill();
      break;
  }
  ctx.restore();
}

// ================= ПОРТРЕТЫ =================
function renderUnitPortrait(canvas, side, spec) {
  const c = canvas.getContext('2d');
  c.clearRect(0, 0, canvas.width, canvas.height);
  c.save();
  c.translate(canvas.width / 2, canvas.height - 3);
  const L = LOOK[spec.id];
  const scale = spec.veh ? 0.8 : L?.big ? 0.74 : L?.small ? 1.02 : 0.94;
  c.scale(scale, scale);
  if (spec.veh || L) {
    const fake = { id: spec.id, x: 0, y: 0, dir: 1, state: 'walk', atkT: 0, seed: 2, deadT: 1 };
    if (spec.veh) drawVehicle(c, spec.veh, 0, fake);
    else drawHumanoid(c, L, 0, fake);
  }
  c.restore();
}

function renderDefPortrait(canvas, side, spec) {
  const c = canvas.getContext('2d');
  c.clearRect(0, 0, canvas.width, canvas.height);
  c.save();
  c.translate(canvas.width / 2, canvas.height - 3);
  drawTrap(c, spec, 0, 0, side, 1.2, spec.id === 'h_molotov');
  c.restore();
}

// ================= ХАБ «АРЕНА» =================
const HUB_SPOTS = {
  arena:     { x: 415, y: 285, w: 130, h: 155, label: 'АРЕНА' },
  campaign:  { x: 755, y: 405, w: 175, h: 180, label: 'КАМПАНИЯ' },
  shop:      { x: 235, y: 450, w: 195, h: 130, label: 'МАГАЗИН' },
  architect: { x: 600, y: 410, w: 165, h: 125, label: 'АРХИТЕКТОР' },
  skills:    { x: 850, y: 285, w: 110, h: 145, label: 'НАВЫКИ' },
  artifacts: { x: 40,  y: 250, w: 170, h: 175, label: 'АРТЕФАКТЫ' },
  spitki:    { x: 55,  y: 425, w: 145, h: 155, label: 'БОЙ НА СПИТКИ' },
};

function drawHubScene(ctx, t) {
  const flick = Math.sin(t * 2) * 0.5 + 0.5;
  // ночное небо
  let g = ctx.createLinearGradient(0, 0, 0, H);
  g.addColorStop(0, '#241e2c'); g.addColorStop(.5, '#43333a'); g.addColorStop(1, '#57443c');
  ctx.fillStyle = g; ctx.fillRect(0, 0, W, H);
  // луна
  ctx.fillStyle = 'rgba(232,224,200,.12)';
  ctx.beginPath(); ctx.arc(838, 96, 52, 0, 7); ctx.fill();
  ctx.fillStyle = '#e8e0c4';
  ctx.beginPath(); ctx.arc(838, 96, 30, 0, 7); ctx.fill();
  ctx.fillStyle = 'rgba(180,170,140,.5)';
  ctx.beginPath(); ctx.arc(828, 90, 6, 0, 7); ctx.arc(848, 104, 4, 0, 7); ctx.fill();
  // звёзды
  const rnd = mulberry32(5);
  ctx.fillStyle = 'rgba(255,255,240,.7)';
  for (let i = 0; i < 40; i++) {
    const x = rnd() * W, y = rnd() * 190, s = rnd() * 1.6;
    ctx.globalAlpha = 0.3 + Math.abs(Math.sin(t * (1 + s) + i)) * 0.6;
    ctx.fillRect(x, y, s, s);
  }
  ctx.globalAlpha = 1;
  // стая мышей
  ctx.fillStyle = '#1a141e';
  for (let i = 0; i < 3; i++) {
    const bx = (t * 22 + i * 160) % (W + 120) - 60, by = 70 + Math.sin(t * 3 + i * 2) * 12 + i * 26;
    const flap = Math.sin(t * 14 + i) * 6;
    ctx.beginPath();
    ctx.moveTo(bx, by);
    ctx.quadraticCurveTo(bx - 10, by - 6 - flap, bx - 18, by - 2);
    ctx.quadraticCurveTo(bx - 10, by + 2, bx, by);
    ctx.quadraticCurveTo(bx + 10, by + 2, bx + 18, by - 2);
    ctx.quadraticCurveTo(bx + 10, by - 6 - flap, bx, by);
    ctx.fill();
  }
  // мёртвый лес по краям
  drawDeadTree(ctx, 30, 200, 1.9); drawDeadTree(ctx, 920, 190, 1.8); drawDeadTree(ctx, 130, 170, 1.2);
  // земля
  g = ctx.createLinearGradient(0, 470, 0, H);
  g.addColorStop(0, '#3a3428'); g.addColorStop(1, '#26221a');
  ctx.fillStyle = g; ctx.fillRect(0, 460, W, H - 460);
  // брусчатка к склепу
  const rnd2 = mulberry32(9);
  for (let i = 0; i < 46; i++) {
    const yy = 474 + rnd2() * 118, spread = 26 + (yy - 474) * 0.55;
    const xx = 480 + (rnd2() - .5) * spread * 2;
    const sh = 70 + rnd2() * 26;
    ctx.fillStyle = `rgba(${sh},${sh - 4},${sh - 12},.9)`;
    ctx.beginPath(); ctx.ellipse(xx, yy, 8 + rnd2() * 6, 4.4 + rnd2() * 2.6, (rnd2() - .5) * 0.8, 0, 7); ctx.fill();
    ctx.fillStyle = 'rgba(255,255,255,.06)';
    ctx.beginPath(); ctx.ellipse(xx - 2, yy - 1.6, 4 + rnd2() * 3, 2, 0, 0, 7); ctx.fill();
  }

  // ===== СКЛЕП АРЕНЫ =====
  // ступени
  ctx.fillStyle = '#6a6558'; ctx.fillRect(300, 428, 360, 16);
  ctx.fillStyle = '#7c766a'; ctx.fillRect(312, 414, 336, 14);
  // задняя стена
  g = ctx.createLinearGradient(0, 180, 0, 430);
  g.addColorStop(0, '#8d887a'); g.addColorStop(1, '#6a655a');
  ctx.fillStyle = g;
  ctx.beginPath(); ctx.roundRect(330, 190, 300, 226, 4); ctx.fill();
  // фронтон
  ctx.fillStyle = '#847e70';
  ctx.beginPath(); ctx.moveTo(300, 196); ctx.lineTo(480, 112); ctx.lineTo(660, 196); ctx.closePath(); ctx.fill();
  ctx.fillStyle = '#5f5a4e';
  ctx.beginPath(); ctx.moveTo(300, 196); ctx.lineTo(480, 112); ctx.lineTo(480, 120); ctx.lineTo(316, 196); ctx.closePath(); ctx.fill();
  // карниз
  ctx.fillStyle = '#9a9484'; ctx.fillRect(296, 190, 368, 12);
  ctx.fillStyle = '#565246'; ctx.fillRect(296, 200, 368, 4);
  // круглое окно с крестом
  ctx.fillStyle = '#2c2824';
  ctx.beginPath(); ctx.arc(480, 160, 22, 0, 7); ctx.fill();
  ctx.strokeStyle = '#55503f'; ctx.lineWidth = 4;
  ctx.beginPath(); ctx.moveTo(480, 142); ctx.lineTo(480, 178); ctx.moveTo(462, 160); ctx.lineTo(498, 160); ctx.stroke();
  // табличка АРЕНА
  ctx.fillStyle = '#a49e8c';
  ctx.beginPath(); ctx.roundRect(408, 226, 144, 44, 6); ctx.fill();
  ctx.strokeStyle = '#4e4a3e'; ctx.lineWidth = 3; ctx.stroke();
  ctx.fillStyle = '#3a3630';
  ctx.font = 'bold 26px Georgia';
  ctx.textAlign = 'center';
  ctx.fillText('АРЕНА', 480, 258);
  for (const rx of [416, 480, 544]) { ctx.fillStyle = '#5a5548'; ctx.beginPath(); ctx.arc(rx, 234, 3, 0, 7); ctx.fill(); }
  // арочный вход с решёткой
  ctx.fillStyle = '#14100e';
  ctx.beginPath();
  ctx.moveTo(420, 416);
  ctx.lineTo(420, 320);
  ctx.arc(480, 320, 60, Math.PI, 0);
  ctx.lineTo(540, 416);
  ctx.fill();
  ctx.fillStyle = `rgba(140,30,20,${0.12 + flick * 0.08})`;
  ctx.beginPath();
  ctx.moveTo(430, 416);
  ctx.lineTo(430, 324);
  ctx.arc(480, 324, 50, Math.PI, 0);
  ctx.lineTo(530, 416);
  ctx.fill();
  ctx.strokeStyle = '#3a3630'; ctx.lineWidth = 5;
  for (let i = 0; i < 5; i++) {
    ctx.beginPath();
    ctx.moveTo(438 + i * 21, 416);
    ctx.lineTo(438 + i * 21, 316 - Math.abs(i - 2) * -8 + Math.abs(i - 2) * 8);
    ctx.stroke();
  }
  // колонны и атланты
  for (const cx of [344, 616]) {
    ctx.fillStyle = '#787364';
    ctx.fillRect(cx - 11, 208, 22, 208);
    ctx.fillStyle = 'rgba(0,0,0,.18)';
    ctx.fillRect(cx + 3, 208, 8, 208);
    ctx.fillStyle = '#8d8878';
    ctx.fillRect(cx - 16, 200, 32, 10);
    ctx.fillRect(cx - 16, 412, 32, 8);
    // атлант: фигура с поднятыми руками
    ctx.fillStyle = '#9a9484';
    ctx.beginPath(); ctx.arc(cx, 226, 11, 0, 7); ctx.fill();
    ctx.beginPath(); ctx.roundRect(cx - 10, 234, 20, 40, 6); ctx.fill();
    ctx.strokeStyle = '#9a9484'; ctx.lineWidth = 7; ctx.lineCap = 'round';
    ctx.beginPath();
    ctx.moveTo(cx - 6, 240); ctx.lineTo(cx - 18, 210);
    ctx.moveTo(cx + 6, 240); ctx.lineTo(cx + 18, 210);
    ctx.stroke();
    ctx.strokeStyle = '#6a6558'; ctx.lineWidth = 1.4;
    ctx.beginPath(); ctx.moveTo(cx - 5, 234); ctx.lineTo(cx + 5, 234); ctx.stroke();
  }
  // скелет справа
  ctx.save(); ctx.translate(596, 350); ctx.rotate(0.12);
  ctx.strokeStyle = '#cfc9b8'; ctx.lineWidth = 3; ctx.lineCap = 'round';
  ctx.beginPath();
  ctx.moveTo(0, 0); ctx.lineTo(0, -34);
  ctx.moveTo(0, -34); ctx.lineTo(-8, -18); ctx.moveTo(0, -34); ctx.lineTo(9, -16);
  ctx.moveTo(0, 0); ctx.lineTo(-7, 16); ctx.moveTo(0, 0); ctx.lineTo(8, 17);
  ctx.stroke();
  ctx.fillStyle = '#cfc9b8';
  ctx.beginPath(); ctx.arc(0, -42, 7, 0, 7); ctx.fill();
  ctx.fillStyle = '#14100e';
  ctx.beginPath(); ctx.arc(-2.4, -43, 2, 0, 7); ctx.arc(2.6, -43, 2, 0, 7); ctx.fill();
  ctx.restore();
  // сова на фронтоне
  const owly = 104 + Math.sin(t * 1.6) * 2;
  ctx.fillStyle = '#b89a4e';
  ctx.beginPath(); ctx.ellipse(480, owly + 8, 12, 10, 0, 0, 7); ctx.fill();
  ctx.beginPath(); ctx.ellipse(480 - 16, owly + 4, 13, 5, -0.5, 0, 7); ctx.ellipse(480 + 16, owly + 4, 13, 5, 0.5, 0, 7); ctx.fill();
  ctx.beginPath(); ctx.arc(480, owly - 4, 8, 0, 7); ctx.fill();
  ctx.beginPath(); ctx.moveTo(474, owly - 10); ctx.lineTo(476, owly - 16); ctx.lineTo(479, owly - 10); ctx.fill();
  ctx.beginPath(); ctx.moveTo(486, owly - 10); ctx.lineTo(484, owly - 16); ctx.lineTo(481, owly - 10); ctx.fill();
  ctx.fillStyle = '#e8e0c0';
  ctx.beginPath(); ctx.arc(477, owly - 5, 2.6, 0, 7); ctx.arc(483, owly - 5, 2.6, 0, 7); ctx.fill();
  ctx.fillStyle = '#14100e';
  ctx.beginPath(); ctx.arc(477, owly - 5, 1.2, 0, 7); ctx.arc(483, owly - 5, 1.2, 0, 7); ctx.fill();
  ctx.fillStyle = '#e0a83e';
  ctx.beginPath(); ctx.moveTo(478.5, owly - 2); ctx.lineTo(481.5, owly - 2); ctx.lineTo(480, owly + 2); ctx.fill();

  // ===== РЕКВИЗИТ =====
  // АРТЕФАКТЫ: меч в камне + вывеска
  ctx.fillStyle = '#3e3428';
  ctx.beginPath(); ctx.roundRect(52, 262, 152, 26, 4); ctx.fill();
  ctx.fillStyle = '#c8a84e'; ctx.font = 'bold 15px Georgia'; ctx.fillText('АРТЕФАКТЫ', 128, 281);
  ctx.save(); ctx.translate(120, 420); ctx.rotate(-0.5);
  ctx.fillStyle = '#c8ccd2';
  ctx.beginPath(); ctx.moveTo(-5, 0); ctx.lineTo(0, -86); ctx.lineTo(5, 0); ctx.fill();
  ctx.fillStyle = '#8a6a1e'; ctx.fillRect(-16, -4, 32, 8);
  ctx.fillRect(-3, 4, 6, 18);
  ctx.fillStyle = '#c43a2e'; ctx.beginPath(); ctx.arc(0, 24, 4, 0, 7); ctx.fill();
  ctx.restore();
  // БОЙ НА СПИТКИ: череп на колонне
  ctx.fillStyle = '#8d8878'; ctx.fillRect(88, 480, 60, 110);
  ctx.fillStyle = '#6a655a'; ctx.fillRect(82, 472, 72, 12); ctx.fillRect(82, 578, 72, 10);
  for (let i = 0; i < 4; i++) { ctx.fillStyle = 'rgba(0,0,0,.15)'; ctx.fillRect(96 + i * 12, 480, 4, 100); }
  drawSkullPile(ctx, 118, 452);
  ctx.fillStyle = '#3e3428';
  ctx.beginPath(); ctx.roundRect(52, 498, 134, 24, 4); ctx.fill();
  ctx.fillStyle = '#c8a84e'; ctx.font = 'bold 12px Georgia'; ctx.fillText('БОЙ НА СПИТКИ', 119, 515);
  // МАГАЗИН: сундук
  ctx.save(); ctx.translate(330, 540);
  ctx.fillStyle = '#7a5230'; ctx.fillRect(-80, -34, 160, 56);
  ctx.fillStyle = '#5d3e22'; ctx.fillRect(-80, -34, 160, 8);
  ctx.fillStyle = '#8a6238';
  ctx.beginPath(); ctx.moveTo(-80, -34); ctx.quadraticCurveTo(0, -96, 80, -34); ctx.lineTo(80, -26); ctx.quadraticCurveTo(0, -86, -80, -26); ctx.fill();
  // сокровища
  for (let i = 0; i < 14; i++) {
    ctx.fillStyle = i % 3 ? '#ffd75e' : '#e8b83e';
    ctx.beginPath(); ctx.arc(-60 + (i * 37 % 120), -36 - (i % 3) * 6, 7, 0, 7); ctx.fill();
    ctx.strokeStyle = '#a87a1e'; ctx.lineWidth = 1; ctx.stroke();
  }
  ctx.fillStyle = '#c43a2e'; ctx.beginPath(); ctx.arc(30, -42, 7, 0, 7); ctx.fill();
  ctx.fillStyle = '#4a7ac4'; ctx.beginPath(); ctx.arc(52, -44, 6, 0, 7); ctx.fill();
  ctx.fillStyle = '#3a5a8a'; ctx.fillRect(49, -40, 6, 10);
  ctx.fillStyle = '#3e2c18'; ctx.fillRect(-12, -14, 24, 24);
  ctx.fillStyle = '#c8a84e'; ctx.beginPath(); ctx.arc(0, -2, 6, 0, 7); ctx.fill();
  ctx.restore();
  ctx.fillStyle = '#3e2c18';
  ctx.beginPath(); ctx.roundRect(262, 520, 136, 24, 4); ctx.fill();
  ctx.fillStyle = '#ffd75e'; ctx.font = 'bold 16px Georgia'; ctx.fillText('МАГАЗИН', 330, 538);
  // АРХИТЕКТОР: школьная доска
  ctx.save(); ctx.translate(682, 480);
  ctx.strokeStyle = '#5d4a2e'; ctx.lineWidth = 6;
  ctx.strokeRect(-78, -56, 156, 100);
  ctx.fillStyle = '#2c3430'; ctx.fillRect(-74, -52, 148, 92);
  ctx.strokeStyle = '#d8d4c8'; ctx.lineWidth = 1.6;
  ctx.strokeRect(-40, -34, 80, 52);
  ctx.fillStyle = '#aab4bc'; ctx.fillRect(-30, -14, 60, 32);
  for (const dx of [-24, 0, 24]) { ctx.fillStyle = '#8d97a0'; ctx.beginPath(); ctx.ellipse(dx, -22, 8, 18, 0, Math.PI, 0); ctx.fill(); }
  ctx.setLineDash([4, 4]);
  ctx.beginPath(); ctx.moveTo(-52, -6); ctx.lineTo(52, -6); ctx.stroke();
  ctx.setLineDash([]);
  ctx.strokeStyle = '#5d4a2e'; ctx.lineWidth = 5;
  ctx.beginPath(); ctx.moveTo(-60, 44); ctx.lineTo(-40, 78); ctx.moveTo(60, 44); ctx.lineTo(40, 78); ctx.stroke();
  ctx.restore();
  ctx.fillStyle = '#2c2824';
  ctx.beginPath(); ctx.roundRect(612, 508, 140, 24, 4); ctx.fill();
  ctx.fillStyle = '#d8d4c8'; ctx.font = 'bold 14px Georgia'; ctx.fillText('АРХИТЕКТОР', 682, 525);
  // КАМПАНИЯ: надгробие
  ctx.fillStyle = '#8b8578';
  ctx.beginPath();
  ctx.moveTo(775, 590);
  ctx.lineTo(775, 462);
  ctx.arc(852, 462, 77, Math.PI, 0);
  ctx.lineTo(929, 590);
  ctx.fill();
  ctx.fillStyle = 'rgba(0,0,0,.18)';
  ctx.beginPath(); ctx.ellipse(852, 470, 70, 60, 0, Math.PI * 1.05, Math.PI * 1.95); ctx.fill();
  ctx.fillStyle = '#4e4a40';
  ctx.font = 'bold 21px Georgia';
  ctx.fillText('КАМПАНИЯ', 850, 498);
  ctx.strokeStyle = '#5a5648'; ctx.lineWidth = 2;
  ctx.beginPath(); ctx.moveTo(800, 520); ctx.quadraticCurveTo(852, 512, 905, 522); ctx.stroke();
  ctx.fillStyle = 'rgba(90,120,60,.5)';
  ctx.beginPath(); ctx.ellipse(800, 448, 14, 8, 0.6, 0, 7); ctx.ellipse(905, 470, 12, 7, -0.5, 0, 7); ctx.fill();
  // НАВЫКИ: мишень
  ctx.fillStyle = '#e8e0d0';
  ctx.beginPath(); ctx.arc(905, 345, 44, 0, 7); ctx.fill();
  ctx.fillStyle = '#1a1618';
  ctx.beginPath(); ctx.arc(905, 345, 33, 0, 7); ctx.fill();
  ctx.fillStyle = '#e8e0d0';
  ctx.beginPath(); ctx.arc(905, 345, 22, 0, 7); ctx.fill();
  ctx.fillStyle = '#c43a2e';
  ctx.beginPath(); ctx.arc(905, 345, 11, 0, 7); ctx.fill();
  // дротик
  ctx.save(); ctx.translate(905, 345); ctx.rotate(-0.7);
  ctx.strokeStyle = '#3e3428'; ctx.lineWidth = 3;
  ctx.beginPath(); ctx.moveTo(0, 8); ctx.lineTo(0, -52); ctx.stroke();
  ctx.fillStyle = '#c8ccd2';
  ctx.beginPath(); ctx.moveTo(0, -52); ctx.lineTo(-4, -60); ctx.lineTo(4, -60); ctx.fill();
  ctx.restore();
  ctx.fillStyle = '#3e3428';
  ctx.beginPath(); ctx.roundRect(852, 396, 106, 24, 4); ctx.fill();
  ctx.fillStyle = '#c8a84e'; ctx.font = 'bold 14px Georgia'; ctx.fillText('НАВЫКИ', 905, 413);
  // АРТЕФАКТЫ вывеска уже есть

  // виньетка
  g = ctx.createRadialGradient(480, 300, 260, 480, 300, 640);
  g.addColorStop(0, 'rgba(0,0,0,0)'); g.addColorStop(1, 'rgba(10,6,14,.55)');
  ctx.fillStyle = g; ctx.fillRect(0, 0, W, H);
}

// ================= КАРТА КАМПАНИИ =================
const MAP_NODES = [
  { x: 150, y: 492, dy: 26 }, { x: 272, y: 412, dy: -24 }, { x: 424, y: 318, dy: -24 },
  { x: 560, y: 372, dy: 26 }, { x: 694, y: 298, dy: -24 }, { x: 806, y: 218, dy: -24 },
  { x: 872, y: 342, dy: 30 },
];

function drawCampaignMap(ctx, side, unlocked, t) {
  // тёмный фон-камень
  ctx.fillStyle = '#3e3c3a'; ctx.fillRect(0, 0, W, H);
  const rndn = mulberry32(31);
  ctx.fillStyle = 'rgba(255,255,255,.04)';
  for (let i = 0; i < 40; i++) { ctx.fillRect(rndn() * W, rndn() * H, rndn() * 30, rndn() * 6); }
  // металлическая рама
  let g = ctx.createLinearGradient(0, 30, 0, 590);
  g.addColorStop(0, '#a8a49c'); g.addColorStop(.5, '#8d8981'); g.addColorStop(1, '#75716a');
  ctx.fillStyle = g;
  ctx.beginPath(); ctx.roundRect(24, 34, 912, 548, 26); ctx.fill();
  ctx.strokeStyle = '#565248'; ctx.lineWidth = 4; ctx.stroke();
  ctx.fillStyle = 'rgba(0,0,0,.12)';
  ctx.beginPath(); ctx.roundRect(24, 34, 912, 548, 26); ctx.fill();
  // заклёпки
  ctx.fillStyle = '#6a665c';
  for (const [sx, sy] of [[52, 62], [908, 62], [52, 556], [908, 556]]) {
    ctx.beginPath(); ctx.arc(sx, sy, 6, 0, 7); ctx.fill();
    ctx.fillStyle = '#b8b4a8'; ctx.beginPath(); ctx.arc(sx - 1.6, sy - 1.6, 2.4, 0, 7); ctx.fill(); ctx.fillStyle = '#6a665c';
  }

  // пергамент
  g = ctx.createLinearGradient(0, 110, 0, 556);
  g.addColorStop(0, '#ecd8a8'); g.addColorStop(.6, '#e0c890'); g.addColorStop(1, '#d0b478');
  ctx.fillStyle = g;
  ctx.beginPath();
  ctx.moveTo(100, 116);
  ctx.quadraticCurveTo(480, 96, 860, 116);
  ctx.quadraticCurveTo(878, 330, 860, 548);
  ctx.quadraticCurveTo(480, 566, 100, 548);
  ctx.quadraticCurveTo(82, 330, 100, 116);
  ctx.fill();
  // пятна старины
  const rndp = mulberry32(13);
  for (let i = 0; i < 26; i++) {
    ctx.fillStyle = `rgba(150,116,60,${0.06 + rndp() * 0.1})`;
    ctx.beginPath(); ctx.ellipse(120 + rndp() * 720, 140 + rndp() * 390, 10 + rndp() * 46, 8 + rndp() * 22, rndp() * 3, 0, 7); ctx.fill();
  }
  // свитки-валики
  for (const sy of [96, 556]) {
    g = ctx.createLinearGradient(0, sy - 18, 0, sy + 18);
    g.addColorStop(0, '#b8b2a4'); g.addColorStop(.5, '#8d897c'); g.addColorStop(1, '#6a665a');
    ctx.fillStyle = g;
    ctx.beginPath(); ctx.roundRect(58, sy - 18, 844, 36, 17); ctx.fill();
    ctx.fillStyle = '#565248';
    for (const kx of [62, 898]) { ctx.beginPath(); ctx.arc(kx, sy, 9, 0, 7); ctx.fill(); }
  }

  // маршрут
  const col = side === 'zombie' ? '#c43a2e' : '#5e9a3e';
  ctx.fillStyle = col;
  for (let i = 0; i < MAP_NODES.length - 1; i++) {
    const a = MAP_NODES[i], b = MAP_NODES[i + 1];
    const steps = 14;
    for (let s = 1; s < steps; s++) {
      const px = a.x + (b.x - a.x) * s / steps + Math.sin(s * 1.7 + i) * 4;
      const py = a.y + (b.y - a.y) * s / steps + Math.cos(s * 1.3 + i) * 4;
      ctx.beginPath(); ctx.arc(px, py, 3.4, 0, 7); ctx.fill();
    }
  }
  // узлы
  ctx.textAlign = 'center';
  const names = CAMPAIGNS[side].map(m => m.name);
  MAP_NODES.forEach((n, i) => {
    if (i < unlocked) {
      // пройдено
      ctx.fillStyle = side === 'zombie' ? '#8a241c' : '#3e6a24';
      ctx.beginPath(); ctx.arc(n.x, n.y, 15, 0, 7); ctx.fill();
      ctx.strokeStyle = '#4e3a1e'; ctx.lineWidth = 3; ctx.stroke();
      ctx.fillStyle = '#ecd8a8'; ctx.font = 'bold 13px Georgia';
      ctx.fillText('✓', n.x, n.y + 5);
    } else if (i === unlocked) {
      // текущая: пульсирует
      const pulse = 15 + Math.sin(t * 5) * 3;
      ctx.fillStyle = '#3e3428';
      ctx.beginPath(); ctx.arc(n.x, n.y, pulse, 0, 7); ctx.fill();
      ctx.strokeStyle = '#ffd75e'; ctx.lineWidth = 3.4; ctx.stroke();
      ctx.fillStyle = '#ecd8a8'; ctx.font = 'bold 12px Georgia';
      ctx.fillText('▶', n.x, n.y + 4);
    } else {
      // замок
      ctx.fillStyle = '#8d8981';
      ctx.beginPath(); ctx.arc(n.x, n.y + 4, 13, 0, 7); ctx.fill();
      ctx.strokeStyle = '#565248'; ctx.lineWidth = 2.6;
      ctx.beginPath(); ctx.arc(n.x, n.y - 1, 7, Math.PI, 0); ctx.stroke();
      ctx.fillStyle = '#4a463c';
      ctx.beginPath(); ctx.arc(n.x, n.y + 4, 3.4, 0, 7); ctx.fill();
      ctx.fillRect(n.x - 1.6, n.y + 4, 3.2, 6);
    }
    ctx.fillStyle = '#5d431e';
    ctx.font = 'bold 13px Georgia';
    ctx.fillText(names[i], n.x, n.y + n.dy);
  });
  // иллюстрации локаций (сепийные силуэты)
  const doodles = [[340, 440], [470, 240], [640, 430], [250, 300], [760, 420]];
  ctx.strokeStyle = 'rgba(140,104,48,.55)'; ctx.fillStyle = 'rgba(140,104,48,.35)';
  ctx.lineWidth = 2;
  // домик
  ctx.strokeRect(320, 428, 44, 26);
  ctx.beginPath(); ctx.moveTo(314, 428); ctx.lineTo(342, 410); ctx.lineTo(370, 428); ctx.stroke();
  // башня
  ctx.strokeRect(462, 208, 18, 44);
  ctx.beginPath(); ctx.moveTo(458, 208); ctx.lineTo(484, 208); ctx.stroke();
  // амбар
  ctx.strokeRect(622, 424, 40, 24);
  ctx.beginPath(); ctx.moveTo(616, 424); ctx.lineTo(642, 408); ctx.lineTo(668, 424); ctx.stroke();
  // могилки
  for (const [mx, my] of [[238, 296], [258, 302]]) {
    ctx.beginPath(); ctx.arc(mx, my, 5, Math.PI, 0); ctx.stroke();
    ctx.beginPath(); ctx.moveTo(mx - 5, my); ctx.lineTo(mx + 5, my); ctx.stroke();
  }
  // болотце
  ctx.beginPath(); ctx.ellipse(756, 424, 20, 7, 0, 0, 7); ctx.stroke();

  // ВЫБОР РАСЫ: две монеты-аватара
  ctx.fillStyle = '#5d431e';
  ctx.font = 'bold 15px Georgia';
  ctx.textAlign = 'left';
  ctx.fillText('ВЫБОР РАСЫ:', 122, 172);
  drawRaceCoin(ctx, 148, 214, 'human', side === 'human', t);
  drawRaceCoin(ctx, 236, 214, 'zombie', side === 'zombie', t);
  // рожицы-дудлы по углам
  drawDoodleFace(ctx, 838, 168, side === 'human' ? 'zombie' : 'human');
  drawDoodleFace(ctx, 420, 540, side);
  // компас
  ctx.save(); ctx.translate(812, 498);
  ctx.strokeStyle = '#8a6a2e'; ctx.lineWidth = 2;
  ctx.beginPath(); ctx.arc(0, 0, 24, 0, 7); ctx.stroke();
  for (let i = 0; i < 8; i++) {
    const a = i * Math.PI / 4;
    const r1 = i % 2 ? 10 : 20;
    ctx.beginPath(); ctx.moveTo(Math.cos(a) * r1, Math.sin(a) * r1); ctx.lineTo(Math.cos(a) * 24, Math.sin(a) * 24); ctx.stroke();
  }
  ctx.fillStyle = '#8a6a2e'; ctx.font = 'bold 10px Georgia'; ctx.textAlign = 'center';
  ctx.fillText('N', 0, -28);
  ctx.restore();
}

function drawRaceCoin(ctx, x, y, race, active, t) {
  const r = 27 + (active ? Math.sin(t * 4) * 1.6 : 0);
  ctx.fillStyle = race === 'human' ? '#b8531e' : '#3e6a24';
  ctx.beginPath(); ctx.arc(x, y, r, 0, 7); ctx.fill();
  ctx.strokeStyle = active ? '#ffd75e' : '#3a2c14'; ctx.lineWidth = active ? 3.4 : 2.4; ctx.stroke();
  ctx.save();
  ctx.beginPath(); ctx.arc(x, y, r - 6, 0, 7); ctx.clip();
  if (race === 'human') {
    ctx.fillStyle = '#e0aa80'; ctx.beginPath(); ctx.arc(x, y + 4, 15, 0, 7); ctx.fill();
    ctx.fillStyle = '#e0c25e';
    ctx.beginPath(); ctx.ellipse(x, y - 8, 19, 5, 0, 0, 7); ctx.fill();
    ctx.beginPath(); ctx.arc(x, y - 11, 10, Math.PI, 0); ctx.fill();
    ctx.fillStyle = '#222'; ctx.beginPath(); ctx.arc(x + 5, y + 1, 1.8, 0, 7); ctx.fill();
    ctx.strokeStyle = '#8a5a34'; ctx.lineWidth = 1.6;
    ctx.beginPath(); ctx.moveTo(x + 1, y + 10); ctx.quadraticCurveTo(x + 6, y + 12, x + 11, y + 9); ctx.stroke();
  } else {
    ctx.fillStyle = '#8ec45e'; ctx.beginPath(); ctx.arc(x, y + 4, 15, 0, 7); ctx.fill();
    ctx.fillStyle = '#222'; ctx.beginPath(); ctx.arc(x + 5, y, 2, 0, 7); ctx.fill();
    ctx.fillStyle = '#ffd34e'; ctx.beginPath(); ctx.arc(x + 5, y, 1, 0, 7); ctx.fill();
    ctx.fillStyle = '#c46a6a'; ctx.fillRect(x + 3, y + 8, 5, 2);
    ctx.fillStyle = 'rgba(60,80,40,.6)';
    ctx.beginPath(); ctx.arc(x - 6, y - 4, 2.4, 0, 7); ctx.fill();
  }
  ctx.restore();
}

function drawDoodleFace(ctx, x, y, race) {
  ctx.save();
  ctx.strokeStyle = 'rgba(120,88,40,.7)'; ctx.lineWidth = 2;
  ctx.fillStyle = 'rgba(120,88,40,.12)';
  ctx.beginPath(); ctx.arc(x, y, 16, 0, 7); ctx.fill(); ctx.stroke();
  if (race === 'zombie') {
    ctx.beginPath(); ctx.arc(x - 4, y - 3, 2, 0, 7); ctx.arc(x + 5, y - 2, 2.4, 0, 7); ctx.stroke();
    ctx.beginPath(); ctx.moveTo(x - 6, y + 6); ctx.lineTo(x + 7, y + 6); ctx.stroke();
    for (let i = 0; i < 3; i++) { ctx.beginPath(); ctx.moveTo(x - 5 + i * 5, y + 6); ctx.lineTo(x - 5 + i * 5, y + 9); ctx.stroke(); }
  } else {
    ctx.beginPath(); ctx.arc(x - 4, y - 3, 1.6, 0, 7); ctx.arc(x + 5, y - 3, 1.6, 0, 7); ctx.stroke();
    ctx.beginPath(); ctx.arc(x, y + 3, 6, 0.2, Math.PI - 0.2); ctx.stroke();
    ctx.beginPath(); ctx.moveTo(x - 10, y - 8); ctx.quadraticCurveTo(x, y - 16, x + 10, y - 8); ctx.stroke();
  }
  ctx.restore();
}
