// ===== Зомбинация: движок боя =====

const BASE_LINE = { p: 62, e: 898 }; // где стоят базы
const SLOTS = {
  p: [{ x: 140, y: ROAD_TOP + 18 }, { x: 195, y: ROAD_BOT - 14 }, { x: 250, y: ROAD_TOP + 14 }, { x: 305, y: ROAD_BOT - 10 }],
  e: [{ x: 820, y: ROAD_BOT - 18 }, { x: 765, y: ROAD_TOP + 14 }, { x: 710, y: ROAD_BOT - 14 }, { x: 655, y: ROAD_TOP + 18 }],
};

const GAME = {
  state: 'menu', paused: false,
  side: 'zombie', foeSide: 'human', diff: 'normal', mission: null, eInc: 1,
  money: { p: 250, e: 250 },
  xp: { p: 0, e: 0 }, level: { p: 1, e: 1 },
  score: 0, kills: { p: 0, e: 0 }, reward: 0,
  baseHp: { p: 5000, e: 5000 }, baseMax: { p: 5000, e: 5000 },
  units: [], projs: [], parts: [], floats: [],
  occupied: { p: [null, null, null, null], e: [null, null, null, null] },
  cds: { p: {}, e: {} },
  rage: { p: { charge: 0, active: 0 }, e: { charge: 0, active: 0 } },
  bankCd: { p: 0, e: 0 },
  cap: 20, time: 300, elapsed: 0,
  chatT: 8, firstBlood: false, baseWarnT: 0,
  aiThinkT: 1.5, lastSpawnCd: { p: {}, e: {} },
};

function unitCap(side) { return GAME.units.filter(u => u.side === side && u.state !== 'dead').length; }

function incomeRate(side) {
  const who = side === GAME.side ? 'p' : 'e';
  let inc = 14 + GAME.level[who] * 3;
  if (who === 'e') inc *= GAME.eInc;
  return inc;
}

function tierLevel(tier) { return tier; } // тир N открывается на уровне N

function startBattle(side, diff, mission = null) {
  GAME.state = 'play'; GAME.paused = false;
  GAME.side = side; GAME.foeSide = side === 'zombie' ? 'human' : 'zombie';
  GAME.diff = diff;
  GAME.mission = mission;
  const mp = mission != null ? CAMPAIGNS[side][mission] : null;
  GAME.eInc = mp ? mp.eInc : DIFF[diff].income;
  GAME.money = { p: 250, e: 250 };
  // уровень игрока сохраняется между боями
  GAME.xp = { p: +(localStorage.getItem('zomb_xp') || 0), e: 0 };
  GAME.level = { p: levelFromXp(GAME.xp.p), e: 1 };
  GAME.score = 0; GAME.kills = { p: 0, e: 0 };
  GAME.reward = 0;
  const hp = ROSTERS[side].baseHp;
  GAME.baseMax = { p: hp, e: Math.round(ROSTERS[GAME.foeSide].baseHp * (mp ? mp.eHp : DIFF[diff].aiHp)) };
  GAME.baseHp = { p: GAME.baseMax.p, e: GAME.baseMax.e };
  GAME.units = []; GAME.projs = []; GAME.parts = []; GAME.floats = [];
  GAME.occupied = { p: [null, null, null, null], e: [null, null, null, null] };
  GAME.cds = { p: {}, e: {} };
  GAME.rage = { p: { charge: 0, active: 0 }, e: { charge: 0, active: 0 } };
  GAME.bankCd = { p: 0, e: 0 };
  GAME.time = 300; GAME.elapsed = 0;
  GAME.chatT = 6; GAME.firstBlood = false; GAME.baseWarnT = 0; GAME.aiThinkT = 2; GAME.endgameSaid = false;
  document.getElementById('chatLog').innerHTML = '';
  const where = mp ? `Миссия «${mp.name}»` : `Аренa · ${DIFF[diff].name}`;
  chatSys(`${where}: ${ROSTERS[side].title} против ${ROSTERS[GAME.foeSide].titleGen}.`);
  SFX.unlock(); SFX.startMusic();
}

// ---------- чат ----------
function chatPush(cls, who, text) {
  const log = document.getElementById('chatLog');
  const div = document.createElement('div');
  div.className = cls;
  div.textContent = `${who}: ${text}`;
  log.appendChild(div);
  log.scrollTop = log.scrollHeight;
  while (log.children.length > 40) log.removeChild(log.firstChild);
}
function chatSys(text) { chatPush('sys', ' система', text); }
function chatBanter() {
  const mine = Math.random() < 0.45;
  const line = CHAT_LINES[Math.floor(Math.random() * CHAT_LINES.length)];
  chatPush(mine ? 'me' : 'foe', mine ? 'Вы' : 'Противник', line);
}

// ---------- частицы ----------
function spawnParts(x, y, color, n, spd = 60, life = 0.5) {
  for (let i = 0; i < n; i++) {
    const a = Math.random() * Math.PI * 2;
    GAME.parts.push({ x, y, vx: Math.cos(a) * spd * (0.3 + Math.random()), vy: Math.sin(a) * spd * (0.3 + Math.random()) - 30, life, maxLife: life, color, size: 2 + Math.random() * 2.5, grav: 160 });
  }
}
function floatText(x, y, txt, color) {
  GAME.floats.push({ x, y, txt, color, life: 1 });
}

// ---------- урон ----------
function killReward(u, killerSide) {
  const who = killerSide === GAME.side ? 'p' : 'e';
  const money = Math.round(u.spec.cost * 0.25);
  GAME.money[who] += money;
  GAME.xp[who] += u.spec.cost * 0.35;
  if (who === 'p') {
    GAME.score += u.spec.cost * 3;
    GAME.kills.p++;
    floatText(u.x, u.y - 30, `+${money}`, '#ffe36a');
  } else GAME.kills.e++;
  const newLvl = levelFromXp(GAME.xp[who]);
  if (newLvl > GAME.level[who]) {
    GAME.level[who] = newLvl;
    if (who === 'p') {
      SFX.levelup();
      chatSys(`Новый уровень ${newLvl}! Открыты новые юниты.`);
      floatText(160, ROAD_TOP - 40, 'УРОВЕНЬ ' + newLvl + '!', '#7ed13e');
    } else {
      chatPush('foe', 'Противник', 'я апнул уровень, держись)');
    }
  }
}

// ---------- спавн ----------
function spawnUnit(side, spec) {
  const who = side === GAME.side ? 'p' : 'e';
  const cost = spec.cost;
  if (GAME.money[who] < cost || unitCap(side) >= GAME.cap) return false;
  if (GAME.cds[who][spec.id] > 0) return false;
  GAME.money[who] -= cost;
  GAME.cds[who][spec.id] = 1.2 + cost / 800;
  const dir = who === 'p' ? 1 : -1;
  const x = who === 'p' ? BASE_LINE.p + 40 : BASE_LINE.e - 40;
  const y = ROAD_TOP + 14 + Math.random() * (ROAD_BOT - ROAD_TOP - 22);
  GAME.units.push({
    id: spec.id, spec, side, x, y, dir,
    hp: spec.hp, maxHp: spec.hp,
    state: 'walk', atkT: 0, atkCd: Math.random() * 0.4,
    seed: Math.random() * 7, deadT: 0, slowT: 0, holdT: 0, burnT: 0, burnSrc: 0,
  });
  return true;
}

function placeDefense(side, spec) {
  const who = side === GAME.side ? 'p' : 'e';
  if (GAME.money[who] < spec.cost) return false;
  if ((GAME.cds[who]['_' + spec.id] || 0) > 0) return false;
  const slots = SLOTS[who], occ = GAME.occupied[who];
  // ставим на ближайший к врагу свободный слот
  const order = who === 'p' ? [3, 2, 1, 0] : [3, 2, 1, 0];
  let idx = -1;
  for (const i of order) if (!occ[i]) { idx = i; break; }
  if (idx < 0) { if (who === 'p') chatSys('Все слоты защиты заняты!'); return false; }
  GAME.money[who] -= spec.cost;
  const obj = { spec, x: slots[idx].x, y: slots[idx].y, side, slot: idx };
  if (spec.kind === 'turret') { obj.hp = spec.hp; obj.maxHp = spec.hp; obj.atkCd = 0; }
  else obj.armed = true;
  occ[idx] = obj;
  GAME.cds[who]['_' + spec.id] = spec.kind === 'turret' ? 10 : spec.cd;
  if (who === 'p') SFX.click();
  return true;
}

// ---------- снаряды ----------
function fireProj(from, target, spec, side, dir) {
  const kind = spec.proj || 'bullet';
  const spd = kind === 'bullet' ? 520 : kind === 'rocket' ? 300 : 260;
  GAME.projs.push({
    x: from.x + dir * 10, y: from.y - 18, side, dir, kind,
    dmg: spec.dmg, splash: spec.splash || 0, slow: spec.slow || 0,
    target, spd, life: 2.2,
  });
  if (kind === 'bullet') SFX.shot();
  if (kind === 'spit') SFX.spit();
  if (kind === 'rocket') SFX.shot();
}

function projHit(p, unit) {
  if (p.splash) {
    SFX.boom();
    spawnParts(p.x, p.y, '#ffb14e', 14, 90, 0.5);
    spawnParts(p.x, p.y, '#5a5a5a', 8, 60, 0.7);
    for (const u of GAME.units) {
      if (u.side === p.side || u.state === 'dead') continue;
      if (Math.abs(u.x - p.x) < p.splash && Math.abs(u.y - p.y) < p.splash * 0.7)
        applyDamage(u, p.dmg, p.side);
    }
    const foe = p.side === GAME.side ? 'e' : 'p';
    for (const t of GAME.occupied[foe]) {
      if (t && t.spec.kind === 'turret' && Math.abs(t.x - p.x) < p.splash) { t.hp -= p.dmg; }
    }
  } else {
    applyDamage(unit, p.dmg, p.side);
    if (p.slow) unit.slowT = 2;
    spawnParts(p.x, p.y, p.kind === 'spit' ? '#8ec45e' : '#c43a2e', 3, 40, 0.3);
  }
}

function applyDamage(u, dmg, fromSide) {
  u.hp -= dmg;
  const w = fromSide === GAME.side ? 'p' : 'e';
  GAME.rage[w].charge = Math.min(100, GAME.rage[w].charge + dmg * 0.22);
  if (u.hp <= 0 && u.state !== 'dead') {
    u.state = 'dead'; u.deadT = 0.9;
    killReward(u, fromSide);
    SFX.die();
    spawnParts(u.x, u.y - 12, u.side === 'zombie' ? '#7ec850' : '#c43a2e', 10, 70, 0.6);
    if (!GAME.firstBlood) { GAME.firstBlood = true; chatSys('Первая кровь! Это только начало)'); }
  }
}

// ---------- обновление ----------
function updateBattle(dt) {
  if (GAME.state !== 'play' || GAME.paused) return;
  GAME.elapsed += dt;
  GAME.time -= dt;

  // экономика
  GAME.money.p += incomeRate(GAME.side) * dt;
  GAME.money.e += incomeRate(GAME.foeSide) * dt;
  GAME.bankCd.p = Math.max(0, GAME.bankCd.p - dt);
  GAME.bankCd.e = Math.max(0, GAME.bankCd.e - dt);
  GAME.score += dt * 2;

  // ярость
  for (const w of ['p', 'e']) {
    const r = GAME.rage[w];
    if (r.active > 0) r.active -= dt;
  }

  // кулдауны
  for (const w of ['p', 'e']) for (const k in GAME.cds[w]) if (GAME.cds[w][k] > 0) GAME.cds[w][k] -= dt;

  // чат-болтовня
  GAME.chatT -= dt;
  if (GAME.chatT <= 0) { chatBanter(); GAME.chatT = 10 + Math.random() * 16; }
  if (!GAME.endgameSaid && GAME.time <= 45) {
    GAME.endgameSaid = true;
    const lines = EVENT_LINES.endgame;
    chatPush('foe', 'Противник', lines[Math.floor(Math.random() * lines.length)]);
  }

  // ===== юниты =====
  const alive = GAME.units.filter(u => u.state !== 'dead');
  for (const u of GAME.units) {
    if (u.state === 'dead') { u.deadT -= dt; continue; }
    u.atkCd -= dt;
    if (u.slowT > 0) u.slowT -= dt;
    if (u.holdT > 0) { u.holdT -= dt; continue; }
    if (u.burnT > 0) {
      u.burnT -= dt;
      u.hp -= 14 * dt;
      if (Math.random() < dt * 12) GAME.parts.push({ x: u.x + (Math.random() - .5) * 10, y: u.y - 10 - Math.random() * 10, vx: 0, vy: -40, life: .3, maxLife: .3, color: '#ff9a3e', size: 3, grav: 0 });
      if (u.hp <= 0) { applyDamage(u, 1, u.burnSide); continue; }
    }
    const dir = u.dir;
    const rageMul = GAME.rage[u.side === GAME.side ? 'p' : 'e'].active > 0 ? 2 : 1;
    const slowMul = u.slowT > 0 ? 0.5 : 1;

    // цель: ближайший враг впереди
    let target = null, bestD = 1e9;
    for (const e of alive) {
      if (e.side === u.side) continue;
      const d = (e.x - u.x) * dir;
      if (d < -16) continue;
      if (d < bestD) { bestD = d; target = e; }
    }
    // турели врага
    let turret = null, tBest = 1e9;
    const foe = u.side === GAME.side ? 'e' : 'p';
    for (const t of GAME.occupied[foe]) {
      if (!t || t.spec.kind !== 'turret') continue;
      const d = (t.x - u.x) * dir;
      if (d < -16) continue;
      if (d < tBest) { tBest = d; turret = t; }
    }
    // база врага
    const baseX = foe === 'p' ? BASE_LINE.p : BASE_LINE.e;
    const atBase = foe === 'p' ? u.x <= baseX + 26 : u.x >= baseX - 26;

    const range = u.spec.range;
    if (target && bestD <= range) {
      // атака юнита
      u.state = 'attack';
      if (u.atkCd <= 0) {
        u.atkCd = u.spec.rate / (rageMul > 1 ? 1.5 : 1);
        u.atkT = 0.001;
        const dmg = u.spec.dmg * rageMul;
        if (u.spec.kind === 'melee') {
          applyDamage(target, dmg, u.side);
          if (u.spec.lifesteal) { u.hp = Math.min(u.maxHp, u.hp + dmg * u.spec.lifesteal); }
          SFX.hit();
          spawnParts(target.x, target.y - 14, target.side === 'zombie' ? '#7ec850' : '#c43a2e', 4, 50, 0.35);
        } else {
          fireProj(u, target, u.spec, u.side, dir);
        }
      }
    } else if (turret && tBest <= range + 14) {
      u.state = 'attack';
      if (u.atkCd <= 0) {
        u.atkCd = u.spec.rate / (rageMul > 1 ? 1.5 : 1);
        u.atkT = 0.001;
        const dmg = u.spec.dmg * rageMul;
        if (u.spec.kind === 'melee') { turret.hp -= dmg; SFX.hit(); spawnParts(turret.x, turret.y - 10, '#a89a7e', 4, 40, 0.3); }
        else fireProj(u, turret, u.spec, u.side, dir);
      }
    } else if (atBase) {
      u.state = 'attack';
      if (u.atkCd <= 0) {
        u.atkCd = u.spec.rate / (rageMul > 1 ? 1.5 : 1);
        u.atkT = 0.001;
        const w = u.side === GAME.side ? 'p' : 'e';
        GAME.baseHp[w === 'p' ? 'e' : 'p'] = Math.max(0, GAME.baseHp[w === 'p' ? 'e' : 'p'] - u.spec.dmg * 1.5 * rageMul);
        SFX.baseHit();
        spawnParts(baseX + (w === 'p' ? -20 : 20), ROAD_TOP - 20, '#8a7a5e', 5, 50, 0.4);
        GAME.baseWarnT = 4;
      }
    } else {
      u.state = 'walk';
      // не толкаемся в спину своим
      let blocked = false;
      for (const f of alive) {
        if (f === u || f.side !== u.side) continue;
        if ((f.x - u.x) * dir > 0 && (f.x - u.x) * dir < 15 && Math.abs(f.y - u.y) < 12) { blocked = true; break; }
      }
      if (!blocked) {
        const spd = u.spec.speed * slowMul * (rageMul > 1 ? 1.4 : 1);
        u.x += dir * spd * dt;
      }
    }
    if (u.atkT > 0) { u.atkT += dt * 3.5; if (u.atkT > 1) u.atkT = 0; }
  }
  GAME.units = GAME.units.filter(u => u.state !== 'dead' || u.deadT > 0);

  // ===== турели =====
  for (const who of ['p', 'e']) {
    const side = who === 'p' ? GAME.side : GAME.foeSide;
    for (const t of GAME.occupied[who]) {
      if (!t || t.spec.kind !== 'turret') continue;
      if (t.hp <= 0) {
        GAME.occupied[who][t.slot] = null;
        spawnParts(t.x, t.y - 10, '#8a7a5e', 12, 60, 0.6);
        continue;
      }
      t.atkCd -= dt;
      let target = null, best = 1e9;
      for (const e of alive) {
        if (e.side === side) continue;
        const d = Math.abs(e.x - t.x) + Math.abs(e.y - t.y) * 0.4;
        if (d < t.spec.range && d < best) { best = d; target = e; }
      }
      if (target && t.atkCd <= 0) {
        t.atkCd = t.spec.rate;
        fireProj(t, target, t.spec, side, target.x > t.x ? 1 : -1);
      }
    }
  }

  // ===== ловушки =====
  for (const who of ['p', 'e']) {
    const side = who === 'p' ? GAME.side : GAME.foeSide;
    for (const tr of GAME.occupied[who]) {
      if (!tr || tr.spec.kind !== 'trap' || !tr.armed) continue;
      for (const e of alive) {
        if (e.side === side) continue;
        if (Math.abs(e.x - tr.x) < 20 && Math.abs(e.y - tr.y) < 24) {
          tr.armed = false; GAME.occupied[who][tr.slot] = null;
          applyDamage(e, tr.spec.dmg, side);
          if (tr.spec.hold) e.holdT = tr.spec.hold;
          if (tr.spec.fire) { e.burnT = 3; e.burnSide = side; }
          if (tr.spec.dmg >= 120) SFX.boom(); else SFX.hit();
          spawnParts(tr.x, tr.y - 6, tr.spec.fire ? '#ff9a3e' : '#c43a2e', 10, 70, 0.5);
          break;
        }
      }
    }
  }

  // ===== снаряды =====
  for (const p of GAME.projs) {
    p.life -= dt;
    let tx = p.target && p.target.state !== 'dead' ? p.target.x : null;
    let ty = p.target && p.target.state !== 'dead' ? p.target.y - 14 : null;
    if (tx === null) { tx = p.x + p.dir * 100; ty = p.y; }
    const dx = tx - p.x, dy = ty - p.y;
    const dist = Math.hypot(dx, dy);
    const step = p.spd * dt;
    if (dist <= step + 4) {
      // попадание
      let hitUnit = null;
      if (p.target && p.target.state !== 'dead' && p.target.side !== p.side) hitUnit = p.target;
      else {
        for (const e of alive) {
          if (e.side === p.side) continue;
          if (Math.abs(e.x - p.x) < 14 && Math.abs(e.y - 14 - p.y) < 16) { hitUnit = e; break; }
        }
      }
      if (hitUnit || p.splash) projHit(p, hitUnit);
      p.life = 0;
    } else {
      p.x += dx / dist * step; p.y += dy / dist * step;
      if (p.kind === 'rocket' && Math.random() < dt * 30)
        GAME.parts.push({ x: p.x, y: p.y, vx: 0, vy: -10, life: .4, maxLife: .4, color: '#9a9a9a', size: 3, grav: 0 });
      if (p.kind === 'spit') p.y += Math.sin(p.life * 10) * 8 * dt;
    }
  }
  GAME.projs = GAME.projs.filter(p => p.life > 0);

  // ===== частицы и текст =====
  for (const pt of GAME.parts) { pt.life -= dt; pt.x += pt.vx * dt; pt.y += pt.vy * dt; pt.vy += pt.grav * dt; }
  GAME.parts = GAME.parts.filter(p => p.life > 0);
  for (const f of GAME.floats) { f.life -= dt; f.y -= 26 * dt; }
  GAME.floats = GAME.floats.filter(f => f.life > 0);

  // предупреждение о базе
  if (GAME.baseWarnT > 0) GAME.baseWarnT -= dt;

  // ===== ИИ =====
  GAME.aiThinkT -= dt;
  if (GAME.aiThinkT <= 0) { aiThink(); GAME.aiThinkT = 0.5 + Math.random() * 0.7; }

  // ===== конец боя =====
  if (GAME.baseHp.p <= 0 || GAME.baseHp.e <= 0 || GAME.time <= 0) {
    GAME.state = 'over';
    finishBattle();
  }
}

// ---------- ИИ противника ----------
function aiThink() {
  const foeRoster = ROSTERS[GAME.foeSide];
  const unlocked = (list) => list.filter(s => tierLevel(s.tier) <= GAME.level.e);
  const mySide = GAME.foeSide;

  // защита, когда прижимают
  const threats = GAME.units.filter(u => u.side === GAME.side && u.state !== 'dead' && u.x > 560).length;
  const freeSlot = GAME.occupied.e.some(s => !s);
  if (threats >= 2 && freeSlot && Math.random() < 0.6) {
    const defs = unlocked(foeRoster.defense).sort((a, b) => b.cost - a.cost);
    for (const d of defs) if (GAME.money.e >= d.cost) { placeDefense(GAME.foeSide, d); return; }
  }
  // ярость
  const baseFrac = GAME.baseHp.e / GAME.baseMax.e;
  if (GAME.rage.e.charge >= 100 && (baseFrac < 0.55 || threats >= 4)) activateRage('e');
  // банк
  if (GAME.bankCd.e <= 0 && GAME.money.e < 260) { GAME.money.e += 400; GAME.bankCd.e = 45; }
  // наём
  const units = unlocked(foeRoster.units);
  const capFree = unitCap(mySide) < GAME.cap;
  if (!capFree) return;
  const affordable = units.filter(s => GAME.money.e >= s.cost && (GAME.cds.e[s.id] || 0) <= 0);
  if (!affordable.length) return;
  // вес: дешёвые чаще, но накопит и на дорогих
  let pool = [];
  for (const s of affordable) {
    const w = Math.pow(s.cost, -0.55) * (GAME.money.e > s.cost * 3 ? 2.2 : 1);
    pool.push({ s, w: w * 100 | 0 });
  }
  const total = pool.reduce((a, b) => a + b.w, 0);
  let r = Math.random() * total;
  for (const it of pool) { r -= it.w; if (r <= 0) { spawnUnit(mySide, it.s); return; } }
}

function activateRage(who) {
  if (GAME.rage[who].charge < 100 || GAME.rage[who].active > 0) return;
  GAME.rage[who].charge = 0;
  GAME.rage[who].active = 8;
  SFX.rage();
  if (who === 'p') {
    chatPush('me', 'Вы', 'ЯРОСТЬ!!! держитесь все');
    floatText(480, ROAD_TOP - 30, 'ЯРОСТЬ!', '#ff5c5c');
  } else {
    chatPush('foe', 'Противник', 'ЯРОСТЬ!!! теперь держись ты');
  }
}

// ---------- действия игрока (вызывает main.js) ----------
function playerSpawn(spec) {
  if (unitCap(GAME.side) >= GAME.cap) { chatSys('Достигнут лимит юнитов!'); return false; }
  return spawnUnit(GAME.side, spec);
}
function playerDefense(spec) { return placeDefense(GAME.side, spec); }
function playerBank() {
  if (GAME.bankCd.p > 0) return;
  GAME.bankCd.p = 45;
  GAME.money.p += 400;
  SFX.coin();
  floatText(120, ROAD_TOP - 30, '+400', '#ffe36a');
  chatSys('БАНК: взят аванс 400 монет.');
}

// ---------- финал ----------
function finishBattle() {
  const pFrac = GAME.baseHp.p / GAME.baseMax.p;
  const eFrac = GAME.baseHp.e / GAME.baseMax.e;
  let win, reason;
  if (GAME.baseHp.e <= 0) { win = true; reason = 'База противника разрушена!'; }
  else if (GAME.baseHp.p <= 0) { win = false; reason = 'Твоя база разрушена...'; }
  else if (pFrac > eFrac) { win = true; reason = 'Время вышло — база противника пострадала сильнее.'; }
  else if (pFrac < eFrac) { win = false; reason = 'Время вышло — твоя база пострадала сильнее.'; }
  else { win = false; reason = 'Ничья по базам — решают очки, и они равны!'; }
  const mp = GAME.mission != null ? CAMPAIGNS[GAME.side][GAME.mission] : null;
  const reward = win ? (mp ? mp.reward : 300) : Math.round(GAME.score / 10);
  GAME.result = { win, reason, reward, mission: GAME.mission, side: GAME.side };
  GAME.score += win ? 1000 : 0;
  localStorage.setItem('zomb_xp', Math.round(GAME.xp.p));
  if (win) SFX.win(); else SFX.lose();
  chatPush(win ? 'me' : 'foe', win ? 'Вы' : 'Противник', win ? 'ну всё, сдавайтесь)' : 'я же говорил!)');
}
