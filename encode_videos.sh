#!/usr/bin/env bash
set -e

SRC_DIR="videos"
OUT_DIR="videos_encoded"
BACKUP_DIR="videos_backup"

mkdir -p "$OUT_DIR" "$BACKUP_DIR"

for f in "$SRC_DIR"/*; do
  [ -f "$f" ] || continue
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

mv "$SRC_DIR"/* "$BACKUP_DIR"/
cp "$OUT_DIR"/*.mp4 "$SRC_DIR"/

echo "Encodage terminé."
