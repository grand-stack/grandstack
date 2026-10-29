#!/bin/sh
# Copyright (c) "Neo4j"
# Neo4j Sweden AB [http://neo4j.com]
#
# Brings up one compose setup from the sibling repositories and runs that setup's checks against it, then tears it down.
#   scripts/integration.sh default|agents|auth|federation|aura
# The repositories must sit side by side (this one beside grandstack-server, grandstack-web, grandstack-auth, grandstack-agents,
# grandstack-federation, grandstack-web-aura and grand-stack.github.io). CI checks them out that way; locally, set DOCKER_HOST first if docker is Podman.
# The federation checks call the live Wikipedia API. Set CHROME_PATH if Chrome is not on the PATH.
set -eu

setup="${1:?usage: scripts/integration.sh default|agents|auth|federation|aura}"
here="$(cd "$(dirname "$0")/.." && pwd)"
ws="$(dirname "$here")"
cd "$here"

# on a Mac with Podman there may be no docker command
if ! command -v docker >/dev/null 2>&1 && command -v podman >/dev/null 2>&1; then docker() { podman "$@"; }; fi

case "$setup" in
  default)    files="-f compose.yaml" ;;
  agents)     files="-f compose.yaml -f compose.agents.yaml" ;;
  auth)       files="-f compose.yaml -f compose.auth.yaml" ;;
  federation) files="-f compose.yaml -f compose.federation.yaml" ;;
  aura)       files="-f compose.yaml -f compose.aura.yaml -f compose.aura-mock.yaml" ;;
  *) echo "unknown setup: $setup" >&2; exit 2 ;;
esac
if [ -z "${CHROME_PATH:-}" ]; then
  CHROME_PATH="$(command -v google-chrome || command -v chromium || command -v chromium-browser || echo '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome')"
fi
export CHROME_PATH
# the browser checks use fixed pauses; stretch them on CI runners, which are slower than a laptop
if [ -n "${CI:-}" ]; then export SETTLE_SCALE="${SETTLE_SCALE:-3}"; fi

# the Aura setup seals the Aura client secret with a key; a throwaway one is enough for a test run
if [ "$setup" = aura ]; then export SECRET_KEY="${SECRET_KEY:-$(openssl rand -base64 32)}"; fi

# shellcheck disable=SC2086
compose() { docker compose $files "$@"; }
cleanup() {
  status=$?
  if [ "$status" -ne 0 ]; then echo "::group::compose logs"; compose logs --tail=80 || true; echo "::endgroup::"; fi
  compose down -v >/dev/null 2>&1 || true
  exit "$status"
}
trap cleanup EXIT

step() { echo; echo "=== $setup: $*"; }
wait_for() { # url, what, seconds
  waited=0
  until curl -sf "$1" -H 'content-type: application/json' -d '{"query":"{ __typename }"}' >/dev/null 2>&1 || curl -sf "$1" >/dev/null 2>&1; do
    waited=$((waited + 3)); [ "$waited" -gt "$3" ] && { echo "timed out waiting for $2 at $1" >&2; exit 1; }; sleep 3
  done
  echo "$2 is up"
}
examples() { step "examples for the $setup stack"; (cd "$ws/grand-stack.github.io" && node scripts/verify-examples.mjs --stack "$setup"); }

step "starting"
compose down -v >/dev/null 2>&1 || true
compose up -d --build
wait_for http://localhost:4000/graphql "GraphQL" 360

case "$setup" in
  default)
    wait_for http://localhost:3000/ "the web app" 120
    step "web browser checks"; (cd "$ws/grandstack-web" && npm ci && npm run e2e)
    examples ;;
  agents)
    wait_for http://localhost:4100/healthz "the MCP server" 120
    step "agents live and container checks"; (cd "$ws/grandstack-agents" && npm ci && npm run live && npm run container)
    examples ;;
  auth)
    wait_for http://localhost:3001/ "the demo client" 180
    step "auth smoke and browser checks"; (cd "$ws/grandstack-auth" && npm ci && npm run smoke && npm run e2e)
    examples ;;
  federation)
    wait_for http://localhost:4010/healthz "the Wikipedia subgraph" 120
    step "federation smoke"; (cd "$ws/grandstack-federation" && npm ci && npm run smoke)
    examples ;;
  aura)
    wait_for http://localhost:3000/ "the web app" 120
    # the browser checks run against the fake Aura (compose.aura-mock.yaml, mock-aura published on loopback), never the real one; the website has no examples for this setup
    step "aura browser checks"; (cd "$ws/grandstack-web-aura" && npm ci && BASE_URL=http://localhost:3000 npm run e2e -w web) ;;
esac
step "all checks passed"
