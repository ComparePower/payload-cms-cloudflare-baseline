/**
 * Display blocking error message for unhandled components
 *
 * Formats and displays a prominent error message when migration is blocked
 * by unhandled components. Includes actionable next steps and Admin UI link.
 *
 * @module display-blocking-error
 */

import type { UnhandledComponent } from './mdx-to-payload-blocks.js'

/**
 * Display formatted blocking error message
 *
 * Prints a prominent error box with:
 * - Count of unhandled components
 * - Top 5 components by usage count
 * - Clear next steps
 * - Direct link to Admin UI with filter applied
 *
 * @param components - Array of unhandled components sorted by usage count
 * @param adminUrl - Direct link to Admin UI (default: localhost:3003)
 *
 * @example
 * ```typescript
 * const unhandled = [
 *   { name: 'Section', usageCount: 6601, ... },
 *   { name: 'Image', usageCount: 5292, ... }
 * ]
 * displayBlockingError(unhandled)
 * ```
 */
export function displayBlockingError(
  components: UnhandledComponent[],
  adminUrl: string = 'http://localhost:3003/admin/component-registry?filter=blocking'
): void {
  const count = components.length
  const top5 = components.slice(0, 5)
  const remaining = count - 5

  console.error(`
╔════════════════════════════════════════════════════════════════╗
║                                                                ║
║   ❌  MIGRATION FAILED: ${count} unhandled component${count !== 1 ? 's' : ''} detected        ║
║                                                                ║
╚════════════════════════════════════════════════════════════════╝

The following components must be configured before migration can proceed:

${top5.map(c => `  - ${c.name} (${c.usageCount.toLocaleString()} use${c.usageCount !== 1 ? 's' : ''}, ${c.componentType})`).join('\n')}
${remaining > 0 ? `  ... and ${remaining} more\n` : ''}
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

📋 Next Steps:

1. Open: ${adminUrl}
2. Configure required fields for each component:
   - Set componentType ('block', 'inline', 'both')
   - Set canRenderBlock and canRenderInline flags
   - Implement Payload block type if needed
   - Update status to 'implemented' when complete
3. Save changes in Admin UI
4. Re-run this migration script

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

✨ Auto-Actions Completed:

  ✓ Generated TODO file: migration/COMPONENT-REGISTRATION-TODO.ts
  ✓ Updated component registry with unhandled components
  ✓ Marked components as isBlocking: true
  ✓ Updated migration status file

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
`)
}

/**
 * Display success message with summary statistics
 *
 * @param stats - Migration statistics
 */
export function displaySuccessMessage(stats: {
  total: number
  created: number
  failed: number
}): void {
  console.log(`
╔════════════════════════════════════════════════════════════════╗
║                                                                ║
║   ✅  MIGRATION COMPLETED SUCCESSFULLY                         ║
║                                                                ║
╚════════════════════════════════════════════════════════════════╝

📊 Summary:
  Total: ${stats.total}
  Created: ${stats.created}
  Failed: ${stats.failed}

✨ All components are properly configured!
`)
}
