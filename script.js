const screens = ["calendar", "letter", "album"];
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

let currentScreen = "calendar";
let musicOn = false;
let musicUnavailable = false;
let letterOpen = false;

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
