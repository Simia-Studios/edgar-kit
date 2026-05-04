#!/usr/bin/env sh
set -eu

usage() {
  echo "Usage: pnpm release <patch|minor|major>"
}

if [ "${1:-}" = "-h" ] || [ "${1:-}" = "--help" ]; then
  usage
  exit 0
fi

release_type="${1:-}"

case "$release_type" in
  patch | minor | major) ;;
  *)
    usage
    exit 1
    ;;
esac

pnpm check
pnpm version "$release_type" --no-git-tag-version
git add .
git commit -m "Release $(node -p "require('./package.json').version")"
pnpm publish --access public
