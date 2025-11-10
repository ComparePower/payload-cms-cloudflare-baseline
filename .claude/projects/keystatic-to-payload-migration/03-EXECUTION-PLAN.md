# Execution Plan: Step-by-Step Implementation

**Plan Version**: 1.0
**Last Updated**: 2025-10-24
**Estimated Duration**: 3-4 hours
**Complexity**: High

---

## 🎯 Execution Overview

### Phase 1: Setup (15 minutes)
Create directory structures for Spec-Kit docs and Skills

### Phase 2: Spec-Kit Documentation (60 minutes)
Write all 5 Spec-Kit documents with complete content

### Phase 3: Meta-Skill Creation (45 minutes)
Build skill-creator skill with templates

### Phase 4: Skills Generation (45 minutes)
Use skill-creator to build remaining 5 skills

### Phase 5: Supporting Documentation (30 minutes)
Create reference.md, examples.md for each skill

### Phase 6: Testing & Validation (30 minutes)
Test each skill, validate YAML, verify activation

---

## 📋 Phase 1: Setup

### Step 1.1: Create Spec-Kit Directory

```bash
mkdir -p docs/spec-kit
```

**Expected Result**: Directory `docs/spec-kit/` exists

### Step 1.2: Create Skills Directory

```bash
mkdir -p .claude/skills
```

**Expected Result**: Directory `.claude/skills/` exists

### Step 1.3: Verify Paths

```bash
ls -la docs/spec-kit
ls -la .claude/skills
```

**Expected Output**:
```
docs/spec-kit/ (empty)
.claude/skills/ (empty)
```

---

## 📝 Phase 2: Spec-Kit Documentation

### Step 2.1: Create constitution.md

**File**: `docs/spec-kit/constitution.md`
**Content**: Copy from section in `04-SPEC-KIT-CONTENT.md`

**Key Sections**:
- Migration Principles (data integrity, checkpoints, MongoDB realities)
- Quality Gates (parse, transform, seed, verify)
- Error Handling Standards (validation, logging, rollback)

**Validation**:
```bash
wc -l docs/spec-kit/constitution.md  # Should be ~200+ lines
```

### Step 2.2: Create specify.md

**File**: `docs/spec-kit/specify.md`
**Content**: Copy from section in `04-SPEC-KIT-CONTENT.md`

**Key Sections**:
- User Stories (US-1 through US-5)
- Functional Requirements (content type mappings, validation rules)
- Non-functional Requirements (performance, scalability)

**Validation**:
```bash
wc -l docs/spec-kit/specify.md  # Should be ~300+ lines
grep "US-[0-9]" docs/spec-kit/specify.md  # Should find all user stories
```

### Step 2.3: Create plan.md

**File**: `docs/spec-kit/plan.md`
**Content**: Copy from section in `04-SPEC-KIT-CONTENT.md`

**Key Sections**:
- Architecture Diagrams (ASCII art)
- Component Mapping Strategies
- Schema Drift Detection Algorithms
- Collection Rename Strategy

**Validation**:
```bash
wc -l docs/spec-kit/plan.md  # Should be ~400+ lines
```

### Step 2.4: Create tasks.md

**File**: `docs/spec-kit/tasks.md`
**Content**: Copy from section in `04-SPEC-KIT-CONTENT.md`

**Key Sections**:
- 26 tasks across 6 phases
- Dependency tracking
- Validation checkpoints

**Validation**:
```bash
wc -l docs/spec-kit/tasks.md  # Should be ~500+ lines
grep "^### Task" docs/spec-kit/tasks.md | wc -l  # Should be 26
```

### Step 2.5: Create meta-skill.md

**File**: `docs/spec-kit/meta-skill.md`
**Content**: Copy from section in `04-SPEC-KIT-CONTENT.md`

**Key Sections**:
- Adaptive Skill Generator definition
- 3 example specialized skills
- Skill registry and integration

**Validation**:
```bash
wc -l docs/spec-kit/meta-skill.md  # Should be ~300+ lines
```

**Phase 2 Complete When**:
✅ All 5 files exist in `docs/spec-kit/`
✅ Each file has substantial content (200+ lines minimum)
✅ Content matches specifications in 04-SPEC-KIT-CONTENT.md

---

## 🛠️ Phase 3: Meta-Skill Creation

### Step 3.1: Create skill-creator Directory

```bash
mkdir -p .claude/skills/skill-creator/templates
mkdir -p .claude/skills/skill-creator/scripts
```

**Expected Result**: Directories created

### Step 3.2: Write skill-creator/SKILL.md

**File**: `.claude/skills/skill-creator/SKILL.md`
**Content**: Copy from section in `05-SKILL-SPECIFICATIONS.md` → skill-creator

**YAML Frontmatter** (CRITICAL):
```yaml
---
name: skill-creator
description: Create new Claude Code Skills following project conventions. Generate SKILL.md with proper YAML frontmatter, create folder structure (scripts/, templates/), set up tool permissions, and follow best practices. Use when creating new skills, scaffolding skill templates, or setting up skill directories.
allowed-tools: Read, Write, Bash
---
```

**Markdown Content**: Instructions for creating skills

**Validation**:
```bash
# Check YAML is valid
head -n 10 .claude/skills/skill-creator/SKILL.md
# Should see opening ---, name, description, allowed-tools, closing ---

# Check name format
grep "^name:" .claude/skills/skill-creator/SKILL.md | grep -E "^name: [a-z0-9-]+$"
# Should match (lowercase, hyphens only)

# Check description length
grep "^description:" .claude/skills/skill-creator/SKILL.md | wc -c
# Should be < 1024 characters
```

### Step 3.3: Create Skill Templates

**Files to create**:
1. `.claude/skills/skill-creator/templates/basic-skill.md`
2. `.claude/skills/skill-creator/templates/script-skill.md`
3. `.claude/skills/skill-creator/templates/multi-file-skill.md`

**Content**: Copy from `templates/` folder in this documentation

**Validation**:
```bash
ls -1 .claude/skills/skill-creator/templates/
# Should list 3 template files
```

### Step 3.4: Create TEMPLATES.md Reference

**File**: `.claude/skills/skill-creator/TEMPLATES.md`
**Content**: Documentation of all 3 templates with usage examples

### Step 3.5: Create BEST-PRACTICES.md

**File**: `.claude/skills/skill-creator/BEST-PRACTICES.md`
**Content**:
- Skill naming conventions
- Description writing guidelines
- allowed-tools selection
- Folder structure best practices
- Testing approach

**Phase 3 Complete When**:
✅ skill-creator/SKILL.md exists with valid YAML
✅ 3 templates created in templates/
✅ TEMPLATES.md and BEST-PRACTICES.md exist
✅ skill-creator skill can be tested with "How do I create a new skill?"

---

## 🏗️ Phase 4: Skills Generation

**Strategy**: Use skill-creator to generate the remaining 5 skills

**IMPORTANT**: Start Claude Code and test skill-creator activation before proceeding

### Step 4.1: Test skill-creator Activation

**Command**: Ask Claude: "What skills are available?"

**Expected**: skill-creator should appear in list

**If not working**:
- Check YAML syntax
- Verify file path: `.claude/skills/skill-creator/SKILL.md`
- Restart Claude Code
- Check description specificity

### Step 4.2: Generate mdx-to-lexical Skill

**Ask Claude**:
> "Use the skill-creator skill to create a new skill called mdx-to-lexical for converting Astro MDX content to Payload Lexical JSON format. The skill should handle inline components, blocks, and rich text. Include scripts for conversion and validation."

**Expected**: Claude uses skill-creator to generate:
- `.claude/skills/mdx-to-lexical/SKILL.md`
- `.claude/skills/mdx-to-lexical/scripts/` (placeholder scripts)
- `.claude/skills/mdx-to-lexical/reference.md`

**Manually Add** (skill-creator can't know this):
- Copy existing scripts from `scripts/migration/lib/mdx-to-payload-blocks.ts`
- Create reference.md documenting Lexical JSON format

**Validation**:
```bash
ls -la .claude/skills/mdx-to-lexical/
# Should have SKILL.md, reference.md, scripts/
```

### Step 4.3: Generate payload-schema-generator Skill

**Ask Claude**:
> "Use skill-creator to create a payload-schema-generator skill for generating Payload CMS collection schemas from frontmatter analysis and field discovery."

**Expected**: Skill scaffolded with proper structure

**Manually Add**:
- Example schemas in examples.md
- Script references to existing `analyze-frontmatter.mjs`

### Step 4.4: Generate migration-validator Skill

**Ask Claude**:
> "Use skill-creator to create a migration-validator skill for validating migration results with database queries, field checks, and automated UI testing."

**Expected**: Skill scaffolded

**Manually Add**:
- checklist.md with validation checklist
- Script for Playwright tests
- Script for database validation

### Step 4.5: Generate schema-drift-detector Skill

**Ask Claude**:
> "Use skill-creator to create a schema-drift-detector skill for detecting changes in ComparePower API response structure and auto-updating Payload schemas."

**Expected**: Skill scaffolded

**Manually Add**:
- reference.md with expected API schema
- Script for schema comparison
- Script for auto-updating collections

### Step 4.6: Generate validation-manager Skill

**Ask Claude**:
> "Use skill-creator to create a validation-manager skill for managing custom field and rich-text validators in src/utilities/validators/."

**Expected**: Skill scaffolded

**Manually Add**:
- VALIDATOR-REFERENCE.md documenting existing validators
- TESTING.md with test approach
- Scripts for testing and applying validators

**Phase 4 Complete When**:
✅ All 6 skills exist in `.claude/skills/`
✅ Each has valid SKILL.md with YAML frontmatter
✅ Folder structures created (scripts/, templates/ where needed)
✅ Basic content in place (detailed content in Phase 5)

---

## 📚 Phase 5: Supporting Documentation

For each skill, create detailed supporting documentation:

### Step 5.1: mdx-to-lexical Supporting Docs

**File**: `.claude/skills/mdx-to-lexical/reference.md`
**Content**:
- Lexical JSON format specification
- Node types (paragraph, heading, link, etc.)
- How inline blocks work
- Conversion examples

**File**: `.claude/skills/mdx-to-lexical/scripts/convert-mdx.ts`
**Content**: Reference existing `mdx-to-payload-blocks.ts` logic

### Step 5.2: payload-schema-generator Supporting Docs

**File**: `.claude/skills/payload-schema-generator/examples.md`
**Content**:
- Example Payload CollectionConfig
- Field type examples (text, richText, blocks, group, etc.)
- Relationship field examples
- Validation examples

### Step 5.3: migration-validator Supporting Docs

**File**: `.claude/skills/migration-validator/checklist.md`
**Content**:
- Database validation checklist
- Field presence checks
- Data integrity checks
- Admin UI validation steps
- Playwright test scenarios

### Step 5.4: schema-drift-detector Supporting Docs

**File**: `.claude/skills/schema-drift-detector/reference.md`
**Content**:
- Current ComparePower API schema
- Expected fields for each endpoint
- Change detection algorithm
- Schema update workflow

### Step 5.5: validation-manager Supporting Docs

**File**: `.claude/skills/validation-manager/VALIDATOR-REFERENCE.md`
**Content**:
- Complete documentation of existing validators
- Copy from `src/utilities/validators/` files
- Usage examples from collection hooks
- Testing approach

**File**: `.claude/skills/validation-manager/TESTING.md`
**Content**:
- How to test validators
- Example test cases
- Test data examples
- Validation failure scenarios

**Phase 5 Complete When**:
✅ Each skill has all supporting documentation
✅ Scripts are functional or have clear TODOs
✅ Examples are concrete and copy-paste ready
✅ Reference documentation is comprehensive

---

## ✅ Phase 6: Testing & Validation

### Step 6.1: Validate All YAML Frontmatter

**For each skill**, run:

```bash
# Check YAML syntax
head -n 10 .claude/skills/*/SKILL.md

# Validate name format (lowercase, hyphens, max 64 chars)
grep "^name:" .claude/skills/*/SKILL.md

# Validate description exists and has length
grep "^description:" .claude/skills/*/SKILL.md | while read line; do
  echo "$line" | wc -c
done
# Each should be > 50 and < 1024
```

**Expected**: All YAML valid, all names follow format, all descriptions present

### Step 6.2: Test Skill Activation

**Restart Claude Code** to load new skills:
```bash
# If running in CLI
exit
claude
```

**Test each skill activation**:

1. **skill-creator**:
   - Ask: "How do I create a new skill?"
   - Expected: Claude uses skill-creator

2. **mdx-to-lexical**:
   - Ask: "I need to convert MDX content to Lexical format"
   - Expected: Claude uses mdx-to-lexical

3. **payload-schema-generator**:
   - Ask: "Generate a Payload schema for my content"
   - Expected: Claude uses payload-schema-generator

4. **migration-validator**:
   - Ask: "Validate my migration results"
   - Expected: Claude uses migration-validator

5. **schema-drift-detector**:
   - Ask: "Check if the API schema has changed"
   - Expected: Claude uses schema-drift-detector

6. **validation-manager**:
   - Ask: "Update the email validator"
   - Expected: Claude uses validation-manager

**If skill doesn't activate**:
- Check description specificity (add more trigger words)
- Verify YAML syntax (invalid YAML = skill not loaded)
- Check file path (must be `.claude/skills/skill-name/SKILL.md`)
- Restart Claude Code

### Step 6.3: Verify File Structure

**Run this verification script**:

```bash
# Check all expected files exist
for skill in skill-creator mdx-to-lexical payload-schema-generator migration-validator schema-drift-detector validation-manager; do
  echo "Checking $skill..."
  if [ -f ".claude/skills/$skill/SKILL.md" ]; then
    echo "  ✓ SKILL.md exists"
  else
    echo "  ✗ SKILL.md MISSING"
  fi
done

# Check Spec-Kit files
for doc in constitution specify plan tasks meta-skill; do
  echo "Checking $doc..."
  if [ -f "docs/spec-kit/$doc.md" ]; then
    echo "  ✓ $doc.md exists"
  else
    echo "  ✗ $doc.md MISSING"
  fi
done
```

**Expected**: All checkmarks (✓), no missing files

### Step 6.4: Content Completeness Check

**For each skill**, verify:

```bash
# Check SKILL.md has substantial content
wc -l .claude/skills/*/SKILL.md
# Each should be 100+ lines

# Check for supporting docs
ls -R .claude/skills/*/
# Each should have multiple files
```

**Phase 6 Complete When**:
✅ All YAML validated
✅ All skills activate on test questions
✅ All files exist in correct locations
✅ All content is substantial (not placeholder)

---

## 🎯 Success Criteria Checklist

### Documentation
- [ ] 5 Spec-Kit files in `docs/spec-kit/`
- [ ] constitution.md complete (200+ lines)
- [ ] specify.md complete (300+ lines)
- [ ] plan.md complete (400+ lines)
- [ ] tasks.md complete (26 tasks documented)
- [ ] meta-skill.md complete (300+ lines)

### Skills
- [ ] 6 skill directories in `.claude/skills/`
- [ ] skill-creator/SKILL.md with valid YAML
- [ ] mdx-to-lexical/SKILL.md with valid YAML
- [ ] payload-schema-generator/SKILL.md with valid YAML
- [ ] migration-validator/SKILL.md with valid YAML
- [ ] schema-drift-detector/SKILL.md with valid YAML
- [ ] validation-manager/SKILL.md with valid YAML

### Templates
- [ ] basic-skill.md template
- [ ] script-skill.md template
- [ ] multi-file-skill.md template
- [ ] SKILL-yaml-examples.md

### Validation
- [ ] All YAML frontmatter valid
- [ ] All skill names follow format
- [ ] All descriptions < 1024 chars
- [ ] All skills activate on test questions
- [ ] skill-creator can generate new skills

---

## 🐛 Troubleshooting

### Issue: Skill doesn't activate

**Symptoms**: Ask relevant question, Claude doesn't use skill

**Solutions**:
1. Check description specificity
   - Add more trigger words
   - Include "Use when..." clause

2. Verify YAML syntax
   ```bash
   head -n 10 .claude/skills/skill-name/SKILL.md
   ```
   - Opening `---` on line 1
   - Closing `---` before content
   - Valid YAML (no tabs)

3. Restart Claude Code
   - Skills load on startup
   - Changes require restart

### Issue: Invalid YAML

**Symptoms**: Skill doesn't load, no error message

**Solutions**:
1. Check for tabs (use spaces only)
2. Check for missing colons
3. Check for unclosed quotes
4. Validate with online YAML validator

### Issue: Wrong file path

**Symptoms**: Skill doesn't appear in list

**Solutions**:
1. Verify exact path: `.claude/skills/skill-name/SKILL.md`
2. Check spelling of skill name
3. Ensure `.claude` directory exists
4. Check file permissions

---

## 📝 Post-Execution Steps

### After All Phases Complete

1. **Commit to Git**:
   ```bash
   git add docs/spec-kit/
   git add .claude/skills/
   git commit -m "feat: add Spec-Kit documentation and migration Skills

   - Created 5 Spec-Kit documents (constitution, specify, plan, tasks, meta-skill)
   - Created 6 project Skills (skill-creator, mdx-to-lexical, etc.)
   - All skills validated and tested
   - Templates provided for future skill creation

   Skills are now available to all team members via git.
   "
   git push
   ```

2. **Test with Team Members**:
   - Have teammates pull latest
   - Verify skills activate for them
   - Collect feedback on descriptions

3. **Document Learnings**:
   - Update this plan with any issues encountered
   - Add to 08-CRITICAL-LESSONS.md

4. **Next Migration Work**:
   - Use skills to fix 11 failed provider migrations
   - Use skills to migrate electricity-rates collection

---

## ⏱️ Estimated Timeline

**Total**: 3-4 hours

**Breakdown**:
- Phase 1 (Setup): 15 minutes
- Phase 2 (Spec-Kit): 60 minutes (12 min per file)
- Phase 3 (Meta-Skill): 45 minutes
- Phase 4 (Skills Gen): 45 minutes (9 min per skill)
- Phase 5 (Supporting Docs): 30 minutes
- Phase 6 (Testing): 30 minutes

**Buffer**: +30 minutes for troubleshooting

---

**Next**: Reference [04-SPEC-KIT-CONTENT.md](04-SPEC-KIT-CONTENT.md) for complete Spec-Kit file content
