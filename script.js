const screens = ["calendar", "letter", "album", "heart"];
const pages = [...document.querySelectorAll("[data-page]")];
const dots = [...document.querySelectorAll(".page-dots [data-screen]")];
const audio = document.querySelector("#birthday-music");
const musicToggle = document.querySelector(".music-toggle");
const musicBars = document.querySelector(".music-bars");
const musicLabel = document.querySelector(".music-label");
const envelope = document.querySelector(".envelope");
const waxSeal = document.querySelector(".wax-seal");
const letterInstruction = document.querySelector(".letter-instruction");
const nextButton = document.querySelector(".next-button");
const burstLayer = document.querySelector(".burst-layer");
const languageWishes = document.querySelector(".language-wishes");
const heartCanvas = document.querySelector("#particle-heart");
const heartContext = heartCanvas?.getContext("2d");

let currentScreen = "calendar";
let musicOn = false;
let musicUnavailable = false;
let letterOpen = false;

function applyEditableContent() {
  const content = window.BIRTHDAY_CONTENT || {};
  const textFields = {
    "letter-dear": content.letterDear,
    "letter-paragraph-1": content.letterParagraph1,
    "letter-paragraph-2": content.letterParagraph2,
    "letter-sign": content.letterSign,
    "final-message": content.finalMessage,
  };

  Object.entries(textFields).forEach(([id, value]) => {
    if (typeof value === "string") document.querySelector(`#${id}`).textContent = value;
  });

  (content.photos || []).forEach((photo, index) => {
    const image = document.querySelector(`[data-photo="${index}"]`);
    const caption = document.querySelector(`[data-caption="${index}"]`);
    if (!image || !photo?.file) return;

    image.addEventListener("load", () => image.classList.add("is-loaded"));
    image.addEventListener("error", () => image.classList.remove("is-loaded"));
    image.src = `./${photo.file}`;
    if (caption && photo.caption) caption.textContent = photo.caption;
  });
}

function makeBurst(x, y) {
  const kinds = ["kitty", "heart", "bow"];
  const count = 3 + Math.floor(Math.random() * 3);
  const burst = document.createElement("div");

  for (let index = 0; index < count; index += 1) {
    const angle = (Math.PI * 2 * index) / count + Math.random() * 0.55;
    const distance = 46 + Math.random() * 42;
    const kind = kinds[Math.floor(Math.random() * kinds.length)];
    const icon = document.createElement("span");
    icon.className = `burst-icon ${kind}`;
    icon.textContent = kind === "kitty" ? "🐱" : kind === "heart" ? "♥" : "🎀";
    icon.style.left = `${x}px`;
    icon.style.top = `${y}px`;
    icon.style.setProperty("--dx", `${Math.cos(angle) * distance}px`);
    icon.style.setProperty("--dy", `${Math.sin(angle) * distance - 24}px`);
    icon.style.setProperty("--rotate", `${-26 + Math.random() * 52}deg`);
    icon.style.setProperty("--delay", `${index * 35}ms`);
    burst.appendChild(icon);
  }

  burstLayer.appendChild(burst);
  window.setTimeout(() => burst.remove(), 1200);
}

function randomWishPosition() {
  let x;
  let y;
  let attempts = 0;

  do {
    x = 7 + Math.random() * 86;
    y = 12 + Math.random() * 70;
    attempts += 1;
  } while (
    ((x > 27 && x < 73 && y > 22 && y < 78) || (x > 66 && y > 63)) &&
    attempts < 20
  );

  return { x, y };
}

function spawnFloatingWish() {
  if (currentScreen !== "heart" || !languageWishes) return;
  const messages = window.BIRTHDAY_CONTENT?.floatingMessages || [];
  if (!messages.length) return;

  const { x, y } = randomWishPosition();
  const wish = document.createElement("span");
  const message = messages[Math.floor(Math.random() * messages.length)];
  wish.className = "floating-wish";
  wish.textContent = `${message} ♡`;
  wish.lang =
    /[\uac00-\ud7af]/.test(message)
      ? "ko"
      : /[\u3040-\u30ff]/.test(message)
        ? "ja"
        : /[\u4e00-\u9fff]/.test(message)
          ? "zh"
          : "vi";
  wish.style.left = `${x}%`;
  wish.style.top = `${y}%`;
  wish.style.setProperty("--wish-rotate", `${-7 + Math.random() * 14}deg`);
  wish.style.setProperty("--wish-drift", `${-22 + Math.random() * 44}px`);
  wish.style.setProperty("--wish-scale", `${0.88 + Math.random() * 0.28}`);
  languageWishes.appendChild(wish);
  window.setTimeout(() => wish.remove(), 5600);
}

window.setInterval(spawnFloatingWish, 620);

const heartParticles = [];
const heartPointer = { x: 0, y: 0, active: false, pressed: false };
let heartCanvasWidth = 0;
let heartCanvasHeight = 0;
let heartLastTime = 0;
let heartEmissionRest = 0;
let heartClickPulse = 0;

function heartPoint(angle) {
  return {
    x: 16 * Math.sin(angle) ** 3,
    y:
      13 * Math.cos(angle) -
      5 * Math.cos(2 * angle) -
      2 * Math.cos(3 * angle) -
      Math.cos(4 * angle),
  };
}

function createPinkHeartParticleSprite() {
  const sprite = document.createElement("canvas");
  const context = sprite.getContext("2d");
  sprite.width = 32;
  sprite.height = 32;
  if (!context) return sprite;

  context.beginPath();
  for (let angle = -Math.PI; angle <= Math.PI; angle += 0.045) {
    const point = heartPoint(angle);
    const x = 16 + point.x * 0.82;
    const y = 16 - point.y * 0.72;
    if (angle === -Math.PI) context.moveTo(x, y);
    else context.lineTo(x, y);
  }
  context.closePath();
  const gradient = context.createRadialGradient(11, 9, 1, 16, 16, 19);
  gradient.addColorStop(0, "#ffd2e3");
  gradient.addColorStop(0.35, "#ff77ad");
  gradient.addColorStop(1, "#ef2377");
  context.fillStyle = gradient;
  context.fill();
  return sprite;
}

const pinkHeartParticleSprite = createPinkHeartParticleSprite();

function heartbeatScale(time) {
  const phase = time % 1180;
  const firstBeat = Math.exp(-(((phase - 120) / 62) ** 2)) * 0.105;
  const secondBeat = Math.exp(-(((phase - 292) / 82) ** 2)) * 0.068;
  return 1 + firstBeat + secondBeat + heartClickPulse;
}

function addHeartParticle(angle, speedMultiplier = 1, burst = false) {
  const point = heartPoint(angle);
  const baseScale =
    (Math.min(heartCanvasWidth, heartCanvasHeight) / 39) *
    heartbeatScale(performance.now());
  const centerX = heartCanvasWidth / 2;
  const centerY = heartCanvasHeight / 2 + baseScale * 1.2;
  const x = centerX + point.x * baseScale;
  const y = centerY - point.y * baseScale;
  const length = Math.max(1, Math.hypot(point.x, point.y));
  const velocity = (burst ? 72 : 34) * speedMultiplier;

  heartParticles.push({
    x,
    y,
    vx: (point.x / length) * velocity + (Math.random() - 0.5) * 11,
    vy: (-point.y / length) * velocity + (Math.random() - 0.5) * 11,
    ax: 0,
    ay: 0,
    age: 0,
    duration: burst ? 1.55 + Math.random() * 0.7 : 3.2 + Math.random() * 1.4,
    size: burst ? 8 + Math.random() * 7 : 5 + Math.random() * 6,
    hue: 326 + Math.random() * 15,
    light: 58 + Math.random() * 24,
  });

  const limit = window.innerWidth < 640 ? 2200 : 4200;
  if (heartParticles.length > limit) {
    heartParticles.splice(0, heartParticles.length - limit);
  }
}

function burstInteractiveHeart() {
  heartClickPulse = 0.2;
  const amount = window.innerWidth < 640 ? 170 : 300;
  for (let index = 0; index < amount; index += 1) {
    addHeartParticle(Math.random() * Math.PI * 2, 0.8 + Math.random() * 1.3, true);
  }
}

function resizeHeartCanvas() {
  if (!heartCanvas || !heartContext) return;
  const bounds = heartCanvas.getBoundingClientRect();
  const ratio = Math.min(window.devicePixelRatio || 1, 2);
  heartCanvasWidth = Math.max(1, bounds.width);
  heartCanvasHeight = Math.max(1, bounds.height);
  heartCanvas.width = Math.round(heartCanvasWidth * ratio);
  heartCanvas.height = Math.round(heartCanvasHeight * ratio);
  heartContext.setTransform(ratio, 0, 0, ratio, 0, 0);
  heartContext.fillStyle = "#030102";
  heartContext.fillRect(0, 0, heartCanvasWidth, heartCanvasHeight);
  heartParticles.length = 0;
}

function updateHeartPointer(event) {
  if (!heartCanvas) return;
  const bounds = heartCanvas.getBoundingClientRect();
  heartPointer.x = event.clientX - bounds.left;
  heartPointer.y = event.clientY - bounds.top;
  heartPointer.active = true;
}

heartCanvas?.addEventListener("pointermove", updateHeartPointer);
heartCanvas?.addEventListener("pointerenter", updateHeartPointer);
heartCanvas?.addEventListener("pointerleave", () => {
  heartPointer.active = false;
  heartPointer.pressed = false;
});
heartCanvas?.addEventListener("pointerdown", (event) => {
  event.preventDefault();
  updateHeartPointer(event);
  heartPointer.pressed = true;
  heartCanvas.setPointerCapture?.(event.pointerId);
  burstInteractiveHeart();
});
heartCanvas?.addEventListener("pointerup", (event) => {
  heartPointer.pressed = false;
  heartCanvas.releasePointerCapture?.(event.pointerId);
});

function renderInteractiveHeart(time) {
  window.requestAnimationFrame(renderInteractiveHeart);
  if (!heartContext || !heartCanvas || currentScreen !== "heart") {
    heartLastTime = time;
    return;
  }

  const delta = Math.min(0.034, Math.max(0.001, (time - (heartLastTime || time)) / 1000));
  heartLastTime = time;
  heartClickPulse *= Math.pow(0.018, delta);

  heartContext.fillStyle = "rgba(3, 1, 2, 0.22)";
  heartContext.fillRect(0, 0, heartCanvasWidth, heartCanvasHeight);

  const compact = window.innerWidth < 640;
  const particleRate = compact ? 360 : 760;
  const beat = heartbeatScale(time);
  heartEmissionRest += particleRate * delta;
  const amount = Math.floor(heartEmissionRest);
  heartEmissionRest -= amount;

  for (let index = 0; index < amount; index += 1) {
    addHeartParticle(Math.random() * Math.PI * 2, beat);
  }

  heartContext.globalCompositeOperation = "lighter";
  for (let index = heartParticles.length - 1; index >= 0; index -= 1) {
    const particle = heartParticles[index];
    particle.age += delta;
    if (particle.age >= particle.duration) {
      heartParticles.splice(index, 1);
      continue;
    }

    if (heartPointer.active) {
      const dx = heartPointer.x - particle.x;
      const dy = heartPointer.y - particle.y;
      const distance = Math.max(12, Math.hypot(dx, dy));
      if (distance < 145) {
        const direction = heartPointer.pressed ? 1 : -1;
        const force = direction * (1 - distance / 145) * 920;
        particle.vx += (dx / distance) * force * delta;
        particle.vy += (dy / distance) * force * delta;
      }
    }

    particle.ax = -particle.vx * 0.82;
    particle.ay = -particle.vy * 0.82;
    particle.vx += particle.ax * delta;
    particle.vy += particle.ay * delta;
    particle.x += particle.vx * delta;
    particle.y += particle.vy * delta;

    const progress = particle.age / particle.duration;
    const easedSize = particle.size * (1 - (1 - progress) ** 3);
    const alpha = Math.max(0, 1 - progress) * 0.92;
    heartContext.shadowColor = "rgba(255, 44, 135, 0.75)";
    heartContext.shadowBlur = 7;
    heartContext.globalAlpha = alpha;
    const size = Math.max(1.2, easedSize);
    heartContext.drawImage(
      pinkHeartParticleSprite,
      particle.x - size / 2,
      particle.y - size / 2,
      size,
      size,
    );
  }
  heartContext.globalAlpha = 1;
  heartContext.shadowBlur = 0;
  heartContext.globalCompositeOperation = "source-over";
}

window.addEventListener("resize", resizeHeartCanvas);
window.requestAnimationFrame(() => {
  resizeHeartCanvas();
  window.requestAnimationFrame(renderInteractiveHeart);
});

async function playMusic() {
  if (!audio || musicUnavailable) return;
  try {
    audio.volume = 0.5;
    await audio.play();
    musicOn = true;
    musicBars.classList.add("playing");
    musicLabel.textContent = "Đang phát";
    musicToggle.setAttribute("aria-label", "Tắt nhạc");
    musicToggle.title = "Tắt nhạc";
  } catch {
    musicUnavailable = true;
    musicOn = false;
    musicLabel.textContent = "Chờ nhạc";
  }
}

function pauseMusic() {
  audio.pause();
  musicOn = false;
  musicBars.classList.remove("playing");
  musicLabel.textContent = "Âm nhạc";
  musicToggle.setAttribute("aria-label", "Bật nhạc");
  musicToggle.title = "Bật nhạc";
}

function changeScreen(next, event) {
  if (!screens.includes(next)) return;
  if (event) makeBurst(event.clientX, event.clientY);

  const currentIndex = screens.indexOf(next);
  currentScreen = next;
  document.querySelector(".site")?.classList.toggle("is-heart-screen", next === "heart");

  if (next === "heart") {
    resizeHeartCanvas();
    window.setTimeout(spawnFloatingWish, 120);
    window.setTimeout(spawnFloatingWish, 340);
    window.setTimeout(spawnFloatingWish, 560);
  }

  pages.forEach((page) => {
    const target = page.dataset.page;
    const targetIndex = screens.indexOf(target);
    page.classList.remove("is-active", "is-before", "is-after");
    page.classList.add(
      targetIndex === currentIndex
        ? "is-active"
        : targetIndex < currentIndex
          ? "is-before"
          : "is-after",
    );
    page.setAttribute("aria-hidden", String(target !== next));
  });

  dots.forEach((dot) => {
    const selected = dot.dataset.screen === next;
    dot.classList.toggle("is-current", selected);
    if (selected) dot.setAttribute("aria-current", "page");
    else dot.removeAttribute("aria-current");
  });
}

document.querySelectorAll("[data-screen]").forEach((button) => {
  button.addEventListener("click", (event) => {
    event.stopPropagation();
    changeScreen(button.dataset.screen, event);
  });
});

document.querySelector("#open-gift").addEventListener("click", async (event) => {
  event.stopPropagation();
  changeScreen("letter", event);
  await playMusic();
});

musicToggle.addEventListener("click", async (event) => {
  event.stopPropagation();
  if (musicUnavailable) return;
  if (musicOn) pauseMusic();
  else await playMusic();
});

audio.addEventListener("error", () => {
  musicUnavailable = true;
  musicOn = false;
  musicBars.classList.remove("playing");
  musicLabel.textContent = "Chờ nhạc";
});

waxSeal.addEventListener("click", (event) => {
  event.stopPropagation();
  letterOpen = !letterOpen;
  envelope.classList.toggle("is-letter-open", letterOpen);
  waxSeal.setAttribute("aria-label", letterOpen ? "Gấp lá thư lại" : "Mở lá thư");
  letterInstruction.textContent = letterOpen
    ? "Bấm vào trái tim để gấp thư lại"
    : "Bấm vào dấu niêm phong để mở thư";
  nextButton.classList.toggle("is-visible", letterOpen);
  nextButton.tabIndex = letterOpen ? 0 : -1;
  makeBurst(event.clientX, event.clientY);
});

document.querySelector(".site").addEventListener("pointerdown", (event) => {
  if (event.target.closest("button, a")) return;
  makeBurst(event.clientX, event.clientY);
});

document.querySelectorAll(".memory-card").forEach((card) => {
  const toggleMemory = () => {
    const revealed = card.classList.toggle("is-revealed");
    card.setAttribute("aria-expanded", String(revealed));
    card.setAttribute(
      "aria-label",
      revealed ? "Đóng kỷ niệm này" : "Mở kỷ niệm này",
    );
  };

  card.addEventListener("click", toggleMemory);
  card.addEventListener("keydown", (event) => {
    if (event.key !== "Enter" && event.key !== " ") return;
    event.preventDefault();
    toggleMemory();
  });
});

applyEditableContent();
