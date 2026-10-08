#!/usr/bin/env bash
# One-shot Vercel setup: link the project, set env vars, deploy, migrate, seed.
# Requires an authenticated Vercel CLI (vercel login) or VERCEL_TOKEN.
set -euo pipefail

VC="${VC:-vercel}"
TOKEN_ARG=()
[ -n "${VERCEL_TOKEN:-}" ] && TOKEN_ARG=(--token "$VERCEL_TOKEN")

say() { printf '\n\033[1m%s\033[0m\n' "$*"; }

say "1/5 · linking the project"
$VC link --yes --project delasa "${TOKEN_ARG[@]}"

say "2/5 · setting environment variables"
SECRET="${SESSION_SECRET:-$(openssl rand -hex 32)}"
set_env() {
  local key="$1" value="$2"
  for env in production preview development; do
    printf '%s' "$value" | $VC env add "$key" "$env" --force "${TOKEN_ARG[@]}" >/dev/null 2>&1 || true
  done
  echo "  set $key"
}
set_env SESSION_SECRET  "$SECRET"
set_env DB_SSL          "require"
set_env SMS_PROVIDER    "${SMS_PROVIDER:-console}"
set_env RECEPTION_PHONE "${RECEPTION_PHONE:-+989122794606}"

say "3/5 · deploying"
$VC deploy --prod --yes "${TOKEN_ARG[@]}"

say "4/5 · pulling DATABASE_URL back down"
$VC env pull .env.production --environment production --yes "${TOKEN_ARG[@]}"

if grep -q '^DATABASE_URL=' .env.production 2>/dev/null; then
  say "5/5 · migrating and seeding"
  set -a; . ./.env.production; set +a
  npm run db:migrate
  npm run db:seed "${ADMIN_PHONE:-+989122794606}"
  echo "  done"
else
  say "5/5 · skipped — no DATABASE_URL yet"
  cat <<'MSG'
  Create the database first:
    Vercel dashboard → Storage → Create Database → Neon (region: Frankfurt)
    → Connect it to the "delasa" project
  Then re-run this script; it will migrate and seed.
MSG
fi
