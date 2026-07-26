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

  if (next === "heart") {
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
