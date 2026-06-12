#!/usr/bin/env python3
import json
import re
from pathlib import Path

ROOT = Path.cwd()
VIDEO_DIR = ROOT / "videos"
PLAYLIST_JSON = ROOT / "playlist.json"
README = ROOT / "AUTO-PLAYLIST-README.md"
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
        json.dumps(playlist, ensure_ascii=False, indent=2),
        encoding="utf-8"
    )


def update_script_js(video_files):
    script_path = ROOT / "script.js"
    if not script_path.exists():
        return "[=] script.js introuvable"

    content = script_path.read_text(encoding="utf-8")
    replacements = {
        """button.innerHTML = `
      <span class="playlist-item-index">Vidéo ${index + 1}</span>
      <span class="playlist-item-title">${item.title}</span>
      <span class="playlist-item-path">${item.src}</span>
    `;""": """button.innerHTML = `
      <span class="playlist-item-index">Vidéo ${index + 1}</span>
      <span class="playlist-item-title">${item.title}</span>
      <span class="playlist-item-path">${item.filename || item.src}</span>
    `;""",
        "videoTitle.textContent = item.title;": "videoTitle.textContent = item.title;"
    }

    updated = content
    for old, new in replacements.items():
        updated = updated.replace(old, new)

    if updated != content:
        script_path.write_text(updated, encoding="utf-8")
        return "[OK] script.js renforcé pour afficher filename/src réel"
    return "[=] script.js déjà compatible"


def replace_video_references_in_text(text: str, real_video_names):
    pattern = r'(\.?/videos/)([^"\'\s)]+)'
    real_names_by_stem = {Path(name).stem.lower(): name for name in real_video_names}

    def replacer(match):
        prefix = match.group(1)
        old_name = match.group(2)
        stem = Path(old_name).stem.lower()
        if stem in real_names_by_stem:
            return prefix + real_names_by_stem[stem]
        return match.group(0)

    return re.sub(pattern, replacer, text)


def update_target_files(video_files):
    real_video_names = [file.name for file in video_files]
    messages = []

    for file_path in TARGET_FILES:
        if not file_path.exists():
            messages.append(f"[=] {file_path.name} introuvable")
            continue

        original = file_path.read_text(encoding="utf-8")
        updated = replace_video_references_in_text(original, real_video_names)

        if updated != original:
            file_path.write_text(updated, encoding="utf-8")
            messages.append(f"[OK] Références vidéo mises à jour dans {file_path.name}")
        else:
            messages.append(f"[=] Aucun changement dans {file_path.name}")

    messages.append(update_script_js(video_files))
    return messages


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
- met à jour les références trouvées dans `index.html`, `script.js` et `style.css`,
- empêche l'ancienne playlist de conserver d'anciens noms.

## Important

Le dossier `videos/` est la source de vérité.
"""
    README.write_text(content, encoding="utf-8")


def main():
    video_files = scan_videos()
    playlist = build_playlist(video_files)
    write_playlist(playlist)
    messages = update_target_files(video_files)
    write_readme()

    print(f"\n{len(playlist)} vidéo(s) détectée(s).")
    print("playlist.json a été régénéré avec les noms exacts du dossier videos/.\n")
    for msg in messages:
        print(msg)
    print()
    for item in playlist:
        print(f"- {item['filename']} -> {item['title']}")


if __name__ == "__main__":
    main()
