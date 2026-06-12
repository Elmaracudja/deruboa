cat > encode_videos.sh <<'EOF'
#!/usr/bin/env bash
set -e

SRC_DIR="videos"
OUT_DIR="videos_encoded"
BACKUP_DIR="videos_backup"

if ! command -v ffmpeg >/dev/null 2>&1; then
  echo "Erreur : ffmpeg n'est pas installé."
  echo "Installe-le avec : sudo apt update && sudo apt install -y ffmpeg"
  exit 1
fi

if [ ! -d "$SRC_DIR" ]; then
  echo "Erreur : dossier '$SRC_DIR' introuvable."
  exit 1
fi

mkdir -p "$OUT_DIR" "$BACKUP_DIR"

found=0
for f in "$SRC_DIR"/*; do
  [ -f "$f" ] || continue
  found=1
  base="$(basename "$f")"
  name="${base%.*}"
  echo "Encodage de $base ..."
  ffmpeg -y -i "$f" \
    -c:v libx264 \
    -preset medium \
    -crf 23 \
    -pix_fmt yuv420p \
    -c:a aac \
    -b:a 128k \
    -movflags +faststart \
    "$OUT_DIR/${name}.mp4"
done

if [ "$found" -eq 0 ]; then
  echo "Aucune vidéo trouvée dans '$SRC_DIR'."
  exit 1
fi

cp "$SRC_DIR"/* "$BACKUP_DIR"/ 2>/dev/null || true
find "$SRC_DIR" -type f -delete
cp "$OUT_DIR"/*.mp4 "$SRC_DIR"/

echo "Terminé : vidéos encodées dans $SRC_DIR/"
EOF
