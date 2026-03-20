#!/bin/bash
LOG_DIR="/discord-work-ask/logs"
BACKUP_DIR="/discord-work-ask/backup/logs"
ARCHIVE_NAME="logs_$(date +%Y-%m-%d).tar.gz"

mkdir -p "$BACKUP_DIR"
tar -czf "$BACKUP_DIR/$ARCHIVE_NAME" -C "$LOG_DIR" .
echo "Logs archived: $ARCHIVE_NAME"

find "$BACKUP_DIR" -type f -name "logs_*.tar.gz" -mtime +180 -exec rm -f {} \;
echo "Older Logs are being deleted."