# Claude Code Methodology Files

This directory contains **reusable, project-agnostic methodology documentation** for development workflows.

## Purpose

These files document best practices and workflows that can be:
- **Reused across multiple projects**
- **Referenced from project-specific CLAUDE.md files**
- **Copied to new projects** to establish consistent workflows
- **Updated centrally** to improve all projects using them

## Files in This Directory

### `GITHUB-ISSUES-WORKFLOW.md`
**Purpose**: Issue-first development methodology ensuring all work is tracked and documented.

**Use When**:
- Starting a new project with GitHub
- Training team on issue tracking
- Establishing development workflow standards

**Key Features**:
- Decision tree for issue creation
- Branch naming conventions
- Commit message templates
- PR creation workflow
- Using `gh` CLI for private repos

**Copy to New Project**: Yes - adapt repo owner/name in examples

---

### `SCRIPT-ORGANIZATION.md`
**Purpose**: Prevent script clutter through categorization and context preservation.

**Use When**:
- Project accumulates utility scripts
- Need to organize existing scripts
- Establishing script creation standards

**Key Features**:
- Decision tree for script categorization
- Directory structure (production/admin/test/archive)
- Header documentation templates
- Issue-based archival workflow
- Migration guide for existing projects

**Copy to New Project**: Yes - works for any project with scripts

---

## How to Use These Files

### Option 1: Reference from CLAUDE.md (Recommended)

In your project's `CLAUDE.md`:

```markdown
## 🔀 Development Workflow

**See**: [`.claude/GITHUB-ISSUES-WORKFLOW.md`](.claude/GITHUB-ISSUES-WORKFLOW.md) for complete workflow.

**Project-Specific Adaptations**:
- Repository: `ComparePower/cp-cms-payload-cms-mongo`
- Main branch: `main`
- Issue label convention: `priority: high`, `type: bug`, etc.
```

### Option 2: Copy to New Project

```bash
# Copy methodology files to new project
cp -r .claude/ /path/to/new-project/

# Update project-specific examples in each file
# (repo names, paths, etc.)
```

### Option 3: Embed in CLAUDE.md

For simpler projects, you can embed the content directly in CLAUDE.md. This is useful when you want everything in one file.

---

## Maintenance

### When to Update These Files

**Update methodology files when**:
- Discovering better workflows through experience
- Team agrees on process improvements
- Finding gaps in current documentation
- Adding new tools or processes (e.g., new CI/CD tool)

### Version Control

These files are version controlled with the project. Changes to methodology should be:
1. Discussed with team
2. Tested in practice
3. Documented in commit messages
4. Applied consistently across projects

---

## Benefits of This Approach

1. **Consistency**: Same workflows across all projects
2. **Reusability**: Don't rewrite documentation for each project
3. **Maintainability**: Update once, benefit everywhere
4. **Onboarding**: New developers learn standard workflows
5. **Portability**: Easy to apply best practices to new projects

---

## Project-Specific vs Methodology Files

### `.claude/*.md` (This Directory)
- **Project-agnostic** workflows and methodologies
- Can be reused across projects
- Minimal project-specific content
- Focus on "how" not "what"

### `CLAUDE.md` (Project Root)
- **Project-specific** documentation
- References methodology files
- Adapts generic workflows to project needs
- Includes project context, paths, commands
- Focus on "what" this project does

---

## Example: Using Both Approaches

**`.claude/GITHUB-ISSUES-WORKFLOW.md`**:
```markdown
## Branch Naming Convention

Format: `issue-{number}-{kebab-case-description}`
```

**`CLAUDE.md`** (project root):
```markdown
## Development Workflow

See [`.claude/GITHUB-ISSUES-WORKFLOW.md`](.claude/GITHUB-ISSUES-WORKFLOW.md).

**This Project's Conventions**:
- Branch prefix: `issue-` (from methodology)
- Repository: `ComparePower/cp-cms-payload-cms-mongo`
- Main branch: `main`
- PR template: `.github/pull_request_template.md`
```

---

## Quick Start for New Projects

1. **Copy methodology files**:
   ```bash
   mkdir -p .claude
   cp /path/to/existing/project/.claude/*.md .claude/
   ```

2. **Create minimal CLAUDE.md**:
   ```markdown
   # Project Name

   ## Development Workflow
   See [`.claude/GITHUB-ISSUES-WORKFLOW.md`](.claude/GITHUB-ISSUES-WORKFLOW.md)

   ## Script Organization
   See [`.claude/SCRIPT-ORGANIZATION.md`](.claude/SCRIPT-ORGANIZATION.md)

   ## Project-Specific Notes
   [Your project details here]
   ```

3. **Adapt examples** in methodology files to your repo/project

4. **Start following workflows** immediately

---

## Contributing Improvements

If you discover better workflows or improvements:

1. Test the improvement in practice
2. Document the change
3. Update methodology file(s)
4. Consider applying to other projects
5. Share with team for feedback

---

**Last Updated**: 2025-01-06
**Maintained By**: Development Team
**License**: Internal use - adapt as needed
