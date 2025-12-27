#!/bin/bash
# Script to fix auto-claude branch upstream issues and clean up uncommitted changes

set -e

echo "=== Fixing Auto-Claude Git Issues ==="
echo ""

# Get the main repository directory
MAIN_REPO=$(git rev-parse --show-toplevel)
cd "$MAIN_REPO"

echo "1. Checking for uncommitted changes in worktrees..."
echo ""

# List all worktrees and check their status
for worktree in $(git worktree list | awk '{print $1}' | tail -n +2); do
    if [ -d "$worktree" ]; then
        branch=$(git -C "$worktree" rev-parse --abbrev-ref HEAD 2>/dev/null || echo "unknown")
        if [[ "$branch" == auto-claude/* ]]; then
            echo "Checking worktree: $worktree"
            echo "  Branch: $branch"
            
            # Check if branch has upstream
            upstream=$(git -C "$worktree" rev-parse --abbrev-ref --symbolic-full-name @{u} 2>/dev/null || echo "none")
            
            if [ "$upstream" == "none" ]; then
                echo "  ⚠️  No upstream branch set"
                echo "  Setting upstream to origin/$branch..."
                git -C "$worktree" push --set-upstream origin "$branch" 2>&1 | grep -v "Total\|remote:" || echo "  ✅ Upstream set"
            else
                echo "  ✅ Upstream: $upstream"
            fi
            
            # Check for uncommitted changes (excluding ignored files)
            changes=$(git -C "$worktree" status --porcelain 2>/dev/null | grep -v "^??" | wc -l | tr -d ' ')
            if [ "$changes" -gt 0 ]; then
                echo "  ⚠️  $changes uncommitted changes detected"
                echo "  Run 'git status' in $worktree to see details"
            else
                echo "  ✅ No uncommitted changes"
            fi
            echo ""
        fi
    fi
done

echo ""
echo "2. Summary of auto-claude branches:"
git branch -r | grep "auto-claude/" | while read branch; do
    echo "  - $branch"
done

echo ""
echo "=== Done ==="
echo ""
echo "To push a specific branch manually:"
echo "  cd .worktrees/<worktree-name>"
echo "  git push --set-upstream origin <branch-name>"
echo ""
echo "To clean up uncommitted changes in a worktree:"
echo "  cd .worktrees/<worktree-name>"
echo "  git status  # Review changes"
echo "  git restore <file>  # Discard specific file"
echo "  # OR commit them if needed"

