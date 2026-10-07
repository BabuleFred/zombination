// ===== Зомбинация: игровые данные =====
// Цены юнитов — в монетах, со скриншотов оригинала (версия 2.0.7.59).

const ROSTERS = {
  human: {
    title: 'Фермеры',
    titleGen: 'Фермеров',
    units: [
      { id:'farmer',   name:'Фермер',    cost:50,   hp:95,  dmg:12, rate:0.9,  range:36,  speed:38, tier:1, kind:'melee' },
      { id:'sheriff',  name:'Шериф',     cost:90,   hp:75,  dmg:16, rate:1.1,  range:180, speed:40, tier:1, kind:'ranged', proj:'bullet' },
      { id:'commando', name:'Коммандос', cost:100,  hp:115, dmg:9,  rate:0.28, range:150, speed:46, tier:2, kind:'ranged', proj:'bullet' },
      { id:'granny',   name:'Бабуля',    cost:250,  hp:210, dmg:26, rate:0.8,  range:36,  speed:36, tier:2, kind:'melee' },
      { id:'bazooka',  name:'Ракетчик',  cost:300,  hp:105, dmg:55, rate:2.2,  range:230, speed:34, tier:2, kind:'ranged', proj:'rocket', splash:45 },
      { id:'tractor',  name:'Трактор',   cost:500,  hp:650, dmg:42, rate:1.2,  range:44,  speed:30, tier:3, kind:'melee', veh:true },
      { id:'smith',    name:'Кузнец',    cost:700,  hp:430, dmg:60, rate:1.0,  range:40,  speed:32, tier:3, kind:'melee' },
      { id:'hunter',   name:'Дед-охотник', cost:1000, hp:165, dmg:130, rate:2.4, range:320, speed:30, tier:4, kind:'ranged', proj:'bullet' },
    ],
    defense: [
      { id:'h_mine',    name:'Мина',     cost:150,  kind:'trap',   dmg:130, cd:6, tier:1 },
      { id:'h_trap',    name:'Капкан',   cost:200,  kind:'trap',   dmg:60,  cd:5, tier:1, hold:2.5 },
      { id:'h_molotov', name:'Коктейль', cost:300,  kind:'trap',   dmg:45,  cd:8, tier:2, fire:true },
      { id:'h_beehive', name:'Улей',     cost:500,  kind:'turret', hp:260, dmg:7,  rate:0.3,  range:170, tier:2 },
      { id:'h_mg',      name:'Пулемёт',  cost:900,  kind:'turret', hp:360, dmg:10, rate:0.16, range:220, tier:3 },
      { id:'h_scare',   name:'Пугало',   cost:1500, kind:'turret', hp:320, dmg:38, rate:0.8,  range:280, tier:4 },
    ],
    baseHp: 5000,
  },

  zombie: {
    title: 'Зомби',
    titleGen: 'Зомби',
    units: [
      { id:'crawler', name:'Ползун',   cost:36,   hp:65,  dmg:8,  rate:0.7,  range:32,  speed:62, tier:1, kind:'melee' },
      { id:'zombik',  name:'Зомби',    cost:45,   hp:105, dmg:13, rate:0.9,  range:34,  speed:40, tier:1, kind:'melee' },
      { id:'spitter', name:'Плевун',   cost:180,  hp:95,  dmg:18, rate:1.3,  range:170, speed:36, tier:2, kind:'ranged', proj:'spit' },
      { id:'brute',   name:'Громила',  cost:360,  hp:490, dmg:45, rate:1.1,  range:40,  speed:30, tier:2, kind:'melee' },
      { id:'hearse',  name:'Катафалк', cost:405,  hp:620, dmg:38, rate:1.2,  range:46,  speed:30, tier:3, kind:'melee', veh:true },
      { id:'fattie',  name:'Толстяк',  cost:405,  hp:720, dmg:30, rate:1.0,  range:36,  speed:22, tier:3, kind:'melee' },
      { id:'vampire', name:'Кровосос', cost:900,  hp:380, dmg:70, rate:0.9,  range:38,  speed:55, tier:3, kind:'melee', lifesteal:0.5 },
      { id:'reaper',  name:'Жнец',     cost:1350, hp:520, dmg:110, rate:1.1, range:52, speed:34, tier:4, kind:'melee' },
    ],
    defense: [
      { id:'z_bones',  name:'Кости-шипы',   cost:150,  kind:'trap',   dmg:65,  cd:5, tier:1 },
      { id:'z_claws',  name:'Когти',        cost:200,  kind:'trap',   dmg:80,  cd:5, tier:1, hold:2 },
      { id:'z_press',  name:'Гиря',         cost:500,  kind:'trap',   dmg:140, cd:7, tier:2 },
      { id:'z_mine',   name:'Мина-могила',  cost:1000, kind:'trap',   dmg:220, cd:9, tier:2 },
      { id:'z_skull',  name:'Башня черепов', cost:1600, kind:'turret', hp:420, dmg:14, rate:0.2, range:240, tier:3 },
      { id:'z_mosq',   name:'Рой комаров',  cost:2000, kind:'turret', hp:280, dmg:9,  rate:0.14, range:200, tier:4, slow:0.5 },
    ],
    baseHp: 5000,
  },
};

// Пороги опыта для уровней (уровень = индекс+1)
const LEVEL_XP = [0, 120, 320, 700, 1300, 2200, 3600, 5600];

function levelFromXp(xp) {
  let lvl = 1;
  for (let i = 1; i < LEVEL_XP.length; i++) if (xp >= LEVEL_XP[i]) lvl = i + 1;
  return Math.min(lvl, LEVEL_XP.length);
}
function xpProgress(xp) {
  const lvl = levelFromXp(xp);
  if (lvl >= LEVEL_XP.length) return 1;
  const cur = LEVEL_XP[lvl - 1], next = LEVEL_XP[lvl];
  return (xp - cur) / (next - cur);
}

// ===== Кампания: по 7 миссий на расу (названия со скриншотов оригинала) =====
const CAMPAIGNS = {
  zombie: [
    { name:'Первый рубеж',      text:'НАНЕСЕМ МОЩНЫЙ УДАР ПО МЕРЗКИМ ЛЮДИШКАМ! Используй всю боевую мощь заброшенного кладбища!', eInc:0.55, eHp:0.75, reward:120 },
    { name:'Заброшенный гараж', text:'Здесь ржавые тракторы и старые кузова. Пугай фермеров так, чтобы штаны меняли!',            eInc:0.70, eHp:0.84, reward:240 },
    { name:'Дедова кузня',      text:'Дед ковал гвозди для гробов. Теперь скуём таран для ворот фермы!',                          eInc:0.86, eHp:0.93, reward:360 },
    { name:'Адово болото',      text:'Топко, вонюче, зелено — наши условия идеальны. Иди и грызи!',                               eInc:1.02, eHp:1.02, reward:480 },
    { name:'Старый склад',      text:'Консервы кончились. На складе пахнет мозгами. Твоими!',                                     eInc:1.18, eHp:1.11, reward:600 },
    { name:'Башня призраков',   text:'Скелеты в шкафу? У нас целая башня! Время страшной сказки.',                                eInc:1.34, eHp:1.20, reward:720 },
    { name:'Последний отпор',   text:'Ферма вот-вот наша. Ни один колышек больше не встанет между нами и мозгами!',               eInc:1.52, eHp:1.30, reward:1000 },
  ],
  human: [
    { name:'Вторжение',       text:'Зомби лезут с кладбища! Вилы наголо, фермеры, за меня!',            eInc:0.55, eHp:0.75, reward:120 },
    { name:'Крепкий бронь',   text:'Почини забор, заряди ружьё. Ферма выстоит!',                        eInc:0.70, eHp:0.84, reward:240 },
    { name:'Горячие головы',  text:'Бабуля уже точит биту. Пусть мертвецы попробуют наш борщ!',         eInc:0.86, eHp:0.93, reward:360 },
    { name:'Старая гвардия',  text:'Дед-охотник вышел на балкон. Стреляет раз в год — зато метко!',     eInc:1.02, eHp:1.02, reward:480 },
    { name:'Три богатыря',    text:'Трактор, кузнец и шериф — наш ответ зомби-апокалипсису!',           eInc:1.18, eHp:1.11, reward:600 },
    { name:'Опасно гля!',     text:'Их больше, но у нас силосы полны. Держим строй!',                   eInc:1.34, eHp:1.20, reward:720 },
    { name:'Вкус победы',     text:'Последний рывок: кладбище замолчит навсегда. За ферму!',            eInc:1.52, eHp:1.30, reward:1000 },
  ],
};

const DIFF = {
  easy:   { income: 0.8, aiHp: 0.85, name: 'Легко' },
  normal: { income: 1.0, aiHp: 1.0,  name: 'Норма' },
  hard:   { income: 1.3, aiHp: 1.15, name: 'Хардкор' },
};

// Реплики чата в духе оригинала
const CHAT_LINES = [
  'даджники там много таких',
  'ты по на аре?',
  'я в машине белый салон кожаный',
  'танки в поле не воюют)',
  'у меня трактор сейчас поедет)',
  'ну всё, тебе конец',
  'щас пчёл выпущу, беги',
  'моя бабуля биту точит',
  'зомби жрут мозги, а у тебя запасные?)',
  '28 минут на часах, а ты уже потеешь',
  'не плачь, это всего лишь игра',
  'мой кузнец кует и твою башку',
  'шериф уже зарядил, беги давай',
  'кто победит — тот и прав)',
  'где деньги, Лебовски?',
  'жнец идёт, прячь ферму',
  'у меня план: нажать на все кнопки',
  'это будет легендарная замес',
  'база знаний говорит: ты проиграл',
  'ползуны уже в пути, готовь вилы',
  'ладно, ну всё, сдавайтесь)',
];

const EVENT_LINES = {
  endgame: [ 'ну всё, я сливаюсь, извините', 'вы читер? нет? ладно(', 'время поджимает, дави базу!', 'последняя минута, держим кулаки' ],
};
