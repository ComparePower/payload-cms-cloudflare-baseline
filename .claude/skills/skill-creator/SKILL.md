---
name: skill-creator
description: Create new Claude Code Skills following project conventions. Generate SKILL.md with proper YAML frontmatter, create folder structure with scripts and templates directories, set up tool permissions with allowed-tools, and follow naming conventions (lowercase-with-hyphens). Use when creating new skills, scaffolding skill templates, setting up skill directories, or helping users build custom Claude Code Skills.
allowed-tools: Read, Write, Bash
---

# Skill Creator

Create new Claude Code Skills following project conventions and best practices.

## What This Skill Does

This skill helps you create new Claude Code Skills with:
- Valid YAML frontmatter
- Proper directory structure
- Template files
- Script directories
- Best practice guidelines

## When to Use This Skill

Use this skill when:
- User asks "How do I create a new skill?"
- User wants to create a skill for a specific task
- User asks to scaffold a new skill
- User mentions "skill creator" or "create skill"

## Skill Naming Conventions

**Format**: lowercase-with-hyphens-only
**Max Length**: 64 characters
**Regex**: `^[a-z0-9-]+$`

**Valid Examples**:
- `skill-creator`
- `mdx-to-lexical`
- `payload-schema-generator`

**Invalid Examples**:
- `SkillCreator` (camelCase)
- `skill_creator` (underscores)
- `skill.creator` (dots)

## YAML Frontmatter Template

Every SKILL.md must start with:

```yaml
---
name: skill-name-here
description: Brief description of what this skill does and when to use it. Include specific triggers and use cases. Must be under 1024 characters.
allowed-tools: Read, Write, Bash  # Optional - restrict tool usage
---
```

**Required Fields**:
- `name`: Skill name (lowercase-hyphens, max 64 chars)
- `description`: What it does + when to use it (max 1024 chars)

**Optional Fields**:
- `allowed-tools`: Comma-separated list of tools (restricts permissions)

## Description Writing Guidelines

**Good Description** (includes triggers):
```
Generate Payload CMS collection schemas from frontmatter analysis and field discovery. Use when creating new collections, analyzing content structure, defining Payload field configurations, or mapping MDX frontmatter to Payload schemas.
```

**Bad Description** (too vague):
```
Helps with schemas
```

**Description Checklist**:
- [ ] Explains what the skill does
- [ ] Includes "Use when..." clause
- [ ] Lists specific triggers (keywords user might say)
- [ ] Under 1024 characters
- [ ] No typos or grammar errors

## Directory Structure Templates

### Basic Skill (Single File)

```
skill-name/
└── SKILL.md
```

**Use for**: Simple skills with only instructions

### Skill with Scripts

```
skill-name/
├── SKILL.md
├── reference.md  # Optional: detailed documentation
└── scripts/
    ├── script1.ts
    └── script2.ts
```

**Use for**: Skills that execute code or automate tasks

### Complex Multi-File Skill

```
skill-name/
├── SKILL.md
├── reference.md   # Detailed documentation
├── examples.md    # Usage examples
├── templates/     # Reusable templates
│   ├── template1.md
│   └── template2.md
└── scripts/
    ├── script1.ts
    └── script2.ts
```

**Use for**: Skills with extensive documentation and multiple components

## Tool Permissions (allowed-tools)

**Common Tool Combinations**:

**Read-Only** (safe, non-destructive):
```yaml
allowed-tools: Read, Grep, Glob
```

**File Operations** (read + write):
```yaml
allowed-tools: Read, Write, Edit
```

**Full Automation** (includes shell):
```yaml
allowed-tools: Read, Write, Edit, Bash
```

**Analysis Tools** (search + read):
```yaml
allowed-tools: Read, Grep, Glob, WebFetch
```

## Step-by-Step Skill Creation

### Step 1: Create Directory

```bash
mkdir -p .claude/skills/skill-name
```

**Validate**: Name is lowercase-with-hyphens

### Step 2: Create SKILL.md

**Template**:
```yaml
---
name: skill-name
description: [What it does]. Use when [specific scenarios and triggers].
allowed-tools: Read, Write, Bash
---

# Skill Name

## Instructions

1. Step-by-step instructions for using this skill
2. Include examples
3. Explain expected outputs

## Examples

Show concrete usage examples here.

## Best Practices

- List important considerations
- Mention common pitfalls
- Provide troubleshooting tips
```

### Step 3: Add Supporting Files (if needed)

**reference.md**: Detailed technical documentation
**examples.md**: Copy-paste ready code examples
**scripts/**: Executable scripts
**templates/**: Reusable file templates

### Step 4: Validate YAML

```bash
# Check frontmatter syntax
head -n 10 .claude/skills/skill-name/SKILL.md

# Should see:
# ---
# name: skill-name
# description: ...
# ---
```

**Common YAML Errors**:
- Tabs instead of spaces
- Missing colon after field name
- Unclosed quotes
- Missing opening/closing `---`

### Step 5: Test Skill Activation

1. Restart Claude Code (skills load on startup)
2. Ask: "What skills are available?"
3. Verify skill appears in list
4. Ask relevant question (matching description triggers)
5. Verify Claude uses the skill

## Common Pitfalls

### Pitfall 1: Description Too Vague

**Problem**: Skill doesn't activate because description lacks triggers

**Fix**: Add specific keywords and "Use when..." clause

### Pitfall 2: Invalid Skill Name

**Problem**: Name has uppercase, underscores, or special characters

**Fix**: Convert to lowercase-with-hyphens

### Pitfall 3: Invalid YAML Syntax

**Problem**: Skill doesn't load, no error message

**Fix**:
- Check for tabs (use spaces)
- Verify colons after field names
- Check quote matching
- Validate with online YAML validator

### Pitfall 4: Missing `---` Delimiters

**Problem**: Content treated as YAML or vice versa

**Fix**: Ensure opening `---` on line 1, closing `---` before Markdown

## Examples

### Example 1: Simple Validator Skill

```yaml
---
name: email-validator
description: Validate email addresses using regex patterns. Use when validating emails, checking email format, or sanitizing email input.
allowed-tools: Read
---

# Email Validator

## Instructions

1. Receive email address to validate
2. Apply regex pattern: /^[^\s@]+@[^\s@]+\.[^\s@]+$/
3. Return validation result

## Example

Input: "user@example.com"
Output: Valid ✓

Input: "invalid-email"
Output: Invalid ✗
```

### Example 2: Code Generator Skill

```yaml
---
name: component-generator
description: Generate React component boilerplate with TypeScript types and tests. Use when creating components, scaffolding React files, or setting up component structure.
allowed-tools: Read, Write, Bash
---

# Component Generator

## Instructions

1. Ask user for component name
2. Generate component file
3. Generate test file
4. Generate types file

## Templates

See templates/ directory for:
- Component template
- Test template
- Types template
```

## Validation Checklist

Before completing skill creation, verify:

- [ ] Directory name is lowercase-with-hyphens
- [ ] SKILL.md exists
- [ ] YAML frontmatter is valid
- [ ] `name` field matches directory name
- [ ] `description` includes "Use when..." clause
- [ ] `description` is under 1024 characters
- [ ] Markdown content is substantial (50+ lines)
- [ ] Skill activates on test question
- [ ] Instructions are clear and actionable

## Troubleshooting

### Skill Doesn't Activate

**Check**:
1. YAML syntax valid
2. Description specific enough
3. Claude Code restarted
4. File path correct: `.claude/skills/skill-name/SKILL.md`

**Debug**:
```bash
# View frontmatter
head -n 10 .claude/skills/skill-name/SKILL.md

# Check file exists
ls -la .claude/skills/skill-name/SKILL.md
```

### Description Too Long

**Error**: Description > 1024 characters

**Fix**:
```bash
# Check length
grep "^description:" .claude/skills/skill-name/SKILL.md | wc -c
```

Shorten to focus on key points and triggers.

## Best Practices

1. **Start Simple**: Create basic skill first, add complexity later
2. **Test Early**: Test activation with 1-file skill before adding features
3. **Clear Instructions**: Write step-by-step, assume no prior knowledge
4. **Concrete Examples**: Show actual input/output, not abstractions
5. **Document Assumptions**: State prerequisites and dependencies

## Resources

- **Claude Code Skills Docs**: https://docs.claude.com/en/docs/claude-code/skills
- **Skill Best Practices**: https://docs.claude.com/en/docs/agents-and-tools/agent-skills/best-practices
- **YAML Validator**: https://www.yamllint.com/

---

**Created**: 2025-10-24
**Version**: 1.0
**Use**: Ask "Create a new skill called [name] for [purpose]"
