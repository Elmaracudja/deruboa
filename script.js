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
  if (event.target.tagName === "IMG" || event.target.tagName === "VIDEO") {
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

    button.addEventListener("click", () => {
      hideEndPanel();
      loadVideo(index);
      attemptAutoplay(false);
    });

    playlistContainer.appendChild(button);
  });

  updateCounter();
}

function loadVideo(index) {
  if (!playlist.length) return;

  currentIndex = index;
  const item = playlist[currentIndex];

  player.src = item.src;
  player.load();

  videoTitle.textContent = item.title || "Sans titre";
  videoDescription.textContent = item.description || "Aucune description fournie.";

  overlayTitle.textContent = item.title || "Sans titre";
  overlayChannel.textContent = item.channel || "EM101 Webradio";
  overlayMeta.textContent = item.author || "EKWallegory Prod";

  renderPlaylist();
}

function attemptAutoplay(initial = false) {
  const playPromise = player.play();

  if (playPromise && typeof playPromise.then === "function") {
    playPromise.catch(() => {
      if (initial) {
        videoDescription.textContent = "Lecture prête. Appuyez sur play si votre appareil bloque le démarrage automatique.";
      }
    });
  }
}

function restartPlaylist() {
  if (!playlist.length) return;
  hideEndPanel();
  loadVideo(0);
  attemptAutoplay(false);
}

async function loadPlaylist() {
  try {
    const response = await fetch("./playlist.json");
    if (!response.ok) throw new Error("playlist.json introuvable");

    const data = await response.json();
    playlist = Array.isArray(data) ? data : [];

    if (!playlist.length) {
      renderPlaylist();
      return;
    }

    loadVideo(0);
    attemptAutoplay(true);
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

prevBtn.addEventListener("click", () => {
  if (!playlist.length) return;
  hideEndPanel();
  currentIndex = (currentIndex - 1 + playlist.length) % playlist.length;
  loadVideo(currentIndex);
  attemptAutoplay(false);
});

nextBtn.addEventListener("click", () => {
  if (!playlist.length) return;
  hideEndPanel();
  currentIndex = (currentIndex + 1) % playlist.length;
  loadVideo(currentIndex);
  attemptAutoplay(false);
});

restartBtn.addEventListener("click", restartPlaylist);
restartEndBtn.addEventListener("click", restartPlaylist);

player.addEventListener("ended", () => {
  if (!playlist.length) return;

  if (currentIndex >= playlist.length - 1) {
    showEndPanel();
    return;
  }

  currentIndex += 1;
  loadVideo(currentIndex);
  attemptAutoplay(false);
});

loadPlaylist();
