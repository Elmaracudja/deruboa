#!/usr/bin/env python3
import json
import re
from pathlib import Path

ROOT = Path.cwd()
VIDEO_DIR = ROOT / "videos"
PLAYLIST_JSON = ROOT / "playlist.json"
TARGET_FILES = [
    ROOT / "index.html",
    ROOT / "script.js",
    ROOT / "style.css",
]

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


def scan_videos():
    ensure_videos_dir()
    files = [
        path for path in VIDEO_DIR.iterdir()
        if path.is_file() and path.suffix.lower() in VIDEO_EXTENSIONS
    ]
    return sorted(files, key=lambda p: p.name.lower())


def load_existing_playlist():
    if not PLAYLIST_JSON.exists():
        return []
    try:
        return json.loads(PLAYLIST_JSON.read_text(encoding="utf-8"))
    except Exception:
        return []


def build_playlist(video_files):
    existing = load_existing_playlist()
    existing_by_title = {
        item.get("title"): item
        for item in existing
        if isinstance(item, dict) and item.get("title")
    }

    playlist = []
    for video_file in video_files:
        title = slug_to_title(video_file.name)
        old = existing_by_title.get(title, {})

        playlist.append({
            "title": old.get("title") or title,
            "src": f"./videos/{video_file.name}",
            "description": old.get("description") or f"Production vidéo {title} pour {DEFAULT_CHANNEL}.",
            "author": old.get("author") or DEFAULT_AUTHOR,
            "channel": old.get("channel") or DEFAULT_CHANNEL
        })

    return playlist


def write_playlist(playlist):
    PLAYLIST_JSON.write_text(
        json.dumps(playlist, ensure_ascii=False, indent=2),
        encoding="utf-8"
    )


def replace_video_references_in_text(text: str, real_video_names):
    pattern = r'(\.?/videos/)([^"\'\s)]+)'
    found_refs = re.findall(pattern, text)

    if not found_refs:
        return text

    real_names_by_stem = {Path(name).stem.lower(): name for name in real_video_names}

    def replacer(match):
        prefix = match.group(1)
        old_name = match.group(2)
        old_path = Path(old_name)
        stem = old_path.stem.lower()

        if stem in real_names_by_stem:
            return prefix + real_names_by_stem[stem]

        return match.group(0)

    return re.sub(pattern, replacer, text)


def update_target_files(video_files):
    real_video_names = [file.name for file in video_files]

    for file_path in TARGET_FILES:
        if not file_path.exists():
            continue

        original = file_path.read_text(encoding="utf-8")
        updated = replace_video_references_in_text(original, real_video_names)

        if updated != original:
            file_path.write_text(updated, encoding="utf-8")
            print(f"[OK] Références vidéo mises à jour dans {file_path.name}")
        else:
            print(f"[=] Aucun changement dans {file_path.name}")


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
- force les chemins vidéo à correspondre aux vrais noms présents dans `videos/`,
- met à jour aussi les références trouvées dans `index.html`, `script.js` et `style.css`,
- conserve les métadonnées existantes quand c'est possible.

## Important

Le dossier `videos/` devient la source de vérité.
"""
    (ROOT / "AUTO-PLAYLIST-README.md").write_text(content, encoding="utf-8")


def main():
    video_files = scan_videos()
    playlist = build_playlist(video_files)
    write_playlist(playlist)
    update_target_files(video_files)
    write_readme()

    print(f"\n{len(playlist)} vidéo(s) détectée(s).")
    print("playlist.json a été régénéré.\n")

    for item in playlist:
        print(f"- {item['src']} -> {item['title']}")


if __name__ == "__main__":
    main()
