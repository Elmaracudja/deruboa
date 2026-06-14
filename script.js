const player = document.getElementById("player");
const videoTitle = document.getElementById("video-title");
const videoFile = document.getElementById("video-file");
const playlistLoop = document.getElementById("playlist-loop");

let playlist = [];
let currentIndex = 0;
let failedIndexes = new Set();

document.addEventListener("contextmenu", (event) => {
  event.preventDefault();
});

player.loop = false;
player.disablePictureInPicture = true;

if (player.controlsList) {
  player.controlsList.add("nodownload");
  player.controlsList.add("noremoteplayback");
}

function getDisplayName(item) {
  if (item.title) return item.title;
  return "Vidéo sans titre";
}

function getSecondaryText(item, suffix = "") {
  const baseText = item.description || "";
  return `${baseText}${suffix}`;
}

function updateMeta(item, suffix = "") {
  videoTitle.textContent = getDisplayName(item);
  videoFile.textContent = getSecondaryText(item, suffix);
}

function stopPlayback(message) {
  player.pause();
  player.removeAttribute("src");
  player.load();
  if (message) {
    videoFile.textContent = message;
  }
}

function loadVideo(index) {
  if (!playlist.length) return;
  if (index < 0 || index >= playlist.length) return;

  currentIndex = index;
  const item = playlist[currentIndex];

  player.src = item.src;
  player.load();

  updateMeta(item);

  if ("mediaSession" in navigator) {
    navigator.mediaSession.metadata = new MediaMetadata({
      title: item.title || "Vidéo sans titre",
      artist: item.author || "",
      album: item.channel || ""
    });
  }

  player.play().catch((error) => {
    console.warn("Lecture impossible :", item.src, error);
  });
}

function findNextPlayableIndex(startIndex) {
  for (let i = startIndex; i < playlist.length; i += 1) {
    if (!failedIndexes.has(i)) {
      return i;
    }
  }

  if (playlistLoop.checked) {
    for (let i = 0; i < startIndex; i += 1) {
      if (!failedIndexes.has(i)) {
        return i;
      }
    }
  }

  return -1;
}

function skipToNextPlayable() {
  if (!playlist.length) return;

  failedIndexes.add(currentIndex);

  if (failedIndexes.size >= playlist.length) {
    videoTitle.textContent = "Aucune vidéo lisible";
    stopPlayback("Tous les fichiers de la playlist ont échoué.");
    return;
  }

  const failedItem = playlist[currentIndex];
  updateMeta(failedItem, " — fichier illisible, passage au suivant…");

  const nextIndex = findNextPlayableIndex(currentIndex + 1);

  if (nextIndex !== -1) {
    loadVideo(nextIndex);
    return;
  }

  videoTitle.textContent = "Fin de lecture";
  stopPlayback("Aucune autre vidéo lisible disponible.");
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

  videoFile.textContent = "Fin de playlist.";
});

player.addEventListener("error", () => {
  console.error("Erreur vidéo :", player.error);
  skipToNextPlayable();
});
