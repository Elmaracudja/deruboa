const player = document.getElementById("player");
const playlistContainer = document.getElementById("playlist");
const videoTitle = document.getElementById("video-title");

let playlist = [];
let currentIndex = 0;

function formatDisplayName(item) {
  if (item.filename) return item.filename;
  if (item.src) return item.src.split("/").pop();
  return "Fichier inconnu";
}

function renderPlaylist() {
  playlistContainer.innerHTML = "";

  playlist.forEach((item, index) => {
    const button = document.createElement("button");
    button.className = "playlist-item";
    button.type = "button";

    if (index === currentIndex) {
      button.classList.add("active");
    }

    button.innerHTML = `
      <span class="playlist-item-index">Vidéo ${index + 1}</span>
      <span class="playlist-item-title">${item.title || formatDisplayName(item)}</span>
      <span class="playlist-item-path">${formatDisplayName(item)}</span>
    `;

    button.addEventListener("click", () => {
      loadVideo(index);
      player.play().catch(() => {});
    });

    playlistContainer.appendChild(button);
  });
}

function loadVideo(index) {
  currentIndex = index;
  const item = playlist[currentIndex];

  if (!item) return;

  player.src = item.src;
  videoTitle.textContent = item.title || formatDisplayName(item);
  renderPlaylist();
}

fetch("./playlist.json?_=" + Date.now())
  .then((response) => {
    if (!response.ok) {
      throw new Error("Impossible de charger playlist.json");
    }
    return response.json();
  })
  .then((data) => {
    if (!Array.isArray(data)) {
      throw new Error("Le format de playlist.json est invalide");
    }

    playlist = data;

    if (!playlist.length) {
      videoTitle.textContent = "Aucune vidéo disponible";
      playlistContainer.innerHTML = `<p class="playlist-item-path">La playlist est vide.</p>`;
      return;
    }

    loadVideo(0);
  })
  .catch((error) => {
    console.error(error);
    videoTitle.textContent = "Erreur de chargement";
    playlistContainer.innerHTML = `<p class="playlist-item-path">Impossible de lire playlist.json.</p>`;
  });

player.addEventListener("ended", () => {
  if (!playlist.length) return;

  const nextIndex = (currentIndex + 1) % playlist.length;
  loadVideo(nextIndex);
  player.play().catch(() => {});
});
