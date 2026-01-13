#!/bin/bash
#═══════════════════════════════════════════════════════════════════════════════
# Reels Backup Script
# 
# Creates compressed backups of the reels directory
# Automatically removes backups older than specified retention period
# 
# Usage:
#   chmod +x scripts/backup-reels.sh
#   ./scripts/backup-reels.sh
#═══════════════════════════════════════════════════════════════════════════════

# ══════════════════════════════════════════════════════════════
# CONFIGURATION
# ══════════════════════════════════════════════════════════════
APP_DIR="/var/www/NodePress"
SOURCE_DIR="$APP_DIR/public/uploads/reels"
BACKUP_DIR="/var/backups/reels"
RETENTION_DAYS=7  # Keep backups for 7 days
DATE=$(date +%Y%m%d_%H%M%S)
BACKUP_FILE="reels_backup_$DATE.tar.gz"

# ══════════════════════════════════════════════════════════════
# COLORS
# ══════════════════════════════════════════════════════════════
GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m'

# ══════════════════════════════════════════════════════════════
# HEADER
# ══════════════════════════════════════════════════════════════
echo -e "${BLUE}═══════════════════════════════════════════════════════════════${NC}"
echo -e "${BLUE}💾 Reels Backup Script${NC}"
echo -e "${BLUE}═══════════════════════════════════════════════════════════════${NC}"
echo ""
echo -e "${BLUE}Started: $(date '+%Y-%m-%d %H:%M:%S')${NC}"
echo ""

# ══════════════════════════════════════════════════════════════
# VALIDATION
# ══════════════════════════════════════════════════════════════
if [ ! -d "$SOURCE_DIR" ]; then
    echo -e "${RED}✗ Source directory not found: $SOURCE_DIR${NC}"
    exit 1
fi

# Create backup directory if it doesn't exist
if [ ! -d "$BACKUP_DIR" ]; then
    echo -e "${YELLOW}Creating backup directory: $BACKUP_DIR${NC}"
    mkdir -p "$BACKUP_DIR"
    if [ $? -ne 0 ]; then
        echo -e "${RED}✗ Failed to create backup directory${NC}"
        exit 1
    fi
fi

# ══════════════════════════════════════════════════════════════
# CHECK DISK SPACE
# ══════════════════════════════════════════════════════════════
echo -e "${BLUE}Checking disk space...${NC}"

SOURCE_SIZE=$(du -sb "$SOURCE_DIR" | awk '{print $1}')
AVAILABLE_SPACE=$(df "$BACKUP_DIR" | tail -1 | awk '{print $4}')
AVAILABLE_BYTES=$((AVAILABLE_SPACE * 1024))

# Need at least 2x source size for safety (compressed + uncompressed)
REQUIRED_SPACE=$((SOURCE_SIZE * 2))

if [ "$AVAILABLE_BYTES" -lt "$REQUIRED_SPACE" ]; then
    echo -e "${RED}✗ Insufficient disk space${NC}"
    echo "Required: $(numfmt --to=iec $REQUIRED_SPACE)"
    echo "Available: $(numfmt --to=iec $AVAILABLE_BYTES)"
    exit 1
fi

echo -e "${GREEN}✓ Sufficient disk space available${NC}"
echo ""

# ══════════════════════════════════════════════════════════════
# SOURCE INFORMATION
# ══════════════════════════════════════════════════════════════
echo -e "${BLUE}Source Information:${NC}"
echo "Directory: $SOURCE_DIR"
echo "Size: $(du -sh "$SOURCE_DIR" | cut -f1)"
echo "Files: $(find "$SOURCE_DIR" -type f | wc -l)"
echo ""

# ══════════════════════════════════════════════════════════════
# CREATE BACKUP
# ══════════════════════════════════════════════════════════════
echo -e "${BLUE}Creating backup...${NC}"
echo "Backup file: $BACKUP_FILE"
echo ""

# Create the backup with progress
if tar -czf "$BACKUP_DIR/$BACKUP_FILE" -C "$(dirname "$SOURCE_DIR")" "$(basename "$SOURCE_DIR")" 2>&1; then
    echo ""
    echo -e "${GREEN}✓ Backup created successfully${NC}"
else
    echo ""
    echo -e "${RED}✗ Backup failed${NC}"
    exit 1
fi

# ══════════════════════════════════════════════════════════════
# BACKUP INFORMATION
# ══════════════════════════════════════════════════════════════
echo ""
echo -e "${BLUE}Backup Information:${NC}"
echo "File: $BACKUP_DIR/$BACKUP_FILE"
echo "Size: $(du -sh "$BACKUP_DIR/$BACKUP_FILE" | cut -f1)"

# Calculate compression ratio
BACKUP_SIZE=$(du -sb "$BACKUP_DIR/$BACKUP_FILE" | awk '{print $1}')
if [ "$SOURCE_SIZE" -gt 0 ]; then
    COMPRESSION_RATIO=$(awk "BEGIN {printf \"%.1f\", ($SOURCE_SIZE - $BACKUP_SIZE) / $SOURCE_SIZE * 100}")
    echo "Compression: ${COMPRESSION_RATIO}% saved"
fi
echo ""

# ══════════════════════════════════════════════════════════════
# CLEANUP OLD BACKUPS
# ══════════════════════════════════════════════════════════════
echo -e "${BLUE}Cleaning up old backups (older than $RETENTION_DAYS days)...${NC}"

OLD_BACKUPS=$(find "$BACKUP_DIR" -name "reels_backup_*.tar.gz" -mtime +$RETENTION_DAYS 2>/dev/null)
OLD_COUNT=$(echo "$OLD_BACKUPS" | grep -c "reels_backup_" || echo "0")

if [ "$OLD_COUNT" -gt 0 ]; then
    echo "Found $OLD_COUNT old backup(s) to remove:"
    echo "$OLD_BACKUPS" | nl -w2 -s'. '
    
    # Delete old backups
    find "$BACKUP_DIR" -name "reels_backup_*.tar.gz" -mtime +$RETENTION_DAYS -delete
    echo -e "${GREEN}✓ Old backups removed${NC}"
else
    echo -e "${GREEN}✓ No old backups to remove${NC}"
fi
echo ""

# ══════════════════════════════════════════════════════════════
# BACKUP SUMMARY
# ══════════════════════════════════════════════════════════════
echo -e "${BLUE}═══════════════════════════════════════════════════════════════${NC}"
echo -e "${BLUE}📊 Backup Summary${NC}"
echo -e "${BLUE}═══════════════════════════════════════════════════════════════${NC}"
echo ""

# List all current backups
echo -e "${BLUE}Current Backups:${NC}"
BACKUP_LIST=$(find "$BACKUP_DIR" -name "reels_backup_*.tar.gz" -printf '%Tc %s %p\n' 2>/dev/null | sort -r)
BACKUP_COUNT=$(echo "$BACKUP_LIST" | grep -c "reels_backup_" || echo "0")

if [ "$BACKUP_COUNT" -gt 0 ]; then
    echo "$BACKUP_LIST" | awk '{
        size=$4;
        for(i=5;i<=NF;i++) size=size" "$i;
        bytes=$4;
        if (bytes > 1073741824) size_fmt=sprintf("%.2f GB", bytes/1073741824);
        else if (bytes > 1048576) size_fmt=sprintf("%.2f MB", bytes/1048576);
        else if (bytes > 1024) size_fmt=sprintf("%.2f KB", bytes/1024);
        else size_fmt=sprintf("%d B", bytes);
        printf "%s %s %s - %s\n", $1, $2, $3, size_fmt
    }' | nl -w2 -s'. '
    
    echo ""
    echo "Total backups: $BACKUP_COUNT"
    echo "Total size: $(du -sh "$BACKUP_DIR" | cut -f1)"
else
    echo -e "${YELLOW}No backups found${NC}"
fi

echo ""
echo -e "${BLUE}Disk Usage:${NC}"
df -h "$BACKUP_DIR" | tail -1 | awk '{printf "Used: %s / %s (%s)\n", $3, $2, $5}'

echo ""
echo -e "${BLUE}═══════════════════════════════════════════════════════════════${NC}"
echo -e "${GREEN}✅ Backup Complete${NC}"
echo -e "${BLUE}═══════════════════════════════════════════════════════════════${NC}"
echo ""
echo -e "${BLUE}Completed: $(date '+%Y-%m-%d %H:%M:%S')${NC}"
echo ""

# ══════════════════════════════════════════════════════════════
# RESTORE INSTRUCTIONS
# ══════════════════════════════════════════════════════════════
echo -e "${YELLOW}💡 To restore from this backup:${NC}"
echo "  tar -xzf $BACKUP_DIR/$BACKUP_FILE -C /tmp/"
echo "  sudo cp -r /tmp/reels/* $SOURCE_DIR/"
echo "  sudo chown -R nodepress:nodepress $SOURCE_DIR"
echo ""

