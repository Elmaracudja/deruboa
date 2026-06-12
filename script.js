let playlist = [];
let currentIndex = 0;
const video = document.getElementById("player");

fetch("./playlist.json")
  .then(res => res.json())
  .then(data => {
    playlist = data;
    if (playlist.length > 0) {
      video.src = playlist[0].src;
    }
  });

video.addEventListener("ended", () => {
  currentIndex = (currentIndex + 1) % playlist.length;
  video.src = playlist[currentIndex].src;
  video.play();
});
