# File Structures: Exact Directory Trees

**Purpose**: Exact file and folder structures to create
**Use**: Copy these structures exactly - no guessing paths

---

## 📁 Complete Project Structure

```
cp-cms-payload-cms-mongo/
├── .claude/
│   ├── projects/
│   │   └── keystatic-to-payload-migration/    ← This documentation
│   └── skills/                                  ← TO CREATE
│       ├── skill-creator/
│       │   ├── SKILL.md
│       │   ├── TEMPLATES.md
│       │   ├── BEST-PRACTICES.md
│       │   └── templates/
│       │       ├── basic-skill.md
│       │       ├── script-skill.md
│       │       └── multi-file-skill.md
│       ├── mdx-to-lexical/
│       │   ├── SKILL.md
│       │   ├── reference.md
│       │   └── scripts/
│       │       ├── convert-mdx.ts
│       │       └── validate-lexical.ts
│       ├── payload-schema-generator/
│       │   ├── SKILL.md
│       │   ├── examples.md
│       │   └── scripts/
│       │       ├── analyze-fields.ts
│       │       └── generate-schema.ts
│       ├── migration-validator/
│       │   ├── SKILL.md
│       │   ├── checklist.md
│       │   └── scripts/
│       │       ├── verify-database.mjs
│       │       └── verify-admin-ui.mjs
│       ├── schema-drift-detector/
│       │   ├── SKILL.md
│       │   ├── reference.md
│       │   └── scripts/
│       │       ├── detect-changes.ts
│       │       └── update-collections.ts
│       └── validation-manager/
│           ├── SKILL.md
│           ├── VALIDATOR-REFERENCE.md
│           ├── TESTING.md
│           └── scripts/
│               ├── test-validators.ts
│               └── apply-to-collection.ts
├── docs/
│   └── spec-kit/                               ← TO CREATE
│       ├── constitution.md
│       ├── specify.md
│       ├── plan.md
│       ├── tasks.md
│       └── meta-skill.md
├── src/
│   ├── payload.config.ts                       ← Existing
│   ├── collections/
│   │   ├── Providers/index.ts                  ← Existing (trash: true)
│   │   └── RichTextDataInstances.ts            ← Existing
│   └── utilities/validators/                   ← Existing
│       ├── index.ts
│       ├── field-validators.ts
│       └── rich-text-validators.ts
├── migration/
│   ├── scripts/                                ← Existing
│   └── data/seed/                              ← Existing
├── scripts/
│   ├── migration/lib/                          ← Existing
│   └── doppler-run.sh                          ← Existing
├── CLAUDE.md                                   ← Existing
└── package.json                                ← Existing
```

---

## 🎯 Directories to Create

### 1. Spec-Kit Documentation

**Base Path**: `docs/spec-kit/`

**Command**:
```bash
mkdir -p docs/spec-kit
```

**Files to Create**:
```
docs/spec-kit/
├── constitution.md          ← Migration principles, quality gates
├── specify.md               ← Requirements, user stories
├── plan.md                  ← Technical architecture
├── tasks.md                 ← 26 tasks breakdown
└── meta-skill.md            ← Adaptive Skill Generator
```

**Validation**:
```bash
ls -1 docs/spec-kit/
# Should show 5 .md files
```

---

### 2. Skills Directory

**Base Path**: `.claude/skills/`

**Command**:
```bash
mkdir -p .claude/skills
```

**Skills to Create**: 6 total

---

### 3. Skill: skill-creator

**Path**: `.claude/skills/skill-creator/`

**Commands**:
```bash
mkdir -p .claude/skills/skill-creator/templates
mkdir -p .claude/skills/skill-creator/scripts
```

**Files**:
```
.claude/skills/skill-creator/
├── SKILL.md                 ← Main skill definition
├── TEMPLATES.md             ← Documentation of templates
├── BEST-PRACTICES.md        ← Skill authoring guide
├── templates/
│   ├── basic-skill.md       ← Simple single-file skill template
│   ├── script-skill.md      ← Skill with scripts template
│   └── multi-file-skill.md  ← Complex multi-file template
└── scripts/                 ← (Empty initially)
```

**File Sizes** (approximate):
- SKILL.md: 200-300 lines
- TEMPLATES.md: 150-200 lines
- BEST-PRACTICES.md: 100-150 lines
- Each template: 50-100 lines

---

### 4. Skill: mdx-to-lexical

**Path**: `.claude/skills/mdx-to-lexical/`

**Commands**:
```bash
mkdir -p .claude/skills/mdx-to-lexical/scripts
```

**Files**:
```
.claude/skills/mdx-to-lexical/
├── SKILL.md                 ← MDX→Lexical conversion skill
├── reference.md             ← Lexical JSON format spec
└── scripts/
    ├── convert-mdx.ts       ← Core conversion logic
    └── validate-lexical.ts  ← JSON structure validation
```

**Script Dependencies**:
- Reference existing: `scripts/migration/lib/mdx-to-payload-blocks.ts`
- Reference existing: `scripts/migration/lib/lexical-link-processor.ts`

---

### 5. Skill: payload-schema-generator

**Path**: `.claude/skills/payload-schema-generator/`

**Commands**:
```bash
mkdir -p .claude/skills/payload-schema-generator/scripts
```

**Files**:
```
.claude/skills/payload-schema-generator/
├── SKILL.md                 ← Schema generation skill
├── examples.md              ← Example Payload schemas
└── scripts/
    ├── analyze-fields.ts    ← Frontmatter field discovery
    └── generate-schema.ts   ← CollectionConfig generation
```

**Script Dependencies**:
- Reference existing: `migration/scripts/analyze-frontmatter.mjs`

---

### 6. Skill: migration-validator

**Path**: `.claude/skills/migration-validator/`

**Commands**:
```bash
mkdir -p .claude/skills/migration-validator/scripts
```

**Files**:
```
.claude/skills/migration-validator/
├── SKILL.md                 ← Verification workflows skill
├── checklist.md             ← Validation checklist
└── scripts/
    ├── verify-database.mjs  ← DB validation queries
    └── verify-admin-ui.mjs  ← Playwright UI tests
```

**Script Dependencies**:
- Reference existing: `migration/scripts/verify-migration-comprehensive.mjs`
- Use Playwright for UI testing

---

### 7. Skill: schema-drift-detector

**Path**: `.claude/skills/schema-drift-detector/`

**Commands**:
```bash
mkdir -p .claude/skills/schema-drift-detector/scripts
```

**Files**:
```
.claude/skills/schema-drift-detector/
├── SKILL.md                 ← API monitoring skill
├── reference.md             ← Expected ComparePower API schema
└── scripts/
    ├── detect-changes.ts    ← Schema comparison logic
    └── update-collections.ts ← Auto-update Payload schemas
```

**API Endpoints**:
- ComparePower API (user will provide endpoints)
- Monitor for new/removed fields
- Auto-generate Payload field definitions

---

### 8. Skill: validation-manager

**Path**: `.claude/skills/validation-manager/`

**Commands**:
```bash
mkdir -p .claude/skills/validation-manager/scripts
```

**Files**:
```
.claude/skills/validation-manager/
├── SKILL.md                 ← Validator management skill
├── VALIDATOR-REFERENCE.md   ← Complete current validators doc
├── TESTING.md               ← Validation testing guide
└── scripts/
    ├── test-validators.ts   ← Test suite for validators
    └── apply-to-collection.ts ← Apply validators to hooks
```

**Existing Code to Reference**:
- `src/utilities/validators/index.ts`
- `src/utilities/validators/field-validators.ts`
- `src/utilities/validators/rich-text-validators.ts`

---

## 📝 File Naming Conventions

### Skill Names

**Format**: lowercase-with-hyphens
**Max Length**: 64 characters
**Allowed**: `[a-z0-9-]+`

**Valid Examples**:
- `skill-creator`
- `mdx-to-lexical`
- `payload-schema-generator`

**Invalid Examples**:
- `SkillCreator` (uppercase)
- `skill_creator` (underscores)
- `skill.creator` (dots)

### File Names

**SKILL.md**: UPPERCASE, exactly "SKILL.md"
**Others**: lowercase-with-hyphens.md

**Valid Examples**:
- `SKILL.md`
- `reference.md`
- `examples.md`
- `VALIDATOR-REFERENCE.md` (OK - emphasis)

**Invalid Examples**:
- `skill.md` (lowercase)
- `Skill.md` (mixed case)
- `SKILL.MD` (uppercase extension)

---

## 🗂️ Folder Naming Conventions

**Format**: lowercase-with-hyphens

**Common Folders**:
- `scripts/` - Executable scripts
- `templates/` - Reusable templates
- `examples/` - Example files (not typically used)

**Never Use**:
- `src/` inside skills (confusing with main src/)
- `lib/` inside skills (use scripts/)
- `utils/` inside skills (use scripts/)

---

## 📊 Expected File Counts

**After Complete Execution**:

```
docs/spec-kit/                   5 files
.claude/skills/skill-creator/    7 files (SKILL.md + 2 docs + 3 templates + scripts dir)
.claude/skills/mdx-to-lexical/   4 files (SKILL.md + reference.md + 2 scripts)
.claude/skills/payload-schema-generator/ 4 files
.claude/skills/migration-validator/      4 files
.claude/skills/schema-drift-detector/    4 files
.claude/skills/validation-manager/       5 files

Total: 5 + 7 + 4 + 4 + 4 + 4 + 5 = 33 files minimum
```

---

## ✅ Validation Commands

### Check All Directories Exist

```bash
# Spec-Kit
test -d docs/spec-kit && echo "✓ docs/spec-kit/" || echo "✗ MISSING"

# Skills
for skill in skill-creator mdx-to-lexical payload-schema-generator migration-validator schema-drift-detector validation-manager; do
  test -d ".claude/skills/$skill" && echo "✓ $skill/" || echo "✗ $skill MISSING"
done
```

### Check All SKILL.md Files Exist

```bash
for skill in skill-creator mdx-to-lexical payload-schema-generator migration-validator schema-drift-detector validation-manager; do
  test -f ".claude/skills/$skill/SKILL.md" && echo "✓ $skill/SKILL.md" || echo "✗ $skill/SKILL.md MISSING"
done
```

### Check File Counts

```bash
# Spec-Kit (should be 5)
ls -1 docs/spec-kit/*.md 2>/dev/null | wc -l

# Skills (should be 6 directories)
ls -1d .claude/skills/*/ 2>/dev/null | wc -l

# Total files in skills (should be ~30+)
find .claude/skills -type f | wc -l
```

---

## 🎯 Path Variables for Scripts

**When writing scripts**, use these path variables:

```typescript
// Root paths
const PROJECT_ROOT = '/Users/brad/_CODE_DEV_PROJECTS/cp-cms-payload-cms-mongo'
const SOURCE_ROOT = '/Users/brad/_CODE_DEV_PROJECTS/cp-content-site-astro'

// Spec-Kit paths
const SPEC_KIT_DIR = `${PROJECT_ROOT}/docs/spec-kit`

// Skills paths
const SKILLS_DIR = `${PROJECT_ROOT}/.claude/skills`
const SKILL_CREATOR_DIR = `${SKILLS_DIR}/skill-creator`

// Validators paths
const VALIDATORS_DIR = `${PROJECT_ROOT}/src/utilities/validators`

// Migration scripts paths
const MIGRATION_SCRIPTS = `${PROJECT_ROOT}/scripts/migration/lib`
```

---

## 🚫 Paths to Avoid

**DO NOT create these** (common mistakes):

```
❌ .claude/Skills/           (capital S)
❌ .claude/skills/SkillName/ (camelCase)
❌ docs/speckit/             (no hyphen)
❌ docs/spec_kit/            (underscore)
❌ .claude/agent-skills/     (wrong term - it's just "skills")
❌ skills/                   (missing .claude/ prefix)
```

---

## 📦 Complete Creation Script

**Run this to create all directories at once**:

```bash
#!/bin/bash

# Spec-Kit
mkdir -p docs/spec-kit

# Skills base
mkdir -p .claude/skills

# skill-creator
mkdir -p .claude/skills/skill-creator/templates
mkdir -p .claude/skills/skill-creator/scripts

# mdx-to-lexical
mkdir -p .claude/skills/mdx-to-lexical/scripts

# payload-schema-generator
mkdir -p .claude/skills/payload-schema-generator/scripts

# migration-validator
mkdir -p .claude/skills/migration-validator/scripts

# schema-drift-detector
mkdir -p .claude/skills/schema-drift-detector/scripts

# validation-manager
mkdir -p .claude/skills/validation-manager/scripts

echo "✅ All directories created"

# Verify
echo ""
echo "Verification:"
ls -la docs/spec-kit/
ls -la .claude/skills/
```

**Save as**: `scripts/create-skill-directories.sh`
**Make executable**: `chmod +x scripts/create-skill-directories.sh`
**Run**: `./scripts/create-skill-directories.sh`

---

**Next**: Use [10-EXECUTION-CHECKLIST.md](10-EXECUTION-CHECKLIST.md) for step-by-step execution
