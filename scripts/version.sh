#!/bin/bash
set -e

# Get the version type (patch, minor, major)
VERSION_TYPE=$1
if [ -z "$VERSION_TYPE" ]; then
  echo "Usage: npm run release -- patch|minor|major"
  exit 1
fi

# Bump package.json without git
npm version $VERSION_TYPE --no-git-tag-version

# Generate changelog and stage it
npm run changelog

# Commit (amend if needed) and tag
git add CHANGELOG.md package.json package-lock.json
git commit -m "chore: release v$(node -p "require('./package.json').version")" || git commit --amend --no-edit

TAG="v$(node -p "require('./package.json').version")"
git tag -a "$TAG" -m "Release $TAG" --force

echo "Released $TAG with updated changelog"