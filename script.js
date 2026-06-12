const root = document.documentElement;
const themeToggle = document.getElementById("theme-toggle");
const themeLabel = document.getElementById("theme-label");

const player = document.getElementById("player");
const playlistContainer = document.getElementById("playlist");
const videoTitle = document.getElementById("video-title");
const videoDescription = document.getElementById("video-description");
const videoCounter = document.getElementById("video-counter");

const overlayTitle = document.getElementById("overlay-title");
const overlayChannel = document.getElementById("overlay-channel");
const overlayMeta = document.getElementById("overlay-meta");

const prevBtn = document.getElementById("prev-btn");
const nextBtn = document.getElementById("next-btn");
const restartBtn = document.getElementById("restart-btn");
const restartEndBtn = document.getElementById("restart-end-btn");
const playlistEnd = document.getElementById("playlist-end");

let playlist = [];
let currentIndex = 0;
let currentTheme = root.getAttribute("data-theme") || "dark";
let autoplayAllowed = true;

player.muted = true;
player.defaultMuted = true;
player.setAttribute("muted", "");
player.setAttribute("playsinline", "");
player.setAttribute("webkit-playsinline", "");
player.autoplay = true;

function updateThemeLabel() {
  themeLabel.textContent = currentTheme === "dark" ? "Clair" : "Foncé";
}

if (themeToggle) {
  updateThemeLabel();
  themeToggle.addEventListener("click", () => {
    currentTheme = currentTheme === "dark" ? "light" : "dark";
    root.setAttribute("data-theme", currentTheme);
    updateThemeLabel();
  });
}

document.addEventListener("contextmenu", (event) => {
  event.preventDefault();
});

document.addEventListener("dragstart", (event) => {
  const tag = event.target.tagName;
  if (tag === "IMG" || tag === "VIDEO") {
    event.preventDefault();
  }
});

function updateCounter() {
  const total = playlist.length;
  const current = total ? currentIndex + 1 : 0;
  videoCounter.textContent = `${current} / ${total}`;
}

function hideEndPanel() {
  playlistEnd.hidden = true;
}

function showEndPanel() {
  playlistEnd.hidden = false;
}

function renderPlaylist() {
  playlistContainer.innerHTML = "";

  if (!playlist.length) {
    playlistContainer.innerHTML = `<p class="loading-text">Aucune vidéo disponible.</p>`;
    videoTitle.textContent = "Aucune vidéo disponible";
    videoDescription.textContent = "Ajoute des vidéos dans playlist.json.";
    overlayTitle.textContent = "Aucune vidéo disponible";
    overlayChannel.textContent = "EM101 Webradio";
    overlayMeta.textContent = "EKWallegory Prod";
    updateCounter();
    return;
  }

  playlist.forEach((item, index) => {
    const button = document.createElement("button");
    button.type = "button";
    button.className = "playlist-item";
    if (index === currentIndex) button.classList.add("active");

    button.innerHTML = `
      <span class="playlist-item-index">Vidéo ${index + 1}</span>
      <span class="playlist-item-title">${item.title || "Sans titre"}</span>
      <span class="playlist-item-meta">${item.author || "EKWallegory Prod"}</span>
    `;

    button.addEventListener("click", async () => {
      hideEndPanel();
      await loadVideo(index, true);
    });

    playlistContainer.appendChild(button);
  });

  updateCounter();
}

async function safePlay(initial = false) {
  try {
    player.muted = true;
    player.defaultMuted = true;
    const promise = player.play();

    if (promise && typeof promise.then === "function") {
      await promise;
    }

    autoplayAllowed = true;
  } catch (error) {
    autoplayAllowed = false;
    if (initial) {
      videoDescription.textContent =
        "Votre appareil a bloqué le démarrage automatique. Appuyez sur play pour lancer la playlist.";
    }
  }
}

function waitForVideoReady() {
  return new Promise((resolve) => {
    if (player.readyState >= 2) {
      resolve();
      return;
    }

    const onReady = () => {
      player.removeEventListener("loadedmetadata", onReady);
      player.removeEventListener("canplay", onReady);
      resolve();
    };

    player.addEventListener("loadedmetadata", onReady, { once: true });
    player.addEventListener("canplay", onReady, { once: true });
  });
}

async function loadVideo(index, shouldAutoplay = true) {
  if (!playlist.length) return;

  currentIndex = index;
  const item = playlist[currentIndex];

  player.pause();
  player.muted = true;
  player.defaultMuted = true;

  player.removeAttribute("src");
  player.load();

  player.src = item.src;
  player.load();

  videoTitle.textContent = item.title || "Sans titre";
  videoDescription.textContent = item.description || "Aucune description fournie.";

  overlayTitle.textContent = item.title || "Sans titre";
  overlayChannel.textContent = item.channel || "EM101 Webradio";
  overlayMeta.textContent = item.author || "EKWallegory Prod";

  renderPlaylist();
  hideEndPanel();

  await waitForVideoReady();

  if (shouldAutoplay) {
    await safePlay(index === 0);
  }
}

function restartPlaylist() {
  if (!playlist.length) return;
  loadVideo(0, true);
}

async function loadPlaylist() {
  try {
    const response = await fetch("./playlist.json", { cache: "no-store" });
    if (!response.ok) throw new Error("playlist.json introuvable");

    const data = await response.json();
    playlist = Array.isArray(data) ? data : [];

    if (!playlist.length) {
      renderPlaylist();
      return;
    }

    await loadVideo(0, true);
  } catch (error) {
    playlistContainer.innerHTML = `<p class="loading-text">Impossible de charger playlist.json.</p>`;
    videoTitle.textContent = "Erreur de chargement";
    videoDescription.textContent = "Vérifie la structure du fichier playlist.json.";
    overlayTitle.textContent = "Erreur de chargement";
    overlayChannel.textContent = "EM101 Webradio";
    overlayMeta.textContent = "EKWallegory Prod";
    updateCounter();
  }
}

prevBtn.addEventListener("click", async () => {
  if (!playlist.length) return;
  currentIndex = (currentIndex - 1 + playlist.length) % playlist.length;
  await loadVideo(currentIndex, true);
});

nextBtn.addEventListener("click", async () => {
  if (!playlist.length) return;
  currentIndex = (currentIndex + 1) % playlist.length;
  await loadVideo(currentIndex, true);
});

restartBtn.addEventListener("click", restartPlaylist);
restartEndBtn.addEventListener("click", restartPlaylist);

player.addEventListener("ended", async () => {
  if (!playlist.length) return;

  if (currentIndex >= playlist.length - 1) {
    showEndPanel();
    return;
  }

  currentIndex += 1;
  await loadVideo(currentIndex, true);
});

document.addEventListener(
  "touchstart",
  async () => {
    if (!autoplayAllowed && player.paused && playlist.length) {
      await safePlay(false);
    }
  },
  { once: true }
);

document.addEventListener(
  "click",
  async () => {
    if (!autoplayAllowed && player.paused && playlist.length) {
      await safePlay(false);
    }
  },
  { once: true }
);

loadPlaylist();
