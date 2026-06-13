const player = document.getElementById("player");
const videoTitle = document.getElementById("video-title");
const videoFile = document.getElementById("video-file");
const playlistLoop = document.getElementById("playlist-loop");

let playlist = [];
let currentIndex = 0;
let failedIndexes = new Set();

player.loop = false;

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
  if (index < 0 || index >= playlist.length) return;

  currentIndex = index;
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

  let nextIndex = currentIndex + 1;

  while (failedIndexes.has(nextIndex) && nextIndex < playlist.length) {
    nextIndex += 1;
  }

  if (nextIndex < playlist.length) {
    loadVideo(nextIndex);
    return;
  }

  if (playlistLoop.checked) {
    nextIndex = 0;
    while (failedIndexes.has(nextIndex) && nextIndex < playlist.length) {
      nextIndex += 1;
    }
    if (nextIndex < playlist.length) {
      loadVideo(nextIndex);
      return;
    }
  }

  videoTitle.textContent = "Fin de lecture";
  videoFile.textContent = "Aucune autre vidéo lisible disponible.";
  player.removeAttribute("src");
  player.load();
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

  const nextIndex = currentIndex + 1;

  if (nextIndex < playlist.length) {
    loadVideo(nextIndex);
    return;
  }

  if (playlistLoop.checked) {
    failedIndexes.clear();
    loadVideo(0);
    return;
  }

  videoFile.textContent = `${getFilename(playlist[currentIndex])} — fin de playlist.`;
});

player.addEventListener("error", () => {
  console.error("Erreur vidéo :", player.error);
  skipToNextPlayable();
});
