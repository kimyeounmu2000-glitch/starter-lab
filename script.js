const generations = [
  ["이상해씨", "파이리", "꼬부기"],
  ["치코리타", "브케인", "리아코"],
  ["나무지기", "아차모", "물짱이"],
  ["모부기", "불꽃숭이", "팽도리"],
  ["주리비얀", "뚜꾸리", "수댕이"],
  ["도치마론", "푸호꼬", "개구마르"],
  ["나몰빼미", "냐오불", "누리공"],
  ["흥나숭", "염버니", "울머기"],
  ["나오하", "뜨아거", "꾸왁스"],
];

const spriteIds = [
  [1, 4, 7], [152, 155, 158], [252, 255, 258],
  [387, 390, 393], [495, 498, 501], [650, 653, 656],
  [722, 725, 728], [810, 813, 816], [906, 909, 912],
];

const choices = document.querySelectorAll(".choices button");
const specimen = document.querySelector(".specimen");
const sprite = document.querySelector(".starter-sprite");

sprite.addEventListener("load", () => {
  sprite.hidden = false;
  specimen.classList.add("has-sprite");
});

const selection = document.querySelector("#selection");
const generation = document.querySelector("#generation");
const generationLabel = document.querySelector("#generation-label");
const colors = ["#46805d", "#ca5739", "#437da7"];
const throwButton = document.querySelector("#throw-ball");
const captureBall = document.querySelector(".capture-ball");
const captureResult = document.querySelector("#capture-result");
const maxHP = 20;
const hpMeter = document.querySelector("#pokemon-hp");
const hpValue = document.querySelector("#hp-value");
const battleMessage = document.querySelector("#battle-message");
const attackEffect = document.querySelector("#attack-effect");
const matchupTables = document.querySelector("#matchup-tables");
const moves = {
  노말: ["몸통박치기", "#766857", "impact"],
  불꽃: ["불꽃세례", "#d43819", "burst"],
  물: ["물대포", "#156cc7", "stream"],
  전기: ["방전", "#a56a00", "burst"],
  풀: ["나뭇잎", "#248437", "stream"],
  얼음: ["싸라기눈", "#168194", "fall"],
  격투: ["바위깨기", "#a6442e", "impact"],
  독: ["맹독엄니", "#922dae", "bite"],
  땅: ["진흙뿌리기", "#83502f", "fall"],
  비행: ["날개치기", "#596fba", "stream"],
  에스퍼: ["사념의 박치기", "#bb2b73", "pulse"],
  벌레: ["엉겨붙기", "#61791d", "pulse"],
  바위: ["돌떨구기", "#826026", "fall"],
  고스트: ["핥기", "#624291", "stream"],
  드래곤: ["용의 파동", "#5146ae", "pulse"],
  악: ["물기", "#42323e", "bite"],
  강철: ["아이언테일", "#526475", "impact"],
  페어리: ["드레인키스", "#bc397e", "pulse"],
};
const attackers = {
  물: ["잉어킹", 129], 풀: ["모다피", 69], 땅: ["탕구리", 104],
  바위: ["꼬마돌", 74], 강철: ["무장조", 227], 노말: ["파오리", 83],
  불꽃: ["가디", 58], 전기: ["피카츄", 25], 얼음: ["쥬쥬", 86],
  격투: ["근육몬", 67], 에스퍼: ["캐이시", 63], 고스트: ["팬텀", 94],
  악: ["포푸니", 215], 페어리: ["님피아", 700], 독: ["질퍽이", 88],
  비행: ["구구", 16], 벌레: ["뿔충이", 13], 드래곤: ["미뇽", 147],
};
const spriteBase = "https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/";
let hitAnimation;
let lungeAnimation;
const effectSprites = {
  노말: "0001000/0011100/0102010/1112111/0122210/0011100/0001000",
  불꽃: "0001000/0011100/0011200/0112210/1122210/1122211/0111110",
  물: "0001000/0011100/0012100/0112210/1122111/1111111/0111110",
  전기: "0000110/0001100/0011200/0111110/0002100/0011000/0110000",
  풀: "0000111/0011221/0112210/1122110/1221100/1110000/1000000",
  얼음: "1001001/0101010/0011100/1112111/0011100/0101010/1001001",
  격투: "0111100/1122110/1211111/1110111/1101121/0111110/0011100",
  독: "1100011/1210121/1210121/1210121/0110110/0100010/0001000",
  땅: "0000010/0010111/0111010/1121100/1111110/0111000/0100000",
  비행: "0000111/0001120/0011220/0112210/1122100/1111000/1010000",
  에스퍼: "0011100/0112110/1122211/1211121/1122211/0112110/0011100",
  벌레: "1001001/0101010/0011100/1112111/0011100/0101010/1001001",
  바위: "0011100/0112110/1122111/1111111/1111111/0111110/0011100",
  고스트: "0111100/1122110/1222111/1222211/0122210/0011100/0000000",
  드래곤: "0001000/0012100/0122210/1222221/0122210/0012100/0001000",
  악: "1111111/1212121/0101010/0000000/0101010/1212121/1111111",
  강철: "0000011/0000121/0001220/0012200/0122000/1220000/1100000",
  페어리: "0110110/1221221/1222221/0122210/0012100/0001000/0000000",
};
let hp = maxHP;
let opponentHP = maxHP;
let opponentType;
let enteringBattle = false;
const opponent = document.querySelector(".opponent");
const opponentSprite = document.querySelector(".opponent-sprite");
const opponentMeter = document.querySelector("#opponent-hp");
const opponentValue = document.querySelector("#opponent-hp-value");
const playfield = document.querySelector(".playfield");

function healthColor(value) {
  const ratio = value / maxHP;
  return ratio <= 0.1 ? "critical" : ratio <= 0.5 ? "warning" : "safe";
}

function setOpponentHP(value) {
  opponentHP = value;
  opponentMeter.value = value;
  opponentValue.textContent = value + " / " + maxHP;
  opponentMeter.dataset.health = healthColor(value);
  opponentSprite.classList.toggle("is-fainted", value === 0);
}

async function selectOpponent(type) {
  if (type === opponentType) return;
  const firstEntrance = opponent.hidden;
  opponentType = type;
  const [name, id] = attackers[type];
  opponentSprite.alt = name;
  opponentSprite.src = spriteBase + id + ".png";
  opponent.hidden = false;
  opponentMeter.closest(".opponent-hud").hidden = false;
  if (!playfield.classList.contains("has-opponent")) {
    playfield.append(hpMeter.closest(".battle-hud"));
    playfield.classList.add("has-opponent");
  }
  setOpponentHP(maxHP);
  if (reducedMotion.matches) return;

  const timing = { duration: 1300, easing: "cubic-bezier(0.22, 1, 0.36, 1)" };
  const animations = [opponent.animate([
    { transform: "translate(-165%, -50%)", opacity: 0 },
    { transform: "translate(-50%, -50%)", opacity: 1 },
  ], timing)];
  if (firstEntrance) {
    animations.push(specimen.animate([
      { left: "50%", top: "50%" },
      { left: "74%", top: "33%" },
    ], timing));
  }

  enteringBattle = true;
  playfield.classList.add("is-entering");
  try {
    await Promise.allSettled(animations.map((animation) => animation.finished));
  } finally {
    enteringBattle = false;
    playfield.classList.remove("is-entering");
  }
}

function setHP(value) {
  hp = value;
  hpMeter.value = hp;
  hpValue.textContent = hp + " / " + maxHP;
  hpMeter.dataset.health = healthColor(hp);
  specimen.classList.toggle("is-fainted", hp === 0);
  throwButton.disabled = hp === 0;
}

function resetHP() {
  hitAnimation?.cancel();
  lungeAnimation?.cancel();
  setHP(maxHP);
  battleMessage.textContent = "";
  attackEffect.replaceChildren();
}

function showAttack(type, damage, outgoing) {
  const [, color, motion] = moves[type];
  attackEffect.replaceChildren();
  hitAnimation?.cancel();
  lungeAnimation?.cancel();
  if (reducedMotion.matches) return;

  const source = outgoing ? specimen : opponentSprite;
  const target = outgoing ? opponentSprite : specimen;
  const scene = document.createElement("div");
  scene.className = outgoing ? "attack-scene is-outgoing" : "attack-scene";
  attackEffect.append(scene);
  lungeAnimation = source.animate([
    { translate: "0" },
    { translate: outgoing ? "-1.6rem 0.6rem" : "1.6rem -0.6rem", offset: 0.45 },
    { translate: "0" },
  ], { duration: 420, easing: "steps(8, end)", composite: "add" });
  const effect = document.createElement("div");
  effect.className = "attack-particles " + motion;
  const sprite = document.createElement("canvas");
  sprite.width = sprite.height = 7;
  const paint = sprite.getContext("2d");
  const palette = ["transparent", color, "#fff2b8"];
  effectSprites[type].split("/").forEach((row, y) => {
    [...row].forEach((pixel, x) => {
      paint.fillStyle = palette[Number(pixel)];
      paint.fillRect(x, y, 1, 1);
    });
  });
  for (let index = 0; index < 3; index += 1) {
    const particle = index === 0 ? sprite : sprite.cloneNode();
    if (index > 0) particle.getContext("2d").drawImage(sprite, 0, 0);
    effect.append(particle);
  }
  scene.append(effect);
  if (damage) {
    const impact = document.createElement("div");
    impact.className = "pixel-hit";
    const spark = document.createElement("span");
    spark.className = "pixel-hit-spark";
    impact.append(spark);
    scene.append(impact);
    effect.addEventListener("animationend", () => scene.remove(), { once: true });
    const restingOpacity = (outgoing ? opponentHP : hp) === 0 ? 0.45 : 1;
    hitAnimation = target.animate([
      { opacity: restingOpacity, offset: 0 },
      { opacity: 0.08, offset: 0.2 },
      { opacity: restingOpacity, offset: 0.4 },
      { opacity: 0.08, offset: 0.65 },
      { opacity: restingOpacity, offset: 1 },
    ], { duration: 320, delay: 330, easing: "steps(2, end)" });
  } else {
    effect.addEventListener("animationend", () => scene.remove(), { once: true });
  }
}
let selectedName;
let drag = null;

const typeNames = "노말 불꽃 물 전기 풀 얼음 격투 독 땅 비행 에스퍼 벌레 바위 고스트 드래곤 악 강철 페어리".split(" ");
// 선택 가능한 기본형 타입의 상성. 각 행은 공격 또는 방어 방향입니다.
const damageRelations = {
  풀: {
    attack: { 2: "물 땅 바위", 0.5: "불꽃 풀 독 비행 벌레 드래곤 강철" },
    defense: { 2: "불꽃 얼음 독 비행 벌레", 0.5: "물 전기 풀 땅" },
  },
  독: {
    attack: { 2: "풀 페어리", 0.5: "독 땅 바위 고스트", 0: "강철" },
    defense: { 2: "땅 에스퍼", 0.5: "풀 격투 독 벌레 페어리" },
  },
  불꽃: {
    attack: { 2: "풀 얼음 벌레 강철", 0.5: "불꽃 물 바위 드래곤" },
    defense: { 2: "물 땅 바위", 0.5: "불꽃 풀 얼음 벌레 강철 페어리" },
  },
  물: {
    attack: { 2: "불꽃 땅 바위", 0.5: "물 풀 드래곤" },
    defense: { 2: "전기 풀", 0.5: "불꽃 물 얼음 강철" },
  },
  비행: {
    attack: { 2: "풀 격투 벌레", 0.5: "전기 바위 강철" },
    defense: { 2: "전기 얼음 바위", 0.5: "풀 격투 벌레", 0: "땅" },
  },
};

function multiplier(type, direction, opposingType) {
  const match = Object.entries(damageRelations[type][direction])
    .find(([, names]) => names.split(" ").includes(opposingType));
  return match ? Number(match[0]) : 1;
}

function matchupTable(title, getMultiplier, attackType = "") {
  const rows = [4, 2, 1, 0.5, 0.25, 0].map((factor) => {
    const matches = typeNames.filter((type) => getMultiplier(type) === factor);
    if (!matches.length) return "";
    const types = matches.map((type) => {
      const moveType = attackType || type;
      return '<button type="button" class="type-attack" data-type="' + type
        + '" data-factor="' + factor + '" data-move-type="' + moveType + '"'
        + (attackType ? ' data-outgoing="true"' : '')
        + ' title="' + moves[moveType][0] + '">' + type + '</button>';
    }).join(" ");
    return '<tr><th scope="row">×' + factor + '</th><td>' + types + '</td></tr>';
  });
  return '<table><caption>' + title + '</caption><thead><tr><th scope="col">배율</th><th scope="col">상대 타입</th></tr></thead><tbody>' + rows.join("") + '</tbody></table>';
}

function showMatchups(typeLabel) {
  const types = typeLabel.split(" / ");
  const defense = matchupTable("방어 · 받는 피해", (attacker) =>
    types.reduce((total, type) => total * multiplier(type, "defense", attacker), 1));
  const attacks = types.map((type) => matchupTable("공격 · " + type + " 기술", (defender) =>
    multiplier(type, "attack", defender), type));
  matchupTables.innerHTML =
    '<div class="defense-matchups">' + defense + '</div>' +
    '<div class="attack-matchups">' + attacks.join("") + '</div>';
}

function resetBattleLayout() {
  opponentType = undefined;
  opponent.hidden = true;
  opponentMeter.closest(".opponent-hud").hidden = true;
  setOpponentHP(maxHP);
  playfield.classList.remove("has-opponent");
  playfield.before(hpMeter.closest(".battle-hud"));
}

function selectStarter(index) {
  resetBattleLayout();
  const types = ["풀", "불꽃", "물"];
  const number = Number(generation.value);
  if (number === 1) types[0] = "풀 / 독";
  if (number === 7) types[0] = "풀 / 비행";

  choices.forEach((choice, position) => choice.setAttribute("aria-pressed", position === index));
  specimen.style.setProperty("--accent", colors[index]);
  selectedName = generations[number - 1][index];
  const spriteUrl = spriteBase + spriteIds[number - 1][index] + ".png";
  if (sprite.src !== spriteUrl) {
    sprite.hidden = true;
    specimen.classList.remove("has-sprite");
    sprite.alt = selectedName;
    sprite.src = spriteUrl;
  }
  selection.textContent = selectedName + " · " + types[index];
  captureResult.textContent = "";
  showMatchups(types[index]);
  resetHP();
}

function showGeneration() {
  const number = Number(generation.value);
  generationLabel.textContent = "GENERATION " + String(number).padStart(2, "0");
  choices.forEach((choice, index) => {
    choice.textContent = generations[number - 1][index];
  });
  selectStarter(0);
}

choices.forEach((choice, index) => {
  choice.addEventListener("click", () => selectStarter(index));
});
generation.addEventListener("change", showGeneration);

showGeneration();
function enableDrag(fighter, horizontalDirection = 1) {
  const inBattlefield = playfield.contains(fighter);
  fighter.addEventListener("pointerdown", (event) => {
    if (drag || event.button !== 0) return;
    if (inBattlefield && (enteringBattle || throwButton.disabled)) return;
    fighter.setPointerCapture(event.pointerId);
    const transform = getComputedStyle(fighter).transform;
    const { m41, m42 } = new DOMMatrixReadOnly(transform === "none" ? "" : transform);
    drag = { id: event.pointerId, x: event.clientX - m41 * horizontalDirection, y: event.clientY - m42 };
    fighter.style.transform = "translate(" + m41 + "px, " + m42 + "px)";
    fighter.classList.add("is-dragging");
  });

  fighter.addEventListener("pointermove", (event) => {
    if (drag?.id !== event.pointerId) return;
    const x = (event.clientX - drag.x) * horizontalDirection;
    const y = event.clientY - drag.y;
    fighter.style.transform = "translate(" + x + "px, " + y + "px)";
  });

  function endDrag(event) {
    if (drag?.id !== event.pointerId) return;
    drag = null;
    fighter.classList.remove("is-dragging");
    fighter.style.transform = "";
  }

  fighter.addEventListener("pointerup", endDrag);
  fighter.addEventListener("pointercancel", endDrag);
  fighter.addEventListener("lostpointercapture", endDrag);
}

enableDrag(specimen);
enableDrag(opponentSprite, -1);
enableDrag(document.querySelector(".great-ball"));

const grass = document.querySelector(".encounter-grass");
const reducedMotion = matchMedia("(prefers-reduced-motion: reduce)");

async function playMotion(element, frames, duration, iterations = 1, easing = "ease-in-out") {
  if (reducedMotion.matches) return;
  await element.animate(frames, { duration, iterations, easing }).finished;
}

throwButton.addEventListener("click", async () => {
  if (enteringBattle || drag || throwButton.disabled) return;
  hitAnimation?.cancel();
  lungeAnimation?.cancel();
  attackEffect.replaceChildren();
  throwButton.disabled = true;
  generation.disabled = true;
  choices.forEach((choice) => { choice.disabled = true; });
  captureResult.textContent = selectedName + "에게 몬스터볼을 던졌어요…";
  captureBall.hidden = false;

  try {
    await playMotion(captureBall, [
      { transform: "translate(-50%, 7rem) rotate(-240deg)" },
      { transform: "translate(-50%, -4rem) rotate(-90deg)", offset: 0.6 },
      { transform: "translate(-50%, -50%)" },
    ], 600);

    await playMotion(specimen, [
      { scale: "1", opacity: 1 },
      { scale: "0.35", opacity: 0.85, filter: "brightness(2)", offset: 0.65 },
      { scale: "0", opacity: 0 },
    ], 260);
    specimen.classList.add("is-in-ball");
    captureResult.textContent = "볼이 흔들리고 있어요…";
    await playMotion(captureBall, [
      { translate: "0", rotate: "0deg", offset: 0 },
      { translate: "0", rotate: "0deg", offset: 0.58 },
      { translate: "-5px", rotate: "-5deg", offset: 0.65 },
      { translate: "5px", rotate: "5deg", offset: 0.75 },
      { translate: "0", rotate: "0deg", offset: 0.83 },
      { translate: "0", rotate: "0deg", offset: 1 },
    ], 1080, 3, "steps(30, end)");
    const ratio = hp / maxHP;
    const captureChance = ratio <= 0.1 ? 0.8 : ratio <= 0.5 ? 0.6 : 0.45;
    const caught = Math.random() < captureChance;
    if (caught) {
      captureBall.classList.add("is-caught");
      captureResult.textContent = "포획 성공! " + selectedName + "을(를) 잡았어요.";
      await new Promise((resolve) => setTimeout(resolve, 850));
      captureBall.hidden = true;
      if (!opponent.hidden) {
        playfield.classList.add("is-entering");
        await playMotion(opponent, [
          { transform: "translate(-50%, -50%)", opacity: 1 },
          { transform: "translate(-175%, -50%)", opacity: 0 },
        ], 1000);
        playfield.classList.remove("is-entering");
        resetBattleLayout();
      }
      grass.classList.add("is-rustling");
      await playMotion(grass, [
        { scale: "1" },
        { scale: "1.1 0.8" },
        { scale: "0.96 1.1" },
        { scale: "1" },
      ], 220, 2);
      specimen.classList.remove("is-in-ball");
      await playMotion(specimen, [
        { translate: "0 48px", scale: "0.4", opacity: 0 },
        { translate: "0 -16px", scale: "1", opacity: 1, offset: 0.72 },
        { translate: "0 0", scale: "1", opacity: 1 },
      ], 460);
      resetHP();
      captureResult.textContent = "포획 성공! 풀숲에서 또 다른 " + selectedName + "이(가) 나타났어요.";
    } else {
      captureBall.hidden = true;
      specimen.classList.remove("is-in-ball");
      await playMotion(specimen, [
        { scale: "0.1", opacity: 0 },
        { scale: "1", opacity: 1 },
      ], 280);
      captureResult.textContent = selectedName + "이(가) 볼에서 나왔어요. 다시 던져보세요!";
    }
  } finally {
    captureBall.hidden = true;
    captureBall.classList.remove("is-caught");
    specimen.classList.remove("is-in-ball");
    grass.classList.remove("is-rustling");
    throwButton.disabled = false;
    generation.disabled = false;
    choices.forEach((choice) => { choice.disabled = false; });
  }
});











matchupTables.addEventListener("click", async (event) => {
  const button = event.target.closest(".type-attack");
  if (!button || enteringBattle || drag || (throwButton.disabled && hp > 0)) return;
  if (hp === 0) {
    battleMessage.textContent = "기절했어요. 스타팅 포켓몬을 다시 선택해 주세요.";
    return;
  }

  const { type, factor, moveType, outgoing } = button.dataset;
  const starterAtSelection = selectedName;
  await selectOpponent(type);
  if (selectedName !== starterAtSelection || opponentType !== type) return;
  if (opponentHP === 0) {
    battleMessage.textContent = "공격자가 기절했어요. 다른 타입을 선택해 주세요.";
    return;
  }

  const baseDamage = Math.round(5 * Number(factor));
  const damage = Math.min(outgoing ? opponentHP : hp, baseDamage);
  if (outgoing) {
    setOpponentHP(opponentHP - damage);
  } else {
    setHP(hp - damage);
  }
  showAttack(moveType, damage, Boolean(outgoing));
  const fainted = outgoing ? opponentHP === 0 : hp === 0;
  battleMessage.textContent = moves[moveType][0] + (damage
    ? (fainted ? " · 기절!" : "")
    : " · 효과가 없어요.");
});














