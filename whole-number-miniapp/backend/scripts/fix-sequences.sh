#!/bin/bash
# Fix PostgreSQL sequences that are out of sync with table data
# This prevents "duplicate key value violates unique constraint" errors

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

echo "🔧 Fixing database sequences..."
echo "   Database: $DB_NAME @ $DB_HOST:$DB_PORT"

# Tables and their sequences to fix
TABLES=("trades" "users" "referrals")

for TABLE in "${TABLES[@]}"; do
    SEQ_NAME="${TABLE}_id_seq"

    # Check if table and sequence exist
    EXISTS=$(psql -h "$DB_HOST" -p "$DB_PORT" -U "$DB_USER" -d "$DB_NAME" -t -c \
        "SELECT EXISTS (SELECT 1 FROM information_schema.sequences WHERE sequence_name = '$SEQ_NAME');" 2>/dev/null | tr -d ' ')

    if [ "$EXISTS" = "t" ]; then
        # Get current max ID and sequence value
        MAX_ID=$(psql -h "$DB_HOST" -p "$DB_PORT" -U "$DB_USER" -d "$DB_NAME" -t -c \
            "SELECT COALESCE(MAX(id), 0) FROM $TABLE;" 2>/dev/null | tr -d ' ')

        SEQ_VAL=$(psql -h "$DB_HOST" -p "$DB_PORT" -U "$DB_USER" -d "$DB_NAME" -t -c \
            "SELECT last_value FROM $SEQ_NAME;" 2>/dev/null | tr -d ' ')

        if [ "$MAX_ID" -ge "$SEQ_VAL" ]; then
            NEW_VAL=$((MAX_ID + 1))
            psql -h "$DB_HOST" -p "$DB_PORT" -U "$DB_USER" -d "$DB_NAME" -c \
                "SELECT setval('$SEQ_NAME', $NEW_VAL, false);" > /dev/null
            echo "   ✅ $TABLE: sequence reset from $SEQ_VAL to $NEW_VAL (max_id: $MAX_ID)"
        else
            echo "   ✓  $TABLE: sequence OK (max_id: $MAX_ID, seq: $SEQ_VAL)"
        fi
    else
        echo "   ⏭  $TABLE: no sequence found, skipping"
    fi
done

echo "🎉 Sequence fix complete!"
