#!/usr/bin/env bash
set -euo pipefail

# Resolve directories
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(cd "$SCRIPT_DIR/.." && pwd)"
SOURCE_DIR="$PROJECT_ROOT/dist"
TARGET_DIR="$PROJECT_ROOT/../chuckconway.com"

# Preconditions
if [[ ! -d "$SOURCE_DIR" ]]; then
  echo "Build output not found at: $SOURCE_DIR"
  echo "Run: npm run build"
  exit 1
fi

if [[ ! -d "$TARGET_DIR" ]]; then
  echo "Target directory not found: $TARGET_DIR"
  exit 1
fi

if [[ ! -d "$TARGET_DIR/.git" ]]; then
  echo "Refusing to proceed: $TARGET_DIR is not a git repository (missing .git)"
  exit 1
fi

echo "Deploying to: $TARGET_DIR"

# 1 & 2. Delete everything except .git in target, then copy dist → target.
# rsync with --delete and exclude .git achieves both safely and atomically.
rsync -av --delete --exclude '.git/' "$SOURCE_DIR/" "$TARGET_DIR/"

# 3. Add and commit the files in target repo
pushd "$TARGET_DIR" >/dev/null
git add -A
if ! git diff --cached --quiet; then
  COMMIT_MSG="Deploy from generic-theme: $(date -u +"%Y-%m-%dT%H:%M:%SZ")"
  git commit -m "$COMMIT_MSG"
else
  echo "No changes to commit."
fi

# 4. Push to remote
git push
popd >/dev/null

echo "Deployment complete."


