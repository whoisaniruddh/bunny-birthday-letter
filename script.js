const INITIAL_REASON_COUNT = 9;
const REASON_STEP = 12;

const scrollBar = document.querySelector("#scrollBar");
const openLetterButton = document.querySelector("#openLetter");
const letterSection = document.querySelector("#letter");
const letterBody = document.querySelector("#letterBody");
const letterSource = document.querySelector("#letter-source");
const reasonIntro = document.querySelector("#reasonIntro");
const reasonGrid = document.querySelector("#reasonGrid");
const revealReasonsButton = document.querySelector("#revealReasons");
const topButton = document.querySelector("#topButton");
const musicToggle = document.querySelector("#musicToggle");
const musicStatus = document.querySelector("#musicStatus");
const songAudio = document.querySelector("#song-player");

let songPlaying = false;
let audioUnlocked = false;
let visibleReasons = INITIAL_REASON_COUNT;

const letterText = letterSource.textContent.replace(/\n$/, "");
const letterLines = letterText.split(/\r?\n/);
const reasonBlockStart = letterLines.findIndex(
  (line) => line.trim() === "Now let me tell you 3 reasons why I love you",
);

const reasonStart = letterLines.findIndex(
  (line) => line.trim() === "You thought there are only 3",
);

const visibleLetterLines =
  reasonBlockStart >= 0 ? letterLines.slice(0, reasonBlockStart) : letterLines;
letterBody.textContent = visibleLetterLines.join("\n").trimEnd();

if (reasonIntro && reasonBlockStart >= 0 && reasonStart >= reasonBlockStart) {
  reasonIntro.textContent = letterLines
    .slice(reasonBlockStart, reasonStart + 1)
    .join("\n")
    .trim();
}

const reasonLines = letterText
  .split(/\r?\n/)
  .slice(reasonStart + 1)
  .map((line) => line.trim())
  .filter((line) => /^\d+\.\s/.test(line));

function updateScrollProgress() {
  const scrollTop = window.scrollY;
  const scrollHeight = document.documentElement.scrollHeight - window.innerHeight;
  const progress = scrollHeight > 0 ? (scrollTop / scrollHeight) * 100 : 0;

  scrollBar.style.width = `${Math.min(100, Math.max(0, progress))}%`;
  topButton.classList.toggle("is-visible", scrollTop > window.innerHeight * 0.65);
}

function renderReasons() {
  reasonGrid.innerHTML = "";

  reasonLines.slice(0, visibleReasons).forEach((line, index) => {
    const match = line.match(/^(\d+)\.\s(.+)$/);
    const number = match ? match[1] : String(index + 1);
    const text = match ? match[2] : line;
    const card = document.createElement("article");

    card.className = "reason-card";
    card.tabIndex = 0;
    card.style.animationDelay = `${Math.min(index % REASON_STEP, 8) * 35}ms`;
    card.innerHTML = `<span>${number.padStart(2, "0")}</span><p></p>`;
    card.querySelector("p").textContent = text;
    reasonGrid.appendChild(card);
  });

  const allVisible = visibleReasons >= reasonLines.length;
  revealReasonsButton.hidden = allVisible;
}

function burstHearts(originX, originY) {
  for (let index = 0; index < 24; index += 1) {
    const heart = document.createElement("span");
    const drift = (Math.random() - 0.5) * 180;
    const spin = (Math.random() - 0.5) * 80;

    heart.className = "floating-heart";
    heart.textContent = "\u2665";
    heart.style.left = `${originX + (Math.random() - 0.5) * 44}px`;
    heart.style.top = `${originY + (Math.random() - 0.5) * 24}px`;
    heart.style.setProperty("--drift-x", `${drift}px`);
    heart.style.setProperty("--spin", `${spin}deg`);
    document.body.appendChild(heart);

    window.setTimeout(() => heart.remove(), 1300);
  }
}

function setMusicState(isPlaying, statusText) {
  songPlaying = isPlaying;
  musicToggle.setAttribute(
    "aria-label",
    isPlaying ? "Pause birthday song" : "Play birthday song",
  );
  musicToggle.dataset.tooltip = isPlaying ? "Pause song" : "Play song";
  musicStatus.textContent =
    statusText || (isPlaying ? "Song playing" : "Tap anywhere for song");
}

async function startSongWithAudio() {
  audioUnlocked = true;
  musicStatus.textContent = "Starting song";

  if (!songAudio) {
    setMusicState(false, "Song unavailable");
    return;
  }

  try {
    songAudio.muted = false;
    songAudio.volume = 0.82;
    await songAudio.play();
    setMusicState(true, "Song playing");
  } catch (error) {
    setMusicState(false, "Tap anywhere for song");
  }
}

async function tryAutoplaySong() {
  if (!songAudio) {
    return;
  }

  songAudio.volume = 0.82;
  await songAudio.play().catch(() => {
    setMusicState(false, "Tap anywhere for song");
  });
}

function unlockAudioFromFirstInteraction(event) {
  if (event.target instanceof Element && event.target.closest("#musicToggle")) {
    return;
  }

  if (!audioUnlocked) {
    startSongWithAudio();
  }
}

openLetterButton.addEventListener("click", (event) => {
  const rect = event.currentTarget.getBoundingClientRect();

  burstHearts(rect.left + rect.width / 2, rect.top + rect.height / 2);
  letterSection.scrollIntoView({ behavior: "smooth", block: "start" });
  startSongWithAudio();
});

revealReasonsButton.addEventListener("click", () => {
  visibleReasons = Math.min(visibleReasons + REASON_STEP, reasonLines.length);
  renderReasons();
});

topButton.addEventListener("click", () => {
  window.scrollTo({ top: 0, behavior: "smooth" });
});

musicToggle.addEventListener("click", () => {
  if (songPlaying && songAudio) {
    songAudio.pause();
  } else {
    startSongWithAudio();
  }
});

if (songAudio) {
  songAudio.addEventListener("play", () => setMusicState(true, "Song playing"));
  songAudio.addEventListener("pause", () => setMusicState(false));
  songAudio.addEventListener("ended", () => setMusicState(false));
  songAudio.addEventListener("error", () => setMusicState(false, "Song unavailable"));
}

document.addEventListener("pointerdown", unlockAudioFromFirstInteraction, {
  once: true,
  passive: true,
});
document.addEventListener("keydown", unlockAudioFromFirstInteraction, { once: true });
window.addEventListener("scroll", updateScrollProgress, { passive: true });
window.addEventListener("resize", updateScrollProgress);

window.setTimeout(() => {
  if (!songPlaying) {
    musicStatus.textContent = "Tap anywhere for song";
  }
}, 2600);

tryAutoplaySong();
renderReasons();
updateScrollProgress();
