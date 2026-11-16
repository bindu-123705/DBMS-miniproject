#!/usr/bin/env bash
# Creates and seeds both databases.  Usage: bash scripts/setup-db.sh [mysql-root-user]
set -e
U=${1:-root}
cd "$(dirname "$0")/.."
for f in 01_schema 02_seed 03_routines 04_rbac; do
  echo "MySQL: $f.sql"; mysql -u"$U" -p < db/mysql/$f.sql > /dev/null
done
echo "MongoDB: eveport_mongodb.js"; mongosh --quiet < db/mongo/eveport_mongodb.js > /dev/null
echo "Done. Next: cp .env.example .env.local && npm install && npm run dev"
