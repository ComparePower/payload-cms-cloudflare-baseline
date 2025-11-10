import { Block } from 'payload/types'

/**
 * FAQ Block
 *
 * Displays one or more FAQs with schema.org/FAQPage markup
 * Generated on 2025-10-23T14:06:30.355Z
 */

export const FaqBlock: Block = {
  slug: 'faqBlock',
  interfaceName: 'FaqBlockType',
  fields: [
    {
      name: 'faqs',
      type: 'relationship',
      relationTo: 'faqs',
      hasMany: true,
      required: true,
      admin: {
        description: 'Select one or more FAQs to display'
      }
    },
    {
      name: 'title',
      type: 'text',
      admin: {
        description: 'Optional title above FAQ section (e.g., "Frequently Asked Questions")'
      }
    },
    {
      name: 'showNumbers',
      type: 'checkbox',
      defaultValue: false,
      admin: {
        description: 'Show numbered list (1, 2, 3...)'
      }
    },
    {
      name: 'expandable',
      type: 'checkbox',
      defaultValue: true,
      admin: {
        description: 'Make FAQs collapsible/expandable (accordion style)'
      }
    },
    {
      name: 'includeSchema',
      type: 'checkbox',
      defaultValue: true,
      admin: {
        description: 'Include schema.org/FAQPage structured data for SEO'
      }
    }
  ]
}
