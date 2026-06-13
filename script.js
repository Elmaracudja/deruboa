const player = document.getElementById("player");
const videoTitle = document.getElementById("video-title");
const videoFile = document.getElementById("video-file");

let playlist = [];
let currentIndex = 0;
let failedIndexes = new Set();

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

function updateMeta(item, suffix = "") {
  videoTitle.textContent = getDisplayName(item);
  videoFile.textContent = `${getFilename(item)}${suffix}`;
}

function loadVideo(index) {
  if (!playlist.length) return;

  currentIndex = ((index % playlist.length) + playlist.length) % playlist.length;
  const item = playlist[currentIndex];

  player.src = item.src;
  player.load();

  updateMeta(item);

  player.play().catch((error) => {
    console.warn("Lecture impossible :", item.src, error);
  });
}

function skipToNextPlayable() {
  if (!playlist.length) return;

  failedIndexes.add(currentIndex);

  if (failedIndexes.size >= playlist.length) {
    videoTitle.textContent = "Aucune vidéo lisible";
    videoFile.textContent = "Tous les fichiers de la playlist ont échoué.";
    player.removeAttribute("src");
    player.load();
    return;
  }

  const failedItem = playlist[currentIndex];
  updateMeta(failedItem, " — fichier illisible, passage au suivant…");
  loadVideo(currentIndex + 1);
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
    failedIndexes.clear();
    loadVideo(0);
  })
  .catch((error) => {
    console.error(error);
    videoTitle.textContent = "Erreur de chargement";
    videoFile.textContent = "Playlist indisponible.";
  });

player.addEventListener("ended", () => {
  if (!playlist.length) return;
  failedIndexes.delete(currentIndex);
  loadVideo(currentIndex + 1);
});

player.addEventListener("error", () => {
  console.error("Erreur vidéo :", player.error);
  skipToNextPlayable();
});
