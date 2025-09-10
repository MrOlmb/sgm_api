#!/bin/bash

echo "🔧 Resolving failed Prisma migration P3009..."
echo "============================================="

# This script will help resolve the failed migration issue
# The P3009 error means there's a failed migration in the database

echo "📋 Steps to resolve:"
echo "1. Mark the failed migration as resolved"
echo "2. Create a new migration with different timestamp"
echo "3. Deploy the corrected migration"

echo ""
echo "⚠️  IMPORTANT: This requires direct database access to Railway"
echo "You'll need to:"
echo "1. Connect to your Railway PostgreSQL database"
echo "2. Run the following SQL commands:"
echo ""

cat << 'EOF'
-- Step 1: Mark the failed migration as resolved
UPDATE "_prisma_migrations" 
SET "finished_at" = NOW(), 
    "logs" = 'Migration manually resolved - data-safe version applied'
WHERE "migration_name" = '20250910125833_add_dynamic_categories' 
AND "finished_at" IS NULL;

-- Step 2: Verify the migration is marked as resolved
SELECT "migration_name", "finished_at", "logs" 
FROM "_prisma_migrations" 
WHERE "migration_name" = '20250910125833_add_dynamic_categories';
EOF

echo ""
echo "🔗 Railway Database Access:"
echo "1. Go to Railway Dashboard"
echo "2. Select your PostgreSQL service"
echo "3. Go to 'Connect' tab"
echo "4. Use the connection details to connect with a PostgreSQL client"
echo "5. Run the SQL commands above"
echo ""
echo "After resolving the failed migration, we'll create a new migration file."
