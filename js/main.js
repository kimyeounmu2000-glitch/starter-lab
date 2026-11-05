(() => {
  "use strict";

  const { generations, spriteIds, colors, spriteBase, moves, typeNames, multiplier } = window.StarterLab.data;

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

  const matchupTables = document.querySelector("#matchup-tables");

  const battle = window.StarterLab.createBattle({ specimen, generation, choices });

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

  function selectStarter(index) {
    const types = ["풀", "불꽃", "물"];
    const number = Number(generation.value);
    if (number === 1) types[0] = "풀 / 독";
    if (number === 7) types[0] = "풀 / 비행";

    choices.forEach((choice, position) => choice.setAttribute("aria-pressed", position === index));
    specimen.style.setProperty("--accent", colors[index]);
    const selectedName = generations[number - 1][index];
    const spriteUrl = spriteBase + spriteIds[number - 1][index] + ".png";
    if (sprite.src !== spriteUrl) {
      sprite.hidden = true;
      specimen.classList.remove("has-sprite");
      sprite.alt = selectedName;
      sprite.src = spriteUrl;
    }
    selection.textContent = selectedName + " · " + types[index];
    showMatchups(types[index]);
    battle.resetForStarter(selectedName);
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

  matchupTables.addEventListener("click", battle.handleTypeAttack);
  document.querySelector("#throw-ball").addEventListener("click", battle.throwBall);

  showGeneration();
})();
