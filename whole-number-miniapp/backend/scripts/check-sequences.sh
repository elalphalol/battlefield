#!/bin/bash
# Check PostgreSQL sequences and report any mismatches
# Returns exit code 1 if any sequences are out of sync

set -e

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
BACKEND_DIR="$(dirname "$SCRIPT_DIR")"

# Load environment variables
if [ -f "$BACKEND_DIR/.env" ]; then
    export $(grep -v '^#' "$BACKEND_DIR/.env" | xargs)
fi

# Extract connection details from DATABASE_URL
DB_URL="${DATABASE_URL:-postgresql://postgres:password@localhost:5432/battlefield}"
DB_HOST=$(echo "$DB_URL" | sed -n 's/.*@\([^:]*\):.*/\1/p')
DB_PORT=$(echo "$DB_URL" | sed -n 's/.*:\([0-9]*\)\/.*/\1/p')
DB_NAME=$(echo "$DB_URL" | sed -n 's/.*\/\([^?]*\).*/\1/p')
DB_USER=$(echo "$DB_URL" | sed -n 's/.*:\/\/\([^:]*\):.*/\1/p')
DB_PASS=$(echo "$DB_URL" | sed -n 's/.*:\/\/[^:]*:\([^@]*\)@.*/\1/p')

export PGPASSWORD="$DB_PASS"

ISSUES=0
TABLES=("trades" "users" "referrals")

for TABLE in "${TABLES[@]}"; do
    SEQ_NAME="${TABLE}_id_seq"

    EXISTS=$(psql -h "$DB_HOST" -p "$DB_PORT" -U "$DB_USER" -d "$DB_NAME" -t -c \
        "SELECT EXISTS (SELECT 1 FROM information_schema.sequences WHERE sequence_name = '$SEQ_NAME');" 2>/dev/null | tr -d ' ')

    if [ "$EXISTS" = "t" ]; then
        MAX_ID=$(psql -h "$DB_HOST" -p "$DB_PORT" -U "$DB_USER" -d "$DB_NAME" -t -c \
            "SELECT COALESCE(MAX(id), 0) FROM $TABLE;" 2>/dev/null | tr -d ' ')

        SEQ_VAL=$(psql -h "$DB_HOST" -p "$DB_PORT" -U "$DB_USER" -d "$DB_NAME" -t -c \
            "SELECT last_value FROM $SEQ_NAME;" 2>/dev/null | tr -d ' ')

        if [ "$MAX_ID" -ge "$SEQ_VAL" ]; then
            echo "❌ MISMATCH: $TABLE - max_id=$MAX_ID, sequence=$SEQ_VAL"
            ISSUES=$((ISSUES + 1))
        fi
    fi
done

if [ $ISSUES -gt 0 ]; then
    echo ""
    echo "Found $ISSUES sequence issue(s). Run fix-sequences.sh to repair."
    exit 1
fi

exit 0
