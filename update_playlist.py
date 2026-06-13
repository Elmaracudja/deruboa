#!/usr/bin/env python3
import json
import re
from pathlib import Path

ROOT = Path(__file__).resolve().parent
VIDEO_DIR = ROOT / "videos"
PLAYLIST_JSON = ROOT / "playlist.json"
README = ROOT / "AUTO-PLAYLIST-README.md"

VIDEO_EXTENSIONS = {".mp4", ".m4v", ".webm", ".mov"}
DEFAULT_AUTHOR = "EKWallegory Prod"
DEFAULT_CHANNEL = "EM101 Webradio"


def slug_to_title(filename: str) -> str:
    stem = Path(filename).stem
    stem = re.sub(r"[_-]+", " ", stem)
    stem = re.sub(r"(?<=[a-z])(?=[A-Z0-9])", " ", stem)
    stem = re.sub(r"(?<=[0-9])(?=[A-Za-z])", " ", stem)
    stem = re.sub(r"\s+", " ", stem).strip()
    return stem.title() if stem else "Sans titre"


def ensure_videos_dir():
    if not VIDEO_DIR.exists() or not VIDEO_DIR.is_dir():
      raise SystemExit("Le dossier 'videos/' est introuvable. Place ce script à la racine du site.")


def scan_videos():
    ensure_videos_dir()
    files = [
        path for path in VIDEO_DIR.iterdir()
        if path.is_file() and path.suffix.lower() in VIDEO_EXTENSIONS
    ]
    return sorted(files, key=lambda p: p.name.lower())


def build_playlist(video_files):
    playlist = []
    for index, video_file in enumerate(video_files, start=1):
        forced_title = slug_to_title(video_file.name)
        playlist.append({
            "id": index,
            "title": forced_title,
            "src": f"./videos/{video_file.name}",
            "filename": video_file.name,
            "description": f"Production vidéo {forced_title} pour {DEFAULT_CHANNEL}.",
            "author": DEFAULT_AUTHOR,
            "channel": DEFAULT_CHANNEL
        })
    return playlist


def write_playlist(playlist):
    PLAYLIST_JSON.write_text(
        json.dumps(playlist, ensure_ascii=False, indent=2) + "\n",
        encoding="utf-8"
    )


def write_readme():
    content = """# Mise à jour automatique de playlist

Ce script reconstruit `playlist.json` à partir des fichiers présents dans `videos/`.

## Usage

À la racine du site :

```bash
python3 update_playlist.py
```

## Ce que fait le script

- détecte automatiquement les vidéos dans `videos/`,
- régénère `playlist.json` uniquement à partir des vrais fichiers présents,
- force `title`, `src` et `filename` à correspondre aux noms réels,
- évite de conserver d'anciens noms devenus faux.

## Important

Le dossier `videos/` est la source de vérité.
"""
    README.write_text(content, encoding="utf-8")


def main():
    video_files = scan_videos()
    playlist = build_playlist(video_files)
    write_playlist(playlist)
    write_readme()

    print(f"\n{len(playlist)} vidéo(s) détectée(s).")
    print("playlist.json a été régénéré avec les noms exacts du dossier videos/.\n")
    for item in playlist:
        print(f"- {item['filename']} -> {item['title']}")


if __name__ == "__main__":
    main()
