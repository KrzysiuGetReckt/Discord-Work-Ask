#!/bin/bash
SOURCE_DIR="/discord-work-ask/raporty"
BACKUP_DIR="/discord-work-ask/backup/raporty"
ARCHIVE_NAME="raporty_$(date +%Y-%m-%d).tar.gz"

mkdir -p "$BACKUP_DIR"
tar -czf "$BACKUP_DIR/$ARCHIVE_NAME" -C "$SOURCE_DIR" .
echo "Raports archived: $ARCHIVE_NAME"

find "$BACKUP_DIR" -type f -name "logs_*.tar.gz" -mtime +180 -exec rm -f {} \;
echo "Older archived logs are being deleted."