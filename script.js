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
let heartCanvasWidth = 0;
let heartCanvasHeight = 0;

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

function buildHeartParticles() {
  if (!heartCanvas || !heartContext) return;
  heartParticles.length = 0;
  const compact = window.innerWidth < 640;
  const bodyCount = compact ? 650 : 1150;
  const outlineCount = compact ? 180 : 310;
  const dustCount = compact ? 100 : 190;
  const spineCount = compact ? 70 : 130;

  const addParticle = (x, y, type = "body", strength = 1) => {
    heartParticles.push({
      x,
      y,
      type,
      strength,
      size: type === "dust" ? 0.45 + Math.random() * 1.15 : 0.65 + Math.random() * 1.7,
      phase: Math.random() * Math.PI * 2,
      speed: 0.45 + Math.random() * 1.25,
      drift: 0.12 + Math.random() * 0.48,
    });
  };

  for (let index = 0; index < bodyCount; index += 1) {
    const angle = Math.random() * Math.PI * 2;
    const edge = heartPoint(angle);
    const radius = Math.sqrt(Math.random());
    addParticle(edge.x * radius, edge.y * radius, "body", 0.55 + radius * 0.45);
  }

  for (let index = 0; index < outlineCount; index += 1) {
    const angle = (index / outlineCount) * Math.PI * 2;
    const edge = heartPoint(angle);
    addParticle(
      edge.x + (Math.random() - 0.5) * 0.5,
      edge.y + (Math.random() - 0.5) * 0.5,
      "edge",
      1,
    );
  }

  for (let index = 0; index < dustCount; index += 1) {
    const angle = Math.random() * Math.PI * 2;
    const edge = heartPoint(angle);
    const radius = 1.04 + Math.random() * 0.42;
    addParticle(
      edge.x * radius + (Math.random() - 0.5) * 3,
      edge.y * radius + (Math.random() - 0.5) * 3,
      "dust",
      0.25 + Math.random() * 0.45,
    );
  }

  for (let index = 0; index < spineCount; index += 1) {
    const y = -15 + (index / spineCount) * 28;
    const taper = 1 - Math.abs((y + 1) / 17);
    addParticle(
      (Math.random() - 0.5) * (0.28 + Math.max(0, taper) * 0.75),
      y + (Math.random() - 0.5) * 0.7,
      "spine",
      1,
    );
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
  buildHeartParticles();
}

function heartbeatScale(time) {
  const phase = time % 1180;
  const firstBeat = Math.exp(-(((phase - 120) / 62) ** 2)) * 0.115;
  const secondBeat = Math.exp(-(((phase - 292) / 82) ** 2)) * 0.075;
  return 1 + firstBeat + secondBeat;
}

function drawParticleHeart(time) {
  window.requestAnimationFrame(drawParticleHeart);
  if (!heartContext || !heartCanvas || currentScreen !== "heart") return;

  heartContext.fillStyle = "rgba(3, 1, 2, 0.24)";
  heartContext.fillRect(0, 0, heartCanvasWidth, heartCanvasHeight);

  const scale =
    (Math.min(heartCanvasWidth, heartCanvasHeight) / 39) * heartbeatScale(time);
  const centerX = heartCanvasWidth / 2;
  const centerY = heartCanvasHeight / 2 + scale * 1.2;

  heartContext.globalCompositeOperation = "lighter";
  heartParticles.forEach((particle) => {
    const shimmer = Math.sin(time * 0.001 * particle.speed + particle.phase);
    const jitterX = shimmer * particle.drift;
    const jitterY = Math.cos(time * 0.0013 * particle.speed + particle.phase) * particle.drift;
    const x = centerX + (particle.x + jitterX) * scale;
    const y = centerY - (particle.y + jitterY) * scale;
    const alpha =
      particle.type === "dust"
        ? 0.18 + (shimmer + 1) * 0.1
        : particle.type === "spine"
          ? 0.78 + (shimmer + 1) * 0.1
          : 0.44 + particle.strength * 0.35 + shimmer * 0.08;

    heartContext.beginPath();
    heartContext.fillStyle =
      particle.type === "spine"
        ? `rgba(255, 70, 58, ${alpha})`
        : `rgba(242, ${24 + particle.strength * 20}, ${25 + particle.strength * 14}, ${alpha})`;
    heartContext.arc(
      x,
      y,
      particle.size * (particle.type === "spine" ? 1.1 : 1),
      0,
      Math.PI * 2,
    );
    heartContext.fill();
  });
  heartContext.globalCompositeOperation = "source-over";
}

window.addEventListener("resize", resizeHeartCanvas);
window.requestAnimationFrame(() => {
  resizeHeartCanvas();
  window.requestAnimationFrame(drawParticleHeart);
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
