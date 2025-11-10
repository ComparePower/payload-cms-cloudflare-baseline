# Keystatic → Payload CMS Migration Project Documentation

**Project**: Create Spec-Kit Documentation + 6 Migration Skills
**Status**: Ready for Execution
**Last Updated**: 2025-10-24
**Agent Context**: Complete - No prior knowledge required

---

## 📚 Documentation Index

This documentation provides COMPLETE context for executing the Keystatic→Payload CMS migration project. An agent can read these files and execute the plan without any additional information.

### Core Documentation (Read in Order)

1. **[01-PROJECT-OVERVIEW.md](01-PROJECT-OVERVIEW.md)**
   - What we're building and why
   - High-level goals and deliverables
   - Project scope and boundaries

2. **[02-CURRENT-STATE.md](02-CURRENT-STATE.md)**
   - Exact snapshot of current progress
   - Migration status: 146/157 providers (93%)
   - Known failures and blockers
   - Existing codebase structure

3. **[03-EXECUTION-PLAN.md](03-EXECUTION-PLAN.md)**
   - Detailed step-by-step execution plan
   - Order of operations (skill-creator first!)
   - Dependencies and prerequisites
   - Testing strategy

4. **[04-SPEC-KIT-CONTENT.md](04-SPEC-KIT-CONTENT.md)**
   - Complete content for 5 Spec-Kit documents
   - constitution.md, specify.md, plan.md, tasks.md, meta-skill.md
   - Ready to copy-paste into files

5. **[05-SKILL-SPECIFICATIONS.md](05-SKILL-SPECIFICATIONS.md)**
   - Complete specifications for all 6 Skills
   - SKILL.md content for each
   - Supporting files (reference.md, examples.md)
   - Script specifications

### Reference Documentation

6. **[06-MIGRATION-CONTEXT.md](06-MIGRATION-CONTEXT.md)**
   - Critical knowledge from CLAUDE.md
   - Payload CMS baseline configuration
   - Project structure and architecture
   - Commands and workflows

7. **[07-VALIDATION-SYSTEM.md](07-VALIDATION-SYSTEM.md)**
   - Complete documentation of custom validators
   - Field validators (email, phone, URL, text, number, slug)
   - Rich-text validators (heading hierarchy, accessibility)
   - Code examples and usage patterns

8. **[08-CRITICAL-LESSONS.md](08-CRITICAL-LESSONS.md)**
   - Errors discovered and fixed
   - `_deleted` vs `deletedAt` confusion
   - MongoDB Atlas notablescan issues
   - Purge script pagination bug
   - Important gotchas and pitfalls

9. **[09-FILE-STRUCTURES.md](09-FILE-STRUCTURES.md)**
   - Exact directory trees to create
   - File naming conventions
   - Folder organization
   - Where to put scripts

### Templates & Examples

10. **[templates/](templates/)**
    - **[skill-basic.md](templates/skill-basic.md)** - Simple single-file skill
    - **[skill-scripts.md](templates/skill-scripts.md)** - Skill with scripts
    - **[skill-multifile.md](templates/skill-multifile.md)** - Complex multi-file skill
    - **[SKILL-yaml-examples.md](templates/SKILL-yaml-examples.md)** - YAML frontmatter examples

### Execution Guide

11. **[10-EXECUTION-CHECKLIST.md](10-EXECUTION-CHECKLIST.md)**
    - Step-by-step execution checklist
    - Validation steps after each phase
    - Common troubleshooting
    - Success criteria

---

## 🚀 Quick Start for New Agent

**If you're an agent executing this project, follow these steps:**

1. **Read in order**: 01 → 02 → 03 (understand context)
2. **Reference as needed**: 04-09 (detailed specs)
3. **Use templates**: templates/ folder (copy-paste starting points)
4. **Execute**: Follow 10-EXECUTION-CHECKLIST.md
5. **Validate**: Test each skill after creation

---

## 📊 Project Deliverables

### 1. Spec-Kit Documentation (5 files)
- `docs/spec-kit/constitution.md`
- `docs/spec-kit/specify.md`
- `docs/spec-kit/plan.md`
- `docs/spec-kit/tasks.md`
- `docs/spec-kit/meta-skill.md`

### 2. Project Skills (6 skills)
- `.claude/skills/skill-creator/` - Meta-skill for creating new skills
- `.claude/skills/mdx-to-lexical/` - MDX→Lexical conversion
- `.claude/skills/payload-schema-generator/` - Schema generation
- `.claude/skills/migration-validator/` - Verification workflows
- `.claude/skills/schema-drift-detector/` - API monitoring
- `.claude/skills/validation-manager/` - Custom validators management

---

## ⚠️ Critical Requirements

**MUST READ BEFORE EXECUTING:**

1. **Skill Naming**: lowercase-with-hyphens-only (max 64 chars)
2. **Description Field**: Must include BOTH what it does AND when to use it (max 1024 chars)
3. **YAML Frontmatter**: Must be valid YAML with `---` delimiters
4. **allowed-tools**: Restrict tool access for focused skills
5. **Execute skill-creator FIRST**: Use it to generate the other 5 skills

---

## 📖 How to Use This Documentation

### For Human Review
- Start with 01-PROJECT-OVERVIEW.md
- Skim 02-CURRENT-STATE.md for context
- Review 03-EXECUTION-PLAN.md for approach

### For Agent Execution
- Read 01-03 completely (no skipping!)
- Keep 04-09 open as reference
- Copy-paste from templates/
- Follow 10-EXECUTION-CHECKLIST.md exactly

### For Troubleshooting
- Check 08-CRITICAL-LESSONS.md first
- Verify against 09-FILE-STRUCTURES.md
- Review skill templates for format issues

---

## 🎯 Success Criteria

**You've successfully completed this project when:**

✅ All 5 Spec-Kit files created in `docs/spec-kit/`
✅ All 6 Skills created in `.claude/skills/`
✅ Each skill has valid YAML frontmatter
✅ skill-creator can generate new skills
✅ All skills activate on relevant questions
✅ Templates are reusable for future skills

---

## 📞 Key Contacts & Resources

**User**: Brad
**Project**: cp-cms-payload-cms-mongo
**Source**: cp-content-site-astro
**Database**: MongoDB Atlas (via Doppler)
**Port**: 3002 (dev server)

**Admin Credentials**:
- Email: brad@comparepower.com
- Password: deh2xjt1CHW_dmd.gxj

---

## 📝 Notes for Agent

- This documentation is COMPLETE - you have everything needed
- Don't assume anything - it's all written down
- Don't skip steps - follow checklist exactly
- Don't guess paths - they're all specified in 09-FILE-STRUCTURES.md
- Don't make up content - copy from 04-SPEC-KIT-CONTENT.md and 05-SKILL-SPECIFICATIONS.md
- DO ask questions if anything is unclear (it shouldn't be!)

---

**Ready to begin? Start with [01-PROJECT-OVERVIEW.md](01-PROJECT-OVERVIEW.md)**
