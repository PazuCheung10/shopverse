#!/usr/bin/env bash

set -euo pipefail

say() { printf "\n\033[1m%s\033[0m\n" "$*"; }

ok()  { printf "  ✅ %s\n" "$*"; }

bad() { printf "  ❌ %s\n" "$*"; }

warn(){ printf "  ⚠️  %s\n" "$*"; }

# 0) Context

ROOT="$(pwd)"

say "ShopVerse Self-Check"

ok "Project root: $ROOT"

test -f package.json && ok "package.json found" || { bad "package.json not found (run from project root)"; exit 1; }

test -f prisma/schema.prisma && ok "prisma/schema.prisma found" || { bad "Missing prisma/schema.prisma"; exit 1; }

test -f .env.local && ok ".env.local found" || { bad "Missing .env.local in project root"; exit 1; }

# 1) Load env (mask in prints)

set -a

# shellcheck disable=SC1091

. ./.env.local || true

set +a

mask() { local v="$1"; [[ "${#v}" -le 8 ]] && echo "$v" || echo "${v:0:4}****${v: -4}"; }

say "Env check"

if [[ -n "${DATABASE_URL:-}" ]]; then

  ok "DATABASE_URL present → $(echo "$DATABASE_URL" | sed 's/:[^:@\/]*@/:****@/')"  # mask password

else

  bad "DATABASE_URL missing in .env.local"

fi

APP_URL="${NEXT_PUBLIC_APP_URL:-}"

[[ -n "$APP_URL" ]] && ok "NEXT_PUBLIC_APP_URL = $APP_URL" || warn "NEXT_PUBLIC_APP_URL not set"

[[ -n "${STRIPE_SECRET_KEY:-}" ]] && ok "STRIPE_SECRET_KEY present (masked: $(mask "$STRIPE_SECRET_KEY"))" || warn "STRIPE_SECRET_KEY missing"

[[ -n "${STRIPE_WEBHOOK_SECRET:-}" ]] && ok "STRIPE_WEBHOOK_SECRET present (masked: $(mask "$STRIPE_WEBHOOK_SECRET"))" || warn "STRIPE_WEBHOOK_SECRET missing (set after 'stripe listen')"

# 2) Prisma + provider

say "Prisma & provider"

PRISMA_V="$(npx --yes prisma -v 2>/dev/null || true)"

echo "  • $PRISMA_V"

PROVIDER="$(awk -F'[=" ]+' '/^\s*provider\s*=/{print $3}' prisma/schema.prisma | head -1 || true)"

if [[ -n "$PROVIDER" ]]; then

  ok "schema.prisma provider = $PROVIDER"

else

  bad "Could not read provider from prisma/schema.prisma"

fi

URL_SCHEME="$(echo "${DATABASE_URL:-}" | sed 's/:.*//')"

if [[ "$PROVIDER" == "postgresql" && "$URL_SCHEME" != "postgresql" ]]; then

  bad "Provider is postgresql but DATABASE_URL is not postgresql://"

fi

if [[ "$PROVIDER" == "sqlite" && "$URL_SCHEME" != "file" ]]; then

  bad "Provider is sqlite but DATABASE_URL is not file:./*.db"

fi

# 3) Server port sanity (common: 3000 vs 3001 mismatch)

say "Ports"

for P in 3000 3001; do

  if lsof -nP -i :$P -sTCP:LISTEN >/dev/null 2>&1; then ok "Something is LISTENing on :$P"; else warn "Nothing on :$P"; fi

done

if [[ -n "$APP_URL" ]]; then

  PORT_FROM_URL="$(echo "$APP_URL" | sed -n 's#.*://[^:/]*:\([0-9][0-9]*\).*#\1#p')"

  if [[ -n "$PORT_FROM_URL" ]]; then

    if lsof -nP -i :"$PORT_FROM_URL" -sTCP:LISTEN >/dev/null 2>&1; then

      ok "APP_URL port ($PORT_FROM_URL) is listening"

    else

      bad "APP_URL is $APP_URL but nothing is listening on :$PORT_FROM_URL"

    fi

  else

    ok "APP_URL has no explicit port (likely 80/443): $APP_URL"

  fi

fi

# 4) Postgres availability (only if using postgres)

if [[ "$PROVIDER" == "postgresql" ]]; then

  say "Postgres connectivity"

  if command -v psql >/dev/null 2>&1; then

    if PSQL_OUT="$(psql "$DATABASE_URL" -c "select version(), current_database(), current_user;" -At 2>&1)"; then

      ok "psql connected"

      echo "  • $(echo "$PSQL_OUT" | head -1)"

    else

      bad "psql failed: $PSQL_OUT"

      warn "If using Docker: 'docker ps -a | grep shopverse-pg' and 'docker start shopverse-pg'"

    fi

  else

    warn "psql not installed. Install Postgres client or use Docker exec."

  fi

  # Show Prisma migration state, locks, and active queries

  say "DB state (migrations & locks)"

  if command -v psql >/dev/null 2>&1; then

    echo "  • _prisma_migrations:"

    psql "$DATABASE_URL" -c "select migration_name, started_at, finished_at from _prisma_migrations order by started_at desc limit 5;" 2>&1 || true

    echo "  • Active queries (may reveal stuck migration):"

    psql "$DATABASE_URL" -c "select pid, state, wait_event_type, wait_event, now()-query_start as running_for, left(query,120) as query from pg_stat_activity where datname=current_database() order by query_start asc;" 2>&1 || true

    echo "  • Locks:"

    psql "$DATABASE_URL" -c "select locktype, mode, granted from pg_locks l join pg_database d on l.database=d.oid where d.datname=current_database();" 2>&1 || true

    # Check OrderItems for PAID orders
    say "OrderItems validation"
    PAID_ORDERS_WITHOUT_ITEMS=$(psql "$DATABASE_URL" -t -c "select count(*) from \"Order\" o left join \"OrderItem\" oi on o.id=oi.\"orderId\" where o.status='PAID' and oi.id is null;" 2>/dev/null | tr -d ' ' || echo "0")
    if [[ "$PAID_ORDERS_WITHOUT_ITEMS" == "0" || -z "$PAID_ORDERS_WITHOUT_ITEMS" ]]; then
      ok "All PAID orders have OrderItems (or no PAID orders exist)"
    else
      warn "Found $PAID_ORDERS_WITHOUT_ITEMS PAID order(s) without OrderItems (webhook may need retry)"
    fi

    TOTAL_ORDER_ITEMS=$(psql "$DATABASE_URL" -t -c "select count(*) from \"OrderItem\";" 2>/dev/null | tr -d ' ' || echo "0")
    if [[ -n "$TOTAL_ORDER_ITEMS" && "$TOTAL_ORDER_ITEMS" != "0" ]]; then
      ok "Total OrderItems in DB: $TOTAL_ORDER_ITEMS"
    fi
  fi

fi

# 5) Quick API reachability (optional)

say "API reachability"

PORT="${PORT:-3001}"

URL="http://localhost:${PORT}/api/products"

if command -v curl >/dev/null 2>&1; then

  if curl -fsS "$URL" >/dev/null 2>&1; then

    ok "GET $URL responded"

  else

    warn "GET $URL did not respond (server may not be running or route missing)"

  fi

fi

# 6) Guidance if migrate is "forever"

say "If 'prisma migrate dev' seems stuck"

cat <<'TXT'
  • Run with debug for details:

      DEBUG="prisma:*" npx prisma migrate dev --name init --skip-seed

  • If it's waiting on an interactive prompt, use:

      npx prisma migrate dev --name init --skip-seed --force

  • If you just need the schema applied to unblock local dev (non-destructive on empty DB):

      npx prisma db push

  • If a previous broken migration exists, you can reset (⚠️ wipes DB):

      npx prisma migrate reset --force --skip-seed

  • If a lock/blocking query is shown above, you can terminate it:

      # example: SELECT pg_terminate_backend(<pid>);

      psql "$DATABASE_URL" -c "select pg_terminate_backend(<PID>);"

TXT

say "Done."

