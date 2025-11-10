import { CollectionConfig } from 'payload/types'

/**
 * FAQs Collection
 *
 * Reusable FAQ entries with schema.org/FAQPage support
 * Generated on 2025-10-23T14:06:30.355Z
 */

export const FAQs: CollectionConfig = {
  slug: 'faqs',
  admin: {
    useAsTitle: 'question',
    defaultColumns: ['question', 'category', 'updatedAt'],
    description: 'Reusable FAQ entries for content'
  },
  fields: [
    {
      name: 'question',
      type: 'text',
      required: true,
      admin: {
        description: 'The FAQ question'
      }
    },
    {
      name: 'answer',
      type: 'richText',
      required: true,
      admin: {
        description: 'The answer (supports rich text formatting)'
      }
    },
    {
      name: 'category',
      type: 'select',
      options: [
        { label: 'Electricity Providers', value: 'providers' },
        { label: 'Rates & Plans', value: 'rates' },
        { label: 'Billing', value: 'billing' },
        { label: 'General', value: 'general' }
      ],
      admin: {
        description: 'Category for organizing FAQs'
      }
    },
    {
      name: 'slug',
      type: 'text',
      required: true,
      unique: true,
      index: true,
      admin: {
        description: 'URL-friendly identifier'
      }
    },
    {
      name: 'relatedTopics',
      type: 'array',
      fields: [
        {
          name: 'topic',
          type: 'text'
        }
      ],
      admin: {
        description: 'Related topics/keywords for search'
      }
    }
  ],
  hooks: {
    beforeValidate: [
      // Auto-generate slug from question if not provided
      ({ data }) => {
        if (!data.slug && data.question) {
          data.slug = data.question
            .toLowerCase()
            .replace(/[^a-z0-9]+/g, '-')
            .replace(/^-|-$/g, '')
            .substring(0, 60)  // Limit length
        }
        return data
      }
    ]
  }
}
