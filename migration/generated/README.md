# Generated Payload Configuration

**Generated on**: 2025-10-23T14:06:30.360Z

## Files Generated

### Collections
- `collections/Providers.ts` - Main provider content collection
- `collections/Team.ts` - Team members (authors, editors, checkers)
- `collections/FAQs.ts` - Reusable FAQ entries

### Blocks
- `blocks/FaqBlock.ts` - FAQ display block
- `blocks/*Block.ts` - 34 component blocks

### Config
- `payload.config.snippet.ts` - Integration code for your project

## Integration Steps

### 1. Copy Generated Files to Your Project

```bash
# From migration directory
cp -r generated/collections/* /path/to/your/project/src/collections/
cp -r generated/blocks/* /path/to/your/project/src/lexical/blocks/
```

### 2. Update your payload.config.ts

See `payload.config.snippet.ts` for the imports and config additions.

### 3. Update Providers Collection to Include Blocks

Edit `src/collections/Providers.ts` and update the `contentBlocks` field:

```typescript
import { FaqBlock } from '../lexical/blocks/FaqBlock'
import { LowestRateDisplayBlock } from '../lexical/blocks/LowestRateDisplayBlock'
// ... import all other blocks

// In fields array:
{
  name: 'contentBlocks',
  type: 'blocks',
  blocks: [
    FaqBlock,
    LowestRateDisplayBlock,
    // ... all other blocks
  ]
}
```

### 4. Restart Payload

```bash
# Kill existing process
pkill -f "pnpm dev"

# Start fresh
pnpm dev
```

### 5. Verify in Admin UI

1. Navigate to http://localhost:3001/admin
2. Check that "Providers", "Team", and "FAQs" collections appear
3. Click "Create New" in Providers
4. Verify all fields render correctly
5. Try adding a block - FAQ Block should be available

## Field Mappings

### Providers Collection

- `title`: string (157/157 files)
- `wp_slug`: string (156/157 files)
- `wp_post_id`: number (156/157 files)
- `seo_meta_desc`: string (154/157 files)
- `draft`: boolean (157/157 files)
- `pubDate`: date | string (157/157 files)
- `updatedDate`: date (156/157 files)
- `wp_author`: string (156/157 files)
- `cp_hero_heading_line_1`: string (156/157 files)
- `cp_hero_heading_line_2`: string (155/157 files)
- `cp_hero_cta_text`: string (155/157 files)
- `seo_title`: string (129/157 files)
- `target_keyword`: string (93/157 files)
- `post_author_team_member_is`: array<string> (1/157 files)
- `post_editor_team_member_is`: array<string> (1/157 files)
- `post_checker_team_member_is`: array<string> (1/157 files)
- `description`: string (1/157 files)

### Relationships

- `parent` → Providers (self-referential)
- `post_author_team_member_is` → Team (hasMany)
- `post_editor_team_member_is` → Team (hasMany)
- `post_checker_team_member_is` → Team (hasMany)
- `heroImage` → Media

## Next Steps

After integration:

1. Run `deploy-to-target.mjs` to automate deployment
2. Run `test-target-payload.mjs` to verify with Playwright
3. Run `prepare-seed-data.mjs` to prepare MDX data
4. Run `seed-database.mjs` to populate collections

---

**Need Help?** See `COMPLETE-MIGRATION-GUIDE.md` for full documentation
