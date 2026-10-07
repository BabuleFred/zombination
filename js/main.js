// ===== Зомбинация: экраны, рендер, HUD =====

const cvs = document.getElementById('field');
const ctx = cvs.getContext('2d');
const $ = id => document.getElementById(id);

let SCREEN = 'hub';          // hub | campaign | battle
let campSide = 'zombie';     // раса на карте кампании
let hoverNode = -1;
let selectedDiff = 'normal';
let arenaSide = 'zombie';
const cardRefs = { units: [], defs: [] };

// ---------- прогресс кампании ----------
function loadProgress() {
  try { return JSON.parse(localStorage.getItem('zomb_progress')) || { zombie: 0, human: 0 }; }
  catch (e) { return { zombie: 0, human: 0 }; }
}
function saveProgress(p) { localStorage.setItem('zomb_progress', JSON.stringify(p)); }
let PROGRESS = loadProgress();

// ---------- масштабирование ----------
function fit() {
  const s = Math.min(window.innerWidth / 960, window.innerHeight / 600);
  document.getElementById('stage').style.transform = `translate(-50%,-50%) scale(${s})`;
}
window.addEventListener('resize', fit);
fit();

function toast(text) {
  const t = $('toast');
  t.textContent = text;
  t.classList.remove('hidden');
  clearTimeout(t._tm);
  t._tm = setTimeout(() => t.classList.add('hidden'), 1800);
}

// ================= ХАБ =================
function enterHub() {
  SCREEN = 'hub';
  GAME.state = 'menu';
  $('hub').classList.remove('hidden');
  $('campaign').classList.add('hidden');
  $('bottombar').classList.add('hidden');
  $('chat').classList.add('hidden');
  $('hpLfill').style.width = '100%'; $('hpRfill').style.width = '100%';
  $('hpLtext').textContent = ''; $('hpRtext').textContent = '';
  $('lvlbadge').textContent = levelFromXp(+(localStorage.getItem('zomb_xp') || 0));
  $('xpbar').style.width = (xpProgress(+(localStorage.getItem('zomb_xp') || 0)) * 100) + '%';
  $('xptext').textContent = Math.round(xpProgress(+(localStorage.getItem('zomb_xp') || 0)) * 100) + '%';
  const done = PROGRESS.zombie + PROGRESS.human;
  $('hubCampProgress').textContent = `пройдено ${done}/14`;
}

document.querySelectorAll('#hub .hubspot').forEach(btn => {
  btn.addEventListener('click', () => {
    SFX.unlock(); SFX.click();
    const spot = btn.dataset.spot;
    if (spot === 'campaign') { enterCampaign(); }
    else if (spot === 'arena') { $('arenaSetup').classList.remove('hidden'); }
    else toast('Эта часть Арены ещё строится...');
  });
});

// ================= НАСТРОЙКА АРЕНЫ =================
function drawArenaPortraits() {
  const zc = document.querySelector('#pickZombie canvas').getContext('2d');
  zc.clearRect(0, 0, 110, 110);
  zc.save(); zc.translate(55, 104); zc.scale(2.5, 2.5);
  drawHumanoid(zc, LOOK.zombik, 0.4, { state: 'walk', atkT: 0, seed: 2 });
  zc.restore();
  const hc = document.querySelector('#pickHuman canvas').getContext('2d');
  hc.clearRect(0, 0, 110, 110);
  hc.save(); hc.translate(55, 104); hc.scale(2.5, 2.5);
  drawHumanoid(hc, LOOK.farmer, 0.4, { state: 'walk', atkT: 0, seed: 2 });
  hc.restore();
}
function pickArenaSide(side) {
  arenaSide = side;
  $('pickZombie').classList.toggle('sel', side === 'zombie');
  $('pickHuman').classList.toggle('sel', side === 'human');
}
$('pickZombie').addEventListener('click', () => { pickArenaSide('zombie'); SFX.click(); });
$('pickHuman').addEventListener('click', () => { pickArenaSide('human'); SFX.click(); });
document.querySelectorAll('#diffPick button').forEach(b => {
  b.addEventListener('click', () => {
    selectedDiff = b.dataset.d;
    document.querySelectorAll('#diffPick button').forEach(x => x.classList.toggle('sel', x === b));
    SFX.click();
  });
});
$('btnArenaGo').addEventListener('click', () => {
  $('arenaSetup').classList.add('hidden');
  startBattleUI(arenaSide, selectedDiff, null);
});

// ================= КАРТА КАМПАНИИ =================
function enterCampaign() {
  SCREEN = 'campaign';
  $('hub').classList.add('hidden');
  $('campaign').classList.remove('hidden');
  SFX.click();
}
$('campClose').addEventListener('click', () => { SFX.click(); enterHub(); });

// кнопки выбора расы поверх нарисованных монет
for (const race of ['human', 'zombie']) {
  const b = document.createElement('button');
  b.className = 'racecoin';
  b.title = race === 'human' ? 'Играть за фермеров' : 'Играть за зомби';
  b.style.left = (race === 'human' ? 148 : 236) - 32 + 'px';
  b.style.top = 214 - 32 + 'px';
  b.addEventListener('click', () => { campSide = race; SFX.click(); });
  $('campaign').appendChild(b);
}

function mapCoords(e) {
  const r = cvs.getBoundingClientRect();
  return { x: (e.clientX - r.left) / r.width * W, y: (e.clientY - r.top) / r.height * H };
}
cvs.addEventListener('mousemove', (e) => {
  if (SCREEN !== 'campaign') return;
  const p = mapCoords(e);
  hoverNode = -1;
  MAP_NODES.forEach((n, i) => {
    if (Math.hypot(p.x - n.x, p.y - n.y) < 24) hoverNode = i;
  });
  cvs.style.cursor = hoverNode >= 0 && hoverNode <= PROGRESS[campSide] ? 'pointer' : 'default';
  const tip = $('campTip');
  if (hoverNode >= 0) {
    const m = CAMPAIGNS[campSide][hoverNode];
    const state = hoverNode < PROGRESS[campSide] ? '✓ пройдена' : hoverNode === PROGRESS[campSide] ? 'доступна' : '🔒 закрыта';
    tip.textContent = `${m.name} — ${state}`;
    tip.classList.remove('hidden');
    tip.style.left = Math.min(W - 220, p.x + 14) + 'px';
    tip.style.top = (p.y - 44) + 'px';
  } else tip.classList.add('hidden');
});
cvs.addEventListener('click', (e) => {
  if (SCREEN !== 'campaign') return;
  const p = mapCoords(e);
  MAP_NODES.forEach((n, i) => {
    if (Math.hypot(p.x - n.x, p.y - n.y) < 24 && i <= PROGRESS[campSide]) {
      SFX.click();
      openMissionIntro(i);
    }
  });
});

function openMissionIntro(idx) {
  const m = CAMPAIGNS[campSide][idx];
  $('miName').textContent = m.name;
  $('miText').textContent = m.text;
  $('miReward').innerHTML = `Награда за победу: <span class="coin"></span> ${m.reward} · Противник: ${ROSTERS[campSide === 'zombie' ? 'human' : 'zombie'].title}`;
  $('missionIntro').classList.remove('hidden');
  $('miGo').onclick = () => {
    $('missionIntro').classList.add('hidden');
    startBattleUI(campSide, 'normal', idx);
  };
  $('miBack').onclick = () => { $('missionIntro').classList.add('hidden'); SFX.click(); };
}

// ================= БОЙ =================
function startBattleUI(side, diff, mission) {
  buildBattleBackground(side, GAME.foeSide || (side === 'zombie' ? 'human' : 'zombie'));
  startBattle(side, diff, mission);
  SCREEN = 'battle';
  $('hub').classList.add('hidden');
  $('campaign').classList.add('hidden');
  $('bottombar').classList.remove('hidden');
  $('chat').classList.remove('hidden');
  buildCards();
  buildPortraits();
}

// ---------- карточки ----------
function maxCdFor(spec, isDef) {
  if (!isDef) return 1.2 + spec.cost / 800;
  return spec.kind === 'turret' ? 10 : spec.cd;
}
function buildCards() {
  const roster = ROSTERS[GAME.side];
  const mk = (spec, isDef) => {
    const card = document.createElement('div');
    card.className = 'card';
    const cv = document.createElement('canvas'); cv.width = 54; cv.height = 40;
    if (isDef) renderDefPortrait(cv, GAME.side, spec);
    else renderUnitPortrait(cv, GAME.side, spec);
    card.appendChild(cv);
    const nm = document.createElement('div'); nm.className = 'nm'; nm.textContent = spec.name; card.appendChild(nm);
    const pr = document.createElement('div'); pr.className = 'price';
    pr.innerHTML = '<span class="coin"></span> ' + spec.cost; card.appendChild(pr);
    const cool = document.createElement('div'); cool.className = 'cool'; cool.style.height = '0%'; card.appendChild(cool);
    card.addEventListener('click', () => {
      if (GAME.state !== 'play' || GAME.paused) return;
      if (tierLevel(spec.tier) > GAME.level.p) { SFX.click(); return; }
      const ok = isDef ? playerDefense(spec) : playerSpawn(spec);
      if (ok) SFX.click();
    });
    cardRefs[isDef ? 'defs' : 'units'].push({ el: card, spec, isDef, cool, maxCd: maxCdFor(spec, isDef) });
    return card;
  };
  const uc = $('unitCards'); uc.innerHTML = '';
  cardRefs.units = [];
  [...roster.units].sort((a, b) => a.tier - b.tier || a.cost - b.cost).forEach(s => uc.appendChild(mk(s, false)));
  const dc = $('defCards'); dc.innerHTML = '';
  cardRefs.defs = [];
  [...roster.defense].sort((a, b) => a.tier - b.tier || a.cost - b.cost).forEach(s => dc.appendChild(mk(s, true)));
}
function updateCards() {
  for (const c of [...cardRefs.units, ...cardRefs.defs]) {
    const cd = GAME.cds.p[c.isDef ? '_' + c.spec.id : c.spec.id] || 0;
    c.cool.style.height = cd > 0 ? (cd / c.maxCd * 100).toFixed(0) + '%' : '0%';
    const locked = tierLevel(c.spec.tier) > GAME.level.p;
    c.el.classList.toggle('locked', locked);
    if (locked) c.el.dataset.lvl = tierLevel(c.spec.tier);
    c.el.classList.toggle('poor', !locked && GAME.money.p < c.spec.cost);
  }
}

// ---------- портреты VS ----------
function buildPortraits() {
  const rep = { zombie: 'zombik', human: 'farmer' };
  const me = ROSTERS[GAME.side].units.find(u => u.id === rep[GAME.side]) || ROSTERS[GAME.side].units[0];
  const foe = ROSTERS[GAME.foeSide].units.find(u => u.id === rep[GAME.foeSide]) || ROSTERS[GAME.foeSide].units[0];
  const pc = $('ppMe').getContext('2d');
  pc.clearRect(0, 0, 76, 76);
  pc.save(); pc.translate(38, 72); pc.scale(1.7, 1.7);
  drawHumanoid(pc, LOOK[me.id], 0.4, { state: 'attack', atkT: 0.5, seed: 3 });
  pc.restore();
  const fc = $('ppFoe').getContext('2d');
  fc.clearRect(0, 0, 76, 76);
  fc.save(); fc.translate(38, 72); fc.scale(-1.7, 1.7);
  drawHumanoid(fc, LOOK[foe.id], 0.4, { state: 'attack', atkT: 0.5, seed: 3 });
  fc.restore();
}

// ---------- HUD ----------
function fmtTime(t) {
  t = Math.max(0, Math.ceil(t));
  return Math.floor(t / 60) + ':' + String(t % 60).padStart(2, '0');
}
function updateHUD() {
  $('stMoney').innerHTML = '<span class="coin"></span> ' + Math.floor(GAME.money.p);
  $('stCap').textContent = '👥 ' + unitCap(GAME.side) + '/' + GAME.cap;
  $('stScore').textContent = 'ОЧКИ: ' + Math.floor(GAME.score);
  $('stTimer').textContent = '🕓 ' + fmtTime(GAME.time);
  $('lvlbadge').textContent = GAME.level.p;
  const xp = xpProgress(GAME.xp.p);
  $('xpbar').style.width = (xp * 100).toFixed(0) + '%';
  $('xptext').textContent = (xp * 100).toFixed(0) + '%';
  $('hpLfill').style.width = (GAME.baseHp.p / GAME.baseMax.p * 100) + '%';
  $('hpRfill').style.width = (GAME.baseHp.e / GAME.baseMax.e * 100) + '%';
  $('hpLtext').textContent = Math.ceil(GAME.baseHp.p);
  $('hpRtext').textContent = Math.ceil(GAME.baseHp.e);
  const r = GAME.rage.p;
  $('rageFill').style.height = r.charge + '%';
  $('btnRage').classList.toggle('ready', r.charge >= 100 && r.active <= 0);
  $('btnBank').disabled = GAME.bankCd.p > 0;
  $('bankCd').textContent = GAME.bankCd.p > 0 ? Math.ceil(GAME.bankCd.p) + ' c' : 'готов';
  updateCards();
}

// ---------- рендер ----------
function render(t) {
  ctx.clearRect(0, 0, W, H);
  if (SCREEN === 'hub') { drawHubScene(ctx, t); return; }
  if (SCREEN === 'campaign') { drawCampaignMap(ctx, campSide, PROGRESS[campSide], t); return; }
  // бой
  if (BG) ctx.drawImage(BG, 0, 0);
  drawBase(ctx, GAME.side, GAME.baseHp.p / GAME.baseMax.p, t);
  ctx.save();
  ctx.translate(W, 0); ctx.scale(-1, 1);
  drawBase(ctx, GAME.foeSide, GAME.baseHp.e / GAME.baseMax.e, t);
  ctx.restore();
  for (const who of ['p', 'e']) {
    const side = who === 'p' ? GAME.side : GAME.foeSide;
    for (const o of GAME.occupied[who]) {
      if (!o) continue;
      if (o.spec.kind === 'trap') drawTrap(ctx, o.spec, o.x, o.y, side, t, o.spec.fire && !o.armed);
      else drawTurret(ctx, o.spec, o.x, o.y, side, t, o.hp / o.maxHp);
    }
  }
  const sorted = [...GAME.units].sort((a, b) => a.y - b.y);
  for (const u of sorted) drawUnit(ctx, u, t);
  for (const u of GAME.units) {
    if (u.state === 'dead' || u.hp >= u.maxHp) continue;
    const barY = u.y - (LOOK[u.id]?.big ? 52 : 43);
    ctx.fillStyle = 'rgba(0,0,0,.5)';
    ctx.fillRect(u.x - 11, barY, 22, 3);
    ctx.fillStyle = u.side === GAME.side ? '#7ed13e' : '#e05b5b';
    ctx.fillRect(u.x - 10.5, barY + 0.5, 21 * Math.max(0, u.hp / u.maxHp), 2);
  }
  for (const p of GAME.projs) {
    if (p.kind === 'bullet') {
      ctx.strokeStyle = '#ffe36a'; ctx.lineWidth = 2;
      ctx.beginPath(); ctx.moveTo(p.x, p.y); ctx.lineTo(p.x - p.dir * 7, p.y); ctx.stroke();
    } else if (p.kind === 'rocket') {
      ctx.save(); ctx.translate(p.x, p.y);
      ctx.fillStyle = '#5d6a3e'; ctx.fillRect(-6, -2.4, 12, 4.8);
      ctx.fillStyle = '#ff9a3e'; ctx.beginPath(); ctx.moveTo(-6, -2.4); ctx.lineTo(-11, 0); ctx.lineTo(-6, 2.4); ctx.fill();
      ctx.restore();
    } else {
      ctx.fillStyle = '#8ec45e';
      ctx.beginPath(); ctx.arc(p.x, p.y, 3.4, 0, 7); ctx.fill();
    }
  }
  for (const pt of GAME.parts) {
    ctx.globalAlpha = pt.life / pt.maxLife;
    ctx.fillStyle = pt.color;
    ctx.beginPath(); ctx.arc(pt.x, pt.y, pt.size, 0, 7); ctx.fill();
  }
  ctx.globalAlpha = 1;
  ctx.font = 'bold 13px Trebuchet MS';
  ctx.textAlign = 'center';
  for (const f of GAME.floats) {
    ctx.globalAlpha = Math.min(1, f.life);
    ctx.fillStyle = '#000'; ctx.fillText(f.txt, f.x + 1, f.y + 1);
    ctx.fillStyle = f.color; ctx.fillText(f.txt, f.x, f.y);
  }
  ctx.globalAlpha = 1;
  const r = GAME.rage.p;
  if (r.active > 0) {
    const g = ctx.createRadialGradient(W / 2, H / 2, H * 0.3, W / 2, H / 2, H * 0.75);
    g.addColorStop(0, 'rgba(255,40,40,0)');
    g.addColorStop(1, `rgba(255,40,40,${0.12 + Math.sin(t * 10) * 0.05})`);
    ctx.fillStyle = g; ctx.fillRect(0, 0, W, H);
  }
  if (GAME.baseWarnT > 0) {
    const a = 0.25 + Math.sin(t * 14) * 0.15;
    ctx.strokeStyle = `rgba(255,60,60,${a})`; ctx.lineWidth = 8;
    ctx.strokeRect(4, 4, W - 8, H - 8);
  }
}

// ---------- кнопки боя ----------
$('btnSurrender').addEventListener('click', () => {
  if (GAME.state !== 'play') return;
  GAME.baseHp.p = 0;
  GAME.state = 'over';
  finishBattle();
});
$('btnPause').addEventListener('click', () => {
  if (GAME.state !== 'play') return;
  GAME.paused = !GAME.paused;
  $('pauseOverlay').classList.toggle('hidden', !GAME.paused);
});
$('pauseOverlay').addEventListener('click', () => {
  GAME.paused = false;
  $('pauseOverlay').classList.add('hidden');
});
$('btnRage').addEventListener('click', () => activateRage('p'));
$('btnBank').addEventListener('click', () => playerBank());
$('btnSound').addEventListener('click', (e) => {
  const on = e.currentTarget.textContent === '🔇';
  e.currentTarget.textContent = on ? '🔊' : '🔇';
  SFX.setSound(on);
});
$('btnMusic').addEventListener('click', (e) => {
  const on = e.currentTarget.textContent === '🎵';
  e.currentTarget.textContent = on ? '🎶' : '🎵';
  SFX.setMusic(on);
});
$('btnChat').addEventListener('click', () => $('chat').classList.toggle('hidden'));
$('chatTitle').addEventListener('click', () => $('chat').classList.add('hidden'));
$('btnHelp').addEventListener('click', () => {
  if (GAME.state === 'play') { GAME.paused = true; $('pauseOverlay').classList.remove('hidden'); }
  $('help').classList.remove('hidden');
});
document.querySelector('.closeModal').addEventListener('click', () => {
  $('help').classList.add('hidden');
  if (GAME.state === 'play') { GAME.paused = false; $('pauseOverlay').classList.add('hidden'); }
});

// ---------- результат ----------
function showResult() {
  const res = GAME.result;
  const mp = res.mission != null ? CAMPAIGNS[res.side][res.mission] : null;
  let title, color = '#e05b5b';
  if (res.win) { title = mp ? 'МИССИЯ ПРОЙДЕНА!' : 'ПОБЕДА!'; color = '#7ed13e'; }
  else title = mp ? 'МИССИЯ ПРОВАЛЕНА...' : 'ПОРАЖЕНИЕ...';
  $('resTitle').textContent = title;
  $('resTitle').style.color = color;
  let extra = '';
  if (res.win) {
    PROGRESS = loadProgress();
    if (mp && res.mission === PROGRESS[res.side]) {
      PROGRESS[res.side]++;
      saveProgress(PROGRESS);
      extra = PROGRESS[res.side] < CAMPAIGNS[res.side].length
        ? `<br>Открыта следующая миссия: <b>«${CAMPAIGNS[res.side][PROGRESS[res.side]].name}»</b>`
        : '<br><b>Кампания полностью пройдена! Ты легенда кладбища!</b>';
    }
  }
  $('resStats').innerHTML =
    `${res.reason}<br>` +
    `Очки: <b>${Math.floor(GAME.score)}</b> · Убито врагов: <b>${GAME.kills.p}</b> · Потеряно: <b>${GAME.kills.e}</b><br>` +
    `Уровень: <b>${GAME.level.p}</b> · Время боя: <b>${fmtTime(GAME.elapsed)}</b><br>` +
    `Награда: <span class="coin"></span> <b>${res.reward}</b>${extra}`;
  const btns = $('resBtns');
  btns.innerHTML = '';
  const mkBtn = (txt, cls, fn) => {
    const b = document.createElement('button');
    if (cls) b.className = cls;
    b.textContent = txt;
    b.addEventListener('click', fn);
    btns.appendChild(b);
  };
  if (res.win && mp && res.mission < CAMPAIGNS[res.side].length - 1 && res.mission === PROGRESS[res.side] - 1) {
    mkBtn('Следующая миссия ▶', 'primary', () => { $('result').classList.add('hidden'); openMissionIntro(res.mission + 1); SCREEN = 'campaign'; $('bottombar').classList.add('hidden'); $('chat').classList.add('hidden'); $('campaign').classList.remove('hidden'); });
  }
  if (!res.win && mp) {
    mkBtn('Повторить', 'primary', () => { $('result').classList.add('hidden'); startBattleUI(res.side, 'normal', res.mission); });
  }
  if (!mp) {
    mkBtn('Играть снова', 'primary', () => { $('result').classList.add('hidden'); $('arenaSetup').classList.remove('hidden'); enterHub(); });
  }
  mkBtn(mp ? 'На карту' : 'В хаб', '', () => {
    $('result').classList.add('hidden');
    if (mp) enterCampaign(); else enterHub();
  });
  $('result').classList.remove('hidden');
}

// ---------- главный цикл ----------
let last = performance.now();
function frame(now) {
  const dt = Math.min(0.05, (now - last) / 1000);
  last = now;
  if (GAME.state === 'play') {
    updateBattle(dt);
    updateHUD();
  }
  if (GAME.state === 'play' || GAME.state === 'over') render(GAME.elapsed);
  else render(now / 1000);
  if (GAME.state === 'over' && $('result').classList.contains('hidden')) showResult();
  requestAnimationFrame(frame);
}

// init
drawArenaPortraits();
pickArenaSide('zombie');
enterHub();
requestAnimationFrame(frame);
