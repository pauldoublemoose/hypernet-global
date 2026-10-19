#!/usr/bin/env bash
# The real events' pictures onto a Neon branch, in two steps:
#   1. upload data/pictures/* to that branch's public `images` bucket (real-events/<name>-<sha8>.jpg, SigV4 PUT
#      with the storage-only credential), and check each one answers 200 to anyone;
#   2. point the real events' looks at them (node scripts/seed.mjs pictures:<branch>, one transaction).
# Idempotent: the same bytes go to the same key, and the SQL only changes a look that doesn't carry its picture yet
# (never one somebody chose). Secrets stay inside scripts/with-env (curl reads them itself; nothing prints them).
#
#   scripts/real-pictures.sh dev               # local + previews
#   scripts/real-pictures.sh main              # production — only when the owner says so
#   scripts/real-pictures.sh main --dry-run    # what it would upload and run, touching nothing
set -euo pipefail
cd "$(dirname "$0")/.."

target="${1:-}"
case "$target" in
  dev)  DB=DATABASE_URL_UNPOOLED ;;
  main) DB=DATABASE_URL_MAIN_UNPOOLED ;;
  *) echo "usage: scripts/real-pictures.sh <dev|main> [--dry-run]" >&2; exit 1 ;;
esac
dry="${2:-}"

tmp="$(mktemp -d "${TMPDIR:-/tmp}/hn-pictures.XXXXXX")"
node scripts/real-pictures.mjs plan "$target" > "$tmp/plan.tsv"
node scripts/sql-payload.mjs "pictures:$target" > "$tmp/pictures.json"

if [ "$dry" = "--dry-run" ]; then
  echo "== would upload ($target):"; cat "$tmp/plan.tsv"
  echo "== then run on $DB:"; node scripts/seed.mjs "pictures:$target" --sql
  exit 0
fi

echo "== uploading to $target storage"
while IFS=$'\t' read -r file url type; do
  scripts/with-env curl -sS --fail-with-body -o /dev/null -T "$file" -H "Content-Type: $type" \
    --aws-sigv4 "aws:amz:eu-central-1:s3" \
    --variable %NEON_STORAGE_ACCESS_KEY_ID --variable %NEON_STORAGE_SECRET_ACCESS_KEY \
    --expand-user '{{NEON_STORAGE_ACCESS_KEY_ID}}:{{NEON_STORAGE_SECRET_ACCESS_KEY}}' "$url"
  code="$(curl -sS -o /dev/null -w '%{http_code} %{content_type}' "$url")"
  echo "  $code  $url"
  case "$code" in "200 image/"*) ;; *) echo "  not publicly readable as an image: $url" >&2; exit 1 ;; esac
done < "$tmp/plan.tsv"

echo "== pointing the looks at them ($DB)"
scripts/with-env curl -sS --fail-with-body \
  --variable "%$DB" --expand-header "Neon-Connection-String: {{$DB}}" \
  -H 'Content-Type: application/json' -H 'Neon-Batch-Isolation-Level: Serializable' \
  --data-binary @"$tmp/pictures.json" https://api.c-7.eu-central-1.aws.neon.tech/sql \
  | node -e 'let s="";process.stdin.on("data",d=>s+=d).on("end",()=>{const j=JSON.parse(s);const r=j.results||[];console.log("  rows changed:",r.slice(0,-1).reduce((n,x)=>n+(x.rowCount||0),0),"of",r.length-1,"statements")})'
