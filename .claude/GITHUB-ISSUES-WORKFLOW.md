# GitHub Issues-First Development Workflow

**Purpose**: Ensure all development work is tracked, documented, and traceable through GitHub issues.

**Applicable to**: Any project using GitHub for version control and issue tracking.

---

## Core Principle

**Every feature, enhancement, or bug fix MUST be documented in a GitHub issue with clear requirements BEFORE any code is written.**

---

## Decision Tree: First Response to ANY User Request

```
┌─────────────────────────────────────┐
│   User Requests Feature/Change      │
└────────────┬────────────────────────┘
             │
             ▼
┌─────────────────────────────────────┐
│ STOP: Issue Requirements Analysis   │
└────────────┬────────────────────────┘
             │
             ▼
   ┌─────────┴─────────┐
   │                   │
   ▼                   ▼
┌──────────┐      ┌──────────┐
│ Working  │      │   NOT    │
│ on Issue?│      │ Working  │
└────┬─────┘      │ on Issue │
     │            └────┬─────┘
     ▼                 │
     │                 ▼
     │         Ask: "Should I
     │          create new issue
     │          #X: [Title]?"
     │                 │
     ▼                 ▼
Does request         Wait for
fit current      confirmation
issue scope?            │
     │                 ▼
     ├─YES──────► Continue work
     │             (update issue
     │              if needed)
     │
     ▼─NO
Ask: "Should I:
  A) Update Issue #X scope
  B) Create new Issue #Y
  C) Split into separate issue"
     │
     ▼
Wait for user decision
BEFORE writing ANY code
```

---

## Critical Questions to Ask BEFORE Starting Work

### 1. "What issue am I working on?"
- If none → STOP and ask user to create/assign issue
- Track current issue number at ALL times

### 2. "Does this request fit the current issue scope?"
- YES → Verify requirements are clear, update issue if needed
- NO → Ask user: Update current issue scope OR create new issue?
- UNCLEAR → Ask user for clarification

### 3. "Are the requirements clear and testable?"
- If NO → Ask user to clarify BEFORE starting work
- Requirements must include:
  - What should be built
  - How to verify it works
  - Acceptance criteria

### 4. "What are the acceptance criteria?"
- Every issue must have verifiable completion criteria
- Ask user if not specified
- Update issue with agreed criteria

---

## Mandatory Workflow Steps

### Step 1: Identify or Create Issue

```bash
# Search for existing issues
gh issue list --repo OWNER/REPO

# If no issue exists, STOP and ask user:
"This work doesn't match an existing GitHub issue.
Should I create Issue #X with the following scope:

Title: [Concise title]

Requirements:
- [Requirement 1]
- [Requirement 2]

Acceptance Criteria:
- [ ] [Testable criterion 1]
- [ ] [Testable criterion 2]

Would you like me to create this issue and begin work?"
```

### Step 2: Verify Issue Requirements

Before writing ANY code, verify the issue has:
- ✅ Clear description of what needs to be built
- ✅ Acceptance criteria (how to verify completion)
- ✅ Example use cases or test scenarios
- ✅ Definition of "done"

If missing, **STOP and ask user** to provide missing information.

### Step 3: Create Git Worktree for Issue

**MANDATORY**: All issue work MUST be done in a git worktree, NOT in the main repository.

**Only commit directly to `next` for**:
- Documentation updates (README, CLAUDE.md)
- Workflow file updates (.claude/)
- Emergency hotfixes (with clear justification)

**For ALL issue work, use worktrees**:

```bash
# 1. Get default branch name
DEFAULT_BRANCH=$(gh repo view OWNER/REPO --json defaultBranchRef --jq '.defaultBranchRef.name')

# 2. Ensure you're on default branch with latest changes
git checkout $DEFAULT_BRANCH
git pull origin $DEFAULT_BRANCH

# 3. Create worktree in .worktrees/ directory
# Naming: .worktrees/issue-NUMBER
git worktree add .worktrees/issue-X -b issue-X-description

# Example:
git worktree add .worktrees/issue-30 -b issue-30-add-export-feature
```

**Directory structure**:
```
cp-cms-payload-cms-mongo/
├── .worktrees/                      ← Worktrees stored HERE (hidden, ignored by git)
│   ├── issue-30/                    ← Worktree for Issue #30
│   ├── issue-31/                    ← Worktree for Issue #31
│   └── issue-32/                    ← Worktree for Issue #32
├── .claude/                         ← Workflow documentation
├── src/                             ← Source code
└── ...                              ← Other project files
```

**Why worktrees are MANDATORY**:
- **Isolation**: Each issue gets its own directory - no cross-contamination
- **Parallel work**: Work on Issue #30 while Issue #29 is in review
- **Always fresh**: Worktrees start from latest `next`, can't be "out of sync"
- **Clean main repo**: Main repo stays on `next` with dev server running
- **Easy cleanup**: Remove worktree = delete branch + directory in one command

**Exception - Direct commits to next**:
```bash
# ONLY for documentation/workflow updates
# Work directly in main repo (not a worktree)
git checkout next
# Edit .claude/ files or CLAUDE.md
git commit -m "docs: update workflow documentation"
git push origin next
```

### Step 4: Work in Worktree

**After creating worktree**:

```bash
# 1. Navigate to worktree directory
cd .worktrees/issue-X

# 2. Install dependencies (first time only)
pnpm install

# 3. Verify you're on the correct branch
git branch  # Should show '* issue-X-description'

# 4. Start working on the issue
# ... make changes ...

# 5. Commit frequently with issue reference
git commit -m "feat: add feature (Issue #X)"
```

**Branch naming convention** (same as before):
```
issue-{number}-{kebab-case-description}
```

**Examples**:
- `issue-5-complete-operation-button`
- `issue-22-asset-manager-integration`
- `issue-24-search-plugin-implementation`

### Step 5: Check Scope During Implementation

When user requests additional changes mid-work:

```
User: "Also add [new feature]"

Claude Response:
"I'm currently working on Issue #X: [Title].

This new request to [describe request] appears to be:
  [ ] Within scope of Issue #X → I'll add it to current work
  [X] Outside scope of Issue #X → Should I:
      A) Update Issue #X to include this requirement
      B) Create new Issue #Y for this feature
      C) Defer this to a separate issue after #X is complete

Which approach would you prefer?"
```

### Step 6: Update Issue Requirements

Whenever scope changes or new requirements emerge:
1. Update the GitHub issue with new requirements
2. Confirm with user that issue description reflects current work
3. Update acceptance criteria to match new scope

### Step 7: Commit with Issue Reference

```bash
git commit -m "feat: add Complete Operation button (Issue #5)

- Add reset button in success message area
- Clear all filters, selections, preview results
- Return UI to initial clean state

Implements requirement 2 from Issue #5
Closes #5"
```

**Commit message format**:
- First line: `type: description (Issue #X)`
- Body: Detailed changes
- Footer: `Implements requirement N from Issue #X` or `Closes #X`

### Step 8: Create Pull Request

```bash
gh pr create --title "[Issue #5] Add Complete Operation Button" \
  --body "Closes #5

## Requirements Met
- ✅ Reset button in success area
- ✅ Clears all filters and selections
- ✅ Returns UI to initial state

## Testing
- ✅ Manual verification in admin UI
- ✅ All acceptance criteria from Issue #5 verified"
```

### Step 9: Verify Completion Against Issue

Before declaring work "complete":
1. Review issue requirements one by one
2. Verify each acceptance criterion is met
3. Run tests specified in issue
4. Ask user: "Issue #X appears complete. All acceptance criteria met:
   - ✅ [Criterion 1]
   - ✅ [Criterion 2]
   Would you like me to merge this to [default-branch] and close the issue?"

### Step 10: Merge to Default Branch

**CRITICAL**: After completing work, merge back to the default branch to ensure future branches don't lose your updates.

**Ask the user**:
```
"Issue #X is complete and verified. Would you like me to:

  A) Merge directly to [default-branch] (RECOMMENDED - simple workflow)
  B) Create Pull Request for review (team workflows)
  C) Keep branch separate for now (risky - may lose sync)

Option A: Fast and ensures work is immediately available to other branches
Option B: Allows code review before merging
Option C: Not recommended - future branches won't have your updates

Which would you prefer?"
```

**If user chooses A (Direct Merge - RECOMMENDED)**:
```bash
# 1. Get default branch name
DEFAULT_BRANCH=$(gh repo view OWNER/REPO --json defaultBranchRef --jq '.defaultBranchRef.name')

# 2. Navigate to MAIN repository (not worktree!)
# Already in main repo if you're on 'next' branch
git checkout $DEFAULT_BRANCH

# 3. Pull latest changes
git pull origin $DEFAULT_BRANCH

# 4. Merge feature branch from worktree
git merge --no-ff issue-X-description -m "merge: Issue #X - [Description]

Merges completed work from Issue #X into [default-branch].

All acceptance criteria verified:
- ✅ [Criterion 1]
- ✅ [Criterion 2]

Closes #X

🤖 Generated with [Claude Code](https://claude.com/claude-code)

Co-Authored-By: Claude <noreply@anthropic.com>"

# 5. Push to remote
git push origin $DEFAULT_BRANCH

# 6. Close the issue
gh issue close X --repo OWNER/REPO --comment "✅ Complete and merged to $DEFAULT_BRANCH"

# 7. Remove worktree (deletes directory AND branch)
git worktree remove .worktrees/issue-X

# Note: This automatically deletes the branch locally
# Remote branch deletion (if pushed):
git push origin --delete issue-X-description 2>/dev/null || true
```

**Worktree cleanup explained**:
- `git worktree remove` deletes BOTH the directory and the branch
- No need for separate `git branch -d` command
- Cleaner than manual branch deletion

**If user chooses B (Pull Request)**:
```bash
# Create PR (Step 8 process)
# Then merge via GitHub UI after review
```

**If user chooses C (Keep Separate)**:
```bash
# Just close the issue
gh issue close X --repo OWNER/REPO --comment "✅ Complete on branch issue-X-description"

# ⚠️ WARNING: Future branches won't have these updates!
```

**Why Step 10 matters**:
- **Prevents what just happened**: Working on Issue #27 didn't have Issue #29's files because they weren't merged to default branch
- **Ensures continuity**: Next issue branch starts with ALL previous work
- **Reduces merge conflicts**: Regular merges keep branches in sync
- **Preserves work**: No risk of losing updates when switching branches

---

## GitHub Issues API (Using `gh` CLI)

**CRITICAL**: Always use `gh` CLI for private repositories (WebFetch will return 404).

### Reading Issues

```bash
# View issue details
gh issue view 29 --repo OWNER/REPO --json title,body,labels,state

# List all open issues
gh issue list --repo OWNER/REPO --state open

# Search for specific issues
gh issue list --repo OWNER/REPO --search "import wizard"
```

### Updating Issues

```bash
# Add progress update
gh issue comment 29 --repo OWNER/REPO --body "✅ Audit complete - execute/route.ts uses Payload Local API correctly"

# Update with checklist progress
gh issue comment 29 --repo OWNER/REPO --body "## Progress Update

- [x] Audit import/migration scripts
- [ ] Create cleanup script
- [ ] Add validation warnings"
```

### Closing Issues

```bash
# Close with final comment
gh issue close 29 --repo OWNER/REPO --comment "✅ Issue #29 complete. All tasks verified."
```

### When to Update Issues

**ALWAYS update issues when**:
- ✅ Starting work on an issue (add comment: "Starting work on Issue #X")
- ✅ After completing major subtasks (update checklist progress)
- ✅ When discovering blockers or problems (document in issue)
- ✅ When requesting user feedback (ask in issue comments)
- ✅ Before committing code (reference commits in issue)
- ✅ When completing all work (close with summary)

**NEVER**:
- ❌ Assume you know issue details without reading them via `gh`
- ❌ Use WebFetch to access GitHub issues (private repo - will fail)
- ❌ Work without tracking progress in issues
- ❌ Close issues without verifying all acceptance criteria
- ❌ Forget to update issues when scope changes

---

## Requirements Review Checklist

### Before starting work on ANY issue:
- [ ] Issue number identified and tracked
- [ ] Requirements are documented in issue
- [ ] Acceptance criteria are clear and testable
- [ ] User has confirmed scope
- [ ] You understand what "done" means for this issue

### Before marking work complete:
- [ ] All acceptance criteria verified
- [ ] Tests run (if specified)
- [ ] User has reviewed and approved
- [ ] Issue will be closed with PR merge

---

## When to Ask User

**ALWAYS ask user before**:
1. Creating a new GitHub issue
2. Starting work without an assigned issue
3. Adding features outside current issue scope
4. Updating existing issue requirements
5. Splitting one issue into multiple issues
6. Marking an issue as complete
7. Discovering bugs/features during implementation
8. Making architectural decisions not specified in issue

**NEVER**:
- Start coding without an issue number
- Assume requirements without asking
- Expand scope without user approval
- Close issues without verifying all acceptance criteria
- Skip requirement clarification because it "seems obvious"

---

## Benefits

1. **Traceability**: Every code change links to requirements
2. **Organization**: Feature branches prevent conflicts
3. **Documentation**: Issues become permanent record
4. **Collaboration**: Clear what's in progress vs planned
5. **Rollback**: Easy to revert specific features
6. **Context Preservation**: Future developers understand why code exists

---

## Anti-Patterns to Avoid

❌ **Don't**:
- Write code before creating an issue
- Work on undocumented features
- Close issues prematurely
- Forget to reference issues in commits
- Skip acceptance criteria definition

✅ **Do**:
- Always create issue first
- Document requirements clearly
- Update issues regularly
- Reference issues in all commits
- Verify completion against acceptance criteria

---

**Version**: 1.0
**Last Updated**: 2025-01-06
**Applicable to**: Any GitHub-based project
**Related**: `.claude/SCRIPT-ORGANIZATION.md`
