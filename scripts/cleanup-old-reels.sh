#!/bin/bash
#═══════════════════════════════════════════════════════════════════════════════
# Cleanup Old Reels Script
# 
# Removes reel files older than specified days to free up disk space
# 
# Usage:
#   chmod +x scripts/cleanup-old-reels.sh
#   ./scripts/cleanup-old-reels.sh [days]
#   
# Example:
#   ./scripts/cleanup-old-reels.sh 90  # Delete files older than 90 days
#═══════════════════════════════════════════════════════════════════════════════

# ══════════════════════════════════════════════════════════════
# CONFIGURATION
# ══════════════════════════════════════════════════════════════
APP_DIR="/var/www/NodePress"
UPLOADS_DIR="$APP_DIR/public/uploads/reels"
DAYS_OLD=${1:-90}  # Default to 90 days if not specified
DRY_RUN=${DRY_RUN:-false}  # Set DRY_RUN=true to preview without deleting

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
echo -e "${BLUE}🧹 Reels Cleanup Script${NC}"
echo -e "${BLUE}═══════════════════════════════════════════════════════════════${NC}"
echo ""

if [ "$DRY_RUN" = true ]; then
    echo -e "${YELLOW}⚠️  DRY RUN MODE - No files will be deleted${NC}"
    echo ""
fi

# ══════════════════════════════════════════════════════════════
# VALIDATION
# ══════════════════════════════════════════════════════════════
if [ ! -d "$UPLOADS_DIR" ]; then
    echo -e "${RED}✗ Reels directory not found: $UPLOADS_DIR${NC}"
    exit 1
fi

if ! [[ "$DAYS_OLD" =~ ^[0-9]+$ ]]; then
    echo -e "${RED}✗ Invalid number of days: $DAYS_OLD${NC}"
    echo "Usage: $0 [days]"
    exit 1
fi

if [ "$DAYS_OLD" -lt 30 ]; then
    echo -e "${YELLOW}⚠️  Warning: Deleting files less than 30 days old${NC}"
    read -p "Are you sure? (y/N) " -n 1 -r
    echo
    if [[ ! $REPLY =~ ^[Yy]$ ]]; then
        echo "Cancelled."
        exit 0
    fi
fi

# ══════════════════════════════════════════════════════════════
# FIND OLD FILES
# ══════════════════════════════════════════════════════════════
echo -e "${BLUE}Searching for files older than $DAYS_OLD days...${NC}"
echo ""

# Count files to be deleted
FILE_COUNT=$(find "$UPLOADS_DIR" -type f -mtime +$DAYS_OLD 2>/dev/null | wc -l)

if [ "$FILE_COUNT" -eq 0 ]; then
    echo -e "${GREEN}✓ No files found older than $DAYS_OLD days${NC}"
    exit 0
fi

# Calculate total size
TOTAL_SIZE=$(find "$UPLOADS_DIR" -type f -mtime +$DAYS_OLD -exec du -ch {} + 2>/dev/null | grep total$ | awk '{print $1}')

echo -e "${YELLOW}Found $FILE_COUNT files to delete${NC}"
echo -e "${YELLOW}Total size: $TOTAL_SIZE${NC}"
echo ""

# ══════════════════════════════════════════════════════════════
# SHOW PREVIEW
# ══════════════════════════════════════════════════════════════
echo -e "${BLUE}Preview of files to be deleted (first 10):${NC}"
echo ""

find "$UPLOADS_DIR" -type f -mtime +$DAYS_OLD -printf '%Tc %s %p\n' 2>/dev/null | \
    head -10 | \
    awk '{
        size=$4;
        for(i=5;i<=NF;i++) size=size" "$i;
        bytes=$4;
        if (bytes > 1073741824) size_fmt=sprintf("%.2f GB", bytes/1073741824);
        else if (bytes > 1048576) size_fmt=sprintf("%.2f MB", bytes/1048576);
        else if (bytes > 1024) size_fmt=sprintf("%.2f KB", bytes/1024);
        else size_fmt=sprintf("%d B", bytes);
        printf "%s %s %s - %s\n", $1, $2, $3, size_fmt
    }' | nl -w2 -s'. '

if [ "$FILE_COUNT" -gt 10 ]; then
    echo "... and $((FILE_COUNT - 10)) more files"
fi
echo ""

# ══════════════════════════════════════════════════════════════
# CONFIRMATION
# ══════════════════════════════════════════════════════════════
if [ "$DRY_RUN" != true ]; then
    echo -e "${RED}⚠️  WARNING: This will permanently delete $FILE_COUNT files!${NC}"
    read -p "Continue? (y/N) " -n 1 -r
    echo
    if [[ ! $REPLY =~ ^[Yy]$ ]]; then
        echo "Cancelled."
        exit 0
    fi
fi

# ══════════════════════════════════════════════════════════════
# DELETE FILES
# ══════════════════════════════════════════════════════════════
echo ""
echo -e "${BLUE}Deleting files...${NC}"

if [ "$DRY_RUN" = true ]; then
    echo -e "${YELLOW}(Dry run - no files actually deleted)${NC}"
    find "$UPLOADS_DIR" -type f -mtime +$DAYS_OLD 2>/dev/null | wc -l
else
    # Create backup list before deleting
    BACKUP_LIST="/tmp/reels-cleanup-$(date +%Y%m%d_%H%M%S).txt"
    find "$UPLOADS_DIR" -type f -mtime +$DAYS_OLD > "$BACKUP_LIST" 2>/dev/null
    
    # Delete files
    DELETED_COUNT=$(find "$UPLOADS_DIR" -type f -mtime +$DAYS_OLD -delete -print 2>/dev/null | wc -l)
    
    echo -e "${GREEN}✓ Deleted $DELETED_COUNT files${NC}"
    echo -e "${BLUE}Backup list saved to: $BACKUP_LIST${NC}"
fi

# ══════════════════════════════════════════════════════════════
# CLEANUP EMPTY DIRECTORIES
# ══════════════════════════════════════════════════════════════
echo ""
echo -e "${BLUE}Cleaning up empty directories...${NC}"

if [ "$DRY_RUN" = true ]; then
    EMPTY_DIRS=$(find "$UPLOADS_DIR" -type d -empty 2>/dev/null | wc -l)
    echo -e "${YELLOW}Would remove $EMPTY_DIRS empty directories${NC}"
else
    find "$UPLOADS_DIR" -type d -empty -delete 2>/dev/null
    echo -e "${GREEN}✓ Empty directories removed${NC}"
fi

# ══════════════════════════════════════════════════════════════
# SUMMARY
# ══════════════════════════════════════════════════════════════
echo ""
echo -e "${BLUE}═══════════════════════════════════════════════════════════════${NC}"
echo -e "${BLUE}📊 Cleanup Summary${NC}"
echo -e "${BLUE}═══════════════════════════════════════════════════════════════${NC}"
echo ""

if [ "$DRY_RUN" = true ]; then
    echo -e "${YELLOW}DRY RUN - No changes made${NC}"
    echo "Files that would be deleted: $FILE_COUNT"
    echo "Space that would be freed: $TOTAL_SIZE"
else
    echo -e "${GREEN}Cleanup completed successfully${NC}"
    echo "Files deleted: $DELETED_COUNT"
    echo "Space freed: $TOTAL_SIZE"
fi

echo ""
echo -e "${BLUE}Current disk usage:${NC}"
df -h "$UPLOADS_DIR" | tail -1 | awk '{printf "Used: %s / %s (%s)\n", $3, $2, $5}'

echo ""
echo -e "${BLUE}Remaining files:${NC}"
REMAINING_FILES=$(find "$UPLOADS_DIR" -type f 2>/dev/null | wc -l)
REMAINING_SIZE=$(du -sh "$UPLOADS_DIR" 2>/dev/null | cut -f1)
echo "Count: $REMAINING_FILES"
echo "Size: $REMAINING_SIZE"

echo ""
echo -e "${BLUE}═══════════════════════════════════════════════════════════════${NC}"
echo -e "${GREEN}✅ Cleanup Complete${NC}"
echo -e "${BLUE}═══════════════════════════════════════════════════════════════${NC}"
echo ""

# ══════════════════════════════════════════════════════════════
# RECOMMENDATIONS
# ══════════════════════════════════════════════════════════════
if [ "$DRY_RUN" != true ]; then
    echo -e "${YELLOW}💡 Recommendations:${NC}"
    echo "  → Schedule this script with cron for automatic cleanup"
    echo "  → Example: 0 3 * * 0 /path/to/cleanup-old-reels.sh 90"
    echo "  → Consider migrating to cloud storage for better scalability"
    echo ""
fi

