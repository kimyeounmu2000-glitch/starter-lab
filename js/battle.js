(() => {
  "use strict";

  const { moves, attackers, spriteBase, effectSprites } = window.StarterLab.data;

  window.StarterLab.createBattle = ({ specimen, generation, choices }) => {
    const grass = document.querySelector(".encounter-grass");
    const reducedMotion = matchMedia("(prefers-reduced-motion: reduce)");

    const throwButton = document.querySelector("#throw-ball");
    const captureBall = document.querySelector(".capture-ball");
    const captureResult = document.querySelector("#capture-result");
    const maxHP = 20;
    const hpMeter = document.querySelector("#pokemon-hp");
    const hpValue = document.querySelector("#hp-value");
    const battleMessage = document.querySelector("#battle-message");
    const attackEffect = document.querySelector("#attack-effect");

    let hitAnimation;
    let lungeAnimation;

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

    function resetBattleLayout() {
      opponentType = undefined;
      opponent.hidden = true;
      opponentMeter.closest(".opponent-hud").hidden = true;
      setOpponentHP(maxHP);
      playfield.classList.remove("has-opponent");
      playfield.before(hpMeter.closest(".battle-hud"));
    }

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


    async function playMotion(element, frames, duration, iterations = 1, easing = "ease-in-out") {
      if (reducedMotion.matches) return;
      await element.animate(frames, { duration, iterations, easing }).finished;
    }

    async function throwBall() {
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
    }

    async function handleTypeAttack(event) {
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
    }

    function resetForStarter(name) {
      resetBattleLayout();
      selectedName = name;
      captureResult.textContent = "";
      resetHP();
    }

    enableDrag(specimen);
    enableDrag(opponentSprite, -1);
    enableDrag(document.querySelector(".great-ball"));

    return { resetForStarter, throwBall, handleTypeAttack };
  };
})();
