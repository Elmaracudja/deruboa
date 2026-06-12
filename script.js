const root = document.documentElement;
const themeToggle = document.getElementById("theme-toggle");
const player = document.getElementById("player");
const playlistContainer = document.getElementById("playlist");
const videoTitle = document.getElementById("video-title");
const videoDescription = document.getElementById("video-description");
const videoCounter = document.getElementById("video-counter");
const prevBtn = document.getElementById("prev-btn");
const nextBtn = document.getElementById("next-btn");
const tabsContainer = document.getElementById("playlist-tabs");

let allVideos = [];
let filteredVideos = [];
let currentIndex = 0;
let currentFilter = "all";
let currentTheme = root.getAttribute("data-theme") || "dark";

if (themeToggle) {
  themeToggle.addEventListener("click", () => {
    currentTheme = currentTheme === "dark" ? "light" : "dark";
    root.setAttribute("data-theme", currentTheme);
  });
}

function normalizeCategory(value) {
  return (value || "").trim().toLowerCase();
}

function updateCounter() {
  const total = filteredVideos.length;
  const current = total ? currentIndex + 1 : 0;
  videoCounter.textContent = `${current} / ${total}`;
}

function renderPlaylist() {
  playlistContainer.innerHTML = "";

  if (!filteredVideos.length) {
    playlistContainer.innerHTML = `<p class="loading-text">Aucune vidéo dans cette catégorie.</p>`;
    videoTitle.textContent = "Aucune vidéo disponible";
    videoDescription.textContent = "Ajoute des entrées dans playlist.json ou change de catégorie.";
    updateCounter();
    player.removeAttribute("src");
    player.load();
    return;
  }

  filteredVideos.forEach((item, index) => {
    const button = document.createElement("button");
    button.type = "button";
    button.className = "playlist-item";
    if (index === currentIndex) button.classList.add("active");

    button.innerHTML = `
      <span class="playlist-item-index">Vidéo ${index + 1}</span>
      <span class="playlist-item-title">${item.title}</span>
      <span class="playlist-item-meta">${item.category || "Playlist"} · ${item.src}</span>
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
  if (!filteredVideos.length) return;

  currentIndex = index;
  const item = filteredVideos[currentIndex];

  player.src = item.src;
  player.load();

  videoTitle.textContent = item.title || "Sans titre";
  videoDescription.textContent = item.description || "Aucune description fournie.";
  renderPlaylist();
}

function applyFilter(filterValue) {
  currentFilter = filterValue;

  if (currentFilter === "all") {
    filteredVideos = [...allVideos];
  } else {
    filteredVideos = allVideos.filter(
      (item) => normalizeCategory(item.category) === normalizeCategory(currentFilter)
    );
  }

  currentIndex = 0;
  renderPlaylist();

  if (filteredVideos.length) {
    loadVideo(0);
  }
}

async function loadPlaylist() {
  try {
    const response = await fetch("./playlist.json");
    if (!response.ok) {
      throw new Error("playlist.json introuvable");
    }

    const data = await response.json();
    allVideos = Array.isArray(data) ? data : [];

    if (!allVideos.length) {
      filteredVideos = [];
      renderPlaylist();
      return;
    }

    filteredVideos = [...allVideos];
    loadVideo(0);
  } catch (error) {
    playlistContainer.innerHTML = `<p class="loading-text">Impossible de charger playlist.json.</p>`;
    videoTitle.textContent = "Erreur de chargement";
    videoDescription.textContent = "Vérifie la structure du fichier playlist.json.";
    updateCounter();
  }
}

if (tabsContainer) {
  tabsContainer.addEventListener("click", (event) => {
    const button = event.target.closest(".playlist-tab");
    if (!button) return;

    const filterValue = button.dataset.filter || "all";

    tabsContainer.querySelectorAll(".playlist-tab").forEach((tab) => {
      tab.classList.remove("active");
    });
    button.classList.add("active");

    applyFilter(filterValue);
  });
}

if (prevBtn) {
  prevBtn.addEventListener("click", () => {
    if (!filteredVideos.length) return;
    currentIndex = (currentIndex - 1 + filteredVideos.length) % filteredVideos.length;
    loadVideo(currentIndex);
    player.play().catch(() => {});
  });
}

if (nextBtn) {
  nextBtn.addEventListener("click", () => {
    if (!filteredVideos.length) return;
    currentIndex = (currentIndex + 1) % filteredVideos.length;
    loadVideo(currentIndex);
    player.play().catch(() => {});
  });
}

player.addEventListener("ended", () => {
  if (!filteredVideos.length) return;
  currentIndex = (currentIndex + 1) % filteredVideos.length;
  loadVideo(currentIndex);
  player.play().catch(() => {});
});

loadPlaylist();
