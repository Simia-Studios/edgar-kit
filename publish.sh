#!/usr/bin/env sh
set -eu

release_type="${1:-}"

case "$release_type" in
  patch | minor | major) ;;
  *)
    echo "Usage: ./publish.sh patch|minor|major"
    exit 1
    ;;
esac

pnpm check
pnpm version "$release_type" --no-git-tag-version
git add .
git commit -m "Release $(node -p "require('./package.json').version")"
pnpm publish --access public
