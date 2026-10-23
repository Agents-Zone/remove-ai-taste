#!/usr/bin/env bash
# Launcher for the remove-ai-taste App-in-Skill (Spec 1).
# Idempotent: the server itself reuses a healthy instance on the same port.
set -euo pipefail
DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
exec node "$DIR/server/server.mjs"
