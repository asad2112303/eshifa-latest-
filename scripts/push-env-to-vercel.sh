#!/usr/bin/env bash
#
# Copy the configuration in .env.local up to Vercel, then redeploy.
#
#   ./scripts/push-env-to-vercel.sh
#
# Values are read from the file and piped straight to the Vercel CLI. Nothing is
# printed, echoed, or placed in a shell argument (where `ps` would expose it) —
# only variable names appear in the output.
#
# A redeploy is required at the end, not optional: NEXT_PUBLIC_* variables are
# inlined into the bundle at build time, so setting them changes nothing until
# the project is rebuilt.

set -euo pipefail

cd "$(dirname "$0")/.."

ENV_FILE=".env.local"
ENVIRONMENTS=(production preview development)

# The website needs only the public Supabase settings. It holds no privileged
# key: the admin portal is a separate app with its own environment.
REQUIRED=(
  NEXT_PUBLIC_SUPABASE_URL
  NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY
)

# Pushed when present in .env.local, skipped silently when not.
OPTIONAL=(
  RESEND_API_KEY
  EMAIL_FROM
  EMAIL_TEAM_INBOX
  HEALTH_CHECK_TOKEN
  TRUSTED_PROXY_HOPS
  UPSTASH_REDIS_REST_URL
  UPSTASH_REDIS_REST_TOKEN
)

[ -f "$ENV_FILE" ] || { echo "✗ $ENV_FILE not found."; exit 1; }

# Read one value without printing it. Handles `KEY=value` with optional quotes.
read_value() {
  sed -n "s/^$1=//p" "$ENV_FILE" | head -1 | sed -e 's/^["'\'']//' -e 's/["'\'']$//'
}

echo
echo "  Checking $ENV_FILE..."
missing=()
for key in "${REQUIRED[@]}"; do
  [ -n "$(read_value "$key")" ] || missing+=("$key")
done

if [ ${#missing[@]} -gt 0 ]; then
  echo "  ✗ Missing locally: ${missing[*]}"
  echo "    Set them in $ENV_FILE first, then re-run."
  exit 1
fi
echo "  ✓ All ${#REQUIRED[@]} variables present"

echo
echo "  Signing in to Vercel if needed..."
npx --yes vercel whoami >/dev/null 2>&1 || npx --yes vercel login

echo
echo "  Linking the project..."
# --yes accepts the git-detected project instead of showing a picker that would
# stall the script waiting for a keypress.
npx --yes vercel link --yes

echo
echo "  Uploading..."
push_var() {
  local key="$1" value
  value="$(read_value "$key")"
  for env in "${ENVIRONMENTS[@]}"; do
    # Remove any existing value first so this script is safe to re-run.
    npx --yes vercel env rm "$key" "$env" --yes >/dev/null 2>&1 || true
    printf '%s' "$value" | npx --yes vercel env add "$key" "$env" >/dev/null 2>&1
  done
  unset value
  echo "    ✓ $key"
}
for key in "${REQUIRED[@]}"; do push_var "$key"; done
for key in "${OPTIONAL[@]}"; do
  [ -n "$(read_value "$key")" ] && push_var "$key" || echo "    - $key (not set locally, skipped)"
done

# NEXT_PUBLIC_SITE_URL should be the real domain in production, not localhost.
echo
echo "  Note: set NEXT_PUBLIC_SITE_URL in the Vercel dashboard to your public"
echo "        domain. It is skipped here because .env.local holds localhost,"
echo "        which would break canonical URLs and Open Graph tags."

echo
echo "  Redeploying (required — NEXT_PUBLIC_* is baked in at build time)..."
npx --yes vercel --prod --force --yes

echo
echo "  Done. Verify with:"
echo "    curl -s -H \"Authorization: Bearer \$HEALTH_CHECK_TOKEN\" https://eshifa-latest.vercel.app/api/health?check=config"
echo
