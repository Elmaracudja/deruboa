const player = document.getElementById("player");
const videoTitle = document.getElementById("video-title");
const videoFile = document.getElementById("video-file");

let playlist = [];
let currentIndex = 0;

function getDisplayName(item) {
  if (item.title) return item.title;
  if (item.filename) return item.filename;
  if (item.src) return item.src.split("/").pop();
  return "Vidéo sans titre";
}

function getFilename(item) {
  if (item.filename) return item.filename;
  if (item.src) return item.src.split("/").pop();
  return "Fichier inconnu";
}

function loadVideo(index) {
  if (!playlist.length) return;

  currentIndex = index % playlist.length;
  const item = playlist[currentIndex];

  player.src = item.src;
  player.load();

  videoTitle.textContent = getDisplayName(item);
  videoFile.textContent = getFilename(item);

  player.play().catch(() => {});
}

fetch("./playlist.json?_=" + Date.now())
  .then((response) => {
    if (!response.ok) {
      throw new Error("Impossible de charger playlist.json");
    }
    return response.json();
  })
  .then((data) => {
    if (!Array.isArray(data) || data.length === 0) {
      throw new Error("Playlist vide ou invalide");
    }

    playlist = data;
    loadVideo(0);
  })
  .catch((error) => {
    console.error(error);
    videoTitle.textContent = "Erreur de chargement";
    videoFile.textContent = "Playlist indisponible.";
  });

player.addEventListener("ended", () => {
  if (!playlist.length) return;
  loadVideo(currentIndex + 1);
});
