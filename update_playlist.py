#!/usr/bin/env python3
import json
import re
from pathlib import Path

ROOT = Path.cwd()
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
    if not VIDEO_DIR.exists():
        raise SystemExit("Le dossier 'videos/' est introuvable. Place ce script à la racine du site.")


def load_existing_playlist():
    if not PLAYLIST_JSON.exists():
        return []

    try:
        return json.loads(PLAYLIST_JSON.read_text(encoding="utf-8"))
    except Exception:
        return []


def scan_videos():
    ensure_videos_dir()
    files = [
        path for path in VIDEO_DIR.iterdir()
        if path.is_file() and path.suffix.lower() in VIDEO_EXTENSIONS
    ]
    return sorted(files, key=lambda p: p.name.lower())


def build_playlist(video_files):
    existing = load_existing_playlist()
    existing_by_src = {
        item.get("src"): item
        for item in existing
        if isinstance(item, dict) and item.get("src")
    }

    playlist = []

    for video_file in video_files:
        rel_src = f"./videos/{video_file.name}"
        old = existing_by_src.get(rel_src, {})

        playlist.append({
            "title": old.get("title") or slug_to_title(video_file.name),
            "src": rel_src,
            "description": old.get("description") or f"Production vidéo {slug_to_title(video_file.name)} pour {DEFAULT_CHANNEL}.",
            "author": old.get("author") or DEFAULT_AUTHOR,
            "channel": old.get("channel") or DEFAULT_CHANNEL
        })

    return playlist


def write_playlist(playlist):
    PLAYLIST_JSON.write_text(
        json.dumps(playlist, ensure_ascii=False, indent=2),
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
- met à jour `playlist.json`,
- conserve les métadonnées existantes si le même chemin vidéo existe déjà,
- génère un titre propre à partir du nom du fichier si nécessaire.

## Exemple

Si tu renommes :
- `openart1.mp4` → `nouveau-clip.mp4`

le script recréera une entrée avec :
- `src: ./videos/nouveau-clip.mp4`
- `title: Nouveau Clip`

## Important

Le site doit lire `playlist.json` dynamiquement via `fetch()` dans `script.js`. Si ton code actuel est celui mis en place précédemment, aucune autre modification manuelle n'est nécessaire.
"""
    README.write_text(content, encoding="utf-8")


def main():
    videos = scan_videos()
    playlist = build_playlist(videos)
    write_playlist(playlist)
    write_readme()

    print(f"{len(playlist)} vidéo(s) détectée(s). playlist.json mis à jour.")
    for item in playlist:
        print(f"- {item['src']} -> {item['title']}")


if __name__ == "__main__":
    main()
