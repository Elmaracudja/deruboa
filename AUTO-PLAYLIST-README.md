# Mise à jour automatique de playlist

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
