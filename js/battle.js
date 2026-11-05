(() => {
  "use strict";

  const { moves, attackers, spriteBase } = window.StarterLab.data;

  // Each glyph is a 3 × 5 bitmap, ordered from 0 to 9, then slash.
  const healthGlyphs = [
    "111101101101111", "010110010010111", "111001111100111", "111001111001111",
    "101101111001001", "111100111001111", "111100111101111", "111001010010010",
    "111101111101111", "111101111001111", "001001010100100",
  ];
  const healthSprites = new Map();

  function healthSprite(text) {
    if (!healthSprites.has(text)) {
      let path = "";
      let width = 0;
      for (const character of text) {
        if (character === " ") {
          width += 2;
          continue;
        }
        const glyph = healthGlyphs[character === "/" ? 10 : Number(character)];
        [...glyph].forEach((pixel, index) => {
          if (pixel === "1") path += "M" + (width + index % 3 + 1) + " " + (Math.floor(index / 3) + 1) + "h1v1h-1z";
        });
        width += 4;
      }
      const svg = '<svg xmlns="http://www.w3.org/2000/svg" width="' + (width + 1) * 2
        + '" height="14" viewBox="0 0 ' + (width + 1) + ' 7" shape-rendering="crispEdges">'
        + '<path d="' + path + '" stroke="#202127" stroke-width="0.8" fill="white"/></svg>';
      healthSprites.set(text, 'url("data:image/svg+xml,' + encodeURIComponent(svg) + '")');
    }
    return healthSprites.get(text);
  }

  const { prepare, isAdaptation } = window.StarterLab.moveEffects;

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
    const effectStyle = document.querySelector("#effect-style");

    let activeAttack;

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

    function renderHealth(meter, label, value) {
      meter.value = value;
      meter.dataset.health = healthColor(value);
      const text = value + " / " + maxHP;
      if (label.dataset.pixelHealth === text) return;
      label.textContent = text;
      label.dataset.pixelHealth = text;
      label.style.backgroundImage = healthSprite(text);
    }

    function setOpponentHP(value) {
      opponentHP = value;
      renderHealth(opponentMeter, opponentValue, value);
      opponentSprite.classList.toggle("is-fainted", value === 0);
    }

    async function selectOpponent(type, signal) {
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

      const cancelEntrance = () => animations.forEach((animation) => animation.cancel());
      signal.addEventListener("abort", cancelEntrance, { once: true });
      enteringBattle = true;
      playfield.classList.add("is-entering");
      try {
        await Promise.allSettled(animations.map((animation) => animation.finished));
      } finally {
        signal.removeEventListener("abort", cancelEntrance);
        enteringBattle = false;
        playfield.classList.remove("is-entering");
      }
    }

    function setHP(value) {
      hp = value;
      renderHealth(hpMeter, hpValue, hp);
      specimen.classList.toggle("is-fainted", hp === 0);
      throwButton.disabled = hp === 0;
    }

    function resetHP() {
      setHP(maxHP);
      battleMessage.textContent = "";
      attackEffect.replaceChildren();
    }

    function animateAttack(element, frames, duration, signal, options = {}) {
      const animation = element.animate(frames, { duration, easing: "steps(8, end)", ...options });
      const cancel = () => animation.cancel();
      signal.addEventListener("abort", cancel, { once: true });
      return animation.finished.catch((error) => {
        if (!signal.aborted) throw error;
      }).finally(() => signal.removeEventListener("abort", cancel));
    }

    async function showAttack(type, damage, outgoing, style, signal) {
      if (reducedMotion.matches) return;
      const source = outgoing ? specimen : opponentSprite;
      const target = outgoing ? opponentSprite : specimen;
      const scene = document.createElement("div");
      scene.className = outgoing ? "attack-scene is-outgoing" : "attack-scene";
      attackEffect.append(scene);

      const origin = source.getBoundingClientRect();
      const destination = target.getBoundingClientRect();
      const dx = origin.left + origin.width / 2 - destination.left - destination.width / 2;
      const dy = origin.top + origin.height / 2 - destination.top - destination.height / 2;
      const bounds = scene.getBoundingClientRect();
      const x = destination.left + destination.width / 2 - bounds.left;
      const y = destination.top + destination.height / 2 - bounds.top;
      const frames = prepare(type, style, scene, x, y, dx, dy, signal);

      try {
        await frames.flight();
        if (signal.aborted || !damage) return;

        const hit = animateAttack(target, [
          { filter: "brightness(2.4)", opacity: 1, offset: 0 },
          { filter: "brightness(1)", opacity: 0.2, offset: 0.23 },
          { filter: "brightness(1)", opacity: 1, offset: 0.43 },
          { filter: "brightness(1)", opacity: 0.2, offset: 0.62 },
          { filter: "brightness(1)", opacity: 1, offset: 0.82 },
          { filter: "brightness(1)", opacity: 1, offset: 1 },
        ], 145, signal, { composite: "add" });
        await Promise.all([hit, frames.impact()]);
      } finally {
        scene.remove();
      }
    }

    async function animateHealth(meter, label, from, to, signal) {
      if (reducedMotion.matches || from === to || signal.aborted) return;
      const start = performance.now();
      await new Promise((resolve) => {
        let frame;
        function finish() {
          cancelAnimationFrame(frame);
          signal.removeEventListener("abort", finish);
          resolve();
        }
        function update(now) {
          const progress = Math.min(1, (now - start) / 260);
          const value = Math.ceil(from + (to - from) * progress);
          renderHealth(meter, label, value);
          if (progress === 1) finish();
          else frame = requestAnimationFrame(update);
        }
        signal.addEventListener("abort", finish, { once: true });
        frame = requestAnimationFrame(update);
      });
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
        if (inBattlefield && (activeAttack || enteringBattle || throwButton.disabled)) return;
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
      if (activeAttack || enteringBattle || drag || throwButton.disabled) return;
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
      if (!button || activeAttack || enteringBattle || drag || (throwButton.disabled && hp > 0)) return;
      if (hp === 0) {
        battleMessage.textContent = "기절했어요. 스타팅 포켓몬을 다시 선택해 주세요.";
        return;
      }

      const { type, factor, moveType, outgoing } = button.dataset;
      const controller = new AbortController();
      const { signal } = controller;
      activeAttack = controller;
      try {
        await selectOpponent(type, signal);
        if (signal.aborted) return;
        if (opponentHP === 0) {
          battleMessage.textContent = "공격자가 기절했어요. 다른 타입을 선택해 주세요.";
          return;
        }

        const currentHP = outgoing ? opponentHP : hp;
        const damage = Math.min(currentHP, Math.round(5 * Number(factor)));
        const nextHP = currentHP - damage;
        const [move] = moves[moveType];
        const style = effectStyle.value;
        const adaptation = isAdaptation(moveType, style) ? " · 창작 대체 연출" : "";
        battleMessage.textContent = move + "!" + adaptation;
        await showAttack(moveType, damage, Boolean(outgoing), style, signal);
        if (signal.aborted) return;

        // Keep gameplay HP authoritative while the visible meter counts down.
        if (outgoing) opponentHP = nextHP;
        else hp = nextHP;
        await animateHealth(outgoing ? opponentMeter : hpMeter, outgoing ? opponentValue : hpValue,
          currentHP, nextHP, signal);
        if (signal.aborted) return;
        if (outgoing) setOpponentHP(nextHP);
        else setHP(nextHP);

        battleMessage.textContent = move + (damage
          ? (nextHP === 0 ? " · 기절!" : "")
          : " · 효과가 없어요.") + adaptation;
      } finally {
        if (activeAttack === controller) activeAttack = undefined;
      }
    }

    function resetForStarter(name) {
      activeAttack?.abort();
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
