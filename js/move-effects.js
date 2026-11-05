(() => {
  "use strict";
  const scriptUrl = document.currentScript.src;
  const tile = 48;
  const styles = {
    "gold-silver": { flight: 4, impact: 3, generation: 2 },
    "diamond-pearl": { flight: 7, impact: 5, generation: 4 },
    "black-white": { flight: 10, impact: 7, generation: 5 },
  };
  // Sheet rows follow this order. Angles and heights describe the projectile path.
  const moves = {
    노말: { reach: 0.15 }, 불꽃: { reach: 0.25, duration: 180 }, 물: { duration: 240, beam: true },
    전기: { reach: 0, duration: 175 },
    풀: { wave: 18, cycles: 1, duration: 260, since: 7 },
    얼음: { reach: 0, fall: 65 }, 격투: { reach: 0, fall: 20 },
    독: { reach: 0.12, since: 3 }, 땅: { arc: 48 }, 비행: { reach: 0.15 },
    에스퍼: { beam: true }, 벌레: {},
    바위: { reach: 0, fall: 85 }, 고스트: { reach: 0, fall: -25 },
    드래곤: { beam: true, since: 4 }, 악: { reach: 0.08 },
    강철: { reach: 0.2 }, 페어리: { reach: 0, since: 6 },
  };
  const rows = Object.keys(moves);
  const sheets = new Map();
  function loadSheet(style) {
    if (!sheets.has(style)) {
      const image = new Image();
      image.src = new URL("../assets/effects/" + style + "/moves.png?v=move-art-2", scriptUrl);
      sheets.set(style, image.decode().then(() => image, () => {
        sheets.delete(style);
        return null;
      }));
    }
    return sheets.get(style);
  }

  function waitForSheet(sheet, signal) {
    if (signal.aborted) return Promise.resolve(null);
    return new Promise((resolve) => {
      const cancel = () => resolve(null);
      signal.addEventListener("abort", cancel, { once: true });
      sheet.then((image) => {
        signal.removeEventListener("abort", cancel);
        resolve(image);
      });
    });
  }

  function playFrames(canvas, image, row, first, count, duration, signal, position) {
    const context = canvas.getContext("2d");
    const start = performance.now();
    let request;
    let previous = -1;
    return new Promise((resolve) => {
      function finish() {
        cancelAnimationFrame(request);
        signal.removeEventListener("abort", finish);
        resolve();
      }
      function render(now) {
        const index = Math.min(count - 1, Math.floor((now - start) * count / duration));
        if (index !== previous) {
          previous = index;
          context.clearRect(0, 0, tile, tile);
          if (image) context.drawImage(image, (first + index) * tile, row * tile, tile, tile, 0, 0, tile, tile);
          const [x, y] = position(index / (count - 1));
          canvas.style.translate = Math.round(x) + "px " + Math.round(y) + "px";
        }
        if (now - start >= duration) finish();
        else request = requestAnimationFrame(render);
      }
      if (signal.aborted) return finish();
      signal.addEventListener("abort", finish, { once: true });
      render(start);
    });
  }

  function prepare(type, styleKey, container, x, y, dx, dy, signal) {
    const style = styles[styleKey];
    const move = moves[type];
    const row = rows.indexOf(type);
    const canvas = document.createElement("canvas");
    canvas.className = "move-frames";
    canvas.width = canvas.height = tile;
    canvas.style.left = x + "px";
    canvas.style.top = y + "px";
    container.append(canvas);
    const sheet = loadSheet(styleKey);
    return {
      async flight() {
        if (move.beam) {
          canvas.classList.add("move-beam");
          canvas.style.width = Math.round(Math.hypot(dx, dy)) + "px";
          canvas.style.rotate = Math.atan2(-dy, -dx) + "rad";
          canvas.style.transform = "translate(-100%, -50%)";
          canvas.style.transformOrigin = "0 0";
        }
        return playFrames(canvas, await waitForSheet(sheet, signal), row, 0, style.flight, move.duration ?? 245, signal, (t) => {
          if (move.beam) return [0, 0];
          const remaining = 1 - t;
          const reach = move.reach ?? 1;
          const arc = (move.arc ?? 0) * Math.sin(Math.PI * t);
          const wave = (move.wave ?? 0) * Math.sin(2 * Math.PI * (move.cycles ?? 1) * t) * remaining;
          return [dx * remaining * reach, (dy * reach - (move.fall ?? 0)) * remaining - arc + wave];
        });
      },
      async impact() {
        canvas.classList.remove("move-beam");
        canvas.style.width = "";
        canvas.style.rotate = "";
        canvas.style.transform = "";
        canvas.style.transformOrigin = "";
        return playFrames(canvas, await waitForSheet(sheet, signal), row, style.flight, style.impact, 175, signal, () => [0, 0]);
      },
    };
  }

  window.StarterLab.moveEffects = {
    prepare,
    isAdaptation: (type, style) => (moves[type].since ?? 1) > styles[style].generation,
  };
})();
