---
name: start
description: Initialize Claude Code session - validate setup, read workflows, connect to GitHub, report open issues
---

# Session Initialization & Validation

**Purpose**: Validate environment, confirm understanding of workflows, and present open issues for user selection.

## Step 1: Read and Confirm Methodology Understanding

**CRITICAL**: You MUST read these files before proceeding:

1. `.claude/GITHUB-ISSUES-WORKFLOW.md` - Issues-first development workflow
2. `.claude/SCRIPT-ORGANIZATION.md` - Script organization methodology
3. `CLAUDE.md` - Project-specific configuration

Use the Read tool to read each file now.

## Step 2: Report Understanding

After reading all files, report back:

```
✅ Session Initialized

**Workflow Understanding**:
- [x] Read GitHub Issues-First Development Workflow
- [x] Read Script Organization Methodology
- [x] Read project-specific CLAUDE.md

**Key Principles Confirmed**:
1. Every feature/bug MUST have a GitHub issue BEFORE coding
2. Branch naming: issue-{number}-{kebab-case-description}
3. Scripts organized: production/admin/test/archive
4. One-off debug scripts archived immediately with README context
5. Global utilities require comprehensive header documentation

**Repository**: ComparePower/cp-cms-payload-cms-mongo
**Using**: gh CLI (private repo - WebFetch will fail)
```

## Step 3: Validate GitHub Connection

Test connection to GitHub and list open issues:

```bash
gh issue list --repo ComparePower/cp-cms-payload-cms-mongo --state open
```

If this fails:
- Check `gh auth status`
- Verify authentication with `gh auth login`
- Confirm repository access

## Step 4: Report Open Issues

Present open issues to user in a clear format:

```
**Open Issues in ComparePower/cp-cms-payload-cms-mongo**:

#1: SSE Streaming for Search (Block Replacer Enhancement)
#2: Robust MDX Importer (CRITICAL - Block Replacer Enhancement)
#3: Post-Replacement Verification (Block Replacer Enhancement)
#4: ContentChangeHistory Collection (Block Replacer Enhancement)
#5: Complete Operation Button (Block Replacer Enhancement)
[... continue for all open issues ...]

**Which issue would you like me to work on first?**
```

## Step 5: Wait for User Direction

Do NOT start work until user selects an issue or provides direction.

Once user selects an issue:
1. Read full issue details: `gh issue view {number} --repo ComparePower/cp-cms-payload-cms-mongo --json title,body,labels,state`
2. Verify requirements are clear
3. Confirm acceptance criteria
4. **ASK**: "Should I pull latest changes from default branch before creating feature branch? (RECOMMENDED to avoid losing recent updates)"
5. If yes, sync with default branch first (see GITHUB-ISSUES-WORKFLOW.md Step 3)
6. Create feature branch: `git checkout -b issue-{number}-{description}`
7. Begin work

---

**Important Reminders**:
- **BEFORE starting**: Ask user if they want to sync with default branch (prevents losing recent updates)
- Always reference issue numbers in commits
- Update issues with progress comments
- **AFTER completing**: Ask user if they want to merge back to default branch (prevents future branches from being out of sync)
- Archive issue-specific scripts to `scripts/archive/issue-{number}-{description}/`
- Document global utilities with full header template
- Ask before expanding scope beyond current issue
