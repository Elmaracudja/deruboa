#!/usr/bin/env python3
import json
import re
from pathlib import Path

ROOT = Path(__file__).resolve().parent
CWD = Path.cwd()
VIDEO_DIR = ROOT / "videos"
PLAYLIST_JSON = ROOT / "playlist.json"
README = ROOT / "AUTO-PLAYLIST-README.md"
INDEX_HTML = ROOT / "index.html"
SCRIPT_JS = ROOT / "script.js"
ASSETS_DIR = ROOT / "assets"

VIDEO_EXTENSIONS = {".mp4", ".m4v", ".webm", ".mov"}
LOGO_EXTENSIONS = {".png", ".jpg", ".jpeg", ".webp", ".gif", ".svg"}
DEFAULT_AUTHOR = "EKWallegory Prod"
DEFAULT_CHANNEL = "EM101 Webradio"
BRAND_ALT = "Logo EM101 Webradio"

BRAND_BLOCK_START = "<!-- auto-brand:start -->"
BRAND_BLOCK_END = "<!-- auto-brand:end -->"

EXPECTED_VIDEO_ATTRIBUTES = [
    "controls",
    "autoplay",
    "muted",
    "playsinline",
    'preload="metadata"',
    'controlslist="nodownload noremoteplayback"',
    "disablepictureinpicture",
    'oncontextmenu="return false;"',
]

EXPECTED_SCRIPT_SNIPPETS = [
    'document.addEventListener("contextmenu", (event) => {',
    "event.preventDefault();",
    "player.loop = false;",
    "player.disablePictureInPicture = true;",
    'player.controlsList.add("nodownload");',
    'player.controlsList.add("noremoteplayback");',
]


def slug_to_title(filename: str) -> str:
    stem = Path(filename).stem
    stem = re.sub(r"[_-]+", " ", stem)
    stem = re.sub(r"(?<=[a-z])(?=[A-Z0-9])", " ", stem)
    stem = re.sub(r"(?<=[0-9])(?=[A-Za-z])", " ", stem)
    stem = re.sub(r"\s+", " ", stem).strip()
    return stem.title() if stem else "Sans titre"


def debug_paths():
    print("\n=== DEBUG CHEMINS ===")
    print("Script exécuté :", Path(__file__).resolve())
    print("ROOT          :", ROOT)
    print("CWD           :", CWD)
    print("VIDEO_DIR     :", VIDEO_DIR)
    print("PLAYLIST_JSON :", PLAYLIST_JSON)
    print("INDEX_HTML    :", INDEX_HTML)
    print("SCRIPT_JS     :", SCRIPT_JS)
    print("ASSETS_DIR    :", ASSETS_DIR)
    print("=====================\n")


def ensure_videos_dir():
    if not VIDEO_DIR.exists() or not VIDEO_DIR.is_dir():
        raise SystemExit(
            f"Le dossier 'videos/' est introuvable.\n"
            f"Chemin attendu : {VIDEO_DIR}\n"
            f"Place ce script à la racine du site."
        )


def scan_videos():
    ensure_videos_dir()
    files = [
        path for path in VIDEO_DIR.iterdir()
        if path.is_file() and path.suffix.lower() in VIDEO_EXTENSIONS
    ]
    files = sorted(files, key=lambda p: p.name.lower())

    print("=== DEBUG VIDEOS ===")
    if files:
        for path in files:
            print(f"[VIDEO] {path.name}")
    else:
        print("[VIDEO] Aucune vidéo détectée dans videos/")
    print("====================\n")

    return files


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
    print(f"[OK] playlist.json écrit dans : {PLAYLIST_JSON}")


def find_logo_file():
    if not ASSETS_DIR.exists() or not ASSETS_DIR.is_dir():
        return None

    preferred_names = [
        "EM101.jpg", "EM101.jpeg", "EM101.png", "EM101.webp", "EM101.svg",
        "logo.jpg", "logo.jpeg", "logo.png", "logo.webp", "logo.svg",
    ]

    for name in preferred_names:
        candidate = ASSETS_DIR / name
        if candidate.exists() and candidate.is_file():
            return candidate

    files = [
        path for path in ASSETS_DIR.iterdir()
        if path.is_file() and path.suffix.lower() in LOGO_EXTENSIONS
    ]
    if not files:
        return None

    return sorted(files, key=lambda p: p.name.lower())[0]


def build_brand_block(logo_path: Path):
    rel_path = f"./assets/{logo_path.name}"
    return (
        f"{BRAND_BLOCK_START}\n"
        f'        <div class="brand">\n'
        f'          <img\n'
        f'            src="{rel_path}"\n'
        f'            alt="{BRAND_ALT}"\n'
        f'            class="brand-logo"\n'
        f'            width="320"\n'
        f'            height="320"\n'
        f'          />\n'
        f'        </div>\n'
        f"{BRAND_BLOCK_END}"
    )


def inject_brand_block(index_text: str, logo_path: Path):
    brand_block = build_brand_block(logo_path)
    brand_pattern = re.compile(
        rf"{re.escape(BRAND_BLOCK_START)}.*?{re.escape(BRAND_BLOCK_END)}",
        re.DOTALL,
    )

    if brand_pattern.search(index_text):
        return brand_pattern.sub(brand_block, index_text), "[OK] Bloc logo synchronisé dans index.html"

    marker = '<div class="meta">'
    if marker not in index_text:
        return index_text, "[!] Impossible d'insérer le logo : bloc .meta introuvable"

    replacement = marker + "\n" + brand_block
    return index_text.replace(marker, replacement, 1), "[OK] Bloc logo ajouté dans index.html"


def validate_video_tag(index_text: str):
    match = re.search(r'<video\b[^>]*id="player"[^>]*>', index_text, re.IGNORECASE | re.DOTALL)
    if not match:
        return ['[!] Balise <video id="player"> introuvable dans index.html']

    tag = match.group(0)
    messages = []

    for attr in EXPECTED_VIDEO_ATTRIBUTES:
        if attr not in tag:
            messages.append(f"[!] Attribut manquant sur <video> : {attr}")

    if not messages:
        messages.append("[OK] Balise vidéo conforme (anti clic droit, PiP, controlslist)")

    return messages


def validate_script_js():
    if not SCRIPT_JS.exists():
        return ["[!] script.js introuvable"]

    content = SCRIPT_JS.read_text(encoding="utf-8")
    messages = []
    missing = [snippet for snippet in EXPECTED_SCRIPT_SNIPPETS if snippet not in content]

    if missing:
        for snippet in missing:
            messages.append(f"[!] Snippet manquant dans script.js : {snippet}")
    else:
        messages.append("[OK] script.js conserve bien anti clic droit et protections player")

    return messages


def sync_index_html():
    if not INDEX_HTML.exists():
        return ["[!] index.html introuvable"]

    content = INDEX_HTML.read_text(encoding="utf-8")
    messages = []

    logo_path = find_logo_file()
    if logo_path is None:
        messages.append("[=] Aucun logo trouvé dans assets/ ; bloc logo non modifié")
    else:
        updated, msg = inject_brand_block(content, logo_path)
        if updated != content:
            INDEX_HTML.write_text(updated, encoding="utf-8")
            content = updated
            messages.append(f"[OK] index.html mis à jour : {INDEX_HTML}")
        messages.append(msg)
        messages.append(f"[OK] Logo détecté : {logo_path.name}")

    messages.extend(validate_video_tag(content))
    return messages


def write_readme():
    content = """# Mise à jour automatique de playlist

Ce script reconstruit `playlist.json` à partir des fichiers présents dans `videos/`.
Il peut aussi synchroniser automatiquement le bloc logo dans `index.html`.

## Usage

À la racine du site :

```bash
python3 update_playlist.py
```

## Ce que fait le script

- détecte automatiquement les vidéos dans `videos/`,
- régénère `playlist.json` uniquement à partir des vrais fichiers présents,
- force `title`, `src` et `filename` à correspondre aux noms réels,
- détecte un logo dans `assets/`,
- ajoute ou met à jour le bloc logo dans `index.html`,
- vérifie que les protections du lecteur sont toujours présentes.

## Important

Le script ne réécrit pas `script.js` ni `style.css`.
Il vérifie seulement que les protections attendues sont bien en place.
"""
    README.write_text(content, encoding="utf-8")
    print(f"[OK] README écrit dans : {README}")


def main():
    debug_paths()

    video_files = scan_videos()
    playlist = build_playlist(video_files)
    write_playlist(playlist)
    write_readme()

    messages = []
    messages.extend(sync_index_html())
    messages.extend(validate_script_js())

    print(f"\n{len(playlist)} vidéo(s) détectée(s).")
    print("playlist.json a été régénéré avec les noms exacts du dossier videos/.\n")

    for msg in messages:
        print(msg)

    print()
    if playlist:
        for item in playlist:
            print(f"- {item['filename']} -> {item['title']}")
    else:
        print("[INFO] Playlist vide : aucun fichier vidéo compatible trouvé.")


if __name__ == "__main__":
    main()
