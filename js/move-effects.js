(() => {
  "use strict";
  const scriptUrl = document.currentScript.src;
  const tile = 48;
  const effectDurationScale = 1.625;
  const styles = {
    "gold-silver": { flight: 4, impact: 3, generation: 2 },
    "diamond-pearl": { flight: 7, impact: 5, generation: 4 },
    "black-white": { flight: 10, impact: 7, generation: 5 },
  };
  // Sheet rows follow this order. Angles and heights describe the projectile path.
  const moves = {
    노말: { reach: 0, duration: 90 },
    불꽃: { reach: 0, duration: 300 },
    물: { duration: 600, beam: true },
    전기: { reach: 0, duration: 300, atSource: true },
    풀: { duration: 300, since: 7, passThrough: true },
    얼음: { reach: 0, duration: 350 },
    격투: { reach: 0, duration: 300 },
    독: { reach: 0, duration: 300, since: 3 },
    땅: { arc: 25, duration: 300 },
    비행: { duration: 300, passThrough: true },
    에스퍼: { beam: true, duration: 450 },
    벌레: { duration: 300, passThrough: true },
    바위: { reach: 0, duration: 350 },
    고스트: { reach: 0, duration: 350, sweepUp: true },
    드래곤: { beam: true, duration: 500, since: 4 },
    악: { reach: 0, duration: 300 },
    강철: { reach: 0, duration: 300 },
    페어리: { reach: 0, duration: 300, since: 6 },
  };
  const rows = Object.keys(moves);
  const sheets = new Map();
  function loadSheet(style) {
    if (!sheets.has(style)) {
      const image = new Image();
      image.src = new URL("../assets/effects/" + style + "/moves.png?v=electric-horn-7", scriptUrl);
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

  function playFrames(canvas, image, row, first, count, duration, signal, position, updateFrame = () => {}) {
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
          updateFrame(index / (count - 1));
        }
        if (now - start >= duration) finish();
        else request = requestAnimationFrame(render);
      }
      if (signal.aborted) return finish();
      signal.addEventListener("abort", finish, { once: true });
      render(start);
    });
  }

  function makeLightning(container, x, y, dx, dy) {
    const pixelSize = 4;
    const padding = 32;
    const left = Math.min(x, x + dx) - padding;
    const top = Math.min(y, y + dy) - padding;
    const canvas = document.createElement("canvas");
    canvas.className = "electric-branches";
    canvas.width = Math.ceil((Math.abs(dx) + padding * 2) / pixelSize);
    canvas.height = Math.ceil((Math.abs(dy) + padding * 2) / pixelSize);
    canvas.style.left = left + "px";
    canvas.style.top = top + "px";
    canvas.style.width = canvas.width * pixelSize + "px";
    canvas.style.height = canvas.height * pixelSize + "px";
    container.append(canvas);
    const context = canvas.getContext("2d");
    const startX = (x + dx - left) / pixelSize;
    const startY = (y + dy - top) / pixelSize;
    const endX = (x - left) / pixelSize;
    const endY = (y - top) / pixelSize;

    return (progress) => {
      context.clearRect(0, 0, canvas.width, canvas.height);
      const phase = Math.floor(progress * 8);
      if (phase === 0 || phase === 3 || phase === 6) return;
      for (let branch = -1; branch <= 1; branch += 1) {
        const points = [];
        for (let step = 0; step <= 8; step += 1) {
          const fraction = step / 8;
          const jitter = step > 0 && step < 8
            ? ((step + phase) % 2 ? 1 : -1) * (3 + Math.abs(branch) * 2) : 0;
          points.push([
            Math.round(startX + (endX - startX) * fraction + branch * 7 * Math.sin(Math.PI * fraction)),
            Math.round(startY + (endY - startY) * fraction + jitter),
          ]);
        }
        context.beginPath();
        points.forEach(([px, py], index) => index ? context.lineTo(px, py) : context.moveTo(px, py));
        context.strokeStyle = "#e6a719";
        context.lineWidth = 3;
        context.stroke();
        context.strokeStyle = "#fff5a6";
        context.lineWidth = 1;
        context.stroke();
      }
    };
  }
  function prepare(type, styleKey, container, x, y, dx, dy, signal) {
    const style = styles[styleKey];
    const move = moves[type];
    const row = rows.indexOf(type);
    const anchorX = move.atSource ? x + dx : x;
    const anchorY = move.atSource ? y + dy : y;
    const canvas = document.createElement("canvas");
    canvas.className = "move-frames";
    canvas.width = canvas.height = tile;
    canvas.style.left = anchorX + "px";
    canvas.style.top = anchorY + "px";
    container.append(canvas);
    const sheet = loadSheet(styleKey);
    if (type === "전기") {
      const arcs = document.createElement("canvas");
      arcs.className = "electric-arcs";
      arcs.width = 128;
      arcs.height = 96;
      arcs.style.left = (x + dx) + "px";
      arcs.style.top = (y + dy) + "px";
      const paint = arcs.getContext("2d");
      const direction = Math.sign(-dx) || 1;
      const lines = [
        [[0,-9],[10,-18],[8,-23],[20,-25],[17,-33],[30,-39]],
        [[0,7],[13,13],[10,20],[24,19],[21,29],[34,34]],
        [[7,0],[17,-4],[22,2],[33,-6],[38,-2],[48,-12]],
      ];
      for (const points of lines) {
        paint.beginPath();
        points.forEach(([px,py], index) => {
          const pointX = 54 + px * direction;
          if (index === 0) paint.moveTo(pointX, 48 + py);
          else paint.lineTo(pointX, 48 + py);
        });
        paint.strokeStyle = "#ffd52c";
        paint.lineWidth = 2;
        paint.stroke();
      }
      container.append(arcs);
    }
    const drawLightning = type === "전기" ? makeLightning(container, x, y, dx, dy) : null;
    return {
      async flight() {
        if (move.beam) {
          canvas.classList.add("move-beam");
          canvas.style.width = "0px";
          canvas.style.left = x + dx + "px";
          canvas.style.top = y + dy + "px";
          canvas.style.rotate = Math.atan2(-dy, -dx) + "rad";
          canvas.style.transform = "translate(0, -50%)";
          canvas.style.transformOrigin = "0 0";
        }
        return playFrames(canvas, await waitForSheet(sheet, signal), row, 0, style.flight, (move.duration ?? 245) * effectDurationScale, signal, (t) => {
          if (move.beam) return [0, 0];
          if (move.sweepUp) return [0, 28 - 56 * t];
          const remaining = 1 - t;
          const reach = move.reach ?? 1;
          const arc = (move.arc ?? 0) * Math.sin(Math.PI * t);
          const wave = (move.wave ?? 0) * Math.sin(2 * Math.PI * (move.cycles ?? 1) * t) * remaining;
          return [dx * remaining * reach, (dy * reach - (move.fall ?? 0)) * remaining - arc + wave];
        }, (progress) => {
          if (!move.beam) return;
          const length = Math.hypot(dx, dy);
          const extension = type === "물" ? Math.min(1, Math.max(0.12, (progress - 0.1) / 0.6)) : Math.max(0.1, progress);
          canvas.style.width = Math.round(length * extension) + "px";
        });
      },
      async impact() {
        canvas.classList.remove("move-beam");
        canvas.style.width = "";
        canvas.style.left = anchorX + "px";
        canvas.style.top = anchorY + "px";
        canvas.style.rotate = "";
        canvas.style.transform = "";
        canvas.style.transformOrigin = "";
        return playFrames(canvas, await waitForSheet(sheet, signal), row, style.flight, style.impact, 175 * effectDurationScale, signal, (t) => {
          if (move.passThrough) return [-dx * 0.35 * t, -dy * 0.35 * t];
          return move.sweepUp ? [0, -28] : [0, 0];
        });
      },
    };
  }

  window.StarterLab.moveEffects = {
    prepare,
    isAdaptation: (type, style) => (moves[type].since ?? 1) > styles[style].generation,
  };
})();
