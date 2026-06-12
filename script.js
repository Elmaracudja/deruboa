const root = document.documentElement;
const themeToggle = document.getElementById("theme-toggle");
const player = document.getElementById("player");
const playlistContainer = document.getElementById("playlist");
const videoTitle = document.getElementById("video-title");
const videoDescription = document.getElementById("video-description");
const videoCounter = document.getElementById("video-counter");
const prevBtn = document.getElementById("prev-btn");
const nextBtn = document.getElementById("next-btn");

let playlist = [];
let currentIndex = 0;
let currentTheme = root.getAttribute("data-theme") || "dark";

if (themeToggle) {
  themeToggle.addEventListener("click", () => {
    currentTheme = currentTheme === "dark" ? "light" : "dark";
    root.setAttribute("data-theme", currentTheme);
  });
}

function updateCounter() {
  const total = playlist.length;
  const current = total ? currentIndex + 1 : 0;
  videoCounter.textContent = `${current} / ${total}`;
}

function renderPlaylist() {
  playlistContainer.innerHTML = "";

  if (!playlist.length) {
    playlistContainer.innerHTML = `<p class="loading-text">Aucune vidéo disponible.</p>`;
    videoTitle.textContent = "Aucune vidéo disponible";
    videoDescription.textContent = "Ajoute des vidéos dans playlist.json.";
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
      <span class="playlist-item-title">${item.title}</span>
      <span class="playlist-item-meta">${item.src}</span>
    `;

    button.addEventListener("click", () => {
      loadVideo(index);
      player.play().catch(() => {});
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
  renderPlaylist();
}

async function loadPlaylist() {
  try {
    const response = await fetch("./playlist.json");
    if (!response.ok) {
      throw new Error("playlist.json introuvable");
    }

    const data = await response.json();
    playlist = Array.isArray(data) ? data : [];

    if (!playlist.length) {
      renderPlaylist();
      return;
    }

    loadVideo(0);
  } catch (error) {
    playlistContainer.innerHTML = `<p class="loading-text">Impossible de charger playlist.json.</p>`;
    videoTitle.textContent = "Erreur de chargement";
    videoDescription.textContent = "Vérifie la structure du fichier playlist.json.";
    updateCounter();
  }
}

if (prevBtn) {
  prevBtn.addEventListener("click", () => {
    if (!playlist.length) return;
    currentIndex = (currentIndex - 1 + playlist.length) % playlist.length;
    loadVideo(currentIndex);
    player.play().catch(() => {});
  });
}

if (nextBtn) {
  nextBtn.addEventListener("click", () => {
    if (!playlist.length) return;
    currentIndex = (currentIndex + 1) % playlist.length;
    loadVideo(currentIndex);
    player.play().catch(() => {});
  });
}

player.addEventListener("ended", () => {
  if (!playlist.length) return;
  currentIndex = (currentIndex + 1) % playlist.length;
  loadVideo(currentIndex);
  player.play().catch(() => {});
});

loadPlaylist();
