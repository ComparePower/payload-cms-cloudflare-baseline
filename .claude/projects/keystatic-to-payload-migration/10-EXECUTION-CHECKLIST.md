# Execution Checklist: Step-by-Step

**Purpose**: Simple checkbox list for executing the project
**Usage**: Check off each item as you complete it

---

## 🚀 Pre-Execution

### Prerequisites
- [ ] Read 01-PROJECT-OVERVIEW.md completely
- [ ] Read 02-CURRENT-STATE.md completely
- [ ] Read 03-EXECUTION-PLAN.md completely
- [ ] Have 04-SPEC-KIT-CONTENT.md open for copy-paste
- [ ] Have 05-SKILL-SPECIFICATIONS.md open for copy-paste
- [ ] Have templates/ folder open for reference

---

## 📁 Phase 1: Setup (15 minutes)

### Create Directories
- [ ] Run: `mkdir -p docs/spec-kit`
- [ ] Run: `mkdir -p .claude/skills`
- [ ] Verify: `ls -la docs/spec-kit`
- [ ] Verify: `ls -la .claude/skills`

---

## 📝 Phase 2: Spec-Kit Documentation (60 minutes)

### constitution.md
- [ ] Create file: `docs/spec-kit/constitution.md`
- [ ] Copy content from 04-SPEC-KIT-CONTENT.md → constitution section
- [ ] Verify: `wc -l docs/spec-kit/constitution.md` (200+ lines)
- [ ] Check: File has Migration Principles section
- [ ] Check: File has Quality Gates section
- [ ] Check: File has Error Handling section

### specify.md
- [ ] Create file: `docs/spec-kit/specify.md`
- [ ] Copy content from 04-SPEC-KIT-CONTENT.md → specify section
- [ ] Verify: `wc -l docs/spec-kit/specify.md` (300+ lines)
- [ ] Check: File has User Stories (US-1 through US-5)
- [ ] Check: File has Functional Requirements
- [ ] Check: File has Non-functional Requirements

### plan.md
- [ ] Create file: `docs/spec-kit/plan.md`
- [ ] Copy content from 04-SPEC-KIT-CONTENT.md → plan section
- [ ] Verify: `wc -l docs/spec-kit/plan.md` (400+ lines)
- [ ] Check: File has Architecture Diagrams
- [ ] Check: File has Component Mapping Strategies
- [ ] Check: File has Schema Drift Detection

### tasks.md
- [ ] Create file: `docs/spec-kit/tasks.md`
- [ ] Copy content from 04-SPEC-KIT-CONTENT.md → tasks section
- [ ] Verify: `grep "^### Task" docs/spec-kit/tasks.md | wc -l` (26 tasks)
- [ ] Check: File has all 6 phases
- [ ] Check: File has dependency tracking
- [ ] Check: File has validation checkpoints

### meta-skill.md
- [ ] Create file: `docs/spec-kit/meta-skill.md`
- [ ] Copy content from 04-SPEC-KIT-CONTENT.md → meta-skill section
- [ ] Verify: `wc -l docs/spec-kit/meta-skill.md` (300+ lines)
- [ ] Check: File has Adaptive Skill Generator definition
- [ ] Check: File has 3 example specialized skills

**Phase 2 Complete**: All 5 Spec-Kit files exist with content

---

## 🛠️ Phase 3: Meta-Skill Creation (45 minutes)

### skill-creator Directory
- [ ] Run: `mkdir -p .claude/skills/skill-creator/templates`
- [ ] Run: `mkdir -p .claude/skills/skill-creator/scripts`
- [ ] Verify: `ls -la .claude/skills/skill-creator`

### SKILL.md
- [ ] Create: `.claude/skills/skill-creator/SKILL.md`
- [ ] Copy content from 05-SKILL-SPECIFICATIONS.md → skill-creator section
- [ ] **CRITICAL**: Verify YAML frontmatter:
  ```bash
  head -n 10 .claude/skills/skill-creator/SKILL.md
  ```
- [ ] Check: Opening `---` on line 1
- [ ] Check: `name: skill-creator` (lowercase, hyphens)
- [ ] Check: `description:` field exists (includes "Use when...")
- [ ] Check: `allowed-tools: Read, Write, Bash`
- [ ] Check: Closing `---` before Markdown content
- [ ] Verify: Description < 1024 characters
  ```bash
  grep "^description:" .claude/skills/skill-creator/SKILL.md | wc -c
  ```

### Templates
- [ ] Create: `.claude/skills/skill-creator/templates/basic-skill.md`
- [ ] Copy from: `templates/skill-basic.md`
- [ ] Create: `.claude/skills/skill-creator/templates/script-skill.md`
- [ ] Copy from: `templates/skill-scripts.md`
- [ ] Create: `.claude/skills/skill-creator/templates/multi-file-skill.md`
- [ ] Copy from: `templates/skill-multifile.md`
- [ ] Verify: `ls -1 .claude/skills/skill-creator/templates/ | wc -l` (3 files)

### Supporting Docs
- [ ] Create: `.claude/skills/skill-creator/TEMPLATES.md`
- [ ] Write: Documentation of all 3 templates with usage
- [ ] Create: `.claude/skills/skill-creator/BEST-PRACTICES.md`
- [ ] Write: Skill naming, description writing, testing guidelines

**Phase 3 Complete**: skill-creator skill ready to use

---

## 🏗️ Phase 4: Skills Generation (45 minutes)

### Test skill-creator Activation
- [ ] Restart Claude Code (to load new skills)
- [ ] Ask Claude: "What skills are available?"
- [ ] Verify: skill-creator appears in list
- [ ] Ask Claude: "How do I create a new skill?"
- [ ] Verify: Claude uses skill-creator skill

**If skill doesn't activate:**
- [ ] Check YAML syntax again
- [ ] Verify file path: `.claude/skills/skill-creator/SKILL.md`
- [ ] Add more trigger words to description
- [ ] Restart Claude Code again

### Generate mdx-to-lexical
- [ ] Run: `mkdir -p .claude/skills/mdx-to-lexical/scripts`
- [ ] Create: `.claude/skills/mdx-to-lexical/SKILL.md`
- [ ] Copy from: 05-SKILL-SPECIFICATIONS.md → mdx-to-lexical section
- [ ] Verify YAML: `head -n 10 .claude/skills/mdx-to-lexical/SKILL.md`
- [ ] Check: `name: mdx-to-lexical`
- [ ] Check: `description:` includes "Use when..."
- [ ] Check: `allowed-tools:` present
- [ ] Create: `.claude/skills/mdx-to-lexical/reference.md`
- [ ] Write: Lexical JSON format specification

### Generate payload-schema-generator
- [ ] Run: `mkdir -p .claude/skills/payload-schema-generator/scripts`
- [ ] Create: `.claude/skills/payload-schema-generator/SKILL.md`
- [ ] Copy from: 05-SKILL-SPECIFICATIONS.md → payload-schema-generator section
- [ ] Verify YAML
- [ ] Create: `.claude/skills/payload-schema-generator/examples.md`
- [ ] Write: Example Payload CollectionConfig structures

### Generate migration-validator
- [ ] Run: `mkdir -p .claude/skills/migration-validator/scripts`
- [ ] Create: `.claude/skills/migration-validator/SKILL.md`
- [ ] Copy from: 05-SKILL-SPECIFICATIONS.md → migration-validator section
- [ ] Verify YAML
- [ ] Create: `.claude/skills/migration-validator/checklist.md`
- [ ] Write: Validation checklist with DB and UI checks

### Generate schema-drift-detector
- [ ] Run: `mkdir -p .claude/skills/schema-drift-detector/scripts`
- [ ] Create: `.claude/skills/schema-drift-detector/SKILL.md`
- [ ] Copy from: 05-SKILL-SPECIFICATIONS.md → schema-drift-detector section
- [ ] Verify YAML
- [ ] Create: `.claude/skills/schema-drift-detector/reference.md`
- [ ] Write: Expected ComparePower API schema

### Generate validation-manager
- [ ] Run: `mkdir -p .claude/skills/validation-manager/scripts`
- [ ] Create: `.claude/skills/validation-manager/SKILL.md`
- [ ] Copy from: 05-SKILL-SPECIFICATIONS.md → validation-manager section
- [ ] Verify YAML
- [ ] Create: `.claude/skills/validation-manager/VALIDATOR-REFERENCE.md`
- [ ] Copy from: 07-VALIDATION-SYSTEM.md
- [ ] Create: `.claude/skills/validation-manager/TESTING.md`
- [ ] Write: Validation testing approach

**Phase 4 Complete**: All 6 skills created with SKILL.md files

---

## 📚 Phase 5: Supporting Documentation (30 minutes)

### For Each Skill
- [ ] Review SKILL.md content for completeness
- [ ] Add concrete examples to SKILL.md
- [ ] Ensure reference.md has substantial content (100+ lines)
- [ ] Ensure examples.md has copy-paste ready code
- [ ] Create placeholder scripts in scripts/ folders

### Specific Additions

**mdx-to-lexical**:
- [ ] Add Lexical node type examples to reference.md
- [ ] Add conversion examples (MDX → Lexical JSON)
- [ ] Reference existing `scripts/migration/lib/mdx-to-payload-blocks.ts`

**payload-schema-generator**:
- [ ] Add complete CollectionConfig example to examples.md
- [ ] Add field type examples (text, richText, blocks, group)
- [ ] Add relationship field examples

**migration-validator**:
- [ ] Add database query examples to checklist.md
- [ ] Add Playwright test examples
- [ ] Add field validation checks

**schema-drift-detector**:
- [ ] Document current API endpoints in reference.md
- [ ] Add expected field structure
- [ ] Add change detection algorithm

**validation-manager**:
- [ ] Copy complete validator code to VALIDATOR-REFERENCE.md
- [ ] Add test case examples to TESTING.md
- [ ] Add usage examples from collection hooks

**Phase 5 Complete**: All supporting docs have substantial content

---

## ✅ Phase 6: Testing & Validation (30 minutes)

### YAML Validation
- [ ] For each skill, run:
  ```bash
  head -n 10 .claude/skills/*/SKILL.md
  ```
- [ ] Verify: All have opening `---` on line 1
- [ ] Verify: All have closing `---` before content
- [ ] Verify: All `name:` fields are lowercase-with-hyphens
- [ ] Verify: All `description:` fields exist
- [ ] Run:
  ```bash
  grep "^name:" .claude/skills/*/SKILL.md
  ```
- [ ] Check: All names match folder names
- [ ] Check: All names match pattern `[a-z0-9-]+`

### Description Length Check
- [ ] For each skill, run:
  ```bash
  grep "^description:" .claude/skills/*/SKILL.md | wc -c
  ```
- [ ] Verify: Each description < 1024 characters
- [ ] Verify: Each description includes "Use when..." clause

### File Structure Check
- [ ] Run verification script:
  ```bash
  for skill in skill-creator mdx-to-lexical payload-schema-generator migration-validator schema-drift-detector validation-manager; do
    echo "Checking $skill..."
    test -f ".claude/skills/$skill/SKILL.md" && echo "  ✓ SKILL.md" || echo "  ✗ MISSING"
  done
  ```
- [ ] Verify: All show ✓ checkmarks

### Content Check
- [ ] For each SKILL.md, verify:
  ```bash
  wc -l .claude/skills/*/SKILL.md
  ```
- [ ] Check: Each file is 100+ lines (substantial content)

### Skill Activation Testing
- [ ] Restart Claude Code
- [ ] Ask: "What skills are available?"
- [ ] Verify: All 6 skills appear in list

**Test Each Skill**:
- [ ] skill-creator: Ask "How do I create a new skill?"
- [ ] mdx-to-lexical: Ask "Convert MDX to Lexical format"
- [ ] payload-schema-generator: Ask "Generate a Payload schema"
- [ ] migration-validator: Ask "Validate my migration"
- [ ] schema-drift-detector: Ask "Check API schema changes"
- [ ] validation-manager: Ask "Update email validator"

**For each test**:
- [ ] Claude mentions the skill by name
- [ ] Claude follows skill instructions
- [ ] No errors in skill loading

**Phase 6 Complete**: All skills validated and activating

---

## 📊 Final Verification

### File Count Check
- [ ] Run:
  ```bash
  ls -1 docs/spec-kit/*.md | wc -l
  ```
- [ ] Verify: Shows 5 (Spec-Kit files)

- [ ] Run:
  ```bash
  ls -1d .claude/skills/*/ | wc -l
  ```
- [ ] Verify: Shows 6 (skill directories)

- [ ] Run:
  ```bash
  find .claude/skills -type f -name "SKILL.md" | wc -l
  ```
- [ ] Verify: Shows 6 (all SKILL.md files)

### Content Completeness
- [ ] Each Spec-Kit file is substantial (200+ lines minimum)
- [ ] Each SKILL.md has valid YAML frontmatter
- [ ] Each skill has supporting documentation
- [ ] Each skill has scripts/ directory (even if empty)

---

## 🎯 Success Criteria

**Project is complete when ALL of these are true**:

### Documentation
- [ ] 5 Spec-Kit files in `docs/spec-kit/`
- [ ] constitution.md: 200+ lines
- [ ] specify.md: 300+ lines
- [ ] plan.md: 400+ lines
- [ ] tasks.md: 26 tasks documented
- [ ] meta-skill.md: 300+ lines

### Skills
- [ ] 6 skill directories in `.claude/skills/`
- [ ] All SKILL.md files have valid YAML
- [ ] All skill names follow format (lowercase-hyphens)
- [ ] All descriptions < 1024 chars
- [ ] All descriptions include "Use when..." triggers
- [ ] All skills have supporting docs (reference.md or examples.md)

### Functionality
- [ ] skill-creator activates on "How do I create a skill?"
- [ ] mdx-to-lexical activates on "Convert MDX content"
- [ ] payload-schema-generator activates on "Generate schema"
- [ ] migration-validator activates on "Validate migration"
- [ ] schema-drift-detector activates on "Check API changes"
- [ ] validation-manager activates on "Update validator"

### Git
- [ ] All files committed to git
- [ ] Commit message follows format
- [ ] Pushed to remote (optional)

---

## 🔄 Post-Execution

### Git Commit
- [ ] Stage all files:
  ```bash
  git add docs/spec-kit/
  git add .claude/skills/
  ```

- [ ] Verify staged files:
  ```bash
  git status
  ```

- [ ] Commit with proper message:
  ```bash
  git commit -m "feat: add Spec-Kit documentation and migration Skills

  - Created 5 Spec-Kit documents (constitution, specify, plan, tasks, meta-skill)
  - Created 6 project Skills for migration workflow
  - skill-creator: Meta-skill for generating new skills
  - mdx-to-lexical: MDX to Lexical JSON conversion
  - payload-schema-generator: Payload schema generation
  - migration-validator: Migration verification workflows
  - schema-drift-detector: API schema monitoring
  - validation-manager: Custom validator management

  All skills validated and tested. Templates provided for future skill creation.
  Skills available to all team members via git.
  "
  ```

- [ ] Push to remote:
  ```bash
  git push
  ```

### Team Notification
- [ ] Notify team of new skills
- [ ] Share documentation location
- [ ] Explain how to test skills
- [ ] Collect feedback

### Documentation Updates
- [ ] Add any issues encountered to 08-CRITICAL-LESSONS.md
- [ ] Update this checklist with improvements
- [ ] Document any YAML syntax issues found

---

## 🐛 Troubleshooting Checklist

### Skill Doesn't Activate

**Check these in order**:
1. [ ] YAML syntax valid (no tabs, proper indentation)
2. [ ] File path correct: `.claude/skills/skill-name/SKILL.md`
3. [ ] Filename is exactly `SKILL.md` (uppercase)
4. [ ] Description includes trigger words
5. [ ] Claude Code restarted after creating skill
6. [ ] Skill name matches directory name
7. [ ] No special characters in skill name

**Debug Commands**:
```bash
# View YAML frontmatter
head -n 10 .claude/skills/skill-name/SKILL.md

# Check for tabs (should return nothing)
cat .claude/skills/skill-name/SKILL.md | grep -P '\t'

# Verify file exists
ls -la .claude/skills/skill-name/SKILL.md
```

### YAML Syntax Error

**Common Issues**:
- [ ] Tabs instead of spaces (use spaces only)
- [ ] Missing colon after field name
- [ ] Unclosed quotes in description
- [ ] Missing opening or closing `---`
- [ ] Content before opening `---`
- [ ] Spaces before opening `---`

**Fix**:
1. Copy YAML from working example
2. Replace field values carefully
3. Use online YAML validator
4. Check with: `head -n 10 SKILL.md`

### Wrong File Path

**Common Mistakes**:
- [ ] `.claude/Skills/` (capital S) → should be `.claude/skills/`
- [ ] `skills/` (missing .claude/) → should be `.claude/skills/`
- [ ] `skill-name/skill.md` (lowercase) → should be `skill-name/SKILL.md`
- [ ] `skill_name/` (underscores) → should be `skill-name/` (hyphens)

---

## ⏱️ Time Tracking

**Track your actual time**:

- [ ] Phase 1 (Setup): ______ minutes
- [ ] Phase 2 (Spec-Kit): ______ minutes
- [ ] Phase 3 (Meta-Skill): ______ minutes
- [ ] Phase 4 (Skills Gen): ______ minutes
- [ ] Phase 5 (Supporting Docs): ______ minutes
- [ ] Phase 6 (Testing): ______ minutes
- [ ] **Total**: ______ minutes

**Expected**: 3-4 hours (180-240 minutes)

---

## 🎉 Completion

**When all checkboxes are checked**:

✅ **Project Complete!**

You have successfully:
- Created 5 comprehensive Spec-Kit documents
- Created 6 functional project Skills
- Provided templates for future skill creation
- Validated all YAML and file structures
- Tested skill activation
- Committed to git

**Next Steps**:
- Use skills to fix 11 failed provider migrations
- Use skills to migrate electricity-rates collection
- Share skills with team
- Collect feedback and iterate

---

**Reference**: See [00-INDEX.md](00-INDEX.md) for full documentation navigation
