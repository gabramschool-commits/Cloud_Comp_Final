#!/bin/bash
# run_etl.sh - Shell wrapper for the ETL pipeline
# This is what cron will call

# Path to project (update this if your path is different)
PROJECT_DIR="/var/www/ecommerce/backend"
LOG_FILE="$PROJECT_DIR/etl/logs/cron.log"

echo "$(date '+%Y-%m-%d %H:%M:%S') - Running ETL..." >> "$LOG_FILE"

cd "$PROJECT_DIR" || exit 1

# Activate virtual environment and run ETL
source /var/www/ecommerce/venv/bin/activate
python etl/etl_pipeline.py >> "$LOG_FILE" 2>&1

echo "$(date '+%Y-%m-%d %H:%M:%S') - ETL done." >> "$LOG_FILE"
