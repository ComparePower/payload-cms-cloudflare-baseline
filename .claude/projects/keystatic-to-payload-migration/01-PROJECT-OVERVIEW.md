# Project Overview: Keystatic → Payload CMS Migration

**Project Name**: Keystatic to Payload CMS Migration - Skills & Documentation
**Created**: 2025-10-24
**Status**: Ready for Execution
**Complexity**: High (multi-system migration with custom tooling)

---

## 🎯 Project Goals

### Primary Objective
Create comprehensive documentation and reusable Skills to support the ongoing migration from Keystatic CMS (Astro-based) to Payload CMS v3 (Next.js-based).

### What We're Building

**1. Spec-Kit Documentation (5 files)**
- Structured project documentation following GitHub's Spec-Kit methodology
- Captures migration principles, requirements, architecture, tasks
- Provides clear roadmap for remaining migration work

**2. Project Skills (6 skills)**
- Model-invoked capabilities that Claude automatically uses when relevant
- Codifies expertise in reusable, shareable form
- Accelerates future migration work and reduces errors

---

## 🏗️ Deliverables

### Deliverable 1: Spec-Kit Documentation

**Location**: `docs/spec-kit/`

**Files**:
1. **constitution.md** - Migration principles, quality gates, error handling standards
2. **specify.md** - Requirements specification with user stories and acceptance criteria
3. **plan.md** - Technical implementation plan with architecture diagrams
4. **tasks.md** - Detailed task breakdown (26 tasks across 6 phases)
5. **meta-skill.md** - Adaptive Skill Generator definition for emergent challenges

**Purpose**: Provide structured documentation that captures:
- Why decisions were made (constitution)
- What needs to be built (specify)
- How to build it (plan)
- Specific actions to take (tasks)
- How to handle unknowns (meta-skill)

### Deliverable 2: Project Skills

**Location**: `.claude/skills/`

**Skills**:

1. **skill-creator** (Meta-Skill)
   - Creates new Claude Code Skills following project conventions
   - Generates SKILL.md with validated YAML frontmatter
   - Sets up folder structure, templates, scripts
   - **Build this FIRST** - use it to create the other 5 skills

2. **mdx-to-lexical**
   - Converts Astro MDX content to Payload Lexical JSON format
   - Handles inline components, blocks, rich text
   - Supports component mapping (Astro → Payload)

3. **payload-schema-generator**
   - Generates Payload CMS collection schemas from frontmatter analysis
   - Discovers all fields (not just Astro schema)
   - Creates proper TypeScript CollectionConfig

4. **migration-validator**
   - Validates migration results with database queries
   - Checks field presence, data integrity
   - Runs automated UI tests with Playwright

5. **schema-drift-detector**
   - Monitors ComparePower API response structure
   - Detects when API changes (new/removed fields)
   - Auto-updates Payload schemas to match

6. **validation-manager**
   - Manages custom validators in `src/utilities/validators/`
   - Adds new validators, updates existing ones
   - Applies validators to collection hooks
   - Tests validation logic

---

## 🔍 Project Context

### The Migration

**SOURCE**:
- **System**: Astro + Keystatic CMS
- **Location**: `/Users/brad/_CODE_DEV_PROJECTS/cp-content-site-astro`
- **Format**: MDX files with YAML frontmatter
- **Collections**: providers (157 files), electricity-rates (896 files), others

**TARGET**:
- **System**: Payload CMS v3 + Next.js 15
- **Location**: `/Users/brad/_CODE_DEV_PROJECTS/cp-cms-payload-cms-mongo`
- **Format**: MongoDB documents with Lexical JSON rich text
- **Database**: MongoDB Atlas (via Doppler for connection string)
- **Port**: 3002 (dev server)

### Why This Project Exists

**Problem**: The migration is complex with many gotchas:
- MDX → Lexical JSON conversion is non-trivial
- Astro components don't map 1:1 to Payload blocks
- Field discovery must go beyond Astro schema
- Payload has specific requirements (_deleted, createdAt, updatedAt)
- MongoDB Atlas has notablescan enabled (requires indexes)

**Solution**: Create reusable Skills and documentation so:
- Future migrations are faster
- Errors don't repeat (lessons captured)
- Team members can contribute
- Knowledge isn't lost in conversation history

---

## 📊 Current Migration Status

**Progress**: 146/157 providers migrated (93% success rate)

**Successes**:
- ✅ MDX parsing and Lexical conversion working
- ✅ Inline block resolution functional
- ✅ Relationship resolution (ProviderMetadata → RichTextDataInstances → Providers)
- ✅ Slug generation (unique, path-based)
- ✅ Required metadata fields (_deleted, timestamps)

**Known Failures** (11 providers):
- ❌ Missing phone number inline blocks
- Slugs not found: 4change-phone, amigo-phone, cirro-phone, constellation-phone, direct-energy-phone, discount-power-phone, flagship-phone, frontier-phone-rc, frontier-phone, gexa-phone, green-mountain-phone

**Blockers**:
- Need to create missing inline blocks for phone numbers
- Then retry failed migrations

---

## 🎓 Key Concepts

### What are Skills?

**Skills** are model-invoked capabilities:
- Claude autonomously decides when to use them based on context
- Each Skill has a SKILL.md file with YAML frontmatter + Markdown instructions
- Skills can include scripts, templates, reference docs
- Project Skills (in `.claude/skills/`) are shared via git

**NOT like slash commands**:
- Slash commands: User explicitly types `/command` to invoke
- Skills: Claude automatically uses when relevant to the conversation

### What is Spec-Kit?

**Spec-Kit** is GitHub's methodology for structured project documentation:
1. **Constitution** - Guiding principles and standards
2. **Specify** - Requirements and user stories
3. **Plan** - Technical implementation approach
4. **Tasks** - Actionable breakdown
5. **Meta-Skill** - Handling emergent challenges

### What is the Validation System?

**Validation System** in `src/utilities/validators/`:
- **Field validators**: email, phone, URL, text, number, slug
- **Rich-text validators**: heading hierarchy, accessibility, link text quality
- Used in collection hooks (beforeValidate)
- Used in seed scripts (data sanitization)

---

## 🛠️ Technologies Involved

### CMS Platforms
- **Keystatic** - Git-based CMS for Astro (source)
- **Payload CMS v3** - Headless CMS for Next.js (target)

### Frameworks
- **Astro** - Static site generator (source)
- **Next.js 15** - React framework (target)

### Databases
- **MongoDB Atlas** - NoSQL database (target)
- **Drizzle ORM** - Type-safe ORM (Payload uses internally)

### Rich Text
- **MDX** - Markdown with JSX components (source)
- **Lexical** - Extensible rich text editor (target)
- Conversion: MDX → Lexical JSON

### Development Tools
- **Doppler** - Secrets manager (for MongoDB connection string)
- **TypeScript** - Type-safe JavaScript
- **pnpm** - Fast package manager
- **Playwright** - Browser automation for testing

---

## 👥 Stakeholders

**User**: Brad
- Project owner
- Runs ComparePower.com (Texas electricity comparison site)
- Needs migration completed for electricity rates and provider content

**Content**:
- 157 provider pages
- 896 electricity rate pages
- Additional collections (to be analyzed)

**Team**:
- Skills will be shared via git (project Skills)
- Future team members benefit from documented expertise

---

## 🎯 Success Criteria

### Documentation Success
✅ All 5 Spec-Kit files created in `docs/spec-kit/`
✅ Content is complete enough to execute remaining migration
✅ Principles captured in constitution
✅ Tasks are actionable and clear

### Skills Success
✅ All 6 Skills created in `.claude/skills/`
✅ Each skill has valid YAML frontmatter (name + description)
✅ skill-creator can generate new skills
✅ Skills activate automatically on relevant questions
✅ Scripts are functional and tested

### Migration Success (Post-Skills)
✅ 11 failed provider migrations fixed
✅ 157/157 providers successfully migrated (100%)
✅ All inline blocks resolved
✅ Admin UI functional for all records

---

## 🚧 Out of Scope

**NOT in this project**:
- ❌ Completing the full migration (electricity-rates, other collections)
- ❌ Fixing all migration bugs (just documenting approach)
- ❌ Deploying to production
- ❌ Frontend development
- ❌ Content review and editing

**IN this project**:
- ✅ Creating Skills and documentation
- ✅ Capturing lessons learned
- ✅ Providing templates for future work
- ✅ Fixing the 11 failed provider migrations

---

## 📚 Required Reading Before Execution

Before executing this project, read:
1. This document (01-PROJECT-OVERVIEW.md) - ✅ You're here!
2. [02-CURRENT-STATE.md](02-CURRENT-STATE.md) - Understand where we are now
3. [03-EXECUTION-PLAN.md](03-EXECUTION-PLAN.md) - Understand what to do
4. [08-CRITICAL-LESSONS.md](08-CRITICAL-LESSONS.md) - Avoid known pitfalls

Then reference as needed:
- 04-09 for detailed specifications
- templates/ for copy-paste starting points
- 10-EXECUTION-CHECKLIST.md for step-by-step execution

---

## ❓ Frequently Asked Questions

**Q: Why Skills instead of just scripts?**
A: Skills are discoverable, model-invoked, and compose automatically. Scripts require explicit invocation.

**Q: Why Spec-Kit methodology?**
A: Provides structured approach proven at scale (GitHub uses it). Better than ad-hoc documentation.

**Q: Why build skill-creator first?**
A: Dogfooding - use it to create the other 5 skills. Validates the approach and ensures consistency.

**Q: Can I skip reading all the docs?**
A: NO. This is complete documentation. Skipping leads to errors and missing context.

**Q: What if I have questions during execution?**
A: Check 08-CRITICAL-LESSONS.md first. Then ask user. Documentation should be complete.

---

## 📈 Timeline

**Estimated Duration**: 3-4 hours for complete execution

**Breakdown**:
- Create directory structures: 15 minutes
- Write Spec-Kit documentation: 60 minutes
- Create skill-creator (with templates): 45 minutes
- Use skill-creator to build 5 remaining skills: 45 minutes
- Write supporting docs (reference.md, examples.md): 30 minutes
- Testing and validation: 30 minutes

---

**Next**: Read [02-CURRENT-STATE.md](02-CURRENT-STATE.md) to understand exact current progress
